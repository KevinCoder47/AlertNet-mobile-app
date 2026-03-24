// components/FeedList.js - WITH ASYNCSTORAGE SUPPORT
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../contexts/ColorContext';

import FeedCard from './FeedCard';
import CommentModal from './CommentModal';
import MenuModal from './MenuModal';
import AddAlertModal from './AddAlertModal';

import { AlertFeedService } from '../../../services/alertFeedService';
import { FirebaseService } from '../../../../backend/Firebase/FirebaseService';
import { auth } from '../../../../backend/Firebase/FirebaseConfig';

const FeedList = ({ currentUser, userData: propUserData }) => {
  const themeContext = useTheme();
  const colors = themeContext.colors;
  const isDark = themeContext.isDark;
  
  const [refreshing, setRefreshing] = useState(false);
  const [feedData, setFeedData] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completeUserData, setCompleteUserData] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostForMenu, setSelectedPostForMenu] = useState(null);
  
  const [showLikeAnimation, setShowLikeAnimation] = useState({});
  const [unsubscribe, setUnsubscribe] = useState(null);

  useEffect(() => {
    console.log('🚀 FeedList mounted, initializing...');
    
    const timeoutId = setTimeout(() => {
      console.log('⏱️ Auth timeout reached, proceeding with available data');
      if (!completeUserData) {
        setLoading(false);
      }
    }, 5000);

    initializeUserData();
    getCurrentUserLocation();

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (userLocation && completeUserData) {
      setupRealtimeListener();
    }
  }, [userLocation, completeUserData]);

  /**
   * Initialize user data - CHECK ASYNCSTORAGE FIRST
   */
  const initializeUserData = async () => {
    try {
      console.log('📦 Initializing user data...');
      
      // Priority 1: Use prop data if available
      if (propUserData && (propUserData.id || propUserData.uid)) {
        console.log('✅ Using propUserData:', propUserData.id || propUserData.uid);
        setCompleteUserData(normalizeUserData(propUserData));
        setLoading(false);
        return;
      }

      // Priority 2: Use currentUser if available
      if (currentUser && (currentUser.uid || currentUser.id)) {
        console.log('✅ Using currentUser:', currentUser.uid || currentUser.id);
        setCompleteUserData(normalizeUserData(currentUser));
        setLoading(false);
        return;
      }

      // Priority 3: Check AsyncStorage for cached user data
      console.log('🔍 Checking AsyncStorage for user data...');
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          console.log('✅ Found user in AsyncStorage:', parsedData.id || parsedData.uid);
          
          // Use cached data immediately
          setCompleteUserData(normalizeUserData(parsedData));
          setLoading(false);
          
          // Try to refresh from Firestore in background
          refreshUserDataFromFirestore(parsedData.id || parsedData.uid);
          return;
        }
      } catch (storageError) {
        console.warn('⚠️ AsyncStorage error:', storageError);
      }

      // Priority 4: Check for user ID in AsyncStorage
      console.log('🔍 Checking for userId in AsyncStorage...');
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          console.log('✅ Found userId in AsyncStorage:', userId);
          await fetchAndCacheUserData(userId);
          return;
        }
      } catch (error) {
        console.warn('⚠️ Error reading userId:', error);
      }

      // Priority 5: Wait for Firebase Auth
      console.log('⏳ Waiting for Firebase Auth...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const authUser = auth.currentUser;
      
      if (authUser) {
        console.log('✅ Auth user found:', authUser.uid);
        await fetchAndCacheUserData(authUser.uid);
        return;
      }

      // No user found
      console.error('❌ No authenticated user found');
      setLoading(false);
      Alert.alert(
        'Not Logged In',
        'Please log in to view and post alerts.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Error initializing user data:', error);
      setLoading(false);
    }
  };

  /**
   * Normalize user data to consistent format
   */
  const normalizeUserData = (data) => {
    const userId = data.id || data.uid || data.userId;
    
    return {
      userId: userId,
      uid: userId,
      id: userId,
      
      phone: data.phone || data.Phone || data.phoneNumber || null,
      Phone: data.phone || data.Phone || data.phoneNumber || null,
      phoneNumber: data.phone || data.Phone || data.phoneNumber || null,
      
      name: data.name || data.Name || data.firstName || 'User',
      Name: data.name || data.Name || data.firstName || 'User',
      firstName: data.name || data.Name || data.firstName || 'User',
      
      surname: data.surname || data.Surname || data.lastName || '',
      Surname: data.surname || data.Surname || data.lastName || '',
      lastName: data.surname || data.Surname || data.lastName || '',
      
      fullName: data.fullName || 
                `${data.name || data.Name || ''} ${data.surname || data.Surname || ''}`.trim() || 
                'User',
      
      avatar: data.avatar || data.ImageURL || data.imageUrl || data.photoURL || null,
      ImageURL: data.avatar || data.ImageURL || data.imageUrl || data.photoURL || null,
      imageUrl: data.avatar || data.ImageURL || data.imageUrl || data.photoURL || null,
      
      email: data.email || data.Email || null,
      Email: data.email || data.Email || null,
      
      ...data
    };
  };

  /**
   * Fetch user data from Firestore and cache it
   */
  const fetchAndCacheUserData = async (userId) => {
    try {
      console.log('📥 Fetching user data from Firestore for:', userId);
      
      const result = await FirebaseService.getUserById(userId);
      
      if (result.success && result.userData) {
        console.log('✅ Successfully fetched from Firestore:', {
          name: result.userData.Name,
          phone: result.userData.Phone,
          hasAvatar: !!result.userData.ImageURL
        });
        
        const userData = normalizeUserData(result.userData);
        
        // Cache in AsyncStorage
        try {
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          await AsyncStorage.setItem('userId', userId);
          console.log('💾 Cached user data in AsyncStorage');
        } catch (cacheError) {
          console.warn('⚠️ Failed to cache user data:', cacheError);
        }
        
        setCompleteUserData(userData);
        setLoading(false);
      } else {
        console.error('❌ Failed to fetch user from Firestore:', result.error);
        
        // Use auth user as fallback
        const authUser = auth.currentUser;
        if (authUser) {
          const fallbackData = normalizeUserData({
            id: authUser.uid,
            email: authUser.email,
            name: authUser.displayName || 'User',
            phone: authUser.phoneNumber,
            avatar: authUser.photoURL,
          });
          setCompleteUserData(fallbackData);
        }
        
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      setLoading(false);
    }
  };

  /**
   * Refresh user data from Firestore in background
   */
  const refreshUserDataFromFirestore = async (userId) => {
    try {
      console.log('🔄 Refreshing user data from Firestore...');
      const result = await FirebaseService.getUserById(userId);
      
      if (result.success && result.userData) {
        const userData = normalizeUserData(result.userData);
        setCompleteUserData(userData);
        
        // Update cache
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        console.log('✅ User data refreshed and cached');
      }
    } catch (error) {
      console.warn('⚠️ Failed to refresh user data:', error);
    }
  };

  const setupRealtimeListener = () => {
    console.log('👂 Setting up real-time alerts listener...');
    
    const unsubscribeFn = AlertFeedService.listenToAlertsFeed(
      {
        userLocation: userLocation,
        radius: 50,
        limitCount: 50
      },
      (result) => {
        if (result.success) {
          console.log(`✅ Received ${result.alerts.length} alerts`);
          setFeedData(result.alerts);
        } else {
          console.error('❌ Listener error:', result.error);
        }
      }
    );
    
    setUnsubscribe(() => unsubscribeFn);
  };

  const getCurrentUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Location permission denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(coords);
      console.log('📍 Location obtained');
      
    } catch (error) {
      console.error('❌ Error getting location:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await AlertFeedService.getAlertsFeed({
        userLocation: userLocation,
        radius: 50,
        limitCount: 20
      });
      
      if (result.success) {
        setFeedData(result.alerts);
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [userLocation]);

  const handleAddPost = (newPostData) => {
    console.log('✅ Alert posted!');
  };

  const getUserId = () => {
    return completeUserData?.userId || 
           completeUserData?.uid || 
           completeUserData?.id;
  };

  const handleLike = async (postId) => {
    const userId = getUserId();
    if (!userId) {
      Alert.alert('Error', 'Please log in to like posts');
      return;
    }

    try {
      const result = await AlertFeedService.toggleLike(postId, userId);
      if (result.success) {
        if (result.liked) {
          setShowLikeAnimation(prev => ({ ...prev, [postId]: true }));
        }
        
        setFeedData(prevData => 
          prevData.map(post => {
            if (post.id === postId) {
              const likedBy = post.likedBy || [];
              return {
                ...post,
                liked: result.liked,
                likes: result.liked ? post.likes + 1 : post.likes - 1,
                likedBy: result.liked
                  ? [...likedBy, userId]
                  : likedBy.filter(id => id !== userId)
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleLikeAnimationEnd = (postId) => {
    setShowLikeAnimation(prev => ({ ...prev, [postId]: false }));
  };

  const openCommentModal = async (post) => {
    try {
      const result = await AlertFeedService.getComments(post.id);
      if (result.success) {
        setSelectedPost({ ...post, comments: result.comments });
        setShowCommentModal(true);
      }
    } catch (error) {
      console.error('Error opening comments:', error);
    }
  };

  const closeCommentModal = () => {
    setShowCommentModal(false);
    setSelectedPost(null);
  };

  const handleAddComment = async (postId, newComment) => {
    const userId = getUserId();
    const userName = completeUserData?.fullName || completeUserData?.name || 'User';
    const userAvatar = completeUserData?.avatar || completeUserData?.ImageURL || null;

    if (!userId) {
      Alert.alert('Error', 'Please log in to comment');
      return;
    }

    try {
      const result = await AlertFeedService.addComment(postId, {
        text: newComment.text,
        userId: userId,
        userName: userName,
        userAvatar: userAvatar
      });

      if (result.success) {
        setFeedData(prevData =>
          prevData.map(post =>
            post.id === postId
              ? { ...post, commentCount: (post.commentCount || 0) + 1 }
              : post
          )
        );

        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(prev => ({
            ...prev,
            comments: [...(prev.comments || []), result.comment]
          }));
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

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
      closeMenuModal();
      openCommentModal(post);
    }
  };

  const handleShare = (postId) => {
    Alert.alert('Share', 'Share functionality');
    closeMenuModal();
  };

  const handleReport = async (postId) => {
    Alert.alert(
      'Report Post',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const userId = getUserId();
              await AlertFeedService.reportAlert(postId, {
                userId: userId,
                reason: 'inappropriate_content',
                description: 'User reported via mobile app'
              });
              Alert.alert('Reported', 'Thank you for your report.');
            } catch (error) {
              console.error('Error reporting:', error);
            }
            closeMenuModal();
          }
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const userId = getUserId();
    const isLiked = item.likedBy?.includes(userId) || false;

    return (
      <View style={styles.cardWrapper}>
        <FeedCard
          item={{
            ...item,
            liked: isLiked,
            name: item.userName || 'Anonymous',
            alertType: item.alertType || 'Alert',
            avatar: item.userAvatar ? { uri: item.userAvatar } : null,
            image: item.mediaType === 'image' && item.mediaUri ? { uri: item.mediaUri } : null,
            video: item.mediaType === 'video' && item.mediaUri ? { uri: item.mediaUri } : null,
            comments: item.comments || []
          }}
          userLocation={userLocation}
          onLike={handleLike}
          onComment={openCommentModal}
          onMenuPress={openMenuModal}
          showLikeAnimation={showLikeAnimation[item.id]}
          onLikeAnimationEnd={() => handleLikeAnimationEnd(item.id)}
        />
      </View>
    );
  };

  const AddButton = () => (
    <View style={[styles.addButtonContainer, { backgroundColor: colors.overlay }]}>
      <BlurView 
        intensity={70} 
        tint={isDark ? "dark" : "light"} 
        style={[styles.blurWrapper, {
          backgroundColor: colors.overlay,
          borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)',
        }]}
      >
        <TouchableOpacity
          onPress={() => {
            if (!completeUserData) {
              Alert.alert('Please Log In', 'You need to be logged in to post alerts');
              return;
            }
            setShowAddModal(true);
          }}
          activeOpacity={0.7}
          style={styles.addTouchable}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </BlurView>
    </View>
  );

  const modalProps = {
    visible: showAddModal,
    onClose: () => setShowAddModal(false),
    onAddPost: handleAddPost,
    userLocation: userLocation,
    userData: completeUserData || {}
  };

  // Debug log
  if (completeUserData) {
    console.log('✅ User data ready:', {
      userId: completeUserData.userId,
      name: completeUserData.name,
      hasAvatar: !!completeUserData.avatar
    });
  }

  if (loading) {
    return (
      <>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#ff5621" />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading alerts...
          </Text>
        </View>
        <AddAlertModal {...modalProps} />
      </>
    );
  }

  if (!completeUserData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Not Logged In
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Please log in to view and post alerts
        </Text>
      </View>
    );
  }

  if (feedData.length === 0) {
    return (
      <>
        <View style={[styles.container, styles.centered]}>
          <Ionicons name="megaphone-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No alerts nearby
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Be the first to post an alert in your area
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.emptyButtonText}>Post Alert</Text>
          </TouchableOpacity>
        </View>

        <AddAlertModal {...modalProps} />
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
      </>
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

      <AddAlertModal {...modalProps} />
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
  container: { flex: 1, backgroundColor: 'transparent' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 16, marginTop: 16 },
  emptyText: { fontSize: 20, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
  emptySubtext: { fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  emptyButton: { marginTop: 24, paddingHorizontal: 32, paddingVertical: 12, backgroundColor: '#ff5621', borderRadius: 24 },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  listContent: { paddingBottom: 100, paddingTop: 12, paddingHorizontal: 0 },
  cardWrapper: { marginHorizontal: 0, marginVertical: 1, borderRadius: 0, backgroundColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.6, shadowRadius: 7, elevation: 16 },
  separator: { height: 8 },
  addButtonContainer: { position: 'absolute', bottom: 24, right: 15, width: 60, height: 60, borderRadius: 60, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10, zIndex: 999 },
  blurWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 30, borderWidth: 1 },
  addTouchable: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default FeedList;