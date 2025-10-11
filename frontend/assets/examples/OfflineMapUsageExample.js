// Example usage of Firebase Offline Maps functionality
// This file demonstrates how to use all the offline maps features

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useOfflineMaps } from '../hooks/useOfflineMaps';
import { OfflineMapFirebaseService } from '../../backend/Firebase/OfflineMapFirebaseService';
import { auth } from '../../backend/Firebase/FirebaseConfig';

const OfflineMapUsageExample = () => {
  const {
    localMaps,
    firebaseMaps,
    loading,
    error,
    saveMap,
    deleteMap,
    recordMapAccess,
    getMapStats,
    getMapHistory,
    getCompleteMapData,
    syncMaps,
    refreshMaps,
    clearError
  } = useOfflineMaps();

  const [selectedMapStats, setSelectedMapStats] = useState(null);
  const [mapHistory, setMapHistory] = useState([]);

  // Example: Save a new offline map
  const handleSaveExampleMap = async () => {
    const exampleMapData = {
      id: `example_map_${Date.now()}`,
      name: 'Example Campus Map',
      size: '45 MB',
      region: {
        latitude: -26.183,
        longitude: 27.999,
        latitudeDelta: 0.04,
        longitudeDelta: 0.02,
      },
      tileCount: 1250,
      downloadDate: new Date().toISOString()
    };

    const result = await saveMap(exampleMapData);
    if (result.success) {
      Alert.alert('Success', 'Example map saved successfully!');
    } else {
      Alert.alert('Error', 'Failed to save map');
    }
  };

  // Example: Get detailed map statistics
  const handleGetMapStats = async (mapId) => {
    const result = await getMapStats(mapId);
    if (result.success) {
      setSelectedMapStats(result.stats);
      Alert.alert('Map Statistics', `
        Total Accesses: ${result.stats.totalAccesses}
        Last Accessed: ${result.stats.lastAccessed?.toLocaleDateString()}
        Download Date: ${result.stats.downloadDate?.toLocaleDateString()}
      `);
    }
  };

  // Example: Get map update history
  const handleGetMapHistory = async (mapId = null) => {
    const result = await getMapHistory(mapId);
    if (result.success) {
      setMapHistory(result.history);
      // console.log($&);
    }
  };

  // Example: Get complete map data
  const handleGetCompleteMapData = async (mapId) => {
    const result = await getCompleteMapData(mapId);
    if (result.success) {
      // console.log($&);
      Alert.alert('Complete Data Retrieved', 'Check console for full details');
    }
  };

  // Example: Record map access
  const handleRecordAccess = async (mapId) => {
    await recordMapAccess(mapId);
    Alert.alert('Access Recorded', 'Map access has been logged');
  };

  // Example: Sync maps with Firebase
  const handleSyncMaps = async () => {
    if (!auth.currentUser) {
      Alert.alert('Authentication Required', 'Please log in to sync maps');
      return;
    }
    
    await syncMaps();
    Alert.alert('Sync Complete', 'Maps have been synced with Firebase');
  };

  // Example: Direct Firebase service usage
  const handleDirectFirebaseUsage = async () => {
    if (!auth.currentUser) {
      Alert.alert('Authentication Required', 'Please log in first');
      return;
    }

    try {
      // Example: Add update history entry
      await OfflineMapFirebaseService.addMapUpdateHistory(
        'example_map_123',
        'accessed',
        'Map accessed from example screen'
      );

      // Example: Update map metadata
      await OfflineMapFirebaseService.updateMapMetadata('example_map_123', {
        name: 'Updated Map Name',
        lastModified: new Date()
      });

      Alert.alert('Firebase Operations', 'Direct Firebase operations completed');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Offline Maps Firebase Integration Example
      </Text>

      {/* Authentication Status */}
      <View style={{ marginBottom: 20, padding: 15, backgroundColor: '#f0f0f0' }}>
        <Text style={{ fontWeight: 'bold' }}>
          Authentication Status: {auth.currentUser ? 'Logged In' : 'Not Logged In'}
        </Text>
        {auth.currentUser && (
          <Text>User: {auth.currentUser.email}</Text>
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View style={{ marginBottom: 20, padding: 15, backgroundColor: '#ffebee' }}>
          <Text style={{ color: 'red' }}>Error: {error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={{ color: 'blue', marginTop: 5 }}>Clear Error</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <Text style={{ marginBottom: 20, fontStyle: 'italic' }}>Loading...</Text>
      )}

      {/* Maps Summary */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Maps Summary</Text>
        <Text>Local Maps: {localMaps.length}</Text>
        <Text>Firebase Maps: {firebaseMaps.length}</Text>
      </View>

      {/* Action Buttons */}
      <View style={{ gap: 10 }}>
        <TouchableOpacity
          style={{ backgroundColor: '#2196F3', padding: 15, borderRadius: 5 }}
          onPress={handleSaveExampleMap}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Save Example Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#4CAF50', padding: 15, borderRadius: 5 }}
          onPress={handleSyncMaps}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Sync Maps with Firebase
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#FF9800', padding: 15, borderRadius: 5 }}
          onPress={refreshMaps}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Refresh Maps
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#9C27B0', padding: 15, borderRadius: 5 }}
          onPress={() => handleGetMapHistory()}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Get All Map History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#607D8B', padding: 15, borderRadius: 5 }}
          onPress={handleDirectFirebaseUsage}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Direct Firebase Operations
          </Text>
        </TouchableOpacity>
      </View>

      {/* Firebase Maps List */}
      {firebaseMaps.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Firebase Maps
          </Text>
          {firebaseMaps.map((map) => (
            <View key={map.id} style={{ 
              backgroundColor: '#e8f5e8', 
              padding: 15, 
              marginBottom: 10, 
              borderRadius: 5 
            }}>
              <Text style={{ fontWeight: 'bold' }}>{map.name}</Text>
              <Text>Size: {map.size} MB</Text>
              <Text>Access Count: {map.accessCount || 0}</Text>
              <Text>Downloaded: {map.downloadDate?.toLocaleDateString()}</Text>
              
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#2196F3', padding: 8, borderRadius: 3 }}
                  onPress={() => handleRecordAccess(map.id)}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>Record Access</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{ backgroundColor: '#4CAF50', padding: 8, borderRadius: 3 }}
                  onPress={() => handleGetMapStats(map.id)}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>Get Stats</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{ backgroundColor: '#FF9800', padding: 8, borderRadius: 3 }}
                  onPress={() => handleGetCompleteMapData(map.id)}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>Complete Data</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{ backgroundColor: '#f44336', padding: 8, borderRadius: 3 }}
                  onPress={() => deleteMap(map.id)}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Local Maps List */}
      {localMaps.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Local Maps
          </Text>
          {localMaps.map((map) => (
            <View key={map.id} style={{ 
              backgroundColor: '#fff3e0', 
              padding: 15, 
              marginBottom: 10, 
              borderRadius: 5 
            }}>
              <Text style={{ fontWeight: 'bold' }}>{map.name}</Text>
              <Text>Size: {map.size}</Text>
              <Text>Downloaded: {new Date(map.downloadDate).toLocaleDateString()}</Text>
              
              <TouchableOpacity
                style={{ backgroundColor: '#f44336', padding: 8, borderRadius: 3, marginTop: 10 }}
                onPress={() => deleteMap(map.id)}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Map History */}
      {mapHistory.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Map Update History
          </Text>
          {mapHistory.slice(0, 5).map((entry) => (
            <View key={entry.id} style={{ 
              backgroundColor: '#f5f5f5', 
              padding: 10, 
              marginBottom: 5, 
              borderRadius: 3 
            }}>
              <Text style={{ fontWeight: 'bold' }}>{entry.action}</Text>
              <Text>{entry.description}</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                {entry.timestamp?.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default OfflineMapUsageExample;