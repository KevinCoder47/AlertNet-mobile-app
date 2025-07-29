import { StyleSheet, View, Dimensions } from 'react-native';
import React, { use, useState } from 'react';
import Map from '../componets/Map';
import TopBar from '../componets/TopBar';
import BottomNav from '../componets/BottomNav';
import { MapProvider } from '../contexts/MapContext';

import WalkPartner from './WalkPartner';
import SOSPage from './SOS';
import QrCode from './QrCode';
import SafetyResources from '../screens/SafetyResource_Screens/SafetyResources';
import TestSOS from './SafetyResource_Screens/TestSOS';
import LiveLocation from './SafetyResource_Screens/LiveLocation';
import VoiceTrigger from './SafetyResource_Screens/VoiceTrigger';
import Unsafe from './SafetyResource_Screens/Unsafe'
const { width, height } = Dimensions.get('window');

const Home = () => {
  // Main state toggles for screens
  const [isNotHome, setIsNotHome] = useState(false);
  const [isSOS, setIsSOS] = useState(false);
  const [isWalkPartner, setIsWalkPartner] = useState(false);
  const [isQrCode, setIsQrCode] = useState(false);
  const [isSafetyResources, setIsSafetyResources] = useState(false);
  const [isTestSOS, setIsTestSOS] = useState(false);
  const [isLiveLocation, setIsLiveLocation] = useState(false);
  const [isVoiceTrigger, setIsVoiceTrigger] = useState(false);
  const [isUnsafePage,setIsUnsafePage] = useState(false);

  // Conditional rendering based on state flags
  if (isWalkPartner) {
    return <WalkPartner setIsWalkPartner={setIsWalkPartner} />;
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

  if (isVoiceTrigger){
    return(
      <VoiceTrigger
        setIsVoiceTrigger={setIsVoiceTrigger}
        setIsSafetyResources={setIsSafetyResources}
      />
    )
  }

  if (isSafetyResources) {
    return (
      <SafetyResources
        setIsSafetyResources={setIsSafetyResources}
        setIsSOS={setIsSOS}
        setIsTestSOS={setIsTestSOS}
        setIsLiveLocation={setIsLiveLocation}  // <-- Pass here!
        setIsVoiceTrigger={setIsVoiceTrigger}
        setIsUnsafePage={setIsUnsafePage}
      />
    );
  }

  if (isUnsafePage) {
    return (
      <Unsafe
        setIsUnsafePage = {setIsUnsafePage}
        setIsSafetyResources={setIsSafetyResources}
        setIsSOS={setIsSOS}
      />
    );
  }


  

  // Default home screen layout
  return (
    <MapProvider>
      <View style={styles.container}>
        <Map />
        <TopBar />
        <BottomNav
          isNotHome={isNotHome}
          setIsNotHome={setIsNotHome}
          isWalkPartner={isWalkPartner}
          setIsWalkPartner={setIsWalkPartner}
          setIsSOS={setIsSOS}
        />
      </View>
    </MapProvider>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    // add flex: 1 if needed for full screen sizing
    // flex: 1,
  },
});
