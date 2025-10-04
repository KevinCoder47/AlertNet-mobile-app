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
  console.log('Calculating distance between:', { lat1, lon1, lat2, lon2 });
  
  // Validate inputs
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    console.log('Distance calc: Missing coordinate');
    return 'Unknown';
  }
  
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) {
    console.log('Distance calc: Invalid number');
    return 'Unknown';
  }
  
  if (numLat1 < -90 || numLat1 > 90 || numLat2 < -90 || numLat2 > 90) {
    console.log('Distance calc: Invalid latitude range');
    return 'Unknown';
  }
  
  if (numLon1 < -180 || numLon1 > 180 || numLon2 < -180 || numLon2 > 180) {
    console.log('Distance calc: Invalid longitude range');
    return 'Unknown';
  }

  const R = 6371; // Earth's radius in kilometers
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  
  const dLat = toRadians(numLat2 - numLat1);
  const dLon = toRadians(numLon2 - numLon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(numLat1)) * Math.cos(toRadians(numLat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  
  console.log('Calculated distance:', distanceKm, 'km');
  
  // Format distance
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
  console.log('Extracting friend location for:', friend.name || friend.friendId);
  
  // Handle Firebase GeoPoint in currentLocation
  if (friend.currentLocation?._latitude != null && friend.currentLocation?._longitude != null) {
    console.log('Found currentLocation (GeoPoint)');
    return {
      latitude: Number(friend.currentLocation._latitude),
      longitude: Number(friend.currentLocation._longitude)
    };
  }
  
  // Handle object with latitude/longitude in currentLocation
  if (friend.currentLocation?.latitude != null && friend.currentLocation?.longitude != null) {
    console.log('Found currentLocation (object)');
    return {
      latitude: Number(friend.currentLocation.latitude),
      longitude: Number(friend.currentLocation.longitude)
    };
  }
  
  // Handle lat/lng in currentLocation
  if (friend.currentLocation?.lat != null && friend.currentLocation?.lng != null) {
    console.log('Found currentLocation (lat/lng)');
    return {
      latitude: Number(friend.currentLocation.lat),
      longitude: Number(friend.currentLocation.lng)
    };
  }
  
  // Handle Firebase GeoPoint in CurrentLocation
  if (friend.CurrentLocation?._latitude != null && friend.CurrentLocation?._longitude != null) {
    console.log('Found CurrentLocation (GeoPoint)');
    return {
      latitude: Number(friend.CurrentLocation._latitude),
      longitude: Number(friend.CurrentLocation._longitude)
    };
  }
  
  // Handle object with latitude/longitude in CurrentLocation
  if (friend.CurrentLocation?.latitude != null && friend.CurrentLocation?.longitude != null) {
    console.log('Found CurrentLocation (object)');
    return {
      latitude: Number(friend.CurrentLocation.latitude),
      longitude: Number(friend.CurrentLocation.longitude)
    };
  }
  
  // Handle lat/lng in CurrentLocation
  if (friend.CurrentLocation?.lat != null && friend.CurrentLocation?.lng != null) {
    console.log('Found CurrentLocation (lat/lng)');
    return {
      latitude: Number(friend.CurrentLocation.lat),
      longitude: Number(friend.CurrentLocation.lng)
    };
  }

  // Handle location field
  if (friend.location?.latitude != null && friend.location?.longitude != null) {
    console.log('Found location');
    return {
      latitude: Number(friend.location.latitude),
      longitude: Number(friend.location.longitude)
    };
  }
  
  if (friend.location?.lat != null && friend.location?.lng != null) {
    console.log('Found location (lat/lng)');
    return {
      latitude: Number(friend.location.lat),
      longitude: Number(friend.location.lng)
    };
  }
  
  // Handle ResidenceAddress as fallback
  if (friend.ResidenceAddress?._latitude != null && friend.ResidenceAddress?._longitude != null) {
    console.log('Found ResidenceAddress (GeoPoint)');
    return {
      latitude: Number(friend.ResidenceAddress._latitude),
      longitude: Number(friend.ResidenceAddress._longitude)
    };
  }
  
  if (friend.ResidenceAddress?.latitude != null && friend.ResidenceAddress?.longitude != null) {
    console.log('Found ResidenceAddress');
    return {
      latitude: Number(friend.ResidenceAddress.latitude),
      longitude: Number(friend.ResidenceAddress.longitude)
    };
  }
  
  if (friend.ResidenceAddress?.lat != null && friend.ResidenceAddress?.lng != null) {
    console.log('Found ResidenceAddress (lat/lng)');
    return {
      latitude: Number(friend.ResidenceAddress.lat),
      longitude: Number(friend.ResidenceAddress.lng)
    };
  }

  console.log('No valid location found for friend');
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

  // Helper to get user location with all possible formats
  const getUserLocation = useCallback((user) => {
    console.log('Getting user location from user data');
    console.log('User data keys:', Object.keys(user));
    console.log('CurrentLocation type:', typeof user.CurrentLocation);
    console.log('CurrentLocation value:', user.CurrentLocation);
    
    // Handle Firebase GeoPoint (has _latitude and _longitude)
    if (user.CurrentLocation?._latitude != null && user.CurrentLocation?._longitude != null) {
      console.log('User CurrentLocation found (GeoPoint)');
      return {
        latitude: Number(user.CurrentLocation._latitude),
        longitude: Number(user.CurrentLocation._longitude)
      };
    }
    
    // Handle coordinates object with latitude/longitude
    if (user.CurrentLocation?.latitude != null && user.CurrentLocation?.longitude != null) {
      console.log('User CurrentLocation found (object)');
      return {
        latitude: Number(user.CurrentLocation.latitude),
        longitude: Number(user.CurrentLocation.longitude)
      };
    }
    
    // Handle coordinates array [latitude, longitude]
    if (Array.isArray(user.CurrentLocation) && user.CurrentLocation.length === 2) {
      console.log('User CurrentLocation found (array)');
      return {
        latitude: Number(user.CurrentLocation[0]),
        longitude: Number(user.CurrentLocation[1])
      };
    }
    
    // Handle coordinates object with lat/lng (shorter names)
    if (user.CurrentLocation?.lat != null && user.CurrentLocation?.lng != null) {
      console.log('User CurrentLocation found (lat/lng)');
      return {
        latitude: Number(user.CurrentLocation.lat),
        longitude: Number(user.CurrentLocation.lng)
      };
    }
    
    // Try ResidenceAddress as fallback
    if (user.ResidenceAddress?._latitude != null && user.ResidenceAddress?._longitude != null) {
      console.log('User ResidenceAddress found (GeoPoint)');
      return {
        latitude: Number(user.ResidenceAddress._latitude),
        longitude: Number(user.ResidenceAddress._longitude)
      };
    }
    
    if (user.ResidenceAddress?.latitude != null && user.ResidenceAddress?.longitude != null) {
      console.log('User ResidenceAddress found (object)');
      return {
        latitude: Number(user.ResidenceAddress.latitude),
        longitude: Number(user.ResidenceAddress.longitude)
      };
    }
    
    if (user.ResidenceAddress?.lat != null && user.ResidenceAddress?.lng != null) {
      console.log('User ResidenceAddress found (lat/lng)');
      return {
        latitude: Number(user.ResidenceAddress.lat),
        longitude: Number(user.ResidenceAddress.lng)
      };
    }
    
    console.log('No user location found');
    return null;
  }, []);

  // Calculate distance for a friend
  const calculateFriendDistance = useCallback((friend, currentUserLocation) => {
    console.log('calculateFriendDistance called for:', friend.name);
    console.log('User location:', currentUserLocation);
    
    if (!currentUserLocation) {
      console.log('No user location provided');
      return 'Unknown';
    }

    const friendLocation = extractFriendLocation(friend);
    if (!friendLocation) {
      console.log('No friend location found');
      return 'Unknown';
    }

    const distance = calculateDistance(
      currentUserLocation.latitude,
      currentUserLocation.longitude,
      friendLocation.latitude,
      friendLocation.longitude
    );
    
    console.log('Final distance for', friend.name, ':', distance);
    return distance;
  }, []);

  // Format last seen timestamp
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

  // Setup presence listeners for all friends
  const setupPresenceListeners = useCallback((friends, currentUserLocation) => {
    // Clean up old listeners
    presenceUnsubscribers.current.forEach((unsubscribe) => {
      unsubscribe();
    });
    presenceUnsubscribers.current.clear();

    // Setup new listeners for each friend
    friends.forEach((friend) => {
      const friendId = friend.friendId || friend.id;
      if (!friendId) return;

      console.log(`Setting up presence listener for friend: ${friendId}`);
      
      const unsubscribe = FirebaseService.listenToUser(friendId, (userData) => {
        if (userData) {
          console.log(`Presence update for ${friendId}:`, userData.status);
          
          // Update the specific friend's presence data
          setFriendsData((prevFriends) => 
            prevFriends.map((f) => {
              if ((f.friendId || f.id) === friendId) {
                // Recalculate distance if location changed
                const newDistance = calculateFriendDistance(
                  { ...f, ...userData }, 
                  currentUserLocation
                );
                
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

  // Manual refresh function
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
      
      const result = await FirebaseService.getFriendsDetails(
        [],
        currentUserLocation
      );
      
      console.log('Manual refresh completed');
    } catch (error) {
      console.error('Error refreshing:', error);
      setError(error.message);
    }
  }, [getUserLocation]);

  // Initialize friends listener
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
        
        // CRITICAL FIX: If CurrentLocation is missing, fetch fresh data from Firebase
        const userId = user.uid || user.id || user.userId || user.UID;
        
        if (!user.CurrentLocation && userId) {
          console.log('CurrentLocation missing in AsyncStorage, fetching from Firebase...');
          
          try {
            const freshDataResult = await FirebaseService.getUserById(userId);
            if (freshDataResult.success && freshDataResult.userData) {
              // Merge fresh data
              user = { ...user, ...freshDataResult.userData };
              // Update AsyncStorage with fresh data
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
          currentLocationValue: user.CurrentLocation,
          hasResidenceAddress: !!user.ResidenceAddress
        });
        
        if (!userId) {
          console.error('Missing user ID');
          setLoading(false);
          return;
        }

        const currentUserLocation = getUserLocation(user);
        setUserLocation(currentUserLocation);
        
        console.log('Current user location:', currentUserLocation);
        console.log('Setting up real-time listener for userId:', userId);

        // Set up real-time listener for friends list
        friendsUnsubscribe.current = FirebaseService.listenToFriendsWithDetails(
          userId,
          currentUserLocation,
          (friendsWithDetails) => {
            console.log('Received', friendsWithDetails.length, 'friends from Firebase');
            
            // Transform for consistent structure with distance calculation
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
            
            console.log('Transformed friends with distances:', 
              transformedFriends.map(f => ({ name: f.name, distance: f.distance }))
            );
            
            setFriendsData(transformedFriends);
            setLoading(false);
            setLastUpdated(new Date());
            
            // Setup presence listeners for all friends
            setupPresenceListeners(transformedFriends, currentUserLocation);
            
            console.log('Updated with', transformedFriends.length, 'friends with distances');
          }
        );
        
      } catch (error) {
        console.error('Error initializing:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    initializeFriends();
    
    // Cleanup on unmount
    return () => {
      if (friendsUnsubscribe.current) {
        console.log('Cleaning up friends listener');
        friendsUnsubscribe.current();
      }
      
      // Cleanup all presence listeners
      console.log('Cleaning up presence listeners');
      presenceUnsubscribers.current.forEach((unsubscribe) => {
        unsubscribe();
      });
      presenceUnsubscribers.current.clear();
    };
  }, [getUserLocation, setupPresenceListeners, formatLastSeen, calculateFriendDistance]);

  // Memoize the context value
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