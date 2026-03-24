import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing
} from 'react-native';

const {width, height} = Dimensions.get('window');

const LaunchScreen = ({setShowFeatureScreen}) => {
  // Animation values
  const bgFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(10)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.9)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const termsOpacity = useRef(new Animated.Value(0)).current;
  
  // Enhanced background movement animation
  const bgMoveX = useRef(new Animated.Value(0)).current;
  const bgMoveY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start background movement loops (separate X and Y for more control)
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgMoveX, {
          toValue: 1,
          duration: 20000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bgMoveX, {
          toValue: 0,
          duration: 20000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgMoveY, {
          toValue: 1,
          duration: 15000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bgMoveY, {
          toValue: 0,
          duration: 15000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    Animated.sequence([
      // Background fade in
      Animated.timing(bgFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      
      // Logo animation
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        })
      ]),
      
      // Text animation
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(textSlide, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]),
      
      // Button animation
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          friction: 5,
          tension: 30,
          useNativeDriver: true,
        })
      ]),
      
      // Terms animation
      Animated.timing(termsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Enhanced background image with more noticeable movement */}
      <Animated.Image 
        source={require('../../images/launch-background.jpg')} 
        style={[
          styles.backgroundImage, 
          { 
            opacity: bgFade.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.85]
            }),
            transform: [
              {
                translateX: bgMoveX.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-22, 22] 
                })
              },
              {
                translateY: bgMoveY.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 20] 
                })
              },
              {
                scale: bgFade.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.02, 1] 
                })
              }
            ]
          }
        ]} 
      />
      
      {/* Rest of your components remain exactly the same */}
      {/* Logo */}
      <Animated.Image 
        source={require('../../images/logo-v2.png')} 
        style={[
          styles.logo, 
          { 
            opacity: logoOpacity,
            transform: [{ scale: logoScale }] 
          }
        ]} 
      />
    
      {/* App name and slogan */}
      <Animated.View 
        style={[
          styles.textContainer, 
          { 
            opacity: textOpacity,
            transform: [{ translateY: textSlide }] 
          }
        ]}
      >
        <Text style={[styles.appName, { fontFamily: 'Poppins Medium' }]}>
          Alertnet
        </Text>

        <View style={styles.sloganContainer}>
          <Text style={[styles.slogan, { fontFamily: 'Poppins Medium' }]}>
            now you can be 
          </Text>
          <Text style={[styles.slogan, { fontFamily: 'Poppins Medium', color: '#FF6600' }]}>
            safe.
          </Text>
        </View>
      </Animated.View>
      
      {/* Continue button and terms */}
      <View style={styles.bottomContainer}>
        {/* Button */}
        <Animated.View 
          style={[
            { 
              opacity: buttonOpacity,
              transform: [{ scale: buttonScale }] 
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => {setShowFeatureScreen(true) }}
            style={styles.continueButton}>
            <Text style={{ color: 'white', fontFamily: 'Poppins Medium' }}>
              Continue
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Terms and conditions */}
        <Animated.View style={{ opacity: termsOpacity }}>
          <Text style={[styles.smallText, { fontFamily: 'Poppins Medium' }]}>
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
        </Animated.View>
      </View>
    </View>
  );
}

export default LaunchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  backgroundImage: {
    width: width * 1.1, 
    height: height * 1.1,
    position: 'absolute',
    left: -width * 0.05, 
    top: -height * 0.05,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginTop: height * 0.04,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 190,
  },
  sloganContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  appName: {
    fontSize: 35,
    color: 'white',
    textAlign: 'center',
  }, 
  slogan: {
    fontSize: 13,
    color: 'white',
  },
  continueButton: {
    width: 205,
    height: 60,
    backgroundColor: '#C84022',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50
  }, 
  bottomContainer: {
    marginTop: 'auto',
    alignItems: 'center',
    marginBottom: 40,
    gap: 20
  },
  orangeText: {
    fontSize: 11,
    color: '#FF8571'
  },
  smallText: {
    fontSize: 11,
    color: '#2F2F2F'
  }
});