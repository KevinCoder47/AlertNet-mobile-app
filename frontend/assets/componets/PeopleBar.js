import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import PhoneOverlay from './PhoneOverlay'; // <-- import your PhoneOverlay component

const { width, height } = Dimensions.get('window');

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
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
    avatar: require('../images/Unathi.jpg'),
  },
  {
    id: 2,
    name: 'Cheyenne Luthuli',
    location: 'Mayfair West',
    status: 'Offline',
    distance: '23 km away',
    battery: '85%',
    avatar: require('../images/Cheyenne.jpg'),
  },
  {
    id: 3,
    name: 'Mpilonhle Radebe',
    location: 'Lost Location',
    status: 'Online',
    distance: 'Lost Distance',
    battery: '62%',
    avatar: require('../images/Mpilo.jpg'),
  },
  {
    id: 4,
    name: 'Kuhle Mgudlwa',
    location: 'Unknown',
    status: 'Offline',
    distance: 'Unknown',
    battery: '74%',
    avatar: require('../images/Kuhle.jpg'),
  },
  {
    id: 5,
    name: 'Kevin Serakalala',
    location: 'Campus Square',
    status: 'Online',
    distance: '5 m away',
    battery: '88%',
    avatar: require('../images/Kevin.jpg'),
  },
  {
    id: 6,
    name: 'Sphephile Mtshali',
    location: 'Gold Reef City',
    status: 'Offline',
    distance: '10 km away',
    battery: '56%',
    avatar: require('../images/Cheyenne.jpg'),
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

const PeopleBar = ({ onExpand }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [phoneOverlayVisible, setPhoneOverlayVisible] = useState(false);

  // PanResponder for upward scroll detection
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Detect upward swipe (negative dy)
        if (gestureState.dy < -50) {
          onExpand();
        }
      },
    })
  ).current;

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setRefreshing(false);
    }, 1500);
  };

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <BlurView
        intensity={70}
        tint={isDark ? 'dark' : 'light'}
        style={styles.container}
      >
        <View style={styles.glassOverlay} />

        <View
          {...panResponder.panHandlers}
          style={styles.dragHandleContainer}
        >
          <View style={styles.dragHandle} />
          <Text style={styles.swipeHint}>Swipe up to expand</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.headerText}>People</Text>
          <Text style={styles.lastUpdatedText}>
            Last updated: {formatTime(lastUpdated)}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {peopleData.map((person, index) => {
            const batteryIcon = getBatteryIconName(person.battery);
            const batteryLevel = parseInt(person.battery);
            const batteryColor = batteryLevel < 20 ? '#ff6b6b' : '#51e651';
            const batteryTextColor =
              isDark || batteryColor === '#ff6b6b' ? batteryColor : '#2e7d32';
            const statusColor = person.status === 'Online' ? '#51e651' : '#a0a0a0';
            const isLast = index === peopleData.length - 1;

            return (
              <TouchableOpacity
                key={person.id}
                style={[
                  styles.personContainer,
                  isLast ? { borderBottomWidth: 0 } : null,
                ]}
              >
                <View style={styles.avatarSection}>
                  <Image source={person.avatar} style={styles.avatar} />
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: statusColor,
                        borderColor: '#fff',
                      },
                    ]}
                  />

                  <View style={styles.batteryBelowAvatar}>
                    <Ionicons name={batteryIcon} size={12} color={batteryTextColor} />
                    <Text style={[styles.batteryTextUnder, { color: batteryTextColor }]}>
                      {' '}
                      {person.battery}{' '}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personLocation}>{person.location}</Text>

                  <View style={styles.statusRow}>
                    <Text style={[styles.personStatus, { color: statusColor }]}>
                      {' '}
                      {person.status}{' '}
                    </Text>
                    <Text style={styles.divider}>•</Text>
                    <Text style={styles.personDistance}>{person.distance}</Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isDark ? '#ccc' : '#555'}
                  style={styles.profileArrow}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setPhoneOverlayVisible(true)} // show PhoneOverlay directly
        >
          <Text style={styles.addButtonText}>+ add</Text>
        </TouchableOpacity>
      </BlurView>

      {/* PhoneOverlay component */}
      <PhoneOverlay
        visible={phoneOverlayVisible}
        onClose={() => setPhoneOverlayVisible(false)}
      />
    </>
  );
};

const getStyles = (isDark) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 60,
      height: height * 0.33,
      width: width * 0.95,
      alignSelf: 'center',
      zIndex: 20,
      padding: 10,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
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
    lastUpdatedText: {
      fontSize: 10,
      color: isDark ? '#aaa' : '#666',
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
      justifyContent: 'center',
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
    profileArrow: {
      marginLeft: 10,
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
  });

export default PeopleBar;


