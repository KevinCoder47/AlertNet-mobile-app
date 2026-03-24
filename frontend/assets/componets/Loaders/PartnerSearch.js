import { StyleSheet, Text, View, Dimensions, ImageBackground, TouchableOpacity } from 'react-native'
import React from 'react'
import { useTheme } from '../../contexts/ColorContext'
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window')

const PartnerSearch = () => {
    const { colors, isDark } = useTheme();


  return (
    <View style={[styles.container, {
      backgroundColor: colors.background,
      borderWidth: isDark ? 0 : 0.4,
      borderColor: isDark ? '#D6D6D6' : '#E0E0E0',
      shadowColor: '#000',
      shadowOffset: { width: 1, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 5
      }]}>
          
          {/* back button and search text   */}
          <View style = {{flexDirection: 'row', alignItems: 'center'}}>
              
              {/* back button */}
      <TouchableOpacity style={{
        flexDirection: 'row', margin: 20,
        width: 30, height: 30,
        backgroundColor: isDark ? '#212121' :'#eeeeeeff',
        alignItems: 'center', justifyContent: 'center', borderRadius: 30
      }}>
              {/* chevron */}
            <Ionicons 
              name="chevron-back-outline" 
              size={20}
              color={isDark ? "#D6D6D6" : "#606061ff"} 
              />
              </TouchableOpacity>
              
              {/* text wrapper for vertical centering */}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{
                    fontSize: 15, fontWeight: 700,
                    color: isDark ? '#D6D6D6' : '#606061ff',
                    marginLeft: 50
                }}>
                    Searching for Partner...
                </Text>
              </View>
          </View>
          
          <Text style={{
            fontSize: 15, fontWeight: 700,
              color: isDark ? '#606061ff' : '#d0d0d0ff',
              alignSelf: 'center',
              maxWidth: 250,
            textAlign: 'center'
          }}>
              Looking for available walkers nearby
          </Text>

      <LottieView
        source={require('../animations/search-plane-light.json')} 
        autoPlay
        loop
        style={styles.lottie}
      />
    </View>
  )
}

export default PartnerSearch

const styles = StyleSheet.create({
  container: {
    width: width * 0.98,
    height: height * 0.35,
    borderRadius: 47,
  },
  lottie: {
    width: 350,
      height: 250,
      alignSelf: 'center',
    //   opacity: 0.9,
    position: 'absolute',
    top: 60,
  },
});
