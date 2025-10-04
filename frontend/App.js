import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import React, { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from './assets/contexts/ColorContext';
import { FriendsProvider } from './assets/contexts/FriendsContext'; 
import AppNavigator from './assets/navigation/AppNavigator';
import { ScheduledSlotsProvider } from './assets/contexts/ScheduledSlotsContext';
import { LanguageProvider } from './assets/screens/SafetyResource_Screens/LanguagePage';
import { NotificationProvider } from './assets/contexts/NotificationContext';
import { FontSizeProvider } from './assets/contexts/FontSizeContext';
import { SOSService } from './assets/services/SOSService';
import { BatteryService } from './assets/services/BatteryService';
import './backend/Firebase/FirebaseConfig';
import NotificationHandler from './assets/componets/NotificationHandler';

export default function App() {
  const batteryCleanupRef = useRef(null);

  useEffect(() => {
    const initializeFCM = async () => {
      try {
        const listeners = SOSService.setupNotificationListeners();
        await SOSService.initializeFCM();
        return () => {
          SOSService.removeNotificationListeners(listeners);
        };
      } catch (error) {
        console.error('Error initializing FCM:', error);
      }
    };

    initializeFCM();
  }, []);

  // NEW: Battery monitoring initialization
  useEffect(() => {
    const initializeBatteryMonitoring = async () => {
      try {
        console.log('Initializing battery monitoring...');
        
        // Get user data from AsyncStorage
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) {
          console.log('No user data found, waiting for login...');
          return;
        }

        const user = JSON.parse(userData);
        const userId = user.uid || user.id || user.userId || user.UID;

        if (!userId) {
          console.log('No valid userId found in user data');
          return;
        }

        console.log('Starting battery monitoring for user:', userId);
        
        // Start monitoring and save cleanup function
        batteryCleanupRef.current = BatteryService.startBatteryMonitoring(userId);
        
        console.log('Battery monitoring initialized successfully');
        
      } catch (error) {
        console.error('Error initializing battery monitoring:', error);
      }
    };

    // Delay initialization slightly to ensure AsyncStorage is ready
    const timeout = setTimeout(() => {
      initializeBatteryMonitoring();
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearTimeout(timeout);
      if (batteryCleanupRef.current) {
        console.log('Cleaning up battery monitoring');
        batteryCleanupRef.current();
      }
    };
  }, []);

  return (
    <NotificationProvider>
      <LanguageProvider>
        <ScheduledSlotsProvider>
          <ThemeProvider>
            <FontSizeProvider>
              <FriendsProvider>
                <View style={styles.container}>
                  <AppNavigator />
                  <NotificationHandler /> 
                  <StatusBar style="auto" />
                </View>
              </FriendsProvider>
            </FontSizeProvider>
          </ThemeProvider>
        </ScheduledSlotsProvider>
      </LanguageProvider>
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});