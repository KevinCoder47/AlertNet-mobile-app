import VoiceRecognitionService from './VoiceRecognitionService';
import { SOSService } from './SOSService';

class VoiceTriggerIntegration {
  static sosCallback = null;

  static setSosCallback(callback) {
    this.sosCallback = callback;
  }

  static async handleVoiceTrigger() {
    try {
      // Trigger SOS with voice recognition flag
      const result = await SOSService.sendEmergencyNotifications('voice');
      
      // Call SOS screen callback if available
      if (this.sosCallback) {
        this.sosCallback({
          triggered: true,
          method: 'voice',
          result
        });
      }

      return result;
    } catch (error) {
      console.error('Voice trigger integration error:', error);
      return { success: false, error: error.message };
    }
  }

  static async initializeVoiceMonitoring() {
    try {
      const status = await VoiceRecognitionService.getVoiceMonitoringStatus();
      
      if (status.hasSafeword && status.samples.filter(s => s !== null).length >= 3) {
        // Auto-start voice monitoring if properly configured
        return await VoiceRecognitionService.startVoiceMonitoring();
      }
      
      return false;
    } catch (error) {
      console.error('Voice monitoring initialization error:', error);
      return false;
    }
  }
}

export default VoiceTriggerIntegration;