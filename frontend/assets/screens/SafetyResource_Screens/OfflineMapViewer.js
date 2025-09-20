import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import MapView, { PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

const OfflineMapViewer = ({ map, onClose }) => {
  if (!map || !map.region) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Map data is not available.</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle" size={40} color="#333" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tileUrlTemplate = `file://${FileSystem.documentDirectory}offline_maps/${map.id}/{z}/{x}/{y}.png`;

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={map.region}
        minZoomLevel={map.minZoom || 14}
        maxZoomLevel={map.maxZoom || 17}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <UrlTile
          urlTemplate={tileUrlTemplate}
          zIndex={-1} // Render below other map elements
          shouldReplaceMapContent={true} // Hides the base Google Map tiles
          tileSize={256}
        />
      </MapView>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close-circle" size={40} color="#333" />
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.mapName}>{map.name}</Text>
        <Text style={styles.infoText}>
          You are viewing an offline map. Zoom is limited to a range from neighborhood to street level.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 2,
  },
  infoBox: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 15,
    maxWidth: '65%',
  },
  mapName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoText: {
    color: '#eee',
    fontSize: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
});

export default OfflineMapViewer;