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
import WalkingMap from '../componets/WalkingMapComponents/WalkingMap';
import WalkDetails from '../componets/WalkingMapComponents/WalkDetails';
import PartnerEstimatedDetails from '../componets/WalkingMapComponents/PartnerEstimatedDetails';
import LocatePartner from '../componets/LocatePartner';

// Firestore imports for walk request listener
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../backend/Firebase/FirebaseConfig';

const { width, height } = Dimensions.get('window')

const WalkPartner = ({ 
  setIsWalkPartner, 
  userImage, 
  isReceiverWalk = false,
  initialAcceptedWalkRequest = null 
}) => {
  // Helper to check if a coordinate object is valid
  const isValidCoordinate = (coord) => {
    return (
      coord &&
      typeof coord.latitude === 'number' &&
      typeof coord.longitude === 'number' &&
      !isNaN(coord.latitude) &&
      !isNaN(coord.longitude)
    );
  };

  const onWalkCancel = async () => {
  try {
    console.log('🚫 Walk cancellation initiated');

    // Show confirmation dialog
    Alert.alert(
      'Cancel Walk',
      'Are you sure you want to cancel this walk? This will end the session for both participants.',
      [
        {
          text: 'No, Continue',
          style: 'cancel'
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // ✅ FIX: Retrieve user data from AsyncStorage first
              const userDataString = await AsyncStorage.getItem('userData');
              const userDataObj = userDataString ? JSON.parse(userDataString) : null;
              const userId = userDataObj?.id || userDataObj?.userId || 'unknown';

              // 1. Update Firebase walk request status to cancelled
              if (currentWalkRequestId) {
                await FirebaseService.updateWalkRequestStatus(
                  currentWalkRequestId,
                  'cancelled',
                  {
                    cancelledAt: new Date().toISOString(),
                    cancelledBy: userId  // ✅ Now using the retrieved userId
                  }
                );
                console.log('✅ Walk request cancelled in Firebase');
              }

              // 2. Reset all walk-related states for SENDER
              setActiveWalkData(null);
              setIsWalkActive(false);
              setAcceptedWalker(null);
              setWalkerLocation(null);
              setPartnerStats(null);
              
              // 3. Reset search and partner selection states
              setIsSearchPartner(false);
              setIsShowingAcceptedWalker(false);
              setCurrentWalkRequestId(null);
              setOriginalWalkRequest(null);
              
              // 4. Reset map and location states
              setIsDestinationDone(false);
              setIsStartPointDone(false);
              setIsStartPoint(false);
              setISTapWhere(false);
              setDropoffLocation('');
              setDestinationCoords(null);
              setStartPointCoords({ latitude: -26.1872365, longitude: 28.0124719 });
              
              // 5. Reset UI states
              setShowPartnerUpdate(false);
              setFindPartnerView(false);
              
              // 6. Clear accepted walk request from context (for RECEIVER)
              if (setAcceptedWalkRequest) {
                setAcceptedWalkRequest(null);
              }

              console.log('✅ All walk states reset');

              // 7. Show success message
              Alert.alert(
                'Walk Cancelled',
                'The walk has been cancelled successfully.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // 8. Return to home screen
                      setIsWalkPartner(false);
                    }
                  }
                ]
              );

            } catch (error) {
              console.error('❌ Error during walk cancellation:', error);
              Alert.alert(
                'Cancellation Error',
                'There was an error cancelling the walk. Please try again.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Still return to home even if there was an error
                      setIsWalkPartner(false);
                    }
                  }
                ]
              );
            }
          }
        }
      ]
    );
  } catch (error) {
    console.error('❌ Error showing cancellation dialog:', error);
  }
};

  // Helper function to get a safe meetup point
  const getSafeMeetupPoint = (meetupPoint, startPoint, userLocation) => {
    // First try the provided meetup point
    if (meetupPoint && isValidCoordinate(meetupPoint)) {
      return meetupPoint;
    }
  
    // Fallback to start point
    if (startPoint && isValidCoordinate(startPoint)) {
      return startPoint;
    }
  
    // Final fallback to user location with offset
    if (userLocation && isValidCoordinate(userLocation)) {
      return {
        latitude: userLocation.latitude + 0.001, // Small offset
        longitude: userLocation.longitude + 0.001
      };
    }
  
    // Ultimate fallback - default coordinates
    return { latitude: -26.2046, longitude: 28.0478 };
  };
  // Handle immediate walk start for receiver
  useEffect(() => {
    if (isReceiverWalk && initialAcceptedWalkRequest) {
      console.log('🚶‍♂️ [WalkPartner] Starting immediate receiver walk');
      handleImmediateReceiverWalkStart(initialAcceptedWalkRequest);
    }
  }, [isReceiverWalk, initialAcceptedWalkRequest]);

    const DummywalkDetails = {
    startLocation: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    destination: {
      latitude: 37.7949,
      longitude: -122.3994,
    },
    partnerLocation: { latitude: -26.2060, longitude: 28.0490 },
    meetUpPoint: { latitude: -26.2046, longitude: 28.0478 }
  }

  // Handler for immediate receiver walk start
  const handleImmediateReceiverWalkStart = async (walkRequest) => {
    try {
      console.log('🚶‍♂️ [WalkPartner] Immediate receiver walk data:', walkRequest);

      const userDataString = await AsyncStorage.getItem('userData');
      const userDataObj = userDataString ? JSON.parse(userDataString) : null;

      // FIX: Use proper string locations, not coordinate objects
      const walkData = {
        // Use string locations for display
        fromLocation: walkRequest.pickup || 'Your Location', // This is a string like "APB Campus West Entrance"
        toLocation: acceptedWalkRequest.toDestination || 'Destination',
        fromAddress: '',
        toAddress: '',
        totalDistance: 'Calculating...',
        estimatedDuration: 'Calculating...',
        nextTurnDistance: '250 m',
        nextStreet: 'Head to meetup point',
        partnerId: walkRequest.requesterId,
        partnerName: walkRequest.requesterName || 'Walk Partner',
        partnerPhone: walkRequest.requesterPhone,
        // Use coordinate objects for map
        startPoint: walkRequest.startPoint, // This is {latitude, longitude}
        destination: walkRequest.destination, // This is {latitude, longitude}
        toDestination: acceptedWalkRequest.toDestination || 'Horizon Heights',
        meetupPoint: walkRequest.meetupPoint,
        startedAt: walkRequest.confirmedAt || new Date().toISOString(),
        requestId: walkRequest.requestId,
        receiverId: userDataObj?.id,
        receiverName: userDataObj ? `${userDataObj.Name || ''} ${userDataObj.Surname || ''}`.trim() : 'You'
      };

      console.log('✅ [WalkPartner] Immediate receiver walk data prepared:', walkData);

      setActiveWalkData(walkData);
      setIsWalkActive(true);
      setIsSearchPartner(false);
      setIsShowingAcceptedWalker(false);

      console.log('✅ [WalkPartner] Immediate receiver walk started successfully!');

    } catch (error) {
      console.error('❌ Error starting immediate receiver walk:', error);
      Alert.alert('Error', 'Failed to start walk. Please try again.');
      setIsWalkPartner(false);
    }
  };
  const { colors, isDark } = useTheme();
  const { 
    currentWalkRequest, 
    isNotificationVisible,
    acceptWalkRequest,
    declineWalkRequest,
    acceptedWalkRequest,
    setAcceptedWalkRequest
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
  const [originalWalkRequest, setOriginalWalkRequest] = useState(null);
  const [showPartnerUpdate, setShowPartnerUpdate] = useState(false);
  const [findPartnerView, setFindPartnerView] = useState(false);
  
  
  // NEW STATES FOR ACCEPTED WALKER
  const [acceptedWalker, setAcceptedWalker] = useState(null);
  const [isShowingAcceptedWalker, setIsShowingAcceptedWalker] = useState(false);
  const [walkerLocation, setWalkerLocation] = useState(null);
  const [currentWalkRequestId, setCurrentWalkRequestId] = useState(null);
  // Partner stats (distance, ETA)
  const [partnerStats, setPartnerStats] = useState(null);
  // NEW: Active walk state
  const [isWalkActive, setIsWalkActive] = useState(false);
  // NEW: Active walk data state
  const [activeWalkData, setActiveWalkData] = useState(null);
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
  useEffect(() => {
  console.log('🔍 State changes:', {
    isWalkActive,
    hasActiveWalkData: !!activeWalkData,
    acceptedWalkRequest: acceptedWalkRequest?.status,
    isSearchPartner,
    isShowingAcceptedWalker
  });
}, [isWalkActive, activeWalkData, acceptedWalkRequest, isSearchPartner, isShowingAcceptedWalker]);

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

  // Function to handle destination selection with coordinates and address
  const handleDestinationSelect = (coordinates, address) => {
    console.log('📍 Destination selected:', coordinates, address);
    setDestinationCoords(coordinates);
    setDropoffLocation(address); // Make sure this is set
  };
  
  const handleStartPointSelect = (coords) => {
    setStartPointCoords(coords);
  };

  // NEW: Listen for walk request acceptance using real Firestore listener
  useEffect(() => {
    if (!currentWalkRequestId) return;

    // console.log($&);

    const unsubscribe = FirebaseService.listenToWalkRequestAcceptance(
      currentWalkRequestId,
      async (acceptedWalkRequest) => {
        try {
          // Store the original walk request if not already set
          if (!originalWalkRequest) {
            setOriginalWalkRequest(acceptedWalkRequest);
          }

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
            // console.error('❌ No accepter phone found in accepted walk request');
            return;
          }

          // Fetch accepter's user data
          const accepterResult = await FirebaseService.getUserByPhone(accepterPhone);
          if (!accepterResult.exists || !accepterResult.userData) {
            // console.error('❌ Could not fetch accepter data for:', accepterPhone);
            // Fallback to basic accepter info
            showFallbackAcceptedWalker(accepterPhone, acceptedWalkRequest);
            return;
          }

          const accepterData = accepterResult.userData;
          // console.log($&);

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
      // console.log($&);
      unsubscribe();
    };
  }, [currentWalkRequestId, originalWalkRequest]);

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
      // console.log($&);
    } catch (error) {
      // console.error('🔊 Error playing sound:', error);
    }
  };

  // NEW: Handle starting partner search and set up listener
  const handleStartPartnerSearch = (requestId) => {
    // console.log($&);
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
      // console.log($&);
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

// FIXED: Handle confirming the walker with improved data for receiver
const handleConfirmWalker = async () => {
  console.log('✅ Sender confirming walker:', acceptedWalker?.name);

  const walkRequestData = originalWalkRequest;

  if (!walkRequestData) {
    Alert.alert('Error', 'Walk request data not found');
    return;
  }

  try {
    // Get sender's user data
    const userDataString = await AsyncStorage.getItem('userData');
    const userDataObj = userDataString ? JSON.parse(userDataString) : null;

    // Prepare walk data for sender
    const walkData = {
      // Use string locations for display
      fromLocation: walkRequestData.walkFrom || 'Your Location',
      toLocation: walkRequestData.toDestination || 'Horizon Heights',
      fromAddress: '',
      toAddress: '',
      totalDistance: partnerStats?.distance || 'Calculating...',
      estimatedDuration: partnerStats?.eta || 'Calculating...',
      nextTurnDistance: '250 m',
      nextStreet: 'Head to meetup point',
      partnerId: acceptedWalker.id,
      partnerName: acceptedWalker.name,
      partnerPhone: acceptedWalker.phone,
      // Use coordinate objects for map - MAKE SURE THESE ARE VALID
      startPoint: startPointCoords,
      meetupPoint: walkRequestData.meetupPoint || startPointCoords, // FALLBACK TO startPointCoords
      destination: destinationCoords,
      startedAt: new Date().toISOString(),
      requestId: currentWalkRequestId,
      senderId: userDataObj?.id,
      senderName: userDataObj ? `${userDataObj.Name || ''} ${userDataObj.Surname || ''}`.trim() : 'Walk Partner',
      senderPhone: userDataObj?.phone
    };

    console.log('📍 WalkData coordinates:', {
      startPoint: walkData.startPoint,
      meetupPoint: walkData.meetupPoint,
      destination: walkData.destination
    });

    // Update Firebase with additional data for receiver
    if (currentWalkRequestId) {
      const updateData = {
        status: 'accepted_by_both',
        confirmedAt: new Date().toISOString(),
        // Include coordinate data that receiver will need
        startPoint: startPointCoords,
        destination: destinationCoords,
        senderName: userDataObj ? `${userDataObj.Name || ''} ${userDataObj.Surname || ''}`.trim() : 'Walk Partner',
        requesterName: userDataObj ? `${userDataObj.Name || ''} ${userDataObj.Surname || ''}`.trim() : 'Walk Partner',
        senderPhone: userDataObj?.phone,
        // Keep the original string locations for display
        pickup: walkRequestData.walkFrom || 'Your Location'
      };

      console.log('📤 Updating Firestore with:', updateData);

      await FirebaseService.updateWalkRequestStatus(
        currentWalkRequestId,
        'accepted_by_both',
        updateData
      );
    }

    // Set states for sender
    setActiveWalkData(walkData);
    setIsShowingAcceptedWalker(false);
    setIsWalkActive(true);

    // Alert.alert('Walk Started! 🚶', `You're now walking with ${acceptedWalker.name}`);

  } catch (error) {
    console.error('❌ Error confirming walker:', error);
    Alert.alert('Error', 'Failed to start walk. Please try again.');
  }
};
  useEffect(() => {
  console.log('🔍 acceptedWalkRequest changed:', acceptedWalkRequest);
  console.log('🔍 Current states:', {
    isWalkActive,
    hasActiveWalkData: !!activeWalkData,
    isSearchPartner,
    isShowingAcceptedWalker
  });
}, [acceptedWalkRequest, isWalkActive, activeWalkData]);

// Updated regular receiver walk start (simplified and consistent with immediate walk start)
useEffect(() => {
  const handleReceiverWalkStart = async () => {
    console.log('🚶‍♂️ [Receiver] Checking acceptedWalkRequest:', acceptedWalkRequest);
    
    // Only process if not already walking and request is confirmed
    if (!isWalkActive && acceptedWalkRequest && acceptedWalkRequest.status === 'accepted_by_both') {
      console.log('🚶‍♂️ [Receiver] Starting walk from accepted request');

      try {
        // Get receiver's user data
        const userDataString = await AsyncStorage.getItem('userData');
        const userDataObj = userDataString ? JSON.parse(userDataString) : null;

        // Prepare walk data for receiver
        const walkData = {
          // String locations for display
          fromLocation: acceptedWalkRequest.pickup || 'Your Location',
          toLocation: acceptedWalkRequest.toDestination || 'Horizon Heights',
          fromAddress: '',
          toAddress: '',
          totalDistance: 'Calculating...',
          estimatedDuration: 'Calculating...',
          nextTurnDistance: '250 m',
          nextStreet: 'Head to meetup point',
          partnerId: acceptedWalkRequest.requesterId,
          partnerName: acceptedWalkRequest.requesterName || 'Walk Partner',
          partnerPhone: acceptedWalkRequest.requesterPhone,
          // Coordinates for map
          startPoint: acceptedWalkRequest.startPoint,
          destination: acceptedWalkRequest.destination,
          meetupPoint: acceptedWalkRequest.meetupPoint,
          startedAt: acceptedWalkRequest.confirmedAt || new Date().toISOString(),
          requestId: acceptedWalkRequest.requestId,
          receiverId: userDataObj?.id,
          receiverName: userDataObj ? `${userDataObj.Name || ''} ${userDataObj.Surname || ''}`.trim() : 'You'
        };

        console.log('✅ [Receiver] Walk data prepared from accepted request:', {
          fromLocation: walkData.fromLocation,
          toLocation: walkData.toLocation,
          startPoint: walkData.startPoint,
          destination: walkData.destination
        });

        // Set active walk states
        setActiveWalkData(walkData);
        setIsWalkActive(true);
        setIsSearchPartner(false);
        setIsShowingAcceptedWalker(false);

        console.log('✅ [Receiver] Walk started successfully from accepted request');

      } catch (error) {
        console.error('❌ Error starting receiver walk from accepted request:', error);
      }
    }
  };

  handleReceiverWalkStart();
}, [acceptedWalkRequest, isWalkActive]);

  const handleRecenterMap = () => {
    console.log('Recenter map');
  };

  const handleMoreOptions = () => {
    Alert.alert(
      'Walk Options',
      'Choose an action',
      [
        { text: 'Share Location', onPress: () => console.log('Share location') },
        { text: 'End Walk', onPress: handleEndWalk, style: 'destructive' },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleEmergency = () => {
    Alert.alert(
      '🚨 Emergency',
      'Are you in danger?',
      [
        {
          text: 'Send SOS',
          onPress: () => {
            console.log('SOS triggered');
          },
          style: 'destructive'
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleEndWalk = () => {
    // Alert.alert(
    //   'End Walk?',
    //   'Are you sure you want to end this walk?',
    //   [
    //     {
    //       text: 'End Walk',
    //       onPress: () => {
    //         setIsWalkActive(false);
    //         setActiveWalkData(null);
    //         setAcceptedWalker(null);
    //         Alert.alert('Walk Ended', 'Your walk has been completed.');
    //       },
    //       style: 'destructive'
    //     },
    //     { text: 'Cancel', style: 'cancel' }
    //   ]
    // );
    onWalkCancel();
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
        {/* Show WalkingMap when walk is active */}
        {isWalkActive && activeWalkData && (
          <>
            {(() => {
              // Compute a safe meetup point
              const safeMeetUpPoint = getSafeMeetupPoint(
                activeWalkData.meetupPoint,
                activeWalkData.startPoint,
                userLocation
              );
              return (
                <WalkingMap 
                  walkDetails={{
                    partnerLocation: activeWalkData.partnerLocation,
                    meetUpPoint: safeMeetUpPoint
                  }}
                  onRouteReady={(routeInfo) => {
                    // Handle route information if needed
                    console.log('Route ready:', routeInfo);
                  }}
                  onUserLocationChange={(location) => {
                    // Update user location for navigation calculations
                    console.log('User location updated:', location);
                  }}
                />
              );
            })()}
            <WalkDetails 
              walkData={activeWalkData}
               partnerData={acceptedWalker}
              onEndWalk={handleEndWalk}
              onRecenter={handleRecenterMap}
              onMoreOptions={handleMoreOptions}
              onEmergency={handleEmergency}
              setShowPartnerUpdate={setShowPartnerUpdate}
              onWalkCancel = {onWalkCancel}
            />
          </>
        )}

        {isWalkActive && showPartnerUpdate && (
          <PartnerEstimatedDetails
            setShowPartnerUpdate={setShowPartnerUpdate}
            setFindPartnerView={setFindPartnerView}
            partnerData={activeWalkData}
          />
        )}



        {/* Show MapWithDetails in background when showing accepted walker or in map mode */}
        {(isTapWhere || isShowingAcceptedWalker) && !isWalkActive && (
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

        {/* Title and back button - shown only when not in map mode, not showing accepted walker, and not in active walk */}
        {!isTapWhere && !isShowingAcceptedWalker && !isWalkActive && (
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

        {/* Search bar - hidden when showing accepted walker or when walk is active */}
        {!isDestinationDone && !isShowingAcceptedWalker && !isWalkActive && (
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

        {/* Walk start point - hidden when showing accepted walker or when walk is active */}
        {(isDestinationDone && isStartPoint && !isShowingAcceptedWalker && !isWalkActive) && (
          <View style={styles.floatingView}>
            <WalkStartPoint 
              setIsDestinationDone={setIsDestinationDone} 
              setIsSearchPartner={handleStartPartnerSearch} // Updated to pass request ID
              setIsStartPoint={setIsStartPoint}
              onStartPointSelect={handleStartPointSelect} 
              dropoffLocation={dropoffLocation}
              destinationCoords = {destinationCoords}
            />
          </View>
        )}

        {/* Partner search loader - hidden when showing accepted walker or when walk is active */}
        {isSearchPartner && !isShowingAcceptedWalker && !isWalkActive && (
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

        {/* Main content - shown only when not in map mode, not showing accepted walker, and not in active walk */}
        {!isTapWhere && !isShowingAcceptedWalker && !isWalkActive && (
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
                    // console.log($&);
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

{isWalkActive && findPartnerView && (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000 }}>
    <LocatePartner
      setFindPartnerView={setFindPartnerView}
      activeWalkData={activeWalkData}  // Contains partnerId for receiver or senderId for sender
    />
  </View>
              )}
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