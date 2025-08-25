import React, { useEffect, useState, useMemo, useRef } from 'react';
import { StyleSheet, View, Dimensions, Alert, Platform, Image } from 'react-native';
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
  
  // Determine which approach to use based on platform
  const mapId = useMemo(() => {
    // On Android, use mapId approach with our cloud-stored styles
    if (isAndroid) {
      return colors.isDark ? MAP_IDS.dark : MAP_IDS.light;
    }
    // On iOS, we can use either approach
    return colors.isDark ? MAP_IDS.dark : MAP_IDS.light;
  }, [colors.isDark, isAndroid]);
  
  // Fallback custom style (primarily for iOS compatibility)
  const mapStyle = useMemo(() => (
    colors.isDark ? MAP_STYLES.dark : MAP_STYLES.light
  ), [colors.isDark]);

  // Function to add a small offset to coordinates to prevent overlapping
  const getOffsetCoordinates = (baseLat, baseLng, index) => {
    // Add a small offset based on index to prevent markers from overlapping
    const offset = 0.0001; // Approximately 10 meters
    return {
      latitude: baseLat + (offset * (index % 3 - 1)), // -offset, 0, or +offset
      longitude: baseLng + (offset * (Math.floor(index / 3) % 3 - 1)), // -offset, 0, or +offset
    };
  };

  // Update region to focus on user but include nearby friends
  useEffect(() => {
    if (!userLocation || !mapRef.current) return;
    
    // Get all valid friend locations
    const friendLocations = Object.values(friendsDetails)
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
      latitudeDelta: Math.max(0.01, Math.min(0.1, latDelta)), // Keep within reasonable bounds
      longitudeDelta: Math.max(0.01, Math.min(0.1, lngDelta)), // Keep within reasonable bounds
    }, 1000);
  }, [userLocation, friendsDetails]);

  // friends location listener
  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh friends' locations periodically
      Object.keys(friendsDetails).forEach(async (uid) => {
        try {
          const friendDoc = await getUserDocument(uid);
          if (friendDoc && friendDoc.currentLocation) {
            setFriendsDetails(prev => ({
              ...prev,
              [uid]: {
                ...prev[uid],
                currentLocation: friendDoc.currentLocation
              }
            }));
          }
        } catch (error) {
          console.error(`Error updating location for ${uid}:`, error);
        }
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [friendsDetails]);

  // Initial region calculation - focus on user
  const initialRegion = useMemo(() => {
    if (!userLocation) return null;
    
    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.01, // Smaller delta for closer zoom
      longitudeDelta: 0.01, // Smaller delta for closer zoom
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
          showsMyLocationButton={false} // Disable default button
          showsCompass={true}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={false}
          toolbarEnabled={false}
          initialRegion={initialRegion}
          zoomEnabled={true}
        >
          {/* user marker - make it more prominent */}
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="My Location"
            anchor={{ x: 0.5, y: 1 }} 
            pinColor={Platform.OS === 'android' ? "#FF0000" : undefined} // Android-only
          >
            {Platform.OS === 'ios' && <UserMapMarker userImage={userImage} />}
          </Marker>

          {/* Friend Markers with offset to prevent overlapping */}
          {Object.entries(friendsDetails).map(([uid, friend], index) => {
            if (!friend.currentLocation) return null;
            
            const offsetCoords = getOffsetCoordinates(
              friend.currentLocation.latitude,
              friend.currentLocation.longitude,
              index
            );
            
            return (
              <Marker
                key={uid}
                coordinate={offsetCoords}
                title={friend.name}
              >
                <Image 
                  source={{ uri: friend.imageUrl }} 
                  style={styles.friendMarker}
                  onError={() => console.log("Error loading friend image")}
                />
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
  androidMarker: {
    width: 50,
    height: 50,
    backgroundColor: '#C80110',
    borderRadius: 25
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
  friendAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
});