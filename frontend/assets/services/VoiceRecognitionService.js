import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice from '@react-native-voice/voice';
import SOSService from './SOSService';

class VoiceRecognitionService {
  static recording = null;
  static isListening = false;
  static safewordSamples = [];
  static currentSafeword = null;
  static speechRecognitionActive = false;
  static voiceAvailable = false;
  static simulationMode = true;

  static async requestPermissions() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  }

  static async startRecording() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Audio permission denied');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      this.recording = recording;
      return true;
    } catch (error) {
      console.error('Recording start error:', error);
      return false;
    }
  }

  static async stopRecording() {
    try {
      if (!this.recording) return null;
      
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      
      return uri;
    } catch (error) {
      console.error('Recording stop error:', error);
      return null;
    }
  }

  static async saveSafeword(word) {
    try {
      await AsyncStorage.setItem('safeword', word.toLowerCase());
      return true;
    } catch (error) {
      console.error('Save safeword error:', error);
      return false;
    }
  }

  static async getSafeword() {
    try {
      return await AsyncStorage.getItem('safeword');
    } catch (error) {
      console.error('Get safeword error:', error);
      return null;
    }
  }

  static async saveSafewordSample(sampleUri, index) {
    try {
      const samples = await this.getSafewordSamples();
      samples[index] = sampleUri;
      await AsyncStorage.setItem('safewordSamples', JSON.stringify(samples));
      return true;
    } catch (error) {
      console.error('Save sample error:', error);
      return false;
    }
  }

  static async getSafewordSamples() {
    try {
      const samples = await AsyncStorage.getItem('safewordSamples');
      return samples ? JSON.parse(samples) : [null, null, null];
    } catch (error) {
      console.error('Get samples error:', error);
      return [null, null, null];
    }
  }

  static async deleteSafewordSample(index) {
    try {
      const samples = await this.getSafewordSamples();
      samples[index] = null;
      await AsyncStorage.setItem('safewordSamples', JSON.stringify(samples));
      return true;
    } catch (error) {
      console.error('Delete sample error:', error);
      return false;
    }
  }

  static async checkVoiceAvailability() {
    try {
      console.log('Checking voice availability...');
      console.log('Voice object:', Voice);
      console.log('Voice.start function:', typeof Voice.start);
      
      // Check if Voice module is properly linked
      if (Voice && typeof Voice.start === 'function') {
        console.log('Voice module found, checking availability...');
        const available = await Voice.isAvailable();
        console.log('Voice.isAvailable() result:', available);
        
        this.voiceAvailable = available;
        this.simulationMode = !available;
        
        if (available) {
          console.log('✅ Real voice recognition is available!');
        } else {
          console.log('❌ Voice recognition not available on this device');
        }
        
        return available;
      } else {
        console.log('❌ Voice module not properly linked or installed');
        this.voiceAvailable = false;
        this.simulationMode = true;
        return false;
      }
    } catch (error) {
      console.log('❌ Voice availability check failed:', error.message);
      this.voiceAvailable = false;
      this.simulationMode = true;
      return false;
    }
  }

  static async startVoiceMonitoring() {
    try {
      const safeword = await this.getSafeword();
      if (!safeword) {
        throw new Error('No safeword configured');
      }

      this.currentSafeword = safeword.toLowerCase();
      this.isListening = true;
      
      // Check if real voice recognition is available
      const voiceAvailable = await this.checkVoiceAvailability();
      
      if (voiceAvailable) {
        console.log('Using real speech recognition');
        // Setup voice recognition callbacks
        Voice.onSpeechStart = this.onSpeechStart;
        Voice.onSpeechEnd = this.onSpeechEnd;
        Voice.onSpeechResults = this.onSpeechResults;
        Voice.onSpeechError = this.onSpeechError;
        
        await this.startSpeechRecognition();
      } else {
        console.log('Using simulation mode for voice recognition');
        this.startSimulationMode();
      }
      
      return true;
    } catch (error) {
      console.error('Voice monitoring error:', error);
      return false;
    }
  }

  static async stopVoiceMonitoring() {
    this.isListening = false;
    this.speechRecognitionActive = false;
    
    if (this.voiceAvailable) {
      try {
        await Voice.stop();
        await Voice.destroy();
      } catch (error) {
        console.error('Stop voice monitoring error:', error);
      }
    }
    
    // Stop simulation mode
    this.simulationMode = false;
  }

  static async startSpeechRecognition() {
    if (!this.isListening || this.speechRecognitionActive || !this.voiceAvailable) return;

    try {
      this.speechRecognitionActive = true;
      await Voice.start('en-US');
    } catch (error) {
      console.error('Speech recognition start error:', error);
      this.speechRecognitionActive = false;
      
      // Fallback to simulation mode
      console.log('Falling back to simulation mode');
      this.simulationMode = true;
      this.voiceAvailable = false;
      this.startSimulationMode();
    }
  }

  static startSimulationMode() {
    if (!this.isListening) return;
    
    console.log('Simulation mode: Checking for safeword...');
    setTimeout(() => {
      if (this.isListening && this.simulationMode) {
        // 15% chance of detection for demo
        const randomDetection = Math.random() < 0.15;
        
        if (randomDetection) {
          console.log(`Simulation: Safeword "${this.currentSafeword}" detected!`);
          this.triggerSafewordSOS();
        } else {
          // Continue simulation
          this.startSimulationMode();
        }
      }
    }, 2000);
  }

  static onSpeechStart = () => {
    console.log('Speech recognition started');
  };

  static onSpeechEnd = () => {
    console.log('Speech recognition ended');
    VoiceRecognitionService.speechRecognitionActive = false;
    
    // Restart recognition if still listening
    if (VoiceRecognitionService.isListening) {
      setTimeout(() => VoiceRecognitionService.startSpeechRecognition(), 1000);
    }
  };

  static onSpeechResults = (event) => {
    const results = event.value;
    if (results && results.length > 0) {
      const spokenText = results[0].toLowerCase();
      console.log('Speech recognized:', spokenText);
      
      // Check if safeword is detected
      if (VoiceRecognitionService.currentSafeword && 
          spokenText.includes(VoiceRecognitionService.currentSafeword)) {
        console.log(`Safeword "${VoiceRecognitionService.currentSafeword}" detected!`);
        VoiceRecognitionService.triggerSafewordSOS();
      }
    }
  };

  static onSpeechError = (error) => {
    console.log('Speech recognition error:', error);
    VoiceRecognitionService.speechRecognitionActive = false;
    
    // Restart recognition if still listening
    if (VoiceRecognitionService.isListening) {
      setTimeout(() => VoiceRecognitionService.startSpeechRecognition(), 2000);
    }
  };

  static async testVoiceTrigger() {
    try {
      const safeword = await this.getSafeword();
      if (!safeword) {
        return { success: false, error: 'No safeword configured' };
      }

      console.log(`Testing voice trigger with safeword: "${safeword}"`);
      const result = await this.triggerSafewordSOS();
      
      return {
        success: true,
        message: `Voice trigger test completed with safeword: "${safeword}"`,
        result
      };
    } catch (error) {
      console.error('Test voice trigger error:', error);
      return { success: false, error: error.message };
    }
  }

  static async triggerSafewordSOS() {
    try {
      console.log('Safeword detected - triggering SOS');
      
      // Stop voice monitoring
      this.stopVoiceMonitoring();
      
      // Trigger SOS notifications
      const result = await SOSService.sendEmergencyNotifications();
      
      return {
        success: true,
        message: 'Safeword detected - Emergency notifications sent',
        result
      };
    } catch (error) {
      console.error('Safeword SOS trigger error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getVoiceMonitoringStatus() {
    return {
      isListening: this.isListening,
      speechRecognitionActive: this.speechRecognitionActive,
      voiceAvailable: this.voiceAvailable,
      simulationMode: this.simulationMode,
      hasSafeword: !!(await this.getSafeword()),
      samples: await this.getSafewordSamples(),
      currentSafeword: this.currentSafeword
    };
  }
}

export default VoiceRecognitionService;