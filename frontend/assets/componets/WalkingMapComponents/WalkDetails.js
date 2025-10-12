import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ColorContext';

const { width, height } = Dimensions.get('window');

const WalkDetails = ({ 
  walkData,
  partnerData,
  onEndWalk,
  onRecenter,
  onMoreOptions,
  onEmergency
}) => {
  const { isDark } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate estimated arrival time
  const calculateArrivalTime = () => {
    if (!walkData?.estimatedDuration) return '--:--';
    
    const minutes = parseInt(walkData.estimatedDuration);
    const arrival = new Date(currentTime.getTime() + minutes * 60000);
    return arrival.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Extract walk data with fallbacks
  const fromLocation = walkData?.fromLocation || 'Current Location';
  const toLocation = walkData?.toLocation || 'Destination';
  const fromAddress = walkData?.fromAddress || '';
  const toAddress = walkData?.toAddress || '';
  const totalDistance = walkData?.totalDistance || '0 km';
  const estimatedDuration = walkData?.estimatedDuration || '0 min';
  const nextTurnDistance = walkData?.nextTurnDistance || '250 m';
  const nextStreet = walkData?.nextStreet || 'Continue straight';

  // SAFETY: Ensure locations are always strings
  const safeFromLocation = typeof walkData?.fromLocation === 'string' 
    ? walkData.fromLocation 
    : String(walkData?.fromLocation || 'Your Location');

  const safeToLocation = typeof walkData?.toLocation === 'string'
    ? walkData.toLocation
    : String(walkData?.toLocation || 'Destination');

  const safeFromAddress = typeof walkData?.fromAddress === 'string' ? walkData.fromAddress : '';
  const safeToAddress = typeof walkData?.toAddress === 'string' ? walkData.toAddress : '';

  // Debug log to catch any object rendering attempts
  console.log('🔍 [WalkDetails] Location data:', {
    fromLocation: safeFromLocation,
    toLocation: safeToLocation,
    fromAddress: safeFromAddress,
    toAddress: safeToAddress
  });

  // Color scheme
  const colors = {
    light: {
      primary: '#000000',
      secondary: '#666666',
      background: 'rgba(255, 255, 255, 0.95)',
      gradient: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)'],
      gradientBottom: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.95)'],
      circle: '#656565',
      divider: '#121212ff'
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
        {/* Directions */}
        <View style={styles.directionsContainer}>
          {/* Arrow icon */}
          <Ionicons name="arrow-up" size={90} color={theme.primary} />
          {/* Distance and street info */}
          <View>
            <Text style={[styles.distanceLarge, {color: theme.primary}]}>
              {nextTurnDistance}
            </Text>
            <Text style={[styles.streetName, {color: theme.primary}]}>
              {nextStreet}
            </Text>
          </View>
        </View>
        
        {/* Control Buttons */}
        <View style={styles.buttonColumn}>
          {/* More options button */}
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
          
          {/* Recenter button */}
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
          {/* From/To indicator line */}
          <View style={styles.locationRow}>
            <View style={styles.locationIndicators}>
              <Text style={[styles.smallestText, {color: theme.secondary}]}>From</Text>
              <View style={[styles.circleEmpty, {borderColor: theme.primary}]} />
              <View style={[styles.dottedLine, {borderColor: theme.primary}]} />
              <View style={[styles.circleFilled, {backgroundColor: theme.primary}]} />
              <Text style={[styles.smallestText, {color: theme.secondary}]}>To</Text>
            </View>
          </View>
          
          {/* Addresses */}
          <View style={styles.addressRow}>
            <View style={styles.addressColumn}>
              <Text style={[styles.locationName, {color: theme.primary}]}>
                {safeFromLocation}
              </Text>
              <Text style={[styles.addressText, {color: theme.secondary}]}>
                {safeFromAddress}
              </Text>
            </View>
            <View style={[styles.addressColumn, {paddingLeft: 20}]}>
              <Text style={[styles.locationName, {color: theme.primary}]}>
                {safeToLocation}
              </Text>
              <Text style={[styles.addressText, {color: theme.secondary}]}>
                {safeToAddress}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Divider */}
        <View style={[styles.divider, {backgroundColor: theme.divider}]} />
        
        {/* Distance, time, and emergency button */}
        <View style={styles.statsRow}>
          <View style={styles.statsLeft}>
            <Text style={[styles.distanceText, {color: theme.primary}]}>
              {totalDistance}
            </Text>
            <Text style={[styles.dotSeparator, {color: theme.secondary}]}>•</Text>
            <Text style={[styles.timeText, {color: theme.primary}]}>
              {estimatedDuration}
            </Text>
            <Text style={[styles.arrivalTime, {color: theme.secondary}]}>
              {calculateArrivalTime()}
            </Text>
          </View>
          
          {/* Emergency/SOS Button */}
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
  }
});