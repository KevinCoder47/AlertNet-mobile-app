import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { Linking, Alert } from 'react-native';
import { SOSFirebaseService } from '../../backend/Firebase/SOSFirebaseService';
import { auth } from '../../backend/Firebase/FirebaseConfig';
import { getEmergencyContacts, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact } from '../../services/firestore';

export class SOSService {
  static async getEmergencyContacts() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('No authenticated user');
        return [];
      }
      return await getEmergencyContacts(currentUser.uid);
    } catch (error) {
      console.error('Error getting emergency contacts:', error);
      return [];
    }
  }

  /**
   * Gets the emergency contacts for a specific user, intended for use when scanning a QR code.
   * WARNING: THIS IS CURRENTLY INSECURE on the client-side. In a production environment,
   * this logic should be moved to a secure backend (like a Cloud Function) that first
   * verifies the associated SOS session is active before returning another user's sensitive data.
   * @param {string} userId The ID of the user whose contacts are being requested.
   * @returns {Promise<Array>} A promise that resolves to an array of emergency contacts.
   */
  static async getEmergencyContactsForUser(userId) {
    try {
      if (!userId) {
        console.warn('No user ID provided to getEmergencyContactsForUser');
        return [];
      }
      return await getEmergencyContacts(userId);
    } catch (error) {
      console.error(`Error getting emergency contacts for user ${userId}:`, error);
      return [];
    }
  }

  static async addEmergencyContact(contactData) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      return await addEmergencyContact(currentUser.uid, contactData);
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      throw error;
    }
  }

  static async updateEmergencyContact(contactId, updates) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      return await updateEmergencyContact(currentUser.uid, contactId, updates);
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      throw error;
    }
  }

  static async removeEmergencyContact(contactId) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      return await deleteEmergencyContact(currentUser.uid, contactId);
    } catch (error) {
      console.error('Error removing emergency contact:', error);
      throw error;
    }
  }

  static async checkLocationServices() {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return { enabled: false, error: 'Location services are disabled' };
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { enabled: false, error: 'Location permission denied' };
      }

      return { enabled: true };
    } catch (error) {
      return { enabled: false, error: error.message };
    }
  }

  static async getCurrentLocation() {
    try {
      const locationCheck = await this.checkLocationServices();
      if (!locationCheck.enabled) {
        throw new Error(locationCheck.error);
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  static async callPolice() {
    const POLICE_NUMBER = '0638184478';
    try {
        const phoneUrl = `tel:${POLICE_NUMBER}`;
        const canOpen = await Linking.canOpenURL(phoneUrl);
        if (canOpen) {
            await Linking.openURL(phoneUrl);
            return { success: true, number: POLICE_NUMBER };
        } else {
            // Don't show alert here, just return the error
            console.warn('SOS Service: Unable to make phone calls on this device.');
            return { success: false, error: 'Device cannot make calls' };
        }
    } catch (error) {
        console.error('SOS Service: Error making phone call:', error);
        return { success: false, error: error.message };
    }
  }

  /**
   * Initiates the SOS sequence.
   * This function is designed to be fast. It creates the SOS session,
   * then triggers the notification dispatch in the background.
   * @param {string} triggeredBy - The source of the SOS trigger (e.g., 'manual', 'voice').
   * @returns {Promise<string>} The ID of the created SOS session.
   */
  static async initiateSOSSession(triggeredBy = 'manual') {
    console.log('SOS: Initiating session...');
    // 1. Get location first, as it's critical for all notifications.
    const location = await this.getCurrentLocation();

    // 2. Create the SOS session in Firestore to get a session ID. This is awaited.
    const sessionResult = await SOSFirebaseService.createSOSSession({
      triggeredBy,
      startTime: new Date(),
      location, // Store initial location in the session document.
    });

    if (!sessionResult.success || !sessionResult.sessionId) {
      throw new Error('Failed to create a valid SOS session. Cannot proceed.');
    }
    const sosSessionId = sessionResult.sessionId;
    console.log(`SOS: Session created with ID: ${sosSessionId}`);

    // 3. Log the initial trigger event.
    await SOSFirebaseService.addLogToSOSSession(sosSessionId, `SOS triggered by ${triggeredBy} action.`);

    // 4. Dispatch all notifications in the background.
    // We DO NOT await this. This is "fire-and-forget".
    this.dispatchNotificationsInBackground(sosSessionId, location);
    console.log('SOS: Notification dispatch running in the background.');

    // 5. Return the session ID to the UI immediately.
    return sosSessionId;
  }

  /**
   * Runs the notification tasks in the background.
   * This includes calling police, sending SMS, and sending push notifications.
   * @param {string} sosSessionId - The ID of the active SOS session.
   * @param {object} location - The user's location coordinates.
   */
  static async dispatchNotificationsInBackground(sosSessionId, location) {
    console.log('SOS Background Task: Starting...');
    try {
      // Call police and log the event
      const policeCallResult = await this.callPolice();
      if (policeCallResult.success) {
        await SOSFirebaseService.addLogToSOSSession(sosSessionId, `Called Police (${policeCallResult.number})`, 'police_called');
      } else {
        await SOSFirebaseService.addLogToSOSSession(sosSessionId, `Failed to call police: ${policeCallResult.error}`, 'error');
      }

      // Get contacts and send SMS
      const contacts = await this.getEmergencyContacts();
      if (contacts.length > 0) {
        await this.sendSMSToContacts(contacts, location, sosSessionId);
      } else {
        await SOSFirebaseService.addLogToSOSSession(sosSessionId, 'No SMS emergency contacts found.', 'warning');
      }

      // Send push notifications to app friends
      await SOSFirebaseService.sendSOSNotifications(location, null, sosSessionId);

      console.log('SOS Background Task: Completed.');
    } catch (error) {
      console.error('SOS Background Task: A critical error occurred:', error);
      await SOSFirebaseService.addLogToSOSSession(sosSessionId, `A critical error occurred during notification dispatch: ${error.message}`, 'critical_error');
    }
  }

  /**
   * Helper method to send SMS messages to a list of contacts.
   * @param {Array} contacts - The emergency contacts.
   * @param {object} location - The user's location.
   * @param {string} sosSessionId - The active SOS session ID for logging.
   */
  static async sendSMSToContacts(contacts, location, sosSessionId) {
    try {
      const locationText = location
        ? `My location: https://maps.google.com/?q=${location.latitude},${location.longitude}`
        : 'Location unavailable';

      const message = `🚨 EMERGENCY ALERT 🚨\n\nI need immediate help! Please contact me or emergency services.\n\n${locationText}\n\nSent from AlertNet Safety App`;
      const phoneNumbers = contacts.map(contact => contact.phoneNumber);

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(phoneNumbers, message);
        console.log(`SOS Background Task: SMS sent to ${contacts.length} emergency contacts.`);
        // Log each SMS contact notification individually
        for (const contact of contacts) {
          await SOSFirebaseService.addLogToSOSSession(
            sosSessionId,
            `Sent SMS to contact: "${contact.name}"`,
            'sms_sent',
            { contactName: contact.name, contactPhone: contact.phoneNumber }
          );
        }
      } else {
        console.warn('SOS Background Task: SMS not available on this device.');
        await SOSFirebaseService.addLogToSOSSession(sosSessionId, 'SMS not available on this device', 'error');
      }
    } catch (smsError) {
      console.error('SOS Background Task: SMS Error:', smsError);
      await SOSFirebaseService.addLogToSOSSession(sosSessionId, `SMS to contacts failed: ${smsError.message}`, 'error');
    }
  }

  // This function is deprecated and replaced by the new flow.
  // I'm keeping it here but commenting it out in case you need to reference the old logic.
  /*
  static async sendEmergencyNotifications(triggeredBy = 'manual') {
    // ... old monolithic code was here ...
  }
  */

  static async testEmergencyNotifications() {
    try {
      const contacts = await this.getEmergencyContacts();
      const location = await this.getCurrentLocation();
      
      // Test SMS contacts
      let smsTestResult = null;
      if (contacts.length > 0) {
        const locationText = location 
          ? `My location: https://maps.google.com/?q=${location.latitude},${location.longitude}`
          : 'Location unavailable';

        const message = `🚨 TEST EMERGENCY ALERT 🚨\n\nThis is a test message. I need immediate help! Please contact me or emergency services.\n\n${locationText}\n\nSent from AlertNet Safety App`;

        smsTestResult = {
          contactsFound: contacts.length,
          contacts: contacts.map(c => ({ name: c.name, phone: c.phoneNumber })),
          message: message
        };
      }

      // Test app friends notifications (without actually sending)
      let appFriendsTestResult = null;
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Use the same method as Home.js to get user data, ensuring consistency
          const userDoc = await getUserDocument(currentUser.uid);
          const friends = userDoc?.friends || [];

          const friendIds = friends.map(friend => 
            typeof friend === 'string' ? friend : friend.uid || friend.id
          ).filter(id => id);
          
          if (friendIds.length > 0) {
            const friendTokens = await SOSFirebaseService.getFriendsNotificationData(friendIds);
            appFriendsTestResult = {
              totalFriends: friendIds.length,
              friendsWithTokens: friendTokens.length,
              friends: friendTokens.map(f => ({ name: f.name, hasToken: !!f.token }))
            };
          }
        }
      } catch (error) {
        console.error('Error testing app friends:', error);
      }

      if (!smsTestResult && !appFriendsTestResult) {
        throw new Error('No emergency contacts or app friends found');
      }

      return { 
        success: true, 
        location: location,
        smsTest: smsTestResult,
        appFriendsTest: appFriendsTestResult,
        isTest: true
      };
    } catch (error) {
      console.error('Error testing emergency notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Initialize FCM for the current user
  static async initializeFCM(userId) {
    try {
      if (!userId) {
        console.warn('No user ID provided for FCM initialization');
        return null;
      }

      const token = await SOSFirebaseService.initializeFCM(userId);
      if (token) {
        console.log('FCM initialized successfully');
      }
      return token;
    } catch (error) {
      console.error('Error initializing FCM:', error);
      return null;
    }
  }

  // Set up notification listeners
  static setupNotificationListeners() {
    return SOSFirebaseService.setupNotificationListener();
  }

  // Remove notification listeners
  static removeNotificationListeners(listeners) {
    SOSFirebaseService.removeNotificationListeners(listeners);
  }
}