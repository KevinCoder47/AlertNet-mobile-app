import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Switch,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Safety categories for filtering/display
const safetyCategories = [
  { name: 'Police Station', icon: '👮', filter: 'police' },
  { name: 'Hospital & Clinics', icon: '➕', filter: 'hospital' },
  { name: 'Public Safety Centers', icon: '🛡️', filter: 'safety' },
  { name: 'Fire Stations', icon: '🔥', filter: 'fire' },
];

const SafetyZones = ({ setIsSafetyZones, setIsSafetyResources }) => {
  // Core state for safety zones
  const [safetyZones, setSafetyZones] = useState([]);
  const [nearbyLocations, setNearbyLocations] = useState([]);
  
  // Modal and form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Home');
  const [zoneName, setZoneName] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Location state
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Load saved zones on component mount
  useEffect(() => {
    loadSavedZones();
    getLocationPermission();
  }, []);

  // Load safety zones from AsyncStorage
  const loadSavedZones = async () => {
    try {
      const savedZones = await AsyncStorage.getItem('safetyZones');
      if (savedZones) {
        setSafetyZones(JSON.parse(savedZones));
      }
    } catch (error) {
      console.error('Error loading saved zones:', error);
    }
  };

  // Save safety zones to AsyncStorage
  const saveSafetyZones = async (zones) => {
    try {
      await AsyncStorage.setItem('safetyZones', JSON.stringify(zones));
    } catch (error) {
      console.error('Error saving zones:', error);
    }
  };

  // Get current location on component mount
  const getLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === 'granted') {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        const locationData = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          address: "Current Location",
          accuracy: current.coords.accuracy
        };
        
        setCurrentLocation(locationData);
        
        // Load nearby safety locations when we have user's location
        loadNearbyLocations(current.coords.latitude, current.coords.longitude);
      } else {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  // Load real nearby safety locations using Overpass API
  const loadNearbyLocations = async (latitude, longitude) => {
    try {
      const radius = 5000; // 5km radius
      
      // Define safety-related amenities to search for
      const safetyQueries = [
        'amenity=police',
        'amenity=hospital',
        'amenity=clinic',
        'amenity=fire_station',
        'amenity=pharmacy',
        'emergency=phone',
        'amenity=embassy',
        'tourism=information',
        'shop=security'
      ];

      const allNearbyLocations = [];

      // Search for each type of safety location
      for (const query of safetyQueries) {
        try {
          const overpassQuery = `
            [out:json][timeout:25];
            (
              node["${query}"](around:${radius},${latitude},${longitude});
              way["${query}"](around:${radius},${latitude},${longitude});
              relation["${query}"](around:${radius},${latitude},${longitude});
            );
            out center meta;
          `;

          const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery
          });

          if (response.ok) {
            const data = await response.json();
            
            data.elements.forEach(element => {
              const elementLat = element.lat || element.center?.lat;
              const elementLon = element.lon || element.center?.lon;
              
              if (elementLat && elementLon) {
                const distance = calculateDistance(latitude, longitude, elementLat, elementLon);
                const locationData = {
                  id: `osm_${element.type}_${element.id}`,
                  name: element.tags?.name || getDefaultName(query, element.tags),
                  address: formatAddress(element.tags),
                  type: getSafetyType(query),
                  icon: getSafetyIcon(query),
                  latitude: elementLat,
                  longitude: elementLon,
                  distance: distance,
                  phone: element.tags?.phone || null,
                  website: element.tags?.website || null,
                  openingHours: element.tags?.opening_hours || null,
                  emergency: element.tags?.emergency === 'yes'
                };
                
                allNearbyLocations.push(locationData);
              }
            });
          }
        } catch (error) {
          console.log(`Failed to fetch ${query}:`, error);
        }
      }

      // Remove duplicates and sort by distance
      const uniqueLocations = allNearbyLocations.filter((location, index, self) => 
        index === self.findIndex(l => l.name === location.name && l.type === location.type)
      );

      // Sort by distance (convert to meters for comparison)
      const sortedLocations = uniqueLocations
        .sort((a, b) => {
          const distA = parseFloat(a.distance.replace(/[km]/g, '')) * (a.distance.includes('km') ? 1000 : 1);
          const distB = parseFloat(b.distance.replace(/[km]/g, '')) * (b.distance.includes('km') ? 1000 : 1);
          return distA - distB;
        })
        .slice(0, 15); // Limit to 15 closest locations

      setNearbyLocations(sortedLocations);

      // Fallback if no real data found
      if (sortedLocations.length === 0) {
        setNearbyLocations([
          {
            id: 'fallback_1',
            name: 'Johannesburg Central Police Station',
            address: '10 Commissioner St, Johannesburg Central, Johannesburg, 2001',
            type: 'Police Station',
            icon: '👮',
            latitude: -26.2089,
            longitude: 28.0406,
            distance: calculateDistance(latitude, longitude, -26.2089, 28.0406),
            emergency: true
          },
          {
            id: 'fallback_2',
            name: 'Charlotte Maxeke Academic Hospital',
            address: 'York Rd, Parktown, Johannesburg, 2193',
            type: 'Hospital',
            icon: '🏥',
            latitude: -26.1867,
            longitude: 28.0359,
            distance: calculateDistance(latitude, longitude, -26.1867, 28.0359),
            emergency: true
          }
        ]);
      }

    } catch (error) {
      console.error('Error loading nearby locations:', error);
      // Set fallback locations if everything fails
      setNearbyLocations([]);
    }
  };

  // Helper functions for processing location data
  const getDefaultName = (query, tags) => {
    const type = query.split('=')[1];
    switch (type) {
      case 'police': return tags?.operator || 'Police Station';
      case 'hospital': return tags?.operator || 'Hospital';
      case 'clinic': return tags?.operator || 'Medical Clinic';
      case 'fire_station': return tags?.operator || 'Fire Station';
      case 'pharmacy': return tags?.operator || 'Pharmacy';
      case 'phone': return 'Emergency Phone';
      case 'embassy': return tags?.country ? `${tags.country} Embassy` : 'Embassy';
      case 'information': return 'Tourist Information';
      case 'security': return 'Security Services';
      default: return 'Safety Location';
    }
  };

  const formatAddress = (tags) => {
    if (!tags) return 'Address not available';
    
    const parts = [];
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:suburb']) parts.push(tags['addr:suburb']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
    
    return parts.length > 0 ? parts.join(', ') : (tags.name || 'Address not available');
  };

  const getSafetyType = (query) => {
    const type = query.split('=')[1];
    switch (type) {
      case 'police': return 'Police Station';
      case 'hospital': return 'Hospital';
      case 'clinic': return 'Medical Clinic';
      case 'fire_station': return 'Fire Station';
      case 'pharmacy': return 'Pharmacy';
      case 'phone': return 'Emergency Phone';
      case 'embassy': return 'Embassy';
      case 'information': return 'Tourist Info';
      case 'security': return 'Security Services';
      default: return 'Safety Location';
    }
  };

  const getSafetyIcon = (query) => {
    const type = query.split('=')[1];
    switch (type) {
      case 'police': return '👮';
      case 'hospital': return '🏥';
      case 'clinic': return '⚕️';
      case 'fire_station': return '🚒';
      case 'pharmacy': return '💊';
      case 'phone': return '📞';
      case 'embassy': return '🏛️';
      case 'information': return 'ℹ️';
      case 'security': return '🔒';
      default: return '📍';
    }
  };

  // Real place search using OpenStreetMap Nominatim API (free alternative to Google Places)
  const searchRealPlaces = async (query) => {
    if (query.length < 3) {
      setSearchSuggestions([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // Use Nominatim (OpenStreetMap) API - free alternative to Google Places
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + ', South Africa'
        )}&limit=10&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Search API request failed');
      }
      
      const data = await response.json();
      
      // Transform Nominatim response to our format
      const suggestions = data.map((place, index) => ({
        id: `nominatim_${place.place_id}`,
        name: place.display_name.split(',')[0], // First part is usually the name
        address: place.display_name,
        type: getPlaceType(place.type, place.class),
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        placeId: place.place_id
      }));
      
      setSearchSuggestions(suggestions);
    } catch (error) {
      console.error('Error searching places:', error);
      
      // Fallback to mock data if API fails
      const fallbackSuggestions = [
        {
          id: `fallback_${Date.now()}`,
          name: `${query} (Search offline)`,
          address: `${query}, Johannesburg, South Africa`,
          type: 'Location',
          latitude: currentLocation ? currentLocation.latitude + (Math.random() - 0.5) * 0.01 : -26.2041,
          longitude: currentLocation ? currentLocation.longitude + (Math.random() - 0.5) * 0.01 : 28.0473,
        }
      ];
      
      setSearchSuggestions(fallbackSuggestions);
    } finally {
      setIsSearching(false);
    }
  };

  // Helper function to determine place type from Nominatim data
  const getPlaceType = (type, category) => {
    if (category === 'amenity') {
      if (type === 'hospital' || type === 'clinic') return 'Hospital';
      if (type === 'police') return 'Police Station';
      if (type === 'fire_station') return 'Fire Station';
      if (type === 'school' || type === 'university') return 'Educational Institution';
    }
    if (category === 'shop') return 'Shop';
    if (category === 'tourism') return 'Tourist Attraction';
    if (type === 'city' || type === 'town') return 'City';
    if (type === 'suburb') return 'Suburb';
    if (type === 'road' || type === 'street') return 'Street';
    
    return 'Location';
  };

  // Add a new safety zone with persistence
  const addSafetyZone = async (zoneData) => {
    const newZone = {
      id: `zone_${Date.now()}`,
      type: zoneData.category === 'Custom Label' ? zoneData.zoneName : zoneData.category,
      address: zoneData.location?.address || zoneData.searchText,
      icon: getCategoryIcon(zoneData.category),
      latitude: zoneData.location?.latitude,
      longitude: zoneData.location?.longitude,
      notificationsEnabled: zoneData.notificationEnabled,
      dateAdded: new Date().toISOString(),
      category: zoneData.category,
    };
    
    const updatedZones = [...safetyZones, newZone];
    setSafetyZones(updatedZones);
    
    // Save to AsyncStorage
    await saveSafetyZones(updatedZones);
    
    // Show success message
    Alert.alert(
      'Success',
      `${newZone.type} safety zone added successfully!`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  // Get icon for category
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Home': return '🏠';
      case 'Work': return '💼';
      case 'Friend\'s Place': return '👥';
      case 'Custom Label': return '📍';
      default: return '📍';
    }
  };

  // Remove a safety zone with persistence
  const removeSafetyZone = async (zoneId) => {
    Alert.alert(
      'Remove Safety Zone',
      'Are you sure you want to remove this safety zone?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedZones = safetyZones.filter(zone => zone.id !== zoneId);
            setSafetyZones(updatedZones);
            await saveSafetyZones(updatedZones);
          }
        }
      ]
    );
  };

  const handleBackPress = () => {
    setIsSafetyZones(false);
    if (setIsSafetyResources) {
      setIsSafetyResources(true);
    }
  };

  const handleAddPress = () => {
    setShowAddModal(true);
  };

  const handleSearchChange = (text) => {
    setSearchText(text);
    searchRealPlaces(text);
  };

  const selectLocation = (location) => {
    setSelectedLocation(location);
    setSearchText(location.name);
    setSearchSuggestions([]);
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      const currentLocationData = {
        id: 'current',
        name: 'Current Location',
        address: currentLocation.address,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        type: 'Current Location'
      };
      
      setSelectedLocation(currentLocationData);
      setSearchText('Current Location');
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setSearchSuggestions([]);
    setSelectedLocation(null);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setSearchText('');
    setSelectedCategory('Home');
    setZoneName('');
    setNotificationEnabled(false);
    setSearchSuggestions([]);
    setSelectedLocation(null);
  };

  const handleDone = () => {
    // Validation
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location for your safety zone.');
      return;
    }
    
    if (selectedCategory === 'Custom Label' && !zoneName.trim()) {
      Alert.alert('Error', 'Please enter a name for your custom safety zone.');
      return;
    }

    // Create zone data
    const zoneData = {
      category: selectedCategory,
      zoneName: zoneName.trim(),
      searchText,
      notificationEnabled,
      location: selectedLocation
    };
    
    // Add the zone
    addSafetyZone(zoneData);
    
    // Close modal
    handleModalClose();
  };

  const categoryOptions = [
    { label: 'Home', icon: '🏠' },
    { label: 'Work', icon: '💼' },
    { label: 'Friend\'s Place', icon: '👥' },
    { label: 'Custom Label', icon: '📍' },
  ];

  const renderCategoryOption = (option) => (
    <TouchableOpacity
      key={option.label}
      style={styles.categoryOption}
      onPress={() => setSelectedCategory(option.label)}
    >
      <View style={styles.categoryOptionContent}>
        <Text style={styles.categoryOptionText}>{option.label}</Text>
        <View style={styles.radioButton}>
          {selectedCategory === option.label && <View style={styles.radioButtonSelected} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateIcon}>📍</Text>
      <Text style={styles.emptyStateTitle}>No Safety Zones Yet</Text>
      <Text style={styles.emptyStateText}>
        Add your first safety zone by tapping the "add" button below. 
        You can save important locations like your home, work, or frequently visited places.
      </Text>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Safety Zone</Text>
          <Text style={styles.subtitle}>
            {safetyZones.length} saved location{safetyZones.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Safety Categories for filtering */}
          <View style={styles.iconCategoryRow}>
            {safetyCategories.map((category) => (
              <TouchableOpacity 
                key={category.name} 
                style={styles.iconContainer}
                onPress={() => {
                  // You can implement filtering logic here
                  console.log('Filter by:', category.filter);
                }}
              >
                <View style={styles.iconCircle}>
                  <Text style={styles.icon}>{category.icon}</Text>
                </View>
                <Text style={styles.iconLabel} numberOfLines={2}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* User's Safety Zones */}
          {safetyZones.length === 0 ? (
            renderEmptyState()
          ) : (
            safetyZones.map((zone) => (
              <TouchableOpacity 
                key={zone.id} 
                style={styles.locationItem}
                onLongPress={() => removeSafetyZone(zone.id)}
              >
                <View style={styles.locationIconContainer}>
                  <Text style={styles.locationIcon}>{zone.icon}</Text>
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationType}>{zone.type}</Text>
                  <Text style={styles.locationAddress}>{zone.address}</Text>
                  {zone.notificationsEnabled && (
                    <Text style={styles.notificationIndicator}>🔔 Notifications ON</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* Nearby Locations */}
          {nearbyLocations.length > 0 && (
            <>
              <View style={styles.nearbyHeader}>
                <Text style={styles.nearbyTitle}>Nearby Safety Locations</Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={() => {
                    if (currentLocation) {
                      loadNearbyLocations(currentLocation.latitude, currentLocation.longitude);
                    }
                  }}
                >
                  <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
                </TouchableOpacity>
              </View>
              
              {nearbyLocations.map((location) => (
                <TouchableOpacity 
                  key={location.id} 
                  style={[
                    styles.locationItem,
                    location.emergency && styles.emergencyLocationItem
                  ]}
                  onPress={() => {
                    // You can add functionality to view details or navigate
                    Alert.alert(
                      location.name,
                      `${location.address}\n\n` +
                      `Type: ${location.type}\n` +
                      `Distance: ${location.distance}` +
                      (location.phone ? `\nPhone: ${location.phone}` : '') +
                      (location.openingHours ? `\nHours: ${location.openingHours}` : '') +
                      (location.website ? `\nWebsite: ${location.website}` : ''),
                      [
                        { text: 'Close', style: 'cancel' },
                        ...(location.phone ? [{
                          text: 'Call',
                          onPress: () => {
                            const phoneNumber = location.phone.replace(/\s/g, '');
                            Linking.openURL(`tel:${phoneNumber}`);
                          }
                        }] : [])
                      ]
                    );
                  }}
                >
                  <View style={[
                    styles.locationIconContainer,
                    location.emergency && styles.emergencyIconContainer
                  ]}>
                    <Text style={styles.locationIcon}>{location.icon}</Text>
                    {location.emergency && (
                      <View style={styles.emergencyBadge}>
                        <Text style={styles.emergencyBadgeText}>!</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.locationTextContainer}>
                    <Text style={styles.locationType}>{location.name}</Text>
                    <Text style={styles.locationSubType}>{location.type}</Text>
                    <Text style={styles.locationAddress} numberOfLines={2}>
                      {location.address}
                    </Text>
                    <View style={styles.locationMeta}>
                      <Text style={styles.distanceText}>{location.distance} away</Text>
                      {location.phone && (
                        <Text style={styles.phoneText}>📞 Available</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
          
          {/* Add Button */}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddPress}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+ add safety zone</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Add Location Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent={false}
        >
          <View style={styles.modalContainer}>
            {/* Enhanced Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <TouchableOpacity onPress={handleModalClose} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Add Safety Zone</Text>
                <View style={styles.headerSpacer} />
              </View>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modalContent}>
                {/* Search Input with Suggestions */}
                <View style={styles.searchSection}>
                  <View style={styles.searchContainer}>
                    <View style={styles.searchIconContainer}>
                      <Text style={styles.searchIcon}>🔍</Text>
                    </View>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search for a place worldwide..."
                      placeholderTextColor="#888"
                      value={searchText}
                      onChangeText={handleSearchChange}
                    />
                    {searchText.length > 0 && (
                      <TouchableOpacity 
                        style={styles.clearButton}
                        onPress={clearSearch}
                      >
                        <Text style={styles.clearButtonText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Loading indicator */}
                  {isSearching && (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>Searching places...</Text>
                    </View>
                  )}

                  {/* Search Suggestions */}
                  {searchSuggestions.length > 0 && !isSearching && (
                    <View style={styles.suggestionsContainer}>
                      {searchSuggestions.map((suggestion) => (
                        <TouchableOpacity
                          key={suggestion.id}
                          style={styles.suggestionItem}
                          onPress={() => selectLocation(suggestion)}
                        >
                          <View style={styles.suggestionIcon}>
                            <Text style={styles.suggestionIconText}>
                              {suggestion.type === 'Police Station' ? '👮' :
                               suggestion.type === 'Hospital' ? '🏥' :
                               suggestion.type === 'Shop' ? '🛍️' :
                               suggestion.type === 'Educational Institution' ? '🎓' :
                               suggestion.type === 'Fire Station' ? '🚒' :
                               suggestion.type === 'City' ? '🏙️' :
                               suggestion.type === 'Street' ? '🛣️' : '📍'}
                            </Text>
                          </View>
                          <View style={styles.suggestionText}>
                            <Text style={styles.suggestionName}>{suggestion.name}</Text>
                            <Text style={styles.suggestionAddress} numberOfLines={2}>{suggestion.address}</Text>
                            <Text style={styles.suggestionType}>{suggestion.type}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Location Preview */}
                <View style={styles.mapPreview}>
                  <View style={styles.mapContainer}>
                    <View style={styles.fallbackMap}>
                      <Text style={styles.mapPlaceholderText}>📍 Location Preview</Text>
                      <Text style={styles.mapSubtext}>Selected location details</Text>
                      {selectedLocation ? (
                        <View style={styles.fallbackLocationInfo}>
                          <Text style={styles.fallbackLocationName}>{selectedLocation.name}</Text>
                          <Text style={styles.fallbackLocationAddress} numberOfLines={3}>
                            {selectedLocation.address}
                          </Text>
                          <Text style={styles.coordinatesText}>
                            📍 {selectedLocation.latitude?.toFixed(4)}, {selectedLocation.longitude?.toFixed(4)}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.noLocationText}>Search and select a location above</Text>
                      )}
                    </View>

                    {/* Map Controls */}
                    <View style={styles.mapControls}>
                      <TouchableOpacity 
                        style={[styles.mapControlButton, styles.currentLocationButton]}
                        onPress={useCurrentLocation}
                        disabled={!currentLocation}
                      >
                        <Text style={styles.controlButtonIcon}>📍</Text>
                        <Text style={styles.controlButtonText}>
                          {currentLocation ? 'My Location' : 'Getting...'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Category Selection */}
                <View style={styles.categorySection}>
                  <Text style={styles.sectionTitle}>Choose Category</Text>
                  <View style={styles.categoryContainer}>
                    {categoryOptions.map(renderCategoryOption)}
                  </View>
                </View>

                {/* Custom Label Input */}
                {selectedCategory === 'Custom Label' && (
                  <View style={styles.customLabelSection}>
                    <Text style={styles.inputLabel}>Zone Name</Text>
                    <View style={styles.customLabelContainer}>
                      <TextInput
                        style={styles.customLabelInput}
                        placeholder="Enter zone name"
                        placeholderTextColor="#888"
                        value={zoneName}
                        onChangeText={setZoneName}
                      />
                    </View>
                  </View>
                )}

                {/* Notification Toggle */}
                <View style={styles.notificationSection}>
                  <View style={styles.notificationContainer}>
                    <View style={styles.notificationTextContainer}>
                      <Text style={styles.notificationTitle}>Location Alerts</Text>
                      <Text style={styles.notificationSubtext}>
                        Get notified when you're close to this location
                      </Text>
                    </View>
                    <Switch
                      value={notificationEnabled}
                      onValueChange={setNotificationEnabled}
                      trackColor={{ false: '#3A3A3C', true: '#FF6347' }}
                      thumbColor={notificationEnabled ? '#fff' : '#f4f3f4'}
                      ios_backgroundColor="#3A3A3C"
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Done Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.doneButton, 
                  (!selectedLocation || (selectedCategory === 'Custom Label' && !zoneName.trim())) && styles.doneButtonDisabled
                ]} 
                onPress={handleDone} 
                activeOpacity={0.8}
                disabled={!selectedLocation || (selectedCategory === 'Custom Label' && !zoneName.trim())}
              >
                <Text style={styles.doneButtonText}>Save Safety Zone</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Constants.statusBarHeight,
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    paddingVertical: 5,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6347',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  iconCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    paddingVertical: 10,
  },
  iconContainer: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#FF6347',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    fontSize: 30,
  },
  iconLabel: {
    color: '#000000',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 75,
    fontWeight: '500',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  locationIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FF6347',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#FF6347',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  locationIcon: {
    fontSize: 22,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationType: {
    color: '#000000',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  locationAddress: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 18,
  },
  notificationIndicator: {
    color: '#FF6347',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  distanceText: {
    color: '#FF6347',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  nearbyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 18,
  },
  nearbyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  refreshButton: {
    backgroundColor: '#FF6347',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emergencyLocationItem: {
    borderColor: '#FF6347',
    borderWidth: 2,
    backgroundColor: '#FFF5F5',
  },
  emergencyIconContainer: {
    backgroundColor: '#DC2626',
    position: 'relative',
  },
  emergencyBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FBBF24',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  emergencyBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  locationSubType: {
    color: '#FF6347',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 3,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  phoneText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 10,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  addButton: {
    backgroundColor: '#FF6347',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignSelf: 'center',
    marginTop: 25,
    marginBottom: 20,
    minWidth: 160,
    shadowColor: '#FF6347',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cancelText: {
    color: '#FF6347',
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 60,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  searchIconContainer: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  searchIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 16,
    paddingRight: 8,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  clearButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  suggestionsContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    maxHeight: 280,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6347',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionIconText: {
    fontSize: 18,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  suggestionAddress: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 16,
    marginBottom: 3,
  },
  suggestionType: {
    color: '#FF6347',
    fontSize: 11,
    fontWeight: '500',
  },
  mapPreview: {
    backgroundColor: '#1C1C1E',
    height: 200,
    borderRadius: 16,
    marginBottom: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  fallbackMap: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mapPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  mapSubtext: {
    color: '#8E8E93',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 15,
  },
  fallbackLocationInfo: {
    backgroundColor: 'rgba(255, 99, 71, 0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 99, 71, 0.3)',
  },
  fallbackLocationName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  fallbackLocationAddress: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  coordinatesText: {
    color: '#FF6347',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  noLocationText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mapControls: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  mapControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  currentLocationButton: {
    backgroundColor: '#FF6347',
  },
  controlButtonIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  categoryOption: {
    marginBottom: 2,
  },
  categoryOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  categoryOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6347',
  },
  customLabelSection: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  customLabelContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  customLabelInput: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  notificationSection: {
    marginBottom: 24,
  },
  notificationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  notificationTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  notificationTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationSubtext: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: '#000000',
  },
  doneButton: {
    backgroundColor: '#FF6347',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#FF6347',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  doneButtonDisabled: {
    backgroundColor: '#444',
    shadowOpacity: 0,
    elevation: 0,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default SafetyZones;