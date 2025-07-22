import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { useTheme } from '../contexts/ColorContext'
import AsyncStorage from '@react-native-async-storage/async-storage';

const ScheduledWalkRectangle = ({ slot }) => {
  const { colors, isDark } = useTheme();

  if (!slot) {
      return (
          <View>
          <Text >Slot empty</Text>
          </View>
      );
  }

  const prof_pic = [
    require('../images/profile-pictures/14.jpg'),
    require('../images/profile-pictures/cheyenne.jpeg'),
    require('../images/profile-pictures/siphe.jpeg'),
  ];
    
    // for testing!!!!!!
    const clearAllData = async () => {
//   try {
//     await AsyncStorage.clear();
//     console.log('✅ AsyncStorage cleared');
//   } catch (e) {
//     console.error('❌ Failed to clear AsyncStorage:', e);
//   }
};

  return (
    <View>
      {/* rectangle */}
      <TouchableOpacity onPress={() => clearAllData()} style={[styles.container, {
        backgroundColor: isDark ? "#313131" : "#F6F6F6",
        borderWidth: 0.3,
        borderColor: "#717171",
        borderRadius: 10
      }]}>
        {/* small circle and name */}
        <View style={{ flexDirection: 'row', gap: 5 }}>
          <View style={{
            backgroundColor: slot.themeColor,
            width: 7,
            height: 7,
            borderRadius: 7,
            borderWidth: 1,
            borderColor: slot.themeColor,
            marginTop: 5
          }} />
          <Text style={{
            fontWeight: '500',
            fontSize: 13,
            color: colors.text
          }}>{slot.scheduleName}</Text>
        </View>

        {/* to location */}
        <Text style={{
          fontWeight: '700',
          fontSize: 11,
          color: colors.secondary,
          marginLeft: 15,
          marginTop: 5
        }}>{slot.to}</Text>
      </TouchableOpacity>

      {/* number of people joined */}
      <View style={{
        flexDirection: 'row',
        marginTop: 5,
        alignItems: 'center',
        marginLeft: 30
      }}>
        {prof_pic.slice(0, 3).map((pic, index) => (
          <Image
            key={index}
            source={pic}
            style={{
              width: 25,
              height: 25,
              borderRadius: 12.5,
              marginLeft: index === 0 ? 0 : -10,
              borderWidth: 1,
              borderColor: '#fff'
            }}
          />
        ))}
        <Text style={{
          fontSize: 11,
          fontWeight: '700',
          marginLeft: 5,
          color: colors.secondary
        }}>+ {Math.max(0, (prof_pic.length - 3))}</Text>
      </View>
    </View>
  );
};

export default ScheduledWalkRectangle

const styles = StyleSheet.create({
    container: {
        width: 200,
        height: 60,
        padding: 15,
        justifyContent: 'center'
    }
})