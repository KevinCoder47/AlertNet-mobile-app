import * as FileSystem from 'expo-file-system';

export class OfflineMapDiagnostics {
  static async testSingleTileDownload() {
    try {
      console.log('=== Offline Map Diagnostics ===');
      
      // Test network connectivity
      console.log('1. Testing network connectivity...');
      const testUrl = 'https://tile.openstreetmap.org/0/0/0.png';
      const response = await fetch(testUrl, { method: 'HEAD' });
      console.log(`Network test: ${response.ok ? 'PASS' : 'FAIL'} (Status: ${response.status})`);
      
      if (!response.ok) {
        return { success: false, error: 'Network connectivity failed' };
      }
      
      // Test file system permissions
      console.log('2. Testing file system permissions...');
      const testDir = `${FileSystem.documentDirectory}test_offline_maps/`;
      await FileSystem.makeDirectoryAsync(testDir, { intermediates: true });
      console.log('File system test: PASS');
      
      // Test single tile download
      console.log('3. Testing single tile download...');
      const tileUrl = 'https://tile.openstreetmap.org/15/17014/10747.png'; // Johannesburg area
      const tileFile = `${testDir}test_tile.png`;
      
      const downloadResult = await FileSystem.downloadAsync(tileUrl, tileFile);
      console.log('Download result:', downloadResult);
      
      // Validate downloaded file
      const fileInfo = await FileSystem.getInfoAsync(tileFile);
      console.log('File info:', fileInfo);
      
      if (fileInfo.exists && fileInfo.size > 1000) {
        console.log('Single tile download: PASS');
        
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
    console.log(`=== Testing tile coordinates for lat: ${latitude}, lng: ${longitude}, zoom: ${zoom} ===`);
    
    // Calculate tile coordinates
    const latRad = (latitude * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor(((longitude + 180) / 360) * n);
    const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
    
    console.log(`Calculated tile coordinates: x=${x}, y=${y}`);
    
    const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
    console.log(`Tile URL: ${tileUrl}`);
    
    try {
      const response = await fetch(tileUrl, { method: 'HEAD' });
      console.log(`Tile availability: ${response.ok ? 'AVAILABLE' : 'NOT AVAILABLE'} (Status: ${response.status})`);
      
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