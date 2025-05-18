import { StyleSheet, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import Home from '../screens/Home';
import LoadingSplash from '../screens/LoadingSplash';
import Splash from '../screens/splash'; 
import BottomNav from '../componets/BottomNav';

const AppNavigator = () => {
  const [showLoading, setShowLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);

  const handleLoadingDone = () => {
    setShowLoading(false);
    setShowSplash(true);

    // Automatically go to Home after splash finishes
    setTimeout(() => {
      setShowSplash(false);
    }, 3000); 
  };

  return (
    <View style={{ flex: 1 }}>
      {showLoading && <LoadingSplash onDone={handleLoadingDone} />}
      {!showLoading && showSplash && <Splash />}
      {!showLoading && !showSplash && <Home />}
    </View>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({});