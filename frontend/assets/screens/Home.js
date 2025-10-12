import { StyleSheet, View, Dimensions, Image, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map from '../componets/Map';
import TopBar from '../componets/TopBar';
import BottomNav from '../componets/BottomNav';
import InAppNotificationPopup from '../componets/InAppNotificationPopup'; 
import { MapProvider } from '../contexts/MapContext';
import { useFriends } from '../contexts/FriendsContext';
import MyProfile from '../screens/MyProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, AppState } from 'react-native';
import { serverTimestamp } from 'firebase/firestore';
// import * as FileSystem from 'expo-file-system/legacy';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
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
import SafetyResources from './SafetyResource_Screens/SafetyResources';
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
import ChatBot from '../componets/ChatBot';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Define background location task at module level
TaskManager.defineTask('backgroundLocationTask', async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    const userId = await AsyncStorage.getItem('userId');
    if (location && userId) {
      await updateCurrentLocation(userId, location.coords);
    }
  }
});

const Home = ({ route, handleLogout }) => {
  // Use FriendsContext for global friend management
  const { friendsData, loading: friendsLoading, refreshFriends } = useFriends();
  
  // Convert friends array to object format for SafetyMap compatibility
  const friendsDetails = React.useMemo(() => {
    // // console.log($&);
    return friendsData.reduce((acc, friend) => {
      const id = friend.friendId || friend.uid;
      if (id) {
        acc[id] = friend;
      }
      return acc;
    }, {});
  }, [friendsData]);

  // Log when friends data changes
  useEffect(() => {
    // // console.log($&);
    // console.log('Home: Friends with locations:', 
    //   friendsData.filter(f => f.currentLocation).length
    // );
  }, [friendsData]);

  // NotificationContext walk partner state
  const { 
    acceptedWalkRequest, 
    setAcceptedWalkRequest,
    currentWalkRequest 
  } = useNotifications();

  const [autoNavigateToWalkPartner, setAutoNavigateToWalkPartner] = useState(false);

  // State declarations
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
  const [chatOpenedFrom, setChatOpenedFrom] = useState(null); // Track where chat was opened from
  const [userImage, setUserImage] = useState(null);
  const [cachedImagePath, setCachedImagePath] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  // We need the navigation object to go back
  const navigation = route.params?.navigation;

  const [locationUpdateInterval, setLocationUpdateInterval] = useState(null);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);

  const handleViewLocation = (notification) => {
    if (notification && notification.location) {
      setLocationViewerData({
        senderLocation: notification.location,
        senderName: notification.name,
        senderPhone: notification.phone,
        senderId: notification.senderId,
        locationTimestamp: notification.timestamp,
        senderProfilePicture: notification.profilePicture,
      });
    }
  };

  // Listen for navigation parameters to open a chat
  useEffect(() => {
    if (route.params?.openChatWith) {
      const personToChat = route.params.openChatWith;
      // console.log($&);
      handleOpenChat(personToChat);
      // If opened via navigation, record the source
      if (route.params.from) {
        setChatOpenedFrom(route.params.from);
      }
      // Clear the param to prevent re-triggering
      navigation.setParams({ openChatWith: null, from: null });
    }
  }, [route.params?.openChatWith]);

