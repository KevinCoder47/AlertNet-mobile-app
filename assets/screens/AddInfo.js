import { StyleSheet, Text, View, Dimensions, Image, Animated, TouchableOpacity } from 'react-native'
import React, { useRef, useState,useEffect } from 'react'
import AddProfileImage from '../componets/onboardingComponents/AddProfileImage'
import { Ionicons } from '@expo/vector-icons'
import SelectGender from '../componets/onboardingComponents/SelectGender'
import AddFriends from '../componets/onboardingComponents/AddFriends'

const { width, height } = Dimensions.get('window')

const AddInfo = ({setIsLoggedIn}) => {
  const [step, setStep] = useState(1) // 1 to 4
  const progress = useRef(new Animated.Value(0)).current
  const [isImageSaved, setIsImageSaved] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState(null);

  useEffect(() => {
  console.log("AddInfo profileImageUri:", profileImageUri);
}, [profileImageUri]);

  const handleNext = () => {
    if (step < 4) {
      const newStep = step + 1
      setStep(newStep)
      animateProgress(newStep)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      const newStep = step - 1
      setStep(newStep)
      animateProgress(newStep)
    }
  }

  const animateProgress = (stepNumber) => {
    const percentage = stepNumber / 4 // 4 steps
    Animated.timing(progress, {
      toValue: percentage,
      duration: 300,
      useNativeDriver: false
    }).start()
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../images/logo-v2.png')}
        style={{ width: 60, height: 60, alignSelf: 'center',zIndex: 2 }}
      />

      {/* progress bar */}
      <View style={styles.outerBar}>
        <Animated.View 
          style={[
            styles.innerBar,
            { width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              })
            }
          ]}
        />
      </View>
          
      {/* Step content */}
      {step === 1 && (
        <AddProfileImage
          setIsImageSaved={setIsImageSaved}
          isImageSaved={isImageSaved}
          profileImageUri={profileImageUri}
          setProfileImageUri={setProfileImageUri}
        />
      )}
      {step === 2 && (
        <SelectGender />
      )}
      {step === 3 && (
        <AddFriends
          setIsLoggedIn={setIsLoggedIn}
          profileImageUri={profileImageUri}
          setProfileImageUri={setProfileImageUri}
          
        />
      )}

      {/* Back button */}
      {step > 1 && step < 3 && (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
        >
          <Ionicons
            name='arrow-back-outline'
            size={20}
            color='#666666'
          />
        </TouchableOpacity>
      )}

      {/* Next button */}
      {step < 3 && (
        <TouchableOpacity
          style={[
            styles.nextBtn,
            {
              backgroundColor:
                (step === 1 && isImageSaved)
                  ? '#C84022'
                  : step > 1
                    ? '#C84022'
                    : '#FFEDD5',
            }
          ]}
          onPress={handleNext}
          disabled={step === 1 && !isImageSaved}
        >
          <Ionicons
            name='arrow-forward-outline'
            size={15}
            color={
              (step === 1 && isImageSaved) || step > 1
                ? 'white'
                : '#666666'
            }
          />
        </TouchableOpacity>
      )}
    </View>
  )
}

export default AddInfo

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#FEF7EE',
    paddingTop: 40,
    alignItems: 'center'
  },
  outerBar: {
    width: width * 0.9,
    height: 3,
    backgroundColor: '#E8E8E8',
      borderRadius: 50,
    zIndex: 2 
  },
  innerBar: {
    height: '100%',
    backgroundColor: '#F57527',
    borderRadius: 50
  },
  nextBtn: {
    width: 60,
    height: 60,
    position: 'absolute',
    left: width * 0.8,
    marginTop: 'auto',
    bottom: height * 0.05,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backBtn: {
    width: 60,
    height: 60,
    position: 'absolute',
    left: width * 0.05,
    marginTop: 'auto',
    bottom: height * 0.05,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEDD5',
  }
})