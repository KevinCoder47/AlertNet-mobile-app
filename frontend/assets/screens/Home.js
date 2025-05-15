import { StyleSheet, View, Dimensions } from 'react-native';
import React, { useState } from 'react';
import Map from '../componets/Map';
import TopBar from '../componets/TopBar';
import BottomNav from '../componets/BottomNav';
import TopBarSearch from '../componets/TopBarSearch';
import { useTheme } from '../contexts/ColorContext';
import { MapProvider } from '../contexts/MapContext';

const { width, height } = Dimensions.get('window');

const Home = () => {
  const [isNotHome, setIsNotHome] = useState(false);
  const [isSOS, setIsSOS] = useState(false);
  
  return (
    <MapProvider>
      <View style={styles.container}>
        {/* map view */}
        <>
          <Map />
        </>
        {/* top bar */}
        <TopBar isNotHome={isNotHome} />
        {/* Bottom navigation */}
        <BottomNav isNotHome={isNotHome} setIsNotHome={setIsNotHome} />
      </View>
    </MapProvider>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    zIndex: 1
  },
});