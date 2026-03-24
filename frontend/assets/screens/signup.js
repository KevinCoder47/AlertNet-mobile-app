import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, Dimensions, ImageBackground, 
  Alert, Image, Animated, KeyboardAvoidingView, ScrollView, Platform, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser } from '../../backend/Firebase/authentication';
import VerifyEmailScreen from '../componets/VerifyEmailScreen';
import GeneralLoader from '../componets/Loaders/GeneralLoarder';
import AddInfo from './AddInfo';

const { width, height } = Dimensions.get('window');
const backgroundImage = require('../images/launch-background.jpg'); 

const SignupScreen = ({ navigation, setIsLoggedIn }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false); 
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isAddProfileImg, setIsAddProfileImg] = useState(false);
  const [userUid, setUserUid] = useState();
  const [email, setEmail] = useState();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  
  // Keyboard handling refs
  const scrollViewRef = useRef(null);
  const fullNameInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  const scrollToInput = (inputRef, extraOffset = 0) => {
    setTimeout(() => {
      inputRef.current?.measureLayout(
        scrollViewRef.current,
        (x, y) => {
          // Calculate scroll position with custom offset
          const baseOffset = 150;
          const totalOffset = baseOffset + extraOffset;
          
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, y - totalOffset),
            animated: true,
          });
        },
        () => {} // Error callback
      );
    }, 150);
  };

  // Save user data to AsyncStorage
  const saveUserData = async () => {
    let cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    if (cleanedPhoneNumber.startsWith("0")) {
      cleanedPhoneNumber = cleanedPhoneNumber.substring(1);
    }
    
    const nameParts = fullName.trim().split(" ");
    const userData = {
      name: nameParts[0] || "",
      surname: nameParts.slice(1).join(" ") || "", 
      fullName, 
      phoneNumber: `+27${cleanedPhoneNumber}`,
      email: `${emailPrefix}@student.uj.ac.za`,
      userId: userUid
    };

    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      // console.log($&);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  useEffect(() => {
    if (isEmailVerified) {
      saveUserData();
    }
  }, [isEmailVerified]);

  const LoaderOverlay = () => (
    <View style={styles.loaderOverlay}>
      <GeneralLoader />
    </View>
  );

  const showConfirmField = () => {
    if (password && !isConfirming) {
      setIsConfirming(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => confirmRef.current?.focus());
    }
  };

  const showPasswordField = () => {
    setIsConfirming(false);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => passwordRef.current?.focus());
  };

  // SEND CONFIRMATION EMAIL
  async function sendVerificationEmail(email, code) {
    try {
      setLoading(true);
      const response = await fetch(
        "https://sendconfirmationemail-yu7oaqqnda-uc.a.run.app",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code }),
        }
      );

      const responseText = await response.text();
      
      try {
        const responseData = JSON.parse(responseText);
        if (!response.ok) {
          throw new Error(responseData.error || "Failed to send verification email");
        }
        setEmailSent(true);
        return responseData;
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(responseText || "Failed to send verification email");
        }
        return { message: responseText };
      }
    } catch (error) {
      console.error("Email sending error:", error);
      Alert.alert('Error', error.message || 'Failed to send verification email');
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const handleSignup = async () => {
    if (!fullName || !phoneNumber || !emailPrefix || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      showPasswordField();
      return;
    }

    try {
      const email = `${emailPrefix}@student.uj.ac.za`;
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setConfirmationCode(code);
      
      await sendVerificationEmail(email, code);
      setShowEmailVerify(true);
    } catch (error) {
      console.error('Signup error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Fixed Background Image */}
      <ImageBackground 
        source={backgroundImage} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Title - Fixed position */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Sign Up</Text>
        </View>
      </ImageBackground>

      {/* Scrollable Form Content */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.inputContainer} ref={fullNameInputRef}>
              <Text style={styles.label}>Student Full Name</Text>
              <View style={styles.inputWrapper}>
                <Image
                  source={require('../images/name.png')}
                  style={styles.icon}
                />
                <TextInput
                  placeholder="Name and Surname"
                  placeholderTextColor="#717171"
                  value={fullName}
                  onChangeText={setFullName}
                  style={[styles.input, !fullName && styles.placeholderText]}
                  onFocus={() => scrollToInput(fullNameInputRef)}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneInputRef.current?.focus()}
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputContainer} ref={phoneInputRef}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.countryCode}>+27</Text>
                <View style={styles.divider} />
                <TextInput
                  ref={phoneInputRef}
                  placeholder="78 401 1806"
                  placeholderTextColor="#717171"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  style={[styles.input, !phoneNumber && styles.placeholderText]}
                  onFocus={() => scrollToInput(phoneInputRef, 50)} // Extra 50px offset
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                />
              </View>
            </View>

            {/* Student Email */}
            <View style={styles.inputContainer} ref={emailInputRef}>
              <Text style={styles.label}>Student E-mail</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name='mail-outline'
                  size={16}
                  style={styles.emailIcon}
                />
                <TextInput
                  ref={emailInputRef}
                  placeholder="e.g. 123456"
                  placeholderTextColor="#717171"
                  value={emailPrefix}
                  onChangeText={setEmailPrefix}
                  style={[styles.input, !emailPrefix && styles.placeholderText]}
                  onFocus={() => scrollToInput(emailInputRef)}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                <Text style={styles.domain}>@student.uj.ac.za</Text>
              </View>
            </View>

            {/* Password Fields */}
            <View style={styles.inputContainer} ref={passwordInputRef}>
              <View style={styles.passwordLabelContainer}>
                <Text style={[styles.confirmLabel, { 
                  display: isConfirming ? 'flex' : 'none' 
                }]}>
                  Confirm 
                </Text>
                <Text style={[styles.label, styles.passwordLabel, {
                  marginLeft: isConfirming ? 0 : 15,
                }]}>
                  Password
                </Text>
              </View>
              
              {/* Password Field */}
              <Animated.View 
                style={[styles.fieldContainer, { 
                  opacity: isConfirming ? 0 : 1,
                  height: isConfirming ? 0 : 55,
                  marginBottom: isConfirming ? 0 : 10
                }]}
              >
                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={passwordRef}
                    placeholder="Enter password"
                    placeholderTextColor="#717171"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={[styles.input, !password && styles.placeholderText]}
                    onBlur={showConfirmField}
                    onFocus={() => scrollToInput(passwordInputRef)}
                    returnKeyType="next"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#717171"
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Confirm Password Field */}
              <Animated.View 
                style={[styles.fieldContainer, { 
                  opacity: fadeAnim,
                  height: isConfirming ? 55 : 0,
                  marginBottom: isConfirming ? 10 : 0
                }]}
                ref={confirmPasswordInputRef}
              >
                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={confirmRef}
                    placeholder="Confirm password"
                    placeholderTextColor="#717171"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    style={[styles.input, !confirmPassword && styles.placeholderText]}
                    onFocus={() => scrollToInput(confirmPasswordInputRef)}
                    returnKeyType="done"
                    onSubmitEditing={handleSignup}
                  />
                  <View style={styles.confirmActions}>
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                      <Ionicons
                        name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#717171"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={showPasswordField} style={styles.editIcon}>
                      <Ionicons
                        name="pencil-outline"
                        size={20}
                        color="#717171"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity onPress={handleSignup} style={styles.signupBtnContainer}>
              <LinearGradient
                colors={['#C84022', '#9e2d2d']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signupBtn}
              >
                <Text style={styles.signupText}>Next</Text>
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

            {/* Extra space for keyboard */}
            <View style={styles.extraSpace} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Overlays - Fixed position */}
      {loading && <LoaderOverlay />}
      
      {showEmailVerify && (
        <View style={styles.overlayContainer}>
          <VerifyEmailScreen
            navigation={navigation}
            setShowEmailVerify={setShowEmailVerify}
            setIsEmailVerified={setIsEmailVerified}
            isEmailVerified={isEmailVerified}
            setIsVerifying={setIsVerifying}
            setIsLoggedIn={setIsLoggedIn}
            confirmationCode={confirmationCode}
            setIsAddProfileImg={setIsAddProfileImg}
            password={password}
            email={`${emailPrefix}@student.uj.ac.za`}
            setUserUid={setUserUid}
          />
        </View>
      )}

      {isAddProfileImg && (
        <View style={styles.overlayContainer}>
          <AddInfo setIsLoggedIn={setIsLoggedIn} />
        </View>
      )}

      {isVerifying && <LoaderOverlay />}
    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fallback color
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 0,
  },
  titleContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  keyboardAvoidingView: {
    flex: 1,
    marginTop: height * 0.25, // Start below the title
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    backgroundColor: '#FEF7EE',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 100, // Increased bottom padding
    minHeight: height * 0.85, // Increased minimum height
    flex: 1, // Ensure it takes full available space
  },
  label: {
    color: 'black',
    marginBottom: 15,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 15,
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
    width: width * 0.8,
    height: 55,
  },
  input: {
    flex: 1,
    color: 'black',
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 11,
  },
  countryCode: {
    color: '#717171',
    marginRight: 10,
  },
  domain: {
    color: '#717171',
    fontSize: 11,
  },
  emailIcon: {
    width: 16,
    height: 16,
    opacity: 0.5,
    marginRight: 10,
  },
  icon: {
    width: 16,
    height: 16,
    opacity: 0.5,
    marginRight: 10,
  },
  divider: {
    height: 20,
    width: 1,
    backgroundColor: '#717171',
    marginRight: 10,
  },
  passwordLabelContainer: {
    flexDirection: 'row',
  },
  confirmLabel: {
    marginLeft: 15,
    color: 'black',
    fontSize: 14,
    fontWeight: '500',
  },
  passwordLabel: {
    marginBottom: 15,
  },
  fieldContainer: {
    overflow: 'hidden',
    width: width * 0.8,
  },
  confirmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editIcon: {
    marginLeft: 10,
    padding: 5,
  },
  signupBtnContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  signupBtn: {
    flexDirection: 'row',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    height: 52,
    width: 170,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signupText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 30,
    textAlign: 'center',
    color: '#525252',
    fontSize: 10,
  },
  loginLinkBold: {
    color: '#B36B6B',
    fontWeight: 'bold',
    fontSize: 10,
  },
  extraSpace: {
    height: 150, // Extra space for keyboard scenarios and scroll coverage
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: height,
    width: width,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
});