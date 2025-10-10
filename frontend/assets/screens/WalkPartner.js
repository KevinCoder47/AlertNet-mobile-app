import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Image, Animated, Easing, Alert } from 'react-native';
import React, { useRef, useEffect, useState } from 'react'
import { useTheme } from '../contexts/ColorContext'
import { useNotifications } from '../contexts/NotificationContext' 
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
import GeneralLoader from '../componets/Loaders/GeneralLoarder';
import SelectWalker from '../componets/SelectWalker'
import { FirebaseService } from '../../backend/Firebase/FirebaseService';

// Firestore imports for walk request listener
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../backend/Firebase/FirebaseConfig';

const { width, height } = Dimensions.get('window')

const WalkPartner = ({ setIsWalkPartner, userImage }) => {
  const { colors, isDark } = useTheme();
  const { 
    currentWalkRequest, 
    isNotificationVisible,
    acceptWalkRequest,
    declineWalkRequest 
  } = useNotifications();

  const [isAddScheduledWalkVisible, setIsAddScheduledWalkVisible] = useState(false);
  const [isTapWhere, setISTapWhere] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;;
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
  
  // NEW STATES FOR ACCEPTED WALKER
  const [acceptedWalker, setAcceptedWalker] = useState(null);
  const [isShowingAcceptedWalker, setIsShowingAcceptedWalker] = useState(false);
  const [walkerLocation, setWalkerLocation] = useState(null);
  const [currentWalkRequestId, setCurrentWalkRequestId] = useState(null);
  // Partner stats (distance, ETA)
  const [partnerStats, setPartnerStats] = useState(null);
  // Calculate ETA and distance between two lat/lng points using Google Maps Directions API
  // Returns { distance: "...", eta: "..." }
const calculatePartnerStats = async (walkerLoc, startLoc) => {
  if (!walkerLoc || !startLoc || !apiKey) return null;
  
  try {
    // Format the coordinates for the API request
    const origins = `${walkerLoc.latitude},${walkerLoc.longitude}`;
    const destinations = `${startLoc.latitude},${startLoc.longitude}`;
    
    // Build the request URL for the Distance Matrix API
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=walking&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Check if the request and the first element were successful
    if (data.rows && data.rows[0].elements[0].status === 'OK') {
      const element = data.rows[0].elements[0];
      return {
        distance: element.distance.text, 
        eta: element.duration.text       
      };
    }
    return null;
  } catch (e) {
    console.error('Failed to calculate partner stats:', e);
    return null;
  }
};

  // Recalculate ETA and distance when partner or locations change
  useEffect(() => {
    const doCalc = async () => {
      if (
        acceptedWalker &&
        walkerLocation &&
        currentWalkRequest &&
        currentWalkRequest.startPoint
      ) {
        const walkerLoc =
          walkerLocation.latitude && walkerLocation.longitude
            ? walkerLocation
            : null;
        const startLoc =
          currentWalkRequest.startPoint.latitude && currentWalkRequest.startPoint.longitude
            ? currentWalkRequest.startPoint
            : null;
        if (walkerLoc && startLoc) {
          const stats = await calculatePartnerStats(walkerLoc, startLoc);
          setPartnerStats(stats);
        } else {
          setPartnerStats(null);
        }
      } else {
        setPartnerStats(null);
      }
    };
    doCalc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedWalker, walkerLocation, currentWalkRequest]);

  // Function to handle destination selection with coordinates
  const handleDestinationSelect = (coordinates) => {
    console.log('Destination coordinates received:', coordinates);
    setDestinationCoords(coordinates);
  };
  
  const handleStartPointSelect = (coords) => {
    setStartPointCoords(coords);
  };

  // NEW: Listen for walk request acceptance using real Firestore listener
  useEffect(() => {
    if (!currentWalkRequestId) return;

    console.log('🚀 Setting up real acceptance listener for:', currentWalkRequestId);

    const unsubscribe = FirebaseService.listenToWalkRequestAcceptance(
      currentWalkRequestId,
      async (acceptedWalkRequest) => {
        try {
          console.log('🎯 Walk request accepted!', acceptedWalkRequest);

          // --- NEW HANDLING: If the sender confirms the acceptance (status === 'accepted_by_both') ---
          if (acceptedWalkRequest.status === 'accepted_by_both') {
            // If you have a loading state for acceptance, stop it here
            if (typeof setAcceptanceLoading === 'function') {
              setAcceptanceLoading(false);
            }
            // You may want to update UI or navigate to the active walk screen here
            return;
          }

          // Get accepter's phone number
          const accepterPhone = acceptedWalkRequest.acceptedBy;
          if (!accepterPhone) {
            console.error('❌ No accepter phone found in accepted walk request');
            return;
          }

          // Fetch accepter's user data
          const accepterResult = await FirebaseService.getUserByPhone(accepterPhone);
          if (!accepterResult.exists || !accepterResult.userData) {
            console.error('❌ Could not fetch accepter data for:', accepterPhone);
            // Fallback to basic accepter info
            showFallbackAcceptedWalker(accepterPhone, acceptedWalkRequest);
            return;
          }

          const accepterData = accepterResult.userData;
          console.log('✅ Accepter data found. CurrentLocation:', accepterData.CurrentLocation);

          // ✅ Ensure the accepter has a valid CurrentLocation field
          if (!accepterData.CurrentLocation) {
            console.warn('⚠️ Accepter has no CurrentLocation set. Falling back.');
            showFallbackAcceptedWalker(accepterPhone, acceptedWalkRequest);
            return;
          }

          // ✅ Extract the coordinates from the user's CurrentLocation field
          const walkerCoords = accepterData.CurrentLocation; // Expected format: { latitude, longitude }

          // Use the extracted location to calculate partner stats
          const stats = await calculatePartnerStats(walkerCoords, startPointCoords);

          // Create accepted walker object
          const acceptedWalkerData = {
            id: accepterData.id,
            name: `${accepterData.Name || ''} ${accepterData.Surname || ''}`.trim() || 'Walk Partner',
            rating: accepterData.rating || 4.5,
            bio: accepterData.bio || "I'm available to walk with you!",
            availability: "Available Now",
            gender: accepterData.Gender || "Not specified",
            walksCompleted: accepterData.walksCompleted || 0,
            universityYear: accepterData.year || "Not specified",
            isVerified: accepterData.isVerified || false,
            phone: accepterPhone,
            location: walkerCoords,
            eta: stats?.eta,
            distance: stats?.distance,
            avatarSource: accepterData.ImageURL ? { uri: accepterData.ImageURL } : undefined
          };

          // ✅ Update state with the walker's location
          setAcceptedWalker(acceptedWalkerData);
          setWalkerLocation(walkerCoords); // Crucial for displaying the marker
          setIsShowingAcceptedWalker(true);
          setIsSearchPartner(false);

        } catch (error) {
          console.error('💥 Error processing accepted walk request:', error);
          // Fallback to showing basic acceptance
          showFallbackAcceptedWalker(acceptedWalkRequest.acceptedBy, acceptedWalkRequest);
        }
      }
    );

    return () => {
      console.log('🔴 Cleaning up acceptance listener');
      unsubscribe();
    };
  }, [currentWalkRequestId]);

  // Fallback function if accepter data can't be fetched (new version)
  const showFallbackAcceptedWalker = (accepterPhone, walkRequest) => {
    const meetupCoordinates = {
      'APB Campus West Entrance': { latitude: -26.1872365, longitude: 28.0124719 },
      // Add all your meetup points
    };
    
    const meetupPoint = walkRequest.meetupPoint || walkRequest.pickup;
    const location = meetupCoordinates[meetupPoint] || startPointCoords;

    const fallbackAcceptedWalker = {
      id: 'accepted-' + accepterPhone,
      name: 'Walk Partner',
      rating: 4.5,
      bio: "I've accepted your walk request! Let's walk together.",
      availability: "Available Now", 
      gender: "Not specified",
      walksCompleted: 0,
      universityYear: "Not specified",
      isVerified: false,
      phone: accepterPhone,
      location: location
    };
    
    setAcceptedWalker(fallbackAcceptedWalker);
    setWalkerLocation(location);
    setIsShowingAcceptedWalker(true);
    setIsSearchPartner(false);
  };

  // Function to play notification sound
  const playNotificationSound = async (type) => {
    try {
      // You can use your existing sound playing logic here
      console.log('🔊 Playing sound for:', type);
    } catch (error) {
      console.error('🔊 Error playing sound:', error);
    }
  };

  // NEW: Handle starting partner search and set up listener
  const handleStartPartnerSearch = (requestId) => {
    console.log('🚀 Starting partner search with request ID:', requestId);
    setCurrentWalkRequestId(requestId);
    setIsSearchPartner(true);
  };

  // Remove the simulation useEffect - we don't want simulated acceptances anymore
  // useEffect(() => {
  //   const handleAcceptedWalker = async () => {
  //     if (isSearchPartner) {
  //       // REMOVED: No more simulation
  //     }
  //   };
  //   handleAcceptedWalker();
  // }, [isSearchPartner]);

  // Handle real acceptance from push notifications (keep this as backup)
  useEffect(() => {
    if (currentWalkRequest && currentWalkRequest.type === 'walk_accepted') {
      console.log('📱 Received walk acceptance via push notification');
      setAcceptedWalker(currentWalkRequest.accepterData);
      setWalkerLocation(currentWalkRequest.accepterLocation);
      setIsShowingAcceptedWalker(true);
      setIsSearchPartner(false);
    }
  }, [currentWalkRequest]);

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
    setSavedAddresses(updatedAddresses);
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
        const address = addressList[0];
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

  // NEW: Handle confirming the walker
  const handleConfirmWalker = () => {
    console.log('Walker confirmed:', acceptedWalker);
    // Here you would:
    // 1. Notify the walker that they've been selected
    // 2. Start the walk session
    // 3. Navigate to the active walk screen
    Alert.alert('Success', `You've selected ${acceptedWalker.name} as your walk partner!`);
    setIsShowingAcceptedWalker(false);
    
    // Optionally, update the walk request status to 'confirmed' or 'active'
    if (currentWalkRequestId) {
      // FirebaseService.updateWalkRequestStatus(currentWalkRequestId, 'confirmed');
    }
  };

  // NEW: Handle swiping to next (if you have multiple accepters)
  const handleSwipeToNext = () => {
    // For now, we'll just close since we only have one
    setIsShowingAcceptedWalker(false);
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
        {/* Show map in background when showing accepted walker */}
        {(isTapWhere || isShowingAcceptedWalker) && (
          <MapWithDetails 
            isTapWhere={isTapWhere || isShowingAcceptedWalker} 
            userLocation={userLocation} 
            setUserLocation={setUserLocation} 
            destination={destinationCoords}
            startPoint={startPointCoords}
            userImage={userImage}
            isSearching={isSearchPartner}
            isSelectPartner={isShowingAcceptedWalker}
            partnerLocation={walkerLocation}
            partnerData={acceptedWalker}
          />
        )}

        {/* Title and back button - shown only when not in map mode and not showing accepted walker */}
        {!isTapWhere && !isShowingAcceptedWalker && (
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

        {/* Search bar - hidden when showing accepted walker */}
        {!isDestinationDone && !isShowingAcceptedWalker && (
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

        {/* Walk start point - hidden when showing accepted walker */}
        {(isDestinationDone && isStartPoint && !isShowingAcceptedWalker) && (
          <View style={styles.floatingView}>
            <WalkStartPoint 
              setIsDestinationDone={setIsDestinationDone} 
              setIsSearchPartner={handleStartPartnerSearch} // Updated to pass request ID
              setIsStartPoint={setIsStartPoint}
              onStartPointSelect={handleStartPointSelect} 
              dropoffLocation={dropoffLocation}
            />
          </View>
        )}

        {/* Partner search loader - hidden when showing accepted walker */}
        {isSearchPartner && !isShowingAcceptedWalker && (
          <View style={styles.floatingView}>
            <PartnerSearch />
          </View>
        )}

        {/* SelectWalker component - shown when a partner accepts */}
        {isShowingAcceptedWalker && acceptedWalker && (
          <View style={styles.selectWalkerContainer}>
            <SelectWalker 
              partner={acceptedWalker}
              partnerStats={partnerStats}
              onConfirm={handleConfirmWalker}
              onSwipe={handleSwipeToNext}
              onClose={() => setIsShowingAcceptedWalker(false)}
            />
          </View>
        )}

        {/* Main content - shown only when not in map mode and not showing accepted walker */}
        {!isTapWhere && !isShowingAcceptedWalker && (
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
  },
  // NEW: Styles for SelectWalker container
  selectWalkerContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    zIndex: 1000,
  }
})