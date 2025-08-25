import React, { useRef, useState } from 'react';
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

const closeFriends = [
  {
    id: '1',
    name: 'Unathi Gumede',
    location: 'Helen Joseph Hospital',
    status: 'Online',
    distance: '5 km away',
    battery: '4%',
    avatar: require('../../images/Unathi.jpg'),
  },
  {
    id: '2',
    name: 'Cheyenne Luthuli',
    location: 'Mayfair West',
    status: 'Offline',
    distance: '23 km away',
    battery: '85%',
    avatar: require('../../images/Cheyenne.jpg'),
  },
  {
    id: '3',
    name: 'Nomusa Buthelezi',
    location: 'Soweto',
    status: 'Online',
    distance: '10 km away',
    battery: '64%',
    avatar: require('../../images/Cheyenne.jpg'),
  },
  {
    id: '4',
    name: 'Junior Madiba',
    location: 'Braamfontein',
    status: 'Offline',
    distance: '12 km away',
    battery: '78%',
    avatar: require('../../images/Junior.jpg'),
  },
];

const regularFriends = [
  {
    id: '5',
    name: 'Mpilonhle Radebe',
    location: 'Campus Square', // Added location for consistency
    status: 'Online',
    distance: '3 km away', // Added distance for consistency
    battery: '62%', // Added battery for consistency
    avatar: require('../../images/Mpilo.jpg'),
  },
  {
    id: '6',
    name: 'Kuhle Mgudlwa',
    location: 'Unknown',
    status: 'Offline',
    distance: 'Unknown',
    battery: '74%',
    avatar: require('../../images/Kuhle.jpg'),
  },
  {
    id: '7',
    name: 'Kevin Serakalala',
    location: 'Campus Square',
    status: 'Online',
    distance: '5 m away',
    battery: '88%',
    avatar: require('../../images/Kevin.jpg'),
  },
  {
    id: '8',
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

const FriendsList = ({ searchQuery = '' }) => {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);
  const scrollRef = useRef();
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const filteredCloseFriends = closeFriends.filter((person) =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRegularFriends = regularFriends.filter((person) =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      style={{ paddingHorizontal: 10 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Horizontal Regular Friends */}
      <FlatList
        data={filteredRegularFriends}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 12 }}
        renderItem={({ item }) => {
          const statusColor = item.status === 'Online' ? '#51e651' : '#a0a0a0';
          return (
            <TouchableOpacity
              style={styles.regularFriendCard}
              onPress={() => navigation.navigate('Profile', { person: item })}
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
        }}
      />

      {/* Section Title for Close Friends */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Close Friends</Text>
        <Text style={styles.sectionSubtitle}>A Circle built on Trust and Safety</Text>
      </View>

      {/* Vertical Close Friends */}
      {filteredCloseFriends.map((item) => {
        const batteryIcon = getBatteryIconName(item.battery);
        const batteryLevel = parseInt(item.battery);
        const batteryColor = batteryLevel < 20 ? '#ff6b6b' : '#51e651';
        const statusColor = item.status === 'Online' ? '#51e651' : '#a0a0a0';

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.personContainer}
            onPress={() => navigation.navigate('Profile', { person: item })}
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
      })}

      {/* Empty State */}
      {filteredCloseFriends.length === 0 && filteredRegularFriends.length === 0 && searchQuery && (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color={isDark ? '#555' : '#ccc'} />
          <Text style={styles.emptyStateText}>No friends found matching "{searchQuery}"</Text>
        </View>
      )}
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
  });

export default FriendsList;

