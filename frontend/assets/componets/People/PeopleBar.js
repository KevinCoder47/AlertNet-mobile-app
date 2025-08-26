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
import FeedList from './FeedList';
import NotificationBell from '../NotificationBell';

const { width, height } = Dimensions.get('window');

// Cross-platform safe area calculations
const getStatusBarHeight = () => {
  if (Platform.OS === 'ios') {
    return height >= 812 ? 44 : 20; // iPhone X+ vs older iPhones
  }
  return StatusBar.currentHeight || 24;
};

// Enable layout animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const peopleData = [
  {
    id: 1,
    name: 'Unathi Gumede',
    location: 'Helen Joseph Hospital',
    status: 'Online',
    distance: '5 km away',
    battery: '4%',
    avatar: require('../../images/Unathi.jpg'),
  },
  {
    id: 2,
    name: 'Cheyenne Luthuli',
    location: 'Mayfair West',
    status: 'Offline',
    distance: '23 km away',
    battery: '85%',
    avatar: require('../../images/Cheyenne.jpg'),
  },
  {
    id: 3,
    name: 'Mpilonhle Radebe',
    location: 'Lost Location',
    status: 'Online',
    distance: 'Lost Distance',
    battery: '62%',
    avatar: require('../../images/Mpilo.jpg'),
  },
  {
    id: 4,
    name: 'Kuhle Mgudlwa',
    location: 'Unknown',
    status: 'Offline',
    distance: 'Unknown',
    battery: '74%',
    avatar: require('../../images/Kuhle.jpg'),
  },
  {
    id: 5,
    name: 'Kevin Serakalala',
    location: 'Campus Square',
    status: 'Online',
    distance: '5 m away',
    battery: '88%',
    avatar: require('../../images/Kevin.jpg'),
  },
  {
    id: 6,
    name: 'Sphephile Mtshali',
    location: 'Gold Reef City',
    status: 'Offline',
    distance: '10 km away',
    battery: '56%',
    avatar: require('../../images/Cheyenne.jpg'),
  },
];

const getBatteryIconName = (batteryPercentStr) => {
  const percent = parseInt(batteryPercentStr);
  if (isNaN(percent)) return 'battery-dead';
  if (percent >= 80) return 'battery-full';
  if (percent >= 50) return 'battery-half';
  if (percent >= 20) return 'battery-low';
  return 'battery-dead';
};

const PeopleBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [phoneOverlayVisible, setPhoneOverlayVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');
  const navigation = useNavigation();
  
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

  // Gesture handler with improved touch response
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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('userData');
        if (jsonValue) {
          setUserData(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.error('Error reading user data:', e);
      }
    };
    fetchUserData();
  }, []);

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

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setRefreshing(false);
    }, 1500);
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderPersonItem = (person, index) => {
    const batteryIcon = getBatteryIconName(person.battery);
    const batteryLevel = parseInt(person.battery);
    const batteryColor = batteryLevel < 20 ? '#ff6b6b' : '#51e651';
    const statusColor = person.status === 'Online' ? '#51e651' : '#a0a0a0';
    const isLast = index === peopleData.length - 1;

    return (
      <TouchableOpacity
        key={person.id}
        style={[styles.personContainer, isLast && { borderBottomWidth: 0 }]}
        onPress={() => navigation.navigate('Profile', { person })}
        activeOpacity={0.7}
      >
        <View style={styles.avatarSection}>
          <Image source={person.avatar} style={styles.avatar} />
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
            <Text style={styles.headerText}>People</Text>
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
                {peopleData.map(renderPersonItem)}
              </ScrollView>
            )}
          </View>

          <NotificationBell />

          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setPhoneOverlayVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+ add</Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>

      <PhoneOverlay
        visible={phoneOverlayVisible}
        onClose={() => setPhoneOverlayVisible(false)}
        myPhone={userData?.phone || userData?.phoneNumber} 
        userEmail={userData?.email}  
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
});

export default PeopleBar;

