import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function VoiceTrigger({ setIsVoiceTrigger, setIsSafetyResources }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,0,0,0.8)', 'transparent']}
        style={styles.background}
      />
      <View style={styles.overlay} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setIsVoiceTrigger(false);
            setIsSafetyResources(true);
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Voice Trigger</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.text}>Say your panic word to trigger an alert.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 18,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
});
