import React, { useEffect, useState, useMemo, useRef } from 'react';
import { StyleSheet, View, Dimensions, Alert, Platform, Image, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ColorContext';
import UserMapMarker from './UserMapMarker';
import AndroidMarker from './AndroidMarker';
import { useMapContext } from '../contexts/MapContext';
import { getUserDocument } from '../../services/firestore';

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

// Map IDs from Google Cloud Console
const MAP_IDS = {
  light: "f48cf5b0589cd8bf33ff62a3", 
  dark: "f48cf5b0589cd8bfd9dedc8e" 
};

export default function SafetyMap({userImage, friendsDetails, setFriendsDetails, userLocation, mapRef}) {
  const { colors } = useTheme();
  const [location, setLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // Platform-specific configuration
  const isAndroid = Platform.OS === 'android';
  
  // Normalize friendsDetails to always work with an array
  const friendsArray = useMemo(() => {
    if (!friendsDetails) return [];
    
    if (Array.isArray(friendsDetails)) {
      return friendsDetails;
    }
    
    // Convert object format to array
    return Object.entries(friendsDetails).map(([uid, friend]) => ({
      ...friend,
      uid: uid,
      friendId: friend.friendId || uid
    }));
  }, [friendsDetails]);

  // Debug logging to track friend data
  useEffect(() => {
    const friendsWithLocations = friendsArray.filter(f => f.currentLocation);
    
    friendsWithLocations.forEach(f => {
      // console.log(`  ${f.name}:`, {
      //   lat: f.currentLocation?.latitude,
      //   lng: f.currentLocation?.longitude,
      //   hasImage: !!f.imageUrl || !!f.avatar
      // });
    });
    
    if (friendsWithLocations.length === 0 && friendsArray.length > 0) {
      console.warn('⚠️ WARNING: Friends exist but none have currentLocation!');
    }
  }, [friendsDetails, friendsArray]);
  
  // Determine which approach to use based on platform
  const mapId = useMemo(() => {
    if (isAndroid) {
      return colors.isDark ? MAP_IDS.dark : MAP_IDS.light;
    }
    return colors.isDark ? MAP_IDS.dark : MAP_IDS.light;
  }, [colors.isDark, isAndroid]);
  
  // Fallback custom style (primarily for iOS compatibility)
  const mapStyle = useMemo(() => (
    colors.isDark ? MAP_STYLES.dark : MAP_STYLES.light
  ), [colors.isDark]);

  // Function to add a small offset to coordinates to prevent overlapping
  const getOffsetCoordinates = (baseLat, baseLng, index) => {
    const OFFSET_DISTANCE = 0.0003; // Approx ~30 meters
    const gridSize = 3; // 3x3 grid
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    return {
      latitude: baseLat + (row - 1) * OFFSET_DISTANCE,
      longitude: baseLng + (col - 1) * OFFSET_DISTANCE,
    };
  };

  // Update region to focus on user but include nearby friends
  useEffect(() => {
    if (!userLocation || !mapRef.current) return;
    
    // Get all valid friend locations from normalized array
    const friendLocations = friendsArray
      .filter(friend => friend.currentLocation)
      .map(friend => friend.currentLocation);
    
    // If no friends or friends are far away, focus on user only
    if (friendLocations.length === 0) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
      return;
    }
    
    // Calculate bounds that include user and nearby friends
    const allLocations = [userLocation, ...friendLocations];
    
    // Find min and max coordinates
    const lats = allLocations.map(loc => loc.latitude);
    const lngs = allLocations.map(loc => loc.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Calculate deltas with some padding
    const latDelta = (maxLat - minLat) * 1.5;
    const lngDelta = (maxLng - minLng) * 1.5;
    
    // Center on user but include nearby friends
    mapRef.current.animateToRegion({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: Math.max(0.01, Math.min(0.1, latDelta)),
      longitudeDelta: Math.max(0.01, Math.min(0.1, lngDelta)),
    }, 1000);
  }, [userLocation, friendsArray]);

  // Friends location listener - using normalized array
  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh friends' locations periodically
      friendsArray.forEach(async (friend) => {
        const uid = friend.friendId || friend.uid;
        if (!uid) return;
        
        try {
          const friendDoc = await getUserDocument(uid);
          if (friendDoc && friendDoc.currentLocation) {
            // Update via setFriendsDetails if available
            if (setFriendsDetails && typeof setFriendsDetails === 'function') {
              setFriendsDetails(prev => {
                // Handle both array and object formats
                if (Array.isArray(prev)) {
                  return prev.map(f => 
                    (f.friendId === uid || f.uid === uid) 
                      ? { ...f, currentLocation: friendDoc.currentLocation }
                      : f
                  );
                } else {
                  return {
                    ...prev,
                    [uid]: {
                      ...prev[uid],
                      currentLocation: friendDoc.currentLocation
                    }
                  };
                }
              });
            }
          }
        } catch (error) {
          console.error(`Error updating location for ${uid}:`, error);
        }
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [friendsArray, setFriendsDetails]);

  // Initial region calculation - focus on user
  const initialRegion = useMemo(() => {
    if (!userLocation) return null;
    
    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [userLocation]);

  return (
    <View style={styles.container}>
      {/* Main Map View */}
      {userLocation && mapReady && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider="google"
          customMapStyle={!isAndroid ? mapStyle : mapId} 
          googleMapId={isAndroid ? mapId : undefined}
          showsMyLocationButton={false}
          showsCompass={true}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={false}
          toolbarEnabled={false}
          initialRegion={initialRegion}
          zoomEnabled={true}
        >
          {/* User marker */}
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="My Location"
            anchor={{ x: 0.5, y: 1 }} 
            pinColor={Platform.OS === 'android' ? "#FF0000" : undefined}
            zIndex={1000}
          >
            {Platform.OS === 'ios' && <UserMapMarker userImage={userImage} />}
          </Marker>

          {/* Friend Markers - now using normalized array */}
          {friendsArray.map((friend, index) => {
            // Skip if no location data
            if (!friend.currentLocation || 
                friend.currentLocation.latitude == null || 
                friend.currentLocation.longitude == null) {
              return null;
            }
            
            const offsetCoords = getOffsetCoordinates(
              friend.currentLocation.latitude,
              friend.currentLocation.longitude,
              index
            );
            
            // Get unique key
            const key = friend.friendId || friend.uid || `friend_${index}`;
            
            // Get image URL (try multiple possible fields)
            const imageUrl = friend.imageUrl || friend.avatar || friend.ImageURL;
            
            return (
              <Marker
                key={key}
                coordinate={offsetCoords}
                title={friend.name || 'Friend'}
                zIndex={1}
              >
                {imageUrl ? (
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.friendMarker}
                    onError={(error) => {
                      // console.log('Error loading friend image:', error);
                    }}
                  />
                ) : (
                  <View style={[styles.friendMarker, styles.placeholderMarker]}>
                    <Text style={styles.placeholderText}>
                      {friend.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
              </Marker>
            );
          })}
        </MapView>
      )}

      {/* Hidden MapView for initialization */}
      {!mapReady && (
        <MapView
          style={[StyleSheet.absoluteFillObject, { opacity: 0 }]}
          provider={PROVIDER_GOOGLE}
          onMapReady={() => setMapReady(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  friendMarker: {
    width: 50, 
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  placeholderMarker: {
    backgroundColor: '#C84022',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});