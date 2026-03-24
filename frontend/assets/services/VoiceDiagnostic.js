import Voice from '@react-native-voice/voice';

export const VoiceDiagnostic = {
  async runDiagnostic() {
    // console.log($&);
    
    try {
      // Check if package is imported
      // console.log($&);
      // console.log($&);
      // console.log($&);
      
      if (Voice) {
        // console.log($&);
        // console.log($&);
        // console.log($&);
      }
      
      // Check if functions are available
      if (Voice && typeof Voice.start === 'function') {
        // console.log($&);
        
        // Check device availability
        try {
          const available = await Voice.isAvailable();
          // console.log($&);
          
          if (available) {
            // console.log($&);
            return { success: true, mode: 'real' };
          } else {
            // console.log($&);
            return { success: false, mode: 'simulation', reason: 'Device not supported' };
          }
        } catch (error) {
          // console.log($&);
          return { success: false, mode: 'simulation', reason: 'Availability check failed' };
        }
      } else {
        // console.log($&);
        // console.log($&);
        return { success: false, mode: 'simulation', reason: 'Package not linked' };
      }
    } catch (error) {
      // console.log($&);
      return { success: false, mode: 'simulation', reason: 'Import error' };
    }
  }
};

export default VoiceDiagnostic;