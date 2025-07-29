import { StyleSheet, Text, View, Dimensions, Image } from 'react-native'
import { useTheme } from '../contexts/ColorContext'
import { Ionicons } from '@expo/vector-icons';
import React from 'react'




const { width, height } = Dimensions.get('window')
const WalkStartPoint = () => {

    const { colors, isDark } = useTheme();


  return (
    <View style = {[styles.container, {backgroundColor: colors.background}]}>
          {/* back chevron and text */}
          <View style = {{flexDirection: 'row', padding: 20}}>
              {/* chevron */}
            <Ionicons 
              name="chevron-back-outline" 
              size={20}
              color={isDark ? "#D6D6D6" : "#606061ff"} 
              />
          </View>

          {/* meet up point 3d, name , and time */}
          <View>
              {/* 3d view */}
              <View>
                  <Image source={require('../images/3d-placeholder.jpg')}/>
              </View>
          </View>
    </View>
  )
}

export default WalkStartPoint

const styles = StyleSheet.create({
    container: {
        width: width * 0.95,
        height: height * 0.3,
        borderRadius: 47
    }
})