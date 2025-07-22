import { StyleSheet, View, Dimensions } from 'react-native';
import React, { useState } from 'react';
import Map from '../componets/Map';
import TopBar from '../componets/TopBar';
import BottomNav from '../componets/BottomNav';
import TopBarSearch from '../componets/TopBarSearch';
import { useTheme } from '../contexts/ColorContext';
import { MapProvider } from '../contexts/MapContext';
import WalkPartner from './WalkPartner';
import SOSPage from './SOS'
import SOSBtn from '../componets/SOSBtn';
import QrCode from '../screens/QrCode';
import SafetyResources from './SafetyResources'


const { width, height } = Dimensions.get('window');

const Home = () => {
  const [isNotHome, setIsNotHome] = useState(false);
  const [isSOS, setIsSOS] = useState(false);
  const [isWalkPartner, setIsWalkPartner] = useState(false);
  const [isQrCode, setIsQrCode] = useState(false);
  const [isSafetyResources, setIsSafetyResources] = useState(false);


  if (isWalkPartner) {
    // Render only WalkPartner screen
    return <WalkPartner setIsWalkPartner={setIsWalkPartner} />;
  }

  else if (isSOS) {
    return <SOSPage setIsSOS={setIsSOS}
    setIsQrCode={setIsQrCode} 
    setIsSafetyResources={setIsSafetyResources}/>;
  }

  else if (isQrCode) {
    return <QrCode setIsQrCode={setIsQrCode} setIsSOS={setIsSOS} />;
  }

  if (isSafetyResources){
    return <SafetyResources setIsSafetyResources={setIsSafetyResources} 
    setIsSOS={setIsSOS}
  />
}



  // Else render the full home layout
  return (
    <MapProvider>
      <View style={styles.container}>
        <Map />
        <TopBar />
        <BottomNav isNotHome={isNotHome}
          setIsNotHome={setIsNotHome}
          isWalkPartner={isWalkPartner}
          setIsWalkPartner={setIsWalkPartner}
          setIsSOS={setIsSOS}/>
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