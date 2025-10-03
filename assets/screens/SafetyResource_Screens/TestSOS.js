// screens/TestSOS.js
import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { SOSService } from '../../services/SOSService';
import { useFontSize } from '../../contexts/FontSizeContext';
import { useTheme } from '../../contexts/ColorContext';
import { LinearGradient } from 'expo-linear-gradient';

import Feather from '@expo/vector-icons/Feather';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

export default function TestSOS({ setIsSafetyResources, setIsTestSOS }) {
  const [sosTriggered, setSosTriggered] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Checking...');
  const [pulseAnim] = useState(new Animated.Value(1));
  const { getScaledFontSize } = useFontSize();
  const { colors } = useTheme();

  useEffect(() => {
    const checkLocation = async () => {
      const locationCheck = await SOSService.checkLocationServices();
      setLocationEnabled(locationCheck.enabled);
      setLocationStatus(locationCheck.enabled ? 'enabled' : 'disabled');
    };
    checkLocation();
  }, []);

  useEffect(() => {
    if (sosTriggered) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [sosTriggered]);

  const handlePress = async () => {
    setSosTriggered(true);

    const locationCheck = await SOSService.checkLocationServices();
    if (!locationCheck.enabled) {
      Alert.alert(
        '⚠️ Location Services Disabled',
        'Your location is currently disabled. Emergency contacts will not receive your location.\n\nTo enable location:\n1. Go to Settings\n2. Find Location/Privacy\n3. Enable location for this app\n\nDo you want to continue the test without location?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setSosTriggered(false) },
          { text: 'Continue Test', onPress: () => runTest() },
        ]
      );
      return;
    }

    runTest();
  };

  const runTest = async () => {
    const result = await SOSService.testEmergencyNotifications();

    if (result.success) {
      let alertMessage = 'SOS Test Completed!\n\n';

      const locationInfo = result.location
        ? `📍 Location: ${result.location.latitude.toFixed(4)}, ${result.location.longitude.toFixed(4)} (Available)`
        : '📍 Location: Unavailable';
      alertMessage += `${locationInfo}\n\n`;

      if (result.smsTest && result.smsTest.contactsFound > 0) {
        const contactsList = result.smsTest.contacts.map((c) => c.name).join(', ');
        alertMessage += `📱 SMS Contacts (${result.smsTest.contactsFound}):\n${contactsList}\n\n`;
        alertMessage += `💬 SMS Preview:\n"${result.smsTest.message.substring(0, 100)}..."\n\n`;
      } else {
        alertMessage += '📱 No SMS emergency contacts found.\n\n';
      }

      if (result.appFriendsTest) {
        alertMessage += `👥 App Friends:\n- Total Friends: ${result.appFriendsTest.totalFriends}\n- Ready for notifications: ${result.appFriendsTest.friendsWithTokens}\n\n`;
      } else {
        alertMessage += '👥 No app friends found.\n\n';
      }

      alertMessage += 'No real messages or notifications were sent.';

      Alert.alert('✅ SOS Test Results', alertMessage, [{ text: 'OK' }]);
    } else {
      Alert.alert(
        'SOS Test Failed',
        result.error || 'Test failed. Please check your emergency contacts and location settings.',
        [{ text: 'OK' }]
      );
    }

    setSosTriggered(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          onPress={() => { setIsTestSOS(false); setIsSafetyResources(true); }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { fontSize: getScaledFontSize(20), color: colors.text }]}>
            Test SOS System
          </Text>
          <Text style={[styles.headerSubtitle, { fontSize: getScaledFontSize(13), color: colors.textSecondary || colors.text }]}>
            Verify your emergency setup
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <View style={styles.statusHeader}>
            <Feather name="shield" size={24} color={locationEnabled ? '#10B981' : '#EF4444'} />
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusTitle, { fontSize: getScaledFontSize(16), color: colors.text }]}>
                System Status
              </Text>
              <Text style={[styles.statusSubtitle, { fontSize: getScaledFontSize(13), color: colors.textSecondary || colors.text }]}>
                Real-time monitoring
              </Text>
            </View>
          </View>
          
          <View style={styles.statusDivider} />
          
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Feather name="map-pin" size={20} color={locationEnabled ? '#10B981' : '#EF4444'} />
              <View style={styles.statusItemText}>
                <Text style={[styles.statusLabel, { fontSize: getScaledFontSize(12), color: colors.textSecondary || colors.text }]}>
                  Location Services
                </Text>
                <Text style={[styles.statusValue, { 
                  fontSize: getScaledFontSize(14), 
                  color: locationEnabled ? '#10B981' : '#EF4444' 
                }]}>
                  {locationStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: getScaledFontSize(18), color: colors.text }]}>
            How It Works
          </Text>
        </View>

        <View style={[styles.stepCard, { backgroundColor: colors.card }]}>
          <View style={styles.stepNumber}>
            <Text style={[styles.stepNumberText, { fontSize: getScaledFontSize(14) }]}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { fontSize: getScaledFontSize(15), color: colors.text }]}>
              Press Test Button
            </Text>
            <Text style={[styles.stepDescription, { fontSize: getScaledFontSize(13), color: colors.textSecondary || colors.text }]}>
              Tap the SOS button below to initiate a safe test
            </Text>
          </View>
        </View>

        <View style={[styles.stepCard, { backgroundColor: colors.card }]}>
          <View style={styles.stepNumber}>
            <Text style={[styles.stepNumberText, { fontSize: getScaledFontSize(14) }]}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { fontSize: getScaledFontSize(15), color: colors.text }]}>
              System Verification
            </Text>
            <Text style={[styles.stepDescription, { fontSize: getScaledFontSize(13), color: colors.textSecondary || colors.text }]}>
              We'll check your emergency contacts and location
            </Text>
          </View>
        </View>

        <View style={[styles.stepCard, { backgroundColor: colors.card }]}>
          <View style={styles.stepNumber}>
            <Text style={[styles.stepNumberText, { fontSize: getScaledFontSize(14) }]}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { fontSize: getScaledFontSize(15), color: colors.text }]}>
              Review Results
            </Text>
            <Text style={[styles.stepDescription, { fontSize: getScaledFontSize(13), color: colors.textSecondary || colors.text }]}>
              See a detailed report of your SOS configuration
            </Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={[styles.infoCard, { backgroundColor: '#3B82F6' + '20' }]}>
          <Feather name="info" size={20} color="#3B82F6" />
          <Text style={[styles.infoText, { fontSize: getScaledFontSize(13), color: colors.text }]}>
            Test your SOS system <Text style={styles.infoBold}>at least once a month</Text> to ensure reliability
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: '#8B5CF6' + '20' }]}>
          <Feather name="zap" size={20} color="#8B5CF6" />
          <Text style={[styles.infoText, { fontSize: getScaledFontSize(13), color: colors.text }]}>
            Activate via <Text style={styles.infoBold}>voice command</Text>, <Text style={styles.infoBold}>phone button</Text>, or <Text style={styles.infoBold}>in-app trigger</Text>
          </Text>
        </View>

        {/* Test Button Section */}
        <View style={styles.testSection}>
          <Text style={[styles.testLabel, { fontSize: getScaledFontSize(12), color: colors.textSecondary || colors.text }]}>
            SAFE TEST MODE
          </Text>
          <Text style={[styles.testTitle, { fontSize: getScaledFontSize(16), color: colors.text }]}>
            No messages will be sent
          </Text>
          
          <Animated.View style={[styles.sosButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity 
              onPress={handlePress} 
              activeOpacity={0.9}
              disabled={sosTriggered}
            >
              <View style={[styles.sosButtonOuter, sosTriggered && styles.sosButtonOuterActive]}>
                <View style={[styles.sosButton, sosTriggered && styles.sosButtonActive]}>
                  <Feather name="alert-circle" size={32} color="white" />
                  <Text style={[styles.sosButtonText, { fontSize: getScaledFontSize(18) }]}>
                    {sosTriggered ? 'TESTING...' : 'TEST SOS'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Constants.statusBarHeight + 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  statusSubtitle: {
    opacity: 0.7,
  },
  statusDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
    opacity: 0.3,
  },
  statusRow: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItemText: {
    marginLeft: 12,
    flex: 1,
  },
  statusLabel: {
    marginBottom: 2,
    opacity: 0.7,
  },
  statusValue: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  stepCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    opacity: 0.7,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '600',
  },
  testSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  testLabel: {
    letterSpacing: 1.5,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: 8,
  },
  testTitle: {
    fontWeight: '600',
    marginBottom: 32,
  },
  sosButtonContainer: {
    alignItems: 'center',
  },
  sosButtonOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sosButtonOuterActive: {
    backgroundColor: '#FECACA',
  },
  sosButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sosButtonActive: {
    backgroundColor: '#DC2626',
  },
  sosButtonText: {
    color: 'white',
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.5,
  },
});