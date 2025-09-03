import { auth, db } from './FirebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';

export const FirebaseService = {
  // Auth methods
  signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password),
  signOut: () => signOut(auth),
  onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),
  getCurrentUser: () => auth.currentUser,

  // ========================
  // ENHANCED NOTIFICATION SYSTEM
  // ========================

  /**
   * Create a notification and trigger real-time listener
   * @param {Object} notificationData - Notification data
   * @returns {Object} - { success: boolean, notificationId?: string, error?: string }
   */
  createNotification: async (notificationData) => {
    try {
      const notification = {
        userId: notificationData.userId, // User who should receive the notification
        recipientPhone: notificationData.recipientPhone,
        type: notificationData.type, // 'friend_request', 'friend_accepted', 'sos', etc.
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {}, // Additional data (requestId, senderInfo, etc.)
        read: false,
        createdAt: serverTimestamp(),
        priority: notificationData.priority || 'normal' // 'high', 'normal', 'low'
      };
      
      const notificationsRef = collection(db, 'notifications');
      const docRef = await addDoc(notificationsRef, notification);
      
      console.log('📱 Notification created with ID:', docRef.id);
      
      // Optional: Try to send push notification (for future FCM integration)
      try {
        await FirebaseService.sendPushNotification({
          ...notification,
          notificationId: docRef.id
        });
      } catch (pushError) {
        console.warn('⚠️ Push notification failed (non-critical):', pushError);
      }
      
      return { success: true, notificationId: docRef.id };
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      return { success: false, error: error.message };
    }
  },

/**
 * Listen to notifications for a specific user (FIXED VERSION)
 * @param {string} userPhone - User's phone number
 * @param {Function} callback - Callback function to handle notification updates
 * @returns {Function} - Unsubscribe function
 */
