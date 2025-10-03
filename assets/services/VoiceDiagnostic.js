import Voice from '@react-native-voice/voice';

export const VoiceDiagnostic = {
  async runDiagnostic() {
    console.log('=== VOICE RECOGNITION DIAGNOSTIC ===');
    
    try {
      // Check if package is imported
      console.log('1. Package import check:');
      console.log('   Voice object exists:', !!Voice);
      console.log('   Voice object type:', typeof Voice);
      
      if (Voice) {
        console.log('   Voice.start exists:', !!Voice.start);
        console.log('   Voice.isAvailable exists:', !!Voice.isAvailable);
        console.log('   Voice.stop exists:', !!Voice.stop);
      }
      
      // Check if functions are available
      if (Voice && typeof Voice.start === 'function') {
        console.log('2. Voice functions available ✅');
        
        // Check device availability
        try {
          const available = await Voice.isAvailable();
          console.log('3. Device speech recognition available:', available);
          
          if (available) {
            console.log('✅ REAL VOICE RECOGNITION SHOULD WORK!');
            return { success: true, mode: 'real' };
          } else {
            console.log('❌ Device does not support speech recognition');
            return { success: false, mode: 'simulation', reason: 'Device not supported' };
          }
        } catch (error) {
          console.log('3. Error checking device availability:', error.message);
          return { success: false, mode: 'simulation', reason: 'Availability check failed' };
        }
      } else {
        console.log('2. Voice functions not available ❌');
        console.log('   Reason: Package not properly installed or linked');
        return { success: false, mode: 'simulation', reason: 'Package not linked' };
      }
    } catch (error) {
      console.log('Diagnostic failed:', error.message);
      return { success: false, mode: 'simulation', reason: 'Import error' };
    }
  }
};

export default VoiceDiagnostic;