import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import VoiceRecognitionService from '../../services/VoiceRecognitionService';
import VoiceDiagnostic from '../../services/VoiceDiagnostic';

const VoiceTrigger = ({ setIsVoiceTrigger, setIsSafetyResources }) => {
  const [panicWord, setPanicWord] = useState('Tuple');
  const [recordingStates, setRecordingStates] = useState([false, false, false]);
  const [samples, setSamples] = useState([null, null, null]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [listeningStatus, setListeningStatus] = useState('Not listening');
  const [speechStatus, setSpeechStatus] = useState('Speech recognition inactive');

  useEffect(() => {
    loadSavedData();
    runVoiceDiagnostic();
  }, []);

  const runVoiceDiagnostic = async () => {
    const result = await VoiceDiagnostic.runDiagnostic();
    console.log('Voice diagnostic result:', result);
  };

  const loadSavedData = async () => {
    const savedWord = await VoiceRecognitionService.getSafeword();
    const savedSamples = await VoiceRecognitionService.getSafewordSamples();
    const status = await VoiceRecognitionService.getVoiceMonitoringStatus();
    
    if (savedWord) setPanicWord(savedWord);
    setSamples(savedSamples);
    setIsMonitoring(status.isListening);
  };

  const handleRecording = async (index) => {
    const newStates = [...recordingStates];
    
    if (!newStates[index]) {
      // Start recording
      const started = await VoiceRecognitionService.startRecording();
      if (started) {
        newStates[index] = true;
        setRecordingStates(newStates);
        
        // Auto-stop after 3 seconds
        setTimeout(async () => {
          if (newStates[index]) { // Only stop if still recording
            await stopRecording(index);
          }
        }, 3000);
      }
    } else {
      // Manual stop recording
      await stopRecording(index);
    }
  };

  const stopRecording = async (index) => {
    const uri = await VoiceRecognitionService.stopRecording();
    if (uri) {
      await VoiceRecognitionService.saveSafewordSample(uri, index);
      const newSamples = [...samples];
      newSamples[index] = uri;
      setSamples(newSamples);
    }
    const newStates = [...recordingStates];
    newStates[index] = false;
    setRecordingStates(newStates);
  };

  const handleDeleteSample = async (index) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this voice sample?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await VoiceRecognitionService.deleteSafewordSample(index);
            const newSamples = [...samples];
            newSamples[index] = null;
            setSamples(newSamples);
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!panicWord.trim()) {
      Alert.alert('Error', 'Please enter a panic word');
      return;
    }

    const completedSamples = samples.filter(s => s !== null).length;
    if (completedSamples < 3) {
      Alert.alert('Error', 'Please record all 3 voice samples');
      return;
    }

    setIsSaving(true);
    const saved = await VoiceRecognitionService.saveSafeword(panicWord);
    setIsSaving(false);

    if (saved) {
      Alert.alert('Success', 'Safeword saved successfully!');
    } else {
      Alert.alert('Error', 'Failed to save safeword');
    }
  };

  const toggleVoiceMonitoring = async () => {
    if (!panicWord.trim() || samples.filter(s => s !== null).length < 3) {
      Alert.alert('Setup Required', 'Please complete safeword setup first');
      return;
    }

    if (isMonitoring) {
      await VoiceRecognitionService.stopVoiceMonitoring();
      setIsMonitoring(false);
      setListeningStatus('Not listening');
      setSpeechStatus('Speech recognition inactive');
    } else {
      const started = await VoiceRecognitionService.startVoiceMonitoring();
      if (started) {
        setIsMonitoring(true);
        setListeningStatus('Listening for safeword...');
        setSpeechStatus('Speech recognition active');
        // Check voice availability and show appropriate message
        setTimeout(async () => {
          const status = await VoiceRecognitionService.getVoiceMonitoringStatus();
          if (status.simulationMode) {
            Alert.alert('Voice Monitoring', `Voice recognition not available. Using simulation mode (15% detection chance). Say "${panicWord}" to test.`);
            setSpeechStatus('Simulation mode active');
          } else {
            Alert.alert('Voice Monitoring', `Real speech recognition is now active. Say "${panicWord}" to trigger SOS.`);
            setSpeechStatus('Real speech recognition active');
          }
        }, 1000);
        
        // Update status periodically
        const statusInterval = setInterval(async () => {
          if (!isMonitoring) {
            clearInterval(statusInterval);
            return;
          }
          const status = await VoiceRecognitionService.getVoiceMonitoringStatus();
          
          if (status.simulationMode) {
            setSpeechStatus('Simulation mode - 15% detection chance');
          } else {
            setSpeechStatus(status.speechRecognitionActive ? 'Listening...' : 'Restarting recognition...');
          }
        }, 2000);
      } else {
        Alert.alert('Error', 'Failed to start voice monitoring. Please check microphone permissions.');
      }
    }
  };

  const handleTestVoiceTrigger = async () => {
    if (!panicWord.trim() || samples.filter(s => s !== null).length < 3) {
      Alert.alert('Setup Required', 'Please complete safeword setup first');
      return;
    }

    Alert.alert(
      'Test Voice Trigger',
      `This will simulate detecting your safeword "${panicWord}" and trigger SOS notifications. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test SOS',
          style: 'destructive',
          onPress: async () => {
            const result = await VoiceRecognitionService.testVoiceTrigger();
            if (result.success) {
              Alert.alert('Test Successful', result.message);
            } else {
              Alert.alert('Test Failed', result.error);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#FFE4E1', '#FF6B6B']} style={styles.container}>
        <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            setIsVoiceTrigger(false);
            setIsSafetyResources(true);
          }}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Trigger</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Record your chosen panic word so that your voice can be recognized to silently trigger SOS.
        </Text>

        <View style={styles.waveformContainer}>
          <Image
            source={require('../../images/waveform.png')}
            style={styles.waveform}
            resizeMode="contain"
          />
        </View>

        <View style={styles.content}>
          <View style={styles.infoBox}>
            <View style={styles.infoIconContainer}>
              <Icon name="info" size={16} color="#FF6B6B" />
            </View>
            <Text style={styles.infoText}>
              Choose a word you wouldn't say accidental in a normal conversation
            </Text>
          </View>

          <Text style={styles.label}>Type Panic Word</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g Tuple"
            placeholderTextColor="#FF9999"
            value={panicWord}
            onChangeText={setPanicWord}
          />

          <Text style={styles.instructionTitle}>
            Say "{panicWord}"
          </Text>
          <Text style={styles.instructionSubtitle}>Three Times</Text>

          <View style={styles.micContainer}>
            {[0, 1, 2].map((index) => (
              <View key={index} style={styles.micButtonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.micButton,
                    recordingStates[index] && styles.micButtonRecording,
                    samples[index] && styles.micButtonCompleted
                  ]}
                  onPress={() => handleRecording(index)}
                  onLongPress={() => samples[index] && handleDeleteSample(index)}
                >
                  <Icon 
                    name={recordingStates[index] ? "stop" : "microphone"} 
                    size={24} 
                    color={samples[index] ? "#4CAF50" : "#CC4125"} 
                  />
                </TouchableOpacity>
                {samples[index] && (
                  <Text style={styles.sampleStatus}>✓</Text>
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>

          <View style={styles.monitoringContainer}>
            <Text style={styles.monitoringLabel}>Voice Monitoring</Text>
            <Switch
              value={isMonitoring}
              onValueChange={toggleVoiceMonitoring}
              trackColor={{ false: '#767577', true: '#E57373' }}
              thumbColor={isMonitoring ? '#CC4125' : '#f4f3f4'}
            />
          </View>

          {isMonitoring && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>{listeningStatus}</Text>
              <Text style={styles.speechStatusText}>{speechStatus}</Text>
              <Text style={styles.realModeText}>
                {speechStatus.includes('Simulation') ? 'Simulation Mode Active' : 'Real Speech Recognition Active'}
              </Text>
              <Text style={styles.instructionText}>Say "{panicWord}" to trigger SOS</Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleTestVoiceTrigger}
          >
            <Text style={styles.testButtonText}>Test Voice Trigger</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.diagnosticButton}
            onPress={runVoiceDiagnostic}
          >
            <Text style={styles.diagnosticButtonText}>Check Voice Status</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: 30, // Compensate for back button width
  },
  scrollContainer: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  waveformContainer: {
    width: '100%',
    height: 120,
    marginBottom: 30,
  },
  waveform: {
    width: '100%',
    height: '100%',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 25,
    width: '100%',
  },
  infoIconContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    color: '#FFF',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  label: {
    color: '#FFF',
    fontSize: 14,
    alignSelf: 'flex-start',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 40,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 5,
  },
  instructionSubtitle: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 30,
  },
  micContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '75%',
    marginBottom: 50,
  },
  micButton: {
    backgroundColor: '#E57373',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButton: {
    backgroundColor: '#E57373',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  micButtonRecording: {
    backgroundColor: '#FF5722',
  },
  micButtonCompleted: {
    backgroundColor: '#4CAF50',
  },
  monitoringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    width: '100%',
  },
  monitoringLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  micButtonContainer: {
    alignItems: 'center',
  },
  sampleStatus: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 5,
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  speechStatusText: {
    color: '#FFD700',
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
  },
  realModeText: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 5,
    fontWeight: 'bold',
  },
  instructionText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 3,
    opacity: 0.9,
    fontStyle: 'italic',
  },
  testButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  diagnosticButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 15,
    marginTop: 10,
  },
  diagnosticButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default VoiceTrigger;