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

const { width, height } = Dimensions.get('window');


const DownloadedMaps = ({ navigation, setIsOfflineMap, setIsDownloadedMaps, downloadedMaps, setDownloadedMaps }) => {
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
              // Record the update in Firebase
              if (auth.currentUser) {
                await OfflineMapFirebaseService.addMapUpdateHistory(id, 'updated', 'Map update initiated by user');
              }
              
              Alert.alert('Update Started', 'Map update has been initiated. You can monitor progress in the download section.');
              
              // Navigate to offline map screen for re-download
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
    // Record map access for usage statistics
    if (auth.currentUser) {
      await OfflineMapFirebaseService.recordMapAccess(mapId);
    }
    // Then show the map
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
            // Delete from local storage
            const updatedMaps = downloadedMaps.filter(map => map.id !== id);
            setDownloadedMaps(updatedMaps);
            
            try {
              await AsyncStorage.setItem('downloadedMaps', JSON.stringify(updatedMaps));
              
              // Delete from device storage and Firebase
              await OfflineMapService.deleteOfflineMap(id);
              
              // Refresh Firebase maps
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
    // Record map access for usage statistics
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
        style={styles.mapCard}
        onPress={() => handleViewMap(map)}
        activeOpacity={0.7}
      >
        <View style={styles.mapCardHeader}>
          <View style={styles.mapInfo}>
            <View style={styles.mapThumbnail}>
              <Ionicons name="map" size={24} color="#3B82F6" />
            </View>
            <View style={styles.mapDetails}>
              <Text style={styles.mapName}>{map.name}</Text>
              <Text style={styles.mapSize}>{displaySize}</Text>

            </View>
          </View>
          <View style={styles.mapStatus}>
            <Ionicons name="location" size={20} color="#9CA3AF" />
            {isFirebaseMap && (
              <View style={styles.syncIndicator}>
                <Ionicons name="cloud-done" size={16} color="#10B981" />
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.mapCardFooter}>
          <Text style={styles.expiryText}>Expires on {displayExpiryDate}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleUpdate(map.id); }} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={14} color="#FFFFFF" />
              <Text style={styles.buttonText}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleDelete(map.id); }} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={14} color="#FCA5A5" />
              <Text style={[styles.buttonText, styles.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline Map</Text>
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitleText}>
          Please make sure you update the offline map before they expire
          or view them
        </Text>
      </View>

      {/* Map Cards */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.mapList}>
          {/* Show Firebase maps if user is authenticated */}
          {auth.currentUser && firebaseMaps.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Synced Maps</Text>
              {firebaseMaps.map((map) => (
                <MapCard key={`firebase_${map.id}`} map={map} isFirebaseMap={true} />

              ))}


            </>
          )}
          
          {/* Show local maps */}
          {downloadedMaps.length > 0 && (
            <>
              {auth.currentUser && firebaseMaps.length > 0 && (
                <Text style={styles.sectionTitle}>Local Maps</Text>

              )}

              {downloadedMaps.map((map) => (
                <MapCard key={`local_${map.id}`} map={map} />
              ))}
            </>
          )}
          
          {/* Empty state */}
          {downloadedMaps.length === 0 && firebaseMaps.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No offline maps downloaded</Text>
              <Text style={styles.emptySubtext}>
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
      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddMap}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>ADD</Text>
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
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  subtitleContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subtitleText: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollContainer: {
    flex: 1,
  },
  mapList: {
    padding: 16,
    gap: 16,
  },
  mapCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    flex: 1,
  },
  mapThumbnail: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mapDetails: {
    flex: 1,
  },
  mapName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  mapSize: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  mapCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expiryText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  deleteButtonText: {
    color: '#FCA5A5',
  },
  buttonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  addButtonContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  addButton: {
    backgroundColor: '#4B5563',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },

  mapImage: {
      width: 300,
      height: 200,
  },
  mapStatus: {
    alignItems: 'center',
  },
  syncIndicator: {
    marginTop: 4,
  },
});


export default DownloadedMaps;