import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Image, Animated, Easing } from 'react-native'
import React, { useRef, useEffect, useState } from 'react'
import { useTheme } from '../contexts/ColorContext'
import WalkPartnerSearchBar from '../componets/WalkPartnerSearchBar'
import SavedLocation from '../componets/SavedLocation'
import TimeSlots from './TimeSlots'
import AddScheduledWalk from '../componets/AddScheduledWalk'; 
import * as Location from 'expo-location';
import MapWithDetails from './MapWithDetails'
import axios from 'axios';
import Constants from 'expo-constants';
import WalkStartPoint from '../componets/WalkStartPoint'
import PartnerSearch from '../componets/Loaders/PartnerSearch'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AddNewAddress from '../componets/AddNewAddress'
import AsyncStorage from '@react-native-async-storage/async-storage';
import GeneralLoader from '../componets/Loaders/GeneralLoarder'

const { width, height } = Dimensions.get('window')

const WalkPartner = ({ setIsWalkPartner, userImage }) => {
  const { colors, isDark } = useTheme();
  const [isAddScheduledWalkVisible, setIsAddScheduledWalkVisible] = useState(false);
  const [isTapWhere, setISTapWhere] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const apiKey = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;
  const [isDestinationDone, setIsDestinationDone] = useState(false)
  const [isStartPointDone, setIsStartPointDone] = useState(false)
  const [isStartPoint, setIsStartPoint] = useState(false);
  const [isSearchPartner, setIsSearchPartner] = useState(false);
  const [isAddNewAddressVisible, setIsAddNewAddressVisible] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [editingLocationType, setEditingLocationType] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [startPointCoords, setStartPointCoords] = useState({ latitude: -26.1872365, longitude: 28.0124719 });
  
    // Function to handle destination selection with coordinates
const handleDestinationSelect = (coordinates) => {
  console.log('Destination coordinates received:', coordinates);
  setDestinationCoords(coordinates);
};
  
  const handleStartPointSelect = (coords) => {
  setStartPointCoords(coords);
};

  // Animation values
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1.02)).current;
  
  // Load saved addresses on component mount
  useEffect(() => {
    loadSavedAddresses();
  }, []);

  const loadSavedAddresses = async () => {
    try {
      const addressesJSON = await AsyncStorage.getItem('@saved_addresses');
      if (addressesJSON) {
        const addresses = JSON.parse(addressesJSON);
        setSavedAddresses(addresses);
      }
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  const handleSaveAddress = (updatedAddresses) => {
    setSavedAddressearchbases(updatedAddresses);
  };

  const handleAddAddressPress = (locationType) => {
    setEditingAddress(null);
    setEditingLocationType(locationType);
    setIsAddNewAddressVisible(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setEditingLocationType(null);
    setIsAddNewAddressVisible(true);
  };

  // Check if a specific location type exists in saved addresses using fuzzy matching
  const hasLocationType = (type) => {
    const typeLower = type.toLowerCase();
    
    return savedAddresses.some(address => {
      const addressType = address.locationType.toLowerCase();
      
      // For Home type
      if (typeLower === 'home') {
        return addressType.includes('home') || 
               addressType.includes('house') || 
               addressType.includes('residence') || 
               addressType.includes('res') ||
               addressType.includes('apartment') ||
               addressType.includes('flat');
      }
      
      // For School type
      if (typeLower === 'school') {
        return addressType.includes('school') || 
               addressType.includes('campus') || 
               addressType.includes('college') || 
               addressType.includes('university') ||
               addressType.includes('uj');
      }
      
      // For other types, use exact match
      return addressType === typeLower;
    });
  };

  // Get addresses of a specific type using fuzzy matching
  const getAddressesByType = (type) => {
    const typeLower = type.toLowerCase();
    
    return savedAddresses.filter(address => {
      const addressType = address.locationType.toLowerCase();
      
      // For Home type
      if (typeLower === 'home') {
        return addressType.includes('home') || 
               addressType.includes('house') || 
               addressType.includes('residence') || 
               addressType.includes('res') ||
               addressType.includes('apartment') ||
               addressType.includes('flat');
      }
      
      // For School type
      if (typeLower === 'school') {
        return addressType.includes('school') || 
               addressType.includes('campus') || 
               addressType.includes('college') || 
               addressType.includes('university') ||
               addressType.includes('uj');
      }
      
      // For other types, use exact match
      return addressType === typeLower;
    });
  };

  // Handle going back to home screen with animation
  const goBackHome = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      })
    ]).start(() => {
      setIsWalkPartner(false);
    });
  }
  
  // Entry animation when component mounts 
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 280, 
        delay: 30,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 280,
        delay: 30,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      })
    ]).start();
  }, []);

  // Reverse geocoding function
