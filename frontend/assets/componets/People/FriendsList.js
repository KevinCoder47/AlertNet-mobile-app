import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  useColorScheme,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FriendsService from '../../services/FriendsService';

// Fallback static data (from main branch)
const staticCloseFriends = [
  {
    id: '1',
    name: 'Unathi Gumede',
    location: 'Helen Joseph Hospital',
    status: 'Online',
    distance: '5 km away',
    battery: '4%',
    avatar: require('../../images/Unathi.jpg'),
    isCloseFriend: true,
  },
  {
    id: '2',
    name: 'Cheyenne Luthuli',
    location: 'Mayfair West',
    status: 'Offline',
    distance: '23 km away',
    battery: '85%',
    avatar: require('../../images/Cheyenne.jpg'),
    isCloseFriend: true,
  },
  {
    id: '3',
    name: 'Nomusa Buthelezi',
    location: 'Soweto',
    status: 'Online',
    distance: '10 km away',
    battery: '64%',
    avatar: require('../../images/Cheyenne.jpg'),
    isCloseFriend: true,
  },
  {
    id: '4',
    name: 'Junior Madiba',
    location: 'Braamfontein',
    status: 'Offline',
    distance: '12 km away',
    battery: '78%',
    avatar: require('../../images/Junior.jpg'),
    isCloseFriend: true,
  },
];

const staticRegularFriends = [
  {
    id: '5',
    name: 'Mpilonhle Radebe',
    location: 'Campus Square',
    status: 'Online',
    distance: '3 km away',
    battery: '62%',
    avatar: require('../../images/Mpilo.jpg'),
    isCloseFriend: false,
  },
  {
    id: '6',
    name: 'Kuhle Mgudlwa',
    location: 'Unknown',
    status: 'Offline',
    distance: 'Unknown',
    battery: '74%',
    avatar: require('../../images/Kuhle.jpg'),
    isCloseFriend: false,
  },
  {
    id: '7',
    name: 'Kevin Serakalala',
    location: 'Campus Square',
    status: 'Online',
    distance: '5 m away',
    battery: '88%',
    avatar: require('../../images/Kevin.jpg'),
    isCloseFriend: false,
  },
  {
    id: '8',
    name: 'Sphephile Mtshali',
    location: 'Gold Reef City',
    status: 'Offline',
    distance: '10 km away',
    battery: '56%',
    avatar: require('../../images/Cheyenne.jpg'),
    isCloseFriend: false,
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

const FriendsList = ({ searchQuery = '', friendsData: propFriendsData }) => {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);
  const scrollRef = useRef();
  const [refreshing, setRefreshing] = useState(false);
  const [friendsData, setFriendsData] = useState(propFriendsData || []);
  const [loading, setLoading] = useState(!propFriendsData);
  const navigation = useNavigation();

  // Initialize FriendsService when component mounts
  useEffect(() => {
    const initializeFriendsService = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('userData');
        if (jsonValue) {
          const userData = JSON.parse(jsonValue);
          console.log('FriendsList: Initializing FriendsService with userData:', userData.uid);
          await FriendsService.initialize(userData);
        }
      } catch (error) {
        console.error('FriendsList: Error initializing FriendsService:', error);
        // Fallback to static data if service fails
        setFriendsData([...staticCloseFriends, ...staticRegularFriends]);
        setLoading(false);
      }
    };

    // Only initialize if not using prop data
    if (!propFriendsData) {
      initializeFriendsService();
    }
  }, [propFriendsData]);

  // Subscribe to FriendsService updates
  useEffect(() => {
    if (propFriendsData) {
      // If using prop data, just update when props change
      setFriendsData(propFriendsData);
      setLoading(false);
      return;
    }

    console.log('FriendsList: Subscribing to FriendsService updates');
    
    const unsubscribe = FriendsService.subscribe((friends, isLoading) => {
      console.log('FriendsList: Received friends update:', friends.length, 'friends, loading:', isLoading);
      setFriendsData(friends);
      setLoading(isLoading);
    });

    return unsubscribe;
  }, [propFriendsData]);

  const onRefresh = async () => {
    if (propFriendsData) {
      // If using prop data, just stop refreshing
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    try {
      await FriendsService.refresh();
    } catch (error) {
      console.error('FriendsList: Error refreshing friends:', error);
      // Fallback refresh behavior
      setTimeout(() => {
        setRefreshing(false);
      }, 1500);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter friends based on search query
  const filteredFriends = friendsData.filter((person) =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate close friends and regular friends
  const filteredCloseFriends = filteredFriends.filter(friend => friend.isCloseFriend);
  const filteredRegularFriends = filteredFriends.filter(friend => !friend.isCloseFriend);

  const renderRegularFriendCard = ({ item }) => {
    const statusColor = item.status === 'Online' ? '#51e651' : '#a0a0a0';
    return (
      <TouchableOpacity
        style={styles.regularFriendCard}
        onPress={() => navigation.navigate('Profile', { 
          person: {
            ...item,
            id: item.id,
            name: item.name,
            avatar: item.avatar,
          }
        })}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrapper}>
          <Image source={item.avatar} style={styles.regularAvatar} />
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: statusColor,
                borderColor: '#fff',
                top: 0,
                right: 0,
              },
            ]}
          />
        </View>
        <Text style={styles.regularName} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCloseFriend = (item) => {
    const batteryIcon = getBatteryIconName(item.battery);
    const batteryLevel = parseInt(item.battery);
    const batteryColor = batteryLevel < 20 ? '#ff6b6b' : '#51e651';
    const statusColor = item.status === 'Online' ? '#51e651' : '#a0a0a0';

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.personContainer}
        onPress={() => navigation.navigate('Profile', { 
          person: {
            ...item,
            id: item.id,
            name: item.name,
            avatar: item.avatar,
          }
        })}
        activeOpacity={0.7}
      >
        <View style={styles.avatarSection}>
          <Image source={item.avatar} style={styles.avatar} />
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: statusColor,
                borderColor: '#fff',
                top: 0,
                right: 0,
              },
            ]}
          />
          <View style={styles.batteryBelowAvatar}>
            <Ionicons name={batteryIcon} size={12} color={batteryColor} />
            <Text style={[styles.batteryTextUnder, { color: batteryColor }]}>
              {item.battery}
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.personName}>{item.name}</Text>
          <Text style={styles.personLocation}>{item.location}</Text>
          <View style={styles.statusRow}>
            <Text style={[styles.personStatus, { color: statusColor }]}>
              {item.status}
            </Text>
            <Text style={styles.divider}>•</Text>
            <Text style={styles.personDistance}>{item.distance}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={isDark ? '#ccc' : '#333'} />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {searchQuery ? (
        <>
          <Ionicons name="search" size={48} color={isDark ? '#555' : '#ccc'} />
          <Text style={styles.emptyStateText}>No friends found matching "{searchQuery}"</Text>
        </>
      ) : (
        <>
          <Ionicons name="people-outline" size={48} color={isDark ? '#555' : '#ccc'} />
          <Text style={styles.emptyStateText}>No friends yet</Text>
          <Text style={styles.emptyStateSubtext}>Send friend requests to see your friends here</Text>
        </>
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <Text style={styles.loadingText}>Loading friends...</Text>
    </View>
  );

  if (loading && filteredFriends.length === 0) {
    return renderLoadingState();
  }

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      style={{ paddingHorizontal: 10 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Horizontal Regular Friends */}
      {filteredRegularFriends.length > 0 && (
        <FlatList
          data={filteredRegularFriends}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={renderRegularFriendCard}
        />
      )}

      {/* Section Title for Close Friends */}
      {filteredCloseFriends.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Close Friends</Text>
          <Text style={styles.sectionSubtitle}>A Circle built on Trust and Safety</Text>
        </View>
      )}

      {/* Vertical Close Friends */}
      {filteredCloseFriends.map(renderCloseFriend)}

      {/* Empty State */}
      {filteredFriends.length === 0 && renderEmptyState()}
    </ScrollView>
  );
};

