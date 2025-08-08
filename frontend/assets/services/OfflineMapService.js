import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineMapService {
  static TILE_SIZE = 256;
  static ZOOM_LEVEL = 15;
  static MAP_TILES_DIR = `${FileSystem.documentDirectory}offline_maps/`;

  static async initializeStorage() {
    const dirInfo = await FileSystem.getInfoAsync(this.MAP_TILES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.MAP_TILES_DIR, { intermediates: true });
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
    
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    
    const northLat = latitude + latitudeDelta / 2;
    const southLat = latitude - latitudeDelta / 2;
    const eastLon = longitude + longitudeDelta / 2;
    const westLon = longitude - longitudeDelta / 2;

    const topLeft = this.deg2num(northLat, westLon, this.ZOOM_LEVEL);
    const bottomRight = this.deg2num(southLat, eastLon, this.ZOOM_LEVEL);

    const totalTiles = this.calculateTileCount(region);
    let downloadedTiles = 0;

    const mapId = `map_${Date.now()}`;
    const mapDir = `${this.MAP_TILES_DIR}${mapId}/`;
    await FileSystem.makeDirectoryAsync(mapDir, { intermediates: true });

    try {
      for (let x = Math.min(topLeft.x, bottomRight.x); x <= Math.max(topLeft.x, bottomRight.x); x++) {
        for (let y = Math.min(topLeft.y, bottomRight.y); y <= Math.max(topLeft.y, bottomRight.y); y++) {
          const tileUrl = `https://mt1.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${this.ZOOM_LEVEL}`;
          const tileFile = `${mapDir}${x}_${y}.png`;
          
          try {
            await FileSystem.downloadAsync(tileUrl, tileFile);
            downloadedTiles++;
            
            if (onProgress) {
              onProgress({
                downloaded: downloadedTiles,
                total: totalTiles,
                percentage: Math.round((downloadedTiles / totalTiles) * 100)
              });
            }
          } catch (error) {
            console.error(`Failed to download tile ${x}_${y}:`, error);
          }
        }
      }

      // Save map metadata
      const mapData = {
        id: mapId,
        region,
        downloadDate: new Date().toISOString(),
        tileCount: downloadedTiles,
        size: this.calculateDownloadSize(region)
      };

      await this.saveOfflineMap(mapData);
      return { success: true, mapId, tilesDownloaded: downloadedTiles };

    } catch (error) {
      console.error('Download failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async saveOfflineMap(mapData) {
    try {
      const existingMaps = await this.getOfflineMaps();
      const updatedMaps = [...existingMaps, mapData];
      await AsyncStorage.setItem('offline_maps', JSON.stringify(updatedMaps));
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
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting offline map:', error);
      return { success: false, error: error.message };
    }
  }
}

export default OfflineMapService;