<<<<<<< HEAD
  const handleOpenChat = async (personData, from) => {
    console.log('DEBUG: Opening chat with raw personData:', JSON.stringify(personData, null, 2));
=======
  const handleOpenChat = async (personData) => {
    // // console.log($&);
>>>>>>> 626e3c10c78c35faee4169104691b731119fc4ff
    
    const personId = personData?.senderId || personData?.friendId || personData?.id;
    // // console.log($&);

    if (personData && personId) {
      let completePersonData = personData.data || personData;

      if (!completePersonData.createdAt) {
        // console.log($&);
        const userResult = await FirebaseService.getUserById(personId);
        if (userResult.success) {
          // console.log($&);
          completePersonData = userResult.userData;
        } else {
          console.error(`Failed to fetch full user document for ${personId}:`, userResult.error);
        }
      }

      const name = completePersonData.name || completePersonData.Name || 'Unknown User';
      const phone = completePersonData.phone || completePersonData.Phone || null;
      const profilePicture = completePersonData.profilePicture || completePersonData.imageUrl || completePersonData.ImageURL || completePersonData.avatar || null;
      
      // console.log($&);
      
      if (from) {
        setChatOpenedFrom(from);
      }

      setChatTarget({
        id: personId,
        name: name,
        phone: phone,
        avatar: profilePicture,
        profilePicture: profilePicture,
        ...completePersonData
      });
      
      setIsChatScreen(true);
      setIsNotification(false);
    }
  };

  // Initialize FCM
  useEffect(() => {
    if (!userData?.userId) {
      return;
    }

    const initializeUserFCM = async () => {
      try {
        // console.log($&);
        await SOSService.initializeFCM(userData.userId);
      } catch (error) {
        console.error('Error initializing FCM for user:', error);
      }
    };
    initializeUserFCM();
  }, [userData]);

  // Load emergency contacts
  useEffect(() => {
    const loadEmergencyContacts = async () => {
      if (userData?.userId) {
        const contacts = await SOSService.getEmergencyContacts();
        setEmergencyContacts(contacts);
      }
    };
    loadEmergencyContacts();
  }, [userData, isEmergencyContacts]);

  // Initial location setup
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location is required for your safety.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      setUserLocation(current.coords);
      
      if (userData && userData.userId) {
        await updateCurrentLocation(userData.userId, current.coords);
      }
    })();
  }, [userData]);

  // Periodic location updates
  useEffect(() => {
    const updateUserLocation = async () => {
      if (!userData) return;
      
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        await updateCurrentLocation(userData.userId, location.coords);
        setUserLocation(location.coords);
      } catch (error) {
        console.error("Error updating user location:", error);
      }
    };
    
    updateUserLocation();
    
    const interval = setInterval(updateUserLocation, 30000);
    setLocationUpdateInterval(interval);
    
    return () => {
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
      }
    };
  }, [userData]);

  // Background location permissions
  useEffect(() => {
    if (userData?.userId) { // Only run when we have a user
      const requestBackgroundPermission = async () => {
        try {
          const { status } = await Location.requestBackgroundPermissionsAsync();
          if (status === 'granted') {
            await Location.startLocationUpdatesAsync('backgroundLocationTask', {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 300000,
              distanceInterval: 100,
              showsBackgroundLocationIndicator: true,
            });
          }
        } catch (error) {
          console.error("Error requesting background location:", error);
        }
<<<<<<< HEAD
      };
      
      requestBackgroundPermission();
      
      return () => {
        Location.stopLocationUpdatesAsync('backgroundLocationTask');
      };
    }
  }, [userData?.userId]); // Now depends on having a valid user ID
=======
      } catch (error) {
        // console.error("Error requesting background location:", error);
      }
    };
    
    requestBackgroundPermission();
    
    return () => {
      Location.stopLocationUpdatesAsync('backgroundLocationTask');
    };
  }, []);
