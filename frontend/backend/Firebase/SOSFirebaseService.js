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
      // console.log($&);
      
      // Method 1: Try from friends collection (new format)
      const friendsQuery = query(
        collection(db, 'friends'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const friendsSnapshot = await getDocs(friendsQuery);
      
      if (!friendsSnapshot.empty) {
        const friends = friendsSnapshot.docs.map(doc => ({
          uid: doc.data().friendId,
          name: doc.data().friendName,
          email: doc.data().friendEmail,
          phone: doc.data().friendPhone
        }));
        // console.log($&);
        return friends;
      }

      // Method 2: Try from user document
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // console.log($&);
        return [];
      }

      const userData = userDoc.data();
      
      // Check if friends is an array (new format)
      if (Array.isArray(userData.friends)) {
        // console.log($&);
        return userData.friends;
      }
      
      // Check if Friends is an object (old format)
      if (userData.Friends && typeof userData.Friends === 'object') {
        const friendIds = Object.keys(userData.Friends).filter(friendId => 
          userData.Friends[friendId] === true || 
          userData.Friends[friendId] === 'accepted'
        );
        // console.log($&);
        return friendIds; // Return IDs for further processing
      }

      return [];
    } catch (error) {
      console.error('SOS Service: Error getting user friends:', error);
      return [];
    }
  }

  // Get notification data (token and phone) for friends
  static async getFriendsNotificationData(friendIds) {
    try {
      if (!friendIds || friendIds.length === 0) {
        return [];
      }

      const tokens = [];
      const CHUNK_SIZE = 30; // Firestore 'in' query limit is 30

      // Process friend IDs in chunks to stay within query limits
      for (let i = 0; i < friendIds.length; i += CHUNK_SIZE) {
        const chunk = friendIds.slice(i, i + CHUNK_SIZE);
        const idsToQuery = chunk.map(friendId => 
          typeof friendId === 'string' ? friendId : friendId.uid
        ).filter(id => id);

        if (idsToQuery.length === 0) continue;

        const q = query(collection(db, 'users'), where('__name__', 'in', idsToQuery));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(userDoc => {
          const userData = userDoc.data();
          // Collect data for all friends, token can be null
          tokens.push({
            token: userData.fcmToken || null,
            userId: userDoc.id,
            name: userData.name || userData.Name || 'Friend',
            email: userData.email || userData.Email,
            phone: userData.phone || userData.Phone || userData.phoneNumber,
          });
        });
      }
      
      // console.log($&);
      return tokens;
    } catch (error) {
      console.error('SOS Service: Error getting friends notification data:', error);
      return [];
    }
  }

  // Send SOS notifications to friends - MAIN METHOD
  static async sendSOSNotifications(location, message = null, sosSessionId = null) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('SOS Service: No current user for SOS notification');
        return { success: false, error: 'User not authenticated' };
      }

      // console.log($&);

      // Get user's friends
      const friends = await SOSFirebaseService.getUserFriends(currentUser.uid);
      if (friends.length === 0) {
        // console.log($&);
        return { success: true, notificationsSent: 0, message: 'No friends to notify' };
      }

      // console.log($&);

      // Extract friend IDs (handle both object and string formats)
      const friendIds = friends.map(friend => 
        typeof friend === 'string' ? friend : friend.uid || friend.id
      ).filter(id => id); // Remove any undefined/null values

      if (friendIds.length === 0) {
        // console.log($&);
        return { success: true, notificationsSent: 0, message: 'No valid friend IDs found' };
      }

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
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const currentUserDoc = await getDoc(currentUserRef);
      const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : {};
      const firstName = currentUserData.name || currentUserData.Name || currentUserData.FirstName || '';
      const lastName = currentUserData.surname || currentUserData.Surname || currentUserData.LastName || '';
      const userName = (`${firstName} ${lastName}`).trim() || 'Your friend';
      const profilePicture = currentUserData.ImageURL || // Correct field from Firestore
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
        senderId: currentUser.uid,
        senderName: userName,
        senderEmail: currentUser.email,
        message: notificationBody,
        location: location || null,
        createdAt: new Date(),
        status: 'sent',
        sosSessionId: sosSessionId, // Link to the SOS session
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
          return; // Skips this friend
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
            senderId: currentUser.uid,
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
              senderId: currentUser.uid,
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
  static async sendSafeBroadcast(sessionId) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !sessionId) {
        throw new Error('User or session ID missing for safe broadcast.');
      }

      // 1. Get user's name for the notification
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
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
          return Promise.resolve(); // Don't block for one failure
        }
        return FirebaseService.createNotification({
          userId: recipient.userId,
          recipientPhone: FirebaseService.formatPhoneNumber(recipient.phone),
          type: 'sos_resolved',
          title: `${userName} is Safe`,
          message: 'The emergency alert has been resolved.',
          priority: 'normal', // 'normal' so it's not as alarming as an SOS
          data: {
            senderId: currentUser.uid,
            // Set senderName to empty to prevent redundancy in the popup,
            // as the name is already in the title.
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
              senderId: currentUser.uid,
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

  // FIXED: Removed trailing comma that was causing syntax error
  static async createSOSSession(sessionData) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const sessionRef = await addDoc(collection(db, 'sosSessions'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Unknown',
        ...sessionData,
        status: 'active',
        createdAt: new Date() // Added timestamp for better tracking
      });

      return { success: true, sessionId: sessionRef.id };
    } catch (error) {
      console.error('Error creating SOS session:', error);
      return { success: false, error: error.message };
    }
  }

  // FIXED: Removed trailing comma that was causing syntax error
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
        type, // e.g., 'info', 'friend_notified', 'police_called', 'user_safe'
        ...data
      };
      
      const logRef = await addDoc(collection(db, 'sosActivityLog'), logEntry);
      return { success: true, logId: logRef.id };
    } catch (error) {
      console.error('Error adding log to SOS session:', error);
      return { success: false, error: error.message };
    }
  }

  // FIXED: Removed trailing comma that was causing syntax error
  static listenToSOSActivity(sessionId, callback) {
    if (!sessionId) {
      console.warn('listenToSOSActivity called with no session ID');
      return () => {}; // Return an empty unsubscribe function
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
            // Safely handle timestamp conversion, removed invalid trailing comma
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
      return () => {}; // Return empty unsubscribe function
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