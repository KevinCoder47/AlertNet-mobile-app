//NEW PEOPLEBAR
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
  RefreshControl,
  PanResponder,
  Animated,
  StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ColorContext';
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

const PeopleBar = ({ onOpenChat }) => {
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
  
  // Use your theme context instead of useColorScheme
  const { colors, isDark } = useTheme();
  const styles = getStyles(isDark, colors); // Pass colors to styles
  
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
    const userId = user.uid || user.id || user.userId || user.UID;
    
    if (!userPhone) {
      console.error('PeopleBar: Missing phone number');
      setLoading(false);
      return;
    }
  
    if (!userId) {
      console.error('PeopleBar: Missing user ID');
      fetchUserIdAndSetupListener(userPhone);
      return;
    }
  
    // Get current user's location for distance calculations
    const currentUserLocation = getUserLocation(user);
  
    console.log('PeopleBar: Setting up Friends array listener with detailed data');
    console.log('  Phone:', userPhone);
    console.log('  User ID:', userId);
    console.log('  Has location:', !!currentUserLocation);
    

    console.log('🔍 DEBUG: Current user location:', currentUserLocation);
    console.log('🔍 DEBUG: User data structure:', {
      hasCurrentLocation: !!user.CurrentLocation,
      hasResidenceAddress: !!user.ResidenceAddress,
      CurrentLocation: user.CurrentLocation,
      ResidenceAddress: user.ResidenceAddress
    });

    
    // Use the simplified listener that only watches the Friends array
    friendsUnsubscribe.current = FirebaseService.listenToAllFriendsWithDetails(
      userPhone,
      userId,
      currentUserLocation,
      (friendsWithDetails) => {
        console.log('PeopleBar: Received detailed friend data:', friendsWithDetails.length);
        
        const seenIdentifiers = new Set();
        
        const transformedFriends = friendsWithDetails.reduce((acc, friend, index) => {
          const identifier = friend.friendId || friend.uid || friend.phone;
          
          if (seenIdentifiers.has(identifier)) {
            console.warn('PeopleBar: Duplicate friend detected, skipping:', identifier);
            return acc;
          }
          
          seenIdentifiers.add(identifier);
          
          const transformedFriend = {
            id: generateUniqueKey(friend, acc.length),
            name: friend.name,
            firstName: friend.firstName,
            lastName: friend.lastName,
            phone: friend.phone,
            email: friend.email,
            avatar: friend.avatar,
            status: friend.status,
            isOnline: friend.isOnline,
            location: friend.location,
            distance: 'Nearby', 
            battery: friend.battery,
            batteryLevel: friend.batteryLevel,
            friendId: friend.friendId,
            isCloseFriend: friend.isCloseFriend,
            rating: friend.rating,
            lastSeen: friend.lastSeen,
            lastLogin: friend.lastLogin,
            rawData: friend.rawData
          };
          
          acc.push(transformedFriend);
          return acc;
        }, []);
        
        console.log('PeopleBar: Transformed friends with real data:', transformedFriends.length);
        
        if (transformedFriends.length > 0) {
          console.log('Sample friend data:', {
            name: transformedFriends[0].name,
            status: transformedFriends[0].status,
            location: transformedFriends[0].location,
            distance: transformedFriends[0].distance,
            battery: transformedFriends[0].battery
          });
        }
        
        setFriendsData(transformedFriends);
        setLoading(false);
        setLastUpdated(new Date());
      }
    );
  };
  
  // Helper to get user's location from their data

  const getUserLocation = (user) => {
    console.log('=== DEBUG getUserLocation ENHANCED ===');
    console.log('Full user object keys:', Object.keys(user));
    console.log('CurrentLocation value:', JSON.stringify(user.CurrentLocation, null, 2));
    console.log('CurrentLocation type:', typeof user.CurrentLocation);
    
    // Try CurrentLocation first (real-time location)
    if (user.CurrentLocation) {
      console.log('CurrentLocation exists, checking structure...');
      console.log('  Has latitude:', 'latitude' in user.CurrentLocation);
      console.log('  Has longitude:', 'longitude' in user.CurrentLocation);
      console.log('  Latitude value:', user.CurrentLocation.latitude);
      console.log('  Longitude value:', user.CurrentLocation.longitude);
      console.log('  Latitude type:', typeof user.CurrentLocation.latitude);
      console.log('  Longitude type:', typeof user.CurrentLocation.longitude);
      
      if (user.CurrentLocation.latitude != null && user.CurrentLocation.longitude != null) {
        const location = {
          latitude: Number(user.CurrentLocation.latitude),
          longitude: Number(user.CurrentLocation.longitude)
        };
        console.log('✅ Returning CurrentLocation:', location);
        return location;
      }
    }
    
    // Fallback to ResidenceAddress
    if (user.ResidenceAddress?.latitude != null && user.ResidenceAddress?.longitude != null) {
      const location = {
        latitude: Number(user.ResidenceAddress.latitude),
        longitude: Number(user.ResidenceAddress.longitude)
      };
      console.log('✅ Returning ResidenceAddress:', location);
      return location;
    }
    
    console.log('❌ No valid location found');
    console.log('=== END DEBUG ===');
    return null;
  };
  
  // Helper to fetch user ID if missing
  const fetchUserIdAndSetupListener = async (userPhone) => {
    try {
      console.log('PeopleBar: Fetching user ID by phone:', userPhone);
      const result = await FirebaseService.getUserByPhone(userPhone);
      
      if (result.exists && result.userData) {
        const userId = result.userData.id;
        console.log('PeopleBar: Found user ID:', userId);
        
        const updatedUserData = { ...userData, uid: userId, id: userId };
        setUserData(updatedUserData);
        
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        const currentUserLocation = getUserLocation(updatedUserData);
        
        friendsUnsubscribe.current = FirebaseService.listenToAllFriendsWithDetails(
          userPhone,
          userId,
          currentUserLocation,
          (friendsWithDetails) => {
            console.log('PeopleBar: Received detailed friend data:', friendsWithDetails.length);
            
            const seenIdentifiers = new Set();
            
            const transformedFriends = friendsWithDetails.reduce((acc, friend, index) => {
              const identifier = friend.friendId || friend.uid || friend.phone;
              
              if (seenIdentifiers.has(identifier)) {
                return acc;
              }
              
              seenIdentifiers.add(identifier);
              
              acc.push({
                id: generateUniqueKey(friend, acc.length),
                name: friend.name,
                firstName: friend.firstName,
                lastName: friend.lastName,
                phone: friend.phone,
                email: friend.email,
                avatar: friend.avatar,
                status: friend.status,
                isOnline: friend.isOnline,
                location: friend.location,
                distance: friend.distance,
                battery: friend.battery,
                batteryLevel: friend.batteryLevel,
                friendId: friend.friendId,
                isCloseFriend: friend.isCloseFriend,
                rating: friend.rating,
                lastSeen: friend.lastSeen,
                rawData: friend.rawData
              });
              
              return acc;
            }, []);
            
            setFriendsData(transformedFriends);
            setLoading(false);
            setLastUpdated(new Date());
          }
        );
        
      } else {
        console.error('PeopleBar: Could not find user by phone');
        setLoading(false);
      }
    } catch (error) {
      console.error('PeopleBar: Error fetching user ID:', error);
      setLoading(false);
    }
  };


  // Helper function to fetch user ID if it's missing
