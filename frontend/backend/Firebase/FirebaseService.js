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
  getDocs
} from 'firebase/firestore';

export const FirebaseService = {
  // Auth methods
  signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password),
  signOut: () => signOut(auth),
  onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),
  getCurrentUser: () => auth.currentUser,

  // Friend request methods
  sendFriendRequest: async (friendData) => {
    try {
      const currentUser = auth.currentUser;
      
      // For now, create a temporary user if not authenticated
      const senderId = currentUser ? currentUser.uid : `temp_${Date.now()}`;
      const senderEmail = currentUser ? currentUser.email : 'guest@alertnet.com';

      const friendRequest = {
        senderId: senderId,
        senderEmail: senderEmail,
        recipientFirstName: friendData.firstName,
        recipientLastName: friendData.lastName,
        recipientPhone: friendData.phone,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'friendRequests'), friendRequest);
      return { success: true, requestId: docRef.id };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: error.message };
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
        where('status', '==', 'pending')
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