import { StyleSheet, Text, View } from 'react-native'
import React, {useState, useEffect} from 'react'
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../contexts/ColorContext'

const MapWithDetails = ({ isTapWhere, userLocation, setUserLocation }) => {
    const { colors, isDark } = useTheme();
    
    
      // Map styles
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
    


  return (
            <View style={styles.fullMapContainer}>
          <MapView
            style={styles.fullMap}
            provider={PROVIDER_GOOGLE}
            customMapStyle={isDark ? MAP_STYLES.dark : MAP_STYLES.light}
            initialRegion={{
              latitude: userLocation?.latitude || -26.2041,
              longitude: userLocation?.longitude || 28.0473,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsBuildings={false}
            showsTraffic={false}
            showsIndoors={false}
            toolbarEnabled={false}
          />
        </View>
  )
}

export default MapWithDetails

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
})