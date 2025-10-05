import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Linking,
  Image,
  Platform,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../backend/Firebase/FirebaseConfig';

const { width, height } = Dimensions.get('window');

const LocationViewer = ({ 
  senderLocation, // This is the initial location
  senderName, 
  senderPhone,
  senderId, // New prop for real-time updates
  senderProfilePicture, // New prop for the user's image
  locationTimestamp, // The timestamp of the initial SOS location
  onClose, 
  onCallSender,
  onSendMessage 
}) => {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(null);
  const [walkingTime, setWalkingTime] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  // New state for real-time updates
  const [initialSenderLocation] = useState(senderLocation);
  const [liveLocation, setLiveLocation] = useState(null);
  const [liveLocationLastUpdated, setLiveLocationLastUpdated] = useState(null);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Calculate walking time (average walking speed: 5 km/h)
  const calculateWalkingTime = (distanceKm) => {
    const walkingSpeedKmh = 5;
    const timeHours = distanceKm / walkingSpeedKmh;
    const timeMinutes = Math.round(timeHours * 60);
    return timeMinutes;
  };

  // Get user's current location
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Location Permission Required',
            'Please enable location services to see the distance to the sender.',
            [{ text: 'OK' }]
          );
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setUserLocation(location.coords);
        
        // Calculate distance and walking time if sender location is available
        if (senderLocation) {
          const dist = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            senderLocation.latitude,
            senderLocation.longitude
          );
          setDistance(dist);
          setWalkingTime(calculateWalkingTime(dist));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error getting location:', error);
        setLoading(false);
        Alert.alert('Error', 'Could not get your current location');
      }
    };

    getCurrentLocation();
  }, [senderLocation]);

  // Listen for real-time location updates from Firebase
  useEffect(() => {
    if (!senderId) {
      console.log("LocationViewer: No senderId provided, real-time updates disabled.");
      return;
    }

    const userDocRef = doc(db, 'users', senderId);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.currentLocation) {
          console.log("Live location update received:", userData.currentLocation);
          setLiveLocation(userData.currentLocation);
          setLiveLocationLastUpdated(new Date()); // Record when we received the update

          // Update distance and walking time based on the new live location
          if (userLocation) {
            const dist = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              userData.currentLocation.latitude,
              userData.currentLocation.longitude
            );
            setDistance(dist);
            setWalkingTime(calculateWalkingTime(dist));
          }
        }
      } else {
        console.log("LocationViewer: Sender document not found for real-time updates.");
      }
    }, (error) => {
      console.error("Error listening to location updates:", error);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [senderId, userLocation]); // Rerun if userLocation changes to recalculate distance

  // Center map to show all locations
  useEffect(() => {
    if (mapReady && mapRef.current && initialSenderLocation) {
      const coordinates = [];
      coordinates.push({
        latitude: initialSenderLocation.latitude,
        longitude: initialSenderLocation.longitude,
      });

      if (userLocation) {
        coordinates.push({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        });
      }
      
      if (liveLocation) {
        coordinates.push({
          latitude: liveLocation.latitude,
          longitude: liveLocation.longitude,
        });
      }

      if (coordinates.length > 1) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 150, right: 50, bottom: 400, left: 50 },
          animated: true,
        });
      } else {
        // If only initial location is available, center on that
        mapRef.current.animateToRegion({
          latitude: initialSenderLocation.latitude,
          longitude: initialSenderLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    }
  }, [mapReady, initialSenderLocation, userLocation, liveLocation]);

  // Open navigation app
  const openNavigation = () => {
    const targetLocation = liveLocation || initialSenderLocation; // Prioritize live location
    if (!targetLocation) return;

    const { latitude, longitude } = targetLocation;
    const label = encodeURIComponent(`${senderName}'s Location`);
    
    Alert.alert(
      'Open Navigation',
      'Choose your preferred navigation app:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Google Maps',
          onPress: () => {
            const url = Platform.select({
              ios: `maps:0,0?q=${latitude},${longitude}(${label})`,
              android: `geo:0,0?q=${latitude},${longitude}(${label})`,
            });
            Linking.openURL(url);
          },
        },
        {
          text: 'Apple Maps',
          onPress: () => {
            const url = `http://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`;
            Linking.openURL(url);
          },
        },
      ]
    );
  };

  // Format distance for display
  const formatDistance = (dist) => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)}m`;
    }
    return `${dist.toFixed(1)}km`;
  };

  // Format walking time
  const formatWalkingTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  // Format the timestamp for display
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return null;
    const now = new Date();
    const past = new Date(timestamp);
    const diffSeconds = Math.floor((now - past) / 1000);

    if (diffSeconds < 60) return 'just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return past.toLocaleDateString();
  };

  const lastUpdatedText = liveLocationLastUpdated 
    ? `(live, updated ${formatTimeAgo(liveLocationLastUpdated)})`
    : locationTimestamp ? `(updated ${formatTimeAgo(locationTimestamp)})`
    : null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Getting location...</Text>
      </View>
    );
  }

  if (!senderLocation) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="map-marker-off" size={64} color="#888888" />
        <Text style={styles.errorTitle}>Location Unavailable</Text>
        <Text style={styles.errorText}>
          The sender's location could not be retrieved.
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map taking most of the screen */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        onMapReady={() => setMapReady(true)}
        initialRegion={{
          latitude: initialSenderLocation.latitude,
          longitude: initialSenderLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Initial (SOS) location marker */}
        {initialSenderLocation && (
          <Marker
            coordinate={{
              latitude: initialSenderLocation.latitude,
              longitude: initialSenderLocation.longitude,
            }}
            title={`${senderName}'s SOS Location`}
            description="Emergency was triggered here"
          >
             <Image
              source={{ uri: senderProfilePicture }}
              style={styles.liveMarkerImage}
            />
          </Marker>
        )}

        {/* Live location marker */}
        {liveLocation && (
          <Marker
            coordinate={{
              latitude: liveLocation.latitude,
              longitude: liveLocation.longitude,
            }}
            title={`${senderName}'s Current Location`}
            description="Real-time position"
          >
            <Image
              source={{ uri: senderProfilePicture }}
              style={styles.liveMarkerImage}
            />
          </Marker>
        )}

        {/* Polyline to trace the path */}
        {initialSenderLocation && liveLocation && (
          <Polyline
            coordinates={[
              { latitude: initialSenderLocation.latitude, longitude: initialSenderLocation.longitude },
              { latitude: liveLocation.latitude, longitude: liveLocation.longitude }
            ]}
            strokeColor="#FF6B35"
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />
        )}

        {/* Accuracy circle around the most recent location */}
        <Circle
          center={liveLocation || initialSenderLocation}
          radius={(liveLocation?.accuracy || initialSenderLocation?.accuracy) || 50}
          strokeColor="rgba(255, 107, 53, 0.5)"
          fillColor="rgba(255, 107, 53, 0.1)"
          strokeWidth={2}
        />

        {/* User's location marker (if available) */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            description="Your current position"
          >
            {/* Custom user marker */}
            <View style={styles.userMarkerContainer}>
              <View style={styles.userMarkerDot} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Icon name="close" size={24} color="#000000" />
      </TouchableOpacity>

      {/* Navigate button */}
      <TouchableOpacity 
        style={styles.navigateButton}
        onPress={openNavigation}
      >
        <Icon name="navigation" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Bottom card matching the screenshot design */}
      <View style={styles.bottomCard}>
        <View style={styles.cardContent}>
          {/* Profile section */}
          <View style={styles.profileSection}>
            {senderProfilePicture ? (
              <Image 
                source={{ uri: senderProfilePicture }} 
                style={styles.profilePictureImage} 
              />
            ) : (
              <View style={styles.profilePicture}>
                <Icon name="account" size={32} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.nameText}>{senderName}</Text>
              {lastUpdatedText && (
                <Text style={styles.lastUpdatedText}>{lastUpdatedText}</Text>
              )}
            </View>
          </View>

          {/* Distance and time section */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {distance ? formatDistance(distance) : '---'}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {walkingTime ? formatWalkingTime(walkingTime) : '---'}
              </Text>
              <Text style={styles.statLabel}>Walk</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtonsSection}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.messageBtn]}
              onPress={() => {
                if (onSendMessage) {
                  // Close the location viewer and open the chat
                  onClose();
                  setTimeout(() => onSendMessage(), 100); // Delay to allow modal to close
                } else if (senderPhone) {
                  Linking.openURL(`sms:${senderPhone}`);
                }
              }}
            >
              <Text style={styles.actionBtnText}>Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.callBtn]}
              onPress={() => {
                if (onCallSender) {
                  onCallSender();
                } else if (senderPhone) {
                  Linking.openURL(`tel:${senderPhone}`);
                }
              }}
            >
              <Text style={styles.actionBtnTextWhite}>Call Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 40,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  map: { flex: 1, width: '100%', height: '100%' },
  liveMarkerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userMarkerContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#007AFF' },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  cardContent: {
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profilePictureImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  lastUpdatedText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    marginTop: 2,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 25,
    paddingHorizontal: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  actionButtonsSection: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  actionBtn: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  messageBtn: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  callBtn: {
    backgroundColor: '#4CAF50',
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  actionBtnTextWhite: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navigateButton: {
    position: 'absolute',
    top: 50,
    left: 20, // Positioned next to the close button
    backgroundColor: '#FF6B35',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
});

export default LocationViewer;