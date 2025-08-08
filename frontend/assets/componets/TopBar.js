import { StyleSheet, View, Dimensions, Platform, Animated } from 'react-native'
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useRef } from 'react'
import TopBarComponents from './TopBarComponents';
import { useTheme } from '../contexts/ColorContext';


const { width, height } = Dimensions.get('window');

const TopBar = ({isNotHome, setIsUserProfile, setIsSafetyResources}) => {
  const { colors } = useTheme();
  
  const wrapperHeight = useRef(new Animated.Value(isNotHome ? 120 : 190)).current;
  
  // Update the animation when isNotHome changes
  useEffect(() => {
    Animated.timing(wrapperHeight, {
      toValue: isNotHome ? 120 : 190,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [isNotHome]);
  
  // Create state to track BlurView height for iOS separately
  const [blurHeight, setBlurHeight] = useState(isNotHome ? 140 : 200);
  const [opacityHeight, setOpacityHeight] = useState(isNotHome ? 140 : 200);
  
  useEffect(() => {
    setBlurHeight(isNotHome ? 140 : 200);
    setOpacityHeight(isNotHome ? 140 : 200);
  }, [isNotHome]);
  
  // Dark mode styles
  const darkModeStyles = StyleSheet.create({
    wrapper: {
      shadowColor: colors.isDark ? '#000' : 'black',
      shadowOpacity: colors.isDark ? 0.5 : 0.2,
    },
    topBarOpacity: {
      backgroundColor: colors.isDark 
        ? Platform.select({
            ios: "rgba(18, 18, 18, 0.7)",
            android: "rgba(18, 18, 18, 0.9)"
          })
        : Platform.select({
            ios: "rgba(255, 255, 255, 0.2)",
            android: "rgba(255, 255, 255, 0.85)"
          })
    },
    gradientOverlay: {
      colors: colors.isDark
        ? ['rgba(18, 18, 18, 0.7)', 'rgba(18, 18, 18, 0.3)']
        : ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.3)']
    }
  });

  return (
    <Animated.View style={[styles.wrapper, darkModeStyles.wrapper, { height: wrapperHeight }]}>
      <TopBarComponents isNotHome={isNotHome} setIsUserProfile={setIsUserProfile} setIsSafetyResources={setIsSafetyResources}/>
      {Platform.OS === 'ios' ? (
        <>
          <View style={[styles.topBarOpacity, darkModeStyles.topBarOpacity, { height: opacityHeight }]} />
          <BlurView 
            intensity={15} 
            tint={colors.isDark ? 'dark' : 'light'} 
            style={[styles.topBarBlur, { height: blurHeight }]} 
          />
        </>
      ) : (
        <>
          <Animated.View style={[styles.topBarOpacity, darkModeStyles.topBarOpacity, { height: wrapperHeight }]} />
          <LinearGradient
            colors={darkModeStyles.gradientOverlay.colors}
            style={styles.gradientOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </>
      )}
    </Animated.View>
  );
};

// Base styles remain the same
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    width: width,
    zIndex: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 60,
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

export default TopBar;