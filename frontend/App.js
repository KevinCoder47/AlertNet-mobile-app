import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './assets/navigation/AppNavigator';
import { ThemeProvider } from './assets/contexts/ColorContext';
import { Provider } from 'react-redux'; 

export default function App() {
  return (
      <ThemeProvider>
        <NavigationContainer>
            <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>

  );
}

const styles = StyleSheet.create({

});
