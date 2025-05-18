import React, { useEffect, useState, useMemo, useRef } from 'react';
import { StyleSheet, View, Dimensions, Alert, Platform, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ColorContext';
import UserMapMarker from './UserMapMarker';
import AndroidMarker from './AndroidMarker';
import { useMapContext } from '../contexts/MapContext';


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

// Map IDs from Google Cloud Console
const MAP_IDS = {
  light: "f48cf5b0589cd8bf33ff62a3", 
  dark: "f48cf5b0589cd8bfd9dedc8e" 
};



export default function SafetyMap() {
  const { colors } = useTheme();
  const [location, setLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const { mapRef, userLocation, setUserLocation } = useMapContext();
  
  // Platform-specific configuration
  const isAndroid = Platform.OS === 'android';
  
  // Determine which approach to use based on platform
  const mapId = useMemo(() => {
    // On Android, use mapId approach with our cloud-stored styles
    if (isAndroid) {
      return colors.isDark ? MAP_IDS.dark : MAP_IDS.light;
    }
    // On iOS, we can use either approach
    return colors.isDark ? MAP_IDS.dark : MAP_IDS.light;
  }, [colors.isDark, isAndroid]);
  
  // Fallback custom style (primarily for iOS compatibility)
  const mapStyle = useMemo(() => (
    colors.isDark ? MAP_STYLES.dark : MAP_STYLES.light
  ), [colors.isDark]);



// Get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location is required for your safety.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      setUserLocation(current.coords);
    })();
  }, [setUserLocation]);

  // temporal friends location code:
const [friends, setFriends] = useState([
  {
    id: 1,
    name: "Unathi Gumede",
    location: {
      latitude: -26.1076,
      longitude: 28.0567
    },
    description: "Sandton City",
    avatar: require('../images/profile-pictures/junior.jpeg')
  },
  {
    id: 2,
    name: "Chayenne Luthuli",
    location: {
      latitude: -26.1184,
      longitude: 28.0603
    },
    description: "Melrose Arch",
    avatar: require('../images/profile-pictures/cheyenne.jpeg')
  },
  {
    id: 3,
    name: "Musa Buthelezi",
    location: {
      latitude: -26.2034,
      longitude: 28.0456
    },
    description: "Maboneng Precinct",
    avatar: require('../images/profile-pictures/Musa.jpeg')
  },
  {
    id: 4,
    name: "Junior Madiba",
    location: {
      latitude: -33.9056,
      longitude: 18.4189
    },
    description: "V&A Waterfront",
   avatar: require('../images/profile-pictures/junior.jpeg')
  },
  {
    id: 5,
    name: "Kevin Serakalala",
    location: {
      latitude: 25.2048,  
      longitude: 55.2708
    },
    description: "Dubai, UAE",
    avatar: require('../images/profile-pictures/junior.jpeg'),
    isInternational: true
  },
  {
    id: 6,
    name: "Siphephile Mtshali",
    location: {
      latitude: -29.8587,  
      longitude: 31.0218
    },
    description: "Durban Beachfront",
   avatar: require('../images/profile-pictures/siphe.jpeg')
  },
  {
    id: 7,
    name: "Okuhle Mgudlwa",
    location: {
      latitude: 53.4830,  
      longitude: -2.2444
    },
    description: "Manchester, UK",
    avatar: require('../images/profile-pictures/Musa.jpeg'),
    isInternational: true
  }
]);
  
  const FriendMarker = ({ friend, onPress }) => (
  <Marker
    coordinate={friend.location}
    title={friend.name}
    description={friend.description}
    onPress={onPress}
  >
    <View style={styles.friendMarker}>
      <Image source={friend.avatar} style={styles.friendAvatar} />
    </View>
  </Marker>
);



  // Initial region calculation
  const initialRegion = useMemo(() => {
    if (!userLocation) return null;
    
    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.26262139386467,
      longitudeDelta: 0.13496406376361492
    };
  }, [userLocation]);

  // const onRegionChangeComplete = (region) => {
  //   console.log("region", region);
  // };

  return (
   <View style={styles.container}>
      {/* Main Map View */}
      {userLocation && mapReady && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider="google"
          customMapStyle={!isAndroid ? mapStyle : mapId} 
          googleMapId={isAndroid ? mapId : undefined}
          showsMyLocationButton={false} // Disable default button
          showsCompass={true}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={false}
          toolbarEnabled={false}
          initialRegion={initialRegion}
          zoomEnabled={true}
          // onRegionChangeComplete={onRegionChangeComplete}
        >
          {/* user marker */}
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="My Location"
            anchor={{ x: 0.5, y: 1 }} 
            pinColor={Platform.OS === 'android' ? "#FF0000" : undefined} // Android-only
          >
            {Platform.OS === 'ios' && <UserMapMarker />}
          </Marker>


          {/* Friend Markers */}
          {friends.map((friend) => (
            <FriendMarker 
              key={friend.id}
              friend={friend}
              onPress={() => {
                // Handle marker press (e.g., show more info)
                Alert.alert(
                  friend.name,
                  `${friend.description}\nLast updated: 10 mins ago`,
                  [
                    { text: "OK" },
                    { text: "Navigate", onPress: () => openNavigation(friend.location) }
                  ]
                );
              }}
            />
          ))}
        </MapView>
      )}


      
      {/* Hidden MapView for initialization */}
      {!mapReady && (
        <MapView
          style={[StyleSheet.absoluteFillObject, { opacity: 0 }]}
          provider={PROVIDER_GOOGLE}
          onMapReady={() => setMapReady(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  androidMarker: {
    width: 50,
    height: 50,
    backgroundColor: '#C80110',
    borderRadius: 25
  },
  friendMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  friendAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
});