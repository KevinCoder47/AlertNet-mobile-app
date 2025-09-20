// components/LocationSelector.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const LocationSelector = ({ 
  location, 
  coordinates, 
  onLocationSet, 
  loadingLocation, 
  setLoadingLocation 
}) => {
  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        setLoadingLocation(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      let address = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      let locationString = 'Current Location';
      if (address && address.length > 0) {
        const addr = address[0];
        locationString = `${addr.street || ''} ${addr.name || ''}, ${addr.city || addr.district || ''}, ${addr.region || ''}`
          .replace(/^,\s*|,\s*$/g, '')
          .replace(/,+/g, ',')
          .trim() || 'Current Location';
      }

      onLocationSet(coords, locationString);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get current location. Please enter manually.');
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="location" size={20} color="#333" />
        <Text style={styles.sectionTitle}>Set Location</Text>
      </View>
      <View style={styles.locationContainer}>
        <TouchableOpacity 
          style={styles.currentLocationButton}
          onPress={getCurrentLocation}
          disabled={loadingLocation}
        >
          <View style={styles.mapPreview}>
            {loadingLocation ? (
              <Ionicons name="refresh" size={20} color="#666" />
            ) : (
              <Ionicons name="location" size={20} color="#666" />
            )}
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.currentLocationText}>
              {loadingLocation ? 'Getting Location...' : coordinates ? 'Location Set' : 'Set Current Location'}
            </Text>
            {coordinates && (
              <Text style={styles.locationPreview}>
                {location || 'Current Location'}
              </Text>
            )}
          </View>
          {coordinates && (
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  locationContainer: {
    gap: 12,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  mapPreview: {
    width: 40,
    height: 40,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  locationPreview: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default LocationSelector;