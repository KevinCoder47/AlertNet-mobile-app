// AppNavigator.js
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AnimatedSplash from '../screens/AnimatedSplash';
import Login from '../screens/LoginScreen';
import Signup from '../screens/signup'; // ✅ Import signup
import Home from '../screens/Home';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const status = await AsyncStorage.getItem('isLoggedIn');
      setIsLoggedIn(status === 'true');
      setIsLoading(false);
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowSplash(false);
    }, 5300);

    return () => clearTimeout(timeout);
  }, []);

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
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="LoginScreen">
              {(props) => <Login {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
            <Stack.Screen name="signup" component={Signup} />
          </>
        ) : (
          <Stack.Screen name="Home" component={Home} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
