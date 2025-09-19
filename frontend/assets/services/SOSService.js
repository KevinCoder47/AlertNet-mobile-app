import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { Linking, Alert } from 'react-native';
import { SOSFirebaseService } from '../../backend/Firebase/SOSFirebaseService';
import { auth } from '../../backend/Firebase/FirebaseConfig';
import { getEmergencyContacts, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact } from '../../services/firestore';

class SOSService {
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

  static async sendEmergencyNotifications(triggeredBy = 'manual') {
    let sosSessionId = null;
    let totalNotified = 0;
    let smsNotified = 0;
    let appFriendsNotified = 0;
    let errors = [];

    try {
      // 1. Create an SOS Session to track this event
      const sessionResult = await SOSFirebaseService.createSOSSession({
        triggeredBy,
        startTime: new Date(),
      });

      if (!sessionResult.success) {
        // This is a critical failure, we cannot proceed.
        throw new Error('Failed to create SOS session.');
      }
      sosSessionId = sessionResult.sessionId;
      await SOSFirebaseService.addLogToSOSSession(sosSessionId, `SOS triggered by ${triggeredBy} action.`);

      // 2. Call police and log the event
      const policeCallResult = await this.callPolice();
      if (policeCallResult.success) {
        await SOSFirebaseService.addLogToSOSSession(sosSessionId, `Called Police (${policeCallResult.number})`, 'police_called');
      } else {
        await SOSFirebaseService.addLogToSOSSession(sosSessionId, `Failed to call police: ${policeCallResult.error}`, 'error');
        errors.push(`Police call failed: ${policeCallResult.error}`);
      }

      const contacts = await this.getEmergencyContacts();
      const location = await this.getCurrentLocation();

      // Send SMS to emergency contacts
      if (contacts.length > 0) {
        const locationText = location 
          ? `My location: https://maps.google.com/?q=${location.latitude},${location.longitude}`
          : 'Location unavailable';

        const message = `🚨 EMERGENCY ALERT 🚨\n\nI need immediate help! Please contact me or emergency services.\n\n${locationText}\n\nSent from AlertNet Safety App`;

        const phoneNumbers = contacts.map(contact => contact.phoneNumber);
        
        try {
          const isAvailable = await SMS.isAvailableAsync();
          if (isAvailable) {
            await SMS.sendSMSAsync(phoneNumbers, message);
            smsNotified = contacts.length;
            totalNotified += contacts.length;

            // Log each SMS contact notification individually
            for (const contact of contacts) {
              await SOSFirebaseService.addLogToSOSSession(
                sosSessionId, 
                `Sent SMS to contact: "${contact.name}"`, 
                'sms_sent', 
                { contactName: contact.name, contactPhone: contact.phoneNumber }
              );
            }

            console.log(`SMS sent to ${contacts.length} emergency contacts`);
          } else {
            errors.push('SMS not available on this device');
            await SOSFirebaseService.addLogToSOSSession(sosSessionId, 'SMS not available on this device', 'error');
          }
        } catch (smsError) {
          console.error('SMS Error:', smsError);
          errors.push(`SMS failed: ${smsError.message}`);
          await SOSFirebaseService.addLogToSOSSession(sosSessionId, `SMS to contacts failed: ${smsError.message}`, 'error');
        }
      }

      // Send push notifications to app friends via SOSFirebaseService
      try {
        const friendsResult = await SOSFirebaseService.sendSOSNotifications(location, null, sosSessionId);
        
        if (friendsResult.success) {
          appFriendsNotified = friendsResult.notificationsSent;
          totalNotified += friendsResult.notificationsSent;
          await SOSFirebaseService.addLogToSOSSession(sosSessionId, `Sent push notifications to ${appFriendsNotified} friends.`);
          console.log(`Firebase notifications sent to ${friendsResult.notificationsSent} friends`);
          
          // Log additional details
          if (friendsResult.totalFriends) {
            console.log(`Total friends: ${friendsResult.totalFriends}, Friends with tokens: ${friendsResult.friendsWithTokens}`);
          }
          
          if (friendsResult.errors) {
            errors.push(`Some friend notifications failed: ${friendsResult.errors.join(', ')}`);
            await SOSFirebaseService.addLogToSOSSession(sosSessionId, `Some friend notifications failed.`, 'error');
          }
        } else {
          const errorMsg = `App friends notification failed: ${friendsResult.error}`;
          errors.push(errorMsg);
          await SOSFirebaseService.addLogToSOSSession(sosSessionId, errorMsg, 'error');
        }
      } catch (firebaseError) {
        const errorMsg = `Firebase notification error: ${firebaseError.message}`;
        errors.push(errorMsg);
        console.error('Firebase Error:', firebaseError);
      }

      // Check if any notifications were sent
      if (totalNotified === 0) {
        errors.push('No contacts or friends found to notify.');
        await SOSFirebaseService.addLogToSOSSession(sosSessionId, 'No contacts or friends found to notify.', 'warning');
      }

      // Prepare success response
      const response = {
        success: true, 
        contactsNotified: totalNotified,
        smsContactsNotified: smsNotified,
        appFriendsNotified: appFriendsNotified,
        sosSessionId: sosSessionId, // Return the session ID
        triggeredBy,
        errors: errors.length > 0 ? errors : null
      };

      console.log('SOS Notification Summary:', response);
      return response;

    } catch (error) {
      console.error('CRITICAL Error sending emergency notifications:', error);
      return { 
        success: false, 
        error: error.message,
        sosSessionId: sosSessionId, // Return session ID even on failure, if it was created
        contactsNotified: 0,
        smsContactsNotified: 0,
        appFriendsNotified: 0
      };
    }
  }

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
        // Get friends list to test
        const currentUser = auth.currentUser;
        if (currentUser) {
          const friends = await SOSFirebaseService.getUserFriends(currentUser.uid);
          const friendIds = friends.map(friend => 
            typeof friend === 'string' ? friend : friend.uid || friend.id
          ).filter(id => id);
          
          if (friendIds.length > 0) {
            const friendTokens = await SOSFirebaseService.getFriendsTokens(friendIds);
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
  static async initializeFCM() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('No authenticated user for FCM initialization');
        return null;
      }

      const token = await SOSFirebaseService.initializeFCM(currentUser.uid);
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

export default SOSService;