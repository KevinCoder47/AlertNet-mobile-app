import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const OfflineMapViewer = ({ setIsOfflineMapViewer, setIsOfflineMap }) => {
  const [downloadedMaps, setDownloadedMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [mapTiles, setMapTiles] = useState([]);

  useEffect(() => {
    loadDownloadedMaps();
  }, []);

  const loadDownloadedMaps = async () => {
    try {
      const maps = await AsyncStorage.getItem('downloadedMaps');
      if (maps) {
        setDownloadedMaps(JSON.parse(maps));
      }
    } catch (error) {
      console.error('Error loading downloaded maps:', error);
    }
  };

  const viewMapTiles = async (map) => {
    try {
      const mapDir = `${FileSystem.documentDirectory}offline_maps/${map.id}/`;
      const dirInfo = await FileSystem.getInfoAsync(mapDir);
      
      if (!dirInfo.exists) {
        Alert.alert('Error', 'Map files not found. The map may have been deleted.');
        return;
      }

      const files = await FileSystem.readDirectoryAsync(mapDir);
      const tileFiles = files.filter(file => file.endsWith('.png')).slice(0, 9); // Show first 9 tiles
      
      const tiles = tileFiles.map(file => ({
        name: file,
        uri: mapDir + file
      }));
      
      setMapTiles(tiles);
      setSelectedMap(map);
    } catch (error) {
      console.error('Error loading map tiles:', error);
      Alert.alert('Error', 'Failed to load map tiles.');
    }
  };

  const deleteMap = async (mapId) => {
    Alert.alert(
      'Delete Map',
      'Are you sure you want to delete this offline map?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const mapDir = `${FileSystem.documentDirectory}offline_maps/${mapId}/`;
              await FileSystem.deleteAsync(mapDir, { idempotent: true });
              
              const updatedMaps = downloadedMaps.filter(map => map.id !== mapId);
              setDownloadedMaps(updatedMaps);
              await AsyncStorage.setItem('downloadedMaps', JSON.stringify(updatedMaps));
              
              if (selectedMap?.id === mapId) {
                setSelectedMap(null);
                setMapTiles([]);
              }
              
              Alert.alert('Success', 'Map deleted successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete map.');
            }
          }
        }
      ]
    );
  };

  const renderMapItem = ({ item }) => (
    <View style={styles.mapItem}>
      <View style={styles.mapInfo}>
        <Text style={styles.mapName}>{item.name}</Text>
        <Text style={styles.mapDetails}>Size: {item.size}</Text>
        <Text style={styles.mapDetails}>Tiles: {item.tileCount}</Text>
        <Text style={styles.mapDetails}>Downloaded: {new Date(item.downloadDate).toLocaleDateString()}</Text>
        {item.successRate && (
          <Text style={styles.mapDetails}>Success Rate: {item.successRate}%</Text>
        )}
      </View>
      <View style={styles.mapActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => viewMapTiles(item)}
        >
          <Icon name="eye" size={16} color="#fff" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteMap(item.id)}
        >
          <Icon name="trash-2" size={16} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTileItem = ({ item }) => (
    <View style={styles.tileContainer}>
      <Image source={{ uri: item.uri }} style={styles.tileImage} />
      <Text style={styles.tileName}>{item.name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsOfflineMapViewer(false)}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Downloaded Maps</Text>
        <TouchableOpacity onPress={() => {
          setIsOfflineMapViewer(false);
          setIsOfflineMap(true);
        }}>
          <Icon name="plus" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {downloadedMaps.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="map" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No offline maps downloaded</Text>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => {
              setIsOfflineMapViewer(false);
              setIsOfflineMap(true);
            }}
          >
            <Text style={styles.downloadButtonText}>Download Your First Map</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Maps List */}
          <View style={styles.mapsList}>
            <Text style={styles.sectionTitle}>Your Maps ({downloadedMaps.length})</Text>
            <FlatList
              data={downloadedMaps}
              renderItem={renderMapItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Tile Preview */}
          {selectedMap && mapTiles.length > 0 && (
            <View style={styles.tilesPreview}>
              <Text style={styles.sectionTitle}>
                {selectedMap.name} - Tile Preview
              </Text>
              <FlatList
                data={mapTiles}
                renderItem={renderTileItem}
                keyExtractor={(item) => item.name}
                numColumns={3}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mapsList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  mapItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mapInfo: {
    flex: 1,
  },
  mapName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  mapDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  mapActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tilesPreview: {
    maxHeight: 200,
    marginTop: 20,
  },
  tileContainer: {
    flex: 1,
    margin: 2,
    alignItems: 'center',
  },
  tileImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  tileName: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
  downloadButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OfflineMapViewer;