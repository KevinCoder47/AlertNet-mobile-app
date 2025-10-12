import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseService } from '../../backend/Firebase/FirebaseService';

const FriendsContext = createContext();

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends must be used within FriendsProvider');
  }
  return context;
};

// Inline distance calculation using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 'Unknown';
  }
  
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) {
    return 'Unknown';
  }
  
  if (numLat1 < -90 || numLat1 > 90 || numLat2 < -90 || numLat2 > 90) {    
    return 'Unknown';
  }
  
  if (numLon1 < -180 || numLon1 > 180 || numLon2 < -180 || numLon2 > 180) {
    return 'Unknown';
  }

  const R = 6371;
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  
  const dLat = toRadians(numLat2 - numLat1);
  const dLon = toRadians(numLon2 - numLon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(numLat1)) * Math.cos(toRadians(numLat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  } else {
    return `${Math.round(distanceKm)} km`;
  }
};

// Extract friend location from various possible structures
const extractFriendLocation = (friend) => {
  if (friend.currentLocation?._latitude != null && friend.currentLocation?._longitude != null) {
    return {
      latitude: Number(friend.currentLocation._latitude),
      longitude: Number(friend.currentLocation._longitude)
    };
  }
  
  if (friend.currentLocation?.latitude != null && friend.currentLocation?.longitude != null) {
    return {
      latitude: Number(friend.currentLocation.latitude),
      longitude: Number(friend.currentLocation.longitude)
    };
  }
  
  if (friend.currentLocation?.lat != null && friend.currentLocation?.lng != null) {
    return {
      latitude: Number(friend.currentLocation.lat),
      longitude: Number(friend.currentLocation.lng)
    };
  }
  
  if (friend.CurrentLocation?._latitude != null && friend.CurrentLocation?._longitude != null) {
    return {
      latitude: Number(friend.CurrentLocation._latitude),
      longitude: Number(friend.CurrentLocation._longitude)
    };
  }
  
  if (friend.CurrentLocation?.latitude != null && friend.CurrentLocation?.longitude != null) {
    return {
      latitude: Number(friend.CurrentLocation.latitude),
      longitude: Number(friend.CurrentLocation.longitude)
    };
  }
  
  if (friend.CurrentLocation?.lat != null && friend.CurrentLocation?.lng != null) {
    return {
      latitude: Number(friend.CurrentLocation.lat),
      longitude: Number(friend.CurrentLocation.lng)
    };
  }

  if (friend.location?.latitude != null && friend.location?.longitude != null) {
    return {
      latitude: Number(friend.location.latitude),
      longitude: Number(friend.location.longitude)
    };
  }
  
  if (friend.location?.lat != null && friend.location?.lng != null) {
    return {
      latitude: Number(friend.location.lat),
      longitude: Number(friend.location.lng)
    };
  }
  
  if (friend.ResidenceAddress?._latitude != null && friend.ResidenceAddress?._longitude != null) {
    return {
      latitude: Number(friend.ResidenceAddress._latitude),
      longitude: Number(friend.ResidenceAddress._longitude)
    };
  }
  
  if (friend.ResidenceAddress?.latitude != null && friend.ResidenceAddress?.longitude != null) {
    return {
      latitude: Number(friend.ResidenceAddress.latitude),
      longitude: Number(friend.ResidenceAddress.longitude)
    };
  }
  
  if (friend.ResidenceAddress?.lat != null && friend.ResidenceAddress?.lng != null) {
    return {
      latitude: Number(friend.ResidenceAddress.lat),
      longitude: Number(friend.ResidenceAddress.lng)
    };
  }

  return null;
};

