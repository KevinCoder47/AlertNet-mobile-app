import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../backend/Firebase/FirebaseConfig';
import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserDocument } from '../../services/firestore';

const FriendsContext = createContext();

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};

export const FriendsProvider = ({ children, userData }) => {
  const [friendsDetails, setFriendsDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [userBatteryLevel, setUserBatteryLevel] = useState(100);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 'Unknown location';
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    } else {
      return `${Math.round(distance)}km away`;
    }
  };

  // Get user's current location for distance calculations
  const getUserLocation = () => {
    if (userData?.ResidenceAddress?.latitude && userData?.ResidenceAddress?.longitude) {
      return {
        latitude: userData.ResidenceAddress.latitude,
        longitude: userData.ResidenceAddress.longitude
      };
    }
    return null;
  };

  // Update user's online status and battery
  const updateUserPresence = async () => {
    if (!userData?.uid) return;

    try {
      // Get battery level
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryPercentage = Math.round(batteryLevel * 100);
      setUserBatteryLevel(batteryPercentage);

      // Update user's presence in Firestore
      await updateDoc(doc(db, "users", userData.uid), {
        online: true,
        lastSeen: serverTimestamp(),
        battery: batteryPercentage,
        updatedAt: serverTimestamp()
      });

      console.log('User presence updated:', {
        online: true,
        battery: batteryPercentage
      });
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  };

  // Set user offline when app closes
  const setUserOffline = async () => {
    if (!userData?.uid) return;

    try {
      await updateDoc(doc(db, "users", userData.uid), {
        online: false,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  };

  // Fetch friends details
  const fetchFriendsDetails = async () => {
    if (!userData || !userData.friends || userData.friends.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userLocation = getUserLocation();
      const friendsData = {};
      
      // Fetch details for each friend
      for (const friend of userData.friends) {
        try {
          const friendDoc = await getUserDocument(friend.uid);
          if (friendDoc) {
            // Calculate distance
            let distance = 'Unknown location';
            if (userLocation && friendDoc.ResidenceAddress?.latitude && friendDoc.ResidenceAddress?.longitude) {
              distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                friendDoc.ResidenceAddress.latitude,
                friendDoc.ResidenceAddress.longitude
              );
            }

            // Determine online status
            let isOnline = false;
            if (friendDoc.online === true) {
              isOnline = true;
            } else if (friendDoc.lastSeen) {
              // Consider user online if last seen within 5 minutes
              const lastSeen = new Date(friendDoc.lastSeen.toDate ? friendDoc.lastSeen.toDate() : friendDoc.lastSeen);
              const now = new Date();
              const timeDiff = now - lastSeen;
              isOnline = timeDiff < 5 * 60 * 1000; // 5 minutes
            }

            friendsData[friend.uid] = {
              uid: friend.uid,
              name: friendDoc.name || `${friendDoc.Name || ''} ${friendDoc.Surname || ''}`.trim() || 'Unknown User',
              firstName: friendDoc.Name || friendDoc.name || 'Unknown',
              lastName: friendDoc.Surname || friendDoc.surname || '',
              imageUrl: friendDoc.imageUrl || friendDoc.ImageURL || null,
              location: distance,
              isOnline,
              battery: friendDoc.battery || 100,
              lastSeen: friendDoc.lastSeen,
              currentLocation: friendDoc.currentLocation || null,
              phone: friendDoc.Phone || friendDoc.phone || '',
              email: friendDoc.Email || friendDoc.email || '',
              // Add raw data for compatibility
              ...friendDoc
            };

            // Update online users set
            if (isOnline) {
              setOnlineUsers(prev => new Set(prev).add(friend.uid));
            }
          }
        } catch (error) {
          console.error(`Error fetching details for friend ${friend.uid}:`, error);
          // Add placeholder data to avoid repeated failed attempts
          friendsData[friend.uid] = {
            uid: friend.uid,
            name: friend.name || 'Unknown User',
            firstName: friend.name || 'Unknown',
            lastName: '',
            imageUrl: null,
            location: 'Unknown location',
            isOnline: false,
            battery: 100,
            lastSeen: null,
            currentLocation: null,
          };
        }
      }
      
      setFriendsDetails(friendsData);
      setLoading(false);
    } catch (error) {
      console.error("Error in fetchFriendsDetails:", error);
      setLoading(false);
    }
  };

  // Set up real-time listeners for friends' online status
  const setupPresenceListeners = () => {
    if (!userData?.friends) return [];

    const unsubscribers = [];

    userData.friends.forEach(friend => {
      const unsubscribe = onSnapshot(
        doc(db, "users", friend.uid),
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            
            // Update friend's details
            setFriendsDetails(prev => ({
              ...prev,
              [friend.uid]: {
                ...prev[friend.uid],
                isOnline: data.online || false,
                battery: data.battery || 100,
                lastSeen: data.lastSeen,
                updatedAt: data.updatedAt
              }
            }));

            // Update online users set
            setOnlineUsers(prev => {
              const newSet = new Set(prev);
              if (data.online) {
                newSet.add(friend.uid);
              } else {
                newSet.delete(friend.uid);
              }
              return newSet;
            });
          }
        },
        (error) => {
          console.error(`Error listening to friend ${friend.uid} presence:`, error);
        }
      );

      unsubscribers.push(unsubscribe);
    });

    return unsubscribers;
  };

  // Initialize friends data and presence
  useEffect(() => {
    if (userData) {
      // Update user's own presence
      updateUserPresence();
      
      // Fetch friends details
      fetchFriendsDetails();

      // Set up presence listeners
      const unsubscribers = setupPresenceListeners();

      // Update battery every 5 minutes
      const batteryInterval = setInterval(updateUserPresence, 5 * 60 * 1000);

      // Cleanup function
      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
        clearInterval(batteryInterval);
      };
    }
  }, [userData]);

  // Set user offline when component unmounts
  useEffect(() => {
    return () => {
      if (userData?.uid) {
        setUserOffline();
      }
    };
  }, [userData?.uid]);

  // Update user presence when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && userData?.uid) {
        updateUserPresence();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        setUserOffline();
      }
    };

    // Note: You'll need to import AppState from 'react-native' and add this listener
    // AppState.addEventListener('change', handleAppStateChange);
    
    // return () => {
    //   AppState.removeEventListener('change', handleAppStateChange);
    // };
  }, [userData]);

  // Get friends list as array
  const getFriendsArray = () => {
    return Object.values(friendsDetails).filter(friend => friend.uid);
  };

  // Get online friends
  const getOnlineFriends = () => {
    return getFriendsArray().filter(friend => friend.isOnline);
  };

  // Get offline friends  
  const getOfflineFriends = () => {
    return getFriendsArray().filter(friend => !friend.isOnline);
  };

  // Get friend by ID
  const getFriendById = (friendId) => {
    return friendsDetails[friendId] || null;
  };

  // Refresh friends data
  const refreshFriends = async () => {
    await fetchFriendsDetails();
  };

  const value = {
    friendsDetails,
    loading,
    onlineUsers,
    userBatteryLevel,
    getFriendsArray,
    getOnlineFriends,
    getOfflineFriends,
    getFriendById,
    refreshFriends,
    updateUserPresence
  };

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
};