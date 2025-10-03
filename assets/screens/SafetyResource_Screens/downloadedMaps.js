import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineMapFirebaseService } from '../../../backend/Firebase/OfflineMapFirebaseService';
import OfflineMapService from '../../services/OfflineMapService';
import { auth } from '../../../backend/Firebase/FirebaseConfig';
import OfflineMapViewer from './OfflineMapViewer';
import { useFontSize } from '../../contexts/FontSizeContext';
import { useTheme } from '../../contexts/ColorContext'; // ✅ Theme import

const { width, height } = Dimensions.get('window');

const DownloadedMaps = ({ navigation, setIsOfflineMap, setIsDownloadedMaps, downloadedMaps, setDownloadedMaps }) => {
  const { getScaledFontSize } = useFontSize();
  const { colors } = useTheme(); // ✅ Use theme
  
  const [firebaseMaps, setFirebaseMaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMap, setSelectedMap] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    loadFirebaseMaps();
  }, []);

  const loadFirebaseMaps = async () => {
    if (auth.currentUser) {
      setLoading(true);
      const result = await OfflineMapFirebaseService.getUserOfflineMaps();
      if (result.success) {
        setFirebaseMaps(result.maps);
        console.log("result", result.maps)
      }
      setLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    Alert.alert(
      'Update Map',
      'This will re-download the map with the latest data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: async () => {
            try {
              if (auth.currentUser) {
                await OfflineMapFirebaseService.addMapUpdateHistory(id, 'updated', 'Map update initiated by user');
              }
              Alert.alert('Update Started', 'Map update has been initiated. You can monitor progress in the download section.');
              setIsDownloadedMaps(false);
              setIsOfflineMap(true);
            } catch (error) {
              console.error('Failed to update map', error);
              Alert.alert('Error', 'Failed to update map. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleMapAccess = async (mapId) => {
    if (auth.currentUser) {
      await OfflineMapFirebaseService.recordMapAccess(mapId);
    }
    const allMaps = [...downloadedMaps, ...firebaseMaps];
    const mapToView = allMaps.find(m => m.id === mapId);
    if (mapToView) {
      handleViewMap(mapToView);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Map',
      'Are you sure you want to delete this offline map? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updatedMaps = downloadedMaps.filter(map => map.id !== id);
            setDownloadedMaps(updatedMaps);
            try {
              await AsyncStorage.setItem('downloadedMaps', JSON.stringify(updatedMaps));
              await OfflineMapService.deleteOfflineMap(id);
              await loadFirebaseMaps();
            } catch (error) {
              console.error('Failed to delete map', error);
              Alert.alert('Error', 'Failed to delete map. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleAddMap = () => {
    setIsDownloadedMaps(false);
    setIsOfflineMap(true);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleViewMap = (map) => {
    if (auth.currentUser) {
      OfflineMapFirebaseService.recordMapAccess(map.id);
    }
    setSelectedMap(map);
    setShowMapModal(true);
  };

  const MapCard = ({ map, isFirebaseMap = false }) => {
    const displayExpiryDate = isFirebaseMap && map.expiryDate 
      ? (map.expiryDate.seconds ? new Date(map.expiryDate.seconds * 1000).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long', 
          year: 'numeric'
        }) : map.expiryDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long', 
          year: 'numeric'
        }))
      : map.expiryDate;

    const displaySize = isFirebaseMap ? `${map.size || 'Unknown'} MB` : map.size;
    
    return (
      <TouchableOpacity 
        style={[styles.mapCard, { backgroundColor: colors.card || colors.surface }]}
        onPress={() => handleViewMap(map)}
        activeOpacity={0.7}
      >
        <View style={styles.mapCardHeader}>
          <View style={styles.mapInfo}>
            <View style={[styles.mapThumbnail, { backgroundColor: colors.surface }]}>
              <Ionicons name="map" size={24} color={colors.primary || "#3B82F6"} />
            </View>
            <View style={styles.mapDetails}>
              <Text style={[styles.mapName, { color: colors.text, fontSize: getScaledFontSize(16) }]}>{map.name}</Text>
              <Text style={[styles.mapSize, { color: colors.textSecondary || colors.text, fontSize: getScaledFontSize(14) }]}>{displaySize}</Text>
            </View>
          </View>
          <View style={styles.mapStatus}>
            <Ionicons name="location" size={20} color={colors.textSecondary || "#9CA3AF"} />
            {isFirebaseMap && (
              <View style={styles.syncIndicator}>
                <Ionicons name="cloud-done" size={16} color="#10B981" />
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.mapCardFooter}>
          <Text style={[styles.expiryText, { color: colors.textSecondary || colors.text, fontSize: getScaledFontSize(12) }]}>Expires on {displayExpiryDate}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary ? `${colors.primary}33` : 'rgba(255, 255, 255, 0.2)' }]} 
              onPress={(e) => { e.stopPropagation(); handleUpdate(map.id); }} 
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={14} color={colors.text} />
              <Text style={[styles.buttonText, { color: colors.text, fontSize: getScaledFontSize(12) }]}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary ? `${colors.primary}33` : 'rgba(255, 255, 255, 0.2)' }]} 
              onPress={(e) => { e.stopPropagation(); handleDelete(map.id); }} 
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={14} color="#FCA5A5" />
              <Text style={[styles.buttonText, styles.deleteButtonText, { fontSize: getScaledFontSize(12) }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card || colors.surface, shadowColor: colors.shadow || '#000' }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: getScaledFontSize(18) }]}>Offline Map</Text>
      </View>

      {/* Subtitle */}
      <View style={[styles.subtitleContainer, { backgroundColor: colors.card || colors.surface, borderBottomColor: colors.border || '#E5E7EB' }]}>
        <Text style={[styles.subtitleText, { color: colors.textSecondary || colors.text, fontSize: getScaledFontSize(14) }]}>
          Please make sure you update the offline map before they expire
          or view them
        </Text>
      </View>

      {/* Map Cards */}
      <ScrollView style={[styles.scrollContainer, { backgroundColor: colors.surface }]} showsVerticalScrollIndicator={false}>
        <View style={styles.mapList}>
          {auth.currentUser && firebaseMaps.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getScaledFontSize(16) }]}>Synced Maps</Text>
              {firebaseMaps.map((map) => (
                <MapCard key={`firebase_${map.id}`} map={map} isFirebaseMap={true} />
              ))}
            </>
          )}
          
          {downloadedMaps.length > 0 && (
            <>
              {auth.currentUser && firebaseMaps.length > 0 && (
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getScaledFontSize(16) }]}>Local Maps</Text>
              )}
              {downloadedMaps.map((map) => (
                <MapCard key={`local_${map.id}`} map={map} />
              ))}
            </>
          )}
          
          {downloadedMaps.length === 0 && firebaseMaps.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={64} color={colors.textSecondary || "#9CA3AF"} />
              <Text style={[styles.emptyText, { color: colors.text, fontSize: getScaledFontSize(18) }]}>No offline maps downloaded</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary || colors.text, fontSize: getScaledFontSize(14) }]}>
                {auth.currentUser 
                  ? 'Tap ADD to download your first map and sync it to your account'
                  : 'Tap ADD to download your first map'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Button */}
      <View style={[styles.addButtonContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary || '#4B5563' }]} onPress={handleAddMap}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={[styles.addButtonText, {color: colors.mode === 'light' ? '#FFFFFF' : '#000000', fontSize: getScaledFontSize(16) }]}>ADD</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={false}
        visible={showMapModal}
        onRequestClose={() => {
          setShowMapModal(false);
          setSelectedMap(null);
        }}
      >
        <OfflineMapViewer 
          map={selectedMap} 
          onClose={() => setShowMapModal(false)} 
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: { 
    marginRight: 16 
  },
  headerTitle: { 
    fontWeight: '600' 
  },
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  subtitleText: { 
    // color handled dynamically
  },
  scrollContainer: { 
    flex: 1 
  },
  mapList: { 
    padding: 16, 
    gap: 16 
  },
  mapCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mapInfo: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    flex: 1 
  },
  mapThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mapDetails: { 
    flex: 1 
  },
  mapName: { 
    fontWeight: '500', 
    marginBottom: 4 
  },
  mapSize: { 
    // color handled dynamically
  },
  mapCardFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  expiryText: { 
    // color handled dynamically
  },
  buttonContainer: { 
    flexDirection: 'row', 
    gap: 8 
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteButtonText: { 
    color: '#FCA5A5' 
  },
  buttonText: { 
    fontWeight: '500' 
  },
  addButtonContainer: { 
    padding: 16, 
    paddingBottom: 24 
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: { 
    fontWeight: '600'
    //color: '#000000'
  },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 60 
  },
  emptyText: { 
    fontWeight: '500', 
    marginTop: 16 
  },
  emptySubtext: { 
    marginTop: 8, 
    textAlign: 'center', 
    paddingHorizontal: 20 
  },
  sectionTitle: { 
    fontWeight: '600', 
    marginBottom: 12, 
    marginTop: 8 
  },
  mapImage: { 
    width: 300, 
    height: 200 
  },
  mapStatus: { 
    alignItems: 'center' 
  },
  syncIndicator: { 
    marginTop: 4 
  },
});

export default DownloadedMaps;