import { StyleSheet, View } from 'react-native'
import React, { useState,useEffect } from 'react'
import { useTheme } from '../contexts/ColorContext'
import LaunchScreen from '../componets/onboarding components/LaunchScreen'
import AnimatedSplash from './AnimatedSplash'
import FeatureDisplayScreen from '../componets/onboarding components/FeatureDisplayScreen'

const OnBoarding = ({onComplete}) => {
  const { colors, isDark } = useTheme()
  const [isLaunchDone, setIsLaunchDone] = useState(false)
  const [showSplash, setShowSplash] = useState(true);
  const [showFeatureScreen, setShowFeatureScreen] = useState(false);

  useEffect(() => {
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 5300); 

    return () => clearTimeout(splashTimeout);
  }, []);

  return (
    <View style={{ backgroundColor: 'black', flex: 1 }}>
      {showSplash ? (
        <AnimatedSplash setIsLaunchDone={setIsLaunchDone} />
      ) : !showFeatureScreen ? (
        <LaunchScreen setShowFeatureScreen={setShowFeatureScreen} />
      ) : (
            <FeatureDisplayScreen onComplete={onComplete} />
      )}
    </View>
  )
}

export default OnBoarding

const styles = StyleSheet.create({})