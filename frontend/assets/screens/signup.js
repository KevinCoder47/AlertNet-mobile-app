// screens/signup.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, Dimensions, ImageBackground, 
  Alert, Image, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser } from '../../backend/Firebase/authentication';
import VerifyEmailScreen from '../componets/VerifyEmailScreen';
import GeneralLoader from '../componets/Loaders/GeneralLoarder';
import AddInfo from './AddInfo';

const { width, height } = Dimensions.get('window');
const backgroundImage = require('../../assets/images/launch-background.jpg'); 
// Current working updat
// e. I have commented out the backend until we understand what 
// is happening 

const SignupScreen = ({ navigation,setIsLoggedIn }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true); 
  const [showEmailVerify, setShowEmailVerify] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isAddProfileImg,setIsAddProfileImg] = useState(false)

  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  // Save user data to AsyncStorage
  const saveUserData = async () => {
    // Clean phone number (remove non-digit characters)
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    const userData = {
      fullName,
      phoneNumber: `+27${cleanedPhoneNumber}`, // Add country code
      email: `${emailPrefix}@student.uj.ac.za`,
      // Add other relevant user data here
    };

    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      console.log('User data saved successfully');
    } catch (error) {
      console.error('Failed to save user data:', error);
      Alert.alert('Error', 'Failed to save user data');
    }
  };

  // Handle saving data when email is verified
  useEffect(() => {
    if (isEmailVerified) {
      saveUserData();
      setIsAddProfileImg(true);
    }
  }, [isEmailVerified]);

  const LoaderOverlay = () => (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      height: height,
      width: width,
      backgroundColor: 'rgba(255,255,255,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    }}>
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
      }).start(() => confirmRef.current.focus());
    }
  };

  const showPasswordField = () => {
    setIsConfirming(false);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => passwordRef.current.focus());
  };

  // SEND CONFRIMATION EMAIL
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

    // First get response as text
    const responseText = await response.text();
    
    try {
      // Try to parse as JSON
      const responseData = JSON.parse(responseText);
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to send verification email");
      }
      setEmailSent(true);
      return responseData;
    } catch (parseError) {
      // If parsing fails, handle as text
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
      // Generate a random 6-digit code
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setConfirmationCode(code);
      
      // Send verification email and wait for it to complete
      await sendVerificationEmail(email, code);
      
      // Show verification screen after email is sent
      setShowEmailVerify(true);
    } catch (error) {
      console.error('Signup error:', error);
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background}>

    <Text style={styles.title}>Sign Up</Text>
      <View style={styles.overlay}>

        {/* Full Name */}
        <View style={styles.inputContainer}>
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
          />
          </View>
        </View>

        {/* Phone Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Text style={{ color: '#717171',marginRight: 10 }}>+27</Text>
            <View style={styles.divider} />
            <TextInput
              placeholder="78 401 1806"
              placeholderTextColor="#717171"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={[styles.input, !phoneNumber && styles.placeholderText]}
            />
          </View>
        </View>

        {/* Student Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Student E-mail</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name='mail-outline'
              size={16}
              style={{
              width: 16,
              height: 16,
              opacity: 0.5,
              marginRight: 10
              }}
            />
            <TextInput
              placeholder="e.g. 123456"
              placeholderTextColor="#717171"
              value={emailPrefix}
              onChangeText={setEmailPrefix}
              style={[styles.input, !emailPrefix && styles.placeholderText]}
            />
            <Text style={styles.domain}>@student.uj.ac.za</Text>
          </View>
        </View>

        {/* Password Fields */}
        <View style={styles.inputContainer}>
          <View style={[{
            flexDirection: 'row'
          }]}>
            <Text
              style={{
                marginLeft: 15,
                color: 'black',
                fontSize: 14,
                fontWeight: 500,
                display: isConfirming ? 'flex' : 'none'
            }}
            >Confirm </Text>
            <Text style={{
    color: 'black',
    marginBottom: 15,
    fontSize: 14,
              fontWeight: 500,
    marginLeft: isConfirming ? 0 : 15,
          }}>Password</Text>
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
                returnKeyType="done"
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
        <TouchableOpacity onPress={handleSignup}>
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
      </View>


      {/* verify email view */}
      
  {loading ? (
    <GeneralLoader />
      ) : showEmailVerify ? (
          <View style = {{position: 'absolute', bottom: 0}}>
           <VerifyEmailScreen
      navigation={navigation}
              setShowEmailVerify={setShowEmailVerify}
              setIsEmailVerified={setIsEmailVerified}
              isEmailVerified={isEmailVerified}
              setIsVerifying={setIsVerifying}
              setIsLoggedIn={setIsLoggedIn}
              confirmationCode={confirmationCode}
            />
            
  </View>
      ) : null}

      {/* add profile picture */}
      {
        isAddProfileImg && (
          <View style = {{position: 'absolute', zIndex: 2}}>
            <AddInfo setIsLoggedIn={setIsLoggedIn} />
          </View>
        )
      }
  
      {isVerifying && <LoaderOverlay />}
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
    padding: 40,
    justifyContent: 'center',
    backgroundColor: '#FEF7EE',
    marginTop: 'auto',
    height: 655,
    borderRadius: 50
  },
  title: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
    marginTop: 100,
    textAlign: 'center',
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
    width: width * 0.8,
    height: 55
  },
  input: {
    flex: 1,
    color: 'black',
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 11,
  },
  domain: {
    color: '#717171',
    fontSize: 11,
  },
  signupBtn: {
    flexDirection: 'row',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
    height: 52,
    width: 170,
    alignSelf: 'center'
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
    fontSize: 10
  },
  loginLinkBold: {
    color: '#B36B6B',
    fontWeight: 'bold',
    fontSize: 10
  },
  icon: {
    width: 16,
    height: 16,
    opacity: 0.5,
    marginRight: 10
  },
  divider: {
    height: 20,
    width: 1,
    backgroundColor: '#717171',
    marginRight: 10
  },
  confirmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editIcon: {
    marginLeft: 10,
    padding: 5
  },
  fieldContainer: {
    overflow: 'hidden',
    width: 312,
  }
});