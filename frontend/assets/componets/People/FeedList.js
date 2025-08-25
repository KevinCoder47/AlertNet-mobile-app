import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  useColorScheme,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Platform,
  Animated,
  Easing,
  Pressable,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

const categories = [
  { id: 'fire', name: 'Fire Alert', icon: 'flame' },
  { id: 'safety', name: 'Safety & Crime', icon: 'shield-checkmark' },
  { id: 'utility', name: 'Utility Issues', icon: 'water' },
  { id: 'announcement', name: 'General Announcement', icon: 'megaphone' },
  { id: 'suspicious', name: 'Suspicious Activity', icon: 'person' },
  { id: 'road', name: 'Road / Access Block', icon: 'car' },
  { id: 'lost', name: 'Lost & Found', icon: 'paw' },
  { id: 'noise', name: 'Noise / Party', icon: 'musical-notes' },
];

// Function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Function to format distance display
const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`;
  } else if (distance < 100) {
    return `${distance.toFixed(1)}km away`;
  } else {
    return `${Math.round(distance)}km away`;
  }
};

const initialFeedData = [
  {
    id: '1',
    name: 'Amahle Mdletshe',
    alertType: 'Fire Alert',
    coordinates: { latitude: -26.2041, longitude: 28.0473 },
    description: "There's a fire at UJ APK just behind student centre. Please avoid the area!",
    likes: 1013,
    comments: [
      { id: '1', name: 'Sarah Johnson', text: 'Stay safe everyone!', time: '5m ago' },
      { id: '2', name: 'Mike Chen', text: 'Thanks for the heads up', time: '3m ago' },
    ],
    liked: false,
    image: require('../../images/fire.jpg'),
    avatar: require('../../images/Kuhle.jpg'),
  },
  {
    id: '2',
    name: 'Angel Kiana',
    alertType: 'Safety & Crime',
    coordinates: { latitude: -26.1951, longitude: 28.0568 },
    description: 'Someone just got their phone snatched, near Richmond Corner',
    likes: 67,
    comments: [
      { id: '1', name: 'John Doe', text: 'Did they report it to security?', time: '10m ago' },
    ],
    liked: false,
    image: require('../../images/richmond.jpg'),
    avatar: require('../../images/Cheyenne.jpg'),
  },
  {
    id: '3',
    name: 'Kemal Smith',
    alertType: 'Utility Issue',
    coordinates: { latitude: -29.8587, longitude: 31.0218 },
    description: 'Burst water pipe near UJ APB. Authorities notified.',
    likes: 321,
    comments: [],
    liked: false,
    video: require('../../images/waterburst.mp4'),
    avatar: require('../../images/kemal.jpg'),
  },
];

// MenuModal Component
const MenuModal = ({ visible, onClose, onReply, onShare, onReport, postId }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleClose = () => {
    // Start close animation then call onClose after animation completes
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleReply = () => {
    handleClose();
    setTimeout(() => onReply(postId), 200);
  };

  const handleShare = () => {
    handleClose();
    setTimeout(() => onShare(postId), 200);
  };

  const handleReport = () => {
    handleClose();
    setTimeout(() => onReport(postId), 200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={handleClose}
      >
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        />
        
        <Animated.View
          style={[
            styles.menuContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleReply}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-undo" size={20} color="#fff" />
              <Text style={styles.menuText}>Reply</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Ionicons name="paper-plane" size={20} color="#fff" />
              <Text style={styles.menuText}>Share</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleReport}
              activeOpacity={0.7}
            >
              <Ionicons name="flag" size={20} color="#ff4444" />
              <Text style={[styles.menuText, styles.reportText]}>Report</Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// Like Animation Component
const LikeAnimation = ({ show, onAnimationEnd }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (show) {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 200,
            easing: Easing.out(Easing.back(1.7)),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onAnimationEnd();
      });
    }
  }, [show]);

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.likeAnimationContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Ionicons name="heart" size={80} color="#ff3040" />
    </Animated.View>
  );
};

// Comment Modal Component
const CommentModal = ({ visible, onClose, post, onAddComment }) => {
  const [commentText, setCommentText] = useState('');

  const handleAddComment = () => {
    if (commentText.trim()) {
      const newComment = {
        id: Date.now().toString(),
        name: 'You',
        text: commentText.trim(),
        time: 'now',
      };
      onAddComment(post.id, newComment);
      setCommentText('');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.commentModalContainer}>
        <View style={styles.commentHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.commentHeaderTitle}>Comments</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
          {post?.comments?.length > 0 ? (
            post.comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Ionicons name="person-circle" size={32} color="#ccc" />
                </View>
                <View style={styles.commentContent}>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentName}>{comment.name}</Text>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                  <Text style={styles.commentTime}>{comment.time}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noCommentsContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
              <Text style={styles.noCommentsText}>No comments yet</Text>
              <Text style={styles.noCommentsSubtext}>Be the first to comment</Text>
            </View>
          )}
        </ScrollView>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.commentInputContainer}
        >
          <View style={styles.commentInputWrapper}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={300}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !commentText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleAddComment}
              disabled={!commentText.trim()}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={commentText.trim() ? '#ff5621' : '#ccc'} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const AddAlertModal = ({ visible, onClose, onAddPost, userLocation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [description, setDescription] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        setLoadingLocation(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCoordinates({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      let address = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (address && address.length > 0) {
        const addr = address[0];
        const locationString = `${addr.street || ''} ${addr.name || ''}, ${addr.city || addr.district || ''}, ${addr.region || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,+/g, ',').trim();
        setLocation(locationString || 'Current Location');
      } else {
        setLocation('Current Location');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get current location. Please enter manually.');
    } finally {
      setLoadingLocation(false);
    }
  };

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
        setSelectedMedia({
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
        setSelectedMedia({
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

  const handlePost = () => {
    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    
    const newPost = {
      id: Date.now().toString(),
      name: postAnonymously ? 'Anonymous' : 'You',
      alertType: selectedCategoryData?.name || 'General Alert',
      coordinates: coordinates,
      description: description,
      likes: 0,
      comments: [],
      liked: false,
      avatar: postAnonymously ? null : require('../../images/Kuhle.jpg'),
      ...(selectedMedia && selectedMedia.type === 'image' ? { image: { uri: selectedMedia.uri } } : {}),
      ...(selectedMedia && selectedMedia.type === 'video' ? { video: { uri: selectedMedia.uri } } : {}),
    };

    onAddPost(newPost);
    
    setSelectedCategory(null);
    setLocation('');
    setCoordinates(null);
    setDescription('');
    setPostAnonymously(false);
    setSelectedMedia(null);
    onClose();
  };

  const renderCategory = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.selectedCategory,
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Ionicons
        name={category.icon}
        size={24}
        color={selectedCategory === category.id ? '#ff5621' : '#666'}
      />
      <Text
        style={[
          styles.categoryText,
          selectedCategory === category.id && styles.selectedCategoryText,
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );

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
              (!selectedCategory || !description.trim() || !coordinates) && styles.postButtonDisabled,
            ]}
            disabled={!selectedCategory || !description.trim() || !coordinates}
          >
            <Text
              style={[
                styles.postButtonText,
                (!selectedCategory || !description.trim() || !coordinates) && styles.postButtonTextDisabled,
              ]}
            >
              Post
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color="#333" />
              <Text style={styles.sectionTitle}>Set Location</Text>
            </View>
            <View style={styles.locationContainer}>
              <TouchableOpacity 
                style={styles.currentLocationButton}
                onPress={getCurrentLocation}
                disabled={loadingLocation}
              >
                <View style={styles.mapPreview}>
                  {loadingLocation ? (
                    <Ionicons name="refresh" size={20} color="#666" />
                  ) : (
                    <Ionicons name="location" size={20} color="#666" />
                  )}
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.currentLocationText}>
                    {loadingLocation ? 'Getting Location...' : coordinates ? 'Location Set' : 'Set Current Location'}
                  </Text>
                  {coordinates && (
                    <Text style={styles.locationPreview}>
                      {location || 'Current Location'}
                    </Text>
                  )}
                </View>
                {coordinates && (
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Selection</Text>
            <View style={styles.categoriesGrid}>
              {categories.map(renderCategory)}
            </View>
          </View>

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
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Add media <Text style={styles.optionalText}>(optional)</Text>
            </Text>
            
            {selectedMedia && (
              <View style={styles.selectedMediaContainer}>
                {selectedMedia.type === 'image' ? (
                  <Image source={{ uri: selectedMedia.uri }} style={styles.selectedMediaPreview} />
                ) : (
                  <Video
                    source={{ uri: selectedMedia.uri }}
                    rate={1.0}
                    volume={1.0}
                    isMuted={true}
                    resizeMode="cover"
                    shouldPlay={false}
                    useNativeControls
                    style={styles.selectedMediaPreview}
                  />
                )}
                <TouchableOpacity 
                  style={styles.removeMediaButton}
                  onPress={() => setSelectedMedia(null)}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.mediaButtons}>
              <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaButton} onPress={showMediaOptions}>
                <Ionicons name="images" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

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
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const FeedList = () => {
  const isDark = useColorScheme() === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [feedData, setFeedData] = useState(initialFeedData);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showLikeAnimation, setShowLikeAnimation] = useState({});
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [selectedPostForMenu, setSelectedPostForMenu] = useState(null);

  useEffect(() => {
    getCurrentUserLocation();
  }, []);

  const getCurrentUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setFeedData([...initialFeedData]);
      setRefreshing(false);
    }, 1500);
  }, []);

  const formatLikes = (likes) => {
    return likes > 999 ? `${Math.floor(likes / 1000)}k` : likes;
  };

  const handleAddPost = (newPost) => {
    setFeedData(prevData => [newPost, ...prevData]);
  };

  const handleDoubleTap = (postId) => {
    setFeedData(prevData =>
      prevData.map(post =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );

    setShowLikeAnimation(prev => ({ ...prev, [postId]: true }));
  };

  const handleLikeAnimationEnd = (postId) => {
    setShowLikeAnimation(prev => ({ ...prev, [postId]: false }));
  };

  const openCommentModal = (post) => {
    setSelectedPost(post);
    setShowCommentModal(true);
  };

  const closeCommentModal = () => {
    setShowCommentModal(false);
    setSelectedPost(null);
  };

  const handleAddComment = (postId, newComment) => {
    setFeedData(prevData =>
      prevData.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: [...(post.comments || []), newComment],
            }
          : post
      )
    );
  };

  // Menu Modal Functions
  const openMenuModal = (post) => {
    setSelectedPostForMenu(post);
    setShowMenuModal(true);
  };

  const closeMenuModal = () => {
    setShowMenuModal(false);
    setSelectedPostForMenu(null);
  };

  const handleReply = (postId) => {
    console.log('Reply to post:', postId);
    const post = feedData.find(p => p.id === postId);
    if (post) {
      openCommentModal(post);
    }
  };

  const handleShare = (postId) => {
    console.log('Share post:', postId);
    Alert.alert('Share', 'Share functionality would be implemented here');
  };

  const handleReport = (postId) => {
    console.log('Report post:', postId);
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => {
          Alert.alert('Reported', 'Thank you for your report. We will review it shortly.');
        }},
      ]
    );
  };

  const renderItem = ({ item }) => {
    let distanceText = 'Location unknown';
    let isNear = false;

    if (userLocation && item.coordinates) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        item.coordinates.latitude,
        item.coordinates.longitude
      );
      
      distanceText = formatDistance(distance);
      isNear = distance < 1;
    }

    const textColor = isNear ? '#fff' : '#000';
    const subTextColor = isNear ? '#f0f0f0' : '#666';
    const iconColor = isNear ? '#fff' : '#333';
    const likedIconColor = item.liked ? '#ff3040' : iconColor;

    return (
      <Pressable
        onPress={() => {}}
        onLongPress={() => {}}
        delayLongPress={500}
        style={({ pressed }) => [
          styles.card,
          { 
            backgroundColor: isNear ? '#ff5621' : '#fff',
            opacity: pressed ? 0.95 : 1,
          }
        ]}
      >
        <View style={styles.headerRow}>
          {item.avatar ? (
            <Image source={item.avatar} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.anonymousAvatar]}>
              <Ionicons name="person" size={20} color="#999" />
            </View>
          )}
          <View>
            <Text style={[styles.name, { color: textColor }]}>{item.name}</Text>
            <Text style={[styles.subText, { color: subTextColor }]}>{item.alertType}</Text>
          </View>
        </View>

        <Text style={[styles.description, { color: textColor }]}>{item.description}</Text>

        <Pressable
          onPress={() => handleDoubleTap(item.id)}
          style={styles.mediaWrapper}
        >
          {item.image && (
            <>
              <Image 
                source={typeof item.image === 'object' && item.image.uri ? item.image : item.image} 
                style={styles.previewImage} 
              />
              <Ionicons name="image-outline" size={20} color="#fff" style={styles.mediaIcon} />
            </>
          )}
          {item.video && (
            <>
              <Video
                source={typeof item.video === 'object' && item.video.uri ? item.video : item.video}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode="cover"
                shouldPlay={false}
                useNativeControls
                style={styles.previewVideo}
              />
              <Ionicons name="videocam-outline" size={20} color="#fff" style={styles.mediaIcon} />
            </>
          )}

          <LikeAnimation
            show={showLikeAnimation[item.id]}
            onAnimationEnd={() => handleLikeAnimationEnd(item.id)}
          />
        </Pressable>

        <View style={styles.footerAligned}>
          <View style={styles.engagement}>
            <TouchableOpacity 
              onPress={() => handleDoubleTap(item.id)}
              style={styles.engagementButton}
            >
              <Ionicons 
                name={item.liked ? "heart" : "heart-outline"} 
                size={16} 
                color={likedIconColor} 
              />
            </TouchableOpacity>
            <Text style={[styles.engageText, { color: textColor }]}>
              {formatLikes(item.likes)}
            </Text>

            <TouchableOpacity 
              style={[styles.engagementButton, { marginLeft: 12 }]} 
              onPress={() => openCommentModal(item)}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color={iconColor} />
            </TouchableOpacity>
            <Text style={[styles.engageText, { color: textColor }]}>
              {item.comments?.length || 0}
            </Text>
          </View>

          <Text style={[styles.locationText, { color: textColor }]}>{distanceText}</Text>

          <TouchableOpacity style={styles.dotsIcon} onPress={() => openMenuModal(item)}>
            <Ionicons name="ellipsis-vertical" size={16} color={iconColor} />
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={feedData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <View style={styles.addButtonContainer}>
        <BlurView intensity={70} tint="light" style={styles.blurWrapper}>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.7}
            style={styles.addTouchable}
          >
            <Ionicons name="add" size={32} color="#fff" />
          </TouchableOpacity>
        </BlurView>
      </View>

      <AddAlertModal 
        visible={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onAddPost={handleAddPost}
        userLocation={userLocation}
      />

      <CommentModal
        visible={showCommentModal}
        onClose={closeCommentModal}
        post={selectedPost}
        onAddComment={handleAddComment}
      />

      <MenuModal
        visible={showMenuModal}
        onClose={closeMenuModal}
        onReply={handleReply}
        onShare={handleShare}
        onReport={handleReport}
        postId={selectedPostForMenu?.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Menu Modal Styles
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
  },
  blurContainer: {
    borderRadius: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  reportText: {
    color: '#ff4444',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
  },
  // Existing Card Styles
  card: {
    margin: 10,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  name: {
    fontWeight: '600',
    fontSize: 14,
  },
  subText: {
    fontSize: 12,
  },
  description: {
    marginVertical: 6,
    fontSize: 13,
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  previewVideo: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  mediaWrapper: {
    position: 'relative',
    marginVertical: 6,
  },
  mediaIcon: {
    position: 'absolute',
    top: 8,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  },
  footerAligned: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    position: 'relative',
  },
  engagement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  engageText: {
    fontSize: 13,
    marginLeft: 4,
  },
  engagementButton: {
    padding: 4,
  },
  locationText: {
    position: 'absolute',
    bottom: 1,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 12,
  },
  dotsIcon: {
    position: 'absolute',
    bottom: 4,
    right: 6,
  },
  // Like Animation Styles
  likeAnimationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  // Comment Modal Styles
  commentModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  commentHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    marginRight: 12,
    marginTop: 4,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  commentName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 11,
    color: '#666',
    marginLeft: 12,
  },
  noCommentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noCommentsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    color: '#333',
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 15,
    width: 60,
    height: 60,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999,
  },
  blurWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  addTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  locationContainer: {
    gap: 12,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  mapPreview: {
    width: 40,
    height: 40,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  locationPreview: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: '47%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCategory: {
    backgroundColor: '#fff5f3',
    borderColor: '#ff5621',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#ff5621',
    fontWeight: '600',
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
  optionalText: {
    color: '#999',
    fontWeight: '400',
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    width: 50,
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  anonymousAvatar: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMediaContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  selectedMediaPreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
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
});

export default FeedList;