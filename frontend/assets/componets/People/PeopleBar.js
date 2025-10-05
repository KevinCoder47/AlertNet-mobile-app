//NEW PEOPLEBAR
// PeopleBar.js - Optimized with FriendsContext
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
import { useFriends } from '../../contexts/FriendsContext';
import PhoneOverlay from './PhoneOverlay';
import FriendList from './FriendsList';
import CommunityList from './CommunityList';
import FeedList from './Feed/FeedList';


const { width, height } = Dimensions.get('window');

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
  // Handle both "35%" format and just "35"
  const cleanPercent = typeof batteryPercentStr === 'string' 
    ? batteryPercentStr.replace('%', '').trim()
    : String(batteryPercentStr || '');
  
  const percent = parseInt(cleanPercent, 10);
  
  // Return valid Ionicons battery icon names
  if (Number.isNaN(percent)) return 'battery-dead';
  
  if (percent >= 80) return 'battery-full';
  if (percent >= 50) return 'battery-half';
  if (percent >= 20) return 'battery-half'; // For 35%, this will be used
  return 'battery-dead';
};


const PeopleBar = ({ onOpenChat, onFriendsUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [phoneOverlayVisible, setPhoneOverlayVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');
  const navigation = useNavigation();
  
  // Use FriendsContext - data is preloaded!
  const { friendsData, loading, lastUpdated, refreshFriends } = useFriends();
  
  const { colors, isDark } = useTheme();
  const styles = getStyles(isDark, colors);
  
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

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('userData');
        if (jsonValue) {
          const user = JSON.parse(jsonValue);
          console.log('PeopleBar: User data loaded:', user.Phone || user.phone);
          setUserData(user);
        }
      } catch (error) {
        console.error('PeopleBar: Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Notify Home.js when friends update (for map) - removed onFriendsUpdate from dependencies
  useEffect(() => {
    if (onFriendsUpdate && friendsData.length > 0) {
      console.log('PeopleBar: Notifying Home.js of', friendsData.length, 'friends');
      onFriendsUpdate(friendsData);
    }
  }, [friendsData]); // Only depend on friendsData

  // Simplified refresh function using context
  const onRefresh = async () => {
    setRefreshing(true);
    
    try {
      console.log('PeopleBar: Refreshing friends...');
      await refreshFriends();
    } catch (error) {
      console.error('PeopleBar: Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Gesture handler
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

  // Safe formatTime function with validation
  const formatTime = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Never';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

 // Key changes in the renderPersonItem function to display presence

 const renderPersonItem = (person, index) => {
  const batteryIcon = getBatteryIconName(person.battery);
  const batteryLevel = parseInt(person.battery);
  const batteryColor = batteryLevel < 20 ? '#ff6b6b' : '#51e651';
  
  // Presence data (already working)
  const isOnline = person.isOnline || person.status === 'online';
  const statusColor = isOnline ? '#51e651' : '#a0a0a0';
  const statusText = person.presenceText || (isOnline ? 'Online' : 'Offline');
  
  // Distance is now calculated and formatted (e.g., "2.5 km" or "500 m")
  const distance = person.distance || 'Unknown';
  
  const isLast = index === friendsData.length - 1;

  return (
    <TouchableOpacity
      key={person.friendId || person.id || index}
      style={[styles.personContainer, isLast && { borderBottomWidth: 0 }]}
      onPress={() => {
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
          <Text style={[styles.batteryText, { color: batteryColor }]}>
            {person.battery || 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.personName} numberOfLines={1}>
          {person.name || 'Unknown'}
        </Text>
        <Text style={styles.personLocation} numberOfLines={1}>
          {person.location || 'Unknown location'}
        </Text>
        <View style={styles.statusRow}>
          <Text style={[styles.personStatus, { color: statusColor }]}>
            {statusText}
          </Text>
          <Text style={styles.divider}>•</Text>
          {/* Distance now shows actual calculated distance */}
          <Text style={styles.personDistance} numberOfLines={1}>
            {distance}
          </Text>
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



      <PhoneOverlay
        visible={phoneOverlayVisible}
        onClose={() => setPhoneOverlayVisible(false)}
        myPhone={userData?.Phone || userData?.phone || userData?.phoneNumber} 
        userEmail={userData?.email || userData?.Email}  
      />
    </>
  );
};

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

});

export default PeopleBar;