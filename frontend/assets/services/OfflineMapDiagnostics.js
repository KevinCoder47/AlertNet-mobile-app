import * as FileSystem from 'expo-file-system';

export class OfflineMapDiagnostics {
  static async testSingleTileDownload() {
    try {
      // console.log($&);
      
      // Test network connectivity
      // console.log($&);
      const testUrl = 'https://tile.openstreetmap.org/0/0/0.png';
      const response = await fetch(testUrl, { method: 'HEAD' });
      // console.log($&);
      
      if (!response.ok) {
        return { success: false, error: 'Network connectivity failed' };
      }
      
      // Test file system permissions
      // console.log($&);
      const testDir = `${FileSystem.documentDirectory}test_offline_maps/`;
      await FileSystem.makeDirectoryAsync(testDir, { intermediates: true });
      // console.log($&);
      
      // Test single tile download
      // console.log($&);
      const tileUrl = 'https://tile.openstreetmap.org/15/17014/10747.png'; // Johannesburg area
      const tileFile = `${testDir}test_tile.png`;
      
      const downloadResult = await FileSystem.downloadAsync(tileUrl, tileFile);
      // console.log($&);
      
      // Validate downloaded file
      const fileInfo = await FileSystem.getInfoAsync(tileFile);
      // console.log($&);
      
      if (fileInfo.exists && fileInfo.size > 1000) {
        // console.log($&);
        
        // Clean up
        await FileSystem.deleteAsync(testDir, { idempotent: true });
        
        return { 
          success: true, 
          message: 'All diagnostics passed. Offline maps should work correctly.',
          fileSize: fileInfo.size 
        };
      } else {
        return { 
          success: false, 
          error: 'Downloaded tile is invalid or empty',
          fileSize: fileInfo.size 
        };
      }
      
    } catch (error) {
      console.error('Diagnostic failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async testTileCoordinates(latitude, longitude, zoom = 15) {
    // console.log($&);
    
    // Calculate tile coordinates
    const latRad = (latitude * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor(((longitude + 180) / 360) * n);
    const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
    
    // console.log($&);
    
    const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
    // console.log($&);
    
    try {
      const response = await fetch(tileUrl, { method: 'HEAD' });
      // console.log($&);
      
      return {
        success: response.ok,
        coordinates: { x, y, zoom },
        url: tileUrl,
        status: response.status
      };
    } catch (error) {
      console.error('Tile test failed:', error);
      return { success: false, error: error.message };
    }
  }
}