import { StyleSheet, View, Dimensions, Platform, Animated, TouchableOpacity, PanResponder } from 'react-native'
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useRef } from 'react'
import TopBarComponents from './TopBarComponents';
import { useTheme } from '../contexts/ColorContext';
import { Ionicons } from '@expo/vector-icons';


const { width, height } = Dimensions.get('window');

const TopBar = ({
  isNotHome, isPeopleActive, isTopBarManuallyExpanded,
  setIsTopBarManuallyExpanded, setIsUserProfile, setIsSafetyResources,
  userImage, setIsNotification,renderProfileImage,userLocation, unreadCount
}) => {
  const { colors } = useTheme();
  
  const shouldCollapse = isNotHome || (isPeopleActive && !isTopBarManuallyExpanded);
  const wrapperHeight = useRef(new Animated.Value(shouldCollapse ? 120 : 190)).current;
  
  // Update the animation when collapse state changes
  useEffect(() => {
    Animated.timing(wrapperHeight, {
      toValue: shouldCollapse ? 120 : 190,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [shouldCollapse]);

  const handleToggle = () => {
    if (isPeopleActive) {
      setIsTopBarManuallyExpanded(!isTopBarManuallyExpanded);
    }
  };

  // PanResponder for scroll gesture detection
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isPeopleActive,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return isPeopleActive && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Expand on downward scroll when collapsed
        if (shouldCollapse && gestureState.dy > 30) {
          setIsTopBarManuallyExpanded(true);
        }
        // Collapse on upward scroll when expanded
        else if (!shouldCollapse && gestureState.dy < -30) {
          setIsTopBarManuallyExpanded(false);
        }
      },
      onPanResponderRelease: () => {},
    })
  ).current;
  
  // Create state to track BlurView height for iOS separately
  const [blurHeight, setBlurHeight] = useState(shouldCollapse ? 140 : 200);
  const [opacityHeight, setOpacityHeight] = useState(shouldCollapse ? 140 : 200);
  
  useEffect(() => {
    setBlurHeight(shouldCollapse ? 140 : 200);
    setOpacityHeight(shouldCollapse ? 140 : 200);
  }, [shouldCollapse]);
  
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
    <TouchableOpacity 
      activeOpacity={isPeopleActive ? 0.7 : 1} 
      onPress={handleToggle}
      disabled={!isPeopleActive}
    >
      <Animated.View 
        style={[styles.wrapper, darkModeStyles.wrapper, { height: wrapperHeight }]}
        {...(isPeopleActive ? panResponder.panHandlers : {})}
      >
        <TopBarComponents
          isNotHome={shouldCollapse}
          setIsUserProfile={setIsUserProfile}
          setIsSafetyResources={setIsSafetyResources}
          userImage = {userImage}
          setIsNotification={setIsNotification}
          renderProfileImage={renderProfileImage}
          userLocation = {userLocation}
          unreadCount={unreadCount}
        />
        
        
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
    </TouchableOpacity>
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
  },
  toggleIndicator: {
    position: 'absolute',
    bottom: 5,
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  }
});

export default TopBar;