import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import React, { useEffect } from 'react';
import { ThemeProvider } from './assets/contexts/ColorContext';
import { FriendsProvider } from './assets/contexts/FriendsContext'; 
import AppNavigator from './assets/navigation/AppNavigator';
import { ScheduledSlotsProvider } from './assets/contexts/ScheduledSlotsContext';
import { LanguageProvider } from './assets/screens/SafetyResource_Screens/LanguagePage';
import { NotificationProvider } from './assets/contexts/NotificationContext';
import { FontSizeProvider } from './assets/contexts/FontSizeContext';
import { SOSService } from './assets/services/SOSService';
import './backend/Firebase/FirebaseConfig';
import NotificationHandler from './assets/componets/NotificationHandler';

export default function App() {
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

  return (
    <NotificationProvider>
      <LanguageProvider>
        <ScheduledSlotsProvider>
          <ThemeProvider>
            <FontSizeProvider>
              <FriendsProvider> {/* NEW: Wrap with FriendsProvider */}
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