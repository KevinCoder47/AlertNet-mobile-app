// screens/LoginScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, Dimensions, ImageBackground,
  Alert, KeyboardAvoidingView, ScrollView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GeneralLoader from '../componets/Loaders/GeneralLoarder';
import { loginUser } from '../../backend/Firebase/authentication';
import { getUserDocument } from '../../services/firestore';
import { getExpoPushToken, savePushToken } from '../../services/firestore';


const backgroundImage = require('../images/launch-background.jpg');

const { width, height } = Dimensions.get('window');

const Login = ({ setIsLoggedIn, navigation }) => {
  const [emailPrefix, setEmailPrefix] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const scrollViewRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const scrollToInput = (inputRef) => {
    setTimeout(() => {
      inputRef.current?.measureLayout(
        scrollViewRef.current,
        (x, y) => {
          scrollViewRef.current?.scrollTo({
            y: y - 50, // Reduced offset since we have less scrollable content
            animated: true,
          });
        }
      );
    }, 100);
  };

const handleLogin = async () => {
  if (!emailPrefix.trim() || !password.trim()) {
    Alert.alert('Error', 'Please enter email and password.');
    return;
  }
  if (loading) return;

  setLoading(true);
  try {
    const email = `${emailPrefix}@student.uj.ac.za`; 
    const user = await loginUser(email, password);
    
    if (user && user.uid) {
      // Get user document from Firestore
      const userData = await getUserDocument(user.uid);
      // console.log($&);
      
      if (userData) {
        // Get and save push token
        // console.log($&);
        const pushToken = await getExpoPushToken();
        if (pushToken) {
          // console.log($&);
          await savePushToken(user.uid, pushToken);
          userData.pushToken = pushToken; // Add to userData object
        } else {
          // console.log($&);
        }

        // Store user data in AsyncStorage
        await AsyncStorage.multiSet([
          ['isLoggedIn', 'true'],
          ['userData', JSON.stringify(userData)],
          ['userId', user.uid]
        ]);
        
        setIsLoggedIn(true);
        Alert.alert('Success', `Welcome back, ${userData.name || user.email}!`);
      } else {
        throw new Error('User data not found in database');
      }
    } else {
      throw new Error('Authentication failed - no user returned');
    }
  } catch (error) {
    Alert.alert('Login Failed', error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      {/* Fixed Background Image */}
      <ImageBackground source={backgroundImage} style={styles.background}>
        {/* Fixed Title */}
        <Text style={styles.title}>
          <Text style={{ color: '#FE5235' }}>Hello</Text>,{"\n"}Welcome Back
        </Text>
      </ImageBackground>

      {/* Scrollable Form Container */}
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.formContainer}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.overlay}>
              {/* Email Field */}
              <View style={styles.inputContainer} ref={emailInputRef}>
                <Text style={styles.label}>Student E-mail</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name='mail-outline'
                    size={16}
                    style={styles.icon}
                  />
                  <TextInput
                    // placeholder="e.g. 123456"
                    placeholderTextColor="#717171"
                    style={styles.input}
                    value={emailPrefix}
                    onChangeText={setEmailPrefix}
                    onFocus={() => scrollToInput(emailInputRef)}
                  />
                  <Text style={styles.domain}>@student.uj.ac.za</Text>
                </View>
              </View>

              {/* Password Field */}
              <View style={styles.inputContainer} ref={passwordInputRef}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name='lock-closed-outline'
                    size={16}
                    style={styles.icon}
                  />
                  <TextInput
                    placeholder="Enter password"
                    placeholderTextColor="#717171"
                    style={[styles.input, !password && styles.placeholderText]}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => scrollToInput(passwordInputRef)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#717171"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </View>

              {/* Login Button */}
              <TouchableOpacity onPress={handleLogin}>
                <LinearGradient
                  colors={['#C84022', '#9e2d2d']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginBtn}
                >
                  <Text style={styles.loginText}>Sign In</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <Text style={styles.loginLink}>
                Don't have an Account?{' '}
                <Text
                  style={styles.loginLinkBold}
                  onPress={() => navigation.navigate('signup')}
                >
                  Sign Up
                </Text>
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {loading && (
        <GeneralLoader />
      )}
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
    marginTop: 270,
    marginLeft: 17
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  formContainer: {
    height: 445,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  overlay: {
    flex: 1,
    padding: 40,
    justifyContent: 'center',
    backgroundColor: '#FEF7EE',
    borderRadius: 50,
    minHeight: 445,
  },
  label: {
    color: 'black',
    marginBottom: 15,
    fontSize: 14,
    fontWeight: 500,
    marginLeft: 15
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFE1BB',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    width: width * 0.8, //312
    height: 55 // 55
  },
  input: {
    flex: 1,
    color: 'black',
    fontSize: 16,
  },
  icon: {
    width: 16,
    height: 16,
    opacity: 0.5,
    marginRight: 10
  },
  domain: {
    color: '#717171',
    fontSize: 11,
  },
  forgot: {
    marginTop: 6,
    color: '#525252',
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  loginBtn: {
    flexDirection: 'row',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    height: 52,
    width: 170,
    alignSelf: 'center'
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 30,
    textAlign: 'center',
    color: '#525252',
    fontSize: 10
  },
  loginLinkBold: {
    color: '#B36B6B',
    fontWeight: 'bold',
    fontSize: 10
  },
  placeholderText: {
    fontSize: 11,
  },
});