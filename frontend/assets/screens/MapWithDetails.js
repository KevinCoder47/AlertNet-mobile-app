import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline, Circle } from 'react-native-maps';
import { useTheme } from '../contexts/ColorContext';
import { getWalkingRoute, getStraightLineRoute } from '../../services/walkpartnerfunctions';
import { Ionicons } from '@expo/vector-icons';
import UserMapMarker from '../componets/UserMapMarker';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAPS_API_KEY } from '@env';

// Custom Start Point Marker Component
const StartPointMarker = () => {
  const { isDark } = useTheme();
  
  return (
    <View style={[styles.markerContainer, styles.startMarker]}>
      <View style={[styles.markerCircle, { backgroundColor: isDark ? '#4CAF50' : '#66BB6A', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 4 }]}>
        <Ionicons name="flag" size={16} color="white" />
      </View>
      <View style={[styles.markerPointer, { borderTopColor: isDark ? '#4CAF50' : '#66BB6A' }]} />
    </View>
  );
};

// Custom Destination Marker Component
const DestinationMarker = () => {
  const { isDark } = useTheme();
  
  return (
    <View style={[styles.markerContainer, styles.destinationMarker]}>
      <View style={[styles.markerCircle, { backgroundColor: isDark ? '#F44336' : '#EF5350', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 4 }]}>
        <Ionicons name="location" size={16} color="white" />
      </View>
      <View style={[styles.markerPointer, { borderTopColor: isDark ? '#F44336' : '#EF5350' }]} />
    </View>
  );
};

