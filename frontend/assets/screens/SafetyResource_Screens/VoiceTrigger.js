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


const VoiceTrigger = ({ setIsVoiceTrigger, setIsSafetyResources }) => { // 1. Accept navigation props
  const [panicWord, setPanicWord] = useState('');

  return (
    <LinearGradient colors={['#FFCDB2', '#E57373']} style={styles.container}>
      <View style={styles.header}>
        {/* 2. Add onPress handler to the back button */}
        <TouchableOpacity 
            onPress={() => {
                setIsVoiceTrigger(false);
                setIsSafetyResources(true);
            }}
        >
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Voice Trigger</Text>
        <Text style={styles.subtitle}>
          Record your chosen panic word so that your voice can be recognized to
          silently trigger SOS.
        </Text>

        <Image
          source={require('../../images/waveform.png')} // Make sure to add your waveform image here
          style={styles.waveform}
          resizeMode="contain"
        />

        <View style={styles.content}>
          <View style={styles.infoBox}>
            <Icon name="info-circle" size={20} color="#fff" />
            <Text style={styles.infoText}>
              Choose a word you wouldn't say accidental in a normal conversation
            </Text>
          </View>

          <Text style={styles.label}>Type Panic Word</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g Tuple"
            placeholderTextColor="#FFBFA5"
            value={panicWord}
            onChangeText={setPanicWord}
          />

          <Text style={styles.instructionTitle}>
            Say "{panicWord || 'Tuple'}"
          </Text>
          <Text style={styles.instructionSubtitle}>Three Times</Text>

          <View style={styles.micContainer}>
            <TouchableOpacity style={styles.micButton}>
              <Icon name="microphone" size={30} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.micButton}>
              <Icon name="microphone" size={30} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.micButton}>
              <Icon name="microphone" size={30} color="#000" />
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
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 60,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingBottom: 20,
  },
  waveform: {
    width: '100%',
    height: 100,
    marginTop: 20,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: -20, // Overlap the waveform slightly
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 40,
  },
  instructionSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  micContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 40,
  },
  micButton: {
    backgroundColor: '#F5B7B1',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  saveButton: {
    backgroundColor: '#FFDAB9',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  saveButtonText: {
    color: '#A52A2A',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default VoiceTrigger;