>>>>>>> 626e3c10c78c35faee4169104691b731119fc4ff

  // User presence management
  useEffect(() => {
    const userId = userData?.userId;
    if (!userId) {
      return;
    }

    FirebaseService.updateUserStatus(userId, { status: 'online' });
    // console.log($&);

    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active') {
        // console.log($&);
        await FirebaseService.updateUserStatus(userId, { status: 'online' });
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // console.log($&);
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
      // console.log($&);
      if (userId) {
        FirebaseService.updateUserStatus(userId, { 
          status: 'offline',
          lastSeen: serverTimestamp()
        });
      }
      subscription.remove();
    };
  }, [userData?.userId, activePopup, dismissPopup]);

  // Image caching functions
  const cacheImage = async (imageUrl) => {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        imageUrl
      );
      const cacheDir = `${FileSystem.cacheDirectory}profileImages/`;
      const cachePath = `${cacheDir}${hash}`;

      const cachedFileInfo = await FileSystem.getInfoAsync(cachePath);
      if (cachedFileInfo.exists) {
        return cachePath;
      }

      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      const { uri } = await FileSystem.downloadAsync(imageUrl, cachePath);
      return uri;
    } catch (error) {
      console.error('Error caching image:', error);
      return imageUrl;
    }
  };

  const cleanupImageCache = async () => {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}profileImages/`;
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      if (files.length <= 1) return;

      const fileInfos = await Promise.all(
        files.map(async (file) => {
          const info = await FileSystem.getInfoAsync(`${cacheDir}${file}`);
          return { file, mtime: info.modificationTime || 0 };
        })
      );
      fileInfos.sort((a, b) => b.mtime - a.mtime);
      const filesToDelete = fileInfos.slice(1).map((f) => f.file);
      for (const file of filesToDelete) {
        await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
      }
    } catch (error) {
      // Directory may not exist yet, ignore
    }
  };

  // Load profile image and downloaded maps
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const userDataJSON = await AsyncStorage.getItem('userData');
        
        if (userDataJSON) {
          const userData = JSON.parse(userDataJSON);
          // console.log($&);
          setUserData(userData);
          
          if (userData.imageUrl) {
            const cachedUri = await cacheImage(userData.imageUrl);
            setCachedImagePath(cachedUri);
            setUserImage(cachedUri);
            await cleanupImageCache();
          } 
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

  const getImageSource = () => {
    return cachedImagePath || userImage;
  };

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

  const handleImageError = () => {
    // console.log($&);
    setImageError(true);
    
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
    // console.log($&);
    
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.type === 'alertnet_sos' && parsedData.userId && parsedData.sosSessionId) {
        Alert.alert(
          'SOS Detected',
          `You have scanned an emergency QR code. Viewing user's details.`,
          [{ text: 'OK' }]
        );
        setScannedUserId(parsedData.userId);
        setScannedSosId(parsedData.sosSessionId);
        setIsQrCode(true);
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

  // Auto-navigate to WalkPartner when walk is accepted by both
  useEffect(() => {
    console.log('🏠 [Home] Checking acceptedWalkRequest:', acceptedWalkRequest);
    
    if (acceptedWalkRequest && acceptedWalkRequest.status === 'accepted_by_both') {
      console.log('🏠 [Home] Receiver walk confirmed, auto-navigating to WalkPartner');
      
      setAutoNavigateToWalkPartner(true);
      setIsWalkPartner(true);
    }
  }, [acceptedWalkRequest]);

  // Reset auto-navigate on leaving WalkPartner
  useEffect(() => {
    if (!isWalkPartner) {
      setAutoNavigateToWalkPartner(false);
    }
  }, [isWalkPartner]);

  // Conditional screen renders
  if (isWalkPartner) {
    return (
      <WalkPartner 
        setIsWalkPartner={(value) => {
          setIsWalkPartner(value);
          if (!value && acceptedWalkRequest) {
            setAcceptedWalkRequest(null);
          }
        }} 
        userImage={userImage}
        isReceiverWalk={autoNavigateToWalkPartner}
        initialAcceptedWalkRequest={autoNavigateToWalkPartner ? acceptedWalkRequest : null}
      />
    );
  }

  if (isUserProfile) {
    return <MyProfile setIsUserProfile={setIsUserProfile} userImage={getImageSource()} userData={userData} />;
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
        setScannedUserId(null);
        setScannedSosId(null);
      }}
      setIsSOS={setIsSOS} 
      emergencyContacts={emergencyContacts}
      userData={userData}
      userImage={getImageSource()}
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
        setIsEmergencyContacts={setIsEmergencyContacts}
        setIsLanguagePage={setIsLanguagePage}
        setIsSafetyVideos={setIsSafetyVideos}
        setIsOfflineMap={setIsOfflineMap}
        setIsSubscription={setIsSubscription} 
        setIsWalkingAloneTips={setIsWalkingAloneTips}
        handleLogout={handleLogout}
        setIsSubscriptionScreen={setIsSubscriptionScreen}
        setIsDownloadedMaps={setIsDownloadedMaps}
        previousScreen={previousScreen}
        setIsUserProfile={setIsUserProfile}
        setIsWalkPartner={setIsWalkPartner}
        setIsQrCode={setIsQrCode}
        setIsSafetyZones={setIsSafetyZones}
        setIsScanning={setIsScanning}
        onQRCodeScanned={(userId, sosId) => {
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
        navigation={navigation}
        onClose={() => {
          if (chatOpenedFrom && navigation) {
            navigation.goBack();
          } else if (chatOpenedFrom === 'NotificationsPopup') {
            setIsChatScreen(false);
            setIsNotification(true); // Re-open the notification panel
          } else {
            setIsChatScreen(false);
            setChatTarget(null);
          }
          setChatOpenedFrom(null); // Reset for next time
        }}
        onViewProfile={(person) => {
          setIsChatScreen(false);
          setIsViewingProfileOf(person);
        }}
      />
    );
  }

  // Main Home screen
  return (
    <MapProvider value={{ mapRef, userLocation, setUserLocation }}>
      <View style={styles.container}>
        {/* Map Layer */}
        <View style={styles.mapContainer}>
          <Map 
            userImage={getImageSource()} 
            friendsDetails={friendsDetails}
            setFriendsDetails={() => {}} // No longer needed - context handles updates
            userLocation={userLocation}
            mapRef={mapRef}
          />
        </View>

        {/* TopBar - Fixed at top */}
        <View style={styles.topBarContainer}>
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
            userLocation={userLocation}
            unreadCount={unreadCount}
          />
        </View>

        {/* BottomNav - Fixed at bottom */}
        <View style={styles.bottomNavContainer}>
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
        </View>
        
        {/* Floating Chatbot Button - Hidden when People bar or helpline page are open */}
        {!isChatBotOpen && !IsNotification && !isPeopleActive && !isNotHome && (
        <BlurView intensity={80} tint="light" style={styles.chatButton}>
          <TouchableOpacity
            style={styles.chatButtonInner}
            onPress={() => setIsChatBotOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles" size={26} color="#FF6600" />
          </TouchableOpacity>
        </BlurView>
      )}

          {/* Floating Chatbot Overlay - Hidden when People bar or helpline page are open */}
          {isChatBotOpen && !isPeopleActive && !isNotHome && (
            <KeyboardAvoidingView 
              style={styles.chatBotOverlay}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View style={styles.chatBotContainer}>
                <View style={styles.chatBotContent}>
                  <ChatBot 
                    setIsChatBot={setIsChatBotOpen} 
                    isFloating={true}
                    userId={userData?.userId}
                    userLocation={userLocation}
                    userEmail={userData?.Email || userData?.email || ""}
                    myPhone={userData?.Phone || userData?.phone || ""}
                    userData={userData}
                    onActivateSOS={(sosSessionId) => {
                      console.log('Home: Received SOS activation from chatbot, session:', sosSessionId);
                      setActiveSosSessionId(sosSessionId);
                      setIsChatBotOpen(false);
                      setIsSOS(true);
                    }}
                  />
                </View>
              </View>
            </KeyboardAvoidingView>
          )}
        
        {IsNotification && (
          <NotificationsPopup
            userData={userData}
            setIsNotification={setIsNotification}
            onViewLocation={handleViewLocation}
            onOpenChat={handleOpenChat}
            acceptFriendRequest={acceptFriendRequest}
            declineFriendRequest={declineFriendRequest}
            markNotificationAsRead={markNotificationAsRead}
            markAllNotificationsAsRead={markAllNotificationsAsRead}
            clearAllNotifications={clearAllNotifications}
          />
        )}

        {activePopup && !activePopup.read && (
          <InAppNotificationPopup
            notification={activePopup}
            onDismiss={() => {
              // console.log($&);
              dismissPopup();
            }}
            onNavigate={() => {
              setIsNotification(true);
              if (activePopup && activePopup.id) {
                markNotificationAsRead(activePopup.id);
              }
            }}
            onViewLocation={handleViewLocation}
            onOpenChat={(personData) => {
              dismissPopup();
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
    flex: 1,
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
  chatButton: {
    position: "absolute",
    bottom: 150,
    left: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },

  chatButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 102, 0, 0.2)',
  },

  chatBotOverlay: {
    position: 'absolute',
    bottom: 140,
    right: 10,
    left: 10,
    height: height * 0.55,
    zIndex: 1001,
  },
  chatBotContainer: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.75)',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatBotHeader: {
    backgroundColor: '#FF6600',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  chatBotTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  chatBotClose: {
    padding: 5,
  },
  chatBotContent: {
    flex: 1,
  },
});