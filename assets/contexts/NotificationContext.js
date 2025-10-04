import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration, Platform, AppState, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { FirebaseService } from '../../backend/Firebase/FirebaseService';

const NotificationContext = createContext();

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
  const [expoPushToken, setExpoPushToken] = useState('');
  
  const [activeChatRoomId, setActiveChatRoomId] = useState(null);
  const [shownNotifications, setShownNotifications] = useState(new Set());
  const [lastProcessedNotification, setLastProcessedNotification] = useState(null);

  const [currentWalkRequest, setCurrentWalkRequest] = useState(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);

  const unsubscribeNotifications = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const appStateRef = useRef(AppState.currentState);

  // Initialize the notification system
  useEffect(() => {
    initializeNotificationSystem();
    setupPushNotifications();
    
    const handleAppStateChange = (nextAppState) => {
      console.log('App state changed from', appStateRef.current, 'to', nextAppState);
      
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App resumed - notification system active');
      } else if (nextAppState.match(/inactive|background/)) {
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

  // Setup Expo Push Notifications
  const setupPushNotifications = async () => {
    try {
      // Register for push notifications
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        setExpoPushToken(token);
        console.log('✅ Expo Push Token:', token);
        
        // Store token in Firebase for this user
        const userPhone = userData?.phone || userData?.phoneNumber;
        if (userPhone) {
          await FirebaseService.updateUserPushToken(userPhone, token);
          console.log('✅ Push token saved to Firebase');
        }
      }

      // Listen for notifications when app is in foreground
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('📬 Notification received in foreground:', notification);
        handleIncomingPushNotification(notification);
      });

      // Listen for user tapping on notification
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👆 User tapped notification:', response);
        handleNotificationTap(response);
      });

    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  // Register for Expo Push Notifications
  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Permission Required', 'Push notifications permission is required to receive walk requests!');
        return null;
      }
      
      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.warn('⚠️ Project ID not found. Make sure your app.json has projectId configured.');
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })).data;
      
      console.log('📱 Device push token obtained:', token);
    } else {
      Alert.alert('Simulator Detected', 'Push notifications don\'t work on simulator. Use a physical device.');
      console.warn('⚠️ Must use physical device for Push Notifications');
    }

    return token;
  };

  // Handle incoming push notification (when app is open)
  const handleIncomingPushNotification = (notification) => {
    const data = notification.request.content.data;
    
    console.log('📨 Processing push notification:', data);

    if (data.type === 'walk_request') {
      const walkData = {
        requestId: data.requestId,
        walkFrom: data.walkFrom,
        walkTo: data.walkTo,
        time: data.time,
        partnerName: data.senderName,
        partnerInitials: data.senderInitials,
        senderPhone: data.senderPhone,
        currentTime: data.currentTime,
        meetupPoint: data.meetupPoint,
        preferredGender: data.preferredGender,
      };

      handleIncomingWalkRequest(walkData);
    }
  };

  // Handle when user taps on notification
  const handleNotificationTap = (response) => {
    const data = response.notification.request.content.data;
    
    if (data.type === 'walk_request') {
      console.log('User tapped walk request notification');
      // Navigate to walk request screen or show popup
      // You can add navigation logic here
    }
  };

  // Send walk request to nearby users
  const sendWalkRequest = async (walkData) => {
    try {
      console.log('🚀 Sending walk request:', walkData);
      
      const userPhone = userData?.phone || userData?.phoneNumber;
      if (!userPhone) {
        throw new Error('User not logged in');
      }

      // Get current user's info
      const currentUserData = await FirebaseService.getUserByPhone(userPhone);
      if (!currentUserData) {
        throw new Error('User data not found');
      }

      // Find nearby users (you'll need to implement this in FirebaseService)
      // For now, we'll get all users with push tokens
      const nearbyUsers = await FirebaseService.getNearbyUsersWithTokens(walkData.meetupPoint);
      
      console.log(`📍 Found ${nearbyUsers.length} nearby users`);

      if (nearbyUsers.length === 0) {
        Alert.alert('No Users Nearby', 'No users found nearby to send walk request.');
        return { success: false, error: 'No users nearby' };
      }

      // Prepare notification data
      const notificationData = {
        requestId: walkData.requestId || Math.random().toString(36).substring(7),
        type: 'walk_request',
        walkFrom: walkData.walkFrom,
        walkTo: walkData.walkTo,
        time: walkData.time,
        senderName: currentUserData.firstName + ' ' + currentUserData.lastName,
        senderInitials: (currentUserData.firstName[0] + currentUserData.lastName[0]).toUpperCase(),
        senderPhone: userPhone,
        currentTime: walkData.currentTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meetupPoint: walkData.meetupPoint || 'APB Campus',
        preferredGender: walkData.preferredGender || 'Any',
      };

      // Send push notification to each nearby user
      const sendPromises = nearbyUsers.map(async (user) => {
        if (!user.pushToken) {
          console.log(`⚠️ User ${user.phone} has no push token`);
          return null;
        }

        return await sendExpoPushNotification(
          user.pushToken,
          '🚶‍♂️ New Walk Request!',
          `${notificationData.senderName} wants to walk from ${walkData.walkFrom}`,
          notificationData
        );
      });

      const results = await Promise.all(sendPromises);
      const successCount = results.filter(r => r?.success).length;

      console.log(`✅ Sent ${successCount}/${nearbyUsers.length} walk requests successfully`);

      return { 
        success: true, 
        sentCount: successCount,
        totalUsers: nearbyUsers.length 
      };

    } catch (error) {
      console.error('💥 Error sending walk request:', error);
      return { success: false, error: error.message };
    }
  };

  // Send actual Expo push notification
  const sendExpoPushNotification = async (pushToken, title, body, data) => {
    const message = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      priority: 'high',
      channelId: 'default',
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (result.data && result.data.status === 'ok') {
        console.log('✅ Push notification sent successfully');
        return { success: true, result };
      } else {
        console.error('❌ Push notification failed:', result);
        return { success: false, error: result };
      }
    } catch (error) {
      console.error('💥 Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  };

  const handleIncomingWalkRequest = (walkData) => {
    console.log('📬 Received walk request:', walkData);
    
    // Play notification sound/vibration
    if (soundEnabled) {
      playNotificationByType('walk_request');
    }

    // Show the walk request popup
    setCurrentWalkRequest(walkData);
    setIsNotificationVisible(true);
  };

  const acceptWalkRequest = async () => {
    if (!currentWalkRequest) return;

    console.log('✅ Walk request accepted:', currentWalkRequest);
    
    try {
      // Notify the sender that request was accepted
      // You can implement this in FirebaseService
      await FirebaseService.acceptWalkRequest(
        currentWalkRequest.requestId,
        userData?.phone || userData?.phoneNumber,
        currentWalkRequest.senderPhone
      );

      Alert.alert(
        'Request Accepted! 🎉',
        `You've accepted the walk request from ${currentWalkRequest.partnerName}. They will be notified.`
      );

      setIsNotificationVisible(false);
      setCurrentWalkRequest(null);

    } catch (error) {
      console.error('Error accepting walk request:', error);
      Alert.alert('Error', 'Failed to accept walk request. Please try again.');
    }
  };

  const declineWalkRequest = async () => {
    if (!currentWalkRequest) return;

    console.log('❌ Walk request declined');
    
    try {
      // Optionally notify the sender
      await FirebaseService.declineWalkRequest(
        currentWalkRequest.requestId,
        userData?.phone || userData?.phoneNumber
      );

      setIsNotificationVisible(false);
      setCurrentWalkRequest(null);

    } catch (error) {
      console.error('Error declining walk request:', error);
      setIsNotificationVisible(false);
      setCurrentWalkRequest(null);
    }
  };

  // Load shown notifications from storage
  useEffect(() => {
    loadShownNotifications();
  }, []);

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
      
      const jsonValue = await AsyncStorage.getItem('userData');
      if (jsonValue) {
        const data = JSON.parse(jsonValue);
        setUserData(data);
        console.log('User data loaded for:', data.phone || data.phoneNumber);
        
        const soundPreference = await AsyncStorage.getItem('notificationSoundEnabled');
        if (soundPreference !== null) {
          setSoundEnabled(JSON.parse(soundPreference));
        }
        
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
    
    setNotifications(newNotifications || []);
    setUnreadCount(newUnreadCount || 0);
    
    if (changes && appStateRef.current === 'active') {
      const newUnreadNotifications = changes.filter(change => 
        change.type === 'new' && 
        change.notification &&
        !change.notification.read &&
        !shownNotifications.has(change.notification.id)
      );

      if (newUnreadNotifications.length > 0) {
        const mostRecent = newUnreadNotifications[0].notification;
        
        const enhancedNotification = {
          ...mostRecent,
          ...mostRecent.data,
          profilePicture: mostRecent.profilePicture || mostRecent.data?.profilePicture || null,
          senderName: mostRecent.senderName || mostRecent.data?.senderName || '',
          senderId: mostRecent.senderId || mostRecent.data?.senderId || '',
          location: mostRecent.location || mostRecent.data?.location || null,
          senderPhone: mostRecent.senderPhone || mostRecent.data?.senderPhone || null,
        };

        handleNewNotification(enhancedNotification);
      }
    }
  };

  const handleNewNotification = async (notification) => {
    try {
      console.log('Processing new notification:', notification.title);

      if (notification.type === 'chat_message' && 
          activeChatRoomId && 
          notification.chatRoomId === activeChatRoomId) {
        console.log('✅ User is already in the chat room. Marking as read.');
        await markNotificationAsRead(notification.id);
        return;
      }
      
      if (shownNotifications.has(notification.id) || notification.read) {
        console.log('Notification already processed, skipping');
        return;
      }

      if (soundEnabled) {
        await playNotificationByType(notification.type);
      }

      const shouldShowPopup = shouldShowNotificationPopup(notification);
      
      if (shouldShowPopup) {
        console.log('✅ Showing popup for notification:', notification.id);
        await markNotificationAsShown(notification.id);
        setActivePopup(notification);
      }

      setLastProcessedNotification(notification);
      
    } catch (error) {
      console.error('Error handling new notification:', error);
    }
  };

  const shouldShowNotificationPopup = (notification) => {
    const importantTypes = [
      'friend_request', 
      'friend_accepted', 
      'sos', 
      'sos_resolved', 
      'safety_request', 
      'chat_message',
      'walk_request',
      'walk_accepted'
    ];
    
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
    } catch (error) {
      console.error('Error marking notification as shown:', error);
    }
  };

  const playNotificationByType = async (type) => {
    if (!soundEnabled) return;

    try {
      if (Platform.OS === 'ios' && Platform.constants.model?.includes('Simulator')) {
        console.log('iOS Simulator - vibration not supported');
        return;
      }
      
      switch (type) {
        case 'walk_request':
          // Attention-grabbing pattern
          if (Platform.OS === 'ios') {
            Vibration.vibrate([0, 200, 100, 200, 100, 200]);
          } else {
            Vibration.vibrate([200, 100, 200, 100, 200], false);
          }
          break;
        case 'walk_accepted':
          // Happy confirmation pattern
          if (Platform.OS === 'ios') {
            Vibration.vibrate([0, 100, 50, 100, 50, 100]);
          } else {
            Vibration.vibrate([100, 50, 100, 50, 100], false);
          }
          break;
        case 'friend_request':
          if (Platform.OS === 'ios') {
            Vibration.vibrate([0, 150, 100, 150]);
          } else {
            Vibration.vibrate([150, 100, 150], false);
          }
          break;
        case 'sos':
        case 'safety_request':
          if (Platform.OS === 'ios') {
            Vibration.vibrate([0, 300, 100, 300, 100, 300]);
          } else {
            Vibration.vibrate([300, 100, 300, 100, 300], false);
          }
          break;
        default:
          Vibration.vibrate(200);
      }
    } catch (error) {
      console.log('Error playing notification pattern:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const result = await FirebaseService.markNotificationAsRead(notificationId);
      
      if (result.success) {
        setNotifications(prev => prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true, status: 'read' }
            : notification
        ));

        setUnreadCount(prev => Math.max(0, prev - 1));

        if (activePopup && activePopup.id === notificationId) {
          setActivePopup(null);
        }

        await markNotificationAsShown(notificationId);
        return { success: true };
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
      
      if (result.success) {
        setNotifications(prev => prev.map(notification => ({ 
          ...notification, 
          read: true, 
          status: 'read' 
        })));

        setUnreadCount(0);
        setActivePopup(null);

        const allNotificationIds = notifications.map(n => n.id);
        const newShownNotifications = new Set([...shownNotifications, ...allNotificationIds]);
        setShownNotifications(newShownNotifications);
        await saveShownNotifications(newShownNotifications);

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
      
      if (enabled && Device.isDevice) {
        Vibration.vibrate(200);
      }
    } catch (error) {
      console.error('Error saving sound preference:', error);
    }
  };

  const dismissPopup = () => {
    setActivePopup(null);
  };

  const setActiveChat = (chatId) => {
    setActiveChatRoomId(chatId);
  };

  const clearActiveChat = () => {
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
    }
    
    if (notificationListener.current) {
      Notifications.removeNotificationSubscription(notificationListener.current);
    }
    
    if (responseListener.current) {
      Notifications.removeNotificationSubscription(responseListener.current);
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
    expoPushToken,
    
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