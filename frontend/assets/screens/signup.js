// screens/signup.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, Dimensions, ImageBackground, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const backgroundImage = require('../../assets/background.jpg');

const SignupScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !phoneNumber || !emailPrefix || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      await AsyncStorage.setItem('userEmail', `${emailPrefix}@student.uj.ac.za`);
      await AsyncStorage.setItem('userPassword', password);
      Alert.alert('Success', 'Account created! Please sign in.');
      navigation.navigate('LoginScreen');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong during sign up.');
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background}>
      <View style={styles.overlay}>
        <Text style={styles.title}>Sign Up</Text>

        {/* Full Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Student Full Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Name and Surname"
              placeholderTextColor="#ccc"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
            />
          </View>
        </View>

        {/* Phone Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Text style={{ color: '#ccc', marginRight: 5 }}>ZA 🇿🇦 +27</Text>
            <TextInput
              placeholder="78 401 1806"
              placeholderTextColor="#ccc"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={styles.input}
            />
          </View>
        </View>

        {/* Student Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Student E-mail</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="e.g. 123456"
              placeholderTextColor="#ccc"
              value={emailPrefix}
              onChangeText={setEmailPrefix}
              style={styles.input}
            />
            <Text style={styles.domain}>@student.uj.ac.za</Text>
          </View>
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Enter password"
              placeholderTextColor="#ccc"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#ccc"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Confirm password"
              placeholderTextColor="#ccc"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons
                name={showConfirm ? 'eye-off' : 'eye'}
                size={20}
                color="#ccc"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity onPress={handleSignup}>
          <LinearGradient
            colors={['#fa6a6a', '#9e2d2d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.signupBtn}
          >
            <Text style={styles.signupText}>Sign Up</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.loginLink}>
          Already have an Account?{' '}
          <Text
            style={styles.loginLinkBold}
            onPress={() => navigation.navigate('LoginScreen')}
          >
            Sign In
          </Text>
        </Text>
      </View>
    </ImageBackground>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width,
    height,
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
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    color: '#fff',
    marginBottom: 6,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 15,
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
  signupBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  signupText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 30,
    textAlign: 'center',
    color: '#fff',
  },
  loginLinkBold: {
    color: '#ffbaba',
    fontWeight: 'bold',
  },
});
