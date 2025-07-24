import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Button } from 'react-native';
import { ThemeProvider, useTheme } from './assets/contexts/ColorContext';
import AppNavigator from './assets/navigation/AppNavigator';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SOS from './assets/screens/SOS';
import QrCode from './assets/screens/QrCode';
import { ScheduledSlotsProvider } from './assets/contexts/ScheduledSlotsContext';

const Stack = createStackNavigator();

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
