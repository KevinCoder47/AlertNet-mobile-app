// AppNavigator.js
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Alert } from 'react-native'; // Added Alert import
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AnimatedSplash from '../screens/AnimatedSplash';
import Login from '../screens/LoginScreen';
import Signup from '../screens/signup';
import Home from '../screens/Home';
import OnBoarding from '../screens/OnBoarding';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        // Check both login status and onboarding completion
        const [loginStatus, onboardingDone] = await Promise.all([
          AsyncStorage.getItem('isLoggedIn'),
          AsyncStorage.getItem('onboardingDone')
        ]);

        setIsLoggedIn(loginStatus === 'true');
        setShowOnboarding(onboardingDone !== 'true');
      } catch (error) {
        console.error('Error reading storage:', error);
        // Fallback to showing onboarding if there's an error
        setShowOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialStatus();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowSplash(false);
    }, 5300);

    return () => clearTimeout(timeout);
  }, []);

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('onboardingDone', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  // LOG OUT FUNCTION
const handleLogout = () => {
  Alert.alert(
    'Logout Confirmation',
    'Are you sure you want to log out?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Log Out',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('isLoggedIn');
            await AsyncStorage.multiRemove(['userToken', 'userData']);
            setIsLoggedIn(false);
            setShowOnboarding(true);
          } catch (error) {
            console.error('Logout failed:', error);
            Alert.alert('Logout Error', 'Failed to log out. Please try again.');
          }
        },
        style: 'destructive',
      },
    ]
  );
};

  if (showSplash) return <AnimatedSplash />;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="Home">
            {(props) => <Home {...props} handleLogout={handleLogout} />}
          </Stack.Screen>
        ) : showOnboarding ? (
          <Stack.Screen name="OnBoarding">
            {(props) => (
              <OnBoarding
                {...props}
                onComplete={handleOnboardingComplete}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="LoginScreen">
              {(props) => <Login {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
            <Stack.Screen name="signup" component={Signup} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;