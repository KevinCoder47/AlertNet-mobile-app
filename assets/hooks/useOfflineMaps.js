import { useState, useEffect } from 'react';
import { auth } from '../../../backend/Firebase/FirebaseConfig';
import { OfflineMapFirebaseService } from '../../../backend/Firebase/OfflineMapFirebaseService';
import OfflineMapService from '../../services/OfflineMapService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useOfflineMaps = () => {
  const [localMaps, setLocalMaps] = useState([]);
  const [firebaseMaps, setFirebaseMaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load local maps from AsyncStorage
  const loadLocalMaps = async () => {
    try {
      const maps = await AsyncStorage.getItem('downloadedMaps');
      if (maps) {
        setLocalMaps(JSON.parse(maps));
      }
    } catch (err) {
      console.error('Error loading local maps:', err);
      setError('Failed to load local maps');
    }
  };

  // Load Firebase maps for authenticated user
  const loadFirebaseMaps = async () => {
    if (!auth.currentUser) {
      setFirebaseMaps([]);
      return;
    }

    try {
      setLoading(true);
      const result = await OfflineMapFirebaseService.getUserOfflineMaps();
      if (result.success) {
        setFirebaseMaps(result.maps);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error loading Firebase maps:', err);
      setError('Failed to load synced maps');
    } finally {
      setLoading(false);
    }
  };

  // Sync local maps with Firebase
  const syncMaps = async () => {
    if (!auth.currentUser) return;

    try {
      await OfflineMapService.syncWithFirebase();
      await loadFirebaseMaps();
    } catch (err) {
      console.error('Error syncing maps:', err);
      setError('Failed to sync maps');
    }
  };

  // Save map data (both local and Firebase)
  const saveMap = async (mapData) => {
    try {
      // Save locally
      const updatedLocalMaps = [...localMaps, mapData];
      setLocalMaps(updatedLocalMaps);
      await AsyncStorage.setItem('downloadedMaps', JSON.stringify(updatedLocalMaps));

      // Save to Firebase if authenticated
      if (auth.currentUser) {
        const result = await OfflineMapFirebaseService.saveOfflineMapData(mapData);
        if (result.success) {
          await loadFirebaseMaps();
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Error saving map:', err);
      setError('Failed to save map');
      return { success: false, error: err.message };
    }
  };

  // Delete map (both local and Firebase)
  const deleteMap = async (mapId) => {
    try {
      // Delete locally
      const updatedLocalMaps = localMaps.filter(map => map.id !== mapId);
      setLocalMaps(updatedLocalMaps);
      await AsyncStorage.setItem('downloadedMaps', JSON.stringify(updatedLocalMaps));

      // Delete from device storage and Firebase
      await OfflineMapService.deleteOfflineMap(mapId);
      
      // Refresh Firebase maps
      if (auth.currentUser) {
        await loadFirebaseMaps();
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting map:', err);
      setError('Failed to delete map');
      return { success: false, error: err.message };
    }
  };

  // Record map access
  const recordMapAccess = async (mapId) => {
    try {
      if (auth.currentUser) {
        await OfflineMapFirebaseService.recordMapAccess(mapId);
        // Refresh Firebase maps to show updated access count
        await loadFirebaseMaps();
      }
    } catch (err) {
      console.error('Error recording map access:', err);
    }
  };

  // Get map usage statistics
  const getMapStats = async (mapId) => {
    try {
      if (!auth.currentUser) return { success: false, error: 'User not authenticated' };
      
      return await OfflineMapFirebaseService.getMapUsageStats(mapId);
    } catch (err) {
      console.error('Error getting map stats:', err);
      return { success: false, error: err.message };
    }
  };

  // Get map update history
  const getMapHistory = async (mapId = null) => {
    try {
      if (!auth.currentUser) return { success: false, error: 'User not authenticated' };
      
      return await OfflineMapFirebaseService.getMapUpdateHistory(mapId);
    } catch (err) {
      console.error('Error getting map history:', err);
      return { success: false, error: err.message };
    }
  };

  // Get complete map data (map + stats + history)
  const getCompleteMapData = async (mapId) => {
    try {
      if (!auth.currentUser) return { success: false, error: 'User not authenticated' };
      
      return await OfflineMapFirebaseService.getCompleteMapData(mapId);
    } catch (err) {
      console.error('Error getting complete map data:', err);
      return { success: false, error: err.message };
    }
  };

  // Initialize - load maps on mount and auth state change
  useEffect(() => {
    loadLocalMaps();
  }, []);

  useEffect(() => {
    loadFirebaseMaps();
  }, [auth.currentUser]);

  // Auto-sync when user logs in
  useEffect(() => {
    if (auth.currentUser && localMaps.length > 0) {
      syncMaps();
    }
  }, [auth.currentUser, localMaps.length]);

  return {
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
    refreshMaps: () => {
      loadLocalMaps();
      loadFirebaseMaps();
    },
    clearError: () => setError(null)
  };
};