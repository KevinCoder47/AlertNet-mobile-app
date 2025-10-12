import React, { useRef, useState, useEffect } from 'react';
// import { doc, onSnapshot } from 'firebase/firestore';
import { doc } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { db } from '../../../backend/Firebase/FirebaseConfig';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { useTheme } from '../../contexts/ColorContext';
import PartnerMarker from '../PartnerMarker';

const MAP_STYLES = {
  light: [
    { "elementType": "geometry", "stylers": [{ "color": "#f8f8f8" }] },
    { "elementType": "labels", "stylers": [{ "visibility": "off" }] },
    {
      "featureType": "road.local",
      "elementType": "labels.text.fill",
      "stylers": [{ "visibility": "on" }, { "color": "#4a4a4a" }]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels.text.fill",
      "stylers": [{ "visibility": "on" }, { "color": "#3a3a3a" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.stroke",
      "stylers": [{ "visibility": "on" }, { "color": "#ffffff" }, { "weight": 3 }]
    },
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [{ "visibility": "on" }, { "color": "#d4e7d7" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#c9dff5" }]
    },
    {
      "featureType": "road.local",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#ffffff" }]
    },
    {
      "featureType": "road.local",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#d8d8d8" }, { "weight": 1 }]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#ffffff" }]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#cccccc" }, { "weight": 1.2 }]
    },
    { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
    { "featureType": "poi.business", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  ],
  
  dark: [
    { "elementType": "geometry", "stylers": [{ "color": "#151515" }] },
    { "elementType": "labels", "stylers": [{ "visibility": "off" }] },
    {
      "featureType": "road.local",
      "elementType": "labels.text.fill",
      "stylers": [{ "visibility": "on" }, { "color": "#c0c0c0" }]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels.text.fill",
      "stylers": [{ "visibility": "on" }, { "color": "#d0d0d0" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.stroke",
      "stylers": [{ "visibility": "on" }, { "color": "#151515" }, { "weight": 3 }]
    },
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [{ "visibility": "on" }, { "color": "#1a2e1a" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#0d1419" }]
    },
    {
      "featureType": "road.local",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#2a2a2a" }]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#323232" }]
    },
    { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
    { "featureType": "poi.business", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  ]
};

const WalkingMap = ({ 
  walkDetails,
  onRouteReady,
  onUserLocationChange,
  onNavigationUpdate 
}) => {
  const mapRef = useRef(null);
  const { isDark } = useTheme();
  
  const [userLocation, setUserLocation] = useState(null);
  const [userHeading, setUserHeading] = useState(0);
  const [partnerLocation, setPartnerLocation] = useState(walkDetails?.partnerLocation || null);
  const [meetUpPoint, setMeetUpPoint] = useState(walkDetails?.meetUpPoint || null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [testPartnerLocation, setTestPartnerLocation] = useState(null);
  const [partnerData, setPartnerData] = useState();

  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

  // Compass-based heading (works even when stationary)
  useEffect(() => {
    let subscription;
    
    const startCompass = async () => {
      const { status } = await Magnetometer.isAvailableAsync();
      
      if (!status) {
        console.log('Magnetometer not available');
        return;
      }

      Magnetometer.setUpdateInterval(100);
      
      subscription = Magnetometer.addListener((data) => {
        const { x, y } = data;
        let heading = Math.atan2(y, x) * (180 / Math.PI);
        heading = (heading + 360) % 360;
        
        setUserHeading(heading);
        
        if (mapRef.current && userLocation && !isInitialLoad) {
          mapRef.current.animateCamera({
            center: userLocation,
            pitch: 60,
            heading: heading,
            altitude: 200,
            zoom: 19,
          }, { duration: 100 });
        }
      });
    };

    startCompass();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [userLocation, isInitialLoad]);

  // Request location permissions and start tracking
  useEffect(() => {
    let subscription;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const initialLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(initialLocation);
        onUserLocationChange?.(initialLocation);
        
        if (location.coords.heading !== null && location.coords.heading !== -1) {
          setUserHeading(location.coords.heading);
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 5,
          },
          (location) => {
            const newLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            
            setUserLocation(newLocation);
            onUserLocationChange?.(newLocation);
            
            if (location.coords.heading !== null && location.coords.heading !== -1 && location.coords.speed > 0.5) {
              setUserHeading(location.coords.heading);
            }
            
            if (mapRef.current && !isInitialLoad) {
              mapRef.current.animateCamera({
                center: newLocation,
                pitch: 60,
                heading: userHeading,
                altitude: 200,
                zoom: 19,
              }, { duration: 500 });
            }
          }
        );

      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    startLocationTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Firestore listener for test partner location
  useEffect(() => {
    const TEST_USER_UID = 'F0hRn19LeQWjSoGlgntyxW4UFTZ2';
    
    const userDocRef = doc(db, 'users', TEST_USER_UID);
    
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setPartnerData(userData);
          
          if (
            userData.CurrentLocation &&
            typeof userData.CurrentLocation.latitude === 'number' &&
            typeof userData.CurrentLocation.longitude === 'number'
          ) {
            const newLocation = {
              latitude: userData.CurrentLocation.latitude,
              longitude: userData.CurrentLocation.longitude,
            };
            
            setTestPartnerLocation(newLocation);
            
            console.log('Test partner location updated:', {
              name: userData.Name || 'Unknown',
              location: newLocation,
              lastUpdate: userData.LastLocationUpdate?.toDate?.() || 'Unknown',
            });
          } else {
            console.warn('Test user location data is invalid or missing');
          }
        } else {
          console.warn('Test user document does not exist');
        }
      },
      (error) => {
        console.error('Error listening to test user location:', error);
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Update partnerLocation when testPartnerLocation changes
  useEffect(() => {
    if (testPartnerLocation) {
      setPartnerLocation(testPartnerLocation);
    }
  }, [testPartnerLocation]);

  // Helper to validate coordinates
  const isValidCoordinate = (coord) => {
    if (!coord || typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
      return false;
    }

    return (
      coord.latitude >= -90 && coord.latitude <= 90 &&
      coord.longitude >= -180 && coord.longitude <= 180
    );
  };

  const shouldShowDirections = userLocation && meetUpPoint && 
    isValidCoordinate(userLocation) && isValidCoordinate(meetUpPoint);

  const getCenterPoint = () => {
    if (!userLocation) return meetUpPoint || { latitude: -26.2041, longitude: 28.0473 };
    
    const points = [userLocation];
    if (meetUpPoint) points.push(meetUpPoint);
    if (partnerLocation) points.push(partnerLocation);

    const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
    const avgLng = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;

    return { latitude: avgLat, longitude: avgLng };
  };

  const centerPoint = getCenterPoint();

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: centerPoint.latitude,
          longitude: centerPoint.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        customMapStyle={isDark ? MAP_STYLES.dark : MAP_STYLES.light}
        showsPointsOfInterest={false}
        showsBuildings={true}
        showsTraffic={false}
        showsIndoors={false}
        pitchEnabled={true}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        loadingEnabled={true}
        camera={{
          center: userLocation || centerPoint,
          pitch: 30,
          heading: userHeading,
          altitude: 700,
          zoom: 19,
        }}
        mapPadding={{
          top: 200,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      >
        {shouldShowDirections && (
          <MapViewDirections
            origin={userLocation}
            destination={meetUpPoint}
            apikey={GOOGLE_MAPS_API_KEY}
            mode="WALKING"
            strokeWidth={8}
            strokeColor={isDark ? "#60A5FA" : "#FF6B35"}
            fillColor={isDark ? "#60A5FA" : "#FF6B35"}
            optimizeWaypoints={true}
            onReady={result => {
              console.log('✅ Directions loaded successfully');
              console.log(`Distance: ${result.distance} km`);
              console.log(`Duration: ${result.duration} min.`);
              
              onRouteReady?.({
                distance: result.distance,
                duration: result.duration,
                coordinates: result.coordinates
              });
              
              if (mapRef.current && isInitialLoad) {
                mapRef.current.fitToCoordinates(result.coordinates, {
                  edgePadding: {
                    right: 50,
                    bottom: 50,
                    left: 50,
                    top: 250,
                  },
                  animated: true,
                });
                setIsInitialLoad(false);
              }
            }}
            onError={(errorMessage) => {
              console.error('❌ Directions Error:', errorMessage);
              console.log('🔍 Debug coordinates:', {
                userLocation,
                meetUpPoint,
                hasUserLocation: !!userLocation,
                hasMeetUpPoint: !!meetUpPoint,
                apiKey: GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing'
              });

              // Validate coordinates
              if (userLocation && meetUpPoint) {
                const isUserLocationValid =
                  userLocation.latitude >= -90 && userLocation.latitude <= 90 &&
                  userLocation.longitude >= -180 && userLocation.longitude <= 180;

                const isMeetUpPointValid =
                  meetUpPoint.latitude >= -90 && meetUpPoint.latitude <= 90 &&
                  meetUpPoint.longitude >= -180 && meetUpPoint.longitude <= 180;

                console.log('📍 Coordinate validation:', {
                  userLocationValid: isUserLocationValid,
                  meetUpPointValid: isMeetUpPointValid,
                  userLocation: `${userLocation.latitude}, ${userLocation.longitude}`,
                  meetUpPoint: `${meetUpPoint.latitude}, ${meetUpPoint.longitude}`
                });

                if (!isUserLocationValid || !isMeetUpPointValid) {
                  console.warn('⚠️ Invalid coordinates detected — skipping route rendering.');
                } else {
                  console.warn('⚠️ Directions request failed unexpectedly. Check API key or quota.');
                }
              } else {
                console.warn('⚠️ Missing user or meetup coordinates — cannot request directions.');
              }
            }}
          />
        )}

        {userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            rotation={userHeading}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
              <View style={styles.userMarkerPulse} />
              <View style={styles.userMarkerArrow} />
            </View>
          </Marker>
        )}

        {partnerLocation && (
          <Marker
            coordinate={partnerLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            title="Partner"
          >
            <View style={styles.partnerMarker}>
              <PartnerMarker partner={partnerData} />
            </View>
          </Marker>
        )}

        {meetUpPoint && (
          <Marker
            coordinate={meetUpPoint}
            anchor={{ x: 0.5, y: 1 }}
            title="Meetup Point"
          >
            <View style={styles.meetupMarker}>
              <View style={styles.meetupMarkerPin} />
              <View style={styles.meetupMarkerCircle} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
};

export default WalkingMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  // User marker (you - blue with pulse)
  userMarker: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    opacity: 0.2,
    zIndex: 1,
  },
  userMarkerArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#3B82F6',
    top: -8,
    zIndex: 3,
  },
  // Partner marker (purple)
  partnerMarker: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerMarkerInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#A855F7',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Meetup point marker (green pin)
  meetupMarker: {
    width: 30,
    height: 40,
    alignItems: 'center',
  },
  meetupMarkerPin: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#10B981',
  },
  meetupMarkerCircle: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});