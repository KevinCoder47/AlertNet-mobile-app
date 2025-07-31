import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useTheme } from '../contexts/ColorContext'
import LaunchScreen from '../componets/onboarding components/LaunchScreen'

const OnBoarding = () => {

  const { colors, isDark } = useTheme()


  return (
    <View style = {{backgroundColor: 'black',flex: 1}}>
      <LaunchScreen />
    </View>
  )
}

export default OnBoarding

const styles = StyleSheet.create({})