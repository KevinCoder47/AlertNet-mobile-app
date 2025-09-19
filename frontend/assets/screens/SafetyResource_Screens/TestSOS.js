// CORRECTED IMPORT STATEMENTS
import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import SOSService from '../../services/SOSService';
// ---

import Feather from '@expo/vector-icons/Feather';
import * as Location from 'expo-location';



export default function TestSOS({ setIsSafetyResources, setIsTestSOS }) {
  const [sosTriggered, setSosTriggered] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Checking...");

  useEffect(() => {
    // Check for location services when the component mounts
    const checkLocation = async () => {
      const locationCheck = await SOSService.checkLocationServices();
      setLocationEnabled(locationCheck.enabled);
      setLocationStatus(locationCheck.enabled ? "enabled" : "disabled");
    };
    checkLocation();
  }, []);

  const handlePress = async () => {
    setSosTriggered(true);
    
    // Check location services first
    const locationCheck = await SOSService.checkLocationServices();
    if (!locationCheck.enabled) {
      Alert.alert(
        "⚠️ Location Services Disabled",
        "Your location is currently disabled. Emergency contacts will not receive your location.\n\nTo enable location:\n1. Go to Settings\n2. Find Location/Privacy\n3. Enable location for this app\n\nDo you want to continue the test without location?",
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setSosTriggered(false) },
          { text: 'Continue Test', onPress: () => runTest() }
        ]
      );
      return;
    }
    
    runTest();
  };

  const runTest = async () => {
    // Simulate the emergency notification process
    const result = await SOSService.testEmergencyNotifications();
    
    if (result.success) {
      let alertMessage = "SOS Test Completed!\n\n";
      
      // Location Info
      const locationInfo = result.location 
        ? `📍 Location: ${result.location.latitude.toFixed(4)}, ${result.location.longitude.toFixed(4)} (Available)`
        : '📍 Location: Unavailable';
      alertMessage += `${locationInfo}\n\n`;

      // SMS Contacts Info
      if (result.smsTest && result.smsTest.contactsFound > 0) {
        const contactsList = result.smsTest.contacts.map(c => c.name).join(', ');
        alertMessage += `📱 SMS Contacts (${result.smsTest.contactsFound}):\n${contactsList}\n\n`;
        alertMessage += `💬 SMS Preview:\n"${result.smsTest.message.substring(0, 100)}..."\n\n`;
      } else {
        alertMessage += "📱 No SMS emergency contacts found.\n\n";
      }

      // App Friends Info
      if (result.appFriendsTest) {
        alertMessage += `👥 App Friends:\n- Total Friends: ${result.appFriendsTest.totalFriends}\n- Ready for notifications: ${result.appFriendsTest.friendsWithTokens}\n\n`;
      } else {
        alertMessage += "👥 No app friends found.\n\n";
      }

      alertMessage += "No real messages or notifications were sent.";
      
      Alert.alert(
        "✅ SOS Test Results",
        alertMessage,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        "SOS Test Failed",
        result.error || 'Test failed. Please check your emergency contacts and location settings.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => { setIsTestSOS(false); setIsSafetyResources(true); }}>
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Test SOS</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Subheading */}
        <Text style={styles.subtitle}>
          Learn how to activate the SOS feature and <Text style={styles.bold}>test its function safely.</Text>
        </Text>

        {/* Instruction Box */}
        <View style={[styles.infoBox, styles.infoBoxRow]}>
          <View style={styles.sosButtonPlaceholder}>
            {/* This button is for visual instruction only, not functional */}
            <View style={styles.sosButton}><Text style={styles.sosButtonText}>SOS</Text></View>
          </View>
          <View style={styles.instructions}>
            <Text style={styles.step}><Text style={styles.bold}>1.</Text> Press the <Text style={styles.bold}>TEST NOW Button</Text> below.</Text>
            <Text style={styles.step}><Text style={styles.bold}>2.</Text> App will <Text style={styles.bold}>test emergency contacts and location</Text>.</Text>
            <Text style={styles.step}>
              <Text style={styles.bold}>3.</Text> Location is <Text style={[styles.bold, { color: locationEnabled ? 'green' : 'red' }]}>{locationStatus}</Text>.
            </Text>
          </View>
        </View>

        {/* Info Boxes */}
        <View style={styles.infoBox}><Text style={styles.infoText}>Use this <Text style={styles.bold}>Test at least once a month</Text> to ensure everything is working.</Text></View>
        <View style={styles.infoBox}><Text style={styles.infoText}>Our SOS is <Text style={styles.bold}>Voice activated</Text> (Optional), <Text style={styles.bold}>Triggered by your phone button</Text> (Default), and can be <Text style={styles.bold}>Triggered on the app</Text>.</Text></View>

        {/* Final Test Button */}
        <View style={styles.testNow}>
          <Text style={styles.testNowTitle}>TEST NOW</Text>
          <Text style={styles.testNowSubtitle}>This is only a Test</Text>
          <View style={styles.redBtnWrapper}>
            <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
              <View style={[styles.sosButton, sosTriggered && styles.sosButtonTriggered]}>
                <Text style={styles.sosButtonText}>SOS</Text>
              </View>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 20 },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#444", textAlign: "center", marginBottom: 20 },
  bold: { fontWeight: "bold" },
  infoBox: { backgroundColor: "#F5F5F5", borderRadius: 10, padding: 15, marginBottom: 15 },
  infoBoxRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  infoText: { fontSize: 14, color: "#333", lineHeight: 20 },
  sosButtonPlaceholder: { alignItems: "center" },
  instructions: { gap: 10, flex: 1 },
  step: { fontSize: 14, color: "#333", lineHeight: 20 },
  testNow: { alignItems: "center", marginTop: 30 },
  testNowTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  testNowSubtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  redBtnWrapper: { alignItems: "center" },
  holdFeedback: { marginTop: 15, color: 'blue', fontSize: 14, fontWeight: 'bold' },
  sosButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2 },
  sosButtonText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  sosButtonTriggered: { backgroundColor: '#c00' }, // Darker red when triggered
});