import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Image, Animated, Easing } from 'react-native'
import React, { useRef, useEffect, useState } from 'react'
import { useTheme } from '../contexts/ColorContext'
import WalkPartnerSearchBar from '../componets/WalkPartnerSearchBar'
import SavedLocation from '../componets/SavedLocation'
import TimeSlots from './TimeSlots'
import AddScheduledWalk from '../componets/AddScheduledWalk'; 
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window')

const WalkPartner = ({ setIsWalkPartner }) => {
  const { colors, isDark } = useTheme();
  const [isAddScheduledWalkVisible, setIsAddScheduledWalkVisible] = useState(false);
  const [isTapWhere, setISTapWhere] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

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

  // Get user location for map center
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      }
    })();
  }, []);

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

      {/* Search bar - always visible */}
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
          onBackPress={isTapWhere ? () => setISTapWhere(false) : undefined}
        />
      </View>

      {/* Map view when isTapWhere is true */}
      {isTapWhere && (
        <View style={styles.fullMapContainer}>
          <MapView
            style={styles.fullMap}
            provider={PROVIDER_GOOGLE}
            customMapStyle={isDark ? MAP_STYLES.dark : MAP_STYLES.light}
            initialRegion={
              userLocation ? {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              } : undefined
            }
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsBuildings={false}
            showsTraffic={false}
            showsIndoors={false}
            toolbarEnabled={false}
          />
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