import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration, Platform, AppState, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { FirebaseService } from '../../backend/Firebase/FirebaseService';

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
  const [activePopup, setActivePopup] = useState(null);
  
  const [activeChatRoomId, setActiveChatRoomId] = useState(null);
  // Track which notifications have been shown to prevent re-showing
  const [shownNotifications, setShownNotifications] = useState(new Set());
  const [lastProcessedNotification, setLastProcessedNotification] = useState(null);

  const [currentWalkRequest, setCurrentWalkRequest] = useState(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);

  // Refs for cleanup
  const unsubscribeNotifications = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Initialize the notification system
  useEffect(() => {
    initializeNotificationSystem();
    
    // Handle app state changes
    const handleAppStateChange = (nextAppState) => {
      console.log('App state changed from', appStateRef.current, 'to', nextAppState);
      
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        console.log('App resumed - notification system active');
      } else if (nextAppState.match(/inactive|background/)) {
        // App going to background - clear active popup
        if (activePopup) {
          console.log('App backgrounded - dismissing active popup');
          setActivePopup(null);
        }
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      cleanup();
      subscription?.remove();
    };
  }, []);
  // FCM listeners for walk requests
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FCM Message received:', remoteMessage);
      if (remoteMessage.data && remoteMessage.data.type === 'walk_request') {
        handleIncomingWalkRequest(JSON.parse(remoteMessage.data.walkData));
      }
    });

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background FCM Message:', remoteMessage);
      if (remoteMessage.data && remoteMessage.data.type === 'walk_request') {
        handleIncomingWalkRequest(JSON.parse(remoteMessage.data.walkData));
      }
    });

    return unsubscribe;
  }, []);

  const sendWalkRequest = async (walkData) => {
    try {
      console.log('Sending walk request:', walkData);
      const response = await fetch('https://your-backend.com/api/walk-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...walkData,
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).substring(7),
        }),
      });
      if (response.ok) {
        console.log('Walk request sent successfully');
      }
    } catch (error) {
      console.error('Error sending walk request:', error);
    }
  };

  const handleIncomingWalkRequest = (walkData) => {
    console.log('Received walk request:', walkData);
    setCurrentWalkRequest(walkData);
    setIsNotificationVisible(true);
  };

  const acceptWalkRequest = () => {
    console.log('Walk request accepted:', currentWalkRequest);
    Alert.alert('Request Accepted', `You've accepted the walk request from ${currentWalkRequest.partnerName}`);
    setIsNotificationVisible(false);
    setCurrentWalkRequest(null);
  };

  const declineWalkRequest = () => {
    console.log('Walk request declined');
    setIsNotificationVisible(false);
    setCurrentWalkRequest(null);
  };

  // Load shown notifications from storage
  useEffect(() => {
    loadShownNotifications();
  }, []);

  // Clean up shown notifications periodically
  useEffect(() => {
    if (notifications.length > 0) {
      cleanupShownNotifications();
    }
  }, [notifications]);

  const loadShownNotifications = async () => {
    try {
      const shownNotificationsJSON = await AsyncStorage.getItem('shownNotifications');
      if (shownNotificationsJSON) {
        const shownIds = JSON.parse(shownNotificationsJSON);
        setShownNotifications(new Set(shownIds));
        console.log(`Loaded ${shownIds.length} previously shown notification IDs`);
      }
    } catch (error) {
      console.error('Error loading shown notifications:', error);
    }
  };

  const saveShownNotifications = async (shownIds) => {
    try {
      await AsyncStorage.setItem('shownNotifications', JSON.stringify([...shownIds]));
    } catch (error) {
      console.error('Error saving shown notifications:', error);
    }
  };

  const cleanupShownNotifications = async () => {
    try {
      const currentNotificationIds = notifications.map(n => n.id);
      const validShownNotifications = [...shownNotifications].filter(id => 
        currentNotificationIds.includes(id)
      );

      if (validShownNotifications.length !== shownNotifications.size) {
        const newShownSet = new Set(validShownNotifications);
        setShownNotifications(newShownSet);
        await saveShownNotifications(newShownSet);
        console.log('Cleaned up shown notifications');
      }
    } catch (error) {
      console.error('Error cleaning up shown notifications:', error);
    }
  };

  const initializeNotificationSystem = async () => {
    try {
      console.log('Initializing notification system...');
      
      // Load user data
      const jsonValue = await AsyncStorage.getItem('userData');
      if (jsonValue) {
        const data = JSON.parse(jsonValue);
        setUserData(data);
        console.log('User data loaded for:', data.phone || data.phoneNumber);
        
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
      console.log('Notification system initialized successfully');
    } catch (error) {
      console.error('Error initializing notification system:', error);
      setIsInitialized(true);
    }
  };

  const setupNotificationListener = (userPhone) => {
    console.log('Setting up notification listeners for:', userPhone);
    
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
    
    // Process new notifications only if app is in foreground
    if (changes && appStateRef.current === 'active') {
      const newUnreadNotifications = changes.filter(change => 
        change.type === 'new' && 
        change.notification &&
        !change.notification.read &&
        !shownNotifications.has(change.notification.id)
      );

      if (newUnreadNotifications.length > 0) {
        // Process the most recent new notification
        const mostRecent = newUnreadNotifications[0].notification;

        const enhancedNotification = {
        ...mostRecent,
          // Make sure the profile picture is available at the top level for the popup
          profilePicture: mostRecent.data?.profilePicture || null,
          // Also ensure other data is accessible
          senderName: mostRecent.data?.senderName || '',
          senderId: mostRecent.data?.senderId || '',
          location: mostRecent.data?.location || null,
          senderPhone: mostRecent.data?.senderPhone || null,
        };

        handleNewNotification(enhancedNotification);
      }
    }
  };

  const handleNewNotification = async (notification) => {
    try {
      console.log('Processing new notification:', notification.title);

      // If the notification is a chat message and the user is already in that chat room,
      // mark it as read immediately and do not show a popup.
      if (notification.type === 'chat_message' && notification.data?.chatRoomId === activeChatRoomId) {
        console.log('User is already in the chat room. Marking notification as read and skipping popup.');
        // Mark as read so it doesn't show up as "new" later. The function already handles local state.
        await markNotificationAsRead(notification.id);
        return; // Exit early
      }
      
      // Skip if already processed or read
      if (shownNotifications.has(notification.id) || notification.read) {
        console.log('Notification already processed, skipping');
        return;
      }

      // Play notification feedback if enabled
      if (soundEnabled) {
        await playNotificationByType(notification.type);
      }

      // Determine if notification should show popup
      const shouldShowPopup = shouldShowNotificationPopup(notification);
      
      if (shouldShowPopup) {
        console.log('Showing popup for notification:', notification.id);
        await markNotificationAsShown(notification.id);
        setActivePopup(notification);
      } else {
        console.log('Notification does not require popup:', notification.type);
        await markNotificationAsShown(notification.id);
      }

      setLastProcessedNotification(notification);
      
    } catch (error) {
      console.error('Error handling new notification:', error);
    }
  };

  const shouldShowNotificationPopup = (notification) => {
    // Show popups for high-priority notifications and important types
    const importantTypes = ['friend_request', 'friend_accepted', 'sos', 'sos_resolved', 'safety_request', 'chat_message'];
    
    return (
      notification.priority === 'high' || 
      importantTypes.includes(notification.type) ||
      notification.isUrgent
    );
  };

  const markNotificationAsShown = async (notificationId) => {
    try {
      const newShownNotifications = new Set(shownNotifications);
      newShownNotifications.add(notificationId);
      setShownNotifications(newShownNotifications);
      await saveShownNotifications(newShownNotifications);
      console.log('Marked notification as shown:', notificationId);
    } catch (error) {
      console.error('Error marking notification as shown:', error);
    }
  };

  const playNotificationByType = async (type) => {
    if (!soundEnabled) {
      console.log('Sound/vibration disabled by user');
      return;
    }

    try {
      console.log('Playing vibration for type:', type, 'on', Platform.OS);
      
      // Check if we're on iOS simulator
      if (Platform.OS === 'ios' && Platform.constants.model?.includes('Simulator')) {
        console.log('iOS Simulator detected - vibration not supported');
        console.log(`${type.toUpperCase()} NOTIFICATION - VIBRATION WOULD HAPPEN HERE`);
        return;
      }
      
      switch (type) {
        case 'friend_request':
          // Double pulse - gentle notification
          if (Platform.OS === 'ios') {
            Vibration.vibrate([0, 150, 100, 150]);
          } else {
            Vibration.vibrate([150, 100, 150], false);
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
        case 'safety_request':
          // Urgent pattern - long and attention-grabbing
          if (Platform.OS === 'ios') {
            Vibration.vibrate([0, 300, 100, 300, 100, 300]);
          } else {
            Vibration.vibrate([300, 100, 300, 100, 300], false);
          }
          break;
        case 'sos_resolved':
          // Relief pattern - gentle but noticeable
          if (Platform.OS === 'ios') {
            Vibration.vibrate([0, 200, 50, 100]);
          } else {
            Vibration.vibrate([200, 50, 100], false);
          }
          break;
        default:
          // Standard notification
          Vibration.vibrate(200);
      }
      
      console.log(`${type} vibration pattern triggered successfully`);
      
    } catch (error) {
      console.log('Error playing notification pattern:', error);
      // Fallback to simple vibration
      try {
        Vibration.vibrate(200);
        console.log('Fallback vibration triggered');
      } catch (fallbackError) {
        console.log('Even fallback vibration failed:', fallbackError);
      }
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      
      const result = await FirebaseService.markNotificationAsRead(notificationId);
      
      if (result.success) {
        // Update local state immediately
        setNotifications(prev => prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true, status: 'read' }
            : notification
        ));

        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Clear active popup if this was the notification being displayed
        if (activePopup && activePopup.id === notificationId) {
          setActivePopup(null);
        }

        // Mark as shown to prevent future popups
        await markNotificationAsShown(notificationId);

        console.log('Notification marked as read successfully');
        return { success: true };
      } else {
        console.error('Failed to mark notification as read:', result.error);
        return result;
      }
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

      console.log('Marking all notifications as read');
      
      const result = await FirebaseService.markAllNotificationsAsRead(userPhone);
      
      if (result.success) {
        // Update local state
        setNotifications(prev => prev.map(notification => ({ 
          ...notification, 
          read: true, 
          status: 'read' 
        })));

        // Reset unread count
        setUnreadCount(0);

        // Clear active popup
        setActivePopup(null);

        // Mark all current notifications as shown
        const allNotificationIds = notifications.map(n => n.id);
        const newShownNotifications = new Set([...shownNotifications, ...allNotificationIds]);
        setShownNotifications(newShownNotifications);
        await saveShownNotifications(newShownNotifications);

        console.log(`Marked ${result.updatedCount || notifications.length} notifications as read`);
        return { success: true };
      }
      
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
        console.log('Testing vibration... Platform:', Platform.OS);
        console.log('Device model:', Platform.constants.model);
        console.log('System name:', Platform.constants.systemName);
        
        // Check for simulator
        if (Platform.OS === 'ios' && Platform.constants.model?.includes('Simulator')) {
          console.log('iOS Simulator detected - no vibration available');
          console.log('TEST VIBRATION - WOULD VIBRATE ON REAL DEVICE');
        } else {
          Vibration.vibrate(200); // Quick test vibration
          console.log('Test vibration sent to device');
        }
      } else {
        console.log('Vibration disabled');
      }
    } catch (error) {
      console.error('Error saving sound preference:', error);
    }
  };

  const dismissPopup = () => {
    console.log('Dismissing notification popup');
    setActivePopup(null);
  };

  const setActiveChat = (chatId) => {
    console.log(`Setting active chat room: ${chatId}`);
    setActiveChatRoomId(chatId);
  };

  const clearActiveChat = () => {
    console.log('Clearing active chat room.');
    setActiveChatRoomId(null);
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

      const result = await FirebaseService.clearAllNotifications?.(userPhone);
      return result || { success: false, error: 'Method not implemented' };
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return { success: false, error: error.message };
    }
  };

  const cleanup = () => {
    console.log('Cleaning up notification system...');
    if (unsubscribeNotifications.current) {
      unsubscribeNotifications.current();
      unsubscribeNotifications.current = null;
    }
  };

  const contextValue = {
    // State
    notifications,
    unreadCount,
    userData,
    isInitialized,
    soundEnabled,
    activePopup,
    
    // Actions
    markNotificationAsRead,
    markAllNotificationsAsRead,
    acceptFriendRequest,
    declineFriendRequest,
    toggleSoundEnabled,
    clearAllNotifications,
    dismissPopup,
    setActiveChat,
    clearActiveChat,
    
    // Utilities
    getNotificationById,
    getUnreadNotifications,
    getNotificationsByType,
    playNotificationByType,

    // Walk request features
    sendWalkRequest,
    currentWalkRequest,
    isNotificationVisible,
    acceptWalkRequest,
    declineWalkRequest,
    setIsNotificationVisible,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};