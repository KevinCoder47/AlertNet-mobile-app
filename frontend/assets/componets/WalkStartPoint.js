import { StyleSheet, Text, View, Dimensions, Image, TouchableOpacity } from 'react-native'
import { useTheme } from '../contexts/ColorContext'
import { Ionicons } from '@expo/vector-icons';
import React from 'react'




const { width, height } = Dimensions.get('window')
const WalkStartPoint = ({setIsDestinationDone, setIsSearchPartner,setIsStartPoint}) => {

  const { colors, isDark } = useTheme();
  const meetupPoints = [
    'APB Campus West Entrance',
    'APB Campus East Entrance',
    'APK Campus Main Entrance',
    'APK Campus North Entrance',
    'Horizon Heights Residence',
  ]


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
          {/* back chevron and text */}
      <TouchableOpacity style={{
        flexDirection: 'row', margin: 20,
        width: 30, height: 30,
        backgroundColor: isDark ? '#212121' :'#eeeeeeff',
        alignItems: 'center', justifyContent: 'center', borderRadius: 30
      }}
        onPress={() =>
          setIsDestinationDone(false)}>
              {/* chevron */}
            <Ionicons 
              name="chevron-back-outline" 
              size={20}
              color={isDark ? "#D6D6D6" : "#606061ff"} 
              />
          </TouchableOpacity>

          {/* meet up point 3d, name , and time */}
      <View style = {{flexDirection: 'row'}}>
    
              {/* 3d view */}
        <TouchableOpacity style = {{width: 100, height: 100, backgroundColor: isDark ? '#454545' : '#F1F1F1', alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginLeft: 20}}>
          <Image source={require('../images/3d-placeholder.jpg')}
            style={{ width: 95, height: 95,borderRadius: 5 }} />
        </TouchableOpacity>

        {/* name and change button */}
        <View style = {{marginLeft: 10, alignItems: 'flex-start', justifyContent: 'center'}}>
          <Text style = {{fontSize: 8, fontWeight: 300, color: colors.text,marginBottom: 3}}>MEET UP POINT</Text>
          <Text style={{ fontSize: 18, maxWidth: 150, color: colors.text, fontWeight: 700 }}>{meetupPoints[0]}</Text>
          
          {/* change button */}
          <TouchableOpacity style = {{width: 70, height: 25, backgroundColor: "#4CAF50", alignItems: 'center', justifyContent: 'center', borderRadius: 15, marginTop: 15}}>
            <Text style = {{fontSize: 11, fontWeight: 700, color: 'white'}}>change</Text>
          </TouchableOpacity>
        </View>

        {/* time and gender button */}
       <View style = {{flex: 1, alignItems: 'center', justifyContent: 'center', marginRight: 20}}>

        {/* time */}
          <Text style={{ fontSize: 18, color: colors.text, fontWeight: 700, marginTop: 'auto' }}>5 min</Text>
          
          {/* change gender button */}
          <TouchableOpacity style = {{width: 95, height: 25, backgroundColor: "#7CA3DA", alignItems: 'center', justifyContent: 'center', borderRadius: 15, marginTop: 'auto', marginBottom: 5, marginRight: 40}}>
            <Text style = {{fontSize: 10, fontWeight: 700, color: 'white'}}>Preferred Gender</Text>
          </TouchableOpacity>
        </View>
        
      </View>
      

      {/* search button */}
      <TouchableOpacity style={{
        width: 130, height: 40,
        backgroundColor: isDark ? '#212121' : 'black', alignItems: 'center',
        justifyContent: 'center', borderRadius: 20,
        alignSelf: 'center', marginTop: 'auto', marginBottom: 20
      }}
        onPress={() => {
          setIsSearchPartner(true);
          setIsStartPoint(false);
        }}
      >
        <Text style = {{fontSize: 15, fontWeight: 700, color: 'white'}}>Search</Text>
      </TouchableOpacity>
    </View>
  )
}

export default WalkStartPoint

const styles = StyleSheet.create({
    container: {
        width: width * 0.98,
        height: height * 0.3,
        borderRadius: 47
    }
})