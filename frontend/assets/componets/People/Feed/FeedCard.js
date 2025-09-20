// components/FeedCard.js
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import LikeAnimation from './LikeAnimation'
import { formatLikes, formatDistance, calculateDistance } from '../../../../utilities/helpers'

const FeedCard = ({ 
  item, 
  userLocation, 
  onLike, 
  onComment, 
  onMenuPress,
  showLikeAnimation,
  onLikeAnimationEnd
}) => {
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
        onPress={() => onLike(item.id)}
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
          show={showLikeAnimation}
          onAnimationEnd={onLikeAnimationEnd}
        />
      </Pressable>

      <View style={styles.footerAligned}>
        <View style={styles.engagement}>
          <TouchableOpacity 
            onPress={() => onLike(item.id)}
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
            onPress={() => onComment(item)}
          >
            <Ionicons name="chatbubble-ellipses" size={16} color={iconColor} />
          </TouchableOpacity>
          <Text style={[styles.engageText, { color: textColor }]}>
            {item.comments?.length || 0}
          </Text>
        </View>

        <Text style={[styles.locationText, { color: textColor }]}>{distanceText}</Text>

        <TouchableOpacity style={styles.dotsIcon} onPress={() => onMenuPress(item)}>
          <Ionicons name="ellipsis-vertical" size={16} color={iconColor} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
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
  anonymousAvatar: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default FeedCard;