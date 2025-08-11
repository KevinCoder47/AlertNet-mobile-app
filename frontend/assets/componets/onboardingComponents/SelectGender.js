import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width, height} = Dimensions.get('window')

// Color constants
const baseColor = '#FFEDD5';
const maleSelectedColor = '#7A9CF5';
const maleUnselectedColor = '#ff9100';
const femaleSelectedColor = '#E7A8B8';
const femaleUnselectedColor = '#ff9100';

const SelectGender = () => {

    const [gender, setGender] = useState('');

    const saveGender = async (selectedGender) => {
        try {
            await AsyncStorage.setItem('userGender', selectedGender);
        } catch (error) {
            console.error('Failed to save gender:', error);
        }
    }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { marginTop: 104 }]}>
        Select Gender
      </Text>

      {/* male circle */}
      <TouchableOpacity
        onPress={() => {
          setGender('Male');
          saveGender('Male');
        }}
        style={[
          styles.bigCircle,
          { backgroundColor: gender === 'Male' ? maleSelectedColor : baseColor }
        ]}
      >
        <Ionicons
          name='male'
          size={50}
          color={gender === 'Male' ? 'white' : maleUnselectedColor}
        />
        <Text
          style={[
            styles.text,
            { color: gender === 'Male' ? 'white' : maleUnselectedColor }
          ]}
        >
          Male
        </Text>
      </TouchableOpacity>

      {/* female circle */}
      <TouchableOpacity
        onPress={() => {
          setGender('Female');
          saveGender('Female');
        }}
        style={[
          styles.bigCircle,
          { backgroundColor: gender === 'Female' ? femaleSelectedColor : baseColor }
        ]}
      >
        <Ionicons
          name='female'
          size={50}
          color={gender === 'Female' ? 'white' : femaleUnselectedColor}
        />
        <Text
          style={[
            styles.text,
            { color: gender === 'Female' ? 'white' : femaleUnselectedColor }
          ]}
        >
          Female
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default SelectGender

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: width,
        height: height,
        paddingTop: 40,
        alignItems: 'center',
        position: 'absolute',
        gap: 20
    },
    title: {
        fontSize: 18,
        fontWeight: '600'
    },
    bigCircle: {
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: width,
        alignItems: 'center',
        justifyContent: 'center'
    },
    text: {
        fontSize: 15,
        fontWeight: '600',
        marginTop: 10
    }
})