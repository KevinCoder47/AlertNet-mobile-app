import { StyleSheet, Text, View, Dimensions, Image, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { uploadProfileImage } from '../../../backend/Firebase/storage';

const {width, height} = Dimensions.get('window')

const AddProfileImage = ({ onImageSelected, isImageSaved, setIsImageSaved,profileImageUri,setProfileImageUri }) => {
  
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') alert('Camera roll permissions required!');
      
      // Load image from userData
      try {
        const userDataJSON = await AsyncStorage.getItem('userData');
        const legacyImage = await AsyncStorage.getItem('profileImage');
        
        let imageUri = null;
        
        // 1. Check new storage location
        if (userDataJSON) {
          const userData = JSON.parse(userDataJSON);
          if (userData.imageUrl) imageUri = userData.imageUrl;
        }
        
        // 2. Migrate legacy storage if needed
        if (!imageUri && legacyImage) {
          imageUri = legacyImage;
          // Migrate to userData object
          const userData = userDataJSON ? JSON.parse(userDataJSON) : {};
          userData.imageUrl = legacyImage;
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          await AsyncStorage.removeItem('profileImage'); // Remove old key
        }
        
        // Update state if image found
        if (imageUri) {
          setProfileImageUri(imageUri);
          setIsImageSaved(true);
          if (onImageSelected) onImageSelected(imageUri);
        }
      } catch (error) {
        console.error('Error loading image:', error);
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

      // Update userData with local image path
      const userDataJSON = await AsyncStorage.getItem('userData');
      const userData = userDataJSON ? JSON.parse(userDataJSON) : {};
      userData.localImagePath = newPath;
      
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // Update state with local URI
      setProfileImageUri(newPath);
      setIsImageSaved(true);
      if (onImageSelected) onImageSelected(newPath);
    }
  } catch (error) {
    console.error('Error selecting image:', error);
    alert('Error selecting image. Please try again.');
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Add profile image
      </Text>

      <Text style={styles.p}>
        Select your best image to make you identifiable 
      </Text>

      {/* Image selector */}
      <TouchableOpacity 
        style={[styles.imageSelector, uploading && styles.uploading]}
        onPress={pickImage}
        disabled={uploading}
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
        
        {uploading && (
          <View style={styles.uploadOverlay}>
            <Ionicons
              name='cloud-upload'
              size={40}
              color={'#FFF'}
            />
            <Text style={styles.uploadText}>Uploading...</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* terms */}
      <View style={{flexDirection: 'row', marginTop: 15, gap: 5}}>
        <Ionicons
          name='lock-closed'
          size={10}
          color={'#666666'}
        />
        <Text style={[styles.p, {marginTop: 0, color: '#666666'}]}>
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
    overflow: 'hidden'
  },
  selectedImage: {
    width: '100%',
    height: '100%'
  },
  uploading: {
    opacity: 0.7
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16
  }
});