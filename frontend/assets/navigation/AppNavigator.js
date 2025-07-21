import { StyleSheet, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import Home from '../screens/Home';
import AnimatedSplash from '../screens/AnimatedSplash'; 

const AppNavigator = () => {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    setShowSplash(true);
    const timeout = setTimeout(() => {
      setShowSplash(false);
    }, 5300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {showSplash && <AnimatedSplash />}
      {!showSplash && <Home />}
    </View>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({});