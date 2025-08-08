import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SOSService {
  static async getEmergencyContacts() {
    try {
      const contacts = await AsyncStorage.getItem('emergencyContacts');
      return contacts ? JSON.parse(contacts) : [];
    } catch (error) {
      console.error('Error getting emergency contacts:', error);
      return [];
    }
  }

  static async saveEmergencyContacts(contacts) {
    try {
      await AsyncStorage.setItem('emergencyContacts', JSON.stringify(contacts));
    } catch (error) {
      console.error('Error saving emergency contacts:', error);
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

  static async sendEmergencyNotifications() {
    try {
      const contacts = await this.getEmergencyContacts();
      const location = await this.getCurrentLocation();
      
      if (contacts.length === 0) {
        throw new Error('No emergency contacts found');
      }

      const locationText = location 
        ? `My location: https://maps.google.com/?q=${location.latitude},${location.longitude}`
        : 'Location unavailable';

      const message = `🚨 EMERGENCY ALERT 🚨\n\nI need immediate help! Please contact me or emergency services.\n\n${locationText}\n\nSent from AlertNet Safety App`;

      const phoneNumbers = contacts.map(contact => contact.phoneNumber);
      
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(phoneNumbers, message);
        return { success: true, contactsNotified: contacts.length };
      } else {
        throw new Error('SMS not available on this device');
      }
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