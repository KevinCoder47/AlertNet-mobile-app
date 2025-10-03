import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineMapFirebaseService } from '../../backend/Firebase/OfflineMapFirebaseService';
import { auth } from '../../backend/Firebase/FirebaseConfig';

class OfflineMapService {
  static TILE_SIZE = 256;
  static MIN_ZOOM_LEVEL = 14;
  static MAX_ZOOM_LEVEL = 17;
  static MAP_TILES_DIR = `${FileSystem.documentDirectory}offline_maps/`;
  static MAX_RETRIES = 3;
  static RETRY_DELAY = 1000;

  static async initializeStorage() {
    const dirInfo = await FileSystem.getInfoAsync(this.MAP_TILES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.MAP_TILES_DIR, { intermediates: true });
    }
  }

  static async checkNetworkConnectivity() {
    try {
      const testUrl = 'https://tile.openstreetmap.org/0/0/0.png';
      const response = await fetch(testUrl, { method: 'HEAD', timeout: 5000 });
      return response.ok;
    } catch (error) {
      console.error('Network connectivity check failed:', error);
      return false;
    }
  }

  static async validateTileFile(filePath) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists && fileInfo.size > 1000; // Minimum size for a valid tile
    } catch (error) {
      return false;
    }
  }

  static deg2num(lat, lon, zoom) {
    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lon + 180) / 360) * n);
    const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
    return { x, y };
  }

  static calculateTileCount(region) {
    let totalTiles = 0;
    for (let zoom = this.MIN_ZOOM_LEVEL; zoom <= this.MAX_ZOOM_LEVEL; zoom++) {
      const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
      
      const northLat = latitude + latitudeDelta / 2;
      const southLat = latitude - latitudeDelta / 2;
      const eastLon = longitude + longitudeDelta / 2;
      const westLon = longitude - longitudeDelta / 2;

      const topLeft = this.deg2num(northLat, westLon, zoom);
      const bottomRight = this.deg2num(southLat, eastLon, zoom);

      const tilesX = Math.abs(bottomRight.x - topLeft.x) + 1;
      const tilesY = Math.abs(bottomRight.y - topLeft.y) + 1;
      
      totalTiles += tilesX * tilesY;
    }
    return totalTiles;
  }

  static calculateDownloadSize(region) {
    const tileCount = this.calculateTileCount(region);
    const avgTileSize = 15; // KB per tile (approximate)
    return Math.round((tileCount * avgTileSize) / 1024); // MB
  }

  static async downloadMapTiles(region, onProgress) {
    await this.initializeStorage();
    
    // Check network connectivity first
    const hasNetwork = await this.checkNetworkConnectivity();
    if (!hasNetwork) {
      return { success: false, error: 'No network connectivity. Please check your internet connection.' };
    }
    
    const totalTiles = this.calculateTileCount(region);
    let downloadedTiles = 0;
    let failedTiles = 0;

    const mapId = `map_${Date.now()}`; // Unique ID for this map download

    console.log(`Starting download: ${totalTiles} tiles for region:`, region, `across zoom levels ${this.MIN_ZOOM_LEVEL}-${this.MAX_ZOOM_LEVEL}`);

    try {
      for (let zoom = this.MIN_ZOOM_LEVEL; zoom <= this.MAX_ZOOM_LEVEL; zoom++) {
        const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
        const northLat = latitude + latitudeDelta / 2;
        const southLat = latitude - latitudeDelta / 2;
        const eastLon = longitude + longitudeDelta / 2;
        const westLon = longitude - longitudeDelta / 2;

        const topLeft = this.deg2num(northLat, westLon, zoom);
        const bottomRight = this.deg2num(southLat, eastLon, zoom);

        console.log(`Downloading for zoom level ${zoom}: x(${topLeft.x}-${bottomRight.x}), y(${topLeft.y}-${bottomRight.y})`);

        const xRange = Array.from({ length: Math.abs(bottomRight.x - topLeft.x) + 1 }, (_, i) => Math.min(topLeft.x, bottomRight.x) + i);
        const yRange = Array.from({ length: Math.abs(bottomRight.y - topLeft.y) + 1 }, (_, i) => Math.min(topLeft.y, bottomRight.y) + i);

        for (const x of xRange) {
          for (const y of yRange) {
            const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
            const tileDir = `${this.MAP_TILES_DIR}${mapId}/${zoom}/${x}/`;
            const tileFile = `${tileDir}${y}.png`;
            
            try {
              await FileSystem.makeDirectoryAsync(tileDir, { intermediates: true });
              console.log(`Downloading tile: ${zoom}/${x}/${y} from ${tileUrl}`);
              
              await FileSystem.downloadAsync(tileUrl, tileFile);
              
              const fileInfo = await FileSystem.getInfoAsync(tileFile);
              if (fileInfo.exists && fileInfo.size > 0) {
                downloadedTiles++;
                console.log(`Successfully downloaded tile ${zoom}/${x}/${y}, size: ${fileInfo.size} bytes`);
              } else {
                failedTiles++;
                console.error(`Downloaded tile ${zoom}/${x}/${y} is empty or doesn't exist`);
              }
              
              if (onProgress) {
                onProgress({
                  downloaded: downloadedTiles,
                  failed: failedTiles,
                  total: totalTiles,
                  percentage: Math.round(((downloadedTiles + failedTiles) / totalTiles) * 100)
                });
              }
              
              await new Promise(resolve => setTimeout(resolve, 50)); // Reduced delay
              
            } catch (error) {
              failedTiles++;
              console.error(`Failed to download tile ${zoom}/${x}/${y}:`, error.message);
              
              if (onProgress) {
                onProgress({
                  downloaded: downloadedTiles,
                  failed: failedTiles,
                  total: totalTiles,
                  percentage: Math.round(((downloadedTiles + failedTiles) / totalTiles) * 100)
                });
              }
            }
          }
        }
      }
      console.log(`Download complete: ${downloadedTiles} successful, ${failedTiles} failed`);

      if (downloadedTiles === 0) {
        return { success: false, error: `No tiles downloaded successfully. Failed: ${failedTiles}` };
      }

      // Save map metadata
      const mapData = {
        id: mapId,
        region,
        downloadDate: new Date().toISOString(),
        tileCount: downloadedTiles,
        failedTiles,
        size: this.calculateDownloadSize(region),
        minZoom: this.MIN_ZOOM_LEVEL,
        maxZoom: this.MAX_ZOOM_LEVEL,
      };

      await this.saveOfflineMap(mapData);
      return { 
        success: true, 
        mapId, 
        tilesDownloaded: downloadedTiles, 
        tilesFailed: failedTiles,
        successRate: Math.round((downloadedTiles / totalTiles) * 100)
      };

    } catch (error) {
      console.error('Download failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async saveOfflineMap(mapData) {
    try {
      // Save to local storage
      const existingMaps = await this.getOfflineMaps();
      const updatedMaps = [...existingMaps, mapData];
      await AsyncStorage.setItem('offline_maps', JSON.stringify(updatedMaps));
      
      // Save to Firebase if user is authenticated
      if (auth.currentUser) {
        const firebaseResult = await OfflineMapFirebaseService.saveOfflineMapData(mapData);
        if (firebaseResult.success) {
          await OfflineMapFirebaseService.addMapUpdateHistory(mapData.id, 'downloaded', 'Map downloaded and saved');
        }
      }
    } catch (error) {
      console.error('Error saving offline map:', error);
    }
  }

  static async getOfflineMaps() {
    try {
      const maps = await AsyncStorage.getItem('offline_maps');
      return maps ? JSON.parse(maps) : [];
    } catch (error) {
      console.error('Error getting offline maps:', error);
      return [];
    }
  }

  static async deleteOfflineMap(mapId) {
    try {
      const mapDir = `${this.MAP_TILES_DIR}${mapId}/`;
      await FileSystem.deleteAsync(mapDir, { idempotent: true });
      
      const existingMaps = await this.getOfflineMaps();
      const updatedMaps = existingMaps.filter(map => map.id !== mapId);
      await AsyncStorage.setItem('offline_maps', JSON.stringify(updatedMaps));
      
      // Delete from Firebase if user is authenticated
      if (auth.currentUser) {
        await OfflineMapFirebaseService.deleteOfflineMapData(mapId);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting offline map:', error);
      return { success: false, error: error.message };
    }
  }

  // Record map access for usage statistics
  static async recordMapAccess(mapId) {
    try {
      if (auth.currentUser) {
        await OfflineMapFirebaseService.recordMapAccess(mapId);
      }
    } catch (error) {
      console.error('Error recording map access:', error);
    }
  }

  // Sync local maps with Firebase
  static async syncWithFirebase() {
    try {
      if (!auth.currentUser) return { success: false, error: 'User not authenticated' };
      
      const localMaps = await this.getOfflineMaps();
      const firebaseResult = await OfflineMapFirebaseService.getUserOfflineMaps();
      
      if (firebaseResult.success) {
        // Sync any local maps that aren't in Firebase
        for (const localMap of localMaps) {
          const existsInFirebase = firebaseResult.maps.some(fbMap => fbMap.id === localMap.id);
          if (!existsInFirebase) {
            await OfflineMapFirebaseService.saveOfflineMapData(localMap);
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
      return { success: false, error: error.message };
    }
  }
}

export default OfflineMapService;