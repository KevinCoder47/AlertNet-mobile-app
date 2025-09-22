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
  deleteDoc,
  arrayUnion
} from 'firebase/firestore';

export const FirebaseService = {
  // Auth methods
  signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password),
  signOut: () => signOut(auth),
  onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),
  getCurrentUser: () => auth.currentUser,

  // ========================
  // USER PRESENCE
  // ========================

  /**
   * Updates the status of a user in Firestore.
   * @param {string} userId - The ID of the user to update.
   * @param {Object} statusData - The data to update, e.g., { status: 'online' } or { status: 'offline', lastSeen: serverTimestamp() }.
   * @returns {Promise<Object>} - { success: boolean, error?: string }
   */
  updateUserStatus: async (userId, statusData) => {
    if (!userId) {
      return { success: false, error: "User ID is required." };
    }
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, statusData);
      return { success: true };
    } catch (error) {
      console.error(`Error updating status for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Listens for real-time updates for a specific user.
   * @param {string} userId - The ID of the user to listen to.
   * @param {Function} callback - Function to call with the user's data.
   * @returns {Function} - Unsubscribe function.
   */
  listenToUser: (userId, callback) => {
    if (!userId) {
      console.warn("listenToUser called with no userId.");
      return () => {};
    }
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (docSnap) => {
      callback(docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null);
    }, (error) => {
      console.error(`Error listening to user ${userId}:`, error);
      callback(null);
    });
  },

  // ========================
  // ENHANCED USER DATA FETCHING
  // ========================

  /**
   * Get complete user data by user ID from the users collection
   * @param {string} userId - User document ID
   * @returns {Object} - { success: boolean, userData: object|null, error?: string }
   */
  getUserById: async (userId) => {
    try {
      console.log('Fetching user data by ID:', userId);
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        console.log('User document not found:', userId);
        return { success: false, userData: null, error: 'User not found' };
      }
      
      const userData = userDoc.data();
      console.log('Found user data:', userData);
      
      return { 
        success: true, 
        userData: {
          id: userDoc.id,
          ...userData
        }
      };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return { success: false, userData: null, error: error.message };
    }
  },

  /**
   * Get complete user data by phone number (enhanced to get full user doc)
   * @param {string} phone - Phone number to check
   * @returns {Object} - { exists: boolean, userData: object|null, error?: string }
   */
  getUserByPhone: async (phone) => {
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
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      console.log('Found user by phone with complete data!');
      
      return { 
        exists: true, 
        userData: {
          id: userDoc.id,
          ...userData
        }
      };
    } catch (error) {
      console.error('Error getting user by phone:', error);
      return { exists: false, userData: null, error: error.message };
    }
  },

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
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      return onSnapshot(q, (snapshot) => {
        // Correctly map all documents from the snapshot for the full list
        const allNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const changes = [];
        let hasNewUnreadNotifications = false;
        
        snapshot.docChanges().forEach((change) => {
          const notificationData = {
            id: change.doc.id,
            ...change.doc.data(),
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
        });
        
        // Sort the complete list of notifications, not just the changes
        const sortedNotifications = allNotifications.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          const aTime = a.createdAt.toMillis ? a.createdAt.toMillis() : a.createdAt;
          const bTime = b.createdAt.toMillis ? b.createdAt.toMillis() : b.createdAt;
          return bTime - aTime;
        });
        
        // Count unread notifications from the complete list for accuracy
        const unreadCount = sortedNotifications.filter(n => !n.read && !n.deleted).length;
        
        console.log(`Processed ${sortedNotifications.length} total notifications, ${unreadCount} unread for ${formattedPhone}`);
        
        // Call callback with the complete, correct data
        callback({
          notifications: sortedNotifications,
          changes: changes,
          unreadCount: unreadCount,
          hasNewUnreadNotifications: hasNewUnreadNotifications,
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
   * Check if a user exists by phone number (backward compatibility)
   * @param {string} phone - Phone number to check
   * @returns {Object} - { exists: boolean, userData: object|null, error?: string }
   */
  checkUserExists: async (phone) => {
    const result = await FirebaseService.getUserByPhone(phone);
    return result;
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
   * Enhanced sendFriendRequest with proper user data fetching
   * @param {Object} friendData - { firstName, lastName, phone, senderPhone, senderEmail, senderUserData, senderUserId }
   * @returns {Object} - { success: boolean, message: string, requestId?: string }
   */
  sendFriendRequest: async (friendData) => {
    try {
      console.log('Starting enhanced friend request process...');
      
      const currentUser = auth.currentUser;
      const { firstName, lastName, phone, senderPhone, senderEmail, senderUserData, senderUserId } = friendData;
      
      const senderId = senderUserId || currentUser?.uid || `temp_${Date.now()}`;
      const userEmail = senderEmail || (currentUser ? currentUser.email : 'guest@alertnet.com');
      
      console.log('=== ENHANCED SENDER DATA FETCHING ===');
      
      // Enhanced sender data fetching - prioritize getting from users collection
      let senderProfileData = senderUserData;
      
      // If we have a userId, fetch complete user document
      if (senderId && senderId !== `temp_${Date.now()}` && !senderProfileData) {
        console.log('Fetching sender data by userId:', senderId);
        const userByIdResult = await FirebaseService.getUserById(senderId);
        if (userByIdResult.success) {
          senderProfileData = userByIdResult.userData;
          console.log('Retrieved sender data by ID:', senderProfileData);
        }
      }
      
      // If still no data, try by phone
      if (!senderProfileData && senderPhone) {
        console.log('Fetching sender data by phone:', senderPhone);
        const userByPhoneResult = await FirebaseService.getUserByPhone(senderPhone);
        if (userByPhoneResult.exists) {
          senderProfileData = userByPhoneResult.userData;
          console.log('Retrieved sender data by phone:', senderProfileData);
        }
      }
      
      // Extract and map user data to notification format
      const senderName = senderProfileData?.Name || 
                        senderProfileData?.FirstName || 
                        senderProfileData?.firstName ||
                        currentUser?.displayName || 
                        'AlertNet User';
                        
      const senderSurname = senderProfileData?.Surname || 
                           senderProfileData?.LastName || 
                           senderProfileData?.lastName ||
                           '';
      
      // Map the correct profile picture field from your Firestore structure
      const senderProfilePicture = senderProfileData?.ImageURL || 
                                  senderProfileData?.imageUrl || 
                                  senderProfileData?.localImagePath || 
                                  senderProfileData?.profilePicture ||
                                  senderProfileData?.image ||
                                  null;
      
      console.log('Extracted sender info:', {
        senderName,
        senderSurname,
        senderProfilePicture: senderProfilePicture ? 'URL present' : 'null',
        senderPhone: FirebaseService.formatPhoneNumber(senderPhone)
      });
      console.log('=== END ENHANCED SENDER DATA FETCHING ===');
      
      const formattedRecipientPhone = FirebaseService.formatPhoneNumber(phone);
      const formattedSenderPhone = FirebaseService.formatPhoneNumber(senderPhone);
      
      console.log('Sender:', senderName, senderSurname);
      console.log('Sender phone:', formattedSenderPhone);
      console.log('Recipient phone:', formattedRecipientPhone);
      
      // Check if recipient exists
      const userCheck = await FirebaseService.getUserByPhone(formattedRecipientPhone);
      if (userCheck.error) {
        console.error('Error checking recipient user database');
        return { success: false, error: 'Error checking user database' };
      }
      
      if (!userCheck.exists) {
        console.log('Recipient does not exist on platform');
        return { 
          success: false, 
          error: 'This person is not on AlertNet',
          message: 'This person is not on AlertNet'
        };
      }
      
      console.log('Recipient exists on platform:', userCheck.userData.Name);
      
      // Check for existing requests
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
      
      // Create enhanced friend request with complete user data
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
        createdAt: serverTimestamp(),
        // Add complete user data for future reference
        senderUserData: senderProfileData
      };
      
      console.log('Creating enhanced friend request document...');
      const friendRequestsRef = collection(db, 'friendRequests');
      const docRef = await addDoc(friendRequestsRef, friendRequest);
      
      console.log('Friend request created with ID:', docRef.id);
      
      // Create notification with proper profile data mapping
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
          senderFirstName: senderName, // For backward compatibility
          senderLastName: senderSurname, // For backward compatibility
          senderEmail: userEmail,
          profilePicture: senderProfilePicture,
          action: 'view_request',
          // Include complete sender data for rich notifications
          senderUserData: {
            Name: senderName,
            Surname: senderSurname,
            ImageURL: senderProfilePicture,
            Phone: formattedSenderPhone,
            Email: userEmail
          }
        }
      });
      
      if (notificationResult.success) {
        console.log('Enhanced notification created successfully with profile data');
      } else {
        console.warn('Failed to create notification:', notificationResult.error);
      }
      
      return { 
        success: true, 
        message: 'Friend request sent successfully!',
        requestId: docRef.id,
        notificationSent: notificationResult.success,
        senderData: {
          name: senderName,
          surname: senderSurname,
          profilePicture: senderProfilePicture
        }
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
      
      // Get references to the user documents and create a batch for atomic updates
      const user1DocRef = doc(db, 'users', user1Id);
      const user2DocRef = doc(db, 'users', user2Id);
      const batch = writeBatch(db);
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
      // Use a new doc ref for the batch operation
      batch.set(doc(friendsRef), friendship1);
      
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
      // Use a new doc ref for the batch operation
      batch.set(doc(friendsRef), friendship2);

      // --- FIX: Update the `friends` array in both user documents ---
      // This ensures other parts of the app (like FriendsContext) see the new friend.
      const user1FriendData = { uid: user2Id, name: user2Name, email: user2Email, phone: user2Phone };
      const user2FriendData = { uid: user1Id, name: user1Name, email: user1Email, phone: user1Phone };

      batch.update(user1DocRef, {
        friends: arrayUnion(user1FriendData)
      });

      batch.update(user2DocRef, {
        friends: arrayUnion(user2FriendData)
      });
      // --- END FIX ---

      // Commit all writes at once
      await batch.commit();
      
      console.log('Friendship created and user documents updated successfully.');
      
      return { 
        success: true, 
        message: 'Friendship created successfully!'
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
      
      const currentUserResult = await FirebaseService.getUserByPhone(formattedCurrentPhone);
      if (!currentUserResult.exists) {
        return { success: false, error: 'Current user not found in database' };
      }
      
      const senderResult = await FirebaseService.getUserByPhone(requestData.senderPhone);
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
        user1Name: requestData.senderName || `${senderResult.userData.Name || ''} ${senderResult.userData.Surname || ''}`.trim(),
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

  // ========================
  // CHAT SYSTEM
  // ========================

  /**
   * Generates a consistent chat room ID for two users.
   * @param {string} userId1 - First user's ID.
   * @param {string} userId2 - Second user's ID.
   * @returns {string} - The chat room ID.
   */
  getChatRoomId: (userId1, userId2) => {
    if (!userId1 || !userId2) {
      console.error("Cannot generate chat room ID, user ID is missing");
      return null;
    }
    // Sort IDs to ensure consistency regardless of who starts the chat
    return [userId1, userId2].sort().join('_');
  },

  /**
   * Sends a message to a chat room.
   * @param {string} chatRoomId - The ID of the chat room.
   * @param {Object} messageData - { text, senderId, recipientId }
   * @returns {Promise<Object>} - { success: boolean, messageId?: string, error?: string }
   */
  sendMessage: async (chatRoomId, messageData) => {
    try {
      if (!chatRoomId) throw new Error("Chat room ID is required.");

      const { 
        text, 
        senderId, 
        recipientId, 
        type, 
        location, 
        imageUrl,
        audioUrl,
        audioDuration,
        // Notification-related data
        senderName,
        senderProfilePicture,
        recipientPhone,
        senderPhone
      } = messageData;

      const messagesRef = collection(db, 'chats', chatRoomId, 'messages');
      
      const message = {
        text,
        senderId,
        recipientId,
        createdAt: serverTimestamp(),
        read: false,
      };
      // Add optional fields
      if (type) message.type = type;
      if (location) message.location = location;
      if (imageUrl) message.imageUrl = imageUrl;
      if (audioUrl) message.audioUrl = audioUrl;
      if (audioDuration) message.audioDuration = audioDuration;

      const docRef = await addDoc(messagesRef, message);
      console.log('Message sent with ID:', docRef.id);

      // Send a notification to the recipient
      if (recipientPhone && senderName) {
        await FirebaseService.createNotification({
          userId: recipientId,
          recipientPhone: recipientPhone,
          type: 'chat_message',
          title: `New message from ${senderName}`,
          message: text.length > 50 ? `${text.substring(0, 50)}...` : text,
          priority: 'normal',
          data: {
            senderId: senderId,
            senderName: senderName,
            profilePicture: senderProfilePicture,
            senderPhone: senderPhone, // Pass sender's phone for the recipient to open chat
            chatRoomId: chatRoomId,
            action: 'open_chat',
          }
        });
        console.log(`Notification sent to ${recipientPhone} for new message.`);
      }

      return { success: true, messageId: docRef.id };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Listens for real-time messages in a chat room.
   * @param {string} chatRoomId - The ID of the chat room.
   * @param {Function} callback - Function to call with the array of messages.
   * @returns {Function} - Unsubscribe function.
   */
  listenToMessages: (chatRoomId, callback) => {
    try {
      if (!chatRoomId) {
        console.warn("listenToMessages called with no chatRoomId.");
        callback([]);
        return () => {};
      }
      const messagesRef = collection(db, 'chats', chatRoomId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convert Firestore Timestamp to JS Date object
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          };
        });
        callback(messages);
      }, (error) => {
        console.error('Error listening to messages:', error);
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up message listener:', error);
      return () => {}; // Return empty unsubscribe function on error
    }
  },

  /**
   * Marks all unread messages for a user in a chat room as read.
   * @param {string} chatRoomId - The ID of the chat room.
   * @param {string} currentUserId - The ID of the user whose messages are being marked as read (the recipient).
   * @returns {Promise<Object>} - { success: boolean, updatedCount?: number, error?: string }
   */
  markMessagesAsRead: async (chatRoomId, currentUserId) => {
    try {
      if (!chatRoomId || !currentUserId) {
        throw new Error("Chat room ID and user ID are required.");
      }
      
      const messagesRef = collection(db, 'chats', chatRoomId, 'messages');
      
      // Query for messages sent TO the current user that are unread.
      const q = query(
        messagesRef,
        where('recipientId', '==', currentUserId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return { success: true, updatedCount: 0 };
      
      const batch = writeBatch(db);
      querySnapshot.forEach((docSnapshot) => batch.update(docSnapshot.ref, { read: true }));
      await batch.commit();
      
      return { success: true, updatedCount: querySnapshot.size };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Deletes all messages in a chat room.
   * @param {string} chatRoomId - The ID of the chat room to clear.
   * @returns {Promise<Object>} - { success: boolean, deletedCount?: number, error?: string }
   */
  clearChatHistory: async (chatRoomId) => {
    try {
      if (!chatRoomId) {
        throw new Error("Chat room ID is required.");
      }
      
      const messagesRef = collection(db, 'chats', chatRoomId, 'messages');
      const querySnapshot = await getDocs(messagesRef);
      
      if (querySnapshot.empty) {
        return { success: true, deletedCount: 0 };
      }
      
      const batch = writeBatch(db);
      querySnapshot.forEach((docSnapshot) => batch.delete(docSnapshot.ref));
      
      await batch.commit();
      
      console.log(`Cleared ${querySnapshot.size} messages from chat room ${chatRoomId}`);
      return { success: true, deletedCount: querySnapshot.size };
    } catch (error) {
      console.error(`Error clearing chat history for ${chatRoomId}:`, error);
      return { success: false, error: error.message };
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