const MapWithDetails = ({ isTapWhere, userLocation, setUserLocation, destination, startPoint, userImage }) => {
  const { colors, isDark } = useTheme();
  const [userToStartRoute, setUserToStartRoute] = useState(null);
  const [startToDestRoute, setStartToDestRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const mapRef = useRef(null);

  const MAP_STYLES = {
        light: [
          {
            "elementType": "geometry",
            "stylers": [{ "color": "#f5f5f5" }]
          },
          {
            "elementType": "labels.icon",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#616161" }]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#f5f5f5" }]
          },
          {
            "featureType": "poi",
            "elementType": "labels.text",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "featureType": "poi.business",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "featureType": "poi.government",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "featureType": "poi.medical",
            "stylers": [{ "visibility": "on" }]
          },
          {
            "featureType": "poi.police",
            "stylers": [{ "visibility": "on" }]
          },
          {
            "featureType": "poi.attraction",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "featureType": "poi.school",
            "stylers": [{ "visibility": "on" }]
          },
          {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{ "color": "#ffffff" }]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{ "color": "#dadada" }]
          },
          {
            "featureType": "road.arterial",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#757575" }]
          },
          {
            "featureType": "road.local",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#9e9e9e" }]
          },
          {
            "featureType": "transit.station",
            "stylers": [{ "visibility": "on" }]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#a8c3d6" }]
          },
          {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{ "color": "#e0f0e0" }, { "visibility": "on" }]
          },
        ],
        dark: [
          { elementType: "geometry", stylers: [{ color: "#212121" }] },
          { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
          { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#383838" }] },
          { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#4a4a4a" }] },
          { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#616161" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] }
        ]
      };
    
  // Fetch routes when start point or destination changes
  useEffect(() => {
    if (userLocation && startPoint && destination) {
      fetchAllRoutes();
    }
  }, [userLocation, startPoint, destination]);

  const fetchAllRoutes = async () => {
    if (!userLocation || !startPoint || !destination) return;
    
    setLoading(true);
    setError(null);
    setUserToStartRoute(null);
    setStartToDestRoute(null);
    
    try {
      // Fetch route from user location to start point
      const userToStart = await getWalkingRoute(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        },
        {
          latitude: startPoint.latitude,
          longitude: startPoint.longitude
        }
      );
      
      setUserToStartRoute(userToStart);
      
      // Fetch route from start point to destination
      const startToDest = await getWalkingRoute(
        {
          latitude: startPoint.latitude,
          longitude: startPoint.longitude
        },
        {
          latitude: destination.latitude,
          longitude: destination.longitude
        }
      );
      
      setStartToDestRoute(startToDest);
      
      // Fit map to show all routes and markers
      if (mapRef.current && userToStart.coordinates && startToDest.coordinates) {
        const allCoordinates = [...userToStart.coordinates, ...startToDest.coordinates];
        mapRef.current.fitToCoordinates(allCoordinates, {
          edgePadding: {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50
          },
          animated: true
        });
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError(err.message);
      
      // Fallback to straight line routes
      try {
        const userToStartFallback = getStraightLineRoute(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude
          },
          {
            latitude: startPoint.latitude,
            longitude: startPoint.longitude
          }
        );
        
        const startToDestFallback = getStraightLineRoute(
          {
            latitude: startPoint.latitude,
            longitude: startPoint.longitude
          },
          {
            latitude: destination.latitude,
            longitude: destination.longitude
          }
        );
        
        setUserToStartRoute(userToStartFallback);
        setStartToDestRoute(startToDestFallback);
      } catch (fallbackError) {
        console.error('Even fallback routes failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const retryRouteCalculation = () => {
    setError(null);
    fetchAllRoutes();
  };

  return (
    <View style={styles.fullMapContainer}>
<MapView
  ref={mapRef}
  style={styles.fullMap}
  provider={PROVIDER_GOOGLE}
  customMapStyle={isDark ? MAP_STYLES.dark : MAP_STYLES.light}
  initialRegion={{
    latitude: userLocation?.latitude || -26.2041,
    longitude: userLocation?.longitude || 28.0473,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }}
  showsUserLocation={false}
  showsMyLocationButton={true}
  showsCompass={true}
>
  {/* User Location Marker */}
  {userLocation && (
    <Marker
      coordinate={{
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      }}
      title="Your Location"
      zIndex={1000}
    >
      <UserMapMarker userImage={userImage} />
    </Marker>
  )}

  {/* Destination Marker */}
  {destination && (
    <Marker
      coordinate={{
        latitude: destination.latitude,
        longitude: destination.longitude
      }}
      title="Destination"
      description="Your walking destination"
      zIndex={999}
    >
      <DestinationMarker />
    </Marker>
  )}

  {/* Start Point Marker */}
  {startPoint && (
    <>
      <Marker
        coordinate={{
          latitude: startPoint.latitude,
          longitude: startPoint.longitude
        }}
        title="Start Point"
        zIndex={998}
      >
        <StartPointMarker />
      </Marker>
      <Circle
        center={{
          latitude: startPoint.latitude,
          longitude: startPoint.longitude
        }}
        radius={8}
        strokeWidth={2}
        strokeColor={isDark ? '#4CAF50' : '#66BB6A'}
        fillColor={isDark ? 'rgba(76, 175, 80, 0.3)' : 'rgba(102, 187, 106, 0.3)'}
      />
    </>
  )}

  {/* Route from Start Point to Destination using MapViewDirections */}
  {startPoint && destination && (
    <MapViewDirections
      origin={{
        latitude: startPoint.latitude,
        longitude: startPoint.longitude
      }}
      destination={{
        latitude: destination.latitude,
        longitude: destination.longitude
      }}
      apikey={GOOGLE_MAPS_API_KEY}
      strokeWidth={6}
      fillColor={'black'}
      mode="WALKING"
      resetOnChange={false}
    />
  )}

  {/* Route from User to Start Point using MapViewDirections */}
  {userLocation && startPoint && (
    <MapViewDirections
      origin={{
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      }}
      destination={{
        latitude: startPoint.latitude,
        longitude: startPoint.longitude
      }}
      apikey={GOOGLE_MAPS_API_KEY}
      strokeWidth={6}
      fillColor={isDark ? '#4CAF50' : '#66BB6A'}
      mode="WALKING"
      resetOnChange={false}
    />
  )}
</MapView>

      {/* Route Info Panel */}


      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingBox, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)' }]}>
            <ActivityIndicator size="large" color={isDark ? "#7CA3DA" : "#2196F3"} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Calculating your routes...
            </Text>
          </View>
        </View>
      )}

      {/* Error Message */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <View style={[styles.errorBox, { 
            backgroundColor: isDark ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDark ? '#FF6B6B' : '#D32F2F'
          }]}>
            <Ionicons 
              name="warning" 
              size={24} 
              color={isDark ? '#FF6B6B' : '#D32F2F'} 
              style={styles.errorIcon}
            />
            <Text style={[styles.errorText, { color: colors.text }]}>
              {error}
            </Text>
            
            <Text style={[styles.errorHelpText, { color: colors.text }]}>
              This error often occurs when:
              {"\n"}• Location services are disabled
              {"\n"}• Google Maps can't find a route between these points
              {"\n"}• There's a temporary service issue
            </Text>
            
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: isDark ? '#7CA3DA' : '#2196F3' }]}
              onPress={retryRouteCalculation}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default MapWithDetails;

const styles = StyleSheet.create({
  fullMapContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fullMap: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingBox: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  errorBox: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  errorIcon: {
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorHelpText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15,
    opacity: 0.8,
  },
  retryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  routeInfoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  // New marker styles
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  startMarker: {
    width: 50,
    height: 60,
  },
  destinationMarker: {
    width: 50,
    height: 60,
  },
  markerCircle: {
    width: 50,
    height: 50,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  markerPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    marginTop: -2,
  },
  infoPanel: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
  },
});