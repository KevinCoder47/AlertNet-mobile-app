import { StyleSheet, Text, View, Dimensions, TextInput, TouchableOpacity, Alert } from 'react-native'
import React, { useRef, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser } from '../../backend/Firebase/authentication';
import GeneralLoader from '../componets/Loaders/GeneralLoarder'

const {width, height} = Dimensions.get('window')

const VerifyEmailScreen = ({
  navigation, setShowEmailVerify,
  setIsEmailVerified, isEmailVerified,
  setIsVerifying, setIsLoggedIn,
  confirmationCode, setIsAddProfileImg,
  password, setUserUid, email
}) => {
  const inputRefs = useRef([]);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);

  const handlePress = async () => {
    if (!isEmailVerified) {
      const enteredCode = verificationCode.join('');
      const correctCode = confirmationCode;

      setIsVerifying(true);
      setTimeout(() => {
        if (enteredCode === correctCode) {
          setIsEmailVerified(true);
        } else {
          alert("Incorrect verification code");
        }
        setIsVerifying(false);
      }, 1500);
    } else {
      try {
        // Register user with Firebase
        const user = await registerUser(email, password);
        
        // Store the generated UID
        setUserUid(user.uid);

        const userDataJSON = await AsyncStorage.getItem('userData');
        const userData = userDataJSON ? JSON.parse(userDataJSON) : {};

        // Add userId to userData
        userData.userId = user.uid;
        
        // Update AsyncStorage with user ID
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        setIsAddProfileImg(true);
      } catch (error) {
        console.error('Registration failed:', error);
        Alert.alert('Registration Error', error.message);
      }
    }
  };



  return (
      <View style={styles.overlay}>
          
      {/* verify email */}
      {!isEmailVerified ?
        (<View>
{/* back button and indicators */}
          <View style = {{flexDirection: 'row', alignItems: 'center', marginBottom: 20}}>
        <Ionicons
            name='arrow-back-outline'
                  size={20}
                  onPress={() => {
                      setShowEmailVerify(false)
                      navigation.navigate('signup')}}
              />
              
              {/* indicators */}
              <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  marginRight: 30,
                  gap: 8
              }}>
                  <View style={[styles.indicator, { backgroundColor: '#C84022' }]} />
                  <View style={[styles.indicator, { backgroundColor: '#C84022' }]} />
                   <View style = {[styles.indicator, {backgroundColor: isEmailVerified ? '#C84022':'#C8C8C8'}]} />
              </View>
          </View>


          <Text style={[styles.titles, {marginTop: 20,}]}>
              Verify your email
          </Text>


          <Text style={styles.text}>
              We just sent a 4 digit code to {' '}
              <Text style={{
                  color: '#FF8571',
                  fontWeight: '500'
              }}>
                  222087503@student.uj.ac.za
              </Text>,{'\n'}
              enter it below
          </Text>


          {/* 4 boxes for code */}
          <View style={styles.codeContainer}>
            {[...Array(4)].map((_, index) => (
              <View key={index} style={styles.codeBox}>
                <TextInput
                  ref={(ref) => inputRefs.current[index] = ref}
                  style={styles.codeInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  secureTextEntry={false}
                  onChangeText={(text) => {
                    const newCode = [...verificationCode];
                    newCode[index] = text;
                    setVerificationCode(newCode);
                    if (text && index < 3) {
                      inputRefs.current[index + 1]?.focus();
                    }
                  }}
                />
              </View>
            ))}
          </View>


          {/* wrong email? */}
          <View style = {{flexDirection: 'row',textAlign: 'center', marginTop: 30,justifyContent: 'center'}}>
              <Text style={[styles.text2]}>
              wrong email? {' '}
          </Text>
            <TouchableOpacity style = {{}}>
                  <Text style={[{ color: '#FF8571', fontWeight: '500' },
                      styles.text2
                  ]}>send to different email</Text>
              </TouchableOpacity>
</View>
        </View>)
        :
        // email verified
        (<View style = {{alignItems: 'center'}}>
          {/* verified sign */}
          <View style={{ alignSelf: 'center', marginTop: 100}}>

            <View style = {{flexDirection: 'row'}}>
            <View style={styles.smallCircle} />
            <View style={styles.smallCircle} />
            </View>

            <View style = {{flexDirection: 'row'}}>
            <View style={styles.smallCircle} />
            <View style={styles.smallCircle} />
            </View>

            {/* center */}
              <View
                style={{
                  position: 'absolute',
                  alignSelf: 'center',
                  top: 15,
                }}
              >
                <View
                  style={[
                    styles.smallCircle,
                    {
                      position: 'relative',
                      zIndex: 1,
                    },
                  ]}
                />
                <Ionicons
                  name="checkmark-outline"
                  size={30}
                  color="black"
                  style={{
                    position: 'absolute',
                    zIndex: 2,
                  }}
                />
              </View>

          </View>

          <View style = {{alignItems: 'center', marginTop: 60}}>
           <Text style = {styles.titles}>Your account</Text>
          <Text style = {styles.titles}>was successfully created</Text>
          </View>

          <Text style = {styles.text}>Explore Alertnet</Text>

          
        </View>)}

          {/* verify email button */}
      <TouchableOpacity
        style={styles.verifyButton}
        onPress={handlePress}
      >
              <Text style={{
                  fontSize: 15,
                  fontWeight: "500",
                  color: 'white'
              }}
              >
                 {isEmailVerified ? 'Continue':  'Verify mail'}
              </Text>
          </TouchableOpacity>


          {/* terms and policy */}
        <View style={{ opacity: 1,alignItems: 'center', marginTop: 'auto' }}>
          <Text style={[styles.smallText, { fontFamily: 'Poppins Medium', }]}>
            By using Alertnet, you agree to our 
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <TouchableOpacity>
              <Text style={[styles.orangeText, { fontFamily: 'Poppins Medium' }]}>
                Terms
              </Text>
            </TouchableOpacity>
            <Text style={[styles.smallText, { fontFamily: 'Poppins Medium' }]}> and </Text>
            <TouchableOpacity>
              <Text style={[styles.orangeText, { fontFamily: 'Poppins Medium' }]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
        </View>
    </View>
  )
}

export default VerifyEmailScreen

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        width: width,
        height: height * 0.88,
        backgroundColor: '#FEF7EE', 
        borderRadius: 50,
        padding: 30
    },
    indicator: {
        width: 11,
        height: 3,
        borderRadius: 5,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
        marginTop: 60
    },
    codeBox: {
        width: 55,
        height: 55,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#C84022',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent'
    },
    codeInput: {
        fontSize: 24,
        fontWeight: 'bold',
        width: '100%',
        textAlign: 'center'
    },
    text: {
            fontSize: 11,
              fontWeight: '400', 
            lineHeight: 18,
              textAlign: 'center', 
              marginTop: 30,
    },
    text2: {
            fontSize: 11,
              fontWeight: '400', 
            lineHeight: 18,
    },
    verifyButton: {
        width: width * 0.7,
        height: 52,
        backgroundColor: '#C84022',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        alignSelf: 'center',
        borderRadius: 50
    },
  orangeText: {
    fontSize: 11,
    color: '#FF8571'
  },
  smallText: {
    fontSize: 11,
    color: '#2F2F2F'
  },
  smallCircle: {
    width: 30,
    height: 30,
    backgroundColor: '#F19985',
    borderRadius: 15
  },
  titles: {
              fontSize: 20,
              textAlign: 'center',
              fontWeight: '600' 
  }
})