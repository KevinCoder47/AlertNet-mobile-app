// services/alertFeedService.js - WITH BROADCAST NOTIFICATIONS TO ALL USERS
import { db } from '../../backend/Firebase/FirebaseConfig';
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
  arrayUnion,
  arrayRemove,
  increment,
  GeoPoint
} from 'firebase/firestore';

export const AlertFeedService = {
  
  /**
   * Fetch complete user data from Firestore
   */
  fetchUserData: async (userId) => {
    try {
      if (!userId || userId.startsWith('temp_')) {
        console.warn('Invalid userId:', userId);
        return null;
      }

      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        console.warn('User not found:', userId);
        return null;
      }

      const userData = userDoc.data();
      
      return {
        id: userDoc.id,
        name: userData.Name || 'User',
        surname: userData.Surname || '',
        fullName: `${userData.Name || ''} ${userData.Surname || ''}`.trim(),
        avatar: userData.ImageURL || null,
        phone: userData.Phone || null,
        email: userData.Email || null
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  },

  /**
   * Get all active users from the database (excluding the poster)
   * @param {string} excludeUserId - User ID to exclude (the person posting)
   * @returns {Array} - Array of user objects with phone numbers
   */
  getAllActiveUsers: async (excludeUserId) => {
    try {
      console.log('📋 Fetching all active users for broadcast notification...');
      
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const users = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        
        // Exclude the poster and users without phone numbers
        if (doc.id !== excludeUserId && userData.Phone) {
          users.push({
            id: doc.id,
            phone: userData.Phone,
            name: userData.Name || 'User',
            email: userData.Email || null
          });
        }
      });
      
      console.log(`✅ Found ${users.length} users to notify (excluding poster)`);
      return users;
    } catch (error) {
      console.error('❌ Error fetching active users:', error);
      return [];
    }
  },

  /**
   * Send broadcast notification to all users about new alert
   * @param {Object} alertData - The alert data that was just posted
   * @param {string} posterUserId - ID of user who posted the alert
   * @returns {Object} - { success: boolean, notificationsSent: number }
   */
  sendBroadcastNotification: async (alertData, posterUserId) => {
    try {
      console.log('📢 Starting broadcast notification to all users...');
      
      // Get all active users except the poster
      const allUsers = await AlertFeedService.getAllActiveUsers(posterUserId);
      
      if (allUsers.length === 0) {
        console.log('⚠️ No users to notify');
        return { success: true, notificationsSent: 0 };
      }
      
      console.log(`📤 Sending notifications to ${allUsers.length} users...`);
      
      // Create notification data
      const posterName = alertData.userName || 'Someone';
      const alertType = alertData.alertType || 'Alert';
      const description = alertData.description || 'New alert posted';
      
      // Truncate description for notification
      const shortDescription = description.length > 50 
        ? `${description.substring(0, 50)}...` 
        : description;
      
      let notificationsSent = 0;
      const notificationPromises = [];
      
      // Send notification to each user
      for (const user of allUsers) {
        const notificationPromise = AlertFeedService.createNotificationForUser({
          userId: user.id,
          recipientPhone: user.phone,
          type: alertData.categoryId || 'general',
          title: `New ${alertType} in your area`,
          message: `${posterName}: ${shortDescription}`,
          priority: alertData.isUrgent ? 'high' : 'normal',
          isUrgent: alertData.isUrgent || false,
          data: {
            alertId: alertData.id,
            posterName: posterName,
            posterAvatar: alertData.userAvatar,
            alertType: alertType,
            categoryId: alertData.categoryId,
            location: alertData.coordinates,
            description: description,
            mediaUri: alertData.mediaUri,
            mediaType: alertData.mediaType,
            action: 'view_alert',
            timestamp: Date.now()
          }
        }).then(result => {
          if (result.success) {
            notificationsSent++;
          }
          return result;
        }).catch(error => {
          console.error(`Failed to send notification to ${user.phone}:`, error);
          return { success: false };
        });
        
        notificationPromises.push(notificationPromise);
      }
      
      // Wait for all notifications to be sent
      await Promise.all(notificationPromises);
      
      console.log(`✅ Broadcast complete: ${notificationsSent}/${allUsers.length} notifications sent`);
      
      return { 
        success: true, 
        notificationsSent,
        totalUsers: allUsers.length
      };
      
    } catch (error) {
      console.error('❌ Error sending broadcast notification:', error);
      return { 
        success: false, 
        error: error.message,
        notificationsSent: 0
      };
    }
  },

  /**
   * Create a single notification (helper function)
   */
  createNotificationForUser: async (notificationData) => {
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
      
      return { success: true, notificationId: docRef.id };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create a new alert post with broadcast notifications
   * @param {Object} alertData - Alert data from AddAlertModal
   * @returns {Object} - { success: boolean, alertId?: string, error?: string }
   */
  createAlert: async (alertData) => {
    try {
      const {
        selectedCategory,
        description,
        coordinates,
        mediaUri,
        mediaType,
        postAnonymously,
        userPhone,
        userName,
        userAvatar,
        userId
      } = alertData;

      // Validate required fields
      if (!selectedCategory || !description || !coordinates) {
        return { 
          success: false, 
          error: 'Missing required fields: category, description, or location' 
        };
      }

      // Validate userId
      if (!userId || userId.startsWith('temp_')) {
        return {
          success: false,
          error: 'Valid user ID required to post alerts'
        };
      }

      // Fetch complete user data from Firestore
      let completeUserData = null;
      if (!postAnonymously) {
        completeUserData = await AlertFeedService.fetchUserData(userId);
        
        if (!completeUserData) {
          console.warn('Could not fetch user data, using provided data');
        }
      }

      // Category mapping
      const categoryData = {
        fire: 'Fire Alert',
        crime: 'Safety & Crime',
        utility: 'Utility Issue',
        medical: 'Medical Emergency',
        traffic: 'Traffic Alert',
        other: 'General Alert'
      };

      // Prepare user info with fallbacks
      const finalUserName = postAnonymously 
        ? 'Anonymous' 
        : (completeUserData?.fullName || userName || 'User');
      
      const finalUserAvatar = postAnonymously 
        ? null 
        : (completeUserData?.avatar || userAvatar || null);

      // Determine if alert is urgent based on category
      const urgentCategories = ['fire', 'medical', 'crime'];
      const isUrgent = urgentCategories.includes(selectedCategory);

      const alert = {
        // User info
        userId: userId,
        userName: finalUserName,
        userPhone: postAnonymously ? null : (completeUserData?.phone || userPhone),
        userAvatar: finalUserAvatar,
        isAnonymous: postAnonymously,

        // Alert content
        alertType: categoryData[selectedCategory] || 'General Alert',
        categoryId: selectedCategory,
        description: description.trim(),
        
        // Location
        location: new GeoPoint(coordinates.latitude, coordinates.longitude),
        coordinates: coordinates,
        
        // Media
        mediaUri: mediaUri || null,
        mediaType: mediaType || null,
        
        // Engagement
        likes: 0,
        likedBy: [],
        commentCount: 0,
        
        // Status
        status: 'active',
        isResolved: false,
        isUrgent: isUrgent,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Create the alert in Firestore
      const alertsRef = collection(db, 'alerts');
      const docRef = await addDoc(alertsRef, alert);
      
      console.log('✅ Alert created with ID:', docRef.id);
      console.log('User avatar stored:', finalUserAvatar ? 'Yes' : 'No');

      // 🚨 BROADCAST NOTIFICATION TO ALL USERS 🚨
      const broadcastResult = await AlertFeedService.sendBroadcastNotification(
        { 
          ...alert, 
          id: docRef.id 
        }, 
        userId
      );

      if (broadcastResult.success) {
        console.log(`📢 Broadcast notification sent to ${broadcastResult.notificationsSent} users`);
      } else {
        console.warn('⚠️ Failed to send broadcast notifications:', broadcastResult.error);
      }

      return { 
        success: true, 
        alertId: docRef.id,
        alert: { id: docRef.id, ...alert },
        notificationsSent: broadcastResult.notificationsSent || 0,
        totalUsers: broadcastResult.totalUsers || 0
      };

    } catch (error) {
      console.error('❌ Error creating alert:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * Enrich alert data with user information
   */
  enrichAlertWithUserData: async (alert) => {
    try {
      if (alert.isAnonymous || !alert.userId) {
        return alert;
      }

      if (alert.userAvatar) {
        return alert;
      }

      const userData = await AlertFeedService.fetchUserData(alert.userId);
      
      if (userData) {
        return {
          ...alert,
          userName: userData.fullName || alert.userName,
          userAvatar: userData.avatar || alert.userAvatar
        };
      }

      return alert;
    } catch (error) {
      console.error('Error enriching alert:', error);
      return alert;
    }
  },

  /**
   * Get alerts feed with user data enrichment
   */
  getAlertsFeed: async (options = {}) => {
    try {
      const {
        userLocation = null,
        radius = 50,
        limitCount = 20
      } = options;

      console.log('📥 Fetching alerts feed...');

      const alertsRef = collection(db, 'alerts');
      const q = query(
        alertsRef,
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      
      let alerts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          coordinates: data.location ? {
            latitude: data.location.latitude,
            longitude: data.location.longitude
          } : data.coordinates || null,
          timestamp: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        };
      });

      // Filter by distance if user location provided
      if (userLocation && userLocation.latitude && userLocation.longitude) {
        alerts = alerts.filter(alert => {
          if (!alert.coordinates) return false;
          
          const distance = AlertFeedService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            alert.coordinates.latitude,
            alert.coordinates.longitude
          );
          
          return distance <= radius;
        });
      }

      // Enrich alerts with missing user data
      const enrichedAlerts = await Promise.all(
        alerts.map(alert => AlertFeedService.enrichAlertWithUserData(alert))
      );

      console.log(`✅ Fetched and enriched ${enrichedAlerts.length} alerts`);
      
      return { 
        success: true, 
        alerts: enrichedAlerts
      };

    } catch (error) {
      console.error('❌ Error fetching alerts feed:', error);
      return { 
        success: false, 
        alerts: [],
        error: error.message 
      };
    }
  },

  /**
   * Listen to alerts feed in real-time with user data enrichment
   */
  listenToAlertsFeed: (options, callback) => {
    try {
      const {
        userLocation = null,
        radius = 50,
        limitCount = 50
      } = options;

      console.log('👂 Setting up real-time alerts listener...');

      const alertsRef = collection(db, 'alerts');
      
      const q = query(
        alertsRef,
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      return onSnapshot(
        q, 
        async (snapshot) => {
          console.log('📥 Snapshot received with', snapshot.size, 'documents');
          
          let alerts = snapshot.docs.map(doc => {
            const data = doc.data();
            
            return {
              id: doc.id,
              ...data,
              coordinates: data.location ? {
                latitude: data.location.latitude,
                longitude: data.location.longitude
              } : data.coordinates || null,
              timestamp: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            };
          });

          // Filter by distance
          if (userLocation && userLocation.latitude && userLocation.longitude) {
            alerts = alerts.filter(alert => {
              if (!alert.coordinates) return false;
              
              const distance = AlertFeedService.calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                alert.coordinates.latitude,
                alert.coordinates.longitude
              );
              
              return distance <= radius;
            });
          }

          // Enrich alerts with user data
          const enrichedAlerts = await Promise.all(
            alerts.map(alert => AlertFeedService.enrichAlertWithUserData(alert))
          );

          console.log(`🔄 Calling callback with ${enrichedAlerts.length} enriched alerts`);
          callback({ success: true, alerts: enrichedAlerts });

        }, 
        (error) => {
          console.error('❌ Snapshot listener error:', error);
          callback({ success: false, alerts: [], error: error.message });
        }
      );

    } catch (error) {
      console.error('❌ Error setting up alerts listener:', error);
      return () => {};
    }
  },

  /**
   * Toggle like on an alert
   */
  toggleLike: async (alertId, userId) => {
    try {
      const alertRef = doc(db, 'alerts', alertId);
      const alertDoc = await getDoc(alertRef);

      if (!alertDoc.exists()) {
        return { success: false, error: 'Alert not found' };
      }

      const alertData = alertDoc.data();
      const likedBy = alertData.likedBy || [];
      const isLiked = likedBy.includes(userId);

      if (isLiked) {
        await updateDoc(alertRef, {
          likes: increment(-1),
          likedBy: arrayRemove(userId),
          updatedAt: serverTimestamp()
        });
        return { success: true, liked: false };
      } else {
        await updateDoc(alertRef, {
          likes: increment(1),
          likedBy: arrayUnion(userId),
          updatedAt: serverTimestamp()
        });
        return { success: true, liked: true };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Add comment to an alert
   */
  addComment: async (alertId, commentData) => {
    try {
      const { text, userId, userName, userAvatar } = commentData;

      if (!alertId || !text || !userId) {
        return { success: false, error: 'Missing required fields' };
      }

      let finalAvatar = userAvatar;
      let finalName = userName;

      if (!userAvatar || !userName) {
        const userData = await AlertFeedService.fetchUserData(userId);
        if (userData) {
          finalAvatar = userData.avatar || userAvatar;
          finalName = userData.fullName || userName;
        }
      }

      const comment = {
        alertId,
        userId,
        userName: finalName,
        userAvatar: finalAvatar || null,
        text: text.trim(),
        createdAt: serverTimestamp(),
      };

      const commentsRef = collection(db, 'alerts', alertId, 'comments');
      const docRef = await addDoc(commentsRef, comment);

      const alertRef = doc(db, 'alerts', alertId);
      await updateDoc(alertRef, {
        commentCount: increment(1),
        updatedAt: serverTimestamp()
      });

      console.log('💬 Comment added with ID:', docRef.id);

      return { 
        success: true, 
        commentId: docRef.id,
        comment: { id: docRef.id, ...comment }
      };

    } catch (error) {
      console.error('❌ Error adding comment:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get comments for an alert
   */
  getComments: async (alertId) => {
    try {
      const commentsRef = collection(db, 'alerts', alertId, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const comments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: AlertFeedService.getTimeAgo(doc.data().createdAt?.toDate())
      }));

      return { success: true, comments };

    } catch (error) {
      console.error('❌ Error getting comments:', error);
      return { success: false, comments: [], error: error.message };
    }
  },

  /**
   * Listen to comments in real-time
   */
  listenToComments: (alertId, callback) => {
    try {
      const commentsRef = collection(db, 'alerts', alertId, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'asc'));

      return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: AlertFeedService.getTimeAgo(doc.data().createdAt?.toDate())
        }));

        callback({ success: true, comments });

      }, (error) => {
        console.error('❌ Error listening to comments:', error);
        callback({ success: false, comments: [], error: error.message });
      });

    } catch (error) {
      console.error('❌ Error setting up comments listener:', error);
      return () => {};
    }
  },

  /**
   * Report an alert
   */
  reportAlert: async (alertId, reportData) => {
    try {
      const { userId, reason, description } = reportData;

      const report = {
        alertId,
        reportedBy: userId,
        reason: reason || 'inappropriate_content',
        description: description || '',
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const reportsRef = collection(db, 'alertReports');
      const docRef = await addDoc(reportsRef, report);

      console.log('🚩 Alert reported with ID:', docRef.id);

      return { success: true, reportId: docRef.id };

    } catch (error) {
      console.error('❌ Error reporting alert:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete an alert (soft delete)
   */
  deleteAlert: async (alertId, userId) => {
    try {
      const alertRef = doc(db, 'alerts', alertId);
      const alertDoc = await getDoc(alertRef);

      if (!alertDoc.exists()) {
        return { success: false, error: 'Alert not found' };
      }

      const alertData = alertDoc.data();
      
      if (alertData.userId !== userId) {
        return { success: false, error: 'Unauthorized' };
      }

      await updateDoc(alertRef, {
        status: 'deleted',
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('🗑️ Alert soft deleted');
      return { success: true };

    } catch (error) {
      console.error('❌ Error deleting alert:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  /**
   * Get time ago string from date
   */
  getTimeAgo: (date) => {
    if (!date) return 'just now';
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  },

  /**
   * Test Firebase connection
   */
  testFirebaseConnection: async () => {
    try {
      console.log('🧪 Testing Firebase connection...');
      const alertsRef = collection(db, 'alerts');
      const testQuery = query(alertsRef, limit(1));
      const snapshot = await getDocs(testQuery);
      
      console.log('✅ Firebase connected! Found', snapshot.size, 'documents');
      return { success: true, count: snapshot.size };
    } catch (error) {
      console.error('❌ Firebase connection test failed:', error);
      return { success: false, error: error.message };
    }
  },
};

export default AlertFeedService;