export const FriendsProvider = ({ children }) => {
  const [friendsData, setFriendsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  
  const friendsUnsubscribe = useRef(null);
  const presenceUnsubscribers = useRef(new Map());
  const userDataRef = useRef(null);

  const getUserLocation = useCallback((user) => {
    if (user.CurrentLocation?._latitude != null && user.CurrentLocation?._longitude != null) {
      return {
        latitude: Number(user.CurrentLocation._latitude),
        longitude: Number(user.CurrentLocation._longitude)
      };
    }
    
    if (user.CurrentLocation?.latitude != null && user.CurrentLocation?.longitude != null) {
      return {
        latitude: Number(user.CurrentLocation.latitude),
        longitude: Number(user.CurrentLocation.longitude)
      };
    }
    
    if (Array.isArray(user.CurrentLocation) && user.CurrentLocation.length === 2) {
      return {
        latitude: Number(user.CurrentLocation[0]),
        longitude: Number(user.CurrentLocation[1])
      };
    }
    
    if (user.CurrentLocation?.lat != null && user.CurrentLocation?.lng != null) {
      return {
        latitude: Number(user.CurrentLocation.lat),
        longitude: Number(user.CurrentLocation.lng)
      };
    }
    
    if (user.ResidenceAddress?._latitude != null && user.ResidenceAddress?._longitude != null) {
      return {
        latitude: Number(user.ResidenceAddress._latitude),
        longitude: Number(user.ResidenceAddress._longitude)
      };
    }
    
    if (user.ResidenceAddress?.latitude != null && user.ResidenceAddress?.longitude != null) {
      return {
        latitude: Number(user.ResidenceAddress.latitude),
        longitude: Number(user.ResidenceAddress.longitude)
      };
    }
    
    if (user.ResidenceAddress?.lat != null && user.ResidenceAddress?.lng != null) {
      return {
        latitude: Number(user.ResidenceAddress.lat),
        longitude: Number(user.ResidenceAddress.lng)
      };
    }
    
    return null;
  }, []);

  const calculateFriendDistance = useCallback((friend, currentUserLocation) => {
    if (!currentUserLocation) {
      return 'Unknown';
    }

    const friendLocation = extractFriendLocation(friend);
    if (!friendLocation) {
      return 'Unknown';
    }

    const distance = calculateDistance(
      currentUserLocation.latitude,
      currentUserLocation.longitude,
      friendLocation.latitude,
      friendLocation.longitude
    );
    
    return distance;
  }, []);

  const formatLastSeen = useCallback((timestamp) => {
    if (!timestamp) return 'Offline';
    
    const now = new Date();
    const lastSeenDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffSeconds = Math.floor((now - lastSeenDate) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'last seen just now';
    if (diffMinutes < 60) return `last seen ${diffMinutes} min ago`;
    if (diffHours < 24) return `last seen ${diffHours} hr ago`;
    if (diffDays === 1) return 'last seen yesterday';
    return `last seen on ${lastSeenDate.toLocaleDateString()}`;
  }, []);

  // Setup presence listeners for all friends - FIXED WITH BATTERY MONITORING
  const setupPresenceListeners = useCallback((friends, currentUserLocation) => {
    presenceUnsubscribers.current.forEach((unsubscribe) => {
      unsubscribe();
    });
    presenceUnsubscribers.current.clear();

    friends.forEach((friend) => {
      const friendId = friend.friendId || friend.id;
      if (!friendId) return;

      console.log(`Setting up presence listener for friend: ${friendId}`);
      
      const unsubscribe = FirebaseService.listenToUser(friendId, (userData) => {
        if (userData) {
          console.log(`Presence update for ${friendId}:`, {
            status: userData.status,
            battery: userData.Battery
          });
          
          setFriendsData((prevFriends) => 
            prevFriends.map((f) => {
              if ((f.friendId || f.id) === friendId) {
                const newDistance = calculateFriendDistance(
                  { ...f, ...userData }, 
                  currentUserLocation
                );
                
                // Extract battery data - THIS IS KEY!
                const batteryLevel = userData.Battery || userData.battery || f.batteryLevel || 100;
                
                return {
                  ...f,
                  status: userData.status,
                  lastSeen: userData.lastSeen,
                  isOnline: userData.status === 'online',
                  presenceText: userData.status === 'online' 
                    ? 'Online' 
                    : formatLastSeen(userData.lastSeen),
                  distance: newDistance,
                  currentLocation: userData.CurrentLocation || f.currentLocation,
                  location: userData.location || f.location,
                  // UPDATE BATTERY IN REAL-TIME
                  battery: `${batteryLevel}%`,
                  batteryLevel: batteryLevel,
                };
              }
              return f;
            })
          );
        }
      });

      presenceUnsubscribers.current.set(friendId, unsubscribe);
    });
  }, [formatLastSeen, calculateFriendDistance]);

  const refreshFriends = useCallback(async () => {
    if (!userDataRef.current) {
      console.log('No user data for refresh');
      return;
    }

    const userId = userDataRef.current.uid || userDataRef.current.id;
    if (!userId) return;

    try {
      console.log('Manual refresh triggered');
      const currentUserLocation = getUserLocation(userDataRef.current);
      setUserLocation(currentUserLocation);
      
      await FirebaseService.getFriendsDetails([], currentUserLocation);
      
      console.log('Manual refresh completed');
    } catch (error) {
      console.error('Error refreshing:', error);
      setError(error.message);
    }
  }, [getUserLocation]);

  useEffect(() => {
    const initializeFriends = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const jsonValue = await AsyncStorage.getItem('userData');
        if (!jsonValue) {
          console.log('No user data found in AsyncStorage');
          setLoading(false);
          return;
        }

        let user = JSON.parse(jsonValue);
        const userId = user.uid || user.id || user.userId || user.UID;
        
        if (!user.CurrentLocation && userId) {
          console.log('CurrentLocation missing in AsyncStorage, fetching from Firebase...');
          
          try {
            const freshDataResult = await FirebaseService.getUserById(userId);
            if (freshDataResult.success && freshDataResult.userData) {
              user = { ...user, ...freshDataResult.userData };
              await AsyncStorage.setItem('userData', JSON.stringify(user));
              console.log('Updated AsyncStorage with CurrentLocation from Firebase');
            }
          } catch (fetchError) {
            console.error('Error fetching fresh user data:', fetchError);
          }
        }
        
        userDataRef.current = user;
        
        console.log('Loaded user data:', {
          name: user.name || user.Name,
          email: user.email || user.Email,
          hasCurrentLocation: !!user.CurrentLocation,
          hasBattery: !!user.Battery
        });
        
        if (!userId) {
          console.error('Missing user ID');
          setLoading(false);
          return;
        }

        const currentUserLocation = getUserLocation(user);
        setUserLocation(currentUserLocation);
        
        console.log('Setting up real-time listener for userId:', userId);

        friendsUnsubscribe.current = FirebaseService.listenToFriendsWithDetails(
          userId,
          currentUserLocation,
          (friendsWithDetails) => {
            console.log('Received', friendsWithDetails.length, 'friends from Firebase');
            
            const transformedFriends = friendsWithDetails.map((friend) => {
              const distance = calculateFriendDistance(friend, currentUserLocation);
              
              return {
                id: friend.friendId || friend.uid,
                friendId: friend.friendId,
                name: friend.name,
                firstName: friend.firstName,
                lastName: friend.lastName,
                phone: friend.phone,
                email: friend.email,
                avatar: friend.avatar,
                status: friend.status || 'offline',
                isOnline: friend.status === 'online',
                lastSeen: friend.lastSeen,
                presenceText: friend.status === 'online' 
                  ? 'Online' 
                  : formatLastSeen(friend.lastSeen),
                location: friend.location,
                currentLocation: friend.currentLocation,
                distance: distance,
                battery: friend.battery,
                batteryLevel: friend.batteryLevel,
                isCloseFriend: friend.isCloseFriend,
                rating: friend.rating,
                rawData: friend.rawData
              };
            });
            
            setFriendsData(transformedFriends);
            setLoading(false);
            setLastUpdated(new Date());
            
            setupPresenceListeners(transformedFriends, currentUserLocation);
            
            console.log('Updated with', transformedFriends.length, 'friends');
          }
        );
        
      } catch (error) {
        console.error('Error initializing:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    initializeFriends();
    
    return () => {
      if (friendsUnsubscribe.current) {
        console.log('Cleaning up friends listener');
        friendsUnsubscribe.current();
      }
      
      console.log('Cleaning up presence listeners');
      presenceUnsubscribers.current.forEach((unsubscribe) => {
        unsubscribe();
      });
      presenceUnsubscribers.current.clear();
    };
  }, [getUserLocation, setupPresenceListeners, formatLastSeen, calculateFriendDistance]);

  const value = React.useMemo(() => ({
    friendsData,
    loading,
    lastUpdated,
    error,
    refreshFriends,
    friendsCount: friendsData.length,
    userLocation
  }), [friendsData, loading, lastUpdated, error, refreshFriends, userLocation]);

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
};