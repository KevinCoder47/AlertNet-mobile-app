import { collection, query, where, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../backend/Firebase/FirebaseConfig';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration, Platform, AppState, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { FirebaseService } from '../../backend/Firebase/FirebaseService';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

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

  const [acceptanceLoading, setAcceptanceLoading] = useState(false);
const [acceptedWalkRequest, setAcceptedWalkRequest] = useState(null);

  // Sound state for notification sounds
  const [sound, setSound] = useState(null);
  const [isSoundLoaded, setIsSoundLoaded] = useState(false);

  const unsubscribeNotifications = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const appStateRef = useRef(AppState.currentState);
  // Playback status update callback for notification sound
  const onPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      if (sound) {
        sound.unloadAsync();
        setSound(null);
        setIsSoundLoaded(false);
      }
    }
  };

  // Function to play notification sound based on type
  const playNotificationSound = async (type = 'walk_request') => {
    try {
      // console.log($&);
      
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      let soundFile;
      switch (type) {
        case 'walk_request':
          soundFile = require('../notification-sounds/walk_request.mp3');
          break;
        case 'walk_accepted':
          soundFile = require('../notification-sounds/walk_request.mp3');
          break;
        default:
          soundFile = require('../notification-sounds/walk_request.mp3');
      }

      // console.log($&);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        soundFile,
        { shouldPlay: true, volume: 0.8 },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsSoundLoaded(true);
      
      // console.log($&);

    } catch (error) {
      // console.error('🔊 Error playing notification sound:', error);
    }
  };

  // Cleanup sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        // console.log($&);
        sound.stopAsync();
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Optimized Firestore walk request listener
  useEffect(() => {
    if (!userData) {
      // console.log($&);
      return;
    }

    // Setup Firestore walk request listener (optimized)
    function setupWalkRequestListener() {
      try {
        const userId = userData?.id || userData?.userId;
        if (!userId) {
          // console.log($&);
          return;
        }
        // console.log($&);
        const walkRequestsRef = collection(db, 'walkRequests');
        const q = query(
          walkRequestsRef,
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          // console.log($&);
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const walkRequest = change.doc.data();
              // Skip if this is your own request
              if (walkRequest.requesterId === userId) {
                // console.log($&);
                return;
              }
              // Convert Firestore timestamp to readable time
              const requestTime = walkRequest.createdAt?.toDate
                ? walkRequest.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              // Convert Firestore data to walk request format (updated)
              const walkData = {
                requestId: change.doc.id,
                walkFrom: walkRequest.pickup || walkRequest.walkFrom,
                walkTo: walkRequest.destination || walkRequest.walkTo,
                time: '5 mins', // You might want to calculate this based on distance
                partnerName: walkRequest.requesterName,
                partnerInitials: getInitials(walkRequest.requesterName),
                senderPhone: walkRequest.requesterPhone,
                currentTime: requestTime,
                meetupPoint: walkRequest.meetupPoint,
                preferredGender: walkRequest.preferredGender,
                requesterId: walkRequest.requesterId,
                // Add any other fields you want to display
              };
              // console.log($&);
              // Play notification sound for new walk request
              playNotificationSound('walk_request');
              setCurrentWalkRequest(walkData);
              setIsNotificationVisible(true);
            }
          });
        }, (error) => {
          console.error('❌ Firestore listener error:', error);
        });
        // console.log($&);
        return unsubscribe;
      } catch (error) {
        console.error('💥 Error setting up walk request listener:', error);
      }
    }

    const unsubscribe = setupWalkRequestListener();
    return () => {
      if (unsubscribe) {
        // console.log($&);
        unsubscribe();
      }
    };
  }, [userData, setCurrentWalkRequest, setIsNotificationVisible]);

  // Listen for acceptance status updates for the current walk request using currentWalkRequestId
  // New version: Listen for sender confirmation for the receiver
  const [currentWalkRequestId, setCurrentWalkRequestId] = useState(null);
  useEffect(() => {
    // Keep currentWalkRequestId in sync with currentWalkRequest?.requestId
    if (currentWalkRequest?.requestId) {
      setCurrentWalkRequestId(currentWalkRequest.requestId);
    }
  }, [currentWalkRequest?.requestId]);

  // Updated Firestore listener for currentWalkRequestId with detailed logging and handling for both sender and receiver
