import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseService } from '../../backend/Firebase/FirebaseService';

export const BatteryService = {
  /**
   * Get current device battery level
   * @returns {Promise<number>} Battery level 0-100
   */
  getCurrentBatteryLevel: async () => {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const percentage = Math.round(batteryLevel * 100);
      // console.log($&);
      return percentage;
    } catch (error) {
      console.error('Error getting battery level:', error);
      return 100; // Default fallback
    }
  },

  /**
   * Get battery state (charging, full, etc.)
   * @returns {Promise<number>} Battery state
   */
  getBatteryState: async () => {
    try {
      const state = await Battery.getBatteryStateAsync();
      return state;
    } catch (error) {
      console.error('Error getting battery state:', error);
      return Battery.BatteryState.UNKNOWN;
    }
  },

  /**
   * Start monitoring battery and update Firebase
   * @param {string} userId - User's Firebase document ID
   * @returns {Function} Cleanup function to stop monitoring
   */
  startBatteryMonitoring: (userId) => {
    if (!userId) {
      console.warn('No userId provided for battery monitoring');
      return () => {};
    }

    // console.log($&);

    // Initial update
    BatteryService.updateBatteryInFirebase(userId);

    // Subscribe to battery level changes
    const subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      const percentage = Math.round(batteryLevel * 100);
      // console.log($&);
      BatteryService.updateBatteryInFirebase(userId, percentage);
    });

    // Also update every 5 minutes as backup
    const intervalId = setInterval(() => {
      // console.log($&);
      BatteryService.updateBatteryInFirebase(userId);
    }, 5 * 60 * 1000); // 5 minutes

    // Return cleanup function
    return () => {
      // console.log($&);
      subscription.remove();
      clearInterval(intervalId);
    };
  },

  /**
   * Update battery level in Firebase
   * @param {string} userId - User's Firebase document ID
   * @param {number} batteryLevel - Optional battery level (will fetch if not provided)
   * @returns {Promise<Object>} Result object
   */
  updateBatteryInFirebase: async (userId, batteryLevel = null) => {
    try {
      const level = batteryLevel !== null 
        ? batteryLevel 
        : await BatteryService.getCurrentBatteryLevel();
      
      // console.log($&);
      
      const result = await FirebaseService.updateUserBattery(userId, level);
      
      if (result.success) {
        // console.log($&);
        
        // Also update local AsyncStorage
        try {
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            const user = JSON.parse(userData);
            user.Battery = level;
            user.BatteryLastUpdated = new Date().toISOString();
            await AsyncStorage.setItem('userData', JSON.stringify(user));
            // console.log($&);
          }
        } catch (storageError) {
          console.warn('Error updating AsyncStorage:', storageError);
        }
      } else {
        console.error('Failed to update battery in Firebase:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error updating battery in Firebase:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get battery info for display
   * @returns {Promise<Object>} Battery info object
   */
  getBatteryInfo: async () => {
    try {
      const level = await BatteryService.getCurrentBatteryLevel();
      const state = await BatteryService.getBatteryState();
      
      return {
        level,
        isCharging: state === Battery.BatteryState.CHARGING,
        isFull: state === Battery.BatteryState.FULL,
        state
      };
    } catch (error) {
      console.error('Error getting battery info:', error);
      return {
        level: 100,
        isCharging: false,
        isFull: false,
        state: Battery.BatteryState.UNKNOWN
      };
    }
  }
};