const getStyles = (isDark) =>
  StyleSheet.create({
    personContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? '#444' : '#ccc',
      justifyContent: 'space-between',
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
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 1.5,
    },
    batteryBelowAvatar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    batteryTextUnder: {
      fontSize: 11,
      marginLeft: 4,
    },
    infoSection: {
      flex: 1,
      justifyContent: 'center',
    },
    personName: {
      fontWeight: '600',
      fontSize: 15,
      color: isDark ? 'white' : '#111',
    },
    personLocation: {
      fontSize: 12,
      color: isDark ? '#b0b0b0' : '#444',
      marginBottom: 1,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
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
    },
    regularFriendCard: {
      width: 70,
      alignItems: 'center',
      marginRight: 14,
      paddingVertical: 4,
    },
    regularAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    regularName: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 6,
      textAlign: 'center',
      color: isDark ? '#fff' : '#222',
    },
    avatarWrapper: {
      position: 'relative',
    },
    sectionHeader: {
      marginTop: 10,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
    },
    sectionSubtitle: {
      fontSize: 12,
      color: isDark ? '#888' : '#666',
      marginTop: 2,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      marginTop: 12,
      textAlign: 'center',
    },
    emptyStateSubtext: {
      fontSize: 12,
      color: isDark ? '#999' : '#888',
      marginTop: 4,
      textAlign: 'center',
    },
    loadingState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
    },
  });

export default FriendsList;