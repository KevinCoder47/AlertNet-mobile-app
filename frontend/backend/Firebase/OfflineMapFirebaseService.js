import { auth, db } from './FirebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs,
  deleteDoc,
  serverTimestamp,
  increment,
  query,
  where,
  orderBy
} from 'firebase/firestore';

export const OfflineMapFirebaseService = {
  // Store offline map data for authenticated user
  saveOfflineMapData: async (mapData) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const mapId = mapData.id || `map_${Date.now()}`;
      const mapRef = doc(db, 'users', currentUser.uid, 'offlineMaps', mapId);
      
      const offlineMapData = {
        id: mapId,
        name: mapData.name || `Map ${Date.now()}`,
        size: mapData.size,
        downloadDate: serverTimestamp(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        region: {
          latitude: mapData.region.latitude,
          longitude: mapData.region.longitude,
          latitudeDelta: mapData.region.latitudeDelta,
          longitudeDelta: mapData.region.longitudeDelta
        },
        tileCount: mapData.tileCount || 0,
        accessCount: 0,
        lastAccessed: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(mapRef, offlineMapData);
      
      // Also create initial usage statistics
      await OfflineMapFirebaseService.initializeMapUsageStats(currentUser.uid, mapId);
      
      return { success: true, mapId };
    } catch (error) {
      console.error('Error saving offline map data:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all offline maps for authenticated user
  getUserOfflineMaps: async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const mapsRef = collection(db, 'users', currentUser.uid, 'offlineMaps');
      const querySnapshot = await getDocs(query(mapsRef, orderBy('downloadDate', 'desc')));
      
      const maps = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        maps.push({
          id: doc.id,
          ...data,
          downloadDate: data.downloadDate?.toDate(),
          lastAccessed: data.lastAccessed?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });

      return { success: true, maps };
    } catch (error) {
      console.error('Error getting user offline maps:', error);
      return { success: false, error: error.message, maps: [] };
    }
  },

  // Update map access statistics
  recordMapAccess: async (mapId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return { success: false, error: 'User not authenticated' };

      const mapRef = doc(db, 'users', currentUser.uid, 'offlineMaps', mapId);
      const statsRef = doc(db, 'users', currentUser.uid, 'mapUsageStats', mapId);
      
      // Update map access count and last accessed time
      await updateDoc(mapRef, {
        accessCount: increment(1),
        lastAccessed: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update usage statistics
      await updateDoc(statsRef, {
        totalAccesses: increment(1),
        lastAccessed: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error recording map access:', error);
      return { success: false, error: error.message };
    }
  },

  // Initialize usage statistics for a new map
  initializeMapUsageStats: async (userId, mapId) => {
    try {
      const statsRef = doc(db, 'users', userId, 'mapUsageStats', mapId);
      
      const statsData = {
        mapId,
        totalAccesses: 0,
        downloadDate: serverTimestamp(),
        lastAccessed: serverTimestamp(),
        accessHistory: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(statsRef, statsData);
      return { success: true };
    } catch (error) {
      console.error('Error initializing map usage stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Get usage statistics for a specific map
  getMapUsageStats: async (mapId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const statsRef = doc(db, 'users', currentUser.uid, 'mapUsageStats', mapId);
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        const data = statsDoc.data();
        return {
          success: true,
          stats: {
            ...data,
            downloadDate: data.downloadDate?.toDate(),
            lastAccessed: data.lastAccessed?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          }
        };
      }
      
      return { success: false, error: 'Stats not found' };
    } catch (error) {
      console.error('Error getting map usage stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete offline map data
  deleteOfflineMapData: async (mapId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const mapRef = doc(db, 'users', currentUser.uid, 'offlineMaps', mapId);
      const statsRef = doc(db, 'users', currentUser.uid, 'mapUsageStats', mapId);
      
      // Add to update history before deletion
      await OfflineMapFirebaseService.addMapUpdateHistory(mapId, 'deleted', 'Map deleted by user');
      
      // Delete map data and statistics
      await deleteDoc(mapRef);
      await deleteDoc(statsRef);

      return { success: true };
    } catch (error) {
      console.error('Error deleting offline map data:', error);
      return { success: false, error: error.message };
    }
  },

  // Add entry to map update history
  addMapUpdateHistory: async (mapId, action, description = '') => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return { success: false, error: 'User not authenticated' };

      const historyRef = doc(collection(db, 'users', currentUser.uid, 'mapUpdateHistory'));
      
      const historyData = {
        mapId,
        action, // 'downloaded', 'accessed', 'updated', 'deleted'
        description,
        timestamp: serverTimestamp(),
        userId: currentUser.uid
      };

      await setDoc(historyRef, historyData);
      return { success: true };
    } catch (error) {
      console.error('Error adding map update history:', error);
      return { success: false, error: error.message };
    }
  },

  // Get map update history for user
  getMapUpdateHistory: async (mapId = null) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const historyRef = collection(db, 'users', currentUser.uid, 'mapUpdateHistory');
      let historyQuery = query(historyRef, orderBy('timestamp', 'desc'));
      
      if (mapId) {
        historyQuery = query(historyRef, where('mapId', '==', mapId), orderBy('timestamp', 'desc'));
      }

      const querySnapshot = await getDocs(historyQuery);
      const history = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate()
        });
      });

      return { success: true, history };
    } catch (error) {
      console.error('Error getting map update history:', error);
      return { success: false, error: error.message, history: [] };
    }
  },

  // Update map metadata
  updateMapMetadata: async (mapId, updates) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const mapRef = doc(db, 'users', currentUser.uid, 'offlineMaps', mapId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(mapRef, updateData);
      
      // Add to update history
      await OfflineMapFirebaseService.addMapUpdateHistory(mapId, 'updated', 'Map metadata updated');

      return { success: true };
    } catch (error) {
      console.error('Error updating map metadata:', error);
      return { success: false, error: error.message };
    }
  },

  // Get comprehensive map data including stats and history
  getCompleteMapData: async (mapId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Get map data
      const mapRef = doc(db, 'users', currentUser.uid, 'offlineMaps', mapId);
      const mapDoc = await getDoc(mapRef);
      
      if (!mapDoc.exists()) {
        return { success: false, error: 'Map not found' };
      }

      // Get usage stats
      const statsResult = await OfflineMapFirebaseService.getMapUsageStats(mapId);
      
      // Get update history
      const historyResult = await OfflineMapFirebaseService.getMapUpdateHistory(mapId);

      const mapData = mapDoc.data();
      
      return {
        success: true,
        data: {
          map: {
            id: mapDoc.id,
            ...mapData,
            downloadDate: mapData.downloadDate?.toDate(),
            lastAccessed: mapData.lastAccessed?.toDate(),
            createdAt: mapData.createdAt?.toDate(),
            updatedAt: mapData.updatedAt?.toDate()
          },
          stats: statsResult.success ? statsResult.stats : null,
          history: historyResult.success ? historyResult.history : []
        }
      };
    } catch (error) {
      console.error('Error getting complete map data:', error);
      return { success: false, error: error.message };
    }
  }
};