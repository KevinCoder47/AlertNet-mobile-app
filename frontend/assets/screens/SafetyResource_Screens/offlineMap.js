import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  PanResponder,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Feather';
import OfflineMapService from '../../services/OfflineMapService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const OfflineMap = ({ setIsOfflineMap, setIsSafetyResources }) => {
  const [mapRegion, setMapRegion] = useState({
    latitude: -26.183,
    longitude: 27.999,
    latitudeDelta: 0.04,
    longitudeDelta: 0.02,
  });
  const [downloadSize, setDownloadSize] = useState(55);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  
  // Selection box state
  const [selectionBox, setSelectionBox] = useState({
    x: screenWidth * 0.125,
    y: screenHeight * 0.25,
    width: screenWidth * 0.75,
    height: screenHeight * 0.4,
  });
  
  const mapRef = useRef(null);

  useEffect(() => {
    updateDownloadSize();
  }, [mapRegion]);

  const updateDownloadSize = () => {
    const size = OfflineMapService.calculateDownloadSize(mapRegion);
    setDownloadSize(size);
  };

  const handleRegionChange = (region) => {
    setMapRegion(region);
  };

  const updateMapRegionFromSelection = () => {
    // Calculate lat/lng deltas based on box size
    const latDelta = (selectionBox.height / screenHeight) * 0.08;
    const lngDelta = (selectionBox.width / screenWidth) * 0.08;
    
    const newRegion = {
      ...mapRegion,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
    
    setMapRegion(newRegion);
  };

  // Pan responder for dragging the selection box
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (evt, gestureState) => {
        const newX = Math.max(0, Math.min(screenWidth - selectionBox.width, selectionState.startX + gestureState.dx));
        const newY = Math.max(100, Math.min(screenHeight - selectionBox.height - 200, selectionState.startY + gestureState.dy));
        
        setSelectionBox(prev => ({
          ...prev,
          x: newX,
          y: newY,
        }));
      },
      onPanResponderRelease: () => {
        updateMapRegionFromSelection();
      },
    })
  ).current;

  const [selectionState] = useState({ startX: 0, startY: 0 });

  const handleSelectionStart = () => {
    selectionState.startX = selectionBox.x;
    selectionState.startY = selectionBox.y;
  };

  const handleDownload = async () => {
    Alert.alert(
      'Download Offline Map',
      `This will download approximately ${downloadSize} MB of map data. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: startDownload }
      ]
    );
  };

  const startDownload = async () => {
    setIsDownloading(true);
    setShowProgress(true);
    setDownloadProgress(0);

    const result = await OfflineMapService.downloadMapTiles(
      mapRegion,
      (progress) => {
        setDownloadProgress(progress.percentage);
      }
    );

    setIsDownloading(false);
    setShowProgress(false);

    if (result.success) {
      Alert.alert(
        'Download Complete',
        `Successfully downloaded ${result.tilesDownloaded} map tiles. The map is now available offline.`,
        [{ text: 'OK', onPress: () => { setIsOfflineMap(false); setIsSafetyResources(true); } }]
      );
    } else {
      Alert.alert('Download Failed', result.error || 'Failed to download map tiles.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- Background Map --- */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation={true}
        customMapStyle={mapStyle}
        scrollEnabled={true}
        zoomEnabled={true}
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
            <TouchableOpacity onPress={() => {
              setIsOfflineMap(false);
              setIsSafetyResources(true);
            }}>
              <Icon name="menu" size={26} color="#333" style={styles.icon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Interactive Map Selection Area --- */}
        <View 
          style={[
            styles.selectionContainer,
            {
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.width,
              height: selectionBox.height,
            }
          ]}
          {...panResponder.panHandlers}
          onTouchStart={handleSelectionStart}
        >
          <View style={styles.selectionBox}>
            {/* Corner Handles */}
            <View style={[styles.cornerHandle, styles.topLeft]} />
            <View style={[styles.cornerHandle, styles.topRight]} />
            <View style={[styles.cornerHandle, styles.bottomLeft]} />
            <View style={[styles.cornerHandle, styles.bottomRight, styles.resizeHandle]} />
            
            {/* Drag indicator */}
            <View style={styles.dragIndicator}>
              <Text style={styles.dragText}>Drag to move selection area</Text>
            </View>
          </View>
        </View>
        
        {/* --- Size Info Label --- */}
        <View style={styles.sizeLabel}>
            <Text style={styles.sizeText}>The size of the selected map: {downloadSize} MB</Text>
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
          <TouchableOpacity 
            style={[styles.button, styles.downloadButton, isDownloading && styles.disabledButton]}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            <Icon name="download" size={18} color="#fff" />
            <Text style={styles.buttonText}>{isDownloading ? 'Downloading...' : 'Download'}</Text>
          </TouchableOpacity>
        </View>

        {/* Download Progress Modal */}
        <Modal visible={showProgress} transparent animationType="fade">
          <View style={styles.progressOverlay}>
            <View style={styles.progressContainer}>
              <Text style={styles.progressTitle}>Downloading Map</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{downloadProgress}% Complete</Text>
            </View>
          </View>
        </Modal>
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
    position: 'absolute',
    zIndex: 10,
  },
  selectionBox: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(231, 76, 60, 0.8)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  cornerHandle: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: '#e74c3c',
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
  },
  resizeHandle: {
    backgroundColor: '#e74c3c',
    borderRadius: 12.5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  dragIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -10 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dragText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
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
  disabledButton: {
    opacity: 0.6,
  },
  progressOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    width: '80%',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
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