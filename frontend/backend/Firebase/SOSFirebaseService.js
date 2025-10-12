// SOSFirebaseService.js
import { auth, db } from './FirebaseConfig';
import { 
  collection, 
  addDoc, 
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { FirebaseService } from './FirebaseService';

export class SOSFirebaseService {
  // ========================
  // FCM PUSH NOTIFICATION METHODS
  // ========================

  // Configure notifications
  static configureNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  // Get FCM token for current device
  static async getFCMToken() {
    try {
      // Check if we're on a physical device
      if (!Constants.isDevice) {
        console.warn('Must use physical device for push notifications');
        return null;
      }

      // Check if we're in Expo Go on Android, where remote notifications are not supported.
      if (Platform.OS === 'android' && !Application.androidId) {
        console.warn('Push notifications are not supported in Expo Go on Android. Please use a development build.');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification');
        return null;
      }

      // Get the token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId,
      });

      // console.log($&);
      return token.data;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Store FCM token for user
  static async storeFCMToken(userId, token) {
    try {
      if (!token) return false;
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: token,
        fcmTokenUpdated: new Date()
      });
      
      // console.log($&);
      return true;
    } catch (error) {
      console.error('Error storing FCM token:', error);
      return false;
    }
  }

  // Initialize FCM for the app
  static async initializeFCM(userId) {
    try {
      // Configure notifications
      SOSFirebaseService.configureNotifications();

      // Get FCM token
      const token = await SOSFirebaseService.getFCMToken();
      
      if (token && userId) {
        // Store token for this user
        await SOSFirebaseService.storeFCMToken(userId, token);
      }

      return token;
    } catch (error) {
      console.error('Error initializing FCM:', error);
      return null;
    }
  }

  // Listen for incoming notifications
  static setupNotificationListener() {
    // Handle notifications when app is in foreground
    const foregroundListener = Notifications.addNotificationReceivedListener(notification => {
      // console.log($&);
      // Handle the notification (show alert, update UI, etc.)
    });

    // Handle notification interactions (when user taps notification)
    const interactionListener = Notifications.addNotificationResponseReceivedListener(response => {
      // console.log($&);
      const data = response.notification.request.content.data;
      
      if (data.type === 'sos') {
        // Handle SOS notification tap
        // Navigate to appropriate screen or show SOS details
        // console.log($&);
      }
    });

    return {
      foregroundListener,
      interactionListener
    };
  }

  // Remove notification listeners
  static removeNotificationListeners(listeners) {
    if (listeners.foregroundListener) {
      Notifications.removeNotificationSubscription(listeners.foregroundListener);
    }
    if (listeners.interactionListener) {
      Notifications.removeNotificationSubscription(listeners.interactionListener);
    }
  }

  // ========================
  // SOS NOTIFICATION METHODS
  // ========================

  // Get user's friends list
  static async getUserFriends(userId) {
  try {
    if (!userId) {
      console.warn('⚠️ [getUserFriends] No userId provided');
      return [];
    }
    console.log('🔍 [getUserFriends] Starting for userId:', userId);

    // Use the reliable method from FirebaseService to get the Friends array
    const friendsResult = await FirebaseService.getFriendsFromArray(userId);

    if (friendsResult.success) {
      // Extract just the friend IDs
      const friendIds = friendsResult.friends.map(f => f.friendId);
      console.log(`✅ [getUserFriends] Found ${friendIds.length} friend IDs from user document.`);
      return friendIds;
    }

    console.warn('⚠️ [getUserFriends] Could not retrieve friends from user document:', friendsResult.error);
    return [];
    
  } catch (error) {
    console.error('❌ [getUserFriends] Error getting user friends:', error);
    return [];
  }
}

  // Get notification data (token and phone) for friends
  static async getFriendsNotificationData(friendIds) {
  try {
    if (!friendIds || friendIds.length === 0) {
      console.warn('⚠️ [getFriendsNotificationData] No friend IDs provided');
      return [];
    }

    console.log(`📍 [getFriendsNotificationData] Processing ${friendIds.length} friend IDs`);
    console.log('   Friend IDs:', friendIds);
    
    const tokens = [];
    const CHUNK_SIZE = 30;

    // Process friend IDs in chunks
    for (let i = 0; i < friendIds.length; i += CHUNK_SIZE) {
      const chunk = friendIds.slice(i, i + CHUNK_SIZE);
      console.log(`   📦 Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${chunk.length} IDs`);
      
      // Validate IDs are strings
      const idsToQuery = chunk
        .map(id => {
          if (typeof id === 'string') return id;
          console.warn(`   ❌ Invalid ID type (${typeof id}):`, id);
          return null;
        })
        .filter(id => id && !id.startsWith('temp_'));

      if (idsToQuery.length === 0) {
        console.log('   ⚠️ No valid IDs in this chunk');
        continue;
      }

      console.log(`   🔍 Querying for ${idsToQuery.length} users`);
      
      const q = query(collection(db, 'users'), where('__name__', 'in', idsToQuery));
      const querySnapshot = await getDocs(q);

      console.log(`   ✅ Query returned ${querySnapshot.size} results`);

      querySnapshot.forEach(userDoc => {
        const userData = userDoc.data();
        const friendData = {
          token: userData.fcmToken || userData.ExpoPushToken || null,
          userId: userDoc.id,
          name: userData.name || userData.Name || 'Friend',
          email: userData.email || userData.Email,
          phone: userData.phone || userData.Phone || userData.phoneNumber,
        };
        
        console.log(`      👤 Found friend: ${friendData.name} (${friendData.userId}) - hasToken: ${!!friendData.token}`);
        tokens.push(friendData);
      });
    }
    
    console.log(`✅ [getFriendsNotificationData] Total friends with data: ${tokens.length}`);
    return tokens;
    
  } catch (error) {
    console.error('❌ [getFriendsNotificationData] Error:', error);
    return [];
  }
}

  // Send SOS notifications to friends - MAIN METHOD
  static async sendSOSNotifications(location, message = null, sosSessionId = null, userData) {
    try {
      const userId = userData?.uid || userData?.id || userData?.userId;
      const userEmail = userData?.email || userData?.Email;

      if (!userId) {
        throw new Error('User ID not found in provided user data.');
      }

      // console.log($&);

      // Get user's friends
      const friends = await SOSFirebaseService.getUserFriends(userId);
      if (friends.length === 0) {
        // console.log($&);
        return { success: true, notificationsSent: 0, message: 'No friends to notify' };
      }

      // console.log($&);

      // Extract friend IDs (handle both object and string formats)
      const friendIds = friends.map((friend, index) => {
        if (typeof friend === 'string') {
          console.log(`SOS Service: Friend ${index} is string ID:`, friend);
          return friend;
        } else if (typeof friend === 'object') {
          const id = friend.uid || friend.id;
          console.log(`SOS Service: Friend ${index} object contains ID:`, id, 'Full object:', JSON.stringify(friend));
          return id;
        } else {
          console.warn(`SOS Service: Friend ${index} has unexpected type:`, typeof friend);
          return null;
        }
      }).filter(id => {
        if (!id) {
          console.warn('SOS Service: Filtered out null/undefined friend ID');
          return false;
        }
        return true;
      });

      if (friendIds.length === 0) {
        // console.log($&);
        return { success: true, notificationsSent: 0, message: 'No valid friend IDs found' };
      }

      console.log('SOS Service: Extracted friend IDs:', friendIds);

      // Get notification data for all friends
      const friendsWithData = await SOSFirebaseService.getFriendsNotificationData(friendIds);
      
      if (friendsWithData.length === 0) {
        // // console.log($&);
        return { 
          success: true, 
          notificationsSent: 0, 
          totalFriends: friendIds.length,
          message: 'Friends not found in database.' 
        };
      }

      // Get current user data for the notification
      // Use passed-in userData first, then fetch if needed as a fallback.
      const currentUserDoc = await getDoc(doc(db, 'users', userId));
      const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : {};
      const firstName = currentUserData.name || currentUserData.Name || currentUserData.FirstName || '';
      const lastName = currentUserData.surname || currentUserData.Surname || currentUserData.LastName || '';
      const userName = (`${firstName} ${lastName}`).trim() || 'Your friend';
      const profilePicture = currentUserData.ImageURL || 
                             currentUserData.imageUrl || 
                             currentUserData.profilePicture || 
                             currentUserData.localImagePath ||
                             currentUserData.image ||
                             null;
      
      // Create location text
      const locationText = location 
        ? `Location: https://maps.google.com/?q=${location.latitude},${location.longitude}`
        : 'Location unavailable';

      // Prepare notification data
      const notificationTitle = `🚨 Emergency Alert from ${userName}`;
      const notificationBody = message || `${userName} needs immediate help! ${locationText}`;
      
      // Store SOS notification in Firestore for each friend
      const sosData = {
        senderId: userId,
        senderName: userName,
        senderEmail: userEmail,
        message: notificationBody,
        location: location || null,
        createdAt: new Date(),
        status: 'sent',
        sosSessionId: sosSessionId,
      };

      // 1. Log SOS event in Firestore for each friend
      const firestorePromises = friendsWithData.map(friend => 
        addDoc(collection(db, 'sosNotifications'), {
          ...sosData,
          recipientId: friend.userId,
          recipientName: friend.name,
        })
      );
      await Promise.all(firestorePromises);
      // console.log($&);

      // 2. Create in-app notifications and log to activity stream
      const notificationAndLogPromises = friendsWithData.map(async (friend) => {
        if (!friend.phone) {
          console.warn(`SOS Service: Cannot create in-app notification for friend ${friend.name} (${friend.userId}) due to missing phone number.`);
          return;
        }

        // Log this action to the SOS session activity
        await SOSFirebaseService.addLogToSOSSession(
          sosSessionId, 
          `Sent in-app alert to ${friend.name}`, 
          'friend_notified_app', 
          { friendId: friend.userId, friendName: friend.name }
        );

        // Create the notification
        await FirebaseService.createNotification({
          userId: friend.userId,
          recipientPhone: FirebaseService.formatPhoneNumber(friend.phone),
          type: 'sos',
          title: 'EMERGENCY ALERT',
          message: `has triggered an SOS alert and needs your help.`,
          isUrgent: true,
          priority: 'high',
          data: {
            senderId: userId,
            senderName: userName,
            profilePicture: profilePicture,
            location: location || null,
            sosSessionId: sosSessionId,
            category: 'emergency',
            senderPhone: currentUserData.phone || currentUserData.Phone || currentUserData.phoneNumber,
          }
        });
      });

      await Promise.all(notificationAndLogPromises);
      // console.log($&);

      // 3. Send batch push notifications ONLY to friends with a token
      const tokensForPush = friendsWithData.map(f => f.token).filter(Boolean);
      let notificationsSent = 0;
      let errors = [];

      if (tokensForPush.length > 0) {
        const functionUrl = 'https://us-central1-alertnet-1ecfb.cloudfunctions.net/sendBatchSOSNotifications';

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens: tokensForPush,
            title: notificationTitle,
            body: notificationBody,
            data: {
              type: 'sos',
              senderId: userId,
              senderName: userName,
              location: location ? JSON.stringify(location) : null,
              timestamp: new Date().toISOString(),
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Batch notification request failed: ${errorText}`);
        }

        const result = await response.json();
        notificationsSent = result.successCount || 0;
        const failureCount = result.failureCount || 0;

        if (failureCount > 0) {
          const failureMessage = `${failureCount} push notifications failed to send.`;
          errors.push(failureMessage);
          console.warn(`SOS Service: ${failureMessage}`, result.responses);
        }

        // console.log($&);
      } else {
        // console.log($&);
      }

      return {
        success: true,
        notificationsSent,
        totalFriends: friendIds.length,
        friendsWithTokens: tokensForPush.length,
        errors: errors.length > 0 ? errors : null,
      };

    } catch (error) {
      console.error('SOS Service: Error in sendSOSNotifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Send "All Safe" broadcast to friends
  static async sendSafeBroadcast(sessionId, userData) {
    try {
      const currentUserId = userData?.uid || userData?.id || userData?.userId || auth.currentUser?.uid;

      if (!currentUserId || !sessionId) {
        throw new Error('User or session ID missing for safe broadcast.');
      }

      // 1. Get user's name for the notification
      const userDoc = await getDoc(doc(db, 'users', currentUserId));
      let userName = 'Your friend';

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const firstName = userData.name || userData.Name || userData.FirstName || '';
        const lastName = userData.surname || userData.Surname || userData.LastName || '';
        userName = (`${firstName} ${lastName}`).trim() || 'Your friend';
      }

      // 2. Find all recipients for this SOS session from the 'sosNotifications' log
      const q = query(collection(db, 'sosNotifications'), where('sosSessionId', '==', sessionId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // console.log($&);
        await this.endSOSSession(sessionId);
        return { success: true, notifiedCount: 0, message: "Session ended. No one to notify." };
      }

      // Get unique recipient IDs
      const recipientIds = [...new Set(querySnapshot.docs.map(d => d.data().recipientId))];

      // 3. Get notification data (token and phone) for these recipients
      const recipientsWithData = await this.getFriendsNotificationData(recipientIds);
      const tokens = recipientsWithData.map(r => r.token).filter(Boolean);

      const notificationTitle = `✅ ${userName} is Safe`;
      const notificationBody = `The emergency alert initiated by ${userName} has been resolved.`;

      // 4. Create in-app notifications for all recipients
      const inAppPromises = recipientsWithData.map(recipient => {
        if (!recipient.phone) {
          console.warn(`Cannot send 'safe' in-app alert to ${recipient.name}, phone number is missing.`);
          return Promise.resolve();
        }
        return FirebaseService.createNotification({
          userId: recipient.userId,
          recipientPhone: FirebaseService.formatPhoneNumber(recipient.phone),
          type: 'sos_resolved',
          title: `${userName} is Safe`,
          message: 'The emergency alert has been resolved.',
          priority: 'normal',
          data: {
            senderId: currentUserId,
            senderName: '',
            sosSessionId: sessionId,
            category: 'safety',
          }
        });
      });

      await Promise.all(inAppPromises);
      // console.log($&);

      if (tokens.length > 0) {
        // 5. Call a cloud function to send the "safe" push notification
        const functionUrl = 'https://us-central1-alertnet-1ecfb.cloudfunctions.net/sendSOSResolvedNotification';

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens: tokens,
            title: notificationTitle,
            body: notificationBody,
            data: {
              type: 'sos_resolved',
              sosSessionId: sessionId,
              senderId: currentUserId,
            },
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`"All Safe" broadcast failed: ${errorText}`);
        } else {
          // console.log($&);
        }
      }

      // 6. End the SOS session in Firestore
      await this.endSOSSession(sessionId);
      return { success: true, notifiedCount: recipientsWithData.length };
    } catch (error) {
      console.error('Error in sendSafeBroadcast:', error);
      if (sessionId) await this.endSOSSession(sessionId);
      return { success: false, error: error.message };
    }
  }

  // ========================
  // SOS REAL-TIME ACTIVITY LOG
  // ========================

  static getCurrentUser() {
    return new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        if (user) {
          resolve(user);
        } else {
          reject(new Error("User not authenticated"));
        }
      });
    });
  }

  static async createSOSSession(sessionData) {
    try {
      const userId = sessionData.userId;
      if (!userId) throw new Error('User ID is missing from session data.');

      const sessionRef = await addDoc(collection(db, 'sosSessions'), {
        ...sessionData,
        status: 'active',
        createdAt: new Date()
      });

      return { success: true, sessionId: sessionRef.id };
    } catch (error) {
      console.error('Error creating SOS session:', error);
      return { success: false, error: error.message };
    }
  }

  static async addLogToSOSSession(sessionId, message, type = 'info', data = {}) {
    try {
      if (!sessionId) {
        console.warn('addLogToSOSSession called with no session ID');
        return { success: false, error: 'No session ID provided' };
      }
      
      const logEntry = {
        sessionId,
        timestamp: new Date(),
        message,
        type,
        ...data
      };
      
      const logRef = await addDoc(collection(db, 'sosActivityLog'), logEntry);
      return { success: true, logId: logRef.id };
    } catch (error) {
      console.error('Error adding log to SOS session:', error);
      return { success: false, error: error.message };
    }
  }

  static listenToSOSActivity(sessionId, callback) {
    if (!sessionId) {
      console.warn('listenToSOSActivity called with no session ID');
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'sosActivityLog'),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const logs = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
          }));
          callback({ logs, error: null });
        } catch (err) {
          console.error("Error processing SOS activity snapshot:", err);
          callback({ logs: [], error: err.message });
        }
      }, (error) => {
        console.error("Error listening to SOS activity:", error);
        callback({ logs: [], error: error.message });
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up SOS activity listener:", error);
      return () => {};
    }
  }

  static async endSOSSession(sessionId) {
    try {
      if (!sessionId) {
        console.warn('endSOSSession called with no session ID');
        return { success: false, error: 'No session ID provided' };
      }
      
      const sessionRef = doc(db, 'sosSessions', sessionId);
      await updateDoc(sessionRef, { 
        status: 'ended', 
        endTime: new Date() 
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error ending SOS session:', error);
      return { success: false, error: error.message };
    }
  }
}