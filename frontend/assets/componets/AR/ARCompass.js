import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const ARCompass = ({ destination }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [heading, setHeading] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [direction, setDirection] = useState(0);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(cameraStatus === 'granted' && locationStatus === 'granted');
      
      // Start sensors
      Magnetometer.setUpdateInterval(100);
      Magnetometer.addListener((data) => {
        const { x, y } = data;
        const newHeading = Math.atan2(y, x) * (180 / Math.PI);
        setHeading(newHeading);
      });
      
      // Get user location
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);

  // Calculate direction to destination
  useEffect(() => {
    if (userLocation && destination) {
      const bearing = calculateBearing(
        userLocation.latitude,
        userLocation.longitude,
        destination.latitude,
        destination.longitude
      );
      setDirection(bearing);
      
      const dist = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        destination.latitude,
        destination.longitude
      );
      setDistance(dist);
    }
  }, [userLocation, destination, heading]);

  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    // Simplified bearing calculation
    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - 
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    return Math.atan2(y, x) * (180 / Math.PI);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula for distance
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Distance in meters
  };

  if (hasPermission === null) {
    return <View><Text>Requesting permissions...</Text></View>;
  }
  if (hasPermission === false) {
    return <View><Text>No access to camera</Text></View>;
  }

  const rotation = direction - heading;

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={Camera.Constants.Type.back}>
        <View style={styles.overlay}>
          {/* Direction Arrow */}
          <View style={[styles.arrowContainer, { transform: [{ rotate: `${rotation}deg` }] }]}>
            <Ionicons name="navigate" size={80} color="#FF6B35" />
          </View>
          
          {/* Distance Info */}
          <View style={styles.infoPanel}>
            <Text style={styles.distanceText}>
              {distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(1)}km`}
            </Text>
            <Text style={styles.directionText}>
              {getDirectionText(rotation)}
            </Text>
          </View>

          {/* Visual Waypoints */}
          <View style={styles.waypoint}>
            <View style={styles.pulseCircle} />
            <Text style={styles.waypointText}>Meetup Point</Text>
          </View>
        </View>
      </Camera>
    </View>
  );
};

const getDirectionText = (rotation) => {
  const normalized = (rotation + 360) % 360;
  if (normalized < 45 || normalized > 315) return "Straight ahead";
  if (normalized < 135) return "Turn right";
  if (normalized < 225) return "Behind you";
  return "Turn left";
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    marginBottom: 100,
  },
  infoPanel: {
    position: 'absolute',
    top: 60,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  distanceText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  directionText: {
    color: 'white',
    fontSize: 16,
    marginTop: 5,
  },
  waypoint: {
    position: 'absolute',
    bottom: 150,
    alignItems: 'center',
  },
  pulseCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B35',
    opacity: 0.7,
  },
  waypointText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ARCompass;