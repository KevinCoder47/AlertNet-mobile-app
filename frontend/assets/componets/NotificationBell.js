import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  useColorScheme,
  Animated,
  Image,
  Dimensions,
  TextInput,
  ScrollView,
  Vibration,
  SafeAreaView,
  TouchableWithoutFeedback,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNotifications } from '../contexts/NotificationContext';

const { width, height } = Dimensions.get('window');

const NotificationBell = ({ style, iconSize = 24, showProfileInfo = true }) => {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    acceptFriendRequest,
    declineFriendRequest,
    soundEnabled,
    toggleSoundEnabled,
    clearAllNotifications,
  } = useNotifications();

  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('closeFriends');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMenu, setShowMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [sortBy, setSortBy] = useState('time');
  const [filterType, setFilterType] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [allowNotifications, setAllowNotifications] = useState(true);
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);
  
  const badgeAnim = useRef(new Animated.Value(1)).current;
  const bellAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.timing(badgeAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(badgeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      Animated.sequence([
        Animated.timing(bellAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [unreadCount]);

  const getDisplayName = (notification) => {
    const { data = {}, type } = notification;
    
    // For friend_accepted notifications, extract accepter's name
    if (type === 'friend_accepted') {
      const firstName = data.accepterUserData?.Name || 
                       data.accepterName?.split(' ')[0] ||
                       'Unknown';
                       
      const lastName = data.accepterUserData?.Surname || 
                      data.accepterName?.split(' ')[1] ||
                      '';
      
      const displayName = `${firstName} ${lastName}`.trim();
      return displayName !== 'Unknown' ? displayName : 'AlertNet User';
    }
    
    // For all other notification types (friend_request, etc.), extract sender's name
    const firstName = data.senderName || data.senderFirstName || data.senderUserData?.Name || 'Unknown';
    const lastName = data.senderSurname || data.senderLastName || data.senderUserData?.Surname || '';
    const displayName = `${firstName} ${lastName}`.trim();
    return displayName !== 'Unknown' ? displayName : 'AlertNet User';
  };

  const renderProfilePicture = (notification, size = 40) => {
    const { data = {}, type } = notification;
    
    // For friend_accepted, show accepter's profile picture
    let profilePicture;
    let senderName;
    
    if (type === 'friend_accepted') {
      profilePicture = data.accepterUserData?.ImageURL || null;
      senderName = data.accepterUserData?.Name || data.accepterName?.split(' ')[0] || 'U';
    } else {
      // For other notifications, show sender's profile picture
      profilePicture = data.profilePicture || data.senderUserData?.ImageURL || null;
      senderName = data.senderName || data.senderFirstName || 'U';
    }
    
    if (profilePicture && profilePicture.trim() !== '') {
      return (
        <Image
          source={{ uri: profilePicture }}
          style={[styles.profilePicture, { width: size, height: size, borderRadius: size / 2 }]}
        />
      );
    } else {
      const initial = senderName.charAt(0).toUpperCase();
      return (
        <View style={[styles.defaultProfilePicture, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.profileInitial, { fontSize: size * 0.4 }]}>{initial}</Text>
        </View>
      );
    }
  };

  const handleNotificationPress = async (notification) => {
    const isFriendRequest = notification.type === 'friend_request';
    const isUnread = !notification.read;

    if (isFriendRequest && isUnread) {
      // Toggle expansion for unread friend requests
      setExpandedNotificationId(prev => prev === notification.id ? null : notification.id);
    } else {
      // Mark as read and show alert for other notifications
      if (isUnread) {
        await markNotificationAsRead(notification.id);
      }
      Vibration.vibrate(30);

      switch (notification.type) {
        case 'friend_accepted':
          Alert.alert('Friend Request Accepted!', `${getDisplayName(notification)} accepted your friend request.`);
          break;
        case 'sos':
          Alert.alert('🚨 EMERGENCY ALERT', `${getDisplayName(notification)} sent an SOS alert`);
          break;
        default:
          Alert.alert(notification.title || 'Notification', notification.message);
      }
    }
  };

  const handleAcceptFriendRequest = async (notification) => {
    const { requestId } = notification.data || {};
    if (!requestId) return;

    try {
      const result = await acceptFriendRequest(requestId);
      if (result.success) {
        Alert.alert('Success!', `${getDisplayName(notification)} is now your friend.`);
        await markNotificationAsRead(notification.id);
        setExpandedNotificationId(null);
      } else {
        Alert.alert('Error', result.error || 'Failed to accept friend request');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleDeclineFriendRequest = async (notification) => {
    const { requestId } = notification.data || {};
    if (!requestId) return;

    try {
      await declineFriendRequest(requestId);
      await markNotificationAsRead(notification.id);
      setExpandedNotificationId(null);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleMarkAllAsRead = async () => {
    Vibration.vibrate(50);
    await markAllNotificationsAsRead();
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to permanently delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            if (clearAllNotifications) {
              const result = await clearAllNotifications();
              if (result.success) {
                Vibration.vibrate(100);
                Alert.alert('Success', `${result.deletedCount || 0} notifications have been cleared.`);
              } else {
                Alert.alert('Error', result.error || 'Could not clear notifications.');
              }
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    Vibration.vibrate(50);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Now';
    const now = Date.now();
    const time = timestamp.toMillis ? timestamp.toMillis() : timestamp;
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Now';
    if (diffInMinutes < 60) return `${diffInMinutes}min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}hr ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getCalendarDays = () => {
    const days = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    startOfWeek.setDate(today.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      days.push({
        day: currentDate.toLocaleDateString('en-GB', { weekday: 'short' }),
        date: currentDate.getDate(),
        fullDate: currentDate,
      });
    }
    return days;
  };

  const getCalendarMonth = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    
    return { month: months[currentMonth], year: currentYear, days, monthIndex: currentMonth };
  };

  const navigateMonth = (direction) => {
    setSelectedDate(currentDate => {
      const newDate = new Date(currentDate);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };

  const navigateYear = (direction) => {
    setSelectedDate(currentDate => {
      const newDate = new Date(currentDate);
      newDate.setFullYear(newDate.getFullYear() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           selectedDate.getMonth() === today.getMonth() && 
           selectedDate.getFullYear() === today.getFullYear();
  };

  const isSelectedDate = (day) => {
    return day === selectedDate.getDate();
  };

  const filterNotifications = () => {
    let filtered = notifications;
    
    // Date filter
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      filtered = filtered.filter(n => {
        const notificationTime = n.createdAt?.toMillis ? n.createdAt.toMillis() : n.createdAt;
        return notificationTime >= startOfDay.getTime() && notificationTime <= endOfDay.getTime();
      });
    }
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(n => {
        const displayName = getDisplayName(n);
        return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               n.message.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    
    // Sort
    switch (sortBy) {
      case 'priority':
        filtered = filtered.sort((a, b) => {
          if (!a.read && b.read) return -1;
          if (a.read && !b.read) return 1;
          return b.createdAt - a.createdAt;
        });
        break;
      case 'unread':
        filtered = filtered.sort((a, b) => {
          if (!a.read && b.read) return -1;
          if (a.read && !b.read) return 1;
          return b.createdAt - a.createdAt;
        });
        break;
      default:
        filtered = filtered.sort((a, b) => b.createdAt - a.createdAt);
    }
    
    return filtered;
  };

  const filteredNotifications = filterNotifications();
  const newCount = filteredNotifications.filter(n => !n.read).length;

  const renderNotificationItem = (notification) => {
    const isUnread = !notification.read;
    const timeAgo = getTimeAgo(notification.createdAt);
    const displayName = getDisplayName(notification);
    const isFriendRequest = notification.type === 'friend_request';
    const isExpanded = expandedNotificationId === notification.id;
    
    return (
      <View key={notification.id}>
        <TouchableOpacity
          style={[styles.notificationItem, isUnread && styles.unreadNotification]}
          onPress={() => handleNotificationPress(notification)}
          activeOpacity={0.7}
        >
          <View style={styles.notificationContent}>
            <View style={styles.profileSection}>
              {renderProfilePicture(notification, 40)}
            </View>
            
            <View style={styles.contentSection}>
              <View style={styles.headerRow}>
                <Text style={[styles.notificationName, isUnread && styles.unreadText]}>
                  {displayName}
                </Text>
                <Text style={styles.timeText}>{timeAgo}</Text>
              </View>
              <Text style={[styles.notificationMessage, isUnread && styles.unreadMessageText]}>
                {notification.message}
              </Text>
            </View>
            
            {isUnread && <View style={styles.unreadDot} />}
          </View>
        </TouchableOpacity>

        {/* Friend Request Actions */}
        {isExpanded && isFriendRequest && isUnread && (
          <View style={styles.friendRequestActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleDeclineFriendRequest(notification)}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptFriendRequest(notification)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="bell-outline" size={80} color="#4A4A4A" />
      <Text style={styles.emptyTitle}>
        {activeTab === 'closeFriends' ? 'No notifications' : 
         activeTab === 'feed' ? 'No notifications' : 
         'System Notifications'}
      </Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'closeFriends' ? "You're all caught up!" : 
         activeTab === 'feed' ? "You're all caught up!" :
         'Updates, alerts, and other system\nmessages will appear here.'}
      </Text>
    </View>
  );

  const getHeaderTitle = () => {
    const today = new Date();
    if (isSameDay(selectedDate, today)) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(selectedDate, yesterday)) return 'Yesterday';
    return selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  };

  return (
    <>
      <Animated.View style={{ transform: [{ rotate: bellAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-5deg', '5deg']
      }) }] }}>
        <TouchableOpacity
          style={[styles.bellContainer, style]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={unreadCount > 0 ? "notifications" : "notifications-outline"} 
            size={iconSize} 
            color="#FFFFFF"
          />
          {unreadCount > 0 && (
            <Animated.View style={[styles.badge, { transform: [{ scale: badgeAnim }] }]}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{getHeaderTitle()}</Text>
            <View style={styles.headerRight}>
              {doNotDisturb && <Icon name="bell-sleep" size={20} color="#FF6B35" style={{ marginRight: 8 }} />}
              <TouchableOpacity style={styles.headerButton} onPress={() => setShowCalendar(true)}>
                <Icon name="calendar-blank" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={() => setShowMenu(!showMenu)}>
                <Icon name="dots-vertical" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={() => setShowModal(false)}>
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu Dropdown */}
          {showMenu && (
            <View style={styles.menuDropdown}>
              {newCount > 0 && (
                <TouchableOpacity style={styles.menuItem} onPress={handleMarkAllAsRead}>
                  <Icon name="check-all" size={20} color="#FFFFFF" />
                  <Text style={styles.menuItemText}>Mark all as read</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.menuItem} onPress={handleClearAll}>
                <Icon name="delete-sweep" size={20} color="#FF3B30" />
                <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>Clear all</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem} onPress={() => setShowFilters(!showFilters)}>
                <Icon name="filter" size={20} color="#FFFFFF" />
                <Text style={styles.menuItemText}>Filters & Sort</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <View style={styles.toggleItem}>
                <View style={styles.toggleLeft}>
                  <Icon name="bell-sleep" size={20} color="#FFFFFF" />
                  <Text style={styles.menuItemText}>Do Not Disturb</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.toggleSwitch, { backgroundColor: doNotDisturb ? '#4CAF50' : '#3A3A3A' }]}
                  onPress={() => {
                    setDoNotDisturb(!doNotDisturb);
                    Vibration.vibrate(50);
                  }}
                >
                  <View style={[
                    styles.toggleThumb,
                    { transform: [{ translateX: doNotDisturb ? 16 : 2 }] }
                  ]} />
                </TouchableOpacity>
              </View>

              <View style={styles.toggleItem}>
                <View style={styles.toggleLeft}>
                  <Icon name="volume-high" size={20} color="#FFFFFF" />
                  <Text style={styles.menuItemText}>Sound</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.toggleSwitch, { backgroundColor: soundEnabled ? '#4CAF50' : '#3A3A3A' }]}
                  onPress={() => {
                    toggleSoundEnabled(!soundEnabled);
                    Vibration.vibrate(50);
                  }}
                >
                  <View style={[
                    styles.toggleThumb,
                    { transform: [{ translateX: soundEnabled ? 16 : 2 }] }
                  ]} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <View style={styles.filtersPanel}>
              <View style={styles.filtersHeader}>
                <Text style={styles.filtersTitle}>Filters & Sort</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <Icon name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Sort by:</Text>
                <View style={styles.sortButtons}>
                  {[
                    { key: 'time', label: 'Time', icon: 'clock' },
                    { key: 'priority', label: 'Priority', icon: 'alert' },
                    { key: 'unread', label: 'Unread', icon: 'bell' }
                  ].map(sort => (
                    <TouchableOpacity
                      key={sort.key}
                      style={[styles.filterButton, sortBy === sort.key && styles.activeFilterButton]}
                      onPress={() => setSortBy(sort.key)}
                    >
                      <Icon name={sort.icon} size={14} color={sortBy === sort.key ? '#FFFFFF' : '#8E8E93'} />
                      <Text style={[styles.filterButtonText, sortBy === sort.key && styles.activeFilterText]}>
                        {sort.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="magnify" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notifications..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close" size={16} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>

          {/* Pull to Refresh Indicator */}
          {isRefreshing && (
            <View style={styles.refreshingIndicator}>
              <Icon name="refresh" size={20} color="#FF6B35" />
              <Text style={styles.refreshingText}>Refreshing...</Text>
            </View>
          )}

          {/* Calendar */}
          <View style={styles.calendarContainer}>
            <View style={styles.calendar}>
              {getCalendarDays().map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.calendarDay}
                  onPress={() => setSelectedDate(item.fullDate)}
                >
                  <Text style={styles.dayText}>{item.day}</Text>
                  <View style={[
                    styles.dateContainer,
                    isSameDay(item.fullDate, selectedDate) && styles.selectedDateContainer
                  ]}>
                    <Text style={[
                      styles.dateText,
                      isSameDay(item.fullDate, selectedDate) && styles.selectedDateText
                    ]}>
                      {item.date}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tab Buttons */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'closeFriends' && styles.activeTabButton]}
              onPress={() => setActiveTab('closeFriends')}
            >
              <Icon name="account-group" size={16} color="#FFFFFF" />
              {activeTab === 'closeFriends' && <Text style={styles.tabText}>Close Friends</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'feed' && styles.activeTabButton]}
              onPress={() => setActiveTab('feed')}
            >
              <Icon name="view-grid" size={16} color="#FFFFFF" />
              {activeTab === 'feed' && <Text style={styles.tabText}>Feed</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'system' && styles.activeTabButton]}
              onPress={() => setActiveTab('system')}
            >
              <Icon name="cog" size={16} color="#FFFFFF" />
              {activeTab === 'system' && <Text style={styles.tabText}>System</Text>}
            </TouchableOpacity>
          </View>

          {/* Notifications List */}
          <ScrollView 
            style={styles.notificationsList} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#FF6B35" />}
          >
            {filteredNotifications.length === 0 ? (
              renderEmptyState()
            ) : (
              <>
                {newCount > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>New</Text>
                      <TouchableOpacity onPress={handleMarkAllAsRead}>
                        <Text style={styles.markAllText}>Mark all read</Text>
                      </TouchableOpacity>
                    </View>
                    {filteredNotifications.filter(n => !n.read).map(renderNotificationItem)}
                  </>
                )}

                {filteredNotifications.filter(n => n.read).length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Earlier</Text>
                    {filteredNotifications.filter(n => n.read).map(renderNotificationItem)}
                  </>
                )}
              </>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCalendar}
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity style={styles.calendarOverlay} activeOpacity={1} onPress={() => setShowCalendar(false)}>
          <TouchableWithoutFeedback>
            <View style={styles.calendarPopup}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                  <Icon name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.yearNavigation}>
                <TouchableOpacity onPress={() => navigateYear('prev')} style={styles.navButton}>
                  <Icon name="chevron-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.yearText}>{getCalendarMonth().year}</Text>
                <TouchableOpacity onPress={() => navigateYear('next')} style={styles.navButton}>
                  <Icon name="chevron-right" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.monthNavigation}>
                <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
                  <Icon name="chevron-left" size={18} color="#FF6B35" />
                </TouchableOpacity>
                <Text style={styles.monthText}>{selectedDate.toLocaleString('default', { month: 'long' })}</Text>
                <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
                  <Icon name="chevron-right" size={18} color="#FF6B35" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.calendarGrid}>
                <View style={styles.weekDaysRow}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                    <Text key={index} style={styles.weekDayText}>{day}</Text>
                  ))}
                </View>
                
                <View style={styles.datesGrid}>
                  {getCalendarMonth().days.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dateCell,
                        isSelectedDate(day) && styles.selectedDateCell,
                        isToday(day) && !isSelectedDate(day) && styles.todayDateCell
                      ]}
                      onPress={() => {
                        if (day) {
                          setSelectedDate(new Date(getCalendarMonth().year, getCalendarMonth().monthIndex, day));
                          setShowCalendar(false);
                          Vibration.vibrate(30);
                        }
                      }}
                      disabled={!day}
                    >
                      {day && (
                        <Text style={[
                          styles.dateCellText,
                          isSelectedDate(day) && styles.selectedDateText,
                          isToday(day) && !isSelectedDate(day) && styles.todayDateText
                        ]}>
                          {day}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </>
  );
};



const getStyles = (isDark) =>
  StyleSheet.create({
    bellContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: '#FF6B35',
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: '#1A1A1A',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    modalTitle: {
      fontSize: 32,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerButton: {
      padding: 4,
    },
    menuDropdown: {
      backgroundColor: '#2A2A2A',
      borderRadius: 12,
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 8,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      gap: 12,
    },
    menuItemText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '500',
    },
    menuDivider: {
      height: 1,
      backgroundColor: '#3A3A3A',
      marginVertical: 4,
    },
    toggleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    toggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    toggleSwitch: {
      width: 40,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      position: 'relative',
    },
    toggleThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
      position: 'absolute',
    },
    filtersPanel: {
      backgroundColor: '#2A2A2A',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 20,
      marginBottom: 12,
    },
    filtersHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    filtersTitle: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    filterRow: {
      marginBottom: 15,
    },
    filterLabel: {
      color: '#8E8E93',
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
    },
    sortButtons: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: '#3A3A3A',
      gap: 4,
    },
    activeFilterButton: {
      backgroundColor: '#FF6B35',
    },
    filterButtonText: {
      color: '#8E8E93',
      fontSize: 12,
      fontWeight: '500',
    },
    activeFilterText: {
      color: '#FFFFFF',
    },
    refreshingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      gap: 8,
    },
    refreshingText: {
      color: '#FF6B35',
      fontSize: 14,
      fontWeight: '500',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2A2A2A',
      borderRadius: 12,
      paddingHorizontal: 12,
      marginHorizontal: 20,
      marginBottom: 16,
      height: 44,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 16,
      paddingVertical: 12,
    },
    calendarContainer: {
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    calendar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    calendarDay: {
      alignItems: 'center',
      flex: 1,
    },
    dayText: {
      fontSize: 12,
      color: '#8E8E93',
      marginBottom: 6,
    },
    dateContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedDateContainer: {
      backgroundColor: '#FF6B35',
    },
    dateText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    selectedDateText: {
      color: '#FFFFFF',
    },
    tabsContainer: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    tabButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: 'transparent',
      minWidth: 44,
      gap: 6,
    },
    activeTabButton: {
      backgroundColor: '#FF6B35',
      paddingHorizontal: 16,
    },
    tabText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    notificationsList: {
      flex: 1,
      paddingHorizontal: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 12,
    },
    markAllText: {
      color: '#FF6B35',
      fontSize: 13,
      fontWeight: '500',
    },
    notificationItem: {
      backgroundColor: '#2A2A2A',
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginBottom: 8,
    },
    unreadNotification: {
      backgroundColor: '#2D2516',
    },
    notificationContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    profileSection: {
      marginRight: 12,
    },
    profilePicture: {
      borderWidth: 2,
      borderColor: '#3A3A3A',
    },
    defaultProfilePicture: {
      backgroundColor: '#3A3A3A',
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileInitial: {
      fontWeight: '600',
      color: '#FFFFFF',
    },
    contentSection: {
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    notificationName: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
      flex: 1,
    },
    unreadText: {
      color: '#FF6B35',
    },
    timeText: {
      fontSize: 12,
      color: '#8E8E93',
      marginLeft: 8,
    },
    notificationMessage: {
      fontSize: 14,
      color: '#8E8E93',
      lineHeight: 18,
    },
    unreadMessageText: {
      color: '#C7C7C7',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF6B35',
      marginLeft: 8,
      marginTop: 4,
    },
    friendRequestActions: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 14,
      paddingBottom: 14,
      marginTop: -6,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    declineButton: {
      backgroundColor: '#3A3A3A',
    },
    acceptButton: {
      backgroundColor: '#FF6B35',
    },
    declineButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    acceptButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 80,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: '#FFFFFF',
      marginTop: 20,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 16,
      color: '#8E8E93',
      textAlign: 'center',
      lineHeight: 22,
    },
    calendarOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    calendarPopup: {
      backgroundColor: '#2A2A2A',
      borderRadius: 16,
      padding: 20,
      width: width * 0.85,
      maxWidth: 350,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    calendarTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    yearNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
      paddingHorizontal: 10,
    },
    yearText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      minWidth: 60,
      textAlign: 'center',
    },
    monthNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    monthText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FF6B35',
      minWidth: 100,
      textAlign: 'center',
    },
    navButton: {
      padding: 5,
      borderRadius: 8,
      backgroundColor: '#3A3A3A',
      minWidth: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calendarGrid: {
      width: '100%',
    },
    weekDaysRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 10,
    },
    weekDayText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#8E8E93',
      textAlign: 'center',
      width: 30,
    },
    datesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
    },
    dateCell: {
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 5,
      borderRadius: 15,
    },
    selectedDateCell: {
      backgroundColor: '#FF6B35',
    },
    todayDateCell: {
      borderWidth: 1,
      borderColor: '#FF6B35',
    },
    dateCellText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '500',
    },
    selectedDateText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    todayDateText: {
      color: '#FF6B35',
      fontWeight: '600',
    },
  });

export default NotificationBell;