useEffect(() => {
  if (!currentWalkRequestId) return;

  const walkRequestRef = doc(db, 'walkRequests', currentWalkRequestId);
  const unsubscribe = onSnapshot(walkRequestRef, async (docSnap) => {
    if (!docSnap.exists()) return;
    const data = docSnap.data();

    const userId = userData?.id || userData?.userId;
    const isSender = userId && (userId === data.requesterId);
    const isReceiver = userId && (userId !== data.requesterId);

    if (data.status === 'accepted_by_both') {
      const confirmedWalkRequest = {
        requestId: currentWalkRequestId,
        walkFrom: data.pickup || data.walkFrom,
        walkTo: data.destination || data.walkTo,
        meetupPoint: data.meetupPoint,
        startPoint: data.startPoint || data.pickup || data.walkFrom,
        destination: data.destination || data.walkTo,
        requesterId: data.requesterId,
        senderPhone: data.requesterPhone,
        partnerName: isSender 
          ? data.accepterData?.name || 'Walk Partner' 
          : data.requesterName || 'Walk Partner',
        partnerInitials: isSender
          ? (data.accepterData?.name ? getInitials(data.accepterData.name) : 'WP')
          : (data.requesterName ? getInitials(data.requesterName) : 'WP'),
        preferredGender: data.preferredGender,
        status: data.status,
        confirmedAt: data.confirmedAt || new Date().toISOString(),
        time: data.time,
        senderName: data.senderName,
      };

      setAcceptedWalkRequest(confirmedWalkRequest);
      setAcceptanceLoading(false);
      setIsNotificationVisible(false);

      if (isReceiver) {
        // Alert.alert('Walk Confirmed! 🎉', 'The sender has confirmed. Your walk is starting!');
      } else if (isSender) {
        // Alert.alert('Walk Confirmed! 🎉', 'Your walking partner has accepted and confirmed the walk!');
      }

    } else if (data.status === 'cancelled') {
      setAcceptedWalkRequest(null);
      setAcceptanceLoading(false);
      setIsNotificationVisible(false);
      Alert.alert('Walk Cancelled', 'The walk request was cancelled.');

    } else if (data.status === 'accepted_by_receiver') {
      if (isSender) {
        Alert.alert(
          'Receiver Accepted!',
          'Your walking partner accepted your walk request. Please confirm to start the walk.'
        );
      }
    }
  });

  return () => unsubscribe();
}, [currentWalkRequestId, currentWalkRequest, userData]);

  // Unified walk request status listener
  useEffect(() => {
    if (!currentWalkRequest?.requestId) return;

    // Listen for any updates to the walk request status
    const walkRequestRef = doc(db, 'walkRequests', currentWalkRequest.requestId);
    const unsubscribe = onSnapshot(walkRequestRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Handle all walk request status changes here
        if (data.status === 'accepted_by_both') {
          setAcceptanceLoading(false);
          setIsNotificationVisible(false);
          setCurrentWalkRequest(null);
        } else if (data.status === 'cancelled') {
          setAcceptanceLoading(false);
          Alert.alert('Cancelled', 'The walk request was cancelled.');
        } else if (data.status === 'pending') {
          // Optionally handle pending state
        }
        // Add more status handling as needed
      }
    });

    return () => unsubscribe();
  }, [currentWalkRequest?.requestId]);
  

  // Initialize the notification system
  useEffect(() => {
    initializeNotificationSystem();
    setupPushNotifications();
    
    const handleAppStateChange = (nextAppState) => {
      // console.log($&);
      
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // console.log($&);
      } else if (nextAppState.match(/inactive|background/)) {
        if (activePopup) {
          // console.log($&);
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
        // console.log($&);
        
        // Store token in Firebase for this user
        const userPhone = userData?.phone || userData?.phoneNumber;
        if (userPhone) {
          await FirebaseService.updateUserPushToken(userPhone, token);
          // console.log($&);
        }
      }

      // Listen for notifications when app is in foreground
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        // console.log($&);
        handleIncomingPushNotification(notification);
      });

      // Listen for user tapping on notification
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        // console.log($&);
        handleNotificationTap(response);
      });

    } catch (error) {
      // console.error('Error setting up push notifications:', error);
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
      
      // console.log($&);
    } else {
      // Alert.alert('Simulator Detected', 'Push notifications don\'t work on simulator. Use a physical device.');
      console.warn('⚠️ Must use physical device for Push Notifications');
    }

    return token;
  };

  // In your NotificationContext - update handleIncomingPushNotification
  const handleIncomingPushNotification = (notification) => {
    const data = notification.request.content.data;
    
    // console.log($&);

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
         requesterId: data.requesterId,
      };

      // console.log($&);
      handleIncomingWalkRequest(walkData);
    }
  };

  // Handle when user taps on notification - UPDATED WITH DETAILED LOGGING
  const handleNotificationTap = (response) => {
    // console.log($&);
    // console.log($&);
    
    const data = response.notification.request.content.data;
    // console.log($&);
    // console.log($&);
    
    if (data.type === 'walk_request') {
      // console.log($&);
      
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
        requesterId: data.requesterId, 
      };

      // console.log($&);
      // console.log($&);
      
      setCurrentWalkRequest(walkData);
      setIsNotificationVisible(true);
      
      // console.log($&);
      // console.log($&);
      // console.log($&);
      
    } else {
      // console.log($&);
    }
    // console.log($&);
  };

  // Send walk request to ALL users (for testing)
  const sendWalkRequest = async (walkData) => {
    try {
      // console.log($&);
      
      const userPhone = userData?.phone || userData?.phoneNumber;
      if (!userPhone) {
        throw new Error('User not logged in');
      }

      // Get current user's info
      const currentUserData = await FirebaseService.getUserByPhone(userPhone);
      if (!currentUserData) {
        throw new Error('User data not found');
      }

      // Get ALL users with push tokens (not just nearby/friends)
      const allUsers = await FirebaseService.getAllUsersWithPushTokens();
      
      // console.log($&);

      if (allUsers.length === 0) {
        Alert.alert('No Users Available', 'No users found with push tokens.');
        return { success: false, error: 'No users with push tokens' };
      }

// Prepare notification data
const notificationData = {
  requestId: walkData.requestId || Math.random().toString(36).substring(7),
  type: 'walk_request',
  walkFrom: walkData.walkFrom,
  walkTo: walkData.walkTo,
  time: walkData.time,
  // Fix: Access the user data correctly
  senderName: currentUserData.userData?.Name + ' ' + currentUserData.userData?.Surname,
  senderInitials: (currentUserData.userData?.Name?.[0] || '') + (currentUserData.userData?.Surname?.[0] || ''),
  senderPhone: userPhone,
  currentTime: walkData.currentTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  meetupPoint: walkData.meetupPoint || 'APB Campus',
  preferredGender: walkData.preferredGender || 'Any',
  requesterId: userId,
};

      // console.log($&);

      // Send push notification to each user
      const sendPromises = allUsers.map(async (user) => {
        if (!user.pushToken) {
          // console.log($&);
          return null;
        }

        // Skip sending to current user
        if (user.phone === userPhone) {
          // console.log($&);
          return null;
        }

        return await sendExpoPushNotification(
          user.pushToken,
          '🚶‍♂️ New Walk Request!',
          `${notificationData.senderName} wants to walk from ${walkData.walkFrom} to ${walkData.walkTo}`,
          notificationData
        );
      });

      const results = await Promise.all(sendPromises);
      const successCount = results.filter(r => r?.success).length;
      const failedCount = results.filter(r => r?.success === false).length;
      const skippedCount = results.filter(r => r === null).length;

      // console.log($&);
      // console.log($&);

      return { 
        success: true, 
        sentCount: successCount,
        totalUsers: allUsers.length,
        failedCount,
        skippedCount
      };

    } catch (error) {
      console.error('💥 Error sending walk request:', error);
      return { success: false, error: error.message };
    }
  };

