import { StyleSheet, View, Dimensions, Image,AppState } from 'react-native';
import React, { useState, useEffect,useRef } from 'react';
import Map from '../componets/Map';
import TopBar from '../componets/TopBar';
import BottomNav from '../componets/BottomNav';
import { MapProvider } from '../contexts/MapContext';
import MyProfile from '../screens/MyProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { getUserDocument } from '../../services/firestore';
import * as Location from 'expo-location';
import { updateCurrentLocation } from '../../services/firestore';
import * as TaskManager from 'expo-task-manager';

import WalkPartner from './WalkPartner';
import SOSPage from './SOS';
import QrCode from './QrCode';
import SafetyResources from '../screens/SafetyResource_Screens/SafetyResources';
import TestSOS from './SafetyResource_Screens/TestSOS';
import LiveLocation from './SafetyResource_Screens/LiveLocation';
import VoiceTrigger from './SafetyResource_Screens/VoiceTrigger';
import Unsafe from './SafetyResource_Screens/Unsafe';
import PreviousWalks from './SafetyResource_Screens/previousWalks';
import EmergencyContacts from './SafetyResource_Screens/emergencyContacts';
import LanguagePage from './SafetyResource_Screens/LanguagePage';
import SafetyVideos from './SafetyResource_Screens/safetyVideos';
import OfflineMap from './SafetyResource_Screens/offlineMap';
import WalkingAloneTips from './SafetyResource_Screens/walkingAlone';
import Subscription from './SafetyResource_Screens/Subscription';
import DownloadedMaps from './SafetyResource_Screens/downloadedMaps';
import NotificationsPopup from './NotificationsPopup';


const { width, height } = Dimensions.get('window');

const Home = ({handleLogout}) => {
  const [isNotHome, setIsNotHome] = useState(false);
  const [isSOS, setIsSOS] = useState(false);
  const [isWalkPartner, setIsWalkPartner] = useState(false);
  const [isQrCode, setIsQrCode] = useState(false);
  const [isSafetyResources, setIsSafetyResources] = useState(false);
  const [previousScreen, setPreviousScreen] = useState('home');
  const [isTestSOS, setIsTestSOS] = useState(false);
  const [isLiveLocation, setIsLiveLocation] = useState(false);
  const [isVoiceTrigger, setIsVoiceTrigger] = useState(false);
  const [isUnsafePage, setIsUnsafePage] = useState(false);
  const [isUserProfile, setIsUserProfile] = useState(false);
  const [isPreviousWalks, setIsPreviousWalks] = useState(false);
  const [isEmergencyContacts, setIsEmergencyContacts] = useState(false);
  const [isLanguagePage, setIsLanguagePage] = useState(false);
  const [isSafetyVideos, setIsSafetyVideos] = useState(false);
  const [isOfflineMap, setIsOfflineMap] = useState(false);
  const [isSubscriptionScreen, setIsSubscriptionScreen] = useState(false);
  const [isWalkingAloneTips, setIsWalkingAloneTips] = useState(false);
  const [isSubscription, setIsSubscription] = useState(false);
  const [isDownloadedMaps, setIsDownloadedMaps] = useState(false);
  const [downloadedMaps, setDownloadedMaps] = useState([]);
  const [IsNotification, setIsNotification] = useState(false);
  
  const [isPeopleActive, setIsPeopleActive] = useState(false);
  const [isTopBarManuallyExpanded, setIsTopBarManuallyExpanded] = useState(false);
  const [userData, setUserData] = useState();
  
  // State for profile image
  const [userImage, setUserImage] = useState(null);
  const [cachedImagePath, setCachedImagePath] = useState(null);
  const [imageError, setImageError] = useState(false);


  //USER LOCATION:
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  useEffect(() => {
  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location is required for your safety.');
      return;
    }

    const current = await Location.getCurrentPositionAsync({});
    setUserLocation(current.coords);
    
    // Update Firebase with the user's location
    if (userData && userData.userId) {
      await updateCurrentLocation(userData.userId, current.coords);
    }
  })();
}, [userData]);

