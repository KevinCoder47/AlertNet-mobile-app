import { StyleSheet, View, Dimensions, Platform, Animated } from 'react-native'
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useRef } from 'react'
import TopBarComponents from './TopBarComponents';

const { width, height } = Dimensions.get('window');

const TopBar = ({isNotHome}) => {
  
  const wrapperHeight = useRef(new Animated.Value(isNotHome ? 120 : 190)).current;
  
  // Update the animation when isNotHome changes
  useEffect(() => {
    Animated.timing(wrapperHeight, {
      toValue: isNotHome ? 120 : 190, // 
      duration: 300, // Animation duration in ms
      useNativeDriver: false // 
    }).start();
  }, [isNotHome]);
  
  // Create state to track BlurView height for iOS separately
  const [blurHeight, setBlurHeight] = useState(isNotHome ? 140 : 200);
  const [opacityHeight, setOpacityHeight] = useState(isNotHome ? 140 : 200);
  
  useEffect(() => {
    // For iOS, we'll update the BlurView height without animation API
    setBlurHeight(isNotHome ? 140 : 200);
    setOpacityHeight(isNotHome ? 140 : 200);
  }, [isNotHome]);
  
  return (
    <Animated.View style={[styles.wrapper, { height: wrapperHeight }]}>
      <TopBarComponents isNotHome={isNotHome} />
      {Platform.OS === 'ios' ? (
        <>
          <View style={[styles.topBarOpacity, { height: opacityHeight }]} />
          <BlurView intensity={15} tint="light" style={[styles.topBarBlur, { height: blurHeight }]} />
        </>
      ) : (
        <>
          <Animated.View style={[styles.topBarOpacity, { height: wrapperHeight }]} />
          <LinearGradient
            colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.3)']}
            style={styles.gradientOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </>
      )}
    </Animated.View>
  );
};

export default TopBar;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    width: width,
    zIndex: 2,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 60, // for Android
  },
  container: {
    position: 'absolute',
    width: width,
    height: 200,
    zIndex: 2,
    overflow: 'hidden',
  },
  topBarOpacity: {
    width: width,
    ...Platform.select({
      ios: {
        height: 200,
      },
      android: {
        height: 190
      }
    }),
    backgroundColor: Platform.select({
      ios: "rgba(255, 255, 255, 0.2)",
      android: "rgba(255, 255, 255, 0.85)", // Slightly more opaque on Android
    }),
    zIndex: 2,
    position: "absolute"
  },
  topBarBlur: {
    width: width,
    ...Platform.select({
      ios: {
        height: 200,
      },
      android: {
        height: 190
      }
    }),
    backgroundColor: "transparent",
    zIndex: 2,
    opacity: 1,
    position: "absolute"
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: Platform.select({
      ios: 0.3,
      android: 1,
    }),
  }
});