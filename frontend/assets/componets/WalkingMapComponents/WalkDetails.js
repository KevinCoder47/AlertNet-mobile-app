import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ColorContext';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

const WalkDetails = ({ 
  walkData,
  partnerData,
  onEndWalk,
  onRecenter,
  onMoreOptions,
  onEmergency,
  setShowPartnerUpdate,
  onWalkCancel
}) => {
  const { isDark } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [navigationSteps, setNavigationSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [calculatedStats, setCalculatedStats] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const avatarSource = partnerData?.avatarSource || require('../../images/profile-pictures/default.jpg');

  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch turn-by-turn navigation instructions
  useEffect(() => {
    const origin = userLocation || walkData?.startPoint;
    const destination = walkData?.destination;
    
    if (origin && destination) {
      fetchTurnByTurnDirections(origin, destination);
    } else if (origin && !destination) {
      const horizonHeights = {
        latitude: -26.1929,
        longitude: 28.0305,
      };
      fetchTurnByTurnDirections(origin, horizonHeights);
    }
  }, [userLocation, walkData?.destination]);

  // Location tracking effect
  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        if (isMounted) {
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          console.log('User location obtained:', location.coords.latitude, location.coords.longitude);
        }

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            if (isMounted) {
              setUserLocation({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
              });
            }
          }
        );
        
        if (isMounted) {
          setLocationSubscription(subscription);
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    })();

    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const fetchTurnByTurnDirections = async (origin, destination) => {
    try {
      const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destStr = `${destination.latitude},${destination.longitude}`;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&mode=walking&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Extract calculated stats from API
        setCalculatedStats({
          distance: leg.distance.text,
          distanceValue: leg.distance.value,
          duration: leg.duration.text,
          durationValue: leg.duration.value,
          startAddress: leg.start_address,
          endAddress: leg.end_address
        });
        
        // Parse steps for navigation instructions
        const steps = leg.steps.map(step => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.text,
          distanceValue: step.distance.value,
          duration: step.duration.text,
          maneuver: step.maneuver || 'straight',
        }));
        
        setNavigationSteps(steps);
        console.log('Navigation loaded - Distance:', leg.distance.text, 'Duration:', leg.duration.text);
      }
    } catch (error) {
      console.error('Error fetching navigation instructions:', error);
    }
  };

  // Get current navigation instruction
  const getCurrentInstruction = () => {
    if (navigationSteps.length === 0 || currentStepIndex >= navigationSteps.length) {
      return {
        instruction: 'Head towards destination',
        distance: 'Calculating...',
        distanceValue: 0,
        maneuver: 'straight'
      };
    }
    
    return navigationSteps[currentStepIndex];
  };

  const currentInstruction = getCurrentInstruction();

  // Smart data extraction with fallbacks
  const getLocationData = () => {
    // FROM location - prioritize userLocation, then walkData, then calculatedStats, then demo fallback
    const fromLocation = userLocation 
                        ? 'Current Location'
                        : (walkData?.meetupPoint || walkData?.startLocationName || 'UJ APB West Entrance');
    
    const fromAddress = walkData?.fromAddress || 
                       (calculatedStats?.startAddress || (userLocation ? 'Your current position' : '52 Algernon St, Auckland Park'));
    
    // TO location - prioritize walkData, then use demo fallback (Horizon Heights)
    const toLocation = walkData?.toDestination || 
                      walkData?.destinationName || 
                      'Horizon Heights';
    
    const toAddress = walkData?.toAddress || 
                     (calculatedStats?.endAddress || '1 Jan Smuts Ave, Braamfontein');
    
    // Distance - prioritize API calculated data, then walkData, then demo fallback
    const totalDistance = calculatedStats?.distance || 
                         walkData?.totalDistance || 
                         '1.5 km';
    
    // Duration - prioritize API calculated data, then walkData, then demo fallback
    const estimatedDuration = calculatedStats?.duration || 
                             walkData?.estimatedDuration || 
                             '18 min';
    
    // Extract just the number of minutes for arrival calculation
    const durationMinutes = calculatedStats?.durationValue 
      ? Math.round(calculatedStats.durationValue / 60)
      : parseInt(estimatedDuration.match(/\d+/)?.[0] || '18');
    
    return {
      fromLocation,
      fromAddress,
      toLocation,
      toAddress,
      totalDistance,
      estimatedDuration,
      durationMinutes
    };
  };

  const locationData = getLocationData();

  // Calculate estimated arrival time
  const calculateArrivalTime = () => {
    const minutes = locationData.durationMinutes;
    const arrival = new Date(currentTime.getTime() + minutes * 60000);
    return arrival.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Color scheme
  const colors = {
    light: {
      primary: '#000000',
      secondary: '#666666',
      background: 'rgba(255, 255, 255, 0.95)',
      gradient: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)'],
      gradientBottom: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.95)'],
      circle: '#656565',
      divider: '#e0e0e0'
    },
    dark: {
      primary: '#ffffff',
      secondary: '#b8b8b8',
      background: 'rgba(26, 26, 26, 0.95)',
      gradient: ['rgba(26, 26, 26, 0.95)', 'rgba(26, 26, 26, 0.6)', 'rgba(26, 26, 26, 0)'],
      gradientBottom: ['rgba(26, 26, 26, 0)', 'rgba(26, 26, 26, 0.6)', 'rgba(26, 26, 26, 0.95)'],
      circle: '#b8b8b8',
      divider: '#404040'
    }
  };

  const theme = isDark ? colors.dark : colors.light;

  return (
    <View style={styles.container}>
      {/* Top gradient overlay */}
      <LinearGradient
        colors={theme.gradient}
        locations={[0, 0.8, 1]}
        style={styles.gradient}
      />
      
      {/* Directions and buttons */}
      <View style={styles.topSection}>
        {/* Navigation Instructions */}
        <View style={styles.directionsContainer}>
          {/* Navigation icon based on maneuver */}
          <Ionicons 
            name={getManeuverIcon(currentInstruction.maneuver)} 
            size={90} 
            color={theme.primary} 
          />
          {/* Distance and instruction info */}
          <View style={styles.instructionContainer}>
            <Text style={[styles.distanceLarge, {color: theme.primary}]}>
              {currentInstruction.distance}
            </Text>
            <Text style={[styles.streetName, {color: theme.primary}]} numberOfLines={2}>
              {currentInstruction.instruction}
            </Text>
          </View>
        </View>
        
        {/* Control Buttons */}
        <View style={styles.buttonColumn}>
          <TouchableOpacity 
            style={styles.circleContainer}
            onPress={onMoreOptions}
          >
            <View style={[styles.circle, {backgroundColor: theme.circle}]} />
            <Ionicons 
              name="reorder-three-outline" 
              size={25} 
              color={theme.primary} 
              style={styles.icon} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.circleContainer, {marginTop: 10}]}
            onPress={onRecenter}
          >
            <View style={[styles.circle, {backgroundColor: theme.circle}]} />
            <Ionicons 
              name="navigate" 
              size={25} 
              color={theme.primary} 
              style={styles.icon} 
            />
          </TouchableOpacity>

          {/* partner icon */}
          <TouchableOpacity style ={styles.partnerPic} onPress={() => {setShowPartnerUpdate(true)}}>
            <Image source={avatarSource}
              style={{width: '100%', height: '100%'}}
            />
            {/* partnerData.imageUrl */}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Bottom gradient overlay */}
      <LinearGradient
        colors={theme.gradientBottom}
        locations={[0, 0.2, 1]}
        style={styles.gradient2}
      />
      
      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* From/To locations */}
        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <View style={styles.locationIndicators}>
              <Text style={[styles.smallestText, {color: theme.secondary}]}>From</Text>
              <View style={[styles.circleEmpty, {borderColor: theme.primary}]} />
              <View style={[styles.dottedLine, {borderColor: theme.primary}]} />
              <View style={[styles.circleFilled, {backgroundColor: theme.primary}]} />
              <Text style={[styles.smallestText, {color: theme.secondary}]}>To</Text>
            </View>
          </View>
          
          <View style={styles.addressRow}>
            <View style={styles.addressColumn}>
              <Text style={[styles.locationName, {color: theme.primary}]} numberOfLines={1}>
                {locationData.fromLocation}
              </Text>
              <Text style={[styles.addressText, {color: theme.secondary}]} numberOfLines={1}>
                {locationData.fromAddress}
              </Text>
            </View>
            <View style={[styles.addressColumn, {paddingLeft: 20}]}>
              <Text style={[styles.locationName, {color: theme.primary}]} numberOfLines={1}>
                {locationData.toLocation}
              </Text>
              <Text style={[styles.addressText, {color: theme.secondary}]} numberOfLines={1}>
                {locationData.toAddress}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.divider, {backgroundColor: theme.divider}]} />
        
        <View style={styles.statsRow}>
          <View style={styles.statsLeft}>
            <Text style={[styles.distanceText, {color: theme.primary}]}>
              {locationData.totalDistance}
            </Text>
            <Text style={[styles.dotSeparator, {color: theme.secondary}]}>•</Text>
            <Text style={[styles.timeText, {color: theme.primary}]}>
              {locationData.estimatedDuration}
            </Text>
            <Text style={[styles.arrivalTime, {color: theme.secondary}]}>
              {calculateArrivalTime()}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.circleContainer}
            onPress={onEmergency}
          >
            <View style={[styles.circle, {backgroundColor: theme.circle}]} />
            <Ionicons 
              name="shield" 
              size={24} 
              color="#FF6B35" 
              style={styles.icon} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Helper function to get appropriate icon for maneuver
