import { StyleSheet, View, Dimensions, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import Map from '../componets/Map';
import TopBar from '../componets/TopBar';
import BottomNav from '../componets/BottomNav';
import { MapProvider } from '../contexts/MapContext';
import MyProfile from '../screens/MyProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

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
  
  // State for profile image
  const [userImage, setUserImage] = useState(null);
  const [cachedImagePath, setCachedImagePath] = useState(null);
  const [imageError, setImageError] = useState(false);

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
    return <MyProfile setIsUserProfile={setIsUserProfile} />;
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
    <MapProvider>
      <View style={styles.container}>
        <Map userImage={getImageSource()} />
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