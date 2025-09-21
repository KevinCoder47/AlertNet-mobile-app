import React, { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  UIManager,
  StyleSheet,
  Dimensions,
  useColorScheme,
  RefreshControl,
  PanResponder,
  Animated,
  StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PhoneOverlay from './PhoneOverlay';
import FriendList from './FriendsList';
import CommunityList from './CommunityList';
import FeedList from './Feed/FeedList';
import NotificationBell from '../NotificationBell';
import { FirebaseService } from '../../../backend/Firebase/FirebaseService';

const { width, height } = Dimensions.get('window');

// Cross-platform safe area calculations
const getStatusBarHeight = () => {
  if (Platform.OS === 'ios') {
    return height >= 812 ? 44 : 20;
  }
  return StatusBar.currentHeight || 24;
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const getBatteryIconName = (batteryPercentStr) => {
  const percent = parseInt(batteryPercentStr);
  if (isNaN(percent)) return 'battery-dead';
  if (percent >= 80) return 'battery-full';
  if (percent >= 50) return 'battery-half';
  if (percent >= 20) return 'battery-low';
  return 'battery-dead';
};

// Generate unique key for each friend
const generateUniqueKey = (friend, index) => {
  // Use multiple fallback strategies to ensure uniqueness
  if (friend.friendId) {
    return `friend_${friend.friendId}`;
  }
  if (friend.phone) {
    return `phone_${friend.phone.replace(/\D/g, '')}`; // Remove non-digits
  }
  if (friend.email) {
    return `email_${friend.email}`;
  }
  // Last resort: use index with timestamp
  return `fallback_${index}_${Date.now()}`;
};

const PeopleBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [phoneOverlayVisible, setPhoneOverlayVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');
  const [friendsData, setFriendsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  
  // Real-time listeners
  const friendsUnsubscribe = useRef(null);
  
  // Responsive dimensions
  const statusBarHeight = getStatusBarHeight();
  const baseHeight = height * 0.33;
  const maxHeight = Math.min(height * 0.65, height - 150);
  
  // Animation values
  const animatedHeight = useRef(new Animated.Value(baseHeight)).current;
  const animatedOpacity = useRef(new Animated.Value(1)).current;
  
  // Drag configuration
  const dragState = useRef({
    isDragging: false,
    startHeight: baseHeight,
    minHeight: baseHeight,
    maxHeight,
  }).current;
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);

  // Load user data and initialize friends listener
  useEffect(() => {
    const initializePeopleBar = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('userData');
        if (jsonValue) {
          const user = JSON.parse(jsonValue);
          console.log('PeopleBar: User data loaded:', user.Phone || user.phone);
          setUserData(user);
          
          // Set up real-time friends listener
          setupFriendsListener(user);
        }
      } catch (error) {
        console.error('PeopleBar: Error initializing:', error);
        setLoading(false);
      }
    };

    initializePeopleBar();
    
    // Cleanup listener on unmount
    return () => {
      if (friendsUnsubscribe.current) {
        friendsUnsubscribe.current();
      }
    };
  }, []);

  // Set up real-time friends listener
  const setupFriendsListener = (user) => {
    const userPhone = user.Phone || user.phone || user.phoneNumber;
    
    if (!userPhone) {
      console.error('PeopleBar: No phone number found for user');
      setLoading(false);
      return;
    }

    console.log('PeopleBar: Setting up friends listener for:', userPhone);
    
    // Listen to friends changes in real-time
    friendsUnsubscribe.current = FirebaseService.listenToFriends(
      userPhone,
      (friends) => {
        console.log('PeopleBar: Friends updated:', friends.length);
        
        // Create a Set to track unique identifiers and prevent duplicates
        const seenIdentifiers = new Set();
        
        // Transform Firebase friends data to PeopleBar format
        const transformedFriends = friends.reduce((acc, friend, index) => {
          // Create a unique identifier for deduplication
          const identifier = friend.friendId || friend.friendPhone || friend.friendEmail || `index_${index}`;
          
          // Skip if we've already seen this friend
          if (seenIdentifiers.has(identifier)) {
            console.warn('PeopleBar: Duplicate friend detected, skipping:', identifier);
            return acc;
          }
          
          seenIdentifiers.add(identifier);
          
          const transformedFriend = {
            id: generateUniqueKey(friend, acc.length), // Use acc.length for unique indexing
            name: friend.friendName || 'Unknown Friend',
            location: 'Unknown', // You can enhance this with real location data
            status: 'Online', // You can enhance this with real status
            distance: 'Unknown', // You can enhance this with real distance calculation
            battery: '100%', // You can enhance this with real battery data
            avatar: friend.avatar || null, // You can enhance this with real avatar
            phone: friend.friendPhone,
            email: friend.friendEmail,
            isCloseFriend: true, // All accepted friends are close friends
            
            // Additional friend data
            friendId: friend.friendId,
            createdAt: friend.createdAt,
            lastInteraction: friend.lastInteraction
          };
          
          acc.push(transformedFriend);
          return acc;
        }, []);
        
        console.log('PeopleBar: Processed friends:', transformedFriends.length);
        setFriendsData(transformedFriends);
        setLoading(false);
        setLastUpdated(new Date());
      }
    );
  };

  // Enhanced refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    
    try {
      if (!userData) {
        setRefreshing(false);
        return;
      }

      const userPhone = userData.Phone || userData.phone || userData.phoneNumber;
      
      // Fetch fresh friends data
      const result = await FirebaseService.getFriendsForUser(userPhone);
      
      if (result.success) {
        // Create a Set to track unique identifiers and prevent duplicates
        const seenIdentifiers = new Set();
        
        // Transform the fresh data with deduplication
        const transformedFriends = result.friends.reduce((acc, friend, index) => {
          const identifier = friend.friendId || friend.friendPhone || friend.friendEmail || `index_${index}`;
          
          if (seenIdentifiers.has(identifier)) {
            console.warn('PeopleBar: Duplicate friend detected during refresh, skipping:', identifier);
            return acc;
          }
          
          seenIdentifiers.add(identifier);
          
          const transformedFriend = {
            id: generateUniqueKey(friend, acc.length),
            name: friend.friendName || 'Unknown Friend',
            location: 'Unknown',
            status: 'Online',
            distance: 'Unknown',
            battery: '100%',
            avatar: friend.avatar || null,
            phone: friend.friendPhone,
            email: friend.friendEmail,
            isCloseFriend: true,
            friendId: friend.friendId,
            createdAt: friend.createdAt,
            lastInteraction: friend.lastInteraction
          };
          
          acc.push(transformedFriend);
          return acc;
        }, []);
        
        setFriendsData(transformedFriends);
        setLastUpdated(new Date());
      } else {
        console.error('Error fetching friends:', result.error);
      }
    } catch (error) {
      console.error('Error refreshing friends:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Gesture handler (unchanged from your original)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: (_, gestureState) => {
        dragState.isDragging = true;
        dragState.startHeight = animatedHeight._value;
        animatedHeight.stopAnimation();
        animatedOpacity.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (!dragState.isDragging) return;
        
        const newHeight = Math.max(
          dragState.minHeight,
          Math.min(dragState.maxHeight, dragState.startHeight - gestureState.dy)
        );
        
        animatedHeight.setValue(newHeight);
        
        const heightProgress = (newHeight - dragState.minHeight) / (dragState.maxHeight - dragState.minHeight);
        animatedOpacity.setValue(1 - heightProgress);
        
        const midPoint = (dragState.minHeight + dragState.maxHeight) / 2;
        const shouldExpand = newHeight > midPoint;
        if (shouldExpand !== isExpanded) {
          setIsExpanded(shouldExpand);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        dragState.isDragging = false;
        
        const currentHeight = animatedHeight._value;
        const velocity = gestureState.vy;
        const midPoint = (dragState.minHeight + dragState.maxHeight) / 2;
        
        let targetHeight, targetExpanded;
        
        if (Math.abs(velocity) > 0.5) {
          targetHeight = velocity < 0 ? dragState.maxHeight : dragState.minHeight;
          targetExpanded = velocity < 0;
        } else {
          targetHeight = currentHeight > midPoint ? dragState.maxHeight : dragState.minHeight;
          targetExpanded = currentHeight > midPoint;
        }
        
        setIsExpanded(targetExpanded);
        Animated.parallel([
          Animated.spring(animatedHeight, {
            toValue: targetHeight,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(animatedOpacity, {
            toValue: targetExpanded ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        dragState.isDragging = false;
        const currentHeight = animatedHeight._value;
        const midPoint = (dragState.minHeight + dragState.maxHeight) / 2;
        const targetHeight = currentHeight > midPoint ? dragState.maxHeight : dragState.minHeight;
        const targetExpanded = currentHeight > midPoint;
        
        setIsExpanded(targetExpanded);
        Animated.parallel([
          Animated.spring(animatedHeight, { toValue: targetHeight, useNativeDriver: false }),
          Animated.timing(animatedOpacity, { toValue: targetExpanded ? 0 : 1, duration: 200, useNativeDriver: true }),
        ]).start();
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const togglePanel = (expand) => {
    const targetHeight = expand ? dragState.maxHeight : dragState.minHeight;
    setIsExpanded(expand);
    
    Animated.parallel([
      Animated.spring(animatedHeight, {
        toValue: targetHeight,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(animatedOpacity, {
        toValue: expand ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Enhanced person item renderer with real friend data and proper key handling
  const renderPersonItem = (person, index) => {
    const batteryIcon = getBatteryIconName(person.battery);
    const batteryLevel = parseInt(person.battery);
    const batteryColor = batteryLevel < 20 ? '#ff6b6b' : '#51e651';
    const statusColor = person.status === 'Online' ? '#51e651' : '#a0a0a0';
    const isLast = index === friendsData.length - 1;

    return (
      <TouchableOpacity
        key={person.id} // Using the unique key we generated
        style={[styles.personContainer, isLast && { borderBottomWidth: 0 }]}
        onPress={() => {
          // Navigate to friend's profile with real data
          navigation.navigate('Profile', { 
            person: {
              ...person,
              id: person.friendId || person.id,
              name: person.name,
              phone: person.phone,
              email: person.email,
              avatar: person.avatar,
            }
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.avatarSection}>
          {/* Enhanced avatar rendering */}
          {person.avatar ? (
            <Image source={{ uri: person.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Text style={styles.avatarInitial}>
                {person.name ? person.name.charAt(0).toUpperCase() : 'F'}
              </Text>
            </View>
          )}
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <View style={styles.batteryInfo}>
            <Ionicons name={batteryIcon} size={12} color={batteryColor} />
            <Text style={[styles.batteryText, { color: batteryColor }]}>{person.battery}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.personName} numberOfLines={1}>{person.name}</Text>
          <Text style={styles.personLocation} numberOfLines={1}>{person.location}</Text>
          <View style={styles.statusRow}>
            <Text style={[styles.personStatus, { color: statusColor }]}>{person.status}</Text>
            <Text style={styles.divider}>•</Text>
            <Text style={styles.personDistance} numberOfLines={1}>{person.distance}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={isDark ? '#ccc' : '#555'} />
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    const TabComponents = { friends: FriendList, community: CommunityList, feed: FeedList };
    const Component = TabComponents[activeTab] || FriendList;
    
    if (activeTab === 'friends') {
      return <Component friendsData={friendsData} />;
    }
    
    return <Component />;
  };

  const renderTabs = () => {
    if (!isExpanded) return null;
    
    const tabs = [
      { key: 'friends', label: 'Friends' },
      { key: 'community', label: 'Community' },
      { key: 'feed', label: 'Feed' }
    ];

    return (
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={48} color={isDark ? '#666' : '#ccc'} />
      <Text style={styles.emptyStateText}>No friends yet</Text>
      <Text style={styles.emptyStateSubtext}>Send friend requests to see your friends here</Text>
      <TouchableOpacity 
        style={styles.addFriendsButton}
        onPress={() => setPhoneOverlayVisible(true)}
      >
        <Text style={styles.addFriendsButtonText}>Add Friends</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <Text style={styles.loadingText}>Loading friends...</Text>
    </View>
  );

  return (
    <>
      <Animated.View style={[styles.container, { height: animatedHeight }]}>
        <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={styles.blurContainer}>
          <View style={styles.glassOverlay} />

          <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
            <Animated.Text style={[styles.swipeHint, { opacity: animatedOpacity }]}>
              {isExpanded ? 'Swipe down to collapse' : 'Swipe up to expand'}
            </Animated.Text>
          </View>

          <View style={styles.header}>
            <Text style={styles.headerText}>Friends ({friendsData.length})</Text>
            <View style={styles.headerRight}>
              <Text style={styles.lastUpdatedText}>
                Last updated: {formatTime(lastUpdated)}
              </Text>
              {isExpanded && (
                <TouchableOpacity 
                  onPress={() => togglePanel(false)} 
                  style={styles.collapseButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-down" size={20} color={isDark ? '#ccc' : '#555'} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {renderTabs()}

          <View style={styles.contentContainer}>
            {isExpanded ? (
              renderTabContent()
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                scrollEventThrottle={16}
                nestedScrollEnabled
              >
                {loading ? (
                  renderLoadingState()
                ) : friendsData.length === 0 ? (
                  renderEmptyState()
                ) : (
                  friendsData.map(renderPersonItem)
                )}
              </ScrollView>
            )}
          </View>

          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setPhoneOverlayVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+ add</Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>

      {/* NotificationBell positioned lower to give PeopleBar more space */}
      <View style={styles.notificationBellContainer}>
        <NotificationBell />
      </View>

      <PhoneOverlay
        visible={phoneOverlayVisible}
        onClose={() => setPhoneOverlayVisible(false)}
        myPhone={userData?.Phone || userData?.phone || userData?.phoneNumber} 
        userEmail={userData?.email || userData?.Email}  
      />
    </>
  );
};

const getStyles = (isDark) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,
    width: width * 0.95,
    alignSelf: 'center',
    zIndex: 20,
  },
  blurContainer: {
    flex: 1,
    padding: 10,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)',
    borderRadius: 18,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 30,
    height: 4,
    backgroundColor: isDark ? '#e0e0e0' : '#333',
    borderRadius: 2,
  },
  swipeHint: {
    fontSize: 10,
    color: isDark ? '#aaa' : '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginBottom: 5,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? 'white' : 'black',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lastUpdatedText: {
    fontSize: 10,
    color: isDark ? '#aaa' : '#666',
  },
  collapseButton: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
  },
  list: { 
    flex: 1,
  },
  listContent: { 
    paddingBottom: 5,
  },
  personContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: isDark ? '#444' : '#ccc',
  },
  avatarSection: {
    position: 'relative',
    marginRight: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  defaultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: isDark ? '#555' : '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#fff' : '#333',
  },
  statusDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  batteryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  batteryText: { 
    fontSize: 11, 
    marginLeft: 2,
    fontWeight: '500',
  },
  infoSection: { 
    flex: 1, 
    justifyContent: 'center',
    marginRight: 10,
  },
  personName: {
    fontWeight: '600',
    fontSize: 15,
    color: isDark ? 'white' : '#111',
    marginBottom: 2,
  },
  personLocation: {
    fontSize: 12,
    color: isDark ? '#b0b0b0' : '#444',
    marginBottom: 2,
  },
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  personStatus: { 
    fontSize: 12, 
    fontWeight: '500',
  },
  divider: { 
    color: '#666', 
    marginHorizontal: 5,
  },
  personDistance: { 
    fontSize: 12, 
    color: isDark ? '#a0a0a0' : '#555',
    flex: 1,
  },
  addButton: { 
    marginTop: 5, 
    paddingVertical: 8, 
    alignItems: 'center',
  },
  addButtonText: { 
    color: isDark ? 'white' : '#222', 
    fontSize: 14, 
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    marginHorizontal: 5,
    marginBottom: 10,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: isDark ? '#333' : '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabText: {
    fontSize: 14,
    color: isDark ? '#aaa' : '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: isDark ? '#fff' : '#333',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#ccc' : '#666',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: isDark ? '#999' : '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  addFriendsButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addFriendsButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: isDark ? '#ccc' : '#666',
  },
  // New style for NotificationBell container
  notificationBellContainer: {
    position: 'absolute',
    top: '-120%', // Moved down from the original position
    right: 120,
    zIndex: 25, // Higher than PeopleBar to stay on top
  },
});

export default PeopleBar;