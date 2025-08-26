// Enhanced NotificationBell.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  useColorScheme,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../contexts/NotificationContext';


const { width } = Dimensions.get('window');

const NotificationBell = ({ style, iconSize = 24, showProfileInfo = true }) => {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    acceptFriendRequest,
    declineFriendRequest,
    soundEnabled,
    toggleSoundEnabled,
  } = useNotifications();

  const [showModal, setShowModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);
  
  // Animation for badge
  const badgeAnim = useRef(new Animated.Value(1)).current;
  const bellAnim = useRef(new Animated.Value(0)).current;

  // Animate badge when unread count changes
  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.timing(badgeAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(badgeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Bell shake animation for new notifications
      Animated.sequence([
        Animated.timing(bellAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bellAnim, {
          toValue: -1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bellAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bellAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [unreadCount]);

  const handleNotificationPress = async (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    setSelectedNotification(notification);

    // Handle different notification types
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
        handleGenericNotification(notification);
    }
  };

  const handleFriendRequestNotification = (notification) => {
    const { requestId, senderName, senderSurname } = notification.data || {};
    
    Alert.alert(
      'Friend Request',
      `${senderName || 'Someone'} ${senderSurname || ''} wants to connect with you`,
      [
        {
          text: 'Decline',
          style: 'cancel',
          onPress: () => handleDeclineFriendRequest(requestId, notification)
        },
        {
          text: 'Accept',
          onPress: () => handleAcceptFriendRequest(requestId, notification)
        }
      ]
    );
  };

  const handleFriendAcceptedNotification = (notification) => {
    const { accepterName, accepterSurname } = notification.data || {};
    
    Alert.alert(
      'Friend Request Accepted! 🎉',
      `${accepterName || 'Someone'} ${accepterSurname || ''} accepted your friend request. You are now connected!`,
      [{ text: 'Great!', style: 'default' }]
    );
  };

  const handleSOSNotification = (notification) => {
    const { senderName, senderSurname, location } = notification.data || {};
    
    Alert.alert(
      '🚨 EMERGENCY ALERT',
      `${senderName || 'Someone'} ${senderSurname || ''} sent an SOS alert${location ? ` from ${location}` : ''}`,
      [
        { text: 'Dismiss', style: 'cancel' },
        { 
          text: 'Call Emergency', 
          style: 'destructive',
          onPress: () => console.log('Call emergency services') 
        },
        { 
          text: 'View Location', 
          onPress: () => console.log('View location on map') 
        }
      ]
    );
  };

  const handleGenericNotification = (notification) => {
    Alert.alert(
      notification.title || 'Notification',
      notification.message,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleAcceptFriendRequest = async (requestId, notification) => {
    try {
      const result = await acceptFriendRequest(requestId);
      if (result.success) {
        Alert.alert('Success! 🎉', result.message || 'Friend request accepted!');
      } else {
        Alert.alert('Error', result.error || 'Failed to accept friend request');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleDeclineFriendRequest = async (requestId, notification) => {
    try {
      const result = await declineFriendRequest(requestId);
      if (!result.success && result.error) {
        Alert.alert('Error', result.error);
      }
      // No success message for decline to keep it subtle
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead();
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to mark notifications as read');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Now';
    
    const now = Date.now();
    const time = timestamp.toMillis ? timestamp.toMillis() : timestamp;
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return new Date(time).toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend_request':
        return 'person-add';
      case 'friend_accepted':
        return 'checkmark-circle';
      case 'sos':
        return 'warning';
      case 'message':
        return 'chatbubble';
      default:
        return 'notifications';
    }
  };

  const getNotificationIconColor = (type) => {
    switch (type) {
      case 'friend_request':
        return '#007AFF';
      case 'friend_accepted':
        return '#4CAF50';
      case 'sos':
        return '#FF3B30';
      case 'message':
        return '#FF9500';
      default:
        return isDark ? '#8E8E93' : '#6D6D70';
    }
  };

  const renderProfilePicture = (profilePicture, senderName, size = 40) => {
    if (profilePicture) {
      return (
        <Image
          source={{ uri: profilePicture }}
          style={[styles.profilePicture, { width: size, height: size, borderRadius: size / 2 }]}
          defaultSource={require('../images/default-avatar.jpg')}
        />
      );
    } else {
      const initial = senderName ? senderName.charAt(0).toUpperCase() : 'U';
      return (
        <View style={[
          styles.defaultProfilePicture, 
          { width: size, height: size, borderRadius: size / 2 }
        ]}>
          <Text style={[styles.profileInitial, { fontSize: size * 0.4 }]}>
            {initial}
          </Text>
        </View>
      );
    }
  };

  const renderNotificationItem = ({ item: notification }) => {
    const isUnread = !notification.read;
    const timeAgo = getTimeAgo(notification.createdAt);
    const { senderName, senderSurname, profilePicture } = notification.data || {};
    const displayName = `${senderName || 'Unknown'} ${senderSurname || ''}`.trim();
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          isUnread && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          {/* Profile Section */}
          {showProfileInfo && (
            <View style={styles.profileSection}>
              {renderProfilePicture(profilePicture, senderName)}
            </View>
          )}
          
          {/* Content Section */}
          <View style={styles.contentSection}>
            <View style={styles.headerRow}>
              <View style={styles.titleSection}>
                {showProfileInfo && displayName !== 'Unknown' && (
                  <Text style={[styles.senderName, isUnread && styles.unreadText]}>
                    {displayName}
                  </Text>
                )}
                <Text style={[
                  styles.notificationTitle,
                  isUnread && styles.unreadText,
                  !showProfileInfo && styles.noProfileTitle
                ]}>
                  {notification.title}
                </Text>
              </View>
              
              <View style={styles.metaSection}>
                <Text style={styles.timeText}>{timeAgo}</Text>
                {isUnread && <View style={styles.unreadDot} />}
              </View>
            </View>
            
            <Text style={[
              styles.notificationMessage,
              isUnread && styles.unreadMessageText
            ]}>
              {notification.message}
            </Text>
          </View>
          
          {/* Icon Section */}
          <View style={styles.iconSection}>
            <Ionicons 
              name={getNotificationIcon(notification.type)} 
              size={20} 
              color={getNotificationIconColor(notification.type)} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons 
          name="notifications-outline" 
          size={64} 
          color={isDark ? '#48484A' : '#C7C7CC'} 
        />
      </View>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>
        You'll see friend requests, alerts, and messages here
      </Text>
    </View>
  );

  return (
    <>
      {/* Notification Bell Button */}
      <Animated.View style={{ transform: [{ rotate: bellAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-5deg', '5deg']
      }) }] }}>
        <TouchableOpacity
          style={[styles.bellContainer, style]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={unreadCount > 0 ? "notifications" : "notifications-outline"} 
            size={iconSize} 
            color={isDark ? '#FFFFFF' : '#000000'} 
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
      </Animated.View>

      {/* Notification Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.modalTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.headerRight}>
              {/* Sound Toggle */}
              <TouchableOpacity
                onPress={() => toggleSoundEnabled(!soundEnabled)}
                style={styles.soundButton}
              >
                <Ionicons 
                  name={soundEnabled ? "volume-high" : "volume-mute"} 
                  size={20} 
                  color={isDark ? '#8E8E93' : '#6D6D70'} 
                />
              </TouchableOpacity>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={handleMarkAllAsRead}
                  style={styles.markAllButton}
                >
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}

       
              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
          </View>

          

          {/* Notification List */}
          {notifications.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.notificationList}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </Modal>
    </>
  );
};

const getStyles = (isDark) =>
  StyleSheet.create({
    bellContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    badge: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: '#FF3B30',
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      borderWidth: 2,
      borderColor: isDark ? '#000000' : '#FFFFFF',
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: isDark ? '#000000' : '#F2F2F7',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      paddingTop: 60,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? '#38383A' : '#C6C6C8',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    modalTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#000000',
    },
    unreadBadge: {
      backgroundColor: '#FF3B30',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginLeft: 12,
    },
    unreadBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    soundButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    markAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#007AFF',
      borderRadius: 8,
    },
    markAllText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    closeButton: {
      padding: 4,
    },
    notificationList: {
      flex: 1,
    },
    listContent: {
      paddingVertical: 8,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDark ? '#38383A' : '#C6C6C8',
      marginLeft: 72,
    },
    notificationItem: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      paddingVertical: 12,
    },
    unreadNotification: {
      backgroundColor: isDark ? '#1A1A1C' : '#F0F8FF',
    },
    notificationContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
    },
    profileSection: {
      marginRight: 12,
    },
    profilePicture: {
      borderWidth: 2,
      borderColor: isDark ? '#38383A' : '#E5E5EA',
    },
    defaultProfilePicture: {
      backgroundColor: isDark ? '#48484A' : '#E5E5EA',
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileInitial: {
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
    },
    contentSection: {
      flex: 1,
      marginRight: 8,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    titleSection: {
      flex: 1,
    },
    senderName: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 1,
    },
    notificationTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#EBEBF5' : '#3C3C43',
    },
    noProfileTitle: {
      fontSize: 15,
      fontWeight: '600',
    },
    unreadText: {
      color: '#007AFF',
    },
    metaSection: {
      alignItems: 'flex-end',
    },
    timeText: {
      fontSize: 12,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginBottom: 2,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#007AFF',
    },
    notificationMessage: {
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#6D6D70',
      lineHeight: 18,
    },
    unreadMessageText: {
      color: isDark ? '#EBEBF5' : '#3C3C43',
    },
    iconSection: {
      paddingTop: 2,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingBottom: 100,
    },
    emptyIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 16,
      color: isDark ? '#8E8E93' : '#8E8E93',
      textAlign: 'center',
      lineHeight: 22,
    },
  });

export default NotificationBell;