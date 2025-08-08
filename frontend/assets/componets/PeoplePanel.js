import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Dimensions,
  LayoutAnimation,
  PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import SearchBar from './SearchBar';
import FriendsList from './FriendsList';
import CommunityList from './CommunityList';
import FeedList from './FeedList';
import PhoneOverlay from './PhoneOverlay'; // Import your overlay component

const { height, width } = Dimensions.get('window');

const PeoplePanel = ({ onCollapse }) => {
  const isDark = useColorScheme() === 'dark';
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('Friends');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isPhoneOverlayVisible, setPhoneOverlayVisible] = useState(false);

  // PanResponder for downward scroll detection
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Detect downward swipe (positive dy)
        if (gestureState.dy > 50) {
          handleCollapse();
        }
      },
    })
  ).current;

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onCollapse();
  };

  const styles = getStyles(isDark);

  const handleRefresh = () => {
    setLastUpdated(new Date());
  };

  const openPhoneOverlay = () => {
    setPhoneOverlayVisible(true);
  };

  const closePhoneOverlay = () => {
    setPhoneOverlayVisible(false);
  };

  return (
    <>
      <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={styles.panel}>
        <View style={styles.glassOverlay} />

        <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
          <Text style={styles.swipeHint}>Swipe down to collapse</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.headerText}>People</Text>
          <Text style={styles.lastUpdatedText}>Last updated: {formatTime(lastUpdated)}</Text>
        </View>

        <SearchBar value={search} onChange={setSearch} />

        <View style={styles.tabRow}>
          {['Friends', 'Community', 'Feed'].map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setTab(item)}
              style={[
                styles.tabButton,
                tab === item && {
                  borderBottomColor: '#ff8c00',
                  borderBottomWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isDark ? '#fff' : '#222' },
                  tab === item && { fontWeight: 'bold', color: '#ff8c00' },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {tab === 'Friends' && (
            <FriendsList searchQuery={search} onRefreshComplete={handleRefresh} />
          )}
          {tab === 'Community' && <CommunityList onRefreshComplete={handleRefresh} />}
          {tab === 'Feed' && <FeedList onRefreshComplete={handleRefresh} />}
        </View>

        {tab !== 'Feed' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (tab === 'Friends') {
                openPhoneOverlay();
              }
              // Community add button does nothing
            }}
          >
            <Text style={styles.addButtonText}>+ add</Text>
          </TouchableOpacity>
        )}
      </BlurView>

      {/* PhoneOverlay modal */}
      <PhoneOverlay visible={isPhoneOverlayVisible} onClose={closePhoneOverlay} />
    </>
  );
};

const getStyles = (isDark) =>
  StyleSheet.create({
    panel: {
      position: 'absolute',
      bottom: 60,
      width: width * 0.95,
      height: height * 0.6,
      alignSelf: 'center',
      borderRadius: 18,
      padding: 10,
      overflow: 'hidden',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 10,
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
      borderRadius: 2,
      backgroundColor: isDark ? '#e0e0e0' : '#333',
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
    tabRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? '#555' : '#ccc',
      paddingTop: 4,
    },
    tabButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    tabText: {
      fontSize: 14,
    },
    content: {
      flex: 1,
      paddingHorizontal: 8,
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

export default PeoplePanel;






