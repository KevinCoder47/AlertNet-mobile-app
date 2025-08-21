import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineMapFirebaseService } from '../../backend/Firebase/OfflineMapFirebaseService';
import { auth } from '../../backend/Firebase/FirebaseConfig';

class OfflineMapService {
  static TILE_SIZE = 256;
  static ZOOM_LEVEL = 15;
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
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    
    const northLat = latitude + latitudeDelta / 2;
    const southLat = latitude - latitudeDelta / 2;
    const eastLon = longitude + longitudeDelta / 2;
    const westLon = longitude - longitudeDelta / 2;

    const topLeft = this.deg2num(northLat, westLon, this.ZOOM_LEVEL);
    const bottomRight = this.deg2num(southLat, eastLon, this.ZOOM_LEVEL);

    const tilesX = Math.abs(bottomRight.x - topLeft.x) + 1;
    const tilesY = Math.abs(bottomRight.y - topLeft.y) + 1;
    
    return tilesX * tilesY;
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
    
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    
    const northLat = latitude + latitudeDelta / 2;
    const southLat = latitude - latitudeDelta / 2;
    const eastLon = longitude + longitudeDelta / 2;
    const westLon = longitude - longitudeDelta / 2;

    const topLeft = this.deg2num(northLat, westLon, this.ZOOM_LEVEL);
    const bottomRight = this.deg2num(southLat, eastLon, this.ZOOM_LEVEL);

    const totalTiles = this.calculateTileCount(region);
    let downloadedTiles = 0;
    let failedTiles = 0;

    const mapId = `map_${Date.now()}`;
    const mapDir = `${this.MAP_TILES_DIR}${mapId}/`;
    await FileSystem.makeDirectoryAsync(mapDir, { intermediates: true });

    console.log(`Starting download: ${totalTiles} tiles for region:`, region);
    console.log(`Tile bounds: x(${Math.min(topLeft.x, bottomRight.x)}-${Math.max(topLeft.x, bottomRight.x)}), y(${Math.min(topLeft.y, bottomRight.y)}-${Math.max(topLeft.y, bottomRight.y)})`);
    console.log(`Using OpenStreetMap tiles at zoom level ${this.ZOOM_LEVEL}`);

    try {
      for (let x = Math.min(topLeft.x, bottomRight.x); x <= Math.max(topLeft.x, bottomRight.x); x++) {
        for (let y = Math.min(topLeft.y, bottomRight.y); y <= Math.max(topLeft.y, bottomRight.y); y++) {
          // Use OpenStreetMap tiles instead of Google Maps
          const tileUrl = `https://tile.openstreetmap.org/${this.ZOOM_LEVEL}/${x}/${y}.png`;
          const tileFile = `${mapDir}${x}_${y}.png`;
          
          try {
            console.log(`Downloading tile: ${x}_${y} from ${tileUrl}`);
            
            const downloadResult = await FileSystem.downloadAsync(tileUrl, tileFile);
            
            // Validate the downloaded file
            const fileInfo = await FileSystem.getInfoAsync(tileFile);
            if (fileInfo.exists && fileInfo.size > 0) {
              downloadedTiles++;
              console.log(`Successfully downloaded tile ${x}_${y}, size: ${fileInfo.size} bytes`);
            } else {
              failedTiles++;
              console.error(`Downloaded tile ${x}_${y} is empty or doesn't exist`);
            }
            
            if (onProgress) {
              onProgress({
                downloaded: downloadedTiles,
                failed: failedTiles,
                total: totalTiles,
                percentage: Math.round(((downloadedTiles + failedTiles) / totalTiles) * 100)
              });
            }
            
            // Add small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            failedTiles++;
            console.error(`Failed to download tile ${x}_${y}:`, error.message);
            
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
        size: this.calculateDownloadSize(region)
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