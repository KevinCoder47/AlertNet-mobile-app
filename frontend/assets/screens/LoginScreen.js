// screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, Dimensions, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const backgroundImage = require('../../assets/background.jpg');

const { width, height } = Dimensions.get('window');

const Login = ({ setIsLoggedIn, navigation }) => {
  const [emailPrefix, setEmailPrefix] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (emailPrefix.trim() && password.trim()) {
      await AsyncStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true);
    } else {
      alert('Please enter email and password.');
    }
  };

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Hello,{"\n"}Welcome Back</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Student E-mail</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="e.g. 123456"
              placeholderTextColor="#ccc"
              style={styles.input}
              value={emailPrefix}
              onChangeText={setEmailPrefix}
            />
            <Text style={styles.domain}>@student.uj.ac.za</Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Enter password"
              placeholderTextColor="#ccc"
              style={styles.input}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#ccc"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </View>

        <TouchableOpacity onPress={handleLogin}>
          <LinearGradient
            colors={['#fa6a6a', '#9e2d2d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loginBtn}
          >
            <Text style={styles.loginText}>Sign In</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* ✅ Sign Up Link with Navigation */}
        <Text style={styles.signup}>
          Don't have an Account?{' '}
          <Text
            style={styles.signupLink}
            onPress={() => navigation.navigate('signup')}
          >
            Sign Up
          </Text>
        </Text>
      </View>
    </ImageBackground>
  );
};

export default Login;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '600',
    marginBottom: 40,
  },
  label: {
    color: '#fff',
    marginBottom: 6,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  domain: {
    color: '#ccc',
    fontSize: 14,
  },
  forgot: {
    marginTop: 6,
    color: '#ccc',
    fontSize: 12,
    alignSelf: 'flex-end',
  },
  loginBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signup: {
    marginTop: 30,
    textAlign: 'center',
    color: '#fff',
  },
  signupLink: {
    color: '#ffbaba',
    fontWeight: 'bold',
  },
});
