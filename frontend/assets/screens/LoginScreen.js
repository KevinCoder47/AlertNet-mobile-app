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
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// Helper function for password strength
const getPasswordStrength = (password) => {
  if (password.length === 0) return { label: '', color: 'transparent' };
  if (password.length < 6) return { label: 'Weak', color: 'red' };
  if (password.match(/[A-Z]/) && password.match(/[0-9]/) && password.length >= 8)
    return { label: 'Strong', color: 'green' };
  return { label: 'Medium', color: 'orange' };
};

export default function LoginScreen() {
  const router = useRouter();

  // Form state
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Error messages
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Animation refs for glow effect
  const emailAnim = useRef(new Animated.Value(0)).current;
  const passwordAnim = useRef(new Animated.Value(0)).current;

  // Password strength
  const passwordStrength = getPasswordStrength(password);

  // Auto-focus email input on mount
  const emailInputRef = useRef(null);
  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // Could do extra management here if needed
    });

    emailInputRef.current?.focus();

    return () => keyboardShowListener.remove();
  }, []);

  // Glow animation trigger
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
    if (!emailOrPhone.trim()) {
      setEmailError('Email or phone is required');
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
    return valid;
  };

  const handleLogin = () => {
    if (!validateForm()) {
      Vibration.vibrate(50);
      return;
    }

    setLoading(true);

    // Simulate async login delay
    setTimeout(() => {
      setLoading(false);
      router.push('/home');
    }, 1500);
  };

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
            <Text style={styles.title}>Sign In</Text>

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
                placeholder="Email or Phone"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
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
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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

            {/* Password strength meter */}
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

            <View style={styles.rememberMeContainer}>
              <TouchableOpacity
                style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
                onPress={() => setRememberMe(!rememberMe)}
                accessible={true}
                accessibilityLabel="Remember me checkbox"
              >
                {rememberMe && <Icon name="check" size={16} color="#fff" />}
              </TouchableOpacity>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </View>

            <TouchableOpacity
              style={[styles.signInButton, loading && styles.signInButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.socialIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <FontAwesome name="google" size={24} color="#DB4437" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <FontAwesome name="facebook" size={24} color="#1877F2" />
              </TouchableOpacity>
            </View>

            <Text style={styles.signupText}>
              Don’t have an Account?{' '}
              <Text
                style={styles.signUpLink}
                onPress={() => router.push('/signup')}
              >
                Sign Up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Create a ref for password input here (to focus from email)
const passwordInputRef = React.createRef();

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 4,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  textInput: {
    fontSize: 16,
    color: '#111827',
  },
  forgotBtn: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  signInButtonDisabled: {
    backgroundColor: '#9BB7FF',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconButton: {
    marginHorizontal: 16,
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 50,
},
signupText: {
textAlign: 'center',
color: '#444',
fontSize: 14,
},
signUpLink: {
color: '#3B82F6',
fontWeight: '600',
},
errorText: {
color: 'red',
marginBottom: 12,
marginLeft: 8,
},
rememberMeContainer: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 24,
},
checkbox: {
height: 22,
width: 22,
borderRadius: 4,
borderWidth: 1.5,
borderColor: '#3B82F6',
marginRight: 8,
justifyContent: 'center',
alignItems: 'center',
},
checkboxChecked: {
backgroundColor: '#3B82F6',
},
rememberMeText: {
fontSize: 16,
color: '#111827',
},
passwordStrengthContainer: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 12,
paddingHorizontal: 8,
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
