import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { FirebaseService } from '../../backend/Firebase/FirebaseService';
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

  static async sendEmergencyNotifications(triggeredBy = 'manual') {
    try {
      const contacts = await this.getEmergencyContacts();
      const location = await this.getCurrentLocation();
      
      let totalNotified = 0;
      let errors = [];
      
      // Log the trigger method
      console.log(`SOS triggered by: ${triggeredBy}`);

      // Send SMS to emergency contacts
      if (contacts.length > 0) {
        const locationText = location 
          ? `My location: https://maps.google.com/?q=${location.latitude},${location.longitude}`
          : 'Location unavailable';

        const message = `🚨 EMERGENCY ALERT 🚨\n\nI need immediate help! Please contact me or emergency services.\n\n${locationText}\n\nSent from AlertNet Safety App`;

        const phoneNumbers = contacts.map(contact => contact.phoneNumber);
        
        const isAvailable = await SMS.isAvailableAsync();
        if (isAvailable) {
          await SMS.sendSMSAsync(phoneNumbers, message);
          totalNotified += contacts.length;
        } else {
          errors.push('SMS not available on this device');
        }
      }

      // Send notifications to Firebase friends
      const friendsResult = await FirebaseService.sendSOSNotifications(location);
      if (friendsResult.success) {
        totalNotified += friendsResult.notificationsSent;
      } else {
        errors.push(`Friends notification failed: ${friendsResult.error}`);
      }

      if (totalNotified === 0) {
        throw new Error('No contacts or friends found to notify');
      }

      return { 
        success: true, 
        contactsNotified: totalNotified,
        triggeredBy,
        errors: errors.length > 0 ? errors : null
      };
    } catch (error) {
      console.error('Error sending emergency notifications:', error);
      return { success: false, error: error.message };
    }
  }

  static async testEmergencyNotifications() {
    try {
      const contacts = await this.getEmergencyContacts();
      const location = await this.getCurrentLocation();
      
      if (contacts.length === 0) {
        throw new Error('No emergency contacts found');
      }

      const locationText = location 
        ? `My location: https://maps.google.com/?q=${location.latitude},${location.longitude}`
        : 'Location unavailable';

      const message = `🚨 TEST EMERGENCY ALERT 🚨\n\nThis is a test message. I need immediate help! Please contact me or emergency services.\n\n${locationText}\n\nSent from AlertNet Safety App`;

      // Simulate the process without actually sending SMS
      return { 
        success: true, 
        contactsNotified: contacts.length,
        contacts: contacts,
        location: location,
        message: message,
        isTest: true
      };
    } catch (error) {
      console.error('Error testing emergency notifications:', error);
      return { success: false, error: error.message };
    }
  }
}

export default SOSService;