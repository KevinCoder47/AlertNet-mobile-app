import { StyleSheet, View, Dimensions } from 'react-native';
import React, { useState } from 'react';
import Map from '../componets/Map';
import TopBar from '../componets/TopBar';
import BottomNav from '../componets/BottomNav';
import TopBarSearch from '../componets/TopBarSearch';
import { useTheme } from '../contexts/ColorContext';
import { MapProvider } from '../contexts/MapContext';
import WalkPartner from './WalkPartner';
import SOSPage from './SOS';
import SOSBtn from '../componets/SOSBtn';
import QrCode from './QrCode';
import SafetyResources from '../screens/SafetyResource_Screens/SafetyResources';
import TestSOS from './SafetyResource_Screens/TestSOS';

const { width, height } = Dimensions.get('window');

const Home = () => {
  const [isNotHome, setIsNotHome] = useState(false);
  const [isSOS, setIsSOS] = useState(false);
  const [isWalkPartner, setIsWalkPartner] = useState(false);
  const [isQrCode, setIsQrCode] = useState(false);
  const [isSafetyResources, setIsSafetyResources] = useState(false);
  const [isTestSOS, setIsTestSOS] = useState(false);

  // Conditional screen rendering
  if (isWalkPartner) {
    return <WalkPartner setIsWalkPartner={setIsWalkPartner} />;
  }

  else if (isSOS) {
    return (
      <SOSPage
        setIsSOS={setIsSOS}
        setIsQrCode={setIsQrCode}
        setIsSafetyResources={setIsSafetyResources}
      />
    );
  }

  else if (isQrCode) {
    return <QrCode setIsQrCode={setIsQrCode} setIsSOS={setIsSOS} />;
  }

  else if (isTestSOS) {
    return (
      <TestSOS
        setIsTestSOS={setIsTestSOS}
        setIsSafetyResources={setIsSafetyResources}
      />
    );
  }

  else if (isSafetyResources) {
    return (
      <SafetyResources
        setIsSafetyResources={setIsSafetyResources}
        setIsSOS={setIsSOS}
        setIsTestSOS={setIsTestSOS}
      />
    );
  }

  // Default: show main home layout
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
    // You can add flex: 1 if needed
    // flex: 1,
  },
});
