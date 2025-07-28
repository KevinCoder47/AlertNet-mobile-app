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

const { width, height } = Dimensions.get('window')

const WalkPartner = ({ setIsWalkPartner }) => {
  const { colors, isDark } = useTheme();
  const [isAddScheduledWalkVisible, setIsAddScheduledWalkVisible] = useState(false);
  const [isTapWhere, setISTapWhere] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const apiKey = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;
  const [isDestinationDone, setIsDestinationDone] = useState(false)
  const [isStartPointDone, setIsStartPointDone] = useState(false)
  



  //location shortcut variables
  const savedLocations = {
    locationType: ["school", "Res"],
    locationName: ["APB Campus", "Horizon Heights"],
    address: ["53 Bunting Road Johannesburg", "39 Twickenham Avenue Johannesburg"]
  }

  // Animation values
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1.02)).current;
  
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
      // After animation completes, update the state
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

// FIX 1: Create reusable function for reverse geocoding
  const reverseGeocode = async (coords) => {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          latlng: `${coords.latitude},${coords.longitude}`,
          key: apiKey
        }
      });

      if (response.data.status === 'OK') {
        const results = response.data.results;
        if (results.length > 0) {
          return results[0].formatted_address;
        }
      } else {
        console.warn('Geocoding error:', response.data.status);
      }
    } catch (error) {
      console.error('Failed to reverse geocode with Google Maps:', error);
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
        
        // FIX 2: Use the reusable geocode function
        const address = await reverseGeocode(coords);
        setLocationName(address);
      }
    })();
  }, []);

  // FIX 3: Handle location selection from map
  const handleLocationSelect = async (selectedCoords) => {
    setUserLocation(selectedCoords);
    const address = await reverseGeocode(selectedCoords);
    setLocationName(address);
  };

  return (
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
          onBackPress={isTapWhere ? () => setISTapWhere(false) : undefined}
        />
      </View>
      )}

      {/* Map view when isTapWhere is true */}
      {isTapWhere && (
        <MapWithDetails isTapWhere={isTapWhere} userLocation={userLocation} setUserLocation={setUserLocation}/>
      )}

      {isDestinationDone && (
        <View style = {styles.floatingView}>
          <WalkStartPoint />
        </View>
      )}

      {/* Main content - shown only when not in map mode */}
      {!isTapWhere && (
        <>
          {/* Saved location shortcuts */}
          <View style = {{marginLeft: width * 0.05, marginTop: height * 0.02, gap: 20}}>
            <SavedLocation LocationType={savedLocations.locationType[0]} LocationName={savedLocations.locationName[0]} address={savedLocations.address[0]} />
            <SavedLocation LocationType={savedLocations.locationType[1]} LocationName={savedLocations.locationName[1]} address={savedLocations.address[1]} />
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