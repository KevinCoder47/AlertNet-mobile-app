import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../../backend/Firebase/FirebaseConfig';

class FriendsService {
  constructor() {
    this.listeners = [];
    this.friendsCache = new Map();
    this.cachedFriends = [];
    this.callbacks = new Set();
    this.isInitialized = false;
    this.currentUserId = null;
    this.currentUserData = null;
  }

  // Initialize the service with user data
  async initialize(userData) {
    if (this.isInitialized && this.currentUserId === userData.uid) {
      return;
    }

    console.log('FriendsService: Initializing for user:', userData.uid);
    
    // Clean up existing listeners
    this.cleanup();
    
    this.currentUserId = userData.uid;
    this.currentUserData = userData;
    this.isInitialized = true;

    // Load cached friends first
    await this.loadCachedFriends();
    
    // Set up real-time listeners
    this.setupRealtimeListeners();
    
    // Fetch fresh data
    this.fetchFriendsData();
  }

  // Subscribe to friends updates
  subscribe(callback) {
    this.callbacks.add(callback);
    
    // Immediately call with cached data if available
    if (this.cachedFriends.length > 0) {
      callback(this.cachedFriends, false); // false = not loading
    }
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  // Notify all subscribers
  notifySubscribers(loading = false) {
    this.callbacks.forEach(callback => {
      callback([...this.cachedFriends], loading);
    });
  }

  // Load friends from AsyncStorage cache
  async loadCachedFriends() {
    try {
      const cacheKey = `friends_cache_${this.currentUserId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { friends, timestamp } = JSON.parse(cachedData);
        
        // Check if cache is still valid (24 hours)
        const now = Date.now();
        const cacheAge = now - timestamp;
        const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours
        
        if (cacheAge < MAX_CACHE_AGE) {
          console.log('FriendsService: Loading from cache:', friends.length, 'friends');
          this.cachedFriends = friends;
          this.notifySubscribers(false);
          return;
        }
      }
    } catch (error) {
      console.error('FriendsService: Error loading cache:', error);
    }
  }

  // Save friends to AsyncStorage cache
  async saveFriendsToCache(friends) {
    try {
      const cacheKey = `friends_cache_${this.currentUserId}`;
      const cacheData = {
        friends,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('FriendsService: Saved', friends.length, 'friends to cache');
    } catch (error) {
      console.error('FriendsService: Error saving cache:', error);
    }
  }

  // Calculate distance between coordinates
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 'Unknown';
    
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    if (distance < 1) {
      return `${Math.round(distance * 1000)} m away`;
    } else {
      return `${Math.round(distance)} km away`;
    }
  }

  // Get current user location
  getCurrentUserLocation() {
    if (this.currentUserData?.ResidenceAddress?.latitude && 
        this.currentUserData?.ResidenceAddress?.longitude) {
      return {
        latitude: this.currentUserData.ResidenceAddress.latitude,
        longitude: this.currentUserData.ResidenceAddress.longitude
      };
    }
    return null;
  }

  // Fetch friends data from all sources
  async fetchFriendsData() {
    if (!this.currentUserId) {
      console.log('FriendsService: No user ID available');
      return;
    }

    try {
      console.log('FriendsService: Fetching friends for user:', this.currentUserId);
      this.notifySubscribers(true); // Set loading state

      // Method 1: Get friends from the dedicated friends collection
      const friendsFromCollection = await this.getFriendsFromCollection();
      
      // Method 2: Get friends from accepted friend requests
      const friendsFromRequests = await this.getFriendsFromRequests();
      
      // Method 3: Get friends from user's Friends object (legacy)
      const friendsFromUserDoc = await this.getFriendsFromUserDoc();
      
      // Method 4: Get phone-based friends (legacy)
      const phoneBasedFriends = await this.getPhoneBasedFriends();

      // Combine and deduplicate
      const allFriendIds = [...new Set([
        ...friendsFromCollection,
        ...friendsFromRequests,
        ...friendsFromUserDoc,
        ...phoneBasedFriends
      ])];

      console.log('FriendsService: Combined friend IDs:', allFriendIds);

      if (allFriendIds.length === 0) {
        console.log('FriendsService: No friends found');
        this.cachedFriends = [];
        this.notifySubscribers(false);
        await this.saveFriendsToCache([]);
        return;
      }

      // Fetch detailed friend data
      const friendsData = await this.fetchFriendsDetails(allFriendIds);
      
      console.log('FriendsService: Final friends data:', friendsData.length);
      this.cachedFriends = friendsData;
      
      // Save to cache and notify subscribers
      await this.saveFriendsToCache(friendsData);
      this.notifySubscribers(false);

    } catch (error) {
      console.error('FriendsService: Error fetching friends:', error);
      this.notifySubscribers(false);
    }
  }

  // Get friends from the friends collection
  async getFriendsFromCollection() {
    try {
      const friendsQuery = query(
        collection(db, 'friends'),
        where('userId', '==', this.currentUserId),
        where('status', '==', 'accepted')
      );
      
      const friendsSnapshot = await getDocs(friendsQuery);
      const friendIds = friendsSnapshot.docs.map(doc => doc.data().friendId);
      
      console.log('FriendsService: Friends from collection:', friendIds);
      return friendIds;
    } catch (error) {
      console.error('FriendsService: Error fetching from friends collection:', error);
      return [];
    }
  }

  // Get friends from accepted friend requests
  async getFriendsFromRequests() {
    try {
      // Sent requests
      const sentRequestsQuery = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', this.currentUserId),
        where('status', '==', 'accepted')
      );
      const sentSnapshot = await getDocs(sentRequestsQuery);
      const sentFriendIds = sentSnapshot.docs.map(doc => doc.data().recipientId);

      // Received requests
      const receivedRequestsQuery = query(
        collection(db, 'friendRequests'),
        where('recipientId', '==', this.currentUserId),
        where('status', '==', 'accepted')
      );
      const receivedSnapshot = await getDocs(receivedRequestsQuery);
      const receivedFriendIds = receivedSnapshot.docs.map(doc => doc.data().senderId);

      const allIds = [...sentFriendIds, ...receivedFriendIds];
      console.log('FriendsService: Friends from requests:', allIds);
      return allIds;
    } catch (error) {
      console.error('FriendsService: Error fetching from requests:', error);
      return [];
    }
  }

  // Get friends from user's Friends object (legacy)
  async getFriendsDataFromUserDoc() {
    try {
      const userDoc = await getDoc(doc(db, 'users', this.currentUserId));
      if (!userDoc.exists()) return [];
  
      const userData = userDoc.data();
      const friendsArray = userData?.Friends || [];  // Capital F
      
      if (!Array.isArray(friendsArray)) {
        console.warn('FriendsService: Friends is not an array');
        return [];
      }
      
      console.log('FriendsService: Found', friendsArray.length, 'friends in Friends array');
      
      // Return the complete friend data objects
      // These already contain: { uid, name, email, phoneNumber }
      return friendsArray.filter(friend => 
        typeof friend === 'object' && 
        friend !== null && 
        friend.uid
      );
    } catch (error) {
      console.error('FriendsService: Error getting friends data from Friends array:', error);
      return [];
    }
  }

  // Get phone-based friends (legacy)
  async getPhoneBasedFriends() {
    try {
      const userPhone = this.currentUserData.phone || 
                       this.currentUserData.phoneNumber || 
                       this.currentUserData.Phone;
      
      if (!userPhone) return [];

      const phoneBasedFriends = [];

      // Check sent phone requests
      const phoneRequestsQuery = query(
        collection(db, 'friendRequests'),
        where('senderPhone', '==', userPhone),
        where('status', '==', 'accepted')
      );
      const phoneRequestsSnapshot = await getDocs(phoneRequestsQuery);
      
      for (const requestDoc of phoneRequestsSnapshot.docs) {
        const requestData = requestDoc.data();
        const recipientPhone = requestData.recipientPhone;
        
        const usersByPhoneQuery = query(
          collection(db, 'users'),
          where('Phone', '==', recipientPhone)
        );
        const usersByPhoneSnapshot = await getDocs(usersByPhoneQuery);
        
        if (!usersByPhoneSnapshot.empty) {
          phoneBasedFriends.push(usersByPhoneSnapshot.docs[0].id);
        }
      }

      // Check received phone requests
      const phoneReceivedQuery = query(
        collection(db, 'friendRequests'),
        where('recipientPhone', '==', userPhone),
        where('status', '==', 'accepted')
      );
      const phoneReceivedSnapshot = await getDocs(phoneReceivedQuery);
      
      for (const requestDoc of phoneReceivedSnapshot.docs) {
        const requestData = requestDoc.data();
        const senderPhone = requestData.senderPhone;
        
        const usersByPhoneQuery = query(
          collection(db, 'users'),
          where('Phone', '==', senderPhone)
        );
        const usersByPhoneSnapshot = await getDocs(usersByPhoneQuery);
        
        if (!usersByPhoneSnapshot.empty) {
          phoneBasedFriends.push(usersByPhoneSnapshot.docs[0].id);
        }
      }

      console.log('FriendsService: Phone-based friends:', phoneBasedFriends);
      return phoneBasedFriends;
    } catch (error) {
      console.error('FriendsService: Error fetching phone-based friends:', error);
      return [];
    }
  }

  // Fetch detailed friend data
  async fetchFriendsDetails(friendIds) {
    const currentUserLocation = this.getCurrentUserLocation();
    
    const friendsPromises = friendIds.map(async (friendId) => {
      try {
        // Check cache first
        if (this.friendsCache.has(friendId)) {
          const cachedFriend = this.friendsCache.get(friendId);
          // Check if cache is still fresh (5 minutes for user data)
          const cacheAge = Date.now() - cachedFriend.cacheTimestamp;
          if (cacheAge < 5 * 60 * 1000) {
            return this.processFriendData(cachedFriend, currentUserLocation);
          }
        }

        console.log('FriendsService: Fetching data for friend:', friendId);
        const friendDoc = await getDoc(doc(db, 'users', friendId));
        
        if (!friendDoc.exists()) {
          console.log('FriendsService: Friend document not found:', friendId);
          return null;
        }
        
        const friendData = { ...friendDoc.data(), cacheTimestamp: Date.now() };
        
        // Cache the friend data
        this.friendsCache.set(friendId, friendData);
        
        return this.processFriendData(friendData, currentUserLocation, friendId);
      } catch (error) {
        console.error('FriendsService: Error fetching friend data for ID:', friendId, error);
        return null;
      }
    });

    const friendsResults = await Promise.all(friendsPromises);
    return friendsResults.filter(friend => friend !== null);
  }

  // Process friend data into display format
  processFriendData(friendData, currentUserLocation, friendId = null) {
    const id = friendId || friendData.uid || 'unknown';
    
    // Calculate distance
    let distance = 'Unknown';
    if (currentUserLocation && 
        friendData.ResidenceAddress?.latitude && 
        friendData.ResidenceAddress?.longitude) {
      distance = this.calculateDistance(
        currentUserLocation.latitude,
        currentUserLocation.longitude,
        friendData.ResidenceAddress.latitude,
        friendData.ResidenceAddress.longitude
      );
    }
  
    // Determine online status
    let status = 'Offline';
    if (friendData.LastLogin) {
      const lastLogin = new Date(friendData.LastLogin);
      const now = new Date();
      const timeDiff = now - lastLogin;
      status = timeDiff < 5 * 60 * 1000 ? 'Online' : 'Offline';
    }
  
    // Get location name
    let location = 'Unknown';
    if (friendData.ResidenceAddress?.latitude && friendData.ResidenceAddress?.longitude) {
      location = `${friendData.ResidenceAddress.latitude.toFixed(4)}, ${friendData.ResidenceAddress.longitude.toFixed(4)}`;
    }
  
    const friendName = `${friendData.Name || ''} ${friendData.Surname || ''}`.trim() || 'Unknown User';
    const isCloseFriend = (friendData.Rating || 0) > 3;
  
    return {
      id,
      name: friendName,
      location,
      status,
      distance,
      battery: friendData.Battery || '100%',
      avatar: friendData.ImageURL ? { uri: friendData.ImageURL } : require('../images/default-avatar.jpg'),
      phone: friendData.Phone || '',
      email: friendData.Email || '',
      rating: friendData.Rating || 0,
      lastLogin: friendData.LastLogin,
      isCloseFriend,
      rawData: friendData
    };
  }

  // Set up real-time listeners
  setupRealtimeListeners() {
    if (!this.currentUserId) return;

    console.log('FriendsService: Setting up real-time listeners');

    // Listen to current user document changes
    const userListener = onSnapshot(doc(db, 'users', this.currentUserId), (doc) => {
      if (doc.exists()) {
        console.log('FriendsService: User document updated');
        const updatedData = doc.data();
        this.currentUserData = { ...this.currentUserData, ...updatedData };
        this.fetchFriendsData();
      }
    });

    // Listen to friends collection changes
    const friendsListener = onSnapshot(
      query(
        collection(db, 'friends'),
        where('userId', '==', this.currentUserId)
      ),
      (snapshot) => {
        console.log('FriendsService: Friends collection updated');
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const friendData = change.doc.data();
            if (friendData.status === 'accepted') {
              console.log('FriendsService: Friend added/updated, refreshing');
              setTimeout(() => this.fetchFriendsData(), 500);
            }
          }
        });
      }
    );

    // Listen to sent friend requests
    const sentRequestsListener = onSnapshot(
      query(
        collection(db, 'friendRequests'),
        where('senderId', '==', this.currentUserId)
      ),
      (snapshot) => {
        console.log('FriendsService: Sent friend requests updated');
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified' || change.type === 'added') {
            const request = change.doc.data();
            if (request.status === 'accepted') {
              console.log('FriendsService: Friend request accepted, refreshing');
              setTimeout(() => this.fetchFriendsData(), 1000);
            }
          }
        });
      }
    );

    // Listen to received friend requests
    const receivedRequestsListener = onSnapshot(
      query(
        collection(db, 'friendRequests'),
        where('recipientId', '==', this.currentUserId)
      ),
      (snapshot) => {
        console.log('FriendsService: Received friend requests updated');
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified' || change.type === 'added') {
            const request = change.doc.data();
            if (request.status === 'accepted') {
              console.log('FriendsService: Friend request accepted, refreshing');
              setTimeout(() => this.fetchFriendsData(), 1000);
            }
          }
        });
      }
    );

    // Store listeners for cleanup
    this.listeners = [
      userListener,
      friendsListener,
      sentRequestsListener,
      receivedRequestsListener
    ];
  }

  // Helper method to accept a friend request and update all collections
  async acceptFriendRequest(requestId, senderId, recipientId, senderData = null, recipientData = null) {
    try {
      const batch = writeBatch(db);
      
      // Update friend request status
      const requestRef = doc(db, 'friendRequests', requestId);
      batch.update(requestRef, { status: 'accepted' });
      
      // Add to friends collection for sender
      const senderFriendRef = doc(collection(db, 'friends'));
      batch.set(senderFriendRef, {
        userId: senderId,
        friendId: recipientId,
        friendName: recipientData ? `${recipientData.Name} ${recipientData.Surname}` : '',
        friendEmail: recipientData?.Email || '',
        friendPhone: recipientData?.Phone || '',
        status: 'accepted',
        createdAt: new Date().toISOString()
      });
      
      // Add to friends collection for recipient
      const recipientFriendRef = doc(collection(db, 'friends'));
      batch.set(recipientFriendRef, {
        userId: recipientId,
        friendId: senderId,
        friendName: senderData ? `${senderData.Name} ${senderData.Surname}` : '',
        friendEmail: senderData?.Email || '',
        friendPhone: senderData?.Phone || '',
        status: 'accepted',
        createdAt: new Date().toISOString()
      });
      
      // Optionally update users Friends object for backward compatibility
      const senderRef = doc(db, 'users', senderId);
      const recipientRef = doc(db, 'users', recipientId);
      
      batch.update(senderRef, {
        [`Friends.${recipientId}`]: true
      });
      
      batch.update(recipientRef, {
        [`Friends.${senderId}`]: true
      });
      
      await batch.commit();
      console.log('FriendsService: Friend request accepted successfully');
      
      return true;
    } catch (error) {
      console.error('FriendsService: Error accepting friend request:', error);
      return false;
    }
  }

  // Get friends data (for external use)
  getFriends() {
    return [...this.cachedFriends];
  }

  // Get close friends
  getCloseFriends() {
    return this.cachedFriends.filter(friend => friend.isCloseFriend);
  }

  // Get regular friends
  getRegularFriends() {
    return this.cachedFriends.filter(friend => !friend.isCloseFriend);
  }

  // Force refresh
  async refresh() {
    await this.fetchFriendsData();
  }

  // Cleanup listeners and cache
  cleanup() {
    console.log('FriendsService: Cleaning up listeners');
    this.listeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners = [];
    this.callbacks.clear();
    this.friendsCache.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export default new FriendsService();