const reverseGeocode = async (coords) => {
  try {
    const addressList = await Location.reverseGeocodeAsync(coords);
    if (addressList.length > 0) {
      // Format the address based on the available fields
      const address = addressList[0];
      // Construct a formatted address string from the components
      const formattedAddress = [
        address.street,
        address.city,
        address.region,
        address.postalCode,
        address.country
      ].filter(part => part != null).join(', ');
      return formattedAddress || "Unknown location";
    }
  } catch (error) {
    console.error('Expo reverse geocode failed:', error);
    // Consider a fallback to Google's API here if needed
  }
  return "Unknown location";
};

  // Get user location for map center
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const coords = location.coords;
        setUserLocation(coords);
        
        const address = await reverseGeocode(coords);
        setLocationName(address);
      }
    })();
  }, []);

  // Handle location selection from map
  const handleLocationSelect = async (selectedCoords) => {
    setUserLocation(selectedCoords);
    const address = await reverseGeocode(selectedCoords);
    setLocationName(address);
  };

  return (
    <View style={{ flex: 1 }}>
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
            backgroundColor: colors.background
          }
        ]}
      >
        {/* Title and back button - shown only when not in map mode */}
        {!isTapWhere && (
          <View style={styles.titleBack}>
            <Text style={[{ color: colors.text, fontSize: 25 }, styles.textBold]}>Plan your walk</Text>
            
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={goBackHome}
              activeOpacity={0.8}
            >
              <Image 
                source={require('../icons/back-light.png')} 
                style={[styles.backIcon, { tintColor: colors.text }]} 
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Search bar */}
        {!isDestinationDone && (
          <View style={{ 
            marginTop: isTapWhere ? height * 0.13 : 20,
            zIndex: 100,
            position: isTapWhere ? 'absolute' : 'relative',
            top: isTapWhere ? 0 : undefined,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
          }}>
        <WalkPartnerSearchBar 
          isTapWhere={isTapWhere} 
          setISTapWhere={setISTapWhere}
          locationName={locationName}
          setIsDestinationDone={setIsDestinationDone}
          setIsStartPointDone={setIsStartPointDone}
          setIsStartPoint={setIsStartPoint}
          onBackPress={isTapWhere ? () => setISTapWhere(false) : undefined}
          dropoffLocation={dropoffLocation}
          setDropoffLocation={setDropoffLocation}
          onDestinationSelect={handleDestinationSelect}
        />
          </View>
        )}

        {/* Map view when isTapWhere is true */}
        {isTapWhere && (
          <MapWithDetails 
            isTapWhere={isTapWhere} 
            userLocation={userLocation} 
            setUserLocation={setUserLocation} 
            destination={destinationCoords}
            startPoint={startPointCoords}
            userImage={userImage}
            isSearching={isSearchPartner}
          />
        )}

        {(isDestinationDone && isStartPoint) && (
          <View style={styles.floatingView}>
            <WalkStartPoint 
              setIsDestinationDone={setIsDestinationDone} 
              setIsSearchPartner={setIsSearchPartner} 
              setIsStartPoint={setIsStartPoint}
              onStartPointSelect={handleStartPointSelect} 
              dropoffLocation = {dropoffLocation}
            />
          </View>
        )}

        {isSearchPartner && (
          <View style={styles.floatingView}>
            <PartnerSearch />
          </View>
        )}

        {/* Main content - shown only when not in map mode */}
        {!isTapWhere && (
          <>
            {/* Saved location shortcuts */}
            <View style = {{marginLeft: width * 0.05, marginTop: height * 0.02, gap: 20}}>
              {/* Show "Add Home" button only if no home address exists */}
              {!hasLocationType("Home") && (
                <SavedLocation
                  LocationType="Home"
                  LocationName=""
                  address=""
                  isSavedLocationAvailable={false}
                  onPress={() => handleAddAddressPress("Home")}
                />
              )}
              
              {/* Show "Add School" button only if no school address exists */}
              {!hasLocationType("School") && (
                <SavedLocation
                  LocationType="School"
                  LocationName=""
                  address=""
                  isSavedLocationAvailable={false}
                  onPress={() => handleAddAddressPress("School")}
                />
              )}
              
              {/* Display saved addresses */}
              {savedAddresses.map((address) => (
                <SavedLocation
                  key={address.id}
                  LocationType={address.locationType}
                  LocationName={address.locationName}
                  address={address.address}
                  isSavedLocationAvailable={true}
                  onPress={() => {
                    // Handle selecting a saved address
                    console.log('Selected address:', address);
                  }}
                  onLongPress={() => handleEditAddress(address)}
                />
              ))}
            </View>

            {/* Time slots */}
            <Text style={[styles.h1, { marginLeft: width * 0.05, marginTop: height * 0.04, fontSize: 25, color: colors.text }]}>
              Time slots
            </Text>
            <TimeSlots setIsAddScheduledWalkVisible={setIsAddScheduledWalkVisible} />

            {/* New walk schedule component */}
            {isAddScheduledWalkVisible && (
              <View style = {{position: 'absolute', zIndex: 100, width, height}}>
              <AddScheduledWalk 
                  onClose={() => setIsAddScheduledWalkVisible(false)} 
                  setIsAddScheduledWalkVisible={setIsAddScheduledWalkVisible}
              />
              </View>
            )}
          </>
        )}
      </Animated.View>

      {/* Add New Address Component - Rendered outside the Animated.View */}
      <AddNewAddress 
        visible={isAddNewAddressVisible}
        onClose={() => {
          setIsAddNewAddressVisible(false);
          setEditingLocationType(null);
          setEditingAddress(null);
        }}
        onSaveAddress={handleSaveAddress}
        initialLocationName={editingLocationType}
        editingAddress={editingAddress}
      />
    </View>
  )
}

export default WalkPartner

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  titleBack: {
    marginTop: height * 0.08,
    marginLeft: width * 0.05,
    flexDirection: "row",
    justifyContent: "center"
  },
  textBold: {
    fontFamily: "Helvetica",
    fontWeight: "900"
  },
  backIcon: {
    width: 25,
    height: 25,
    transform: [{ rotate: '-90deg' }]
  },
  backBtn: {
    width: 29,
    height: 28,
    borderWidth: 1,
    borderColor: "#DADADA",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginLeft: "auto",
    marginHorizontal: 30
  },
  h1: {
    fontFamily: "Helvetica",
    fontWeight: 900,
  },
  h2: {
    fontFamily: "Helvetica",
    fontWeight: 700
  },
  floatingView: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center'
  }
})