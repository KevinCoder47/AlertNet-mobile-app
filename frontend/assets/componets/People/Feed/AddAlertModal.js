import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ColorContext';
import CategorySelection, { categories } from './CategorySelection';
import LocationSelector from './LocationSelector';
import MediaSelector from './MediaSelector';
import { validatePostData, sanitizeText } from '../../../../utilities/helpers';

import { AlertFeedService } from '../../../services/alertFeedService';
import { auth } from '../../../../backend/Firebase/FirebaseConfig';

const AddAlertModal = ({ visible, onClose, onAddPost, userLocation, userData }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [description, setDescription] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const scrollViewRef = useRef(null);
  const descriptionRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const { colors, isDark } = useTheme();
  const styles = getStyles(isDark, colors);

  const resetForm = () => {
    setSelectedCategory(null);
    setLocation('');
    setCoordinates(null);
    setDescription('');
    setPostAnonymously(false);
    setSelectedMedia(null);
    setLoadingLocation(false);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setIsPosting(false);
  };

  const handleLocationSet = (coords, locationString) => {
    setCoordinates(coords);
    setLocation(locationString);
    setSearchQuery(locationString);
    setSearchResults([]);
  };

  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      
      const results = data.map(item => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }));
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(text);
    }, 500);
  };

  const handleSelectSearchResult = (result) => {
    setLocation(result.name);
    setCoordinates({
      latitude: result.lat,
      longitude: result.lon,
    });
    setSearchQuery(result.name);
    setSearchResults([]);
  };

  const handleMediaSelect = (media) => {
    setSelectedMedia(media);
  };

  const handleMediaRemove = () => {
    setSelectedMedia(null);
  };

  const handleDescriptionFocus = () => {
    setTimeout(() => {
      if (descriptionRef.current) {
        descriptionRef.current.measure((fx, fy, width, height, px, py) => {
          scrollViewRef.current?.scrollTo({
            y: py - 100,
            animated: true,
          });
        });
      }
    }, 300);
  };

  const handlePost = async () => {
    const postData = {
      selectedCategory,
      description: sanitizeText(description),
      coordinates,
    };

    const validation = validatePostData(postData);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.error);
      return;
    }

    try {
      setIsPosting(true);
      
      // CRITICAL FIX: Extract userId properly with multiple fallbacks
      const currentUser = auth.currentUser;
      
      // Try to get userId from multiple sources
      let userId = userData?.userId || 
                   userData?.uid || 
                   userData?.id || 
                   currentUser?.uid;

      // Validate userId
      if (!userId || userId.startsWith('temp_')) {
        console.error('❌ Invalid or missing userId:', userId);
        Alert.alert(
          'Error', 
          'Unable to identify your account. Please log in again.',
          [{ text: 'OK' }]
        );
        setIsPosting(false);
        return;
      }

      // Extract other user data with fallbacks
      const userName = userData?.fullName || 
                       userData?.name || 
                       userData?.Name ||
                       currentUser?.displayName || 
                       'User';
                       
      const userPhone = userData?.phone || 
                       userData?.Phone || 
                       userData?.phoneNumber ||
                       currentUser?.phoneNumber || 
                       null;
      
      const userEmail = userData?.email || 
                       userData?.Email || 
                       currentUser?.email || 
                       null;
      
      const userAvatar = userData?.avatar || 
                        userData?.imageUrl || 
                        userData?.ImageURL ||
                        currentUser?.photoURL || 
                        null;

      console.log('🔍 Creating alert with user data:', {
        userId,
        userName,
        userPhone: userPhone || 'No phone provided',
        userEmail,
        hasAvatar: !!userAvatar,
        isAnonymous: postAnonymously
      });

      // Prepare alert data for Firebase
      const alertData = {
        selectedCategory,
        description: sanitizeText(description),
        coordinates,
        mediaUri: selectedMedia?.uri || null,
        mediaType: selectedMedia?.type || null,
        postAnonymously,
        userId: userId, // ✅ Now guaranteed to be valid
        userPhone: userPhone,
        userName: postAnonymously ? 'Anonymous' : userName,
        userAvatar: postAnonymously ? null : userAvatar,
        userEmail: userEmail
      };

      console.log('📤 Sending to Firebase:', {
        userId: alertData.userId,
        userName: alertData.userName,
        hasAvatar: !!alertData.userAvatar,
        isAnonymous: alertData.postAnonymously
      });

      // Create alert in Firebase
      const result = await AlertFeedService.createAlert(alertData);

      if (result.success) {
        console.log('✅ Alert created successfully:', result.alertId);
        
        if (onAddPost && result.alert) {
          onAddPost(result.alert);
        }
        
        resetForm();
        onClose();
        
        Alert.alert('Success', 'Alert posted successfully!');
      } else {
        console.error('❌ Failed to create alert:', result.error);
        Alert.alert('Error', result.error || 'Failed to post alert. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error posting alert:', error);
      Alert.alert('Error', 'An error occurred while posting your alert. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const isFormValid = selectedCategory && description.trim() && coordinates;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Alert</Text>
          <TouchableOpacity
            onPress={handlePost}
            style={[
              styles.postButton,
              (!isFormValid || isPosting) && styles.postButtonDisabled,
            ]}
            disabled={!isFormValid || isPosting}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={[
                  styles.postButtonText,
                  !isFormValid && styles.postButtonTextDisabled,
                ]}
              >
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.modalContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.textSecondary || colors.secondary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for a location..."
                  placeholderTextColor={colors.placeholder || colors.secondary}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  autoCapitalize="words"
                  returnKeyType="search"
                />
                {isSearching && (
                  <ActivityIndicator size="small" color="#ff5621" style={styles.searchLoader} />
                )}
              </View>
              
              {searchResults.length > 0 && (
                <View style={styles.searchResultsContainer}>
                  {searchResults.map((result, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.searchResultItem,
                        index === searchResults.length - 1 && styles.searchResultItemLast
                      ]}
                      onPress={() => handleSelectSearchResult(result)}
                    >
                      <Ionicons name="location-outline" size={20} color="#ff5621" />
                      <Text style={styles.searchResultText} numberOfLines={2}>
                        {result.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {location && coordinates && (
                <View style={styles.selectedLocationContainer}>
                  <View style={styles.selectedLocationContent}>
                    <Ionicons name="location" size={20} color="#ff5621" />
                    <Text style={styles.selectedLocationText} numberOfLines={2}>
                      {location}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setLocation('');
                      setCoordinates(null);
                      setSearchQuery('');
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary || colors.secondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

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

            <View style={styles.section} ref={descriptionRef}>
              <Text style={styles.sectionTitle}>Add a description</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Describe what's happening, when it started, and any important details."
                placeholderTextColor={colors.placeholder || colors.secondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
                onFocus={handleDescriptionFocus}
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const getStyles = (isDark, colors) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator || colors.border,
    backgroundColor: colors.card || colors.background,
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
    color: colors.text,
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ff5621',
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: colors.inputBackground || (isDark ? '#444' : '#e0e0e0'),
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  postButtonTextDisabled: {
    color: colors.textSecondary || colors.secondary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground || (isDark ? '#2a2a2a' : '#f5f5f5'),
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder || colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  searchLoader: {
    marginLeft: 8,
  },
  searchResultsContainer: {
    marginTop: 8,
    backgroundColor: colors.card || colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder || colors.border,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator || colors.border,
  },
  searchResultItemLast: {
    borderBottomWidth: 0,
  },
  searchResultText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: colors.text,
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.inputBackground || (isDark ? '#2a2a2a' : '#f5f5f5'),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff5621',
  },
  selectedLocationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedLocationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  descriptionInput: {
    backgroundColor: colors.inputBackground || (isDark ? '#2a2a2a' : '#f5f5f5'),
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.inputBorder || colors.border,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: colors.textSecondary || colors.secondary,
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
    borderColor: colors.inputBorder || colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card || colors.background,
  },
  checkedBox: {
    backgroundColor: '#ff5621',
    borderColor: '#ff5621',
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    fontWeight: '500',
  },
  checkboxDescription: {
    fontSize: 12,
    color: colors.textSecondary || colors.secondary,
    marginLeft: 28,
  },
});

export default AddAlertModal;