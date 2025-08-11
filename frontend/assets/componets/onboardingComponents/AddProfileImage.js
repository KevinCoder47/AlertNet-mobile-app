import { StyleSheet, Text, View, Dimensions, Image, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width, height} = Dimensions.get('window')

const AddProfileImage = ({ onImageSelected,isImageSaved,setIsImageSaved }) => {
  const [profileImageUri, setProfileImageUri] = useState(null);
  

  useEffect(() => {
    (async () => {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
      
      // Load saved image if exists
      const savedImage = await AsyncStorage.getItem('profileImage');
      if (savedImage) {
          setProfileImageUri(savedImage);
          setIsImageSaved(true)
        if (onImageSelected) onImageSelected(savedImage);
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        
        // Generate unique filename
        const fileExt = uri.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const newPath = `${FileSystem.documentDirectory}${fileName}`;

        // Copy image to permanent storage
        await FileSystem.copyAsync({
          from: uri,
          to: newPath
        });
        
        // Save to state and AsyncStorage
        setProfileImageUri(newPath);
        await AsyncStorage.setItem('profileImage', newPath);
        setIsImageSaved(true)
        // Notify parent component if needed
        if (onImageSelected) onImageSelected(newPath);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      alert('Error selecting image. Please try again.');
    }
  };

  return (
      <View style={styles.container}>
          <Text style = {styles.title}>
              Add profile image
          </Text>

          <Text style = {styles.p}>
              select your best image to make you identifiable 
          </Text>

          {/* Image selector */}
          <TouchableOpacity 
            style={styles.imageSelector}
            onPress={pickImage}
          >
            {profileImageUri ? (
              <Image 
                source={{ uri: profileImageUri }} 
                style={styles.selectedImage} 
              />
            ) : (
              <Ionicons
                name='image'
                size={25}
                color={'#717171'}
              />
            )}
          </TouchableOpacity>

          {/* terms */}
          <View style ={{flexDirection: 'row', marginTop: 15,gap: 5}}>
              <Ionicons
                  name='lock-closed'
                  size={10}
                  color={'#666666'}
              />
              <Text style={[styles.p, {marginTop: 0,color: '#666666'}]}>
                  We'll only show your image to people you connect with on Alertnet.
              </Text>
          </View>
    </View>
  )
}

export default AddProfileImage

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: width,
        height: height,
        paddingTop: 40,
        alignItems: 'center'
    },
    title: {
        fontSize: 18,
        fontWeight: '600'
    },
    p: {
        fontSize: 10,
        marginTop: 20,
        fontWeight: '400'
    },
    imageSelector: {
        width: width * 0.9,
        height: width * 0.9,
        backgroundColor: '#FFEDD5',
        marginTop: 60,
        borderRadius: 10,
        borderWidth: 0.2,
        borderColor: '#F57527',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden' // Ensure image stays within rounded corners
    },
    selectedImage: {
        width: '100%',
        height: '100%'
    }
})