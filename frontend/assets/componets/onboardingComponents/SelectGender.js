import React from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width, height} = Dimensions.get('window');

// Color constants
const baseColor = '#FFEDD5';
const maleSelectedColor = '#7A9CF5';
const maleUnselectedColor = '#ff9100';
const femaleSelectedColor = '#E7A8B8';
const femaleUnselectedColor = '#ff9100';

const SelectGender = ({ onGenderSelected }) => {
  const [gender, setGender] = React.useState('');

  const saveGenderToUserData = async (selectedGender) => {
    try {
      // Get existing userData from AsyncStorage
      const userDataString = await AsyncStorage.getItem('userData');
      let userData = userDataString ? JSON.parse(userDataString) : {};
      
      // Update gender in userData
      userData = {
        ...userData,
        gender: selectedGender
      };
      
      // Save updated userData back to AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      console.log('Gender saved to userData:', selectedGender);
      
      // Notify parent component
      if (onGenderSelected) {
        onGenderSelected(selectedGender);
      }
    } catch (error) {
      console.error('Failed to save gender to userData:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { marginTop: 104 }]}>
        Select Gender
      </Text>

      {/* male circle */}
      <TouchableOpacity
        onPress={() => {
          setGender('Male');
          saveGenderToUserData('Male');
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
          saveGenderToUserData('Female');
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
  );
};

export default SelectGender;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
    paddingTop: 40,
    alignItems: 'center',
    position: 'absolute',
    gap: 20,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 30,
  },
  bigCircle: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
  },
});