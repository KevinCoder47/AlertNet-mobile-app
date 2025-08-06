import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';

const VoiceTrigger = ({ setIsVoiceTrigger, setIsSafetyResources }) => {
  const [panicWord, setPanicWord] = useState('Tuple');

  return (
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
            <TouchableOpacity style={styles.micButton}>
              <Icon name="microphone" size={24} color="#CC4125" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.micButton}>
              <Icon name="microphone" size={24} color="#CC4125" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.micButton}>
              <Icon name="microphone" size={24} color="#CC4125" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
});

export default VoiceTrigger;