listenToNotifications: (userPhone, callback) => {
  try {
    const formattedPhone = FirebaseService.formatPhoneNumber(userPhone);
    console.log('🔔 Setting up notification listener for:', formattedPhone);
    
    const notificationsRef = collection(db, 'notifications');
    
    // OPTION A: Simple query without ordering (no index required)
    const q = query(
      notificationsRef,
      where('recipientPhone', '==', formattedPhone),
      limit(50) // Remove orderBy to avoid index requirement
    );
    
    // OPTION B: Alternative with simpler ordering
    // const q = query(
    //   notificationsRef,
    //   where('recipientPhone', '==', formattedPhone)
    // );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = [];
      const changes = [];
      
      snapshot.docChanges().forEach((change) => {
        const notificationData = {
          id: change.doc.id,
          ...change.doc.data()
        };
        
        if (change.type === 'added') {
          console.log('🔔 New notification received:', notificationData.title);
          changes.push({ type: 'new', notification: notificationData });
        } else if (change.type === 'modified') {
          console.log('📝 Notification updated:', notificationData.title);
          changes.push({ type: 'updated', notification: notificationData });
        }
        
        notifications.push(notificationData);
      });
      
      // Sort notifications client-side instead of using orderBy in query
      const sortedNotifications = notifications.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        const aTime = a.createdAt.toMillis ? a.createdAt.toMillis() : a.createdAt;
        const bTime = b.createdAt.toMillis ? b.createdAt.toMillis() : b.createdAt;
        return bTime - aTime; // Descending order (newest first)
      });
      
      console.log(`📱 Found ${sortedNotifications.length} notifications for ${formattedPhone}`);
      
      // Call callback with sorted notifications and recent changes
      callback({
        notifications: sortedNotifications,
        changes: changes,
        unreadCount: sortedNotifications.filter(n => !n.read).length
      });
    }, (error) => {
      console.error('❌ Error listening to notifications:', error);
      callback({ notifications: [], changes: [], unreadCount: 0, error: error.message });
    });
    
  } catch (error) {
    console.error('❌ Error setting up notification listener:', error);
    return () => {}; // Return empty unsubscribe function
  }
},

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification document ID
   * @returns {Object} - { success: boolean, error?: string }
   */
  markNotificationAsRead: async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
      
      console.log('✅ Notification marked as read:', notificationId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mark all notifications as read for a user
   * @param {string} userPhone - User's phone number
   * @returns {Object} - { success: boolean, updatedCount?: number, error?: string }
   */
  markAllNotificationsAsRead: async (userPhone) => {
    try {
      const formattedPhone = FirebaseService.formatPhoneNumber(userPhone);
      const notificationsRef = collection(db, 'notifications');
      
      const q = query(
        notificationsRef,
        where('recipientPhone', '==', formattedPhone),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = [];
      
      querySnapshot.forEach((docSnapshot) => {
        batch.push(updateDoc(doc(db, 'notifications', docSnapshot.id), {
          read: true,
          readAt: serverTimestamp()
        }));
      });
      
      await Promise.all(batch);
      
      console.log(`✅ Marked ${querySnapshot.size} notifications as read`);
      return { success: true, updatedCount: querySnapshot.size };
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete a notification
   * @param {string} notificationId - Notification document ID
   * @returns {Object} - { success: boolean, error?: string }
   */
  deleteNotification: async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      });
      
      console.log('🗑️ Notification marked as deleted:', notificationId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Placeholder for push notifications (FCM integration)
   * @param {Object} notificationData - Notification data
   */
  sendPushNotification: async (notificationData) => {
    // TODO: Implement FCM push notifications here
    // For now, this is just a placeholder
    console.log('📲 Push notification would be sent:', {
      title: notificationData.title,
      body: notificationData.message,
      data: notificationData.data
    });
    
    // In a real implementation, you would:
    // 1. Get the user's FCM token from the database
    // 2. Send a push notification via FCM Admin SDK (requires Cloud Functions)
    // 3. Handle notification delivery status
    
    return { success: true, delivered: false, reason: 'FCM not implemented yet' };
  },

  // ========================
  // ENHANCED FRIEND REQUEST SYSTEM WITH NOTIFICATIONS
  // ========================

  /**
   * Format phone number to international format
   * @param {string} phone - Phone number to format
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber: (phone) => {
    console.log('📞 Formatting phone:', phone);
    
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    console.log('🧹 Cleaned:', cleaned);
    
    // Handle South African numbers
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      // Convert 0XXXXXXXXX to +27XXXXXXXXX
      const formatted = '+27' + cleaned.substring(1);
      console.log('🇿🇦 SA local to international:', formatted);
      return formatted;
    }
    
    // Handle international numbers without +
    if (cleaned.startsWith('27') && cleaned.length === 11) {
      const formatted = '+' + cleaned;
      console.log('🌍 Added + to country code:', formatted);
      return formatted;
    }
    
    // Already international format
    if (phone.startsWith('+')) {
      console.log('✅ Already international:', phone);
      return phone;
    }
    
    // Default: assume it needs +27
    const formatted = '+27' + cleaned;
    console.log('🔧 Default formatting:', formatted);
    return formatted;
  },

  /**
   * Check if a user exists by phone number
   * @param {string} phone - Phone number to check
   * @returns {Object} - { exists: boolean, userData: object|null, error?: string }
   */
  checkUserExists: async (phone) => {
    try {
      console.log('🔍 Original phone input:', phone);
      
      // Format phone number consistently
      const formattedPhone = FirebaseService.formatPhoneNumber(phone);
      console.log('🔎 Querying for Phone ==', formattedPhone);
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('Phone', '==', formattedPhone));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('❌ No user found with phone:', formattedPhone);
        return { exists: false, userData: null };
      }
      
      const userData = querySnapshot.docs[0].data();
      console.log('✅ Found match with formatted phone!');
      return { 
        exists: true, 
        userData: {
          id: querySnapshot.docs[0].id,
          ...userData
        }
      };
    } catch (error) {
      console.error('❌ Error checking if user exists:', error);
      return { exists: false, userData: null, error: error.message };
    }
  },

  /**
   * Check if a friend request already exists
   * @param {string} senderPhone - Sender's phone number
   * @param {string} recipientPhone - Recipient's phone number
   * @returns {Object} - { exists: boolean, requestData: object|null, direction?: string }
   */
  checkExistingFriendRequest: async (senderPhone, recipientPhone) => {
    try {
      const formattedSenderPhone = FirebaseService.formatPhoneNumber(senderPhone);
      const formattedRecipientPhone = FirebaseService.formatPhoneNumber(recipientPhone);
      
      console.log('🔍 Checking existing requests between:');
      console.log('    Sender:', formattedSenderPhone);
      console.log('    Recipient:', formattedRecipientPhone);
      
      const friendRequestsRef = collection(db, 'friendRequests');
      
      // Check for outgoing request (current user sent to recipient)
      const q1 = query(
        friendRequestsRef,
        where('senderPhone', '==', formattedSenderPhone),
        where('recipientPhone', '==', formattedRecipientPhone),
        where('status', '==', 'pending')
      );
      
      // Check for incoming request (recipient sent to current user)
      const q2 = query(
        friendRequestsRef,
        where('senderPhone', '==', formattedRecipientPhone),
        where('recipientPhone', '==', formattedSenderPhone),
        where('status', '==', 'pending')
      );
      
      console.log('🔎 Executing queries...');
      const [outgoingSnapshot, incomingSnapshot] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);
      
      if (!outgoingSnapshot.empty) {
        console.log('📤 Found outgoing request');
        return { 
          exists: true, 
          requestData: { id: outgoingSnapshot.docs[0].id, ...outgoingSnapshot.docs[0].data() },
          direction: 'outgoing'
        };
      }
      
      if (!incomingSnapshot.empty) {
        console.log('📥 Found incoming request');
        return { 
          exists: true, 
          requestData: { id: incomingSnapshot.docs[0].id, ...incomingSnapshot.docs[0].data() },
          direction: 'incoming'
        };
      }
      
      console.log('✅ No existing requests found');
      return { exists: false, requestData: null };
      
    } catch (error) {
      console.error('❌ Error checking existing friend request:', error);
      return { exists: false, requestData: null, error: error.message };
    }
  },

  /**
   * Enhanced sendFriendRequest with notifications
   * @param {Object} friendData - { firstName, lastName, phone, senderPhone, senderEmail }
   * @returns {Object} - { success: boolean, message: string, requestId?: string }
   */
  sendFriendRequest: async (friendData) => {
    try {
      console.log('📨 Starting friend request process...');
      
      const currentUser = auth.currentUser;
      const { firstName, lastName, phone, senderPhone, senderEmail } = friendData;
      
      // Get sender info
      const senderId = currentUser ? currentUser.uid : `temp_${Date.now()}`;
      const userEmail = senderEmail || (currentUser ? currentUser.email : 'guest@alertnet.com');
      
      // Format phone numbers
      const formattedRecipientPhone = FirebaseService.formatPhoneNumber(phone);
      const formattedSenderPhone = FirebaseService.formatPhoneNumber(senderPhone);
      
      console.log('👤 Sender phone:', formattedSenderPhone);
      console.log('👥 Recipient phone:', formattedRecipientPhone);
      
      // Step 1: Check if recipient exists
      const userCheck = await FirebaseService.checkUserExists(formattedRecipientPhone);
      if (userCheck.error) {
        console.error('❌ Error checking user database');
        return { success: false, error: 'Error checking user database' };
      }
      
      if (!userCheck.exists) {
        console.log('❌ User does not exist on platform');
        return { 
          success: false, 
          error: 'This person is not on AlertNet',
          message: 'This person is not on AlertNet'
        };
      }
      
      console.log('✅ Recipient exists on platform');
      
      // Step 2: Prevent self-requests (comment out for testing)
     /* if (formattedSenderPhone === formattedRecipientPhone) {
        console.log('❌ Self-request attempted');
        return { 
          success: false, 
          error: 'You cannot send a friend request to yourself',
          message: 'You cannot send a friend request to yourself'
        };
      }*/
      
      // Step 3: Check for existing requests
      const existingRequest = await FirebaseService.checkExistingFriendRequest(formattedSenderPhone, formattedRecipientPhone);
      if (existingRequest.error) {
        console.error('❌ Error checking existing requests');
        return { success: false, error: 'Error checking existing requests' };
      }
      
      if (existingRequest.exists) {
        if (existingRequest.direction === 'outgoing') {
          console.log('❌ Outgoing request already exists');
          return { 
            success: false, 
            error: 'Friend request already sent',
            message: 'You have already sent a friend request to this person'
          };
        } else {
          console.log('❌ Incoming request already exists');
          return { 
            success: false, 
            error: 'Pending request exists',
            message: 'This person has already sent you a friend request. Check your notifications.'
          };
        }
      }
      
      console.log('✅ No existing requests found, proceeding...');
      
      // Step 4: Create the friend request
      const friendRequest = {
        senderId: senderId,
        senderEmail: userEmail,
        senderPhone: formattedSenderPhone,
        recipientFirstName: firstName,
        recipientLastName: lastName,
        recipientPhone: formattedRecipientPhone,
        status: 'pending',
        createdAt: serverTimestamp(),
        senderName: currentUser?.displayName || `User ${formattedSenderPhone}`,
        recipientUserId: userCheck.userData.id
      };
      
      console.log('📝 Creating friend request document...');
      const friendRequestsRef = collection(db, 'friendRequests');
      const docRef = await addDoc(friendRequestsRef, friendRequest);
      
      console.log('✅ Friend request created with ID:', docRef.id);
      
      // Step 5: Create notification
      const notificationResult = await FirebaseService.createNotification({
        userId: userCheck.userData.id,
        recipientPhone: formattedRecipientPhone,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${friendRequest.senderName} wants to connect with you on AlertNet`,
        priority: 'normal',
        data: {
          requestId: docRef.id,
          senderPhone: formattedSenderPhone,
          senderName: friendRequest.senderName,
          senderEmail: userEmail,
          action: 'view_request'
        }
      });
      
      if (notificationResult.success) {
        console.log('📱 Notification created successfully');
      } else {
        console.warn('⚠️ Failed to create notification:', notificationResult.error);
      }
      
      return { 
        success: true, 
        message: 'Friend request sent successfully!',
        requestId: docRef.id,
        notificationSent: notificationResult.success
      };

    } catch (error) {
      console.error('❌ Error sending friend request:', error);
      return { 
        success: false, 
        error: 'Failed to send friend request',
        message: 'Something went wrong. Please try again.'
      };
    }
  },

  /**
   * Accept a friend request with notification
   * @param {string} requestId - Friend request document ID
   * @param {string} currentUserPhone - Current user's phone number
   * @returns {Object} - { success: boolean, message: string }
   */
  acceptFriendRequest: async (requestId, currentUserPhone) => {
    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        return { success: false, error: 'Friend request not found' };
      }
      
      const requestData = requestDoc.data();
      const formattedCurrentPhone = FirebaseService.formatPhoneNumber(currentUserPhone);
      
      // Verify the current user is the recipient
      if (requestData.recipientPhone !== formattedCurrentPhone) {
        return { success: false, error: 'Unauthorized action' };
      }
      
      // Update request status to accepted
      await updateDoc(requestRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      
      // Create notification for the sender
      await FirebaseService.createNotification({
        userId: requestData.senderId,
        recipientPhone: requestData.senderPhone,
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        message: `${requestData.recipientFirstName} ${requestData.recipientLastName} accepted your friend request!`,
        priority: 'normal',
        data: {
          requestId: requestId,
          accepterPhone: formattedCurrentPhone,
          accepterName: `${requestData.recipientFirstName} ${requestData.recipientLastName}`
        }
      });
      
      console.log('✅ Friend request accepted');
      return { 
        success: true, 
        message: 'Friend request accepted successfully!' 
      };
      
    } catch (error) {
      console.error('❌ Error accepting friend request:', error);
      return { 
        success: false, 
        error: 'Failed to accept friend request' 
      };
    }
  },

  /**
   * Decline a friend request
   * @param {string} requestId - Friend request document ID
   * @param {string} currentUserPhone - Current user's phone number
   * @returns {Object} - { success: boolean, message: string }
   */
  declineFriendRequest: async (requestId, currentUserPhone) => {
    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        return { success: false, error: 'Friend request not found' };
      }
      
      const requestData = requestDoc.data();
      const formattedCurrentPhone = FirebaseService.formatPhoneNumber(currentUserPhone);
      
      // Verify the current user is the recipient
      if (requestData.recipientPhone !== formattedCurrentPhone) {
        return { success: false, error: 'Unauthorized action' };
      }
      
      // Update request status to declined
      await updateDoc(requestRef, {
        status: 'declined',
        declinedAt: serverTimestamp()
      });
      
      console.log('✅ Friend request declined');
      return { 
        success: true, 
        message: 'Friend request declined' 
      };
      
    } catch (error) {
      console.error('❌ Error declining friend request:', error);
      return { 
        success: false, 
        error: 'Failed to decline friend request' 
      };
    }
  },

  /**
   * Listen to friend requests for a user
   * @param {string} userPhone - User's phone number
   * @param {Function} callback - Callback function to handle updates
   * @returns {Function} - Unsubscribe function
   */
  listenToFriendRequests: (userPhone, callback) => {
    try {
      const formattedPhone = FirebaseService.formatPhoneNumber(userPhone);
      const friendRequestsRef = collection(db, 'friendRequests');
      
      const q = query(
        friendRequestsRef,
        where('recipientPhone', '==', formattedPhone),
        where('status', '==', 'pending')
      );
      
      return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`📨 Found ${requests.length} pending requests for ${formattedPhone}`);
        callback(requests);
      }, (error) => {
        console.error('❌ Error listening to friend requests:', error);
        callback([]);
      });
      
    } catch (error) {
      console.error('❌ Error setting up friend request listener:', error);
      return () => {}; // Return empty unsubscribe function
    }
  },



  // Get friends for current user
  getFriends: async () => {
    try {
      const currentUser = auth.currentUser;
      const userId = currentUser ? currentUser.uid : `temp_${Date.now()}`;

      const q = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', userId),
        where('status', '==', 'accepted')
      );

      const querySnapshot = await getDocs(q);
      const friends = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        friends.push({
          firstName: data.recipientFirstName,
          lastName: data.recipientLastName,
          phone: data.recipientPhone
        });
      });

      return { success: true, friends };
    } catch (error) {
      console.error('Error getting friends:', error);
      return { success: false, error: error.message, friends: [] };
    }
  },

  // Add these methods to your FirebaseService.js

/**
 * Create bidirectional friendship after request acceptance
 * @param {Object} friendshipData - Data for both users
 * @returns {Object} - { success: boolean, message: string }
 */
createFriendship: async (friendshipData) => {
  try {
    const { 
      user1Phone, user1Name, user1Email, user1Id,
      user2Phone, user2Name, user2Email, user2Id,
      requestId 
    } = friendshipData;
    
    console.log('🤝 Creating bidirectional friendship...');
    
    const friendsRef = collection(db, 'friends');
    const timestamp = serverTimestamp();
    
    // Create friendship document for User 1 (has User 2 as friend)
    const friendship1 = {
      userId: user1Id,
      userPhone: FirebaseService.formatPhoneNumber(user1Phone),
      userEmail: user1Email,
      userName: user1Name,
      friendId: user2Id,
      friendPhone: FirebaseService.formatPhoneNumber(user2Phone),
      friendEmail: user2Email,
      friendName: user2Name,
      status: 'active',
      createdAt: timestamp,
      requestId: requestId,
      lastInteraction: timestamp
    };
    
    // Create friendship document for User 2 (has User 1 as friend)
    const friendship2 = {
      userId: user2Id,
      userPhone: FirebaseService.formatPhoneNumber(user2Phone),
      userEmail: user2Email,
      userName: user2Name,
      friendId: user1Id,
      friendPhone: FirebaseService.formatPhoneNumber(user1Phone),
      friendEmail: user1Email,
      friendName: user1Name,
      status: 'active',
      createdAt: timestamp,
      requestId: requestId,
      lastInteraction: timestamp
    };
    
    // Add both friendship documents
    const [friend1Doc, friend2Doc] = await Promise.all([
      addDoc(friendsRef, friendship1),
      addDoc(friendsRef, friendship2)
    ]);
    
    console.log('✅ Friendship created:', {
      friend1DocId: friend1Doc.id,
      friend2DocId: friend2Doc.id
    });
    
    return { 
      success: true, 
      message: 'Friendship created successfully!',
      friendship1Id: friend1Doc.id,
      friendship2Id: friend2Doc.id
    };
    
  } catch (error) {
    console.error('❌ Error creating friendship:', error);
    return { 
      success: false, 
      error: 'Failed to create friendship',
      message: 'Something went wrong creating the friendship'
    };
  }
},

/**
 * Enhanced accept friend request with friendship creation
 * @param {string} requestId - Friend request document ID
 * @param {string} currentUserPhone - Current user's phone number
 * @returns {Object} - { success: boolean, message: string }
 */
acceptFriendRequest: async (requestId, currentUserPhone) => {
  try {
    console.log('📋 Starting enhanced friend request acceptance...');
    
    const requestRef = doc(db, 'friendRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      return { success: false, error: 'Friend request not found' };
    }
    
    const requestData = requestDoc.data();
    const formattedCurrentPhone = FirebaseService.formatPhoneNumber(currentUserPhone);
    
    // Verify the current user is the recipient
    if (requestData.recipientPhone !== formattedCurrentPhone) {
      return { success: false, error: 'Unauthorized action' };
    }
    
    console.log('✅ Request validation passed');
    
    // Get current user data
    const currentUserResult = await FirebaseService.checkUserExists(formattedCurrentPhone);
    if (!currentUserResult.exists) {
      return { success: false, error: 'Current user not found in database' };
    }
    
    // Get sender user data
    const senderResult = await FirebaseService.checkUserExists(requestData.senderPhone);
    if (!senderResult.exists) {
      return { success: false, error: 'Sender user not found in database' };
    }
    
    console.log('✅ Both users found in database');
    
    // Update request status to accepted
    await updateDoc(requestRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp()
    });
    
    console.log('✅ Request status updated to accepted');
    
    // Create bidirectional friendship
    const friendshipResult = await FirebaseService.createFriendship({
      user1Phone: requestData.senderPhone,
      user1Name: requestData.senderName || `${senderResult.userData.FirstName || ''} ${senderResult.userData.LastName || ''}`.trim(),
      user1Email: requestData.senderEmail || senderResult.userData.Email,
      user1Id: requestData.senderId,
      
      user2Phone: formattedCurrentPhone,
      user2Name: `${requestData.recipientFirstName} ${requestData.recipientLastName}`,
      user2Email: currentUserResult.userData.Email,
      user2Id: currentUserResult.userData.id,
      
      requestId: requestId
    });
    
    if (!friendshipResult.success) {
      console.error('❌ Failed to create friendship:', friendshipResult.error);
      return { success: false, error: 'Failed to create friendship' };
    }
    
    console.log('✅ Friendship created successfully');
    
    // Create notification for the sender
    await FirebaseService.createNotification({
      userId: requestData.senderId,
      recipientPhone: requestData.senderPhone,
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      message: `${requestData.recipientFirstName} ${requestData.recipientLastName} accepted your friend request!`,
      priority: 'normal',
      data: {
        requestId: requestId,
        accepterPhone: formattedCurrentPhone,
        accepterName: `${requestData.recipientFirstName} ${requestData.recipientLastName}`,
        friendshipId: friendshipResult.friendship1Id
      }
    });
    
    console.log('✅ Acceptance notification sent');
    
    return { 
      success: true, 
      message: 'Friend request accepted successfully! You are now connected.',
      friendshipCreated: true
    };
    
  } catch (error) {
    console.error('❌ Error accepting friend request:', error);
    return { 
      success: false, 
      error: 'Failed to accept friend request' 
    };
  }
},

/**
 * Get friends for a specific user
 * @param {string} userPhone - User's phone number
 * @returns {Object} - { success: boolean, friends: array, error?: string }
 */
getFriendsForUser: async (userPhone) => {
  try {
    const formattedPhone = FirebaseService.formatPhoneNumber(userPhone);
    console.log('👥 Getting friends for:', formattedPhone);
    
    const friendsRef = collection(db, 'friends');
    const q = query(
      friendsRef,
      where('userPhone', '==', formattedPhone),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const friends = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      friends.push({
        id: doc.id,
        friendId: data.friendId,
        friendPhone: data.friendPhone,
        friendEmail: data.friendEmail,
        friendName: data.friendName,
        status: 'Online', // You can enhance this with real status later
        location: 'Unknown', // You can enhance this with real location later
        distance: 'Unknown', // You can enhance this with real distance later
        battery: '100%', // You can enhance this with real battery later
        avatar: null, // You can enhance this with real avatars later
        createdAt: data.createdAt,
        lastInteraction: data.lastInteraction
      });
    });
    
    console.log(`✅ Found ${friends.length} friends for ${formattedPhone}`);
    
    return { success: true, friends };
    
  } catch (error) {
    console.error('❌ Error getting friends:', error);
    return { success: false, friends: [], error: error.message };
  }
},

/**
 * Listen to friends list changes for real-time updates
 * @param {string} userPhone - User's phone number
 * @param {Function} callback - Callback function to handle friends updates
 * @returns {Function} - Unsubscribe function
 */
listenToFriends: (userPhone, callback) => {
  try {
    const formattedPhone = FirebaseService.formatPhoneNumber(userPhone);
    console.log('👥 Setting up friends listener for:', formattedPhone);
    
    const friendsRef = collection(db, 'friends');
    const q = query(
      friendsRef,
      where('userPhone', '==', formattedPhone),
      where('status', '==', 'active')
    );
    
    return onSnapshot(q, (snapshot) => {
      const friends = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        friends.push({
          id: doc.id,
          friendId: data.friendId,
          friendPhone: data.friendPhone,
          friendEmail: data.friendEmail,
          friendName: data.friendName,
          status: 'Online', // Enhance later
          location: 'Unknown', // Enhance later
          distance: 'Unknown', // Enhance later
          battery: '100%', // Enhance later
          avatar: null, // Enhance later
          createdAt: data.createdAt,
          lastInteraction: data.lastInteraction
        });
      });
      
      console.log(`👥 Friends list updated: ${friends.length} friends`);
      callback(friends);
      
    }, (error) => {
      console.error('❌ Error listening to friends:', error);
      callback([]);
    });
    
  } catch (error) {
    console.error('❌ Error setting up friends listener:', error);
    return () => {}; // Return empty unsubscribe function
  }
},

/**
 * Remove a friendship (unfriend)
 * @param {string} userPhone - Current user's phone
 * @param {string} friendPhone - Friend's phone to remove
 * @returns {Object} - { success: boolean, message: string }
 */
removeFriend: async (userPhone, friendPhone) => {
  try {
    const formattedUserPhone = FirebaseService.formatPhoneNumber(userPhone);
    const formattedFriendPhone = FirebaseService.formatPhoneNumber(friendPhone);
    
    console.log('💔 Removing friendship between:', formattedUserPhone, 'and', formattedFriendPhone);
    
    const friendsRef = collection(db, 'friends');
    
    // Find and remove both friendship documents
    const q1 = query(
      friendsRef,
      where('userPhone', '==', formattedUserPhone),
      where('friendPhone', '==', formattedFriendPhone)
    );
    
    const q2 = query(
      friendsRef,
      where('userPhone', '==', formattedFriendPhone),
      where('friendPhone', '==', formattedUserPhone)
    );
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);
    
    const updates = [];
    
    snapshot1.forEach((doc) => {
      updates.push(updateDoc(doc.ref, {
        status: 'removed',
        removedAt: serverTimestamp()
      }));
    });
    
    snapshot2.forEach((doc) => {
      updates.push(updateDoc(doc.ref, {
        status: 'removed',
        removedAt: serverTimestamp()
      }));
    });
    
    await Promise.all(updates);
    
    console.log('✅ Friendship removed');
    return { success: true, message: 'Friend removed successfully' };
    
  } catch (error) {
    console.error('❌ Error removing friend:', error);
    return { success: false, error: 'Failed to remove friend' };
  }
},


  // Send SOS notifications to friends
  sendSOSNotifications: async (location) => {
    try {
      const currentUser = auth.currentUser;
      const userId = currentUser ? currentUser.uid : `temp_${Date.now()}`;
      const userEmail = currentUser ? currentUser.email : 'guest@alertnet.com';

      const friendsResult = await FirebaseService.getFriends();
      if (!friendsResult.success || friendsResult.friends.length === 0) {
        return { success: false, error: 'No friends found', notificationsSent: 0 };
      }

      const locationText = location 
        ? `Location: https://maps.google.com/?q=${location.latitude},${location.longitude}`
        : 'Location unavailable';

      const notifications = [];
      for (const friend of friendsResult.friends) {
        const notification = {
          senderId: userId,
          senderEmail: userEmail,
          recipientPhone: friend.phone,
          recipientName: `${friend.firstName} ${friend.lastName}`,
          message: `🚨 EMERGENCY: Your friend needs help! ${locationText}`,
          location: location,
          createdAt: serverTimestamp(),
          status: 'sent'
        };

        const docRef = await addDoc(collection(db, 'sosNotifications'), notification);
        notifications.push({ id: docRef.id, ...notification });
      }

      return { 
        success: true, 
        notificationsSent: notifications.length,
        notifications 
      };
    } catch (error) {
      console.error('Error sending SOS notifications:', error);
      return { success: false, error: error.message, notificationsSent: 0 };
    }
  }
};