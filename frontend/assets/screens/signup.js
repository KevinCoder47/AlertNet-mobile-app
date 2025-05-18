import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Vibration,
  Animated,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';

// Helper for password strength (optional, reused)
const getPasswordStrength = (password) => {
  if (password.length === 0) return { label: '', color: 'transparent' };
  if (password.length < 6) return { label: 'Weak', color: 'red' };
  if (password.match(/[A-Z]/) && password.match(/[0-9]/) && password.length >= 8)
    return { label: 'Strong', color: 'green' };
  return { label: 'Medium', color: 'orange' };
};

export default function SignupScreen() {
  const router = useRouter();

  // Form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);

  const [loading, setLoading] = useState(false);

  // Error states
  const [fullNameError, setFullNameError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Animation refs for glow effect
  const fullNameAnim = useRef(new Animated.Value(0)).current;
  const phoneAnim = useRef(new Animated.Value(0)).current;
  const emailAnim = useRef(new Animated.Value(0)).current;
  const passwordAnim = useRef(new Animated.Value(0)).current;
  const confirmPasswordAnim = useRef(new Animated.Value(0)).current;

  // Password strength
  const passwordStrength = getPasswordStrength(password);

  // Input refs for focus control
  const phoneInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  useEffect(() => {
    // Autofocus on full name on mount
    fullNameInputRef.current?.focus();
  }, []);

  // Glow animation helper
  const animateGlow = (animValue, isFocused) => {
    Animated.timing(animValue, {
      toValue: isFocused ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  // Validation logic
  const validateForm = () => {
    let valid = true;

    if (!fullName.trim()) {
      setFullNameError('Full name is required');
      valid = false;
    } else {
      setFullNameError('');
    }

    if (!phoneNumber.trim()) {
      setPhoneNumberError('Phone number is required');
      valid = false;
    } else {
      setPhoneNumberError('');
    }

    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      valid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      valid = false;
    } else {
      setConfirmPasswordError('');
    }

    return valid;
  };

  const handleSignup = () => {
    if (!validateForm()) {
      Vibration.vibrate(50);
      return;
    }

    setLoading(true);

    // Simulate signup request delay
    setTimeout(() => {
      setLoading(false);
      // On success, navigate to home or sign in screen
      router.push('/home');
    }, 1500);
  };

  // Full Name ref for autofocus
  const fullNameInputRef = useRef(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.title}>Sign Up</Text>

            {/* Full Name */}
            <Animated.View
              style={[
                styles.input,
                {
                  borderColor: fullNameAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#ccc', '#3B82F6'],
                  }),
                  shadowColor: '#3B82F6',
                  shadowOpacity: fullNameAnim,
                  shadowRadius: fullNameAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                  }),
                },
              ]}
            >
              <TextInput
                ref={fullNameInputRef}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor="#888"
                style={styles.textInput}
                onFocus={() => {
                  animateGlow(fullNameAnim, true);
                  Vibration.vibrate(10);
                }}
                onBlur={() => animateGlow(fullNameAnim, false)}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => phoneInputRef.current?.focus()}
              />
            </Animated.View>
            {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}

            {/* Phone Number */}
            <Animated.View
              style={[
                styles.input,
                {
                  borderColor: phoneAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#ccc', '#3B82F6'],
                  }),
                  shadowColor: '#3B82F6',
                  shadowOpacity: phoneAnim,
                  shadowRadius: phoneAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                  }),
                },
              ]}
            >
              <TextInput
                ref={phoneInputRef}
                placeholder="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholderTextColor="#888"
                style={styles.textInput}
                onFocus={() => {
                  animateGlow(phoneAnim, true);
                  Vibration.vibrate(10);
                }}
                onBlur={() => animateGlow(phoneAnim, false)}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => emailInputRef.current?.focus()}
              />
            </Animated.View>
            {phoneNumberError ? <Text style={styles.errorText}>{phoneNumberError}</Text> : null}

            {/* Email */}
            <Animated.View
              style={[
                styles.input,
                {
                  borderColor: emailAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#ccc', '#3B82F6'],
                  }),
                  shadowColor: '#3B82F6',
                  shadowOpacity: emailAnim,
                  shadowRadius: emailAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                  }),
                },
              ]}
            >
              <TextInput
                ref={emailInputRef}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#888"
                style={styles.textInput}
                onFocus={() => {
                  animateGlow(emailAnim, true);
                  Vibration.vibrate(10);
                }}
                onBlur={() => animateGlow(emailAnim, false)}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
            </Animated.View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            {/* Password */}
            <Animated.View
              style={[
                styles.passwordContainer,
                {
                  borderColor: passwordAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#ccc', '#3B82F6'],
                  }),
                  shadowColor: '#3B82F6',
                  shadowOpacity: passwordAnim,
                  shadowRadius: passwordAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                  }),
                },
              ]}
            >
              <TextInput
                ref={passwordInputRef}
                placeholder="Password"
                secureTextEntry={hidePassword}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#888"
                style={[styles.textInput, { flex: 1 }]}
                onFocus={() => {
                  animateGlow(passwordAnim, true);
                  Vibration.vibrate(10);
                }}
                onBlur={() => animateGlow(passwordAnim, false)}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
              />
              <TouchableOpacity
                onPress={() => setHidePassword(!hidePassword)}
                style={{ paddingHorizontal: 6 }}
                accessible={true}
                accessibilityLabel={hidePassword ? "Show password" : "Hide password"}
              >
                <Icon
                  name={hidePassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#3B82F6"
                />
              </TouchableOpacity>
            </Animated.View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            {/* Password strength */}
            {password.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <View
                  style={[
                    styles.passwordStrengthBar,
                    { backgroundColor: passwordStrength.color },
                  ]}
                />
                <Text style={[styles.passwordStrengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            {/* Confirm Password */}
            <Animated.View
              style={[
                styles.passwordContainer,
                {
                  borderColor: confirmPasswordAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#ccc', '#3B82F6'],
                  }),
                  shadowColor: '#3B82F6',
                  shadowOpacity: confirmPasswordAnim,
                  shadowRadius: confirmPasswordAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                  }),
                },
              ]}
            >
              <TextInput
                ref={confirmPasswordInputRef}
                placeholder="Confirm Password"
                secureTextEntry={hideConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor="#888"
                style={[styles.textInput, { flex: 1 }]}
                onFocus={() => {
                  animateGlow(confirmPasswordAnim, true);
                  Vibration.vibrate(10);
                }}
                onBlur={() => animateGlow(confirmPasswordAnim, false)}
                returnKeyType="done"
                onSubmitEditing={handleSignup}
              />
              <TouchableOpacity
                onPress={() => setHideConfirmPassword(!hideConfirmPassword)}
                style={{ paddingHorizontal: 6 }}
                accessible={true}
                accessibilityLabel={hideConfirmPassword ? "Show confirm password" : "Hide confirm password"}
                          >
            <Icon
              name={hideConfirmPassword ? 'eye-off' : 'eye'}
              size={22}
              color="#3B82F6"
            />
          </TouchableOpacity>
        </Animated.View>
        {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

        {/* Sign Up Button */}
        <TouchableOpacity
          onPress={handleSignup}
          style={[styles.button, loading && { opacity: 0.7 }]}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Sign up"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* Already have account */}
        <View style={styles.bottomTextContainer}>
          <Text style={styles.bottomText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => router.push('/login')}
            accessibilityRole="link"
            accessibilityLabel="Navigate to Sign In"
          >
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
safeArea: { flex: 1, backgroundColor: '#fff' },
scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
container: {
flex: 1,
justifyContent: 'center',
},
title: {
fontSize: 28,
fontWeight: '700',
marginBottom: 24,
color: '#111827',
alignSelf: 'center',
},
input: {
backgroundColor: '#fff',
borderWidth: 1.5,
borderRadius: 12,
paddingHorizontal: 16,
paddingVertical: 14,
marginBottom: 12,
},
passwordContainer: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: '#fff',
borderWidth: 1.5,
borderRadius: 12,
paddingHorizontal: 16,
paddingVertical: 14,
marginBottom: 12,
},
textInput: {
fontSize: 16,
color: '#111827',
padding: 0,
},
button: {
backgroundColor: '#3B82F6',
paddingVertical: 16,
borderRadius: 12,
marginTop: 18,
justifyContent: 'center',
alignItems: 'center',
elevation: 3,
},
buttonText: {
color: '#fff',
fontWeight: '700',
fontSize: 18,
},
bottomTextContainer: {
flexDirection: 'row',
justifyContent: 'center',
marginTop: 24,
},
bottomText: {
fontSize: 16,
color: '#444',
},
linkText: {
fontSize: 16,
color: '#3B82F6',
fontWeight: '600',
},
errorText: {
color: 'red',
marginBottom: 8,
marginLeft: 6,
fontSize: 13,
},
passwordStrengthContainer: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 12,
paddingHorizontal: 6,
},
passwordStrengthBar: {
height: 6,
flex: 1,
borderRadius: 4,
marginRight: 8,
},
passwordStrengthLabel: {
fontWeight: '600',
fontSize: 14,
width: 70,
textAlign: 'right',
},
});