// In your sendExpoPushNotification function in NotificationContext.js
const sendExpoPushNotification = async (pushToken, title, body, data) => {
  const message = {
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: {
      ...data,
      // Add deep link URL
      url: 'alertnet://walk-request', // Your custom URL scheme
      _displayInForeground: true,
    },
    priority: 'high',
    channelId: 'walk-requests',
  };

  try {
    console.log(`📤 Sending notification:`, {
      title: title,
      body: body,
      token: pushToken.substring(0, 20) + '...',
      data: message.data // Log the updated data
    });
    
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    // console.log($&);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // console.log($&);
    
    if (result.data && result.data.status === 'ok') {
      // console.log($&);
      return { success: true, result };
    } else {
      console.error('❌ Push notification failed:', result);
      return { 
        success: false, 
        error: result.errors ? result.errors[0] : 'Unknown error' 
      };
    }
  } catch (error) {
    console.error('💥 Error sending push notification:', error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

  const handleIncomingWalkRequest = (walkData) => {
    // console.log($&);
    
    // Play notification sound/vibration
    if (soundEnabled) {
      playNotificationByType('walk_request');
    }

    // Show the walk request popup
    setCurrentWalkRequest(walkData);
    setIsNotificationVisible(true);
  };

const acceptWalkRequest = async () => {
  // --- PATCH: Set loader and keep modal open at start ---
  console.log("✅ ACCEPT: Setting loader to true, keeping modal open");
  setAcceptanceLoading(true);
  // DON'T close the modal here!

  if (!currentWalkRequest || !currentWalkRequest.senderPhone) {
    console.error('Cannot accept: Walk request data is incomplete.', currentWalkRequest);
    Alert.alert('Error', 'Invalid walk request data.');
    return;
  }

  try {
    // Play acceptance sound
    await playNotificationSound('walk_accepted');
    
    // Get current user data (the person accepting)
    const userId = await AsyncStorage.getItem('userId');
    const userDataString = await AsyncStorage.getItem('userData');
    const userDataObj = JSON.parse(userDataString);

    if (!userId || !userDataObj) {
      console.error('❌ User data not found');
      setAcceptanceLoading(false);
      Alert.alert('Error', 'User data not found. Please try again.');
      return;
    }

    // console.log($&);
    
    // Notify the sender that request was accepted
    const result = await FirebaseService.acceptWalkRequest(
      currentWalkRequest.requestId,
      userDataObj.phone, // Current user's phone (accepter)
      currentWalkRequest.senderPhone // Original requester's phone
    );

    if (result.success) {
      // Prepare accepter's data
      const accepterData = {
        id: userId,
        name: `${userDataObj.name || userDataObj.Name || ''} ${userDataObj.surname || userDataObj.Surname || ''}`.trim(),
        phone: userDataObj.phone,
        rating: userDataObj.rating || 4.8,
        bio: userDataObj.bio || "I walk to campus daily from Horizon. Let's walk together.",
        availability: userDataObj.availability || "Available Now",
        gender: userDataObj.gender || userDataObj.Gender || "Male",
        walksCompleted: userDataObj.walksCompleted || 13,
        universityYear: userDataObj.universityYear || "3rd Year",
        isVerified: userDataObj.isVerified !== undefined ? userDataObj.isVerified : true
      };

      // Send push notification to the original requester with accepter's details
      await sendWalkAcceptedNotification(
        currentWalkRequest.senderPhone,
        currentWalkRequest.requestId,
        accepterData,
        currentWalkRequest
      );

      // Set accepted walk request data
      setAcceptedWalkRequest({
        ...currentWalkRequest,
        accepterData
      });

      // CRITICAL: DO NOT setAcceptanceLoading(false) here
      // DO NOT close the modal - keep it open with the loader
      // The loader will be hidden when we receive confirmation from sender via Firestore listener

      // (Modal will be closed by Firestore listener upon confirmation)
    } else {
      throw new Error(result.error || 'Unknown error accepting walk request');
    }

  } catch (error) {
    // PATCH: Improved error logging and loader hiding, keep modal open to show error state
    console.error("❌ ACCEPT: Error occurred", error);
    // On error, hide loader but keep modal open to show error state
    setAcceptanceLoading(false);
    // Optionally show an alert but don't close modal immediately
    Alert.alert("Acceptance Failed", "Please try again.");
    // Do NOT close modal or clear currentWalkRequest here
    // setIsNotificationVisible(false);
    // setCurrentWalkRequest(null);
  }
};
// Listen for sender's confirmation and cleanup after confirmation
const setupConfirmationListener = (requestId, onConfirmed) => {
  // Listen for sender confirmation in Firestore
  // Returns unsubscribe function
  const walkRequestRef = collection(db, 'walkRequests');
  const q = query(walkRequestRef, where('__name__', '==', requestId));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      // Assume senderConfirmed flag is set by the sender when they confirm the receiver
      if (data.senderConfirmed) {
        if (typeof onConfirmed === 'function') onConfirmed(data);
        // Clean up listener after confirmation
        unsubscribe();
      }
    });
  });
  return unsubscribe;
};

