import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Button } from 'react-native';
import { ThemeProvider, useTheme } from './assets/contexts/ColorContext';
import AppNavigator from './assets/navigation/AppNavigator';
import { ScheduledSlotsProvider } from './assets/contexts/ScheduledSlotsContext';
import OnBoarding from './assets/screens/OnBoarding';

export default function App() {
  return (
    <ScheduledSlotsProvider>
      <ThemeProvider>
        <AppNavigator />
        {/* <OnBoarding /> */}
      </ThemeProvider>
    </ScheduledSlotsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});