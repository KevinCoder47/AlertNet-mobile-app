import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Feather'; // Using Feather icons

const OfflineMap = ({ setIsOfflineMap, setIsSafetyResources }) => {
  // Coordinates for the center of the map (University of Johannesburg)
  const mapRegion = {
    latitude: -26.183,
    longitude: 27.999,
    latitudeDelta: 0.04,
    longitudeDelta: 0.02,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- Background Map --- */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation={true}
        customMapStyle={mapStyle} // Applying a custom, clean map style
      />

      {/* --- Main Content Overlay --- */}
      <View style={styles.overlayContainer}>
        {/* --- Top Header Sheet --- */}
        <View style={styles.headerSheet}>
          <View style={styles.handleBar} />
          <View style={styles.headerContent}>
            <Image
              // Replace with your actual user profile image source
              source={require('../../images/kemal.jpg')}
              style={styles.profileImage}
            />
            <View style={styles.userInfo}>
              <Text style={styles.greetingText}>
                Hello, <Text style={styles.userName}>Mpilo</Text>
              </Text>
              <Text style={styles.locationText}>
                <Icon name="map-pin" size={12} color="#1abc9c" /> School, Auckland
                Park, Johannesburg
              </Text>
            </View>
            <TouchableOpacity>
              <Icon name="bell" size={24} color="#333" style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Icon name="menu" size={26} color="#333" style={styles.icon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Map Selection Area --- */}
        <View style={styles.selectionContainer}>
          <View style={styles.selectionBox}>
            {/* Corner Handles */}
            <View style={[styles.cornerHandle, styles.topLeft]} />
            <View style={[styles.cornerHandle, styles.topRight]} />
            <View style={[styles.cornerHandle, styles.bottomLeft]} />
            <View style={[styles.cornerHandle, styles.bottomRight]} />
          </View>
        </View>
        
        {/* --- Size Info Label --- */}
        <View style={styles.sizeLabel}>
            <Text style={styles.sizeText}>The size of the selected map: 55 MB</Text>
        </View>


        {/* --- Bottom Action Buttons --- */}
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              setIsOfflineMap(false);
              setIsSafetyResources(true);
            }}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.downloadButton]}>
            <Icon name="download" size={18} color="#fff" />
            <Text style={styles.buttonText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- Styles ---
// Meticulously crafted to match the provided design screenshot.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject, // Make map fill the entire screen
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerSheet: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 18,
    color: '#000',
  },
  userName: {
    fontWeight: 'bold',
  },
  locationText: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  icon: {
    marginLeft: 15,
  },
  selectionContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60, // Adjust to avoid overlap with bottom sheet/buttons
  },
  selectionBox: {
    width: '75%',
    height: '50%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(231, 76, 60, 0.7)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
  },
  cornerHandle: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: '#e74c3c',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  sizeLabel: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sizeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  bottomActions: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  downloadButton: {
    backgroundColor: 'rgba(100, 100, 100, 0.8)',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

// Custom map style to match the clean look in the screenshot
const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
];

export default OfflineMap;