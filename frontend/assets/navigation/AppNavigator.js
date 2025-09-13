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
import Profile from '../componets/People/Profile';
import ChatScreen from '../componets/People/ChatScreen';


const Stack = createNativeStackNavigator();
<Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />

const AppNavigator = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        // Check login status only
        const loginStatus = await AsyncStorage.getItem('isLoggedIn');

        setIsLoggedIn(loginStatus === 'true');
      } catch (error) {
        console.error('Error reading storage:', error);
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
            await AsyncStorage.multiRemove([
              'userToken', 
              'userData', 
              '@saved_addresses' // Add this line to remove saved addresses
            ]);
            setIsLoggedIn(false);
            setOnboardingComplete(false);
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
        {!isLoggedIn && !onboardingComplete ? (
          <Stack.Screen name="OnBoarding">
            {(props) => (
              <OnBoarding
                {...props}
                setOnboardingComplete={setOnboardingComplete}
                setIsLoggedIn = {setIsLoggedIn}
              />
            )}
          </Stack.Screen>
        ) : !isLoggedIn ? (
          <>
            <Stack.Screen name="LoginScreen">
              {(props) => <Login {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
            <Stack.Screen name="signup">
              {(props) => <Signup {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
          </>
        ) : (
          <Stack.Screen name="Home">
                {(props) => <Home {...props} handleLogout={handleLogout} />
                }
          </Stack.Screen>      
        )}


        <Stack.Screen 
          name="Profile" 
          component={Profile} 
          options={({ route }) => ({ title: route.params?.person?.name || "Profile" })} 
        />
        
      <Stack.Screen 
        name="ChatScreen" 
        component={ChatScreen} 
        options={{ title: "Chat" }} 
      />

      </Stack.Navigator>


    </NavigationContainer>
  );
}

export default AppNavigator;