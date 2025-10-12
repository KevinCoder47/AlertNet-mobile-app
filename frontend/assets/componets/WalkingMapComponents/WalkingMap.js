import React, { useRef } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../../contexts/ColorContext';

const MAP_STYLES = {
  light: [
    // Base map - ultra light for clarity
    { "elementType": "geometry", "stylers": [{ "color": "#f8f8f8" }] },
    
    // Hide all labels initially
    { "elementType": "labels", "stylers": [{ "visibility": "off" }] },
    
    // Show only current street names
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
    
    // Hide all POI except parks
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [{ "visibility": "on" }, { "color": "#d4e7d7" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [{ "visibility": "simplified" }, { "color": "#5a8a5a" }]
    },
    
    // Water bodies
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#c9dff5" }]
    },
    
    // Road network - high contrast for walking
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
    {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#f5f5f5" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#c0c0c0" }, { "weight": 1 }]
    },
    
    // Pedestrian-friendly features
    {
      "featureType": "landscape.man_made",
      "elementType": "geometry",
      "stylers": [{ "color": "#f0f0f0" }]
    },
    
    // Buildings - subtle for 3D depth
    {
      "featureType": "landscape.man_made",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#ebebeb" }]
    },
    
    // Hide transit completely
    { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
    { "featureType": "transit.station", "stylers": [{ "visibility": "off" }] },
    
    // Hide business POI
    { "featureType": "poi.business", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    
    // Administrative boundaries - minimal
    {
      "featureType": "administrative",
      "elementType": "geometry.stroke",
      "stylers": [{ "visibility": "off" }]
    }
  ],
  
  dark: [
    // Dark base for night navigation
    { "elementType": "geometry", "stylers": [{ "color": "#151515" }] },
    
    // Hide most labels
    { "elementType": "labels", "stylers": [{ "visibility": "off" }] },
    
    // Show street names with good contrast
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
    
    // Hide POI except parks
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [{ "visibility": "on" }, { "color": "#1a2e1a" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [{ "visibility": "simplified" }, { "color": "#6b9a76" }]
    },
    
    // Dark water
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#0d1419" }]
    },
    
    // Road network - clear hierarchy
    {
      "featureType": "road.local",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#2a2a2a" }]
    },
    {
      "featureType": "road.local",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#3a3a3a" }, { "weight": 1 }]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#323232" }]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#424242" }, { "weight": 1.2 }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#2d2d2d" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#3d3d3d" }, { "weight": 1 }]
    },
    
    // Buildings - darker for depth
    {
      "featureType": "landscape.man_made",
      "elementType": "geometry",
      "stylers": [{ "color": "#1a1a1a" }]
    },
    
    // Hide transit
    { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
    { "featureType": "transit.station", "stylers": [{ "visibility": "off" }] },
    
    // Hide business POI
    { "featureType": "poi.business", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    
    // Hide administrative boundaries
    {
      "featureType": "administrative",
      "elementType": "geometry.stroke",
      "stylers": [{ "visibility": "off" }]
    }
  ]
};

const WalkingMap = () => {
  const mapRef = useRef(null);
  const { isDark } = useTheme();
  
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: -26.2041,
          longitude: 28.0473,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
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
          center: {
            latitude: -26.2041,
            longitude: 28.0473,
          },
          pitch: 60,
          heading: 0,
          altitude: 500,
          zoom: 17.5,
        }}
        mapPadding={{
          top: 200,
          right: 0,
         
          left: 0,
        }}
      />
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
});