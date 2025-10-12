import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  TextInput,
  Animated,
  Vibration,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableWithoutFeedback,
  Pressable,
  Linking,
} from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { FirebaseService } from '../../backend/Firebase/FirebaseService';
import { useFontSize } from '../contexts/FontSizeContext';
import { useTheme } from '../contexts/ColorContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < 60) return 'Now';
  
  const intervals = { yr: 31536000, mo: 2592000, d: 86400, hr: 3600, min: 60 };
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = seconds / secondsInUnit;
    if (interval > 1) {
      return `${Math.floor(interval)}${unit} ago`;
    }
  }
  return `${Math.floor(seconds)}s ago`;
};

const tabCategories = {
  closeFriends: ['sos', 'sos_resolved', 'friend_request', 'friend_accepted', 'safety_request', 'check_in', 'danger_zone', 'inactive', 'location_stop'],
  feed: ['utilities_issues', 'fire_alert', 'protest_alert', 'safety_crime', 'lost_found', 'help_request'],
  system: ['info', 'beta', 'subscription', 'updates', 'reports', 'welcome']
};

const NotificationsPopup = ({ setIsNotification, userData, onViewLocation, onOpenChat, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications }) => {
  const { getScaledFontSize } = useFontSize();
  const themeContext = useTheme();
  const colors = themeContext.colors;
  
  const [activeTab, setActiveTab] = React.useState('closeFriends');
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [showMenu, setShowMenu] = React.useState(false);
  const [allowNotifications, setAllowNotifications] = React.useState(true);
  const { 
    acceptFriendRequest, 
    declineFriendRequest,
    playNotificationByType 
  } = useNotifications();

  // New state for enhanced features
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedNotifications, setSelectedNotifications] = React.useState([]);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [sortBy, setSortBy] = React.useState('time');
  const [filterType, setFilterType] = React.useState('all');
  const [doNotDisturb, setDoNotDisturb] = React.useState(false);
  const [dndStartTime, setDndStartTime] = React.useState('22:00');
  const [dndEndTime, setDndEndTime] = React.useState('07:00');
  const [notificationSettings, setNotificationSettings] = React.useState({
    safety: { enabled: true, sound: 'high' },
    emergency: { enabled: true, sound: 'urgent' },
    general: { enabled: true, sound: 'normal' }
  });
  const [showFilters, setShowFilters] = React.useState(false);
  const [fontSize, setFontSize] = React.useState('medium');
  const [showCalendar, setShowCalendar] = React.useState(false);
  
  const [expandedNotificationId, setExpandedNotificationId] = React.useState(null);
  // State for real notifications
  const [allNotifications, setAllNotifications] = React.useState([]);
  const [closeFriendsNotifications, setCloseFriendsNotifications] = React.useState([]);
  const [feedNotifications, setFeedNotifications] = React.useState([]);
  const [systemNotifications, setSystemNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Get styles with font scaling and theme
  const styles = getStyles(getScaledFontSize, colors);

  const fetchNotifications = React.useCallback(() => {
    if (userData && (userData.phone || userData.Phone || userData.phoneNumber)) {
      const userPhone = userData.phone || userData.Phone || userData.phoneNumber;
      
      const unsubscribe = FirebaseService.listenToNotifications(userPhone, ({ notifications, error }) => {
        if (error) {
          console.error("Error fetching notifications:", error);
          setLoading(false);
          setIsRefreshing(false); // Stop refreshing indicator on error
          return;
        }
        
        const transformedNotifications = notifications.map(n => {
          const isUrgent = n.priority === 'high' || n.isUrgent === true;
          const timestamp = n.createdAt?.toDate ? n.createdAt.toDate().getTime() : Date.now();
          
          return {
              id: n.id,
              type: n.type,
              category: n.data?.category || 'general',
              name: n.data?.senderName || n.title,
              message: n.message, // This is the main message content
              time: formatTimeAgo(timestamp),
              timestamp: timestamp,
              status: n.read ? 'read' : 'new',
              isUrgent: isUrgent,
              location: n.data?.location || null,
              phone: n.data?.senderPhone || null,
              senderId: n.data?.senderId || null,
              profilePicture: n.data?.profilePicture || null,
              data: n.data, // Pass the whole data object for actions
          };
        });

        const friends = [];
        const feed = [];
        const system = [];

        transformedNotifications.forEach(n => {
          if (tabCategories.feed.includes(n.type)) {
            feed.push(n);
          } else if (tabCategories.system.includes(n.type)) {
            system.push(n);
          } else {
            friends.push(n);
          }
        });
        
        setAllNotifications(transformedNotifications);
        setCloseFriendsNotifications(friends);
        setFeedNotifications(feed);
        setSystemNotifications(system);
        setLoading(false);
        setIsRefreshing(false); // Stop refreshing indicator on success
      });

      return unsubscribe;
    } else {
      setLoading(false);
      setIsRefreshing(false);
      return () => {}; // Return an empty function if no user data
    }
  }, [userData]); // Dependency on userData

  // Listen for notifications from Firebase
  React.useEffect(() => {
    setLoading(true);
    const unsubscribe = fetchNotifications();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchNotifications]);
  
  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // Enhanced filtering and sorting functions
  const filterNotifications = (notifs) => {
    let filtered = notifs;
    
    // Date filter
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      filtered = filtered.filter(n => {
        const notificationDate = new Date(n.timestamp);
        return notificationDate >= startOfDay && notificationDate <= endOfDay;
      });
    }
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.category === filterType);
    }
    
    // Sort
    switch (sortBy) {
      case 'priority':
        filtered = filtered.sort((a, b) => {
          if (a.isUrgent && !b.isUrgent) return -1;
          if (!a.isUrgent && b.isUrgent) return 1;
          return b.timestamp - a.timestamp;
        });
        break;
      case 'unread':
        filtered = filtered.sort((a, b) => {
          const aRead = a.status === 'read';
          const bRead = b.status === 'read';
          if (!aRead && bRead) return -1;
          if (aRead && !bRead) return 1;
          return b.timestamp - a.timestamp;
        });
        break;
      default:
        filtered = filtered.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    return filtered;
  };

  // Get notification counts for badges
  const getNotificationCounts = () => {
    const closeFriendsUnread = closeFriendsNotifications.filter(n => n.status === 'new').length;
    const feedUnread = feedNotifications.filter(n => n.status === 'new').length;
    
    return { closeFriends: closeFriendsUnread, feed: feedUnread, system: 0 };
  };

  // Pull to refresh functionality
  const handleRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    Vibration.vibrate(50);
    fetchNotifications(); // This will now re-fetch the data
  }, [fetchNotifications]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    if (!userData || !(userData.phone || userData.Phone || userData.phoneNumber)) {
      console.error('User data not available');
      return;
    }
  
    try {
      const userPhone = userData.phone || userData.Phone || userData.phoneNumber;
      await FirebaseService.markNotificationAsRead(userPhone, notificationId);
      Vibration.vibrate(30);
      
      // Collapse any expanded notification when it's marked as read
      if (expandedNotificationId === notificationId) {
        setExpandedNotificationId(null);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

const handleAccept = async (notification) => {
  if (!notification?.data?.requestId) {
    Alert.alert('Error', 'Invalid friend request data');
    return;
  }

  try {
    const result = await acceptFriendRequest(notification.data.requestId);
    
    if (result.success) {
      Alert.alert('Friend Added!', `${notification.name} is now your friend.`);
      Vibration.vibrate(100);      
      // Mark as read after accepting      
      await markNotificationAsRead(notification.id);
      
      // Collapse the expanded notification
      setExpandedNotificationId(null);
    } else {
      Alert.alert('Error', result.error || 'Could not accept friend request.');
    }
  } catch (error) {
    console.error('Error accepting friend request:', error);
    Alert.alert('Error', 'An error occurred while accepting the friend request.');
  }
};

const handleDecline = async (notification) => {
  if (!notification?.data?.requestId) {
    Alert.alert('Error', 'Invalid friend request data');
    return;
  }

  try {
    const result = await declineFriendRequest(notification.data.requestId);
    
    if (result.success) {
      Vibration.vibrate(50);
      // Mark as read after declining      
      await markNotificationAsRead(notification.id);
      
      // Collapse the expanded notification
      setExpandedNotificationId(null);
    } else {
      Alert.alert('Error', result.error || 'Could not decline friend request.');
    }
  } catch (error) {
    console.error('Error declining friend request:', error);
    Alert.alert('Error', 'An error occurred while declining the friend request.');
  }
};

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      Vibration.vibrate(50);
      
      // Get all unread notifications from the current tab
      const unreadNotifications = currentNotifications.filter(n => n.status === 'new');
      if (unreadNotifications.length === 0) {
        Alert.alert('Info', 'All notifications are already read.');
        return;
      }
      
      await markAllNotificationsAsRead();
      
      Alert.alert('Success', `${unreadNotifications.length} notification${unreadNotifications.length > 1 ? 's' : ''} marked as read.`);
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Could not mark all notifications as read.');
    }
  };
  
  
  // Clear all notifications
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

  // Delete notification
  const deleteNotification = (notificationId) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Vibration.vibrate(100);
          }
        }
      ]
    );
  };

  // Quick actions for notifications
  const handleQuickAction = (notification, action) => {
    Vibration.vibrate(50);
    
    switch (action) {
      case 'call':
        if (notification.phone) {
          const phoneNumber = `tel:${notification.phone}`;
          Linking.canOpenURL(phoneNumber)
            .then(supported => {
              if (supported) {
                Linking.openURL(phoneNumber);
              } else {
                Alert.alert('Call Failed', 'Unable to make phone calls on this device.');
              }
            });
        }
        break;
      case 'respond':
        if (onOpenChat) {
          const personData = {
            id: notification.senderId,
            senderId: notification.senderId,
            name: notification.name,
            phone: notification.phone,
            profilePicture: notification.profilePicture,
            data: notification.data,
          };
          onOpenChat(personData, 'NotificationsPopup'); // Pass the origin
          setIsNotification(false);
        } else {
          Alert.alert('Quick Response', 'Response sent!');
        }
        break;
      case 'location':
        if (notification.location && onViewLocation) {
          onViewLocation(notification);
          setIsNotification(false);
        } else {
          Alert.alert('Location Unavailable', `Could not retrieve location for ${notification.name}.`);
        }
        break;
      case 'dismiss':
        handleMarkAsRead(notification.id);
        break;
    }
  };

  // Selection mode functions
  const toggleSelection = (notificationId) => {
    if (selectedNotifications.includes(notificationId)) {
      setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId));
    } else {
      setSelectedNotifications([...selectedNotifications, notificationId]);
    }
    Vibration.vibrate(30);
  };

  const handleBulkAction = (action) => {
    switch (action) {
      case 'markRead':
        if (markNotificationAsRead) {
          selectedNotifications.forEach(id => markNotificationAsRead(id));
        }
        break;
      case 'delete':
        break;
    }
    setSelectedNotifications([]);
    setIsSelectionMode(false);
    Vibration.vibrate(100);
  };

  const getFontSize = () => {
    switch (fontSize) {
      case 'small': return { name: getScaledFontSize(12), message: getScaledFontSize(11), time: getScaledFontSize(10) };
      case 'large': return { name: getScaledFontSize(16), message: getScaledFontSize(15), time: getScaledFontSize(14) };
      default: return { name: getScaledFontSize(14), message: getScaledFontSize(13), time: getScaledFontSize(12) };
    }
  };

  const getCalendarDays = () => {
    const days = [];
    const today = new Date(selectedDate);
    const dayOfWeek = today.getDay();

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      
      days.push({
        day: currentDate.toLocaleDateString('en-GB', { weekday: 'short' }),
        date: currentDate.getDate(),
        fullDate: currentDate,
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
      });
    }
    return days;
  };

  const getCalendarMonth = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
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

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           selectedDate.getMonth() === today.getMonth() && 
           selectedDate.getFullYear() === today.getFullYear();
  };

  const isSelectedDate = (day) => {
    return day === selectedDate.getDate();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'safety_request': return 'shield-alert';
      case 'check_in': return 'account-question';
      case 'sos': return 'alert-circle';
      case 'sos_resolved': return 'shield-check';
      case 'danger_zone': return 'map-marker-alert';
      case 'inactive': return 'clock-alert';
      case 'location_stop': return 'map-marker-off';
      case 'utilities_issues': return 'wrench';
      case 'fire_alert': return 'fire';
      case 'protest_alert': return 'account-group';
      case 'safety_crime': return 'shield-alert';
      case 'lost_found': return 'magnify';
      case 'help_request': return 'help-circle';
      default: return 'bell';
    }
  };

  const getStatusColor = (notification) => {
    if (notification.isUrgent) return colors.danger;
    if (notification.status === 'read') return colors.textTertiary;
    return '#FF6B35';
  };

  const getIconBackgroundColor = (notification) => {
    if (notification.isUrgent) return colors.danger + '20';
    return colors.iconBackground;
  };

  const getHeaderTitle = () => {
    if (isSelectionMode) {
      return `${selectedNotifications.length} selected`;
    }
    const today = new Date();
    if (isSameDay(selectedDate, today)) {
      return 'Today';
    }
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(selectedDate, yesterday)) {
      return 'Yesterday';
    }
    return selectedDate.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long'
    });
  };

  const counts = getNotificationCounts();
  const currentNotifications = activeTab === 'closeFriends' 
    ? filterNotifications(closeFriendsNotifications) 
    : filterNotifications(feedNotifications);

  const renderNotificationItem = (notification) => {
    const isRead = notification.status === 'read';
    const isSelected = selectedNotifications.includes(notification.id);
    const isFriendRequest = notification.type === 'friend_request';
    const fonts = getFontSize();

    const isExpanded = expandedNotificationId === notification.id;
    return (
      <View key={notification.id} style={styles.notificationContainer}>
        <TouchableOpacity 
          style={[
            styles.notificationItem,
            isRead && styles.readNotification,
            isSelected && styles.selectedNotification
          ]}
          onPress={() => {
            if (isSelectionMode) { // If in selection mode, toggle selection
              toggleSelection(notification.id);
            } else if (isFriendRequest && !isRead) { // If it's an unread friend request, expand it
              // Toggle expansion for friend requests
              setExpandedNotificationId(prevId => prevId === notification.id ? null : notification.id);
            } else { // For any other case (read notifications, non-friend-requests)
              // Mark as read if it's not already
              if (!isRead) {
                handleMarkAsRead(notification.id);
              }
            }
          }}
          onLongPress={() => {
            setIsSelectionMode(true);
            toggleSelection(notification.id);
          }}
        >
          {isSelectionMode && (
            <View style={styles.selectionCheckbox}>
              <Icon 
                name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                size={20} 
                color={isSelected ? '#FF6B35' : colors.textSecondary} 
              />
            </View>
          )}
          
          <View style={styles.notificationContent}>
            <View style={styles.notificationLeft}>
              {notification.profilePicture ? (
                <Image
                  source={{ uri: notification.profilePicture }}
                  style={styles.profilePicture}
                />
              ) : (
                <View style={[styles.iconContainer, { backgroundColor: getIconBackgroundColor(notification) }]}>
                  <Icon 
                    name={getNotificationIcon(notification.type)} 
                    size={16} 
                    color={getStatusColor(notification)} 
                  />
                </View>
              )}
              <View style={styles.notificationText}>
                <Text style={[styles.notificationName, { fontSize: fonts.name }]}>
                  {notification.name}: <Text style={[styles.notificationMessage, { fontSize: fonts.message }]}>{notification.message}</Text>
                </Text>
                {notification.status === 'contacted_sms' && (
                  <Text style={styles.statusText}>I've contacted EMS</Text>
                )}
              </View>
            </View>
            <View style={styles.notificationRight}>
              <Text style={[styles.notificationTime, { fontSize: fonts.time }]}>
                {notification.time}
              </Text>
              {!isRead && <View style={styles.newIndicator} />}
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Friend Request Actions */}
        {isExpanded && !isSelectionMode && isFriendRequest && !isRead && ( // Render when expanded
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, styles.declineAction]}
              onPress={() => handleDecline(notification)}
            >
              <Text style={styles.actionButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionButton, styles.acceptAction]} onPress={() => handleAccept(notification)}>
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Quick Actions */}
        {!isSelectionMode && notification.isUrgent && (
          <View style={styles.quickActions}>
            {notification.phone && (
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(notification, 'call')}
              >
                <Icon name="phone" size={16} color={colors.background} />
              </TouchableOpacity>
            )}
            {notification.location && (
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(notification, 'location')}
              >
                <Icon name="map-marker" size={16} color={colors.background} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleQuickAction(notification, 'respond')}
            >
              <Icon name="message-reply" size={16} color={colors.background} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={() => setIsNotification(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => {
          setIsNotification(false);
          setShowMenu(false);
        }}
      >
        <Pressable style={styles.popupContainer} onPress={null}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {getHeaderTitle()}
            </Text>
            <View style={styles.headerRight}>
              {isSelectionMode ? (
                <>
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={() => handleBulkAction('markRead')}
                  >
                    <Icon name="check-all" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={() => handleBulkAction('delete')}
                  >
                    <Icon name="delete" size={24} color={colors.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={() => {
                      setIsSelectionMode(false);
                      setSelectedNotifications([]);
                    }}
                  >
                    <Icon name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {doNotDisturb && <Icon name="bell-sleep" size={20} color="#FF6B35" />}
                  <TouchableOpacity 
                    style={styles.calendarIconButton}
                    onPress={() => setShowCalendar(true)}
                  >
                    <Icon name="calendar" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.menuButton}
                    onPress={() => setShowMenu(!showMenu)}
                  >
                    <Icon name="dots-vertical" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsNotification(false)}>
                    <Icon name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Enhanced Menu Dropdown */}
          {showMenu && (
            <View style={styles.menuDropdown}>
              <TouchableOpacity style={styles.menuItem} onPress={handleMarkAllAsRead}>
                <Icon name="check-all" size={20} color={colors.text} />
                <Text style={styles.menuItemText}>Mark all as read</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem} onPress={handleClearAll}>
                <Icon name="delete-sweep" size={20} color={colors.danger} />
                <Text style={[styles.menuItemText, { color: colors.danger }]}>Clear all</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem} onPress={() => setShowFilters(!showFilters)}>
                <Icon name="filter" size={20} color={colors.text} />
                <Text style={styles.menuItemText}>Filters & Sort</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem}>
                <Icon name="cog" size={20} color={colors.text} />
                <Text style={styles.menuItemText}>Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem}>
                <Icon name="help-circle" size={20} color={colors.text} />
                <Text style={styles.menuItemText}>Help</Text>
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <View style={styles.notificationToggleItem}>
                <View style={styles.notificationToggleLeft}>
                  <Icon name="bell-sleep" size={20} color={colors.text} />
                  <Text style={styles.menuItemText}>Do Not Disturb</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.toggleSwitch, { backgroundColor: doNotDisturb ? colors.success : colors.iconBackground }]}
                  onPress={() => {
                    setDoNotDisturb(!doNotDisturb);
                    Vibration.vibrate(50);
                  }}
                >
                  <View style={[
                    styles.toggleThumb,
                    { 
                      transform: [{ translateX: doNotDisturb ? 16 : 2 }],
                      backgroundColor: doNotDisturb ? '#FFFFFF' : colors.textTertiary
                    }
                  ]} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.notificationToggleItem}>
                <View style={styles.notificationToggleLeft}>
                  <Icon name="bell" size={20} color={colors.text} />
                  <Text style={styles.menuItemText}>Allow notifications</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.toggleSwitch, { backgroundColor: allowNotifications ? colors.success : colors.iconBackground }]}
                  onPress={() => {
                    setAllowNotifications(!allowNotifications);
                    Vibration.vibrate(50);
                  }}
                >
                  <View style={[
                    styles.toggleThumb,
                    { 
                      transform: [{ translateX: allowNotifications ? 16 : 2 }],
                      backgroundColor: allowNotifications ? '#FFFFFF' : colors.textTertiary
                    }
                  ]} />
                </TouchableOpacity>
              </View>

              {/* Font Size Adjustment */}
              <View style={styles.menuDivider} />
              <Text style={styles.menuSectionTitle}>Font Size</Text>
              <View style={styles.fontSizeContainer}>
                {['small', 'medium', 'large'].map(size => (
                  <TouchableOpacity 
                    key={size}
                    style={[styles.fontSizeButton, fontSize === size && styles.activeFontSize]}
                    onPress={() => setFontSize(size)}
                  >
                    <Text style={[styles.fontSizeText, fontSize === size && styles.activeFontSizeText]}>
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <View style={styles.filtersPanel}>
              <View style={styles.filtersHeader}>
                <Text style={styles.filtersTitle}>Filters & Sort</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <Icon name="close" size={20} color={colors.text} />
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
                      <Icon name={sort.icon} size={14} color={sortBy === sort.key ? '#FFFFFF' : colors.textSecondary} />
                      <Text style={[styles.filterButtonText, sortBy === sort.key && styles.activeFilterText]}>
                        {sort.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Filter by:</Text>
                <View style={styles.sortButtons}>
                  {[
                    { key: 'all', label: 'All', icon: 'view-list' },
                    { key: 'safety', label: 'Safety', icon: 'shield' },
                    { key: 'emergency', label: 'Emergency', icon: 'alert-circle' },
                    { key: 'general', label: 'General', icon: 'information' }
                  ].map(filter => (
                    <TouchableOpacity
                      key={filter.key}
                      style={[styles.filterButton, filterType === filter.key && styles.activeFilterButton]}
                      onPress={() => setFilterType(filter.key)}
                    >
                      <Icon name={filter.icon} size={14} color={filterType === filter.key ? '#FFFFFF' : colors.textSecondary} />
                      <Text style={[styles.filterButtonText, filterType === filter.key && styles.activeFilterText]}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="magnify" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notifications..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Icon name="close" size={16} color={colors.textSecondary} />
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
              {getCalendarDays().map((item) => (
                <TouchableOpacity 
                  key={item.date} 
                  style={styles.calendarDay}
                  onPress={() => setSelectedDate(item.fullDate)}
                >
                  <Text style={[
                    styles.dayText, 
                    { color: item.isWeekend ? '#FF6B35' : colors.textSecondary }
                  ]}>
                    {item.day}
                  </Text>
                  <View style={[
                    styles.dateContainer,
                    isSameDay(item.fullDate, selectedDate) && styles.todayContainer
                  ]}>
                    <Text style={[
                      styles.dateText,
                      { color: isSameDay(item.fullDate, selectedDate) ? '#FFFFFF' : colors.text }
                    ]}>
                      {item.date}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Tab Buttons with Badge Counts */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity 
                style={[
                  styles.tabButton, 
                  activeTab === 'closeFriends' && styles.activeTabButton
                ]}
                onPress={() => setActiveTab('closeFriends')}
              >
                <Icon 
                  name="account-group" 
                  size={16} 
                  color={activeTab === 'closeFriends' ? '#FFFFFF' : colors.textSecondary} 
                />
                {activeTab === 'closeFriends' && (
                  <Text style={styles.activeTabText}>Close Friends</Text>
                )}
                {counts.closeFriends > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{counts.closeFriends}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.tabButton,
                  activeTab === 'feed' && styles.activeTabButton
                ]}
                onPress={() => setActiveTab('feed')}
              >
                <Icon 
                  name="view-grid" 
                  size={16} 
                  color={activeTab === 'feed' ? '#FFFFFF' : colors.textSecondary} 
                />
                {activeTab === 'feed' && (
                  <Text style={styles.activeTabText}>Feed</Text>
                )}
                {counts.feed > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{counts.feed}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.tabButton,
                  activeTab === 'system' && styles.activeTabButton
                ]}
                onPress={() => setActiveTab('system')}
              >
                <Icon 
                  name="cog" 
                  size={16} 
                  color={activeTab === 'system' ? '#FFFFFF' : colors.textSecondary} 
                />
                {activeTab === 'system' && (
                  <Text style={styles.activeTabText}>System</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications List */}
          <ScrollView 
            style={styles.notificationsList} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#FF6B35" />}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 50 }} />
            ) : activeTab === 'closeFriends' || activeTab === 'feed' ? (
                <>
                  {currentNotifications.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Icon name="bell-outline" size={48} color={colors.textSecondary} />
                      <Text style={styles.emptyStateTitle}>No notifications</Text>
                      <Text style={styles.emptyStateText}>
                        {searchQuery ? 'No notifications match your search' : 'You\'re all caught up!'}
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* New Section */}
                      {currentNotifications.filter(n => n.status === 'new').length > 0 && (
                        <>
                          <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>New</Text>
                            <TouchableOpacity 
                              style={styles.markAllButton} // This is the button you wanted to make functional
                              onPress={handleMarkAllAsRead}
                            >
                              <Text style={styles.markAllText}>Mark all read</Text>
                            </TouchableOpacity>
                          </View>
                          {currentNotifications
                            .filter(n => n.status === 'new')
                            .map(renderNotificationItem)}
                        </>
                      )}

                      {/* Urgent Section */}
                      {currentNotifications.filter(n => n.isUrgent).length > 0 && (
                        <>
                          <Text style={[styles.sectionTitle, { marginTop: 20, color: colors.danger }]}>Urgent</Text>
                          {currentNotifications
                            .filter(n => n.isUrgent)
                            .map(renderNotificationItem)}
                        </>
                      )}

                      {/* Earlier Section */}
                      {currentNotifications.filter(n => 
                        !n.isUrgent && 
                        n.status === 'read'
                      ).length > 0 && (
                        <>
                          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Earlier</Text>
                          {currentNotifications
                            .filter(n => 
                              !n.isUrgent && 
                              n.status === 'read'
                            )
                            .map(renderNotificationItem)}
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
              <>
                {/* Empty State for System Tab */}
                <View style={styles.emptyState}>
                  <Icon name="cog-outline" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyStateTitle}>System Notifications</Text>
                  <Text style={styles.emptyStateText}>
                    Updates, alerts, and other system messages will appear here.
                  </Text>
                </View>
              </>
            )}
            
            {/* Bottom Spacing for Pull to Refresh */}
            <View style={styles.bottomSpacing} />
          </ScrollView>

        </Pressable>
      </Pressable>
    </Modal>

      {/* Enhanced Calendar Popup as a separate Modal for cross-platform consistency */}
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
                  <Icon name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.yearNavigation}>
                <TouchableOpacity onPress={() => navigateYear('prev')} style={styles.navButton}>
                  <Icon name="chevron-left" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.yearText}>{getCalendarMonth().year}</Text>
                <TouchableOpacity onPress={() => navigateYear('next')} style={styles.navButton}>
                  <Icon name="chevron-right" size={20} color={colors.text} />
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

const getStyles = (getScaledFontSize, colors) => StyleSheet.create({
 modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  popupContainer: {
    height: height * 0.8,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: getScaledFontSize(24),
    fontWeight: 'bold',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerButton: {
    padding: 2,
  },
  calendarIconButton: {
    padding: 2,
  },
  menuButton: {
    padding: 2,
  },
  
  // Enhanced Menu Styles
  menuDropdown: {
    position: 'absolute',
    top: 70,
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 8,
    minWidth: 250,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  menuItemText: {
    color: colors.text,
    fontSize: getScaledFontSize(16),
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.separator,
    marginVertical: 4,
  },
  menuSectionTitle: {
    color: '#FF6B35',
    fontSize: getScaledFontSize(14),
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  notificationToggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  notificationToggleLeft: {
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
    position: 'absolute',
  },
  
  // Font Size Controls
  fontSizeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  fontSizeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
  },
  activeFontSize: {
    backgroundColor: '#FF6B35',
  },
  fontSizeText: {
    color: colors.textSecondary,
    fontSize: getScaledFontSize(12),
    fontWeight: '500',
  },
  activeFontSizeText: {
    color: '#FFFFFF',
  },
  
  // Search Bar Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: getScaledFontSize(16),
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  
  // Filters Panel
  filtersPanel: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filtersTitle: {
    color: colors.text,
    fontSize: getScaledFontSize(18),
    fontWeight: '600',
  },
  filterRow: {
    marginBottom: 15,
  },
  filterLabel: {
    color: colors.textSecondary,
    fontSize: getScaledFontSize(14),
    fontWeight: '500',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
    gap: 4,
  },
  activeFilterButton: {
    backgroundColor: '#FF6B35',
  },
  filterButtonText: {
    color: colors.textSecondary,
    fontSize: getScaledFontSize(12),
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  
  // Refresh Indicator
  refreshingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  refreshingText: {
    color: '#FF6B35',
    fontSize: getScaledFontSize(14),
    fontWeight: '500',
  },
  
  // Calendar Styles
  calendarContainer: {
    marginBottom: 20,
  },
  calendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  calendarDay: {
    alignItems: 'center',
    flex: 1,
  },
  dayText: {
    fontSize: getScaledFontSize(12),
    marginBottom: 5,
  },
  dateContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayContainer: {
    backgroundColor: '#FF6B35',
  },
  dateText: {
    fontSize: getScaledFontSize(14),
    fontWeight: '600',
  },
  
  // Tab Buttons with Badges
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'transparent',
    minWidth: 40,
    minHeight: 32,
    position: 'relative',
  },
  activeTabButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 15,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontSize: getScaledFontSize(12),
    fontWeight: '600',
    marginLeft: 5,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: getScaledFontSize(10),
    fontWeight: 'bold',
  },
  
  // Notifications List
  notificationsList: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: getScaledFontSize(16),
    fontWeight: '600',
    marginBottom: 10,
    color: colors.text,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  markAllText: {
    color: '#FF6B35',
    fontSize: getScaledFontSize(12),
    fontWeight: '500',
  },
  
  // Enhanced Notification Items
  notificationContainer: {
    position: 'relative',
  },
  notificationItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.separator,
    borderRadius: 8,
  },
  readNotification: {
    opacity: 0.7,
  },
  selectedNotification: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderColor: '#FF6B35',
    borderWidth: 1,
  },
  selectionCheckbox: {
    position: 'absolute',
    left: -25,
    top: 15,
    zIndex: 1,
  },
  notificationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  notificationRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 40,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profilePicture: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationName: {
    fontWeight: '600',
    color: colors.text,
  },
  notificationMessage: {
    fontWeight: '400',
    color: colors.textSecondary,
  },
  statusText: {
    fontSize: getScaledFontSize(12),
    fontWeight: '500',
    marginTop: 2,
    color: colors.danger,
  },
  notificationTime: {
    color: colors.textSecondary,
  },
  newIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    marginTop: 4,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 15,
    paddingHorizontal: 10,
  },
  quickActionButton: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
  },
  acceptAction: {
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
    flex: 1,
    borderRadius: 6,
  },
  declineAction: {
    backgroundColor: '#2A2A2A',
    flex: 1,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#E0E0E0',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    color: colors.text,
    fontSize: getScaledFontSize(18),
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: getScaledFontSize(14),
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  
  // Calendar Popup
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarPopup: {
    backgroundColor: colors.surface,
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
    fontSize: getScaledFontSize(18),
    fontWeight: '600',
    color: colors.text,
  },
  yearNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  yearText: {
    fontSize: getScaledFontSize(20),
    fontWeight: 'bold',
    color: colors.text,
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
    fontSize: getScaledFontSize(16),
    fontWeight: '600',
    color: '#FF6B35',
    minWidth: 50,
    textAlign: 'center',
  },
  navButton: {
    padding: 5,
    borderRadius: 8,
    backgroundColor: colors.iconBackground,
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
    fontSize: getScaledFontSize(12),
    fontWeight: '500',
    color: colors.textSecondary,
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
    backgroundColor: '#FF6B35',
  },
  dateCellText: {
    fontSize: getScaledFontSize(14),
    color: colors.text,
    fontWeight: '500',
  },
  selectedDateText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  todayDateText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default NotificationsPopup;