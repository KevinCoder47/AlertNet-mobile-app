import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Button } from 'react-native';
import { ThemeProvider, useTheme } from './assets/contexts/ColorContext';
import AppNavigator from './assets/navigation/AppNavigator';
import { ScheduledSlotsProvider } from './assets/contexts/ScheduledSlotsContext';
import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  '[expo-av]: Expo AV has been deprecated',
  'Video component from `expo-av` is deprecated',
]);


export default function App() {
  return (
    <ScheduledSlotsProvider>
      <ThemeProvider>
        <AppNavigator />
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