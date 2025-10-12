import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, Vibration, Dimensions, Platform } from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Responsive scaling function
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

const LocatePartner = ({setFindPartnerView}) => {
  const [primaryColor, setPrimaryColor] = useState('#F57527');
  const [isNavigateView, setIsNavigateView] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [locationStrategy, setLocationStrategy] = useState('high_accuracy');

  // Update primary color based on distance
  useEffect(() => {
    if (distance == null) return;
    
    let newColor;
    if (distance < 10) {
      newColor = '#34C759'; // Green - very close
    } else if (distance < 25) {
      newColor = '#30D158'; // Light green
    } else if (distance < 50) {
      newColor = '#FFD60A'; // Yellow
    } else if (distance < 100) {
      newColor = '#FF9F0A'; // Light orange
    } else if (distance < 200) {
      newColor = '#FF8C00'; // Orange
    } else {
      newColor = '#F57527'; // Dark orange - far away
    }
    
    setPrimaryColor(newColor);
  }, [distance]);

  const headingRef = useRef(0);
  const bearingRef = useRef(0);
  const filteredHeading = useRef(0);
  const filteredBearing = useRef(0);
  const filterFactor = 0.15;
  const headingSubscription = useRef(null);
  const locationSubscription = useRef(null);
  const hasPromptedCalibration = useRef(false);

  const proximityState = useRef('far');
  const lastVibrationTime = useRef(0);

  const arrowRotation = useSharedValue(0);
  const arrowOpacity = useSharedValue(1);

  const partnerLocation = {
    latitude: -26.1833,
    longitude: 28.0006,
    altitude: 0,
  };

  useEffect(() => {
    requestPermissions();

    return () => {
      if (headingSubscription.current && headingSubscription.current.remove) headingSubscription.current.remove();
      if (locationSubscription.current && locationSubscription.current.remove) locationSubscription.current.remove();
    };
  }, []);

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required');
      return;
    }

    startLocationTracking();
    startHeadingTracking();
  };

  const calculateAdaptiveFilterFactor = (compassAccuracy, gpsAcc) => {
    if (compassAccuracy > 3 || gpsAcc > 15) return 0.08;
    if (compassAccuracy > 1 || gpsAcc > 8) return 0.12;
    return 0.15;
  };

  const startHeadingTracking = async () => {
    try {
      if (await Location.hasServicesEnabledAsync()) {
        headingSubscription.current = Location.watchHeadingAsync((data) => {
          const compassAcc = typeof data.accuracy === 'number' ? data.accuracy : 0;
          const newHeading = data.trueHeading !== -1 ? data.trueHeading : (data.magHeading || 0);
          const alpha = calculateAdaptiveFilterFactor(compassAcc, gpsAccuracy || 0);

          filteredHeading.current = alpha * newHeading + (1 - alpha) * filteredHeading.current;
          headingRef.current = filteredHeading.current;

          updateArrowDirection();
        });
      }
    } catch (error) {
      console.warn('Compass not available, using fallback', error);
    }
  };

  const getLocationConfig = () => {
    switch (locationStrategy) {
      case 'high_accuracy':
        return {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1,
          timeInterval: 1000,
        };
      case 'balanced':
        return {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 3000,
        };
      default:
        return {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 2,
          timeInterval: 1500,
        };
    }
  };

  const startLocationTracking = async () => {
    try {
      const initialLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      updateLocation(initialLocation.coords);

      const config = getLocationConfig();
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: config.accuracy,
          distanceInterval: config.distanceInterval,
          timeInterval: config.timeInterval,
        },
        (location) => updateLocation(location.coords)
      );
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const optimizeLocationStrategy = (distMeters, accuracyMeters) => {
    if (distMeters == null) return;

    if (distMeters > 1000 && accuracyMeters < 50) {
      setLocationStrategy('balanced');
    } else if (distMeters < 100 && accuracyMeters > 20) {
      setLocationStrategy('high_accuracy');
    }
  };

  const updateLocation = (coords) => {
    setUserLocation(coords);
    setGpsAccuracy(Math.round(coords.accuracy || 0));
    calculateDistanceAndBearing(coords);
    optimizeLocationStrategy(distance, coords.accuracy || 0);
  };

  const handleProximityFeedback = (currentDistance) => {
    const now = Date.now();
    let newState = 'far';

    if (currentDistance < 3) {
      newState = 'immediate';
      if (now - lastVibrationTime.current > 800) {
        Vibration.vibrate([0, 100, 50, 100]);
        lastVibrationTime.current = now;
      }
    } else if (currentDistance < 10) {
      newState = 'very close';
      if (now - lastVibrationTime.current > 1500) {
        Vibration.vibrate(100);
        lastVibrationTime.current = now;
      }
    } else if (currentDistance < 25) {
      newState = 'close';
      if (now - lastVibrationTime.current > 3000) {
        Vibration.vibrate(100);
        lastVibrationTime.current = now;
      }
    }

    if (newState !== proximityState.current) {
      proximityState.current = newState;
      if (newState !== 'far') Vibration.vibrate(200);
    }
  };

  const calculateDistanceAndBearing = useCallback((userCoords) => {
    const { latitude: lat1, longitude: lon1, altitude: alt1 = 0 } = userCoords || {};
    const { latitude: lat2, longitude: lon2, altitude: alt2 = 0 } = partnerLocation;

    if (lat1 == null || lon1 == null) return;

    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const horizontalDist = R * c;

    const altitudeDiff = Math.abs(alt2 - (alt1 || 0));
    const trueDistance = Math.sqrt(Math.pow(horizontalDist, 2) + Math.pow(altitudeDiff, 2));

    setDistance(Math.round(trueDistance));

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    let bearingDeg = (Math.atan2(y, x) * 180) / Math.PI;
    bearingDeg = (bearingDeg + 360) % 360;

    const bearingAlpha = calculateAdaptiveFilterFactor(0, gpsAccuracy || 0);
    filteredBearing.current = (bearingDeg * bearingAlpha) + (filteredBearing.current * (1 - bearingAlpha));
    bearingRef.current = filteredBearing.current;

    updateArrowDirection();
    handleProximityFeedback(trueDistance);
  }, [partnerLocation, gpsAccuracy]);

  const updateArrowDirection = useCallback(() => {
    if (!userLocation || distance == null) return;

    let rotation = bearingRef.current - headingRef.current;
    rotation = ((rotation + 540) % 360) - 180;

    const deadZone = 5;

    if (Math.abs(rotation) < deadZone) {
      arrowRotation.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
        mass: 0.3,
      });
      return;
    }

    const absRot = Math.abs(rotation);
    const smoothingFactor = 0.1 + (0.3 - 0.1) * (deadZone / absRot);
    const smoothedRotation = smoothingFactor * rotation + (1 - smoothingFactor) * arrowRotation.value;

    const accuracy = gpsAccuracy || 100;
    const damping = accuracy < 10 ? 15 : accuracy < 25 ? 20 : 25;
    const stiffness = accuracy < 10 ? 120 : accuracy < 25 ? 100 : 80;
    const mass = accuracy < 10 ? 0.4 : accuracy < 25 ? 0.5 : 0.6;

    arrowRotation.value = withSpring(smoothedRotation, {
      damping,
      stiffness,
      mass,
    });

    const targetOpacity = accuracy < 10 ? 1 : accuracy < 25 ? 0.7 : 0.4;
    arrowOpacity.value = withSpring(targetOpacity, {
      damping: 20,
      stiffness: 150,
      mass: 0.5,
    });
  }, [userLocation, distance, gpsAccuracy]);

  const animatedArrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${arrowRotation.value}deg` }],
    opacity: arrowOpacity.value,
  }));

  const getRelativeDirection = (bearing, heading, dist) => {
    if (!dist || dist < 3) return 'right here!';
    const relativeAngle = (bearing - heading + 360) % 360;

    if (dist < 10) {
      const directions = ['front', 'right-front', 'right', 'right-back', 'back', 'left-back', 'left', 'left-front'];
      const index = Math.round(relativeAngle / 45) % 8;
      return directions[index];
    }

    const cardinals = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
    const index = Math.round(relativeAngle / 45) % 8;
    return cardinals[index];
  };

  const directionText = (() => {
    if (!distance) return 'locating...';
    const relativeDir = getRelativeDirection(bearingRef.current, headingRef.current, distance);

    if (distance < 3) return 'right here!';
    if (distance < 10) return `${relativeDir}, very close`;
    if (distance < 50) return `${relativeDir}, nearby`;
    if (distance < 200) return `${relativeDir}, a short walk`;
    return `${relativeDir}, ${distance < 1000 ? 'walking distance' : 'far away'}`;
  })();

  const formatDistance = (dist) => (!dist ? '---' : dist < 1000 ? dist : (dist / 1000).toFixed(1));
  const getDistanceUnit = (dist) => (!dist ? 'm' : dist < 1000 ? 'm' : 'km');

  const handleToggle = () => setIsNavigateView(!isNavigateView);

  return (
    <View style={[styles.container, { backgroundColor: primaryColor }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() =>
      { 
        setFindPartnerView(false);
      }}>
        <Ionicons name="close" size={moderateScale(24)} color="white" />
      </TouchableOpacity>

      <Text style={styles.findingText}>Finding</Text>
      <Text style={styles.partnerTitle}>Partner</Text>

      <TouchableOpacity style={styles.toggle} onPress={handleToggle} activeOpacity={0.8}>
        <View style={styles.iconContainer}>
          <Ionicons name="navigate-outline" size={moderateScale(25)} color={isNavigateView ? "white" : "black"} />
        </View>
        <View style={[styles.toggleCircle, { backgroundColor: primaryColor, left: isNavigateView ? moderateScale(5) : moderateScale(90) }]} />
        <View style={styles.iconContainer}>
          <Ionicons name="map-outline" size={moderateScale(25)} color={!isNavigateView ? "white" : "black"} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.partnerInfo}>
        <Image source={require('../images/profile-pictures/siphe.jpeg')} style={styles.smallPic} />
        <Text style={styles.partnerName}>Siphephile</Text>
      </TouchableOpacity>

      <View style={styles.arrowContainer}>
        <Animated.View style={animatedArrowStyle}>
          <Ionicons 
            name="arrow-up" 
            size={moderateScale(200, 0.3)} 
            color={distance < 50 ? 'green' : 'black'} 
          />
        </Animated.View>
      </View>

      <Text style={styles.distanceText}>
        {formatDistance(distance)}{' '}
        <Text style={styles.distanceUnit}>{getDistanceUnit(distance)}</Text>
      </Text>
      <Text style={styles.directionText}>
        {directionText}
      </Text>

      <Text style={styles.debugText}>
        Heading: {Math.round(headingRef.current)}° | Bearing: {Math.round(bearingRef.current)}°
      </Text>

      <TouchableOpacity 
        style={styles.confirmButton}
        onLongPress={() => Alert.alert('Walk Confirmed!', 'Starting walk session...')}
      >
        <Text style={styles.confirmButtonText}>Hold to Confirm Walk</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LocatePartner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? verticalScale(90) : verticalScale(60),
    paddingLeft: scale(20),
    
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? verticalScale(70) : verticalScale(50),
    right: scale(25),
    backgroundColor: '#1C1C1E',
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  findingText: {
    fontSize: moderateScale(22),
    fontWeight: '600',
  },
  partnerTitle: {
    fontSize: moderateScale(42, 0.3),
    fontWeight: '600',
    marginTop: verticalScale(5),
  },
  toggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: moderateScale(165),
    height: moderateScale(70),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: moderateScale(40),
    marginTop: verticalScale(10),
    paddingHorizontal: scale(15),
  },
  toggleCircle: {
    position: 'absolute',
    top: moderateScale(5),
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
  },
  iconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(40),
    backgroundColor: 'white',
    alignSelf: 'center',
    height: moderateScale(55),
    borderRadius: moderateScale(30),
    paddingHorizontal: scale(5),
  },
  smallPic: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    marginRight: scale(10),
    borderWidth: 2,
    borderColor: 'white',
  },
  partnerName: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginRight: scale(20),
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(20),
  },
  distanceText: {
    fontSize: moderateScale(42, 0.3),
    fontWeight: '700',
    marginTop: verticalScale(20),
  },
  distanceUnit: {
    opacity: 0.4,
  },
  directionText: {
    fontSize: moderateScale(20),
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: verticalScale(5),
  },
  debugText: {
    fontSize: moderateScale(12),
    opacity: 0.5,
    marginTop: verticalScale(10),
  },
  confirmButton: {
    backgroundColor: '#1C1C1E',
    width: moderateScale(230),
    height: moderateScale(55),
    borderRadius: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: verticalScale(20),
    position: 'absolute',
    bottom: verticalScale(40),
  },
  confirmButtonText: {
    color: 'white',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
});