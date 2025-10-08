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
  TextInput,
  StatusBar,
  Platform,
  BackHandler,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Feather';
import OfflineMapService from '../../services/OfflineMapService';
import { OfflineMapFirebaseService } from '../../../backend/Firebase/OfflineMapFirebaseService';
import { auth } from '../../../backend/Firebase/FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineMapDiagnostics } from '../../services/OfflineMapDiagnostics';
import { useFontSize } from '../../contexts/FontSizeContext'; // Import font size context

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const OfflineMap = ({ setIsOfflineMap, setIsSafetyResources, setIsDownloadedMaps, downloadedMaps, setDownloadedMaps }) => {
  const { getScaledFontSize } = useFontSize(); // Use font size hook
  
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

  // State for naming the map after download
  const [showNameModal, setShowNameModal] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [downloadedMapData, setDownloadedMapData] = useState(null);
  
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
    // Sync with Firebase when component mounts
    if (auth.currentUser) {
      OfflineMapService.syncWithFirebase();
    }
  }, [mapRegion]);

  // Handle Android hardware back button
  useEffect(() => {
    const backAction = () => {
      handleGoBack();
      return true; // This prevents the app from closing
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    // Cleanup the event listener on component unmount
    return () => backHandler.remove();
  }, []);

  const handleGoBack = () => {
    setIsOfflineMap(false);
    setIsDownloadedMaps(true);
  };

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
        { text: 'Test First', onPress: runDiagnostics },
        { text: 'Download', onPress: startDownload }
      ]
    );
  };

  const runDiagnostics = async () => {
    Alert.alert('Running Diagnostics', 'Testing offline map functionality...');
    
    const result = await OfflineMapDiagnostics.testSingleTileDownload();
    const coordTest = await OfflineMapDiagnostics.testTileCoordinates(
      mapRegion.latitude, 
      mapRegion.longitude
    );
    
    const message = result.success 
      ? `✅ Diagnostics PASSED\n\nNetwork: OK\nFile System: OK\nTile Download: OK (${result.fileSize} bytes)\nCoordinates: ${coordTest.success ? 'Valid' : 'Invalid'}\n\nOffline maps should work correctly!`
      : `❌ Diagnostics FAILED\n\nError: ${result.error}\n\nPlease check your internet connection and try again.`;
    
    Alert.alert(
      result.success ? 'Diagnostics Passed' : 'Diagnostics Failed',
      message,
      result.success 
        ? [{ text: 'Download Now', onPress: startDownload }, { text: 'Cancel' }]
        : [{ text: 'OK' }]
    );
  };

  const handleSaveNewMap = async () => {
    if (!newMapName.trim()) {
      Alert.alert('Invalid Name', 'Please enter a name for your map.');
      return;
    }

    if (!downloadedMapData) {
      Alert.alert('Error', 'No map data to save.');
      setShowNameModal(false);
      return;
    }

    const { result, region, size } = downloadedMapData;

    // Create new map entry
    const mapId = result.mapId;
    const newMap = {
      id: mapId,
      name: newMapName.trim(),
      size: `${size} MB`,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      region: region,
      downloadDate: new Date().toISOString(),
      tileCount: result.tilesDownloaded,
      failedTiles: result.tilesFailed || 0,
      successRate: result.successRate || 100,
    };

    // Update downloaded maps
    const updatedMaps = [...downloadedMaps, newMap];
    setDownloadedMaps(updatedMaps);

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem('downloadedMaps', JSON.stringify(updatedMaps));
    } catch (error) {
      console.error('Failed to save downloaded map', error);
    }

    // Record the download in Firebase if user is authenticated
    if (auth.currentUser) {
      await OfflineMapFirebaseService.addMapUpdateHistory(mapId, 'downloaded', `Downloaded ${result.tilesDownloaded} tiles (${result.successRate}% success rate)`);
    }

    setShowNameModal(false);
    setDownloadedMapData(null);
    setNewMapName('');
    Alert.alert('Map Saved!', `"${newMap.name}" is now available offline.`, [{ text: 'OK', onPress: () => { setIsOfflineMap(false); setIsDownloadedMaps(true); } }]);
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
      // Store temporary data and show naming modal
      setDownloadedMapData({
        result: result,
        region: mapRegion,
        size: downloadSize,
      });
      setNewMapName(`Map ${downloadedMaps.length + 1}`); // Pre-fill with default name
      setShowNameModal(true);
    } else {
      Alert.alert('Download Failed', result.error || 'Failed to download map tiles. Please check your internet connection and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
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

        {/* --- Header --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: getScaledFontSize(16) }]}>
            Download Offline Map
          </Text>
          <View style={{ width: 24 }} />{/* Spacer */}
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
              <Text style={[styles.dragText, { fontSize: getScaledFontSize(10) }]}>
                Drag to move selection area
              </Text>
            </View>
          </View>
        </View>
        
        {/* --- Size Info Label --- */}
        <View style={styles.sizeLabel}>
            <Text style={[styles.sizeText, { fontSize: getScaledFontSize(14) }]}>
              The size of the selected map: {downloadSize} MB
            </Text>
        </View>


        {/* --- Bottom Action Buttons --- */}
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleGoBack}
          >
            <Text style={[styles.buttonText, { fontSize: getScaledFontSize(16) }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.downloadButton, isDownloading && styles.disabledButton]}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            <Icon name="download" size={18} color="#fff" />
            <Text style={[styles.buttonText, { fontSize: getScaledFontSize(16) }]}>
              {isDownloading ? 'Downloading...' : 'Download'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Download Progress Modal */}
        <Modal visible={showProgress} transparent animationType="fade">
          <View style={styles.progressOverlay}>
            <View style={styles.progressContainer}>
              <Text style={[styles.progressTitle, { fontSize: getScaledFontSize(18) }]}>
                Downloading Map
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
              </View>
              <Text style={[styles.progressText, { fontSize: getScaledFontSize(16) }]}>
                {downloadProgress}% Complete
              </Text>
              <Text style={[styles.progressSubText, { fontSize: getScaledFontSize(12) }]}>
                Downloading map tiles...
              </Text>
            </View>
          </View>
        </Modal>

        {/* Name Map Modal */}
        <Modal visible={showNameModal} transparent animationType="fade">
          <View style={styles.progressOverlay}>
            <View style={styles.progressContainer}>
              <Text style={[styles.progressTitle, { fontSize: getScaledFontSize(18) }]}>
                Download Complete!
              </Text>
              <Text style={[styles.progressSubText, { fontSize: getScaledFontSize(14), marginBottom: 20 }]}>
                Name your new offline map.
              </Text>
              <TextInput
                style={styles.nameInput}
                value={newMapName}
                onChangeText={setNewMapName}
                placeholder="e.g., Home Area"
                placeholderTextColor="#999"
                autoFocus={true}
              />
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={handleSaveNewMap}
              >
                <Icon name="arrow-right-circle" size={getScaledFontSize(50)} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

// --- Styles ---
// Updated styles with font sizes removed and added inline
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

  header: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 25,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {},
  headerTitle: {
    fontWeight: '600',
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
    fontWeight: '500'
  },
  bottomActions: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 15,
    paddingHorizontal: 20,
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
    color: '#666',
  },
  progressSubText: {
    color: '#999',
    marginTop: 5,
  },
  nameInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  arrowButton: {
    marginTop: 10,
    alignSelf: 'center',
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