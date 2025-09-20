// components/AddAlertModal.js
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CategorySelection, { categories } from './CategorySelection';
import LocationSelector from './LocationSelector';
import MediaSelector from './MediaSelector';
import { validatePostData, sanitizeText } from '../../../../utilities/helpers'

const AddAlertModal = ({ visible, onClose, onAddPost, userLocation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [description, setDescription] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const resetForm = () => {
    setSelectedCategory(null);
    setLocation('');
    setCoordinates(null);
    setDescription('');
    setPostAnonymously(false);
    setSelectedMedia(null);
    setLoadingLocation(false);
  };

  const handleLocationSet = (coords, locationString) => {
    setCoordinates(coords);
    setLocation(locationString);
  };

  const handleMediaSelect = (media) => {
    setSelectedMedia(media);
  };

  const handleMediaRemove = () => {
    setSelectedMedia(null);
  };

  const handlePost = () => {
    const postData = {
      selectedCategory,
      description: sanitizeText(description),
      coordinates,
    };

    const validation = validatePostData(postData);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    
    const newPost = {
      name: postAnonymously ? 'Anonymous' : 'You',
      alertType: selectedCategoryData?.name || 'General Alert',
      coordinates: coordinates,
      description: sanitizeText(description),
      avatar: postAnonymously ? null : require('../../../images/Kuhle.jpg'),
      ...(selectedMedia && selectedMedia.type === 'image' ? { image: { uri: selectedMedia.uri } } : {}),
      ...(selectedMedia && selectedMedia.type === 'video' ? { video: { uri: selectedMedia.uri } } : {}),
    };

    onAddPost(newPost);
    resetForm();
    onClose();
  };

  const isFormValid = selectedCategory && description.trim() && coordinates;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Alert</Text>
          <TouchableOpacity
            onPress={handlePost}
            style={[
              styles.postButton,
              !isFormValid && styles.postButtonDisabled,
            ]}
            disabled={!isFormValid}
          >
            <Text
              style={[
                styles.postButtonText,
                !isFormValid && styles.postButtonTextDisabled,
              ]}
            >
              Post
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <LocationSelector
            location={location}
            coordinates={coordinates}
            onLocationSet={handleLocationSet}
            loadingLocation={loadingLocation}
            setLoadingLocation={setLoadingLocation}
          />

          <CategorySelection
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add a description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Describe what's happening, when it started, and any important details."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
              autoCapitalize="sentences"
              returnKeyType="default"
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {description.length}/500
            </Text>
          </View>

          <MediaSelector
            selectedMedia={selectedMedia}
            onMediaSelect={handleMediaSelect}
            onMediaRemove={handleMediaRemove}
          />

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setPostAnonymously(!postAnonymously)}
            >
              <View style={[styles.checkbox, postAnonymously && styles.checkedBox]}>
                {postAnonymously && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Post anonymously</Text>
            </TouchableOpacity>
            <Text style={styles.checkboxDescription}>
              Your identity will be hidden from other users
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ff5621',
  },
  postButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  postButtonTextDisabled: {
    color: '#999',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  descriptionInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkedBox: {
    backgroundColor: '#ff5621',
    borderColor: '#ff5621',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  checkboxDescription: {
    fontSize: 12,
    color: '#666',
    marginLeft: 28,
  },
});

export default AddAlertModal;