// Called by sender to confirm the receiver
const confirmWalkRequest = async (requestId) => {
  try {
    // Update Firestore walkRequest document with senderConfirmed flag
    await FirebaseService.confirmWalkRequest(requestId);
    Alert.alert('Confirmation Sent!', 'You have confirmed your walking partner.');
    // Optionally, cleanup UI or state here
  } catch (error) {
    console.error('Error confirming walk request:', error);
    Alert.alert('Error', 'Failed to confirm walk. Please try again.');
  }
};

// Improved function to send acceptance notification to original requester
const sendWalkAcceptedNotification = async (requesterPhone, requestId, accepterData, walkData) => {
  // Log the requesterPhone at the start
  console.log(`[sendWalkAcceptedNotification] requesterPhone: ${requesterPhone}`);
  try {
    // Get the requester's push token
    const requesterResult = await FirebaseService.getUserByPhone(requesterPhone);
    const userData = requesterResult.userData || requesterResult.data;

    // Check for missing pushToken
    if (!userData?.pushToken) {
      console.warn(`[sendWalkAcceptedNotification] No push token for requester: ${requesterPhone}`);
      return { success: true, warning: 'No push token available, using Firestore updates only' };
    }

    const notificationData = {
      type: 'walk_accepted',
      requestId,
      accepterData,
      walkData,
      action: 'show_select_walker'
    };

    await sendExpoPushNotification(
      userData.pushToken,
      '🚶‍♂️ Walk Request Accepted!',
      `${accepterData.name} accepted your walk request!`,
      notificationData
    );

    return { success: true };

  } catch (error) {
    console.error('[sendWalkAcceptedNotification] Error:', error);
    return { success: true, warning: 'Push notification failed, using Firestore updates' };
  }
};