const fetchUserIdByPhone = async (userPhone) => {
  try {
    console.log('PeopleBar: Fetching user ID by phone:', userPhone);
    const result = await FirebaseService.getUserByPhone(userPhone);
    
    if (result.exists && result.userData) {
      const userId = result.userData.id;
      console.log('PeopleBar: Found user ID:', userId);
      
      // Update userData with the ID
      const updatedUserData = { ...userData, uid: userId, id: userId };
      setUserData(updatedUserData);
      
      // Save to AsyncStorage for future use
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      // Now set up the listener with the correct ID
      setupFriendsListenerWithId(userPhone, userId);
    } else {
      console.error('PeopleBar: Could not find user by phone');
      setLoading(false);
    }
  } catch (error) {
    console.error('PeopleBar: Error fetching user ID:', error);
    setLoading(false);
  }
};

// Separate function to set up listener when we have the ID
const setupFriendsListenerWithId = (userPhone, userId) => {
  console.log('PeopleBar: Setting up listener with fetched ID');
  
  friendsUnsubscribe.current = FirebaseService.listenToAllFriends(
    userPhone,
    userId,
    (friends) => {
      console.log('PeopleBar: Friends updated from all sources:', friends.length);
      
      const fromCollection = friends.filter(f => f.source === 'friends_collection').length;
      const fromArray = friends.filter(f => f.source === 'user_friends_array').length;
      console.log(`  From friends collection: ${fromCollection}`);
      console.log(`  From Friends array: ${fromArray}`);
      
      const seenIdentifiers = new Set();
      
      const transformedFriends = friends.reduce((acc, friend, index) => {
        const identifier = friend.friendId || friend.uid || friend.friendPhone || friend.friendEmail || `index_${index}`;
        
        if (seenIdentifiers.has(identifier)) {
          console.warn('PeopleBar: Duplicate friend detected, skipping:', identifier);
          return acc;
        }
        
        seenIdentifiers.add(identifier);
        
        const transformedFriend = {
          id: generateUniqueKey(friend, acc.length),
          name: friend.friendName || friend.name || 'Unknown Friend',
          location: 'Unknown',
          status: 'Online',
          distance: 'Unknown',
          battery: '100%',
          avatar: friend.avatar || null,
          phone: friend.friendPhone || friend.phoneNumber || '',
          email: friend.friendEmail || friend.email || '',
          isCloseFriend: true,
          friendId: friend.friendId || friend.uid,
          createdAt: friend.createdAt,
          lastInteraction: friend.lastInteraction,
          source: friend.source
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
      const userId = userData.uid || userData.id || userData.userId;
      
      if (!userId) {
        console.error('PeopleBar: Cannot refresh, missing user ID');
        setRefreshing(false);
        return;
      }
  
      console.log('PeopleBar: Refreshing friends data from Friends array...');
      
      const currentUserLocation = getUserLocation(userData);
      
      // Only fetch from Friends array (simplified!)
      const arrayResult = await FirebaseService.getFriendsFromArray(userId);
      
      if (!arrayResult.success) {
        console.error('Error fetching friends:', arrayResult.error);
        setRefreshing(false);
        return;
      }
      
      const friendIds = arrayResult.friends
        .filter(friend => friend && friend.friendId)
        .map(friend => friend.friendId);
      
      console.log(`PeopleBar: Found ${friendIds.length} friends to refresh`);
      
      if (friendIds.length === 0) {
        setFriendsData([]);
        setLastUpdated(new Date());
        setRefreshing(false);
        return;
      }
      
      // Fetch detailed data for all friends
      const detailsResult = await FirebaseService.getFriendsDetails(friendIds, currentUserLocation);
      
      if (detailsResult.success) {
        const seenIdentifiers = new Set();
        
        const transformedFriends = detailsResult.friendsDetails.reduce((acc, friend, index) => {
          const identifier = friend.friendId || friend.uid || friend.phone;
          
          if (seenIdentifiers.has(identifier)) {
            return acc;
          }
          
          seenIdentifiers.add(identifier);
          
          acc.push({
            id: generateUniqueKey(friend, acc.length),
            name: friend.name,
            firstName: friend.firstName,
            lastName: friend.lastName,
            phone: friend.phone,
            email: friend.email,
            avatar: friend.avatar,
            status: friend.status,
            isOnline: friend.isOnline,
            location: friend.location,
            distance: 'Nearby', // ← CHANGED: Always display 'Nearby'
            battery: friend.battery,
            batteryLevel: friend.batteryLevel,
            friendId: friend.friendId,
            isCloseFriend: friend.isCloseFriend,
            rating: friend.rating,
            lastSeen: friend.lastSeen,
            rawData: friend.rawData
          });
          
          return acc;
        }, []);
        
        console.log(`PeopleBar: Refreshed ${transformedFriends.length} friends with details`);
        setFriendsData(transformedFriends);
        setLastUpdated(new Date());
      } else {
        console.error('Error fetching friends details:', detailsResult.error);
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

        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary || colors.secondary} />
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    const TabComponents = { friends: FriendList, community: CommunityList, feed: FeedList };
    const Component = TabComponents[activeTab] || FriendList;
    
    if (activeTab === 'friends') {
      return <Component friendsData={friendsData} onOpenChat={onOpenChat} />;
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
      <Ionicons name="people-outline" size={48} color={colors.textSecondary || colors.secondary} />
      <Text style={styles.emptyStateText}>No friends yet</Text>
      <Text style={styles.emptyStateSubtext}>Send friend requests to see your friends here</Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <Text style={styles.loadingText}>Loading friends...</Text>
    </View>
  );

  // Helper function to get header text based on active tab
  const getHeaderText = () => {
    switch (activeTab) {
      case 'friends':
        return `Friends (${friendsData.length})`;
      case 'community':
        return 'Community';
      case 'feed':
        return 'Feed';
      default:
        return 'Friends';
    }
  };

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
            <Text style={styles.headerText}>{getHeaderText()}</Text>
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
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary || colors.secondary} />
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

          {/* Only show the add button when on the friends tab */}
          {activeTab === 'friends' && (
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setPhoneOverlayVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.addButtonText}>+ add</Text>
            </TouchableOpacity>
          )}
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

// Updated styles to use theme colors
const getStyles = (isDark, colors) => StyleSheet.create({
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
    backgroundColor: colors.textSecondary || colors.secondary,
    borderRadius: 2,
  },
  swipeHint: {
    fontSize: 10,
    color: colors.textSecondary || colors.secondary,
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
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lastUpdatedText: {
    fontSize: 10,
    color: colors.textSecondary || colors.secondary,
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
    borderBottomColor: colors.separator || colors.border,
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
    backgroundColor: colors.inputBackground || (isDark ? '#555' : '#ddd'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.card || colors.background,
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
    color: colors.text,
    marginBottom: 2,
  },
  personLocation: {
    fontSize: 12,
    color: colors.textSecondary || colors.secondary,
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
    color: colors.textSecondary || colors.secondary, 
    marginHorizontal: 5,
  },
  personDistance: { 
    fontSize: 12, 
    color: colors.textSecondary || colors.secondary,
    flex: 1,
  },
  addButton: { 
    marginTop: 5, 
    paddingVertical: 8, 
    alignItems: 'center',
  },
  addButtonText: { 
    color: colors.text, 
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
    backgroundColor: colors.card || colors.background,
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
    color: colors.textSecondary || colors.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.text,
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
    color: colors.textSecondary || colors.secondary,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: colors.textTertiary || colors.secondary,
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
    color: colors.textSecondary || colors.secondary,
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