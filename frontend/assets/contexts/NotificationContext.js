// NotificationContext.js - Vibration-only solution (most reliable)
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration, Platform } from 'react-native';
import { FirebaseService } from '../../backend/Firebase/FirebaseService';
import { SafeAreaView } from 'react-native-safe-area-context';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userData, setUserData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Refs for cleanup
  const unsubscribeNotifications = useRef(null);

  // Initialize the notification system
  useEffect(() => {
    initializeNotificationSystem();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeNotificationSystem = async () => {
    try {
      console.log('🔔 Initializing notification system...');
      
      // Load user data
      const jsonValue = await AsyncStorage.getItem('userData');
      if (jsonValue) {
        const data = JSON.parse(jsonValue);
        setUserData(data);
        console.log('📱 User data loaded for:', data.phone || data.phoneNumber);
        
        // Load sound preferences
        const soundPreference = await AsyncStorage.getItem('notificationSoundEnabled');
        if (soundPreference !== null) {
          setSoundEnabled(JSON.parse(soundPreference));
        }
        
        // Set up notification listeners
        if (data.phone || data.phoneNumber) {
          const userPhone = data.phone || data.phoneNumber;
          setupNotificationListener(userPhone);
        }
      }
      
      setIsInitialized(true);
      console.log('✅ Notification system initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing notification system:', error);
      setIsInitialized(true);
    }
  };

  const setupNotificationListener = (userPhone) => {
    console.log('🔔 Setting up notification listeners for:', userPhone);
    
    unsubscribeNotifications.current = FirebaseService.listenToNotifications(
      userPhone,
      handleNotificationUpdate
    );
  };

  const handleNotificationUpdate = (data) => {
    const { 
      notifications: newNotifications, 
      changes, 
      unreadCount: newUnreadCount, 
      error 
    } = data;
    
    if (error) {
      console.error('Notification listener error:', error);
      return;
    }
    
    // Update state
    setNotifications(newNotifications || []);
    setUnreadCount(newUnreadCount || 0);
    
    // Handle new notifications
    changes?.forEach(change => {
      if (change.type === 'new') {
        handleNewNotification(change.notification);
      }
    });
  };

  const handleNewNotification = async (notification) => {
    console.log('📱 New notification received:', notification.title);
    
    // Play notification feedback if enabled
    if (soundEnabled) {
      await playNotificationByType(notification.type);
    }
  };

  const playNotificationSound = async () => {
    try {
      if (!soundEnabled) {
        console.log('🔇 Sound/vibration disabled by user');
        return;
      }

      console.log('🔊 Playing notification vibration on', Platform.OS);
      console.log('📱 Device info:', Platform.constants);
      
      if (Platform.OS === 'ios') {
        // iOS - check if running on simulator
        if (Platform.constants.systemName === 'iOS' && Platform.constants.model?.includes('Simulator')) {
          console.log('⚠️ Running on iOS Simulator - vibration not supported');
          // Visual feedback as fallback
          console.log('💥 NOTIFICATION RECEIVED - VIBRATION WOULD HAPPEN HERE');
        } else {
          // Real iOS device
          Vibration.vibrate([0, 200, 100, 200]);
          console.log('✅ iOS vibration triggered');
        }
      } else {
        // Android
        Vibration.vibrate(400);
        console.log('✅ Android vibration triggered');
      }
      
    } catch (error) {
      console.log('❌ Error with notification vibration:', error);
    }
  };

  // Different vibration patterns for different notification types
  const playNotificationByType = async (type) => {
    if (!soundEnabled) {
      console.log('🔇 Sound/vibration disabled by user');
      return;
    }

    try {
      console.log('🔊 Playing vibration for type:', type, 'on', Platform.OS);
      
      // Check if we're on iOS simulator
      if (Platform.OS === 'ios' && Platform.constants.model?.includes('Simulator')) {
        console.log('⚠️ iOS Simulator detected - vibration not supported');
        console.log(`💥 ${type.toUpperCase()} NOTIFICATION - VIBRATION WOULD HAPPEN HERE`);
        return;
      }
      
      switch (type) {
        case 'friend_request':
          // Double pulse - gentle notification
          if (Platform.OS === 'ios') {
            Vibration.vibrate([0, 150, 100, 150]);
          } else {
            // Android - force vibration even in sound mode
            Vibration.vibrate([150, 100, 150], false); // false = don't repeat
          }
          break;
        case 'friend_accepted':
          // Happy triple pulse
          if (Platform.OS === 'ios') {
            Vibration.vibrate([0, 100, 50, 100, 50, 100]);
          } else {
            Vibration.vibrate([100, 50, 100, 50, 100], false);
          }
          break;
        case 'sos':
          // Urgent pattern - long and attention-grabbing
          if (Platform.OS === 'ios') {
            Vibration.vibrate([0, 300, 100, 300, 100, 300]);
          } else {
            Vibration.vibrate([300, 100, 300, 100, 300], false);
          }
          break;
        case 'message':
          // Quick double tap
          if (Platform.OS === 'ios') {
            Vibration.vibrate([0, 80, 80, 80]);
          } else {
            Vibration.vibrate([80, 80, 80], false);
          }
          break;
        default:
          // Standard notification
          Vibration.vibrate(200);
      }
      
      console.log(`✅ ${type} vibration pattern triggered successfully`);
      
    } catch (error) {
      console.log('❌ Error playing notification pattern:', error);
      // Fallback to simple vibration
      try {
        Vibration.vibrate(200);
        console.log('✅ Fallback vibration triggered');
      } catch (fallbackError) {
        console.log('❌ Even fallback vibration failed:', fallbackError);
      }
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const result = await FirebaseService.markNotificationAsRead(notificationId);
      if (!result.success) {
        console.error('Failed to mark notification as read:', result.error);
      }
      return result;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const userPhone = userData?.phone || userData?.phoneNumber;
      if (!userPhone) {
        throw new Error('User phone number not found');
      }

      const result = await FirebaseService.markAllNotificationsAsRead(userPhone);
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      const userPhone = userData?.phone || userData?.phoneNumber;
      if (!userPhone) {
        throw new Error('User phone number not found');
      }

      const result = await FirebaseService.acceptFriendRequest(requestId, userPhone);
      return result;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return { success: false, error: error.message };
    }
  };

  const declineFriendRequest = async (requestId) => {
    try {
      const userPhone = userData?.phone || userData?.phoneNumber;
      if (!userPhone) {
        throw new Error('User phone number not found');
      }

      const result = await FirebaseService.declineFriendRequest(requestId, userPhone);
      return result;
    } catch (error) {
      console.error('Error declining friend request:', error);
      return { success: false, error: error.message };
    }
  };

  const toggleSoundEnabled = async (enabled) => {
    try {
      setSoundEnabled(enabled);
      await AsyncStorage.setItem('notificationSoundEnabled', JSON.stringify(enabled));
      
      // Test vibration when toggling on
      if (enabled) {
        console.log('🔊 Testing vibration...', 'Platform:', Platform.OS);
        console.log('📱 Device model:', Platform.constants.model);
        console.log('📱 System name:', Platform.constants.systemName);
        
        // Check for simulator
        if (Platform.OS === 'ios' && Platform.constants.model?.includes('Simulator')) {
          console.log('⚠️ iOS Simulator detected - no vibration available');
          console.log('💥 TEST VIBRATION - WOULD VIBRATE ON REAL DEVICE');
        } else {
          Vibration.vibrate(200); // Quick test vibration
          console.log('✅ Test vibration sent to device');
        }
      } else {
        console.log('🔇 Vibration disabled');
      }
    } catch (error) {
      console.error('Error saving sound preference:', error);
    }
  };

  const getNotificationById = (notificationId) => {
    return notifications.find(notification => notification.id === notificationId);
  };

  const getUnreadNotifications = () => {
    return notifications.filter(notification => !notification.read);
  };

  const getNotificationsByType = (type) => {
    return notifications.filter(notification => notification.type === type);
  };

  const clearAllNotifications = async () => {
    try {
      const userPhone = userData?.phone || userData?.phoneNumber;
      if (!userPhone) {
        throw new Error('User phone number not found');
      }

      const result = await FirebaseService.clearAllNotifications(userPhone);
      return result;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return { success: false, error: error.message };
    }
  };


  const cleanup = () => {
    console.log('🧹 Cleaning up notification system...');
    if (unsubscribeNotifications.current) {
      unsubscribeNotifications.current();
    }
  };

  const contextValue = {
    // State
    notifications,
    unreadCount,
    userData,
    isInitialized,
    soundEnabled,
    
    // Actions
    markNotificationAsRead,
    markAllNotificationsAsRead,
    acceptFriendRequest,
    declineFriendRequest,
    toggleSoundEnabled,
    clearAllNotifications,
    
    // Utilities
    getNotificationById,
    getUnreadNotifications,
    getNotificationsByType,
    playNotificationSound,
    playNotificationByType, // Different patterns for different types
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};