// CORRECTED IMPORT STATEMENTS
import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Easing,
  Alert,
} from 'react-native';
// ---

import Feather from '@expo/vector-icons/Feather';
import * as Location from 'expo-location';

// Reusable SOS Button Component
const SOSBtn = ({ onPressIn, onPressOut, isPressed, isTriggered }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Scale animation for press feedback
    Animated.timing(scaleValue, {
      toValue: isPressed ? 0.9 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isPressed]);

  useEffect(() => {
    // Pulsing animation when SOS is triggered
    if (isTriggered) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, { toValue: 1.1, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseValue, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      // Stop the animation if it's running
      pulseValue.stopAnimation(() => pulseValue.setValue(1));
    }
  }, [isTriggered]);

  const animatedStyle = {
    transform: [{ scale: Animated.multiply(scaleValue, pulseValue) }],
  };

  return (
    <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={0.8}>
      <Animated.View style={[styles.sosButton, animatedStyle, isTriggered && styles.sosButtonTriggered]}>
        <Text style={styles.sosButtonText}>SOS</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function TestSOS({ setIsSafetyResources, setIsTestSOS }) {
  const [isHolding, setIsHolding] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Checking...");
  const timerRef = useRef(null);

  useEffect(() => {
    // Check for location services when the component mounts
    const checkLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationStatus("Permission denied");
          setLocationEnabled(false);
          return;
        }

        let servicesEnabled = await Location.hasServicesEnabledAsync();
        setLocationEnabled(servicesEnabled);
        setLocationStatus(servicesEnabled ? "enabled" : "disabled");
      } catch (error) {
        console.error("Error checking location services:", error);
        setLocationStatus("Error checking status");
        setLocationEnabled(false);
        Alert.alert("Location Error", "Could not check location services. Please ensure the app has permissions and location is turned on in your device settings.");
      }
    };
    checkLocation();
  }, []);

  const handlePressIn = () => {
    setIsHolding(true);
    setSosTriggered(false); // Reset on new press
    timerRef.current = setTimeout(() => {
      setSosTriggered(true);
      setIsHolding(false); // Stop the "holding" state once triggered
      Alert.alert("SOS Simulated", "Your test was successful. No real alert has been sent.");
    }, 3000); // 3-second hold
  };

  const handlePressOut = () => {
    // Only clear the timer if it hasn't already triggered the SOS
    if (isHolding) {
      setIsHolding(false);
      clearTimeout(timerRef.current);
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
            <Text style={styles.step}><Text style={styles.bold}>1.</Text> Hold the <Text style={styles.bold}>TEST NOW Button</Text> below for 3 seconds.</Text>
            <Text style={styles.step}><Text style={styles.bold}>2.</Text> App will <Text style={styles.bold}>simulate an SOS message</Text>.</Text>
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
            <SOSBtn
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              isPressed={isHolding}
              isTriggered={sosTriggered}
            />
          </View>
          {isHolding && !sosTriggered && <Text style={styles.holdFeedback}>Keep Holding...</Text>}
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