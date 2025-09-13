import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Dimensions,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ColorContext';
import { GOOGLE_MAPS_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveUserAddress,updateUserAddress } from '../../services/firestore';

const { width, height } = Dimensions.get('window');

const AddNewAddress = ({ visible, onClose, onSaveAddress, initialLocationName, editingAddress }) => {
  const [formData, setFormData] = useState({ 
    locationName: '', 
    address: ''
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  
  const { colors, isDark } = useTheme();
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    // Get userId from AsyncStorage when component mounts
    const getUserId = async () => {
      try {
        const userDataJSON = await AsyncStorage.getItem('userData');
        if (userDataJSON) {
          const userData = JSON.parse(userDataJSON);
          setUserId(userData.userId);
        }
      } catch (error) {
        console.error('Error getting userId from AsyncStorage:', error);
      }
    };
    
    getUserId();
  }, []);

  useEffect(() => {
    if (visible) {
      if (editingAddress) {
        setFormData({
          locationName: editingAddress.locationName,
          address: editingAddress.address
        });
      } else if (initialLocationName) {
        setFormData({ locationName: initialLocationName, address: '' });
      } else {
        setFormData({ locationName: '', address: '' });
      }
      
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Reset form when closing
      setFormData({ 
        locationName: '', 
        address: ''
      });
      setSuggestions([]);
      setError('');
    }
  }, [visible, editingAddress, initialLocationName]);

  const searchPlaces = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}&components=country:za&language=en`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      const data = await response.json();
      if (data.predictions) {
        setSuggestions(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
    
    // If changing address field, search for places
    if (field === 'address') {
      searchPlaces(value);
    }
  };

  const handlePlaceSelect = (place) => {
    const selectedDescription = place.description;
    setFormData(prev => ({ ...prev, address: selectedDescription }));
    setSuggestions([]);
    Keyboard.dismiss();
  };

const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Update handleSave function
const handleSave = async () => {
  if (!formData.locationName.trim() || !formData.address.trim()) {
    setError('Please fill in all required fields');
    return;
  }

  setIsSaving(true);
  
  try {
    // Convert address to coordinates
    const coordinates = await geocodeAddress(formData.address);
    
    if (!coordinates) {
      setError('Could not find this address. Please try again.');
      setIsSaving(false);
      return;
    }

    // Prepare address data
    const addressData = {
      locationType: formData.locationName,
      address: formData.address,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      timestamp: new Date().toISOString()
    };

    // Save to Firebase
    if (userId) {
      await saveUserAddress(userId, addressData);
      
      // Also save to local storage for offline use
      const existingAddressesJSON = await AsyncStorage.getItem('@saved_addresses');
      const existingAddresses = existingAddressesJSON ? JSON.parse(existingAddressesJSON) : [];
      
      const newAddress = {
        id: Date.now().toString(),
        ...addressData
      };
      
      const updatedAddresses = [...existingAddresses, newAddress];
      await AsyncStorage.setItem('@saved_addresses', JSON.stringify(updatedAddresses));
      
      if (onSaveAddress) {
        onSaveAddress(updatedAddresses);
      }
    }
    
    onClose();
  } catch (error) {
    console.error('Error saving address:', error);
    setError('Failed to save address');
  } finally {
    setIsSaving(false);
  }
};

  const handleClose = () => {
    onClose();
  };

  if (!visible) return null;

  const styles = getStyles(isDark, colors);
  const title = editingAddress ? 'Edit Address' : 'Add New Address';

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View 
          style={[
            styles.overlay, 
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity 
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color={isDark ? '#ccc' : '#555'} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoiding}
          >
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Location Name */}
              <Text style={styles.label}>Location Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Home, Work, etc."
                placeholderTextColor={isDark ? '#aaa' : '#666'}
                value={formData.locationName}
                onChangeText={(text) => handleInputChange('locationName', text)}
                autoFocus={!initialLocationName && !editingAddress}
                returnKeyType="next"
              />
              
              {/* Address with Google Maps search */}
              <Text style={styles.label}>Address *</Text>
              <View style={styles.addressInputContainer}>
                <TextInput
                  style={[styles.input, styles.addressInput]}
                  placeholder="Search for an address"
                  placeholderTextColor={isDark ? '#aaa' : '#666'}
                  value={formData.address}
                  onChangeText={(text) => handleInputChange('address', text)}
                  returnKeyType="done"
                />
                {loading && (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="time-outline" size={16} color={isDark ? '#ccc' : '#666'} />
                  </View>
                )}
              </View>

              {/* Suggestions List */}
              {suggestions.length > 0 && (
                <View style={[styles.suggestionsContainer, { 
                  backgroundColor: isDark ? '#222' : '#fff',
                  borderColor: isDark ? '#333' : '#ddd'
                }]}>
                  <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.place_id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.suggestionItem, { 
                          borderBottomColor: isDark ? '#333' : '#eee'
                        }]}
                        onPress={() => handlePlaceSelect(item)}
                      >
                        <Ionicons 
                          name="location-outline" 
                          size={16}
                          color={isDark ? "#D6D6D6" : "#606061"} 
                          style={{ marginRight: 10 }}
                        />
                        <Text 
                          style={[styles.suggestionText, { color: isDark ? 'white' : 'black' }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.description}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </ScrollView>

            {error ? (
              <Text style={styles.errorText} numberOfLines={2}>
                {error}
              </Text>
            ) : null}

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                isSaving && styles.disabledButton
              ]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >

              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Address'}
              </Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const getStyles = (isDark, colors) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  overlay: {
    backgroundColor: isDark ? '#121212' : 'white',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: width * 0.05,
    height: height * 0.7,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 15,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: isDark ? 'white' : 'black',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#ccc' : '#555',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    marginBottom: 15,
    color: isDark ? 'white' : 'black',
    backgroundColor: isDark ? '#222' : '#fff',
    minHeight: 48,
  },
  addressInputContainer: {
    position: 'relative',
  },
  addressInput: {
    paddingRight: 40,
  },
  loadingContainer: {
    position: 'absolute',
    right: 15,
    top: 16,
  },
  suggestionsContainer: {
    maxHeight: 200,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
  },
  errorText: { 
    color: '#ff4d4f', 
    marginBottom: 15,
    fontSize: 14,
    textAlign: 'center',
  },
  saveButton: { 
    flexDirection: 'row', 
    backgroundColor: '#4BB543', 
    paddingVertical: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center',
    minHeight: 50,
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  saveButtonText: { 
    color: 'white', 
    fontWeight: '600', 
    fontSize: 16,
  },
});

export default AddNewAddress;