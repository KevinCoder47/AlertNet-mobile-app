// components/MediaSelector.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../contexts/ColorContext';

const MediaSelector = ({ selectedMedia, onMediaSelect, onMediaRemove }) => {
  const themeContext = useTheme();
  const colors = themeContext.colors;

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        onMediaSelect({
          uri: result.assets[0].uri,
          type: result.assets[0].type,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select media. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onMediaSelect({
          uri: result.assets[0].uri,
          type: result.assets[0].type,
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Could not take photo. Please try again.');
    }
  };

  const showMediaOptions = () => {
    Alert.alert(
      'Select Media',
      'Choose how you want to add media',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImageFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Add media <Text style={[styles.optionalText, { color: colors.textTertiary }]}>(optional)</Text>
      </Text>
      
      {selectedMedia && (
        <View style={styles.selectedMediaContainer}>
          {selectedMedia.type === 'image' ? (
            <Image 
              source={{ uri: selectedMedia.uri }} 
              style={[styles.selectedMediaPreview, { backgroundColor: colors.surface }]} 
            />
          ) : (
            <Video
              source={{ uri: selectedMedia.uri }}
              rate={1.0}
              volume={1.0}
              isMuted={true}
              resizeMode="cover"
              shouldPlay={false}
              useNativeControls
              style={[styles.selectedMediaPreview, { backgroundColor: colors.surface }]}
            />
          )}
          <TouchableOpacity 
            style={styles.removeMediaButton}
            onPress={onMediaRemove}
          >
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.mediaButtons}>
        <TouchableOpacity 
          style={[
            styles.mediaButton, 
            { 
              backgroundColor: colors.inputBackground, 
              borderColor: colors.inputBorder 
            }
          ]} 
          onPress={takePhoto}
        >
          <Ionicons name="camera" size={24} color={colors.iconSecondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.mediaButton, 
            { 
              backgroundColor: colors.inputBackground, 
              borderColor: colors.inputBorder 
            }
          ]} 
          onPress={showMediaOptions}
        >
          <Ionicons name="images" size={24} color={colors.iconSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionalText: {
    fontWeight: '400',
  },
  selectedMediaContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  selectedMediaPreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});

export default MediaSelector;