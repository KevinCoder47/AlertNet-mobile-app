import { StyleSheet, View, Dimensions, Image } from 'react-native';
import React, { useState, useEffect,useRef } from 'react';
import Map from '../componets/Map';
import TopBar from '../componets/TopBar';
import BottomNav from '../componets/BottomNav';
import InAppNotificationPopup from '../componets/InAppNotificationPopup'; 
import { MapProvider } from '../contexts/MapContext';
import MyProfile from '../screens/MyProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, AppState } from 'react-native';
import { serverTimestamp } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import { getUserDocument } from '../../services/firestore';
import * as Location from 'expo-location';
import { useNotifications } from '../contexts/NotificationContext';
import { updateCurrentLocation } from '../../services/firestore';
import * as TaskManager from 'expo-task-manager';
import { SOSService } from '../services/SOSService';
import WalkPartner from './WalkPartner';
import { FirebaseService } from '../../backend/Firebase/FirebaseService';
import QRCodeScanner from './QRCodeScanner';
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
import SafetyZones from './SafetyResource_Screens/safetyZones';
import LocationViewer from './LocationViewer';
import ChatProfile from './chatProfile';
import ChatScreen from './ChatScreen';

const { width, height } = Dimensions.get('window');

// Define a task to handle background location updates
// This MUST be at the top level of the module, not inside a component.
TaskManager.defineTask('backgroundLocationTask', async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    // Since this runs in the background, we can't access component state like `userData`.
    // We must retrieve the userId from storage.
    const userId = await AsyncStorage.getItem('userId');
    if (location && userId) {
      await updateCurrentLocation(userId, location.coords);
    }
  }
});
const Home = ({handleLogout}) => {
  const [isNotHome, setIsNotHome] = useState(false);
  const [isSOS, setIsSOS] = useState(false);
  const [activeSosSessionId, setActiveSosSessionId] = useState(null);
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
  const [isSafetyZones, setIsSafetyZones] = useState(false);
  const [isPeopleActive, setIsPeopleActive] = useState(false);
  const [isTopBarManuallyExpanded, setIsTopBarManuallyExpanded] = useState(false);
  const [userData, setUserData] = useState();
  const { activePopup, dismissPopup, unreadCount, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications, acceptFriendRequest, declineFriendRequest } = useNotifications();
  const [locationViewerData, setLocationViewerData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedUserId, setScannedUserId] = useState(null);
  const [scannedSosId, setScannedSosId] = useState(null);

  const [isChatScreen, setIsChatScreen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [isViewingProfileOf, setIsViewingProfileOf] = useState(null);
  
  // State for profile image
  const [userImage, setUserImage] = useState(null);
  const [cachedImagePath, setCachedImagePath] = useState(null);
  const [imageError, setImageError] = useState(false);

  //USER LOCATION:
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  
  // Moved state declarations to the top level
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [friendsDetails, setFriendsDetails] = useState({});
  const [locationUpdateInterval, setLocationUpdateInterval] = useState(null);


  const handleViewLocation = (notification) => {
    if (notification && notification.location) {
      setLocationViewerData({
        senderLocation: notification.location,
        senderName: notification.name,
        senderPhone: notification.phone,
        senderId: notification.senderId,
      });
    }
  };

  const handleOpenChat = async (personData) => {
    console.log('DEBUG: Opening chat with raw personData:', JSON.stringify(personData, null, 2));
    
    // The person's ID could come from `senderId` (from notifications) or `id` (from friends list)
    const personId = personData?.senderId || personData?.friendId || personData?.id;
    console.log('DEBUG: Resolved personId:', personId);

    if (personData && personId) {
      let completePersonData = personData.data || personData;

      // If createdAt is missing, it's likely an incomplete object. Fetch the full user doc.
      if (!completePersonData.createdAt) {
        console.log(`Incomplete user data for ${personId}, fetching full document.`);
        const userResult = await FirebaseService.getUserById(personId);
        if (userResult.success) {
          console.log('Successfully fetched full user document.');
          completePersonData = userResult.userData;
        } else {
          console.error(`Failed to fetch full user document for ${personId}:`, userResult.error);
        }
      }

      // Consolidate data from either a notification object or a direct friend object
      const name = completePersonData.name || completePersonData.Name || 'Unknown User';
      const phone = completePersonData.phone || completePersonData.Phone || null;
      const profilePicture = completePersonData.profilePicture || completePersonData.imageUrl || completePersonData.ImageURL || completePersonData.avatar || null;
      
      console.log('Profile picture for chat:', profilePicture);
      
      setChatTarget({
        id: personId,
        name: name,
        phone: phone,
        // Use a consistent property for the avatar URI
        avatar: profilePicture,
        profilePicture: profilePicture, // Keep for backward compatibility if needed
        // Spread the complete data object to ensure all fields (like createdAt) are included
        ...completePersonData
      });
      
      setIsChatScreen(true);
      // Close the main notification popup if it's open
      setIsNotification(false);
    }
  };

useEffect(() => {
  if (!userData?.userId) {
    return;
  }

  // Initialize FCM for the current user
  const initializeUserFCM = async () => {
    try {
      console.log('Initializing FCM for user:', userData.name);
      await SOSService.initializeFCM(userData.userId);
    } catch (error) {
      console.error('Error initializing FCM for user:', error);
    }
  };
  initializeUserFCM();

}, [userData]);

  useEffect(() => { // Load emergency contacts and reload them when the management screen is closed
    const loadEmergencyContacts = async () => {
      // Only load if we have a user
      if (userData?.userId) {
        const contacts = await SOSService.getEmergencyContacts();
        setEmergencyContacts(contacts);
      }
    };
    // Reload when user is loaded, or when emergency contacts screen is closed
    loadEmergencyContacts();
  }, [userData, isEmergencyContacts]);

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
          // FIX: Handle both `uid` and `id` properties to support old and new data structures.
          const friendId = friend.uid || friend.id;

          // Skip if we already have this friend's details
          if (!friendId || friendsData[friendId]) continue;
          
          try {
            const friendDoc = await getUserDocument(friendId);
            if (friendDoc) {
              friendsData[friendId] = {
                name: friendDoc.name || friend.name || 'Unknown',
                imageUrl: friendDoc.imageUrl || null,
                currentLocation: friendDoc.currentLocation || null,
                // Add any other fields you need
              };
              hasUpdates = true;
            }
          } catch (error) {
            console.error(`Error fetching details for friend ${friendId}:`, error);
            // Add a placeholder for this friend to avoid repeated attempts
            friendsData[friendId] = {
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

  // Handle app state changes for presence, notifications, and location updates
  useEffect(() => {
    const userId = userData?.userId;
    if (!userId) {
      return; // Do nothing if there's no user
    }

    // Set user to 'online' when this effect runs (e.g., on login)
    FirebaseService.updateUserStatus(userId, { status: 'online' });
    console.log(`✨ User ${userId} is now online.`);

    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App is active.');
        await FirebaseService.updateUserStatus(userId, { status: 'online' });
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('📱 App is in background.');
        if (activePopup) {
          dismissPopup();
        }
        await FirebaseService.updateUserStatus(userId, { 
          status: 'offline',
          lastSeen: serverTimestamp() 
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      // On cleanup (logout or component unmount), set user to offline
      console.log(`🚪 Cleaning up presence for user ${userId}.`);
      if (userId) {
        FirebaseService.updateUserStatus(userId, { 
          status: 'offline',
          lastSeen: serverTimestamp()
        });
      }
      subscription.remove();
    };
  }, [userData?.userId, activePopup, dismissPopup]);

  // Function to cache image
  const cacheImage = async (imageUrl) => {
    try {
      // Create a unique, safe local path from the URL
      const pathSegment = new URL(imageUrl).pathname.split('/o/')[1];
      const decodedPath = decodeURIComponent(pathSegment.split('?')[0]);
      const cachePath = `${FileSystem.cacheDirectory}${decodedPath}`;
      
      const cachedFileInfo = await FileSystem.getInfoAsync(cachePath);
      if (cachedFileInfo.exists) {
        return cachePath;
      }
      
      const directory = cachePath.substring(0, cachePath.lastIndexOf('/'));
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

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

  const handleBarCodeScanned = ({ type, data }) => {
    setIsScanning(false);
    console.log(`QR Code scanned! Type: ${type}, Data: ${data}`);
    
    try {
      const parsedData = JSON.parse(data);
      // Check if it's our specific QR code
      if (parsedData.type === 'alertnet_sos' && parsedData.userId && parsedData.sosSessionId) {
        Alert.alert(
          'SOS Detected',
          `You have scanned an emergency QR code. Viewing user's details.`,
          [{ text: 'OK' }]
        );
        // Set state to navigate to the QrCode page with the scanned user's data
        setScannedUserId(parsedData.userId);
        setScannedSosId(parsedData.sosSessionId);
        setIsQrCode(true); // This will trigger the render of QrCode page
      } else {
        Alert.alert('Invalid QR Code', 'This QR code is not a valid AlertNet SOS code.');
      }
    } catch (e) {
      if (data.startsWith('http')) {
        Linking.openURL(data);
      } else {
        Alert.alert('Invalid QR Code', 'The scanned QR code is not recognized.');
      }
    }
  };

  if (isWalkPartner) {
    return <WalkPartner setIsWalkPartner={setIsWalkPartner}
      userImage = {userImage}
    />;
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
        userData={userData}
        setIsSOS={setIsSOS}
        setIsQrCode={setIsQrCode}
        setIsSafetyResources={(value) => {
          if (value) setPreviousScreen('sos');
          setIsSafetyResources(value);
        }}
        sosSessionId={activeSosSessionId}
      />
    );
  }

  if (isScanning) {
    return <QRCodeScanner onScan={handleBarCodeScanned} onCancel={() => setIsScanning(false)} />;
  }

  if (isQrCode) {
    return <QrCode 
      setIsQrCode={(value) => {
        setIsQrCode(value);
        // Reset scanned data when closing
        setScannedUserId(null);
        setScannedSosId(null);
      }}
      setIsSOS={setIsSOS} 
      // Pass local data for own QR code view
      emergencyContacts={emergencyContacts}
      userData={userData}
      userImage={getImageSource()}
      // Pass scanned data for remote user view
      scannedUserId={scannedUserId}
      scannedSosId={scannedSosId}
    />;
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
        setIsScanning={setIsScanning}
        setIsOfflineMap={setIsOfflineMap}
        setIsSubscriptionScreen={setIsSubscriptionScreen}
        setIsDownloadedMaps={setIsDownloadedMaps}
        setIsSafetyZones = {setIsSafetyZones}
        setIsScanning={setIsScanning}
        setIsSafetyZones = {setIsSafetyZones}
        onQRCodeScanned={(userId, sosId) => {
          // Set the scanned data and navigate to QrCode page
          setScannedUserId(userId);
          setScannedSosId(sosId);
          setIsQrCode(true);
        }}
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

  if (isUserProfile){
    return <Profile 
          // ... other props
          onNavigateToChat={(person) => {
            setChatTarget(person);
            setIsChatScreen(true);
          }}
        />
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

  if (isSafetyZones) {
    return (
      <SafetyZones
        setIsSafetyZones={setIsSafetyZones}
        setIsSafetyResources={(value) => {
          if (value) setPreviousScreen('safetyZones');
          setIsSafetyResources(value);
        }}
      />
    );
  };

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

  if (locationViewerData) {
    return (
      <LocationViewer
        {...locationViewerData}
        onClose={() => setLocationViewerData(null)}
        onSendMessage={() => handleOpenChat(locationViewerData)}
      />
    );
  }

  if (isViewingProfileOf) {
    return (
      <ChatProfile
        profileData={isViewingProfileOf}
        onClose={() => {
          setIsViewingProfileOf(null);
          // Return to chat screen after closing profile
          setIsChatScreen(true);
        }}
      />
    );
  }

  if (isChatScreen) {
    return (
      <ChatScreen
        person={chatTarget}
        userData={userData}
        onClose={() => {
          setIsChatScreen(false);
          setChatTarget(null);
        }}
        onViewProfile={(person) => {
          setIsChatScreen(false); // Close chat to show profile
          setIsViewingProfileOf(person);
        }}
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
        unreadCount={unreadCount}
        />

        <BottomNav
          isNotHome={isNotHome}
          setIsNotHome={setIsNotHome}
          isWalkPartner={isWalkPartner}
          setIsWalkPartner={setIsWalkPartner}
          setIsSOS={(sessionId) => {
            setActiveSosSessionId(sessionId);
            setIsSOS(true);
          }}
          setIsPeopleActive={setIsPeopleActive}
          setIsTopBarManuallyExpanded={setIsTopBarManuallyExpanded}
          onOpenChat={handleOpenChat}
        />
        
        {/* Notifications Popup */}
        {IsNotification && (
          <NotificationsPopup
            userData={userData}
            setIsNotification={setIsNotification}
            onViewLocation={handleViewLocation}
            onOpenChat={handleOpenChat}
            // Pass down the functions from the context
            acceptFriendRequest={acceptFriendRequest}
            declineFriendRequest={declineFriendRequest}
            markNotificationAsRead={markNotificationAsRead}
            clearAllNotifications={clearAllNotifications}
          />
        )}

        {/* In-App Notification Popup - Only show for truly new notifications */}
        {activePopup && !activePopup.read && (
          <InAppNotificationPopup
            notification={activePopup}
            onDismiss={() => {
              console.log('🔕 Dismissing popup from view only.');
              dismissPopup();
            }}
            onNavigate={() => {
              // When the popup is tapped, open the main notifications page
              setIsNotification(true);
              // Also mark as read when navigating
              if (activePopup && activePopup.id) {
                markNotificationAsRead(activePopup.id);
              }
            }}
            onViewLocation={handleViewLocation}
            onOpenChat={(personData) => {
              dismissPopup(); // Dismiss the popup first
              handleOpenChat(personData);
            }}
            onAcceptFriendRequest={acceptFriendRequest}
            onDeclineFriendRequest={declineFriendRequest}
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