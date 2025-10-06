// components/FeedList.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useTheme } from '../../../contexts/ColorContext';

// Import our sub-components
import FeedCard from './FeedCard';
import CommentModal from './CommentModal';
import MenuModal from './MenuModal';
import AddAlertModal from './AddAlertModal';

// Import data service
import { feedDataService } from '../../../services/feedDataService';

const FeedList = () => {
  const themeContext = useTheme();
  const colors = themeContext.colors;
  const isDark = themeContext.isDark;
  
  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [feedData, setFeedData] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  
  // Selected items for modals
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostForMenu, setSelectedPostForMenu] = useState(null);
  
  // Animation states
  const [showLikeAnimation, setShowLikeAnimation] = useState({});

  // Initialize user location and subscribe to data changes
  useEffect(() => {
    // Initialize feed data
    if (feedDataService) {
      setFeedData(feedDataService.getFeedData());
    }
    
    getCurrentUserLocation();
    
    // Subscribe to data service changes
    let unsubscribe = null;
    if (feedDataService) {
      unsubscribe = feedDataService.subscribe(setFeedData);
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Location functions
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

  // Feed actions
  const onRefresh = useCallback(async () => {
    if (!feedDataService) return;
    
    setRefreshing(true);
    try {
      await feedDataService.refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleAddPost = (newPost) => {
    if (feedDataService) {
      feedDataService.addPost(newPost);
    }
  };

  // Like functionality
  const handleLike = (postId) => {
    if (!feedDataService) return;
    
    const post = feedData.find(p => p.id === postId);
    if (!post) return;

    const updatedPost = {
      liked: !post.liked,
      likes: post.liked ? post.likes - 1 : post.likes + 1,
    };

    feedDataService.updatePost(postId, updatedPost);
    
    // Show like animation
    if (!post.liked) {
      setShowLikeAnimation(prev => ({ ...prev, [postId]: true }));
    }
  };

  const handleLikeAnimationEnd = (postId) => {
    setShowLikeAnimation(prev => ({ ...prev, [postId]: false }));
  };

  // Comment functionality
  const openCommentModal = (post) => {
    setSelectedPost(post);
    setShowCommentModal(true);
  };

  const closeCommentModal = () => {
    setShowCommentModal(false);
    setSelectedPost(null);
  };

  const handleAddComment = (postId, newComment) => {
    if (feedDataService) {
      feedDataService.addComment(postId, newComment);
    }
  };

  // Menu functionality
  const openMenuModal = (post) => {
    setSelectedPostForMenu(post);
    setShowMenuModal(true);
  };

  const closeMenuModal = () => {
    setShowMenuModal(false);
    setSelectedPostForMenu(null);
  };

  const handleReply = (postId) => {
    const post = feedData.find(p => p.id === postId);
    if (post) {
      openCommentModal(post);
    }
  };

  const handleShare = (postId) => {
    Alert.alert('Share', 'Share functionality would be implemented here');
  };

  const handleReport = (postId) => {
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive', 
          onPress: () => {
            Alert.alert('Reported', 'Thank you for your report. We will review it shortly.');
            if (feedDataService) {
              feedDataService.reportPost(postId);
            }
          }
        },
      ]
    );
  };

  // Render functions
  const renderItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <FeedCard
        item={item}
        userLocation={userLocation}
        onLike={handleLike}
        onComment={openCommentModal}
        onMenuPress={openMenuModal}
        showLikeAnimation={showLikeAnimation[item.id]}
        onLikeAnimationEnd={() => handleLikeAnimationEnd(item.id)}
      />
    </View>
  );

  const AddButton = () => (
    <View style={[styles.addButtonContainer, { backgroundColor: colors.overlay }]}>
      <BlurView 
        intensity={70} 
        tint={isDark ? "dark" : "light"} 
        style={[
          styles.blurWrapper,
          {
            backgroundColor: colors.overlay,
            borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)',
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
          style={styles.addTouchable}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </BlurView>
    </View>
  );

  // Show loading state if service isn't available
  if (!feedDataService) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: 'transparent' }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Feed service is not available</Text>
        <Text style={[styles.errorSubtext, { color: colors.secondary }]}>Please check your internet connection and try again</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={feedData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.text}
            colors={[colors.text]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <AddButton />

      {/* Modals */}
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
  container: {
    flex: 1,
    backgroundColor: 'transparent', 
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 12,
    paddingHorizontal: 0,
  },
  cardWrapper: {
    marginHorizontal: 0,
    marginVertical: 1,
    borderRadius: 0,
    backgroundColor: 'transparent',
    // iOS shadow - drop shadow effect (only below the card)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 7,
    // Android shadow - drop shadow effect
    elevation: 16,
  },
  separator: {
    height: 8,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 15,
    width: 60,
    height: 60,
    borderRadius: 60,
    overflow: 'hidden',
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
    borderWidth: 1,
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
});

export default FeedList;