import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Image, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const InAppNotificationPopup = ({ notification, onDismiss, onNavigate, onViewLocation, onOpenChat, onAcceptFriendRequest, onDeclineFriendRequest }) => {
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const isFriendRequest = notification?.type === 'friend_request';

  useEffect(() => {
    // Animate in
    Animated.timing(slideAnim, {
      toValue: 50, // Position from the top, adjust for status bar
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after a delay
    const timer = setTimeout(() => {
      handleDismiss();
    }, 7000); // 7 seconds

    return () => clearTimeout(timer);
  }, [notification]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const handleMainPress = () => {
    handleDismiss();
    // Give it a moment to animate out before navigating
    setTimeout(() => {
        onNavigate();
    }, 300);
  };

  const handleOpenChatPress = (e) => {
    e.stopPropagation(); // Prevent the main press from firing
    if (onOpenChat && notification) {
      // The `onOpenChat` function in Home.js expects an object with specific properties.
      // We need to construct this object from the notification data.
      const chatPersonData = {
        senderId: notification.data?.senderId || notification.senderId,
        id: notification.data?.senderId || notification.senderId, // Ensure 'id' is present
        name: notification.data?.senderName || notification.senderName,
        phone: notification.data?.senderPhone,
        profilePicture: notification.data?.profilePicture || notification.profilePicture,
        data: notification.data, // Pass along the rest of the data
      };
      onOpenChat(chatPersonData);
    }
    handleDismiss();
  };

  const handleViewLocationPress = (e) => {
    e.stopPropagation(); // Prevent the main press from firing
    if (onViewLocation && notification.data?.location) {
      // The `handleViewLocation` function in Home.js expects an object with top-level
      // properties like `location`, `name`, `phone`, and `senderId`.
      // The raw notification object has these nested inside `data`.
      // We create a new object that matches the expected structure.
      const viewableData = {
        location: notification.data.location,
        name: notification.data.senderName,
        phone: notification.data.senderPhone,
        senderId: notification.data.senderId,
        profilePicture: notification.data.profilePicture || notification.profilePicture,
      };
      onViewLocation(viewableData);
    }
    handleDismiss();
  };

  const handleAccept = async (e) => {
    e.stopPropagation();
    if (notification?.data?.requestId && onAcceptFriendRequest) {  // ✅
      const result = await onAcceptFriendRequest(notification.data.requestId);
    }
  };

  const handleDecline = async (e) => {
    e.stopPropagation(); // Prevent the main press from firing
    if (notification?.requestId && onDeclineFriendRequest) {
      await onDeclineFriendRequest(notification.requestId);
      // No need for an alert on decline
      handleDismiss();
    }
  };
  const getIconInfo = (type) => {
    switch (type) {
      case 'sos':
        return { name: 'alert-circle', color: '#FF4444' };
      case 'friend_request':
        return { name: 'account-plus', color: '#3498db' };
      case 'friend_accepted':
        return { name: 'account-check', color: '#2ecc71' };
      case 'chat_message':
        return { name: 'chat-processing-outline', color: '#FF6B35' };
      default:
        return { name: 'bell', color: '#FF6B35' };
    }
  };

  if (!notification) return null;

  const iconInfo = getIconInfo(notification.type);
  
  // ENHANCED: Try multiple sources for profile picture
  const profilePicture = notification.profilePicture || 
                         notification.data?.profilePicture || 
                         null;
  
  // console.log($&);
  
  const senderName = notification.senderName || 
                     notification.data?.senderName || 
                     '';
                     
  const hasLocation = notification.type === 'sos' && (notification.data?.location || notification.location);
  const isChatMessage = notification.type === 'chat_message';
  const message = isChatMessage ? notification.message : `${senderName} ${notification.message}`.trim();

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity style={styles.touchable} onPress={handleMainPress} activeOpacity={0.8}>
        {profilePicture ? (
          <Image 
            source={{ uri: profilePicture }} 
            style={styles.profilePicture}
            onError={(error) => {
              // console.log($&);
            }}
            onLoad={() => {
              // console.log($&);
            }}
          />
        ) : (
          <View style={styles.iconContainer}>
            <Icon name={iconInfo.name} size={24} color={iconInfo.color} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.message} numberOfLines={hasLocation || isChatMessage ? 1 : 2}>{message}</Text>
          {hasLocation && (
            <TouchableOpacity style={styles.locationButton} onPress={handleViewLocationPress}>
              <Icon name="map-marker-outline" size={14} color="#3498db" />
              <Text style={styles.locationButtonText}>View Location</Text>
            </TouchableOpacity>
          )}
          {isChatMessage && onOpenChat && (
            <TouchableOpacity style={styles.chatButton} onPress={handleOpenChatPress}>
              <Icon name="message-reply-text-outline" size={14} color="#FF6B35" />
              <Text style={styles.chatButtonText}>Open Chat</Text>
            </TouchableOpacity>
          )}
          {isFriendRequest && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={[styles.actionButton, styles.declineButton]} onPress={handleDecline}>
                <Text style={styles.actionButtonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={handleAccept}>
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <Icon name="close" size={20} color="#aaa" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
    container: { position: 'absolute', top: 0, left: 20, right: 20, zIndex: 9999, backgroundColor: '#2C2C2E', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
    touchable: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    profilePicture: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 12,
      backgroundColor: '#444',
    },
    iconContainer: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    textContainer: { flex: 1 },
    title: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
    message: { color: '#E0E0E0', fontSize: 13, marginTop: 2 },
    closeButton: { marginLeft: 12, padding: 5 },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: 'rgba(52, 152, 219, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    locationButtonText: { color: '#3498db', fontSize: 12, fontWeight: '600', marginLeft: 4 },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    chatButtonText: {
        color: '#FF6B35', fontSize: 12, fontWeight: '600', marginLeft: 4
    },
    // Styles for Accept/Decline buttons
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        gap: 10,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: '#007AFF',
    },
    declineButton: {
        backgroundColor: '#444',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
});

export default InAppNotificationPopup;