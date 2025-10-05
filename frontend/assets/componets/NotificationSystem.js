// Enhanced NotificationSystem.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  useColorScheme,
  Alert,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av'; // For sound notifications
import { FirebaseService } from '../../backend/Firebase/FirebaseService';

const { width, height } = Dimensions.get('window');

const NotificationSystem = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userData, setUserData] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [currentSlideNotification, setCurrentSlideNotification] = useState(null);
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const badgeAnim = useRef(new Animated.Value(1)).current;

  // Sound reference
  const soundObject = useRef(new Audio.Sound());

  // Unsubscribe functions
  const unsubscribeNotifications = useRef(null);
  const unsubscribeFriendRequests = useRef(null);

  // Load notification sound
  useEffect(() => {
    loadNotificationSound();
    return () => {
      soundObject.current.unloadAsync();
    };
  }, []);

  const loadNotificationSound = async () => {
    try {
      await soundObject.current.loadAsync(
        // You can replace this with your custom notification sound
        require('../../assets/sounds/notification.mp3') // Add your sound file
      );
    } catch (error) {
      console.log('Error loading sound:', error);
    }
  };

  const playNotificationSound = async () => {
    try {
      const status = await soundObject.current.getStatusAsync();
      if (status.isLoaded) {
        await soundObject.current.replayAsync();
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  // Load user data and set up listeners
  useEffect(() => {
    const initializeNotificationSystem = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('userData');
        if (jsonValue) {
          const data = JSON.parse(jsonValue);
          setUserData(data);
          
          if (data.phone || data.phoneNumber) {
            const userPhone = data.phone || data.phoneNumber;
            console.log('🔔 Setting up notification listeners for:', userPhone);
            
            unsubscribeNotifications.current = FirebaseService.listenToNotifications(
              userPhone,
              handleNotificationUpdate
            );
            
            unsubscribeFriendRequests.current = FirebaseService.listenToFriendRequests(
              userPhone,
              handleFriendRequestUpdate
            );
          }
        }
      } catch (error) {
        console.error('Error initializing notification system:', error);
      }
    };
    
    initializeNotificationSystem();
    
    return () => {
      if (unsubscribeNotifications.current) {
        unsubscribeNotifications.current();
      }
      if (unsubscribeFriendRequests.current) {
        unsubscribeFriendRequests.current();
      }
    };
  }, []);

  // Handle notification updates
  const handleNotificationUpdate = (data) => {
    const { notifications: newNotifications, changes, unreadCount: newUnreadCount, error } = data;
    
    if (error) {
      console.error('Notification listener error:', error);
      return;
    }
    
    setNotifications(newNotifications);
    setUnreadCount(newUnreadCount);
    
    // Handle new notifications with enhanced animations and sound
    changes.forEach(change => {
      if (change.type === 'new') {
        showEnhancedSlideNotification(change.notification);
        animateBadge();
        playNotificationSound();
      }
    });
  };

  // Handle friend request updates
  const handleFriendRequestUpdate = (requests) => {
    setFriendRequests(requests);
  };

  // Enhanced display name extraction with proper Firestore field mapping
// Enhanced display name extraction with proper Firestore field mapping
const getDisplayName = (notification) => {
  const { data = {}, type } = notification;
  
  // For friend_accepted notifications, look for accepter data
  if (type === 'friend_accepted') {
    const firstName = data.accepterUserData?.Name || 
                     data.accepterName?.split(' ')[0] ||
                     'Unknown';
                     
    const lastName = data.accepterUserData?.Surname || 
                    data.accepterName?.split(' ')[1] ||
                    '';
    
    const displayName = `${firstName} ${lastName}`.trim();
    
    console.log('Extracted accepter name:', {
      firstName,
      lastName,
      displayName,
      availableFields: Object.keys(data)
    });
    
    return displayName !== 'Unknown' ? displayName : 'AlertNet User';
  }
  
  // For friend_request and other notifications, look for sender data
  const firstName = data.senderName || 
                   data.senderFirstName || 
                   data.senderUserData?.Name ||
                   'Unknown';
                   
  const lastName = data.senderSurname || 
                  data.senderLastName || 
                  data.senderUserData?.Surname ||
                  '';
  
  const displayName = `${firstName} ${lastName}`.trim();
  
  console.log('Extracted sender name:', {
    firstName,
    lastName,
    displayName,
    availableFields: Object.keys(data)
  });
  
  return displayName !== 'Unknown' ? displayName : 'AlertNet User';
};

  // Enhanced slide-down notification with profile info
  const showEnhancedSlideNotification = (notification) => {
    setCurrentSlideNotification(notification);
    
    // Reset animations
    slideAnim.setValue(-150);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    
    // Show notification with enhanced animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: Platform.OS === 'ios' ? 50 : 20,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(4000), // Show for 4 seconds
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -150,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setCurrentSlideNotification(null);
    });
  };

  // Animate notification badge
  const animateBadge = () => {
    Animated.sequence([
      Animated.timing(badgeAnim, {
        toValue: 1.4,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle slide notification tap
  const handleSlideNotificationTap = () => {
    if (currentSlideNotification) {
      // Hide the slide notification
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -150,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentSlideNotification(null);
      });
      
      // Handle the notification
      handleNotificationTap(currentSlideNotification);
    }
  };

  // Handle slide notification action (Accept/Decline)
  const handleSlideNotificationAction = async (action) => {
    if (!currentSlideNotification) return;
    
    const notification = currentSlideNotification;
    
    // Hide the slide notification
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentSlideNotification(null);
    });
    
    if (action === 'accept') {
      await handleAcceptFriendRequest(notification.data.requestId);
    } else if (action === 'decline') {
      await handleDeclineFriendRequest(notification.data.requestId);
    }
  };

  // Handle notification tap
  const handleNotificationTap = async (notification) => {
    await FirebaseService.markNotificationAsRead(notification.id);
    
    switch (notification.type) {
      case 'friend_request':
        handleFriendRequestNotification(notification);
        break;
      case 'friend_accepted':
        handleFriendAcceptedNotification(notification);
        break;
      case 'sos':
        handleSOSNotification(notification);
        break;
      default:
        console.log('Unknown notification type:', notification.type);
    }
  };

  // Handle friend request notification
  const handleFriendRequestNotification = (notification) => {
    const displayName = getDisplayName(notification);
    const { requestId } = notification.data;
    
    Alert.alert(
      'Friend Request',
      `${displayName} wants to connect with you on AlertNet`,
      [
        {
          text: 'Decline',
          style: 'cancel',
          onPress: () => handleDeclineFriendRequest(requestId)
        },
        {
          text: 'Accept',
          onPress: () => handleAcceptFriendRequest(requestId)
        }
      ]
    );
  };

  // Handle friend accepted notification
  const handleFriendAcceptedNotification = (notification) => {
    const displayName = getDisplayName(notification);
    
    Alert.alert(
      'Friend Request Accepted!',
      `${displayName} accepted your friend request. You are now connected!`,
      [{ text: 'Great!', style: 'default' }]
    );
  };

  // Handle SOS notification
  const handleSOSNotification = (notification) => {
    Alert.alert(
      'EMERGENCY ALERT',
      notification.message,
      [
        {
          text: 'Dismiss',
          style: 'cancel'
        },
        {
          text: 'Call Emergency',
          onPress: () => {
            console.log('Emergency call initiated');
          }
        }
      ]
    );
  };

  // Accept friend request
  const handleAcceptFriendRequest = async (requestId) => {
    try {
      const userPhone = userData?.phone || userData?.phoneNumber;
      if (!userPhone) {
        Alert.alert('Error', 'User phone number not found');
        return;
      }

      const result = await FirebaseService.acceptFriendRequest(requestId, userPhone);
      
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.error || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  // Decline friend request
  const handleDeclineFriendRequest = async (requestId) => {
    try {
      const userPhone = userData?.phone || userData?.phoneNumber;
      if (!userPhone) {
        Alert.alert('Error', 'User phone number not found');
        return;
      }

      const result = await FirebaseService.declineFriendRequest(requestId, userPhone);
      
      if (result.success) {
        console.log('Friend request declined');
      } else {
        Alert.alert('Error', result.error || 'Failed to decline friend request');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const userPhone = userData?.phone || userData?.phoneNumber;
      if (!userPhone) return;

      const result = await FirebaseService.markAllNotificationsAsRead(userPhone);
      if (result.success) {
        console.log(`Marked ${result.updatedCount} notifications as read`);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Enhanced profile picture rendering with proper fallbacks for Firestore data structure
  const renderProfilePicture = (notification, size = 44) => {
    const { data = {}, type } = notification;
    
    // For friend_accepted notifications, look for accepter's profile picture
    let profilePicture;
    let senderName;
    
    if (type === 'friend_accepted') {
      profilePicture = data.accepterUserData?.ImageURL ||
                      data.accepterUserData?.imageUrl ||
                      null;
      
      senderName = data.accepterUserData?.Name ||
                  data.accepterName?.split(' ')[0] ||
                  'U';
    } else {
      // For other notifications, look for sender's profile picture
      profilePicture = data.profilePicture || 
                      data.senderUserData?.ImageURL ||
                      data.senderUserData?.imageUrl ||
                      data.ImageURL ||
                      data.imageUrl ||
                      null;
      
      senderName = data.senderName || 
                  data.senderFirstName ||
                  data.senderUserData?.Name ||
                  'U';
    }
    
    console.log('Rendering profile picture:', {
      notificationType: type,
      profilePicture: profilePicture ? 'URL present' : 'null',
      senderName
    });
    
    if (profilePicture && profilePicture.trim() !== '') {
      return (
        <Image
          source={{ uri: profilePicture }}
          style={[styles.profilePicture, { width: size, height: size, borderRadius: size / 2 }]}
          onError={(error) => {
            console.log('Profile picture failed to load:', error.nativeEvent.error);
          }}
        />
      );
    } else {
      const initial = senderName ? senderName.charAt(0).toUpperCase() : 'U';
      return (
        <View style={[styles.defaultProfilePicture, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.profileInitial, { fontSize: size * 0.4 }]}>
            {initial}
          </Text>
        </View>
      );
    }
  };

  // Enhanced slide-down notification banner
  const renderSlideNotification = () => {
    if (!currentSlideNotification) return null;
  
    const notification = currentSlideNotification;
    const displayName = getDisplayName(notification);
    const isConnectionRequest = notification.type === 'friend_request';
    
    console.log('Rendering slide notification:', {
      displayName,
      notificationType: notification.type,
      message: notification.message,
      hasProfilePicture: !!(notification.data?.profilePicture || notification.data?.senderUserData?.ImageURL)
    });
  
    return (
      <Animated.View
        style={[
          styles.enhancedNotificationBanner,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ],
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.notificationContent}
          onPress={handleSlideNotificationTap}
          activeOpacity={0.9}
        >
          <View style={styles.notificationHeader}>
            {/* Profile Picture */}
            <View style={styles.profileSection}>
              {renderProfilePicture(notification, 44)}
              <View style={styles.nameSection}>
                <Text style={styles.senderName}>
                  {displayName}
                </Text>
                <Text style={styles.notificationSubtitle}>
                  {notification.message}
                </Text>
              </View>
            </View>
            
            {/* Notification Type Icon */}
            <View style={styles.typeIconContainer}>
              {getNotificationTypeIcon(notification.type)}
            </View>
          </View>
          
          {/* Action Buttons for Connection Requests */}
          {isConnectionRequest && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleSlideNotificationAction('decline')}
              >
                <Ionicons name="close" size={16} color="#FF3B30" />
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleSlideNotificationAction('accept')}
              >
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Get notification type icon
  const getNotificationTypeIcon = (type) => {
    const iconColor = '#007AFF';
    
    switch (type) {
      case 'friend_request':
        return <Ionicons name="person-add" size={20} color={iconColor} />;
      case 'friend_accepted':
        return <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />;
      case 'sos':
        return <Ionicons name="warning" size={20} color="#FF3B30" />;
      default:
        return <Ionicons name="notifications" size={20} color={iconColor} />;
    }
  };

  // Enhanced notification item rendering for the notification list
  const renderNotificationItem = ({ item: notification }) => {
    const isUnread = !notification.read;
    const timeAgo = getTimeAgo(notification.createdAt);
    const displayName = getDisplayName(notification);
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          isUnread && styles.unreadNotification
        ]}
        onPress={() => handleNotificationTap(notification)}
      >
        <View style={styles.listItemContent}>
          {/* Profile Picture */}
          <View style={styles.listProfileSection}>
            {renderProfilePicture(notification, 40)}
          </View>
          
          <View style={styles.listTextContent}>
            <View style={styles.listNotificationHeader}>
              <Text style={[
                styles.listNotificationTitle,
                isUnread && styles.unreadText
              ]}>
                {displayName}
              </Text>
              <Text style={styles.notificationTime}>{timeAgo}</Text>
            </View>
            
            <Text style={[
              styles.listNotificationMessage,
              isUnread && styles.unreadMessageText
            ]}>
              {notification.message}
            </Text>
            
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          
          <View style={styles.listNotificationIcon}>
            {getNotificationTypeIcon(notification.type)}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Get time ago string
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Now';
    
    const now = Date.now();
    const time = timestamp.toMillis ? timestamp.toMillis() : timestamp;
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Render notification panel
  const renderNotificationPanel = () => {
    if (!showNotifications) return null;
    
    return (
      <View style={styles.notificationPanel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Notifications</Text>
          <View style={styles.panelActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={markAllAsRead}
                style={styles.markAllButton}
              >
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setShowNotifications(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={isDark ? '#fff' : '#333'} />
            </TouchableOpacity>
          </View>
        </View>
        
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name="notifications-outline" 
              size={64} 
              color={isDark ? '#666' : '#ccc'} 
            />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.notificationList}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {children}
      
      {/* Notification Button */}
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={() => setShowNotifications(true)}
      >
        <Ionicons 
          name="notifications" 
          size={24} 
          color={isDark ? '#fff' : '#333'} 
        />
        {unreadCount > 0 && (
          <Animated.View 
            style={[
              styles.badge,
              { transform: [{ scale: badgeAnim }] }
            ]}
          >
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Enhanced Slide-down notification banner */}
      {renderSlideNotification()}

      {/* Notification Panel */}
      {renderNotificationPanel()}
    </View>
  );
};

const getStyles = (isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    notificationButton: {
      position: 'absolute',
      top: 60,
      right: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    },
    badge: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: '#FF3B30',
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    // Enhanced notification banner styles
    enhancedNotificationBanner: {
      position: 'absolute',
      top: 0,
      left: 16,
      right: 16,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
      borderWidth: 1,
      borderColor: isDark ? '#2C2C2E' : '#E5E5E7',
    },
    notificationContent: {
      padding: 16,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    profileSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    profilePicture: {
      marginRight: 12,
      borderWidth: 2,
      borderColor: isDark ? '#2C2C2E' : '#E5E5E7',
    },
    defaultProfilePicture: {
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5E7',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    profileInitial: {
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#333',
    },
    nameSection: {
      flex: 1,
    },
    senderName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
      marginBottom: 2,
    },
    notificationSubtitle: {
      fontSize: 14,
      color: isDark ? '#999' : '#666',
    },
    typeIconContainer: {
      marginLeft: 12,
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    acceptButton: {
      backgroundColor: '#007AFF',
      flex: 1,
      justifyContent: 'center',
    },
    declineButton: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderWidth: 1,
      borderColor: '#FF3B30',
      flex: 1,
      justifyContent: 'center',
    },
    acceptButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '500',
    },
    declineButtonText: {
      color: '#FF3B30',
      fontSize: 14,
      fontWeight: '500',
    },
    // Notification panel styles
    notificationPanel: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDark ? '#000000EE' : '#FFFFFFEE',
      zIndex: 999,
    },
    panelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 60,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#E5E5E7',
    },
    panelTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#333',
    },
    panelActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    markAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#007AFF',
      borderRadius: 8,
    },
    markAllText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '500',
    },
    closeButton: {
      padding: 8,
    },
    notificationList: {
      flex: 1,
      padding: 20,
    },
    // Notification list item styles
    notificationItem: {
      backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
    },
    unreadNotification: {
      backgroundColor: isDark ? '#2C2C2E' : '#E3F2FD',
      borderLeftWidth: 4,
      borderLeftColor: '#007AFF',
    },
    listItemContent: {
      flexDirection: 'row',
      padding: 16,
      alignItems: 'flex-start',
    },
    listProfileSection: {
      marginRight: 12,
    },
    listTextContent: {
      flex: 1,
      marginRight: 12,
    },
    listNotificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    listNotificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
      flex: 1,
    },
    unreadText: {
      color: '#007AFF',
    },
    notificationTime: {
      fontSize: 12,
      color: isDark ? '#999' : '#666',
      marginLeft: 8,
    },
    listNotificationMessage: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
      lineHeight: 20,
    },
    unreadMessageText: {
      color: isDark ? '#fff' : '#333',
    },
    unreadDot: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#007AFF',
    },
    listNotificationIcon: {
      marginTop: 2,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 100,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#666' : '#999',
      marginTop: 16,
    },
  });

export default NotificationSystem;