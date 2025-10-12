import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, LogBox } from 'react-native';
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
import NotificationModal from './assets/componets/notifications/NotificationModal';
import DeepLinkHandler from './assets/componets/DeepLinkHandler';
import AcceptanceLoader from './assets/componets/Loaders/AcceptanceLoader';
import WalkingMap from './assets/componets/WalkingMapComponents/WalkingMap';
import WalkDetails from './assets/componets/WalkingMapComponents/WalkDetails';
import LocatePartner from './assets/componets/LocatePartner';



// Hide the location error
LogBox.ignoreLogs(['Error requesting background location']);

export default function App() {
  const batteryCleanupRef = useRef(null);
  const DummywalkDetails = {
    startLocation: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    destination: {
      latitude: 37.7949,
      longitude: -122.3994,
    },
    partnerLocation: { latitude: -26.2060, longitude: 28.0490 },
    meetUpPoint: { latitude: -26.2046, longitude: 28.0478 }
  }

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
        // // console.log($&);
        
        // Get user data from AsyncStorage
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) {
          // // console.log($&);
          return;
        }

        const user = JSON.parse(userData);
        const userId = user.uid || user.id || user.userId || user.UID;

        if (!userId) {
          // // console.log($&);
          return;
        }

        // // console.log($&);
        
        // Start monitoring and save cleanup function
        batteryCleanupRef.current = BatteryService.startBatteryMonitoring(userId);
        
        // // console.log($&);
        
      } catch (error) {
        // console.error('Error initializing battery monitoring:', error);
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
        // // console.log($&);
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
                <NotificationModal /> 

               
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