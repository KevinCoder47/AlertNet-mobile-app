import { StyleSheet, View, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import Map from '../componets/Map';
import TopBar from '../componets/TopBar';
import BottomNav from '../componets/BottomNav';
import { MapProvider } from '../contexts/MapContext';
import MyProfile from '../screens/MyProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const { width, height } = Dimensions.get('window');

const Home = ({handleLogout}) => {
  const [isNotHome, setIsNotHome] = useState(false);
  const [isSOS, setIsSOS] = useState(false);
  const [isWalkPartner, setIsWalkPartner] = useState(false);
  const [isQrCode, setIsQrCode] = useState(false);
  const [isSafetyResources, setIsSafetyResources] = useState(false);
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
  
  const [isPeopleActive, setIsPeopleActive] = useState(false);
  const [isTopBarManuallyExpanded, setIsTopBarManuallyExpanded] = useState(false);
  
  // State for profile image
  const [userImage, setUserImage] = useState(null);

  // Load profile image from AsyncStorage
  useEffect(() => {
    
    const loadProfileImage = async () => {
      try {
        const userDataJSON = await AsyncStorage.getItem('userData');
        
        if (userDataJSON) {
          const userData = JSON.parse(userDataJSON);
          console.log(userData.name);
          if (userData.imageUrl) {
            setUserImage(userData.imageUrl);
            
          }
        }
      } catch (error) {
        console.error('Failed to load profile image', error);
      }
    };

    loadProfileImage();
  }, []);

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
        setIsSafetyResources={setIsSafetyResources}
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
        setIsSafetyResources={setIsSafetyResources}
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
        setIsSafetyResources={setIsSafetyResources}
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
      />
    );
  }

  if (isUnsafePage) {
    return (
      <Unsafe
        setIsUnsafePage={setIsUnsafePage}
        setIsSafetyResources={setIsSafetyResources}
        setIsSOS={setIsSOS}
      />
    );
  }

  if (isPreviousWalks) {
    return (
      <PreviousWalks
        setIsPreviousWalks={setIsPreviousWalks}
        setIsSafetyResources={setIsSafetyResources}
      />
    );
  }

  if (isEmergencyContacts) {
    return (
      <EmergencyContacts
        setIsEmergencyContacts={setIsEmergencyContacts}
        setIsSafetyResources={setIsSafetyResources}
      />
    );
  }

  if (isLanguagePage) {
    return (
      <LanguagePage
        setIsLanguagePage={setIsLanguagePage}
        setIsSafetyResources={setIsSafetyResources}
      />
    );
  }

  if (isSafetyVideos) {
    return (
      <SafetyVideos
        setIsSafetyVideos={setIsSafetyVideos}
        setIsSafetyResources={setIsSafetyResources}
      />
    );
  }

  if (isOfflineMap) {
    return (
      <OfflineMap
        setIsOfflineMap={setIsOfflineMap}
        setIsSafetyResources={setIsSafetyResources}
      />
    );
  }

  if (isSubscriptionScreen) {
    return (
      <Subscription
        setIsSubscriptionScreen={setIsSubscriptionScreen}
        setIsSafetyResources={setIsSafetyResources}
      />
    );
  }

  if (isWalkingAloneTips) {
    return (
      <WalkingAloneTips
        setIsWalkingAloneTips={setIsWalkingAloneTips}
        setIsSafetyResources={setIsSafetyResources}
      />
    );
  }


  return (
    <MapProvider>
      <View style={styles.container}>
        <Map userImage={userImage} />
        <TopBar 
          setIsUserProfile={setIsUserProfile}
          isNotHome={isNotHome}
          isPeopleActive={isPeopleActive}
          isTopBarManuallyExpanded={isTopBarManuallyExpanded}
          setIsTopBarManuallyExpanded={setIsTopBarManuallyExpanded}
          setIsSafetyResources={() => setIsSafetyResources(true)}
          profileImageUri={userImage}
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
      </View>
    </MapProvider>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    // flex: 1,
  },
});