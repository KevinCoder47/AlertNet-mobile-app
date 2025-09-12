import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const getBatteryIconName = (batteryPercentStr) => {
  const percent = parseInt(batteryPercentStr);
  if (isNaN(percent)) return 'battery-dead';
  if (percent >= 80) return 'battery-full';
  if (percent >= 50) return 'battery-half';
  if (percent >= 20) return 'battery-low';
  return 'battery-dead';
};

const FriendList = ({ friendsData = [] }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);
  const navigation = useNavigation();

  const renderFriendItem = ({ item: friend, index }) => {
    const batteryIcon = getBatteryIconName(friend.battery);
    const batteryLevel = parseInt(friend.battery);
    const batteryColor = batteryLevel < 20 ? '#ff6b6b' : '#51e651';
    const statusColor = friend.status === 'Online' ? '#51e651' : '#a0a0a0';
    const isLast = index === friendsData.length - 1;

    return (
      <TouchableOpacity
        style={[styles.friendContainer, isLast && { borderBottomWidth: 0 }]}
        onPress={() => {
          navigation.navigate('Profile', { 
            person: {
              ...friend,
              id: friend.friendId || friend.id,
              name: friend.name,
              phone: friend.phone,
              email: friend.email,
              avatar: friend.avatar,
            }
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.avatarSection}>
          {friend.avatar ? (
            <Image source={{ uri: friend.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Text style={styles.avatarInitial}>
                {friend.name ? friend.name.charAt(0).toUpperCase() : 'F'}
              </Text>
            </View>
          )}
          
          {/* Online status indicator */}
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          
          {/* Battery indicator */}
          <View style={styles.batteryInfo}>
            <Ionicons name={batteryIcon} size={12} color={batteryColor} />
            <Text style={[styles.batteryText, { color: batteryColor }]}>{friend.battery}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.friendName} numberOfLines={1}>{friend.name}</Text>
          <Text style={styles.friendLocation} numberOfLines={1}>{friend.location}</Text>
          <View style={styles.statusRow}>
            <Text style={[styles.friendStatus, { color: statusColor }]}>{friend.status}</Text>
            <Text style={styles.divider}>•</Text>
            <Text style={styles.friendDistance} numberOfLines={1}>{friend.distance}</Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => {
              // Navigate to messaging or call feature
              console.log('Message friend:', friend.name);
            }}
          >
            <Ionicons name="chatbubble" size={18} color={isDark ? '#007AFF' : '#007AFF'} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.callButton}
            onPress={() => {
              // Initiate call to friend
              console.log('Call friend:', friend.phone);
            }}
          >
            <Ionicons name="call" size={18} color={isDark ? '#34C759' : '#34C759'} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={isDark ? '#666' : '#ccc'} />
      <Text style={styles.emptyStateText}>No friends connected</Text>
      <Text style={styles.emptyStateSubtext}>
        Your accepted friends will appear here with their live status
      </Text>
    </View>
  );

  if (friendsData.length === 0) {
    return renderEmptyState();
  }

  return (
    <FlatList
      data={friendsData}
      renderItem={renderFriendItem}
      keyExtractor={(item) => item.id || item.friendId}
      showsVerticalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.listContent}
    />
  );
};

const getStyles = (isDark) => StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 10,
  },
  friendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: isDark ? '#444' : '#e0e0e0',
  },
  avatarSection: {
    position: 'relative',
    marginRight: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: isDark ? '#555' : '#e0e0e0',
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: isDark ? '#555' : '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: isDark ? '#666' : '#d0d0d0',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDark ? '#fff' : '#333',
  },
  statusDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: isDark ? '#000' : '#fff',
  },
  batteryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
  },
  batteryText: { 
    fontSize: 10, 
    marginLeft: 2,
    fontWeight: '600',
  },
  infoSection: { 
    flex: 1, 
    justifyContent: 'center',
    marginRight: 10,
  },
  friendName: {
    fontWeight: '700',
    fontSize: 16,
    color: isDark ? 'white' : '#111',
    marginBottom: 3,
  },
  friendLocation: {
    fontSize: 13,
    color: isDark ? '#b0b0b0' : '#666',
    marginBottom: 2,
  },
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  friendStatus: { 
    fontSize: 12, 
    fontWeight: '600',
  },
  divider: { 
    color: isDark ? '#777' : '#999', 
    marginHorizontal: 6,
    fontSize: 12,
  },
  friendDistance: { 
    fontSize: 12, 
    color: isDark ? '#a0a0a0' : '#777',
    flex: 1,
    fontWeight: '500',
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? 'rgba(0,122,255,0.2)' : 'rgba(0,122,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? 'rgba(52,199,89,0.2)' : 'rgba(52,199,89,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#ccc' : '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: isDark ? '#999' : '#888',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FriendList;