const declineWalkRequest = async () => {
  if (!currentWalkRequest) return;

  // console.log($&);
  
  // Ensure loading is stopped when declining
  setAcceptanceLoading(false);
  
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
    setAcceptanceLoading(false);
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


  // Helper function to get initials from a name string
  function getInitials(name) {
    if (!name || typeof name !== 'string') return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0][0]?.toUpperCase() || '';
    }
    return (parts[0][0] || '') + (parts[1][0] || '');
  }

  const loadShownNotifications = async () => {
    try {
      const shownNotificationsJSON = await AsyncStorage.getItem('shownNotifications');
      if (shownNotificationsJSON) {
        const shownIds = JSON.parse(shownNotificationsJSON);
        setShownNotifications(new Set(shownIds));
        // console.log($&);
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
        // console.log($&);
      }
    } catch (error) {
      console.error('Error cleaning up shown notifications:', error);
    }
  };

  const initializeNotificationSystem = async () => {
    try {
      // console.log($&);
      
      const jsonValue = await AsyncStorage.getItem('userData');
      if (jsonValue) {
        const data = JSON.parse(jsonValue);
        setUserData(data);
        // console.log($&);
        
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
      // console.log($&);
    } catch (error) {
      console.error('Error initializing notification system:', error);
      setIsInitialized(true);
    }
  };

  const setupNotificationListener = (userPhone) => {
    // console.log($&);
    
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
      // console.log($&);

      if (notification.type === 'chat_message' && 
          activeChatRoomId && 
          notification.chatRoomId === activeChatRoomId) {
        // console.log($&);
        await markNotificationAsRead(notification.id);
        return;
      }
      
      if (shownNotifications.has(notification.id) || notification.read) {
        // console.log($&);
        return;
      }

      if (soundEnabled) {
        await playNotificationByType(notification.type);
      }

      const shouldShowPopup = shouldShowNotificationPopup(notification);
      
      if (shouldShowPopup) {
        // console.log($&);
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
        // console.log($&);
        return;
      }
      // Play vibration pattern
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
      // Play notification sound for supported types
      if (['walk_request', 'walk_accepted'].includes(type)) {
        await playNotificationSound(type);
      }
    } catch (error) {
      // console.log($&);
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
      if (!userData) {
        throw new Error('User data not found. Please log in again.');
      }
      
      // Get phone from multiple possible field names
      const userPhone = userData?.phone || userData?.phoneNumber || userData?.Phone;
      if (!userPhone) {
        throw new Error('User phone number not found');
      }
      
      // Pass the ENTIRE userData object, not just the phone
      const result = await FirebaseService.acceptFriendRequest(requestId, {
        ...userData,
        phone: userPhone,  // Ensure phone is consistent
        userId: userData?.userId || userData?.id,
      });
      
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
    // console.log($&);
    
    if (unsubscribeNotifications.current) {
      unsubscribeNotifications.current();
    }
    
    if (notificationListener.current && typeof notificationListener.current.remove === 'function') {
      notificationListener.current.remove();
    }
    
    if (responseListener.current && typeof responseListener.current.remove === 'function') {
      responseListener.current.remove();
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

  // Walk request acceptance states (exported for easier access)
  acceptedWalkRequest,
  setAcceptedWalkRequest,

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

  // Additional walk request actions
  acceptanceLoading,
  setAcceptanceLoading,
  confirmWalkRequest,
};

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};