import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  useColorScheme,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Video } from 'expo-av';

const initialFeedData = [
  {
    id: '1',
    name: 'Amahle Mdletshe',
    alertType: 'Fire Alert',
    location: 'Near You',
    description:
      "There's a fire at UJ APK just behind student centre. Please avoid the area!",
    likes: 1013,
    comments: 50,
    image: require('../images/fire.jpg'),
    avatar: require('../images/Kuhle.jpg'),
  },
  {
    id: '2',
    name: 'Angel Kiana',
    alertType: 'Safety & Crime',
    location: '600 m',
    description: 'Someone just got their phone snatched, near Richmond Corner',
    likes: 67,
    comments: 13,
    image: require('../images/richmond.jpg'),
    avatar: require('../images/Cheyenne.jpg'),
  },
  {
    id: '3',
    name: 'Kemal Smith',
    alertType: 'Utility Issue',
    location: '1.2 km',
    description: 'Burst water pipe near UJ APB. Authorities notified.',
    likes: 321,
    comments: 8,
    video: require('../images/waterburst.mp4'),
    avatar: require('../images/kemal.jpg'),
  },
];

const FeedList = () => {
  const isDark = useColorScheme() === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [feedData, setFeedData] = useState(initialFeedData);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      // Simulate fetch or refresh logic
      setFeedData([...initialFeedData]); // In real app, fetch new data here
      setRefreshing(false);
    }, 1500);
  }, []);

  const formatLikes = (likes) => {
    return likes > 999 ? `${Math.floor(likes / 1000)}k` : likes;
  };

  const renderItem = ({ item }) => {
    const isNear = item.location === 'Near You';
    const textColor = isNear ? '#fff' : '#000';
    const subTextColor = isNear ? '#f0f0f0' : '#666';
    const iconColor = isNear ? '#fff' : '#333';

    return (
      <View style={[styles.card, { backgroundColor: isNear ? '#ff5621' : '#fff' }]}>
        <View style={styles.headerRow}>
          <Image source={item.avatar} style={styles.avatar} />
          <View>
            <Text style={[styles.name, { color: textColor }]}>{item.name}</Text>
            <Text style={[styles.subText, { color: subTextColor }]}>{item.alertType}</Text>
          </View>
        </View>

        <Text style={[styles.description, { color: textColor }]}>{item.description}</Text>

        <View style={styles.mediaWrapper}>
          {item.image && (
            <>
              <Image source={item.image} style={styles.previewImage} />
              <Ionicons name="image-outline" size={20} color="#fff" style={styles.mediaIcon} />
            </>
          )}
          {item.video && (
            <>
              <Video
                source={item.video}
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
        </View>

        <View style={styles.footerAligned}>
          <View style={styles.engagement}>
            <Ionicons name="heart" size={16} color={iconColor} />
            <Text style={[styles.engageText, { color: textColor }]}>
              {formatLikes(item.likes)}
            </Text>

            <TouchableOpacity style={{ marginLeft: 12 }} onPress={() => console.log('Comment')}>
              <Ionicons name="chatbubble-ellipses" size={16} color={iconColor} />
            </TouchableOpacity>
            <Text style={[styles.engageText, { color: textColor }]}> {item.comments}</Text>
          </View>

          <Text style={[styles.locationText, { color: textColor }]}>{item.location}</Text>

          <TouchableOpacity style={styles.dotsIcon} onPress={() => console.log('Menu')}>
            <Ionicons name="ellipsis-vertical" size={16} color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>
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

      {/* Floating Add Button with round smooth style */}
      <View style={styles.addButtonContainer}>
        <BlurView intensity={70} tint="light" style={styles.blurWrapper}>
          <TouchableOpacity
            onPress={() => console.log('Add pressed')}
            activeOpacity={0.7}
            style={styles.addTouchable}
          >
            <Ionicons name="add" size={32} color="#fff" />
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
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
});

export default FeedList;