// Add this useEffect to update the user's location periodically
useEffect(() => {
  const interval = setInterval(async () => {
    if (!userData) return;
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      // Update Firebase with new location
      await updateCurrentLocation(userData.userId, location.coords);
      
      // Update local state
      setUserLocation(location.coords);
    } catch (error) {
      console.error("Error updating user location:", error);
    }
  }, 30000); // Update every 30 seconds

  return () => clearInterval(interval);
}, [userData]);

  //friends
  const [friendsDetails, setFriendsDetails] = useState({});
useEffect(() => {
  const fetchFriendsDetails = async () => {
    if (!userData || !userData.friends || userData.friends.length === 0) {
      return;
    }

    try {
      // Check if we already have details for all friends
      const friendIds = userData.friends.map(f => f.uid);
      const existingIds = Object.keys(friendsDetails);
      
      // Only fetch if we don't have all friends' details
      if (friendIds.some(id => !existingIds.includes(id))) {
        const friendsData = { ...friendsDetails };
        let hasUpdates = false;
        
        // Fetch details for each friend that we don't have yet
        for (const friend of userData.friends) {
          // Skip if we already have this friend's details
          if (friendsData[friend.uid]) continue;
          
          try {
            const friendDoc = await getUserDocument(friend.uid);
            if (friendDoc) {
              friendsData[friend.uid] = {
                name: friendDoc.name || friend.name || 'Unknown',
                imageUrl: friendDoc.imageUrl || null,
                currentLocation: friendDoc.currentLocation || null,
                // Add any other fields you need
              };
              hasUpdates = true;
            }
          } catch (error) {
            console.error(`Error fetching details for friend ${friend.uid}:`, error);
            // Add a placeholder for this friend to avoid repeated attempts
            friendsData[friend.uid] = {
              name: friend.name || 'Unknown',
              imageUrl: null,
              currentLocation: null,
            };
            hasUpdates = true;
          }
        }
        
        // Only update state if we actually fetched new data
        if (hasUpdates) {
          setFriendsDetails(friendsData);
        }
      }
    } catch (error) {
      console.error("Error in fetchFriendsDetails:", error);
    }
  };

  fetchFriendsDetails();
}, [userData, friendsDetails]);
  
  //UPDATE CURRENT LOCATION IN THE MOST EFFICIENT WAY
  const [locationUpdateInterval, setLocationUpdateInterval] = useState(null);
useEffect(() => {
  const updateUserLocation = async () => {
    if (!userData) return;
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      // Update Firebase with new location
      await updateCurrentLocation(userData.userId, location.coords);
      
      // Update local state if needed
      setUserLocation(location.coords);
    } catch (error) {
      console.error("Error updating user location:", error);
    }
  };
  
  // Update immediately
  updateUserLocation();
  
  // Set up interval for updates (every 30 seconds when app is active)
  const interval = setInterval(updateUserLocation, 30000);
  setLocationUpdateInterval(interval);
  
  return () => {
    if (locationUpdateInterval) {
      clearInterval(locationUpdateInterval);
    }
  };
}, [userData]);
  
  
// Request background location permissions
useEffect(() => {
  const requestBackgroundPermission = async () => {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status === 'granted') {
        // Start background location updates
        await Location.startLocationUpdatesAsync('backgroundLocationTask', {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 300000, // 5 minutes
          distanceInterval: 100, // 100 meters
          showsBackgroundLocationIndicator: true,
        });
      }
    } catch (error) {
      console.error("Error requesting background location:", error);
    }
  };
  
  requestBackgroundPermission();
  
  return () => {
    // Clean up when component unmounts
    Location.stopLocationUpdatesAsync('backgroundLocationTask');
  };
}, []);

