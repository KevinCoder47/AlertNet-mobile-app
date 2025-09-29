import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFontSize } from '../../contexts/FontSizeContext'; // Import font size context

export default function Unsafe({ setIsUnsafePage, setIsSafetyResources }) {
  const { getScaledFontSize } = useFontSize(); // Use font size hook

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        {/* Back Button - Fixed position */}
        <TouchableOpacity 
          style={styles.backArrow}
          onPress={() => {
            setIsUnsafePage(false);
            setIsSafetyResources(true);
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { fontSize: getScaledFontSize(18) }]}>
              Feeling Unsafe?
            </Text>
            <Text style={[styles.headerSubtitle, { fontSize: getScaledFontSize(14) }]}>
              Follow these steps...
            </Text>
          </View>
        </View>

      {/* Quick Action Buttons Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: getScaledFontSize(16) }]}>
          1. Quick Action Buttons
        </Text>
        
        <View style={styles.actionItem}>
          <View style={styles.itemContainer}>
            <Text style={[styles.actionTitle, { fontSize: getScaledFontSize(16) }]}>
              Panic Word Activated
            </Text>
            <Text style={[styles.actionDescription, { fontSize: getScaledFontSize(14) }]}>
              Say your emergency word now.
            </Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot}></View>
              <Text style={[styles.statusText, { fontSize: getScaledFontSize(12) }]}>
                IT IS NOT ACTIVATED
              </Text>
              <Text style={[styles.activateText, { fontSize: getScaledFontSize(12) }]}>
                click here to activate
              </Text>
            </View>
            <TouchableOpacity style={styles.voiceTriggerButton}>
              <Text style={[styles.voiceTriggerText, { fontSize: getScaledFontSize(12) }]}>
                Voice Trigger
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionItem}>
          <View style={styles.itemContainer}>
            <View style={styles.sosContainer}>
              <View style={styles.sosIconContainer}>
                <View style={styles.sosIcon}>
                  <Text style={[styles.sosText, { fontSize: getScaledFontSize(11) }]}>
                    SOS
                  </Text>
                </View>
              </View>
              <View style={styles.sosContent}>
                <Text style={[styles.actionTitle, { fontSize: getScaledFontSize(16) }]}>
                  Trigger SOS
                </Text>
                <Text style={[styles.actionDescription, { fontSize: getScaledFontSize(14) }]}>
                  Discreetly alert your emergency contacts.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionItem}>
          <View style={styles.itemContainer}>
            <View style={styles.locationContainer}>
              <View style={styles.locationIcon}>
                <MaterialIcons name="location-on" size={28} color="#fff" />
              </View>
              <View style={styles.locationContent}>
                <Text style={[styles.actionTitle, { fontSize: getScaledFontSize(16) }]}>
                  Share Location
                </Text>
                <Text style={[styles.actionDescription, { fontSize: getScaledFontSize(14) }]}>
                  Live updates to trusted contacts.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Situational Advice Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: getScaledFontSize(16) }]}>
          2. Situational Advice
        </Text>
        
        <View style={styles.adviceItem}>
          <View style={styles.itemContainer}>
            <Text style={[styles.adviceTitle, { fontSize: getScaledFontSize(16) }]}>
              Trust Your Instincts
            </Text>
            <Text style={[styles.adviceDescription, { fontSize: getScaledFontSize(14) }]}>
              If something feels off, it probably is. Cross the street or change direction.
            </Text>
          </View>
        </View>

        <View style={styles.adviceItem}>
          <View style={styles.itemContainer}>
            <Text style={[styles.adviceTitle, { fontSize: getScaledFontSize(16) }]}>
              Call Someone
            </Text>
            <Text style={[styles.adviceDescription, { fontSize: getScaledFontSize(14) }]}>
              Speak to a friend or use the in-app emergency call.
            </Text>
          </View>
        </View>

        <View style={styles.adviceItem}>
          <View style={styles.itemContainer}>
            <Text style={[styles.adviceTitle, { fontSize: getScaledFontSize(16) }]}>
              Head to Safety
            </Text>
            <Text style={[styles.adviceDescription, { fontSize: getScaledFontSize(14) }]}>
              Try to walk in a safe zone areas.
            </Text>
          </View>
        </View>

        <View style={styles.adviceItem}>
          <View style={styles.itemContainer}>
            <Text style={[styles.adviceTitle, { fontSize: getScaledFontSize(16) }]}>
              Ask for Help
            </Text>
            <Text style={[styles.adviceDescription, { fontSize: getScaledFontSize(14) }]}>
              Enter a shop, approach a guard, or ask a bystander.
            </Text>
          </View>
        </View>
      </View>

      {/* Safety Priority Message */}
      <Text style={[styles.safetyMessage, { fontSize: getScaledFontSize(14) }]}>
        Your safety is our priority.
      </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setIsUnsafePage(false);
            setIsSafetyResources(true);
          }}
        >
          <Text style={[styles.backButtonText, { fontSize: getScaledFontSize(16) }]}>
            Back to Safety Resources
          </Text>
        </TouchableOpacity>
              </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Constants.statusBarHeight,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50, // Adjusted for new header positioning
  },
  scrollContent: {
    paddingBottom: 80,
  },
  backArrow: {
    position: 'absolute',
    top: 10,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 16,
  },
  actionItem: {
    marginBottom: 16,
  },
  actionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
    marginRight: 8,
  },
  statusText: {
    color: '#e74c3c',
    fontWeight: '600',
    marginRight: 8,
  },
  activateText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  voiceTriggerButton: {
    backgroundColor: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
    marginTop: 8,
  },
  voiceTriggerText: {
    color: '#fff',
  },
  sosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sosIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: '#ddd',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sosIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#333',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sosContent: {
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#666',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationContent: {
    flex: 1,
  },
  adviceItem: {
    marginBottom: 16,
  },
  adviceTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  adviceDescription: {
    color: '#666',
    lineHeight: 20,
  },
  safetyMessage: {
    textAlign: 'center',
    color: '#e74c3c',
    fontWeight: '600',
    marginBottom: 40,
    marginTop: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});