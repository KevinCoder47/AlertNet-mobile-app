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
  limit,
  writeBatch,
  deleteDoc
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
        userId: notificationData.userId,
        recipientPhone: notificationData.recipientPhone,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        read: false,
        deleted: false,
        createdAt: serverTimestamp(),
        priority: notificationData.priority || 'normal',
        isUrgent: notificationData.isUrgent || false
      };
      
      const notificationsRef = collection(db, 'notifications');
      const docRef = await addDoc(notificationsRef, notification);
      
      console.log('Notification created with ID:', docRef.id);
      
      // Optional: Try to send push notification
      try {
        await FirebaseService.sendPushNotification({
          ...notification,
          notificationId: docRef.id
        });
      } catch (pushError) {
        console.warn('Push notification failed (non-critical):', pushError);
      }
      
      return { success: true, notificationId: docRef.id };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Enhanced listenToNotifications with better read/unread tracking
   * @param {string} userPhone - User's phone number
   * @param {Function} callback - Callback function to handle notification updates
   * @returns {Function} - Unsubscribe function
   */
  listenToNotifications: (userPhone, callback) => {
    try {
      const formattedPhone = FirebaseService.formatPhoneNumber(userPhone);
      console.log('Setting up enhanced notification listener for:', formattedPhone);
      
      const notificationsRef = collection(db, 'notifications');
      
      const q = query(
        notificationsRef,
        where('recipientPhone', '==', formattedPhone),
        where('deleted', '!=', true),
        limit(100)
      );
      
      return onSnapshot(q, (snapshot) => {
        const notifications = [];
        const changes = [];
        let hasNewUnreadNotifications = false;
        
        snapshot.docChanges().forEach((change) => {
          const notificationData = {
            id: change.doc.id,
            ...change.doc.data()
          };
          
          // Track changes for popup triggering
          if (change.type === 'added' && !notificationData.read) {
            console.log('New unread notification received:', notificationData.title);
            changes.push({ type: 'new', notification: notificationData });
            hasNewUnreadNotifications = true;
          } else if (change.type === 'modified') {
            console.log('Notification updated:', notificationData.title, 'Read:', notificationData.read);
            changes.push({ type: 'updated', notification: notificationData });
          }
          
          notifications.push(notificationData);
        });
        
        // Sort notifications client-side by creation time (newest first)
        const sortedNotifications = notifications.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          const aTime = a.createdAt.toMillis ? a.createdAt.toMillis() : a.createdAt;
          const bTime = b.createdAt.toMillis ? b.createdAt.toMillis() : b.createdAt;
          return bTime - aTime;
        });
        
        // Count unread notifications accurately
        const unreadCount = sortedNotifications.filter(n => !n.read && !n.deleted).length;
        
        console.log(`Processed ${sortedNotifications.length} total notifications, ${unreadCount} unread for ${formattedPhone}`);
        
        // Call callback with comprehensive data
        callback({
          notifications: sortedNotifications,
          changes: changes,
          unreadCount: unreadCount,
          hasNewUnreadNotifications: hasNewUnreadNotifications
        });
      }, (error) => {
        console.error('Error listening to notifications:', error);
        callback({ 
          notifications: [], 
          changes: [], 
          unreadCount: 0, 
          hasNewUnreadNotifications: false,
          error: error.message 
        });
      });
      
    } catch (error) {
      console.error('Error setting up notification listener:', error);
      return () => {};
    }
  },

  /**
   * Enhanced mark notification as read with better error handling
   * @param {string} notificationId - Notification document ID
   * @returns {Object} - { success: boolean, error?: string }
   */
  markNotificationAsRead: async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      
      // First verify the notification exists
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (!notificationDoc.exists()) {
        console.error('Notification not found:', notificationId);
        return { success: false, error: 'Notification not found' };
      }
      
      const notificationData = notificationDoc.data();
      
      // Check if already read to avoid unnecessary updates
      if (notificationData.read) {
        console.log('Notification already marked as read:', notificationId);
        return { success: true, message: 'Already read' };
      }
      
      // Update the notification
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
        lastModified: serverTimestamp()
      });
      
      console.log('Notification marked as read successfully:', notificationId);
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Enhanced mark all notifications as read with batch processing
   * @param {string} userPhone - User's phone number
   * @returns {Object} - { success: boolean, updatedCount?: number, error?: string }
   */
  markAllNotificationsAsRead: async (userPhone) => {
    try {
      console.log('Starting bulk mark as read for:', userPhone);
      
      const formattedPhone = FirebaseService.formatPhoneNumber(userPhone);
      const notificationsRef = collection(db, 'notifications');
      
      // Query for unread notifications only
      const q = query(
        notificationsRef,
        where('recipientPhone', '==', formattedPhone),
        where('read', '==', false),
        where('deleted', '!=', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No unread notifications found');
        return { success: true, updatedCount: 0, message: 'No unread notifications' };
      }
      
      console.log(`Found ${querySnapshot.size} unread notifications to mark as read`);
      
      // Use Firestore batch for better performance
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();
      
      querySnapshot.forEach((docSnapshot) => {
        const docRef = doc(db, 'notifications', docSnapshot.id);
        batch.update(docRef, {
          read: true,
          readAt: timestamp,
          lastModified: timestamp
        });
      });
      
      // Execute batch update
      await batch.commit();
      
      console.log(`Successfully marked ${querySnapshot.size} notifications as read`);
      return { success: true, updatedCount: querySnapshot.size };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get unread notification count for a user
   * @param {string} userPhone - User's phone number
   * @returns {Object} - { success: boolean, count: number, error?: string }
   */
  getUnreadNotificationCount: async (userPhone) => {
    try {
      const formattedPhone = FirebaseService.formatPhoneNumber(userPhone);
      const notificationsRef = collection(db, 'notifications');
      
      const q = query(
        notificationsRef,
        where('recipientPhone', '==', formattedPhone),
        where('read', '==', false),
        where('deleted', '!=', true)
      );
      
      const querySnapshot = await getDocs(q);
      const count = querySnapshot.size;
      
      console.log(`Unread notification count for ${formattedPhone}: ${count}`);
      return { success: true, count };
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return { success: false, count: 0, error: error.message };
    }
  },

  /**
   * Soft delete a notification (mark as deleted rather than removing)
   * @param {string} notificationId - Notification document ID
   * @returns {Object} - { success: boolean, error?: string }
   */
  deleteNotification: async (notificationId) => {
    try {
      console.log('Soft deleting notification:', notificationId);
      
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (!notificationDoc.exists()) {
        return { success: false, error: 'Notification not found' };
      }
      
      await updateDoc(notificationRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        lastModified: serverTimestamp()
      });
      
      console.log('Notification soft deleted:', notificationId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Clear all notifications for a user (soft delete)
   * @param {string} userPhone - User's phone number
   * @returns {Object} - { success: boolean, deletedCount?: number, error?: string }
   */
  clearAllNotifications: async (userPhone) => {
    try {
      const formattedPhone = FirebaseService.formatPhoneNumber(userPhone);
      const notificationsRef = collection(db, 'notifications');
      
      const q = query(
        notificationsRef,
        where('recipientPhone', '==', formattedPhone),
        where('deleted', '!=', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: true, deletedCount: 0, message: 'No notifications to clear' };
      }
      
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();
      
      querySnapshot.forEach((docSnapshot) => {
        const docRef = doc(db, 'notifications', docSnapshot.id);
        batch.update(docRef, {
          deleted: true,
          deletedAt: timestamp,
          lastModified: timestamp
        });
      });
      
      await batch.commit();
      
      console.log(`Cleared ${querySnapshot.size} notifications`);
      return { success: true, deletedCount: querySnapshot.size };
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Placeholder for push notifications (FCM integration)
   * @param {Object} notificationData - Notification data
   */
  sendPushNotification: async (notificationData) => {
    console.log('Push notification would be sent:', {
      title: notificationData.title,
      body: notificationData.message,
      data: notificationData.data
    });
    
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
    console.log('Formatting phone:', phone);
    
    const cleaned = phone.replace(/\D/g, '');
    console.log('Cleaned:', cleaned);
    
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      const formatted = '+27' + cleaned.substring(1);
      console.log('SA local to international:', formatted);
      return formatted;
    }
    
    if (cleaned.startsWith('27') && cleaned.length === 11) {
      const formatted = '+' + cleaned;
      console.log('Added + to country code:', formatted);
      return formatted;
    }
    
    if (phone.startsWith('+')) {
      console.log('Already international:', phone);
      return phone;
    }
    
    const formatted = '+27' + cleaned;
    console.log('Default formatting:', formatted);
    return formatted;
  },

  /**
   * Check if a user exists by phone number
   * @param {string} phone - Phone number to check
   * @returns {Object} - { exists: boolean, userData: object|null, error?: string }
   */
  checkUserExists: async (phone) => {
    try {
      console.log('Original phone input:', phone);
      
      const formattedPhone = FirebaseService.formatPhoneNumber(phone);
      console.log('Querying for Phone ==', formattedPhone);
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('Phone', '==', formattedPhone));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No user found with phone:', formattedPhone);
        return { exists: false, userData: null };
      }
      
      const userData = querySnapshot.docs[0].data();
      console.log('Found match with formatted phone!');
      return { 
        exists: true, 
        userData: {
          id: querySnapshot.docs[0].id,
          ...userData
        }
      };
    } catch (error) {
      console.error('Error checking if user exists:', error);
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
      
      console.log('Checking existing requests between:');
      console.log('    Sender:', formattedSenderPhone);
      console.log('    Recipient:', formattedRecipientPhone);
      
      const friendRequestsRef = collection(db, 'friendRequests');
      
      const q1 = query(
        friendRequestsRef,
        where('senderPhone', '==', formattedSenderPhone),
        where('recipientPhone', '==', formattedRecipientPhone),
        where('status', '==', 'pending')
      );
      
      const q2 = query(
        friendRequestsRef,
        where('senderPhone', '==', formattedRecipientPhone),
        where('recipientPhone', '==', formattedSenderPhone),
        where('status', '==', 'pending')
      );
      
      console.log('Executing queries...');
      const [outgoingSnapshot, incomingSnapshot] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);
      
      if (!outgoingSnapshot.empty) {
        console.log('Found outgoing request');
        return { 
          exists: true, 
          requestData: { id: outgoingSnapshot.docs[0].id, ...outgoingSnapshot.docs[0].data() },
          direction: 'outgoing'
        };
      }
      
      if (!incomingSnapshot.empty) {
        console.log('Found incoming request');
        return { 
          exists: true, 
          requestData: { id: incomingSnapshot.docs[0].id, ...incomingSnapshot.docs[0].data() },
          direction: 'incoming'
        };
      }
      
      console.log('No existing requests found');
      return { exists: false, requestData: null };
      
    } catch (error) {
      console.error('Error checking existing friend request:', error);
      return { exists: false, requestData: null, error: error.message };
    }
  },

  /**
   * Enhanced sendFriendRequest with profile picture and complete user data
   * @param {Object} friendData - { firstName, lastName, phone, senderPhone, senderEmail, senderUserData }
   * @returns {Object} - { success: boolean, message: string, requestId?: string }
   */
  sendFriendRequest: async (friendData) => {
    try {
      console.log('Starting enhanced friend request process...');
      
      const currentUser = auth.currentUser;
      const { firstName, lastName, phone, senderPhone, senderEmail, senderUserData } = friendData;
      
      const senderId = currentUser ? currentUser.uid : `temp_${Date.now()}`;
      const userEmail = senderEmail || (currentUser ? currentUser.email : 'guest@alertnet.com');
      
      console.log('=== SENDER DATA DEBUG ===');
      console.log('senderUserData received:', senderUserData);
      console.log('senderUserData keys:', senderUserData ? Object.keys(senderUserData) : 'null');
      
      let senderProfileData = senderUserData;
      if (!senderProfileData) {
        console.log('No senderUserData provided, trying to fetch from Firebase...');
        const senderResult = await FirebaseService.checkUserExists(senderPhone);
        if (senderResult.exists) {
          senderProfileData = senderResult.userData;
          console.log('Retrieved sender data from Firebase:', senderProfileData);
        }
      }
      
      const senderName = senderProfileData?.name || 
                        senderProfileData?.FirstName || 
                        senderProfileData?.firstName ||
                        currentUser?.displayName || 
                        'AlertNet User';
      const senderSurname = senderProfileData?.surname || 
                           senderProfileData?.LastName || 
                           senderProfileData?.lastName ||
                           '';
      
      const senderProfilePicture = senderProfileData?.imageUrl || 
                                  senderProfileData?.localImagePath || 
                                  senderProfileData?.profilePicture ||
                                  senderProfileData?.image ||
                                  null;
      
      console.log('Extracted sender info:', {
        senderName,
        senderSurname,
        senderProfilePicture: senderProfilePicture ? 'URL present' : 'null',
        senderProfilePictureUrl: senderProfilePicture
      });
      console.log('=== END SENDER DATA DEBUG ===');
      
      const formattedRecipientPhone = FirebaseService.formatPhoneNumber(phone);
      const formattedSenderPhone = FirebaseService.formatPhoneNumber(senderPhone);
      
      console.log('Sender:', senderName, senderSurname);
      console.log('Sender phone:', formattedSenderPhone);
      console.log('Recipient phone:', formattedRecipientPhone);
      
      const userCheck = await FirebaseService.checkUserExists(formattedRecipientPhone);
      if (userCheck.error) {
        console.error('Error checking user database');
        return { success: false, error: 'Error checking user database' };
      }
      
      if (!userCheck.exists) {
        console.log('User does not exist on platform');
        return { 
          success: false, 
          error: 'This person is not on AlertNet',
          message: 'This person is not on AlertNet'
        };
      }
      
      console.log('Recipient exists on platform');
      
      const existingRequest = await FirebaseService.checkExistingFriendRequest(formattedSenderPhone, formattedRecipientPhone);
      if (existingRequest.error) {
        console.error('Error checking existing requests');
        return { success: false, error: 'Error checking existing requests' };
      }
      
      if (existingRequest.exists) {
        if (existingRequest.direction === 'outgoing') {
          console.log('Outgoing request already exists');
          return { 
            success: false, 
            error: 'Friend request already sent',
            message: 'You have already sent a friend request to this person'
          };
        } else {
          console.log('Incoming request already exists');
          return { 
            success: false, 
            error: 'Pending request exists',
            message: 'This person has already sent you a friend request. Check your notifications.'
          };
        }
      }
      
      console.log('No existing requests found, proceeding...');
      
      const friendRequest = {
        senderId: senderId,
        senderEmail: userEmail,
        senderPhone: formattedSenderPhone,
        senderName: senderName,
        senderSurname: senderSurname,
        senderProfilePicture: senderProfilePicture,
        recipientFirstName: firstName,
        recipientLastName: lastName,
        recipientPhone: formattedRecipientPhone,
        recipientUserId: userCheck.userData.id,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      
      console.log('Creating enhanced friend request document...');
      const friendRequestsRef = collection(db, 'friendRequests');
      const docRef = await addDoc(friendRequestsRef, friendRequest);
      
      console.log('Friend request created with ID:', docRef.id);
      
      const notificationResult = await FirebaseService.createNotification({
        userId: userCheck.userData.id,
        recipientPhone: formattedRecipientPhone,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${senderName} ${senderSurname} wants to connect with you on AlertNet`,
        priority: 'normal',
        data: {
          requestId: docRef.id,
          senderPhone: formattedSenderPhone,
          senderName: senderName,
          senderSurname: senderSurname,
          senderEmail: userEmail,
          profilePicture: senderProfilePicture,
          action: 'view_request'
        }
      });
      
      if (notificationResult.success) {
        console.log('Enhanced notification created successfully');
      } else {
        console.warn('Failed to create notification:', notificationResult.error);
      }
      
      return { 
        success: true, 
        message: 'Friend request sent successfully!',
        requestId: docRef.id,
        notificationSent: notificationResult.success
      };

    } catch (error) {
      console.error('Error sending friend request:', error);
      return { 
        success: false, 
        error: 'Failed to send friend request',
        message: 'Something went wrong. Please try again.'
      };
    }
  },

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
      
      console.log('Creating bidirectional friendship...');
      
      const friendsRef = collection(db, 'friends');
      const timestamp = serverTimestamp();
      
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
      
      const [friend1Doc, friend2Doc] = await Promise.all([
        addDoc(friendsRef, friendship1),
        addDoc(friendsRef, friendship2)
      ]);
      
      console.log('Friendship created:', {
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
      console.error('Error creating friendship:', error);
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
      console.log('Starting enhanced friend request acceptance...');
      
      const requestRef = doc(db, 'friendRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        return { success: false, error: 'Friend request not found' };
      }
      
      const requestData = requestDoc.data();
      const formattedCurrentPhone = FirebaseService.formatPhoneNumber(currentUserPhone);
      
      if (requestData.recipientPhone !== formattedCurrentPhone) {
        return { success: false, error: 'Unauthorized action' };
      }
      
      console.log('Request validation passed');
      
      const currentUserResult = await FirebaseService.checkUserExists(formattedCurrentPhone);
      if (!currentUserResult.exists) {
        return { success: false, error: 'Current user not found in database' };
      }
      
      const senderResult = await FirebaseService.checkUserExists(requestData.senderPhone);
      if (!senderResult.exists) {
        return { success: false, error: 'Sender user not found in database' };
      }
      
      console.log('Both users found in database');
      
      await updateDoc(requestRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      
      console.log('Request status updated to accepted');
      
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
        console.error('Failed to create friendship:', friendshipResult.error);
        return { success: false, error: 'Failed to create friendship' };
      }
      
      console.log('Friendship created successfully');
      
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
      
      console.log('Acceptance notification sent');
      
      return { 
        success: true, 
        message: 'Friend request accepted successfully! You are now connected.',
        friendshipCreated: true
      };
      
    } catch (error) {
      console.error('Error accepting friend request:', error);
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
      
      if (requestData.recipientPhone !== formattedCurrentPhone) {
        return { success: false, error: 'Unauthorized action' };
      }
      
      await updateDoc(requestRef, {
        status: 'declined',
        declinedAt: serverTimestamp()
      });
      
      console.log('Friend request declined');
      return { 
        success: true, 
        message: 'Friend request declined' 
      };
      
    } catch (error) {
      console.error('Error declining friend request:', error);
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
        console.log(`Found ${requests.length} pending requests for ${formattedPhone}`);
        callback(requests);
      }, (error) => {
        console.error('Error listening to friend requests:', error);
        callback([]);
      });
      
    } catch (error) {
      console.error('Error setting up friend request listener:', error);
      return () => {};
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
      console.log('Getting friends for:', formattedPhone);
      
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
          status: 'Online',
          location: 'Unknown',
          distance: 'Unknown',
          battery: '100%',
          avatar: null,
          createdAt: data.createdAt,
          lastInteraction: data.lastInteraction
        });
      });
      
      console.log(`Found ${friends.length} friends for ${formattedPhone}`);
      
      return { success: true, friends };
      
    } catch (error) {
      console.error('Error getting friends:', error);
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
      console.log('Setting up friends listener for:', formattedPhone);
      
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
            status: 'Online',
            location: 'Unknown',
            distance: 'Unknown',
            battery: '100%',
            avatar: null,
            createdAt: data.createdAt,
            lastInteraction: data.lastInteraction
          });
        });
        
        console.log(`Friends list updated: ${friends.length} friends`);
        callback(friends);
        
      }, (error) => {
        console.error('Error listening to friends:', error);
        callback([]);
      });
      
    } catch (error) {
      console.error('Error setting up friends listener:', error);
      return () => {};
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
      
      console.log('Removing friendship between:', formattedUserPhone, 'and', formattedFriendPhone);
      
      const friendsRef = collection(db, 'friends');
      
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
      
      console.log('Friendship removed');
      return { success: true, message: 'Friend removed successfully' };
      
    } catch (error) {
      console.error('Error removing friend:', error);
      return { success: false, error: 'Failed to remove friend' };
    }
  },

  /**
   * Get friends for current user (legacy method for backward compatibility)
   * @returns {Object} - { success: boolean, friends: array, error?: string }
   */
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

  // ========================
  // SOS NOTIFICATION SYSTEM
  // ========================

  /**
   * Send SOS notifications to friends
   * @param {Object} location - Location object with latitude and longitude
   * @param {Object} userData - Current user data
   * @param {string} sosSessionId - SOS session ID
   * @returns {Object} - { success: boolean, notificationsSent: number, error?: string }
   */
  sendSOSNotifications: async (location, userData, sosSessionId) => {
    try {
      const currentUser = auth.currentUser;
      const userId = currentUser ? currentUser.uid : userData?.userId || `temp_${Date.now()}`;
      const userEmail = currentUser ? currentUser.email : userData?.email || 'guest@alertnet.com';
      const userPhone = userData?.phone || userData?.phoneNumber || userData?.Phone;

      if (!userPhone) {
        return { success: false, error: 'User phone number not found', notificationsSent: 0 };
      }

      // Get user's friends
      const friendsResult = await FirebaseService.getFriendsForUser(userPhone);
      if (!friendsResult.success || friendsResult.friends.length === 0) {
        console.log('No friends found for SOS notifications');
        return { success: false, error: 'No friends found', notificationsSent: 0 };
      }

      const locationText = location 
        ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
        : 'Location unavailable';

      const userName = userData?.name || userData?.firstName || 'Your friend';
      let notificationsSent = 0;

      // Send notifications to each friend
      for (const friend of friendsResult.friends) {
        try {
          const notificationResult = await FirebaseService.createNotification({
            userId: friend.friendId,
            recipientPhone: friend.friendPhone,
            type: 'sos',
            title: 'EMERGENCY ALERT',
            message: `${userName} has activated SOS and needs immediate help!`,
            priority: 'high',
            isUrgent: true,
            data: {
              sosSessionId: sosSessionId,
              senderPhone: userPhone,
              senderName: userName,
              location: location,
              locationUrl: locationText,
              action: 'view_emergency',
              timestamp: Date.now()
            }
          });

          if (notificationResult.success) {
            notificationsSent++;
            console.log(`SOS notification sent to ${friend.friendName}`);
          } else {
            console.error(`Failed to send SOS notification to ${friend.friendName}:`, notificationResult.error);
          }
        } catch (error) {
          console.error(`Error sending SOS notification to ${friend.friendName}:`, error);
        }
      }

      console.log(`SOS notifications sent: ${notificationsSent}/${friendsResult.friends.length}`);
      
      return { 
        success: true, 
        notificationsSent: notificationsSent,
        totalFriends: friendsResult.friends.length
      };
    } catch (error) {
      console.error('Error sending SOS notifications:', error);
      return { success: false, error: error.message, notificationsSent: 0 };
    }
  },

  /**
   * Send SOS resolved notification to friends
   * @param {string} sosSessionId - SOS session ID
   * @param {Object} userData - Current user data
   * @returns {Object} - { success: boolean, notificationsSent: number }
   */
  sendSOSResolvedNotifications: async (sosSessionId, userData) => {
    try {
      const userPhone = userData?.phone || userData?.phoneNumber || userData?.Phone;
      
      if (!userPhone) {
        return { success: false, error: 'User phone number not found', notificationsSent: 0 };
      }

      const friendsResult = await FirebaseService.getFriendsForUser(userPhone);
      if (!friendsResult.success || friendsResult.friends.length === 0) {
        return { success: false, error: 'No friends found', notificationsSent: 0 };
      }

      const userName = userData?.name || userData?.firstName || 'Your friend';
      let notificationsSent = 0;

      for (const friend of friendsResult.friends) {
        try {
          const notificationResult = await FirebaseService.createNotification({
            userId: friend.friendId,
            recipientPhone: friend.friendPhone,
            type: 'sos_resolved',
            title: 'Emergency Resolved',
            message: `${userName} is now safe. The emergency has been resolved.`,
            priority: 'normal',
            data: {
              sosSessionId: sosSessionId,
              senderPhone: userPhone,
              senderName: userName,
              action: 'emergency_resolved',
              timestamp: Date.now()
            }
          });

          if (notificationResult.success) {
            notificationsSent++;
            console.log(`SOS resolved notification sent to ${friend.friendName}`);
          }
        } catch (error) {
          console.error(`Error sending SOS resolved notification to ${friend.friendName}:`, error);
        }
      }

      return { 
        success: true, 
        notificationsSent: notificationsSent,
        totalFriends: friendsResult.friends.length
      };
    } catch (error) {
      console.error('Error sending SOS resolved notifications:', error);
      return { success: false, error: error.message, notificationsSent: 0 };
    }
  },

  // ========================
  // UTILITY METHODS
  // ========================

  /**
   * Clean up old notifications (older than 30 days)
   * @param {string} userPhone - User's phone number
   * @returns {Object} - { success: boolean, deletedCount?: number }
   */
  cleanupOldNotifications: async (userPhone) => {
    try {
      const formattedPhone = FirebaseService.formatPhoneNumber(userPhone);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('recipientPhone', '==', formattedPhone),
        where('createdAt', '<', thirtyDaysAgo)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: true, deletedCount: 0 };
      }

      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`Cleaned up ${querySnapshot.size} old notifications`);
      return { success: true, deletedCount: querySnapshot.size };
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get notification statistics for a user
   * @param {string} userPhone - User's phone number
   * @returns {Object} - Statistics object
   */
  getNotificationStats: async (userPhone) => {
    try {
      const formattedPhone = FirebaseService.formatPhoneNumber(userPhone);
      const notificationsRef = collection(db, 'notifications');
      
      const q = query(
        notificationsRef,
        where('recipientPhone', '==', formattedPhone),
        where('deleted', '!=', true)
      );

      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map(doc => doc.data());

      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        read: notifications.filter(n => n.read).length,
        urgent: notifications.filter(n => n.isUrgent || n.priority === 'high').length,
        byType: {}
      };

      // Count by type
      notifications.forEach(notification => {
        const type = notification.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });

      return { success: true, stats };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { success: false, error: error.message };
    }
  }
};