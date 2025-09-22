import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Button } from 'react-native';
import React, { useEffect } from 'react';
import { ThemeProvider, useTheme } from './assets/contexts/ColorContext';
import AppNavigator from './assets/navigation/AppNavigator';
import { ScheduledSlotsProvider } from './assets/contexts/ScheduledSlotsContext';
import { LanguageProvider } from './assets/screens/SafetyResource_Screens/LanguagePage';
import { NotificationProvider } from './assets/contexts/NotificationContext';
import { SOSService } from './assets/services/SOSService';
import './backend/Firebase/FirebaseConfig';

export default function App() {
  useEffect(() => {
    // Initialize Firebase Cloud Messaging when app starts
    const initializeFCM = async () => {
      try {
        // Set up notification listeners
        const listeners = SOSService.setupNotificationListeners();
        
        // Initialize FCM (will be called again when user logs in)
        await SOSService.initializeFCM();
        
        // Clean up listeners when app unmounts
        return () => {
          SOSService.removeNotificationListeners(listeners);
        };
      } catch (error) {
        console.error('Error initializing FCM:', error);
      }
    };

    initializeFCM();
  }, []);

  return (
    <NotificationProvider>
      <LanguageProvider>
        <ScheduledSlotsProvider>
          <ThemeProvider>
            <AppNavigator />
          </ThemeProvider>
        </ScheduledSlotsProvider>
      </LanguageProvider>
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});