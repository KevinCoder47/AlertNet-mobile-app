import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import Home from '../screens/Home';

const AppNavigator = () => {
  const [isSplash, setisSplash] = useState(false)


  return (
    <View>

     <Home />
    </View>
  )
}

export default AppNavigator

const styles = StyleSheet.create({})