// Define a task to handle background location updates
TaskManager.defineTask('backgroundLocationTask', async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  
  if (data && userData) {
    const { locations } = data;
    const location = locations[0];
    
    if (location) {
      // Update Firebase with new location
      await updateCurrentLocation(userData.userId, location.coords);
    }
  }
});
  
  

// Add app state awareness to reduce updates when app is in background
useEffect(() => {
  const subscription = AppState.addEventListener('change', nextAppState => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // Clear interval when app goes to background
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
        setLocationUpdateInterval(null);
      }
    } else if (nextAppState === 'active') {
      // Restart interval when app comes to foreground
      const interval = setInterval(async () => {
        if (!userData) return;
        
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
          });
          await updateCurrentLocation(userData.userId, location.coords);
        } catch (error) {
          console.error("Error updating user location:", error);
        }
      }, 30000);
      
      setLocationUpdateInterval(interval);
    }
  });
  
  return () => {
    subscription.remove();
  };
}, [userData]);

  // Function to cache image
  const cacheImage = async (imageUrl) => {
    try {
      // Create a unique filename for the cached image
      const filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
      const cachePath = `${FileSystem.cacheDirectory}${filename}`;
      
      // Check if image is already cached
      const cachedFileInfo = await FileSystem.getInfoAsync(cachePath);
      
      if (cachedFileInfo.exists) {
        console.log('Using cached image');
        return cachePath;
      }
      
      // Download and cache the image
      console.log('Downloading and caching image');
      const { uri } = await FileSystem.downloadAsync(imageUrl, cachePath);
      return uri;
    } catch (error) {
      console.error('Error caching image:', error);
      return imageUrl; // Fallback to original URL
    }
  };

  // Load profile image and downloaded maps from AsyncStorage
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const userDataJSON = await AsyncStorage.getItem('userData');
        
        if (userDataJSON) {
          const userData = JSON.parse(userDataJSON);
          console.log("User data loaded:", userData.name);
          setUserData(userData);
          
          // Priority 1: Use Firebase Storage URL if available
          if (userData.imageUrl) {
            // Cache the image
            const cachedUri = await cacheImage(userData.imageUrl);
            setCachedImagePath(cachedUri);
            setUserImage(cachedUri);
          } 
          // Priority 2: Fall back to local image path
          else if (userData.localImagePath) {
            setUserImage(userData.localImagePath);
          }
        }
      } catch (error) {
        console.error('Failed to load profile image', error);
      }
    };

    const loadDownloadedMaps = async () => {
      try {
        const mapsJSON = await AsyncStorage.getItem('downloadedMaps');
        if (mapsJSON) {
          setDownloadedMaps(JSON.parse(mapsJSON));
        }
      } catch (error) {
        console.error('Failed to load downloaded maps', error);
      }
    };

    loadProfileImage();
    loadDownloadedMaps();
  }, []);

  // Function to get the image source - will return cached path if available
  const getImageSource = () => {
    return cachedImagePath || userImage;
  };

  // Function to render profile image with fallback
  const renderProfileImage = () => {
    const imageSource = getImageSource();
    
    if (imageSource && !imageError) {
      return (
        <Image
          source={{ uri: imageSource }}
          style={styles.profileImage}
          onError={handleImageError}
          resizeMode="cover"
        />
      );
    } else {
      return (
        <View style={styles.placeholderImage}>
          <Ionicons name="person" size={24} color="#fff" />
        </View>
      );
    }
  };

  // Handle image loading errors
  const handleImageError = () => {
    console.log('Image failed to load');
    setImageError(true);
    
    // If cached image failed, try the original URL as fallback
    if (cachedImagePath) {
      const tryOriginalUrl = async () => {
        try {
          const userDataJSON = await AsyncStorage.getItem('userData');
          if (userDataJSON) {
            const userData = JSON.parse(userDataJSON);
            if (userData.imageUrl && userData.imageUrl !== cachedImagePath) {
              setUserImage(userData.imageUrl);
            }
          }
        } catch (error) {
          console.error('Failed to load fallback image', error);
        }
      };
      
      tryOriginalUrl();
    }
  };

  if (isWalkPartner) {
    return <WalkPartner setIsWalkPartner={setIsWalkPartner} />;
  }

  if (isUserProfile) {
    return <MyProfile
      setIsUserProfile={setIsUserProfile}
      userImage={getImageSource()}
      userData = {userData}
    />;
  }

  if (isSOS) {
    return (
      <SOSPage
        setIsSOS={setIsSOS}
        setIsQrCode={setIsQrCode}
        setIsSafetyResources={(value) => {
          if (value) setPreviousScreen('sos');
          setIsSafetyResources(value);
        }}
      />
    );
  }

  if (isQrCode) {
    return <QrCode setIsQrCode={setIsQrCode} setIsSOS={setIsSOS} />;
  }

  if (isTestSOS) {
    return (
      <TestSOS
        setIsTestSOS={setIsTestSOS}
        setIsSafetyResources={(value) => {
          if (value) setPreviousScreen('testSOS');
          setIsSafetyResources(value);
        }}
      />
    );
  }

  if (isLiveLocation) {
    return (
      <LiveLocation
        setIsLiveLocation={setIsLiveLocation}
        setIsSafetyResources={setIsSafetyResources}
      />
    );
  }

  if (isVoiceTrigger) {
    return (
      <VoiceTrigger
        setIsVoiceTrigger={setIsVoiceTrigger}
        setIsSafetyResources={(value) => {
          if (value) setPreviousScreen('voiceTrigger');
          setIsSafetyResources(value);
        }}
      />
    );
  }

  if (isSafetyResources) {
    return (
      <SafetyResources
        setIsSafetyResources={setIsSafetyResources}
        setIsSOS={setIsSOS}
        setIsTestSOS={setIsTestSOS}
        setIsLiveLocation={setIsLiveLocation}
        setIsVoiceTrigger={setIsVoiceTrigger}
        setIsUnsafePage={setIsUnsafePage}
        setIsPreviousWalks={setIsPreviousWalks} 
        setIsEmergencyContacts = {setIsEmergencyContacts}
        setIsLanguagePage = {setIsLanguagePage}
        setIsSafetyVideos = {setIsSafetyVideos}
        setIsOfflineMap = {setIsOfflineMap}
        setIsSubscription = {setIsSubscription} 
        setIsWalkingAloneTips={setIsWalkingAloneTips}
        handleLogout={handleLogout}
        setIsSubscriptionScreen = {setIsSubscriptionScreen}
        setIsDownloadedMaps = {setIsDownloadedMaps}
        previousScreen={previousScreen}
        setIsUserProfile={setIsUserProfile}
        setIsWalkPartner={setIsWalkPartner}
        setIsQrCode={setIsQrCode}
        setIsEmergencyContacts={setIsEmergencyContacts}
        setIsLanguagePage={setIsLanguagePage}
        setIsSafetyVideos={setIsSafetyVideos}
        setIsOfflineMap={setIsOfflineMap}
        setIsSubscriptionScreen={setIsSubscriptionScreen}
        setIsDownloadedMaps={setIsDownloadedMaps}
      />
    );
  }

  if (isUnsafePage) {
    return (
      <Unsafe
        setIsUnsafePage={setIsUnsafePage}
        setIsSafetyResources={(value) => {
          if (value) setPreviousScreen('unsafe');
          setIsSafetyResources(value);
        }}
        setIsSOS={setIsSOS}
      />
    );
  }

  if (isPreviousWalks) {
    return (
      <PreviousWalks
        setIsPreviousWalks={setIsPreviousWalks}
        setIsSafetyResources={(value) => {
          if (value) setPreviousScreen('previousWalks');
          setIsSafetyResources(value);
        }}
      />
    );
  }

  if (isEmergencyContacts) {
    return (
      <EmergencyContacts
        setIsEmergencyContacts={setIsEmergencyContacts}
        setIsSafetyResources={(value) => {
          if (value) setPreviousScreen('emergencyContacts');
          setIsSafetyResources(value);
        }}
      />
    );
  }

  if (isLanguagePage) {
    return (
      <LanguagePage
        setIsLanguagePage={setIsLanguagePage}
        setIsSafetyResources={(value) => {
          if (value) setPreviousScreen('languagePage');
          setIsSafetyResources(value);
        }}
      />
    );
  }

  if (isSafetyVideos) {
    return (
      <SafetyVideos
        setIsSafetyVideos={setIsSafetyVideos}
        setIsSafetyResources={(value) => {
          if (value) setPreviousScreen('safetyVideos');
          setIsSafetyResources(value);
        }}
      />
    );
  }

  if (isOfflineMap) {
    return (
      <OfflineMap
        setIsOfflineMap={setIsOfflineMap}
        setIsSafetyResources={(value) => {
          if (value) setPreviousScreen('offlineMap');
          setIsSafetyResources(value);
        }}
        setIsDownloadedMaps={setIsDownloadedMaps}
        downloadedMaps={downloadedMaps}
        setDownloadedMaps={setDownloadedMaps}
      />
    );
  }

  if (isSubscriptionScreen) {
    return (
      <Subscription
        setIsSubscriptionScreen={setIsSubscriptionScreen}
        setIsSafetyResources={(value) => {
          if (value) setPreviousScreen('subscription');
          setIsSafetyResources(value);
        }}
      />
    );
  }

  if (isWalkingAloneTips) {
    return (
      <WalkingAloneTips
        setIsWalkingAloneTips={setIsWalkingAloneTips}
        setIsSafetyResources={(value) => {
          if (value) setPreviousScreen('walkingAloneTips');
          setIsSafetyResources(value);
        }}
      />
    );
  }

  if (isDownloadedMaps) {
    return (
      <DownloadedMaps
        navigation={{
          goBack: () => {
            setIsDownloadedMaps(false);
            setPreviousScreen('downloadedMaps');
            setIsSafetyResources(true);
          }
        }}
        setIsOfflineMap={setIsOfflineMap}
        setIsDownloadedMaps={setIsDownloadedMaps}
        downloadedMaps={downloadedMaps}
        setDownloadedMaps={setDownloadedMaps}
      />
    );
  }

  return (
  <MapProvider value={{ mapRef, userLocation, setUserLocation }}>
      <View style={styles.container}>
        <Map 
          userImage={getImageSource()} 
          friendsDetails={friendsDetails} 
          setFriendsDetails={setFriendsDetails}
          userLocation={userLocation}
          mapRef={mapRef}
        />
        <TopBar 
          setIsUserProfile={setIsUserProfile}
          isNotHome={isNotHome}
          isPeopleActive={isPeopleActive}
          isTopBarManuallyExpanded={isTopBarManuallyExpanded}
          setIsTopBarManuallyExpanded={setIsTopBarManuallyExpanded}
          setIsSafetyResources={() => {
            setPreviousScreen('home');
            setIsSafetyResources(true);
          }}
          userImage={getImageSource()}
          setIsNotification={setIsNotification}
          renderProfileImage={renderProfileImage}
        userLocation = {userLocation}
        />

        <BottomNav
          isNotHome={isNotHome}
          setIsNotHome={setIsNotHome}
          isWalkPartner={isWalkPartner}
          setIsWalkPartner={setIsWalkPartner}
          setIsSOS={setIsSOS}
          setIsPeopleActive={setIsPeopleActive}
          setIsTopBarManuallyExpanded={setIsTopBarManuallyExpanded}
        />
        
        {/* Notifications Popup */}
        {IsNotification && (
          <NotificationsPopup
            setIsNotification={setIsNotification}
          />
        )}
      </View>
    </MapProvider>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    // flex: 1,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  placeholderImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FE5235',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});