const getManeuverIcon = (maneuver) => {
  if (!maneuver) return 'arrow-up';
  
  const maneuverLower = maneuver.toLowerCase();
  
  if (maneuverLower.includes('left')) return 'arrow-back';
  if (maneuverLower.includes('right')) return 'arrow-forward';
  if (maneuverLower.includes('uturn') || maneuverLower.includes('u-turn')) return 'swap-horizontal';
  if (maneuverLower.includes('merge')) return 'git-merge';
  if (maneuverLower.includes('fork')) return 'git-branch';
  if (maneuverLower.includes('roundabout')) return 'sync-circle';
  
  return 'arrow-up';
};

export default WalkDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'box-none',
  },
  gradient: {
    width: width,
    height: height * 0.28,
    position: 'absolute',
    top: 0,
  },
  topSection: {
    paddingTop: 60,
    paddingLeft: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  directionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  instructionContainer: {
    marginLeft: 10,
    flex: 1,
  },
  buttonColumn: {
    paddingRight: 20,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 80,
  },
  circleContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.14,
    position: 'absolute',
  },
  icon: {
    zIndex: 1,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    paddingHorizontal: 20,
  },
  gradient2: {
    width: width,
    height: height * 0.3,
    position: 'absolute',
    bottom: 0,
  },
  smallestText: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleEmpty: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  dottedLine: {
    width: 120,
    height: 0,
    borderWidth: 1,
    borderStyle: 'dotted',
  },
  circleFilled: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressColumn: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distanceLarge: {
    fontSize: 50,
    fontWeight: '700',
  },
  streetName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 30,
    fontWeight: '700',
  },
  dotSeparator: {
    fontSize: 28,
    fontWeight: '300',
  },
  timeText: {
    fontSize: 30,
    fontWeight: '700',
  },
  arrivalTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  partnerPic: {
    width: 42,
    height: 42,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
  }
});