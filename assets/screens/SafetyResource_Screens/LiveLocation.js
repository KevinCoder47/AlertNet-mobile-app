import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LiveLocation({ setIsLiveLocation, setIsSafetyResources }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      <Text style={styles.title}>Live Location Sharing Guide</Text>

      <Text style={styles.description}>
        This screen will guide you on how to share your live location safely with trusted contacts.
      </Text>

      {/* Add more instructions or content here as needed */}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setIsLiveLocation(false);
          setIsSafetyResources(true);
        }}
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 40,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
