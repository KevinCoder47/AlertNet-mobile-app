import { StyleSheet, View, Image, Animated } from 'react-native';
import React, { useEffect, useRef } from 'react';

const UserMapMarker = ({ userImage }) => {
  // Animation for subtle pulsing effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Shadow effect under the pin */}
      <View style={styles.shadow} />
      
      {/* Pin pointer */}
      <View style={styles.pointerContainer}>
        <View style={styles.pointer} />
      </View>
      
      {/* Main circle with profile picture */}
      <View style={styles.markerContainer}>
        <Animated.View 
          style={[
            styles.pulseCircle,
            { transform: [{ scale: pulseAnim }] }
          ]} 
        />
        <View style={styles.outerCircle}>
          <View style={styles.innerCircle}>
            {userImage ? (
              <Image 
                source={{uri: userImage}} 
                style={styles.profileImage} 
                resizeMode="cover"
              />
            ) : (
              <Image 
                source={require('../images/user-profile.jpg')} 
                style={styles.profileImage} 
                resizeMode="cover"
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default UserMapMarker;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    backgroundColor: 'transparent',
    // Add these for Android:
    overflow: 'visible',
    zIndex: 1,
  },
  markerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  pulseCircle: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
      backgroundColor: 'rgba(200, 1, 16, 0.2)',
  },
  outerCircle: {
    width: 50,
    height: 50,
    backgroundColor: '#C80110',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    // borderWidth: 2,
    // borderColor: '#FFFFFF',
  },
  innerCircle: {
    width: 40,
    height: 40,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  pointerContainer: {
    width: 14,
    height: 14,
    position: 'absolute',
    bottom: 8,
    zIndex: -1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointer: {
    width: 14,
    height: 14,
    backgroundColor: '#C80110',
    transform: [{ rotate: '45deg' }],
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#C80110',
    marginBottom: 5
  },
  shadow: {
    position: 'absolute',
    bottom: 3,
    width: 12,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 50,
    zIndex: -2,
  },
});