import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const VoiceTrigger = ({ setIsVoiceTrigger, setIsSafetyResources }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStep, setRecordingStep] = useState(0); // 0: not started, 1: first recording, 2: second recording, 3: third recording
  const [triggerWord, setTriggerWord] = useState('');
  const [waveAnimations] = useState(
    Array.from({ length: 9 }, () => new Animated.Value(20))
  );

  // Animate waveform bars
  const animateWaveform = () => {
    const animations = waveAnimations.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: Math.random() * 60 + 20,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 20,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false,
          }),
        ]),
        { iterations: -1 }
      );
    });

    Animated.stagger(100, animations).start();
  };

  const stopWaveformAnimation = () => {
    waveAnimations.forEach(anim => {
      anim.stopAnimation();
      Animated.timing(anim, {
        toValue: 20,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  };

  useEffect(() => {
    if (isRecording) {
      animateWaveform();
    } else {
      stopWaveformAnimation();
    }
  }, [isRecording]);

  const handleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Simulate recording for 3 seconds
      setTimeout(() => {
        setIsRecording(false);
        setRecordingStep(recordingStep + 1);
      }, 3000);
    }
  };

  const getRecordingButtonIcon = () => {
    if (recordingStep === 0) return 'mic';
    if (recordingStep === 1) return 'mic';
    if (recordingStep === 2) return 'mic';
    return 'checkmark';
  };

  const getInstructionText = () => {
    if (recordingStep === 0) return 'Say "Trigger"\n3 times';
    if (recordingStep === 1) return 'Say "Trigger"\n2 more times';
    if (recordingStep === 2) return 'Say "Trigger"\n1 more time';
    return 'Training complete!';
  };

  const isComplete = recordingStep >= 3;

  return (
    <LinearGradient
      colors={['#ff9a85', '#ff6b6b', '#e55353']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setIsVoiceTrigger(false);
              setIsSafetyResources(true);
            }}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voice Trigger</Text>
        </View>

        <View style={styles.content}>
          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Record your chosen phrase and we'll turn your voice can be recognized to identify your wake word.
            </Text>
          </View>

          {/* Waveform Visualization */}
          <View style={styles.waveformContainer}>
            <View style={styles.waveform}>
              {waveAnimations.map((anim, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.waveBar,
                    {
                      height: anim,
                      opacity: isRecording ? 1 : 0.5,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Input Field */}
          <TextInput
            style={styles.input}
            placeholder="Type Wake Word"
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={triggerWord}
            onChangeText={setTriggerWord}
          />

          {/* Instruction Text */}
          <Text style={styles.instructionText}>
            {getInstructionText()}
          </Text>

          {/* Recording Controls */}
          <View style={styles.recordingControls}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
                recordingStep > 0 && styles.recordButtonProgress,
              ]}
              onPress={handleRecording}
              disabled={isRecording || isComplete}
            >
              <Ionicons
                name={getRecordingButtonIcon()}
                size={30}
                color={isRecording || recordingStep > 0 ? '#ff6b6b' : 'white'}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.recordButton,
                recordingStep > 1 && styles.recordButtonProgress,
              ]}
              onPress={handleRecording}
              disabled={isRecording || recordingStep < 1 || isComplete}
            >
              <Ionicons
                name={recordingStep > 1 ? 'checkmark' : 'mic'}
                size={30}
                color={recordingStep > 1 ? '#ff6b6b' : 'white'}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.recordButton,
                recordingStep > 2 && styles.recordButtonProgress,
              ]}
              onPress={handleRecording}
              disabled={isRecording || recordingStep < 2 || isComplete}
            >
              <Ionicons
                name={recordingStep > 2 ? 'checkmark' : 'mic'}
                size={30}
                color={recordingStep > 2 ? '#ff6b6b' : 'white'}
              />
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              !isComplete && styles.saveButtonDisabled,
            ]}
            disabled={!isComplete}
          >
            <Text style={[
              styles.saveButtonText,
              !isComplete && styles.saveButtonTextDisabled,
            ]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  descriptionContainer: {
    marginBottom: 40,
  },
  description: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  waveformContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveBar: {
    width: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 2,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
    lineHeight: 22,
  },
  recordingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 50,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recordButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'white',
  },
  recordButtonProgress: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignSelf: 'center',
    marginBottom: 40,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
    textAlign: 'center',
  },
  saveButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default VoiceTrigger;