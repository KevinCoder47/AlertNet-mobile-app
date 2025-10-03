import { StyleSheet, Text, View, Dimensions } from 'react-native'
import React from 'react'
import { useTheme } from '../contexts/ColorContext'
import { Video } from 'expo-av'

const { width, height } = Dimensions.get('window');

const AnimatedSplash = () => {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, width: width, height: height, justifyContent: 'center', alignItems: 'center' }}>
      <Video
        source={isDark ? require('../animated-splash/alertnet_splash_v1.mp4') : require('../animated-splash/alertnet_splash_v1_light.mp4')} 
              style={[StyleSheet.absoluteFill, {
                width: width,
                height: height * 0.6,
                alignSelf: 'center',
                marginTop: height * 0.15, 
        }]}
        // resizeMode = "cover"
        isLooping
        shouldPlay
        isMuted
          />
          
    </View>
  )
}

export default AnimatedSplash

const styles = StyleSheet.create({
  video: {
    width: width * 0.95,
    height: height * 0.6,
    alignSelf: 'center',
    marginTop: height * 0.2, 
  },
})