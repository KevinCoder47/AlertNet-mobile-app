import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Button } from 'react-native';
import { ThemeProvider, useTheme } from './assets/contexts/ColorContext';
import AppNavigator from './assets/navigation/AppNavigator';
import { ScheduledSlotsProvider } from './assets/contexts/ScheduledSlotsContext';
import { LanguageProvider } from './assets/screens/SafetyResource_Screens/LanguagePage';
import './backend/Firebase/FirebaseConfig';


export default function App() {
  return (
    <LanguageProvider>
      <ScheduledSlotsProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </ScheduledSlotsProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});