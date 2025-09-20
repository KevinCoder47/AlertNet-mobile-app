import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  SafeAreaView,
  TextInput,
  Animated,
  Vibration,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { FirebaseService } from '../../backend/Firebase/FirebaseService';

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

const NotificationsPopup = ({ setIsNotification, userData, onViewLocation, markNotificationAsRead, markAllNotificationsAsRead }) => {
  const [activeTab, setActiveTab] = React.useState('closeFriends');
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(21);
  const [calendarMonth, setCalendarMonth] = React.useState(0);
  const [calendarYear, setCalendarYear] = React.useState(2025);
  const [showMenu, setShowMenu] = React.useState(false);
  const [allowNotifications, setAllowNotifications] = React.useState(true);
  
  // New state for enhanced features
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedNotifications, setSelectedNotifications] = React.useState([]);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [sortBy, setSortBy] = React.useState('time'); // 'time', 'priority', 'unread'
  const [filterType, setFilterType] = React.useState('all'); // 'all', 'safety', 'emergency', 'general'
  const [doNotDisturb, setDoNotDisturb] = React.useState(false);
  const [dndStartTime, setDndStartTime] = React.useState('22:00');
  const [dndEndTime, setDndEndTime] = React.useState('07:00');
  const [notificationSettings, setNotificationSettings] = React.useState({
    safety: { enabled: true, sound: 'high' },
    emergency: { enabled: true, sound: 'urgent' },
    general: { enabled: true, sound: 'normal' }
  });
  const [showFilters, setShowFilters] = React.useState(false);
  const [fontSize, setFontSize] = React.useState('medium'); // 'small', 'medium', 'large'
  
  // State for real notifications
  const [allNotifications, setAllNotifications] = React.useState([]);
  const [closeFriendsNotifications, setCloseFriendsNotifications] = React.useState([]);
  const [feedNotifications, setFeedNotifications] = React.useState([]);
  const [systemNotifications, setSystemNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Listen for notifications from Firebase
  React.useEffect(() => {
    if (userData && (userData.phone || userData.Phone || userData.phoneNumber)) {
      const userPhone = userData.phone || userData.Phone || userData.phoneNumber;
      setLoading(true);
      
      const unsubscribe = FirebaseService.listenToNotifications(userPhone, ({ notifications, error }) => {
        if (error) {
          console.error("Error fetching notifications:", error);
          setLoading(false);
          return;
        }
        
        const transformedNotifications = notifications.map(n => {
          const isUrgent = n.priority === 'high';
          const timestamp = n.createdAt?.toDate ? n.createdAt.toDate().getTime() : Date.now();
          
          return {
              id: n.id,
              type: n.type,
              category: n.data?.category || 'general',
              name: n.data?.senderName || n.title,
              message: n.message,
              time: formatTimeAgo(timestamp),
              timestamp: timestamp,
              status: n.read ? 'read' : 'new',
              isUrgent: isUrgent,
              location: n.data?.location || null,
              phone: n.data?.senderPhone || null,
              senderId: n.data?.senderId || null,
              profilePicture: n.data?.profilePicture || null,
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
          } else { // Default to friends
            friends.push(n);
          }
        });
        
        setAllNotifications(transformedNotifications);
        setCloseFriendsNotifications(friends);
        setFeedNotifications(feed);
        setSystemNotifications(system);
        setLoading(false);
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } else {
      setLoading(false);
    }
  }, [userData]);
  
  const systemContent = [
    { id: 1, title: 'Learn about the App', subtitle: 'Get started with safety features', type: 'info' },
    { id: 2, title: 'Beta Test', subtitle: 'Help us improve the app', type: 'beta' },
    { id: 3, title: 'Subscription', subtitle: 'Upgrade for premium features', type: 'subscription' },
    { id: 4, title: 'Updates', subtitle: 'Latest app improvements', type: 'updates' },
    { id: 5, title: 'Reports', subtitle: 'View your safety reports', type: 'reports' }
  ];

  // Enhanced filtering and sorting functions
  const filterNotifications = (notifs) => {
    let filtered = notifs;
    
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
      default: // time
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
  const handleRefresh = () => {
    setIsRefreshing(true);
    Vibration.vibrate(50);
    
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  // Mark notification as read
  const handleMarkAsRead = (notificationId) => {
    if (markNotificationAsRead) {
      markNotificationAsRead(notificationId);
      Vibration.vibrate(30);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = () => {
    if (markAllNotificationsAsRead) {
      markAllNotificationsAsRead();
      Vibration.vibrate(50);
    }
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
            // In real implementation, update the notifications array
            Vibration.vibrate(100);
          }
        }
      ]
    );
  };

  // Quick actions for notifications - FIXED VERSION
  const handleQuickAction = (notification, action) => {
    Vibration.vibrate(50);
    
    switch (action) {
      case 'call':
        if (notification.phone) {
          Alert.alert('Call', `Calling ${notification.name}...`);
        }
        break;
      case 'respond':
        Alert.alert('Quick Response', 'Response sent!');
        break;
      case 'location':
        if (notification.location && onViewLocation) {
          onViewLocation(notification);
          setIsNotification(false); // Close the notifications popup
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
        // Delete selected notifications
        break;
    }
    setSelectedNotifications([]);
    setIsSelectionMode(false);
    Vibration.vibrate(100);
  };

  const getFontSize = () => {
    switch (fontSize) {
      case 'small': return { name: 12, message: 11, time: 10 };
      case 'large': return { name: 16, message: 15, time: 14 };
      default: return { name: 14, message: 13, time: 12 };
    }
  };

  const getCalendarDays = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dates = [18, 19, 20, 21, 22, 23, 24];
    
    return days.map((day, index) => ({
      day,
      date: dates[index],
      isToday: dates[index] === selectedDate,
      isWeekend: day === 'Sat' || day === 'Sun'
    }));
  };

  const getCalendarMonth = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return { month: months[calendarMonth], year: calendarYear, days, monthIndex: calendarMonth };
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      setCalendarMonth(calendarMonth === 0 ? 11 : calendarMonth - 1);
    } else {
      setCalendarMonth(calendarMonth === 11 ? 0 : calendarMonth + 1);
    }
  };

  const navigateYear = (direction) => {
    setCalendarYear(direction === 'prev' ? calendarYear - 1 : calendarYear + 1);
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           calendarMonth === today.getMonth() && 
           calendarYear === today.getFullYear();
  };

  const isSelectedDate = (day) => {
    const today = new Date();
    return day === selectedDate && 
           calendarMonth === today.getMonth() && 
           calendarYear === today.getFullYear();
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
    if (notification.isUrgent) return '#FF4444';
    if (notification.status === 'read') return '#888888';
    return '#FF6B35';
  };

  const getIconBackgroundColor = (notification) => {
    if (notification.isUrgent) return '#FFE5E5';
    return '#2A2A2A';
  };

  const counts = getNotificationCounts();
  const currentNotifications = activeTab === 'closeFriends' 
    ? filterNotifications(closeFriendsNotifications) 
    : filterNotifications(feedNotifications);

  const renderNotificationItem = (notification) => {
    const isRead = notification.status === 'read';
    const isSelected = selectedNotifications.includes(notification.id);
    const fonts = getFontSize();

    return (
      <View key={notification.id} style={styles.notificationContainer}>
        <TouchableOpacity 
          style={[
            styles.notificationItem,
            isRead && styles.readNotification,
            isSelected && styles.selectedNotification
          ]}
          onPress={() => {
            if (isSelectionMode) {
              toggleSelection(notification.id);
            } else {
              handleMarkAsRead(notification.id);
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
                color={isSelected ? '#FF6B35' : '#888888'} 
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
        
        {/* Quick Actions */}
        {!isSelectionMode && notification.isUrgent && (
          <View style={styles.quickActions}>
            {notification.phone && (
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(notification, 'call')}
              >
                <Icon name="phone" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {notification.location && (
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(notification, 'location')}
              >
                <Icon name="map-marker" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleQuickAction(notification, 'respond')}
            >
              <Icon name="message-reply" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Swipe Actions Indicator */}
        <View style={styles.swipeIndicator}>
          <Text style={styles.swipeText}>← Swipe for actions</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={() => setIsNotification(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          onPress={() => {
            setIsNotification(false);
            setShowMenu(false);
          }}
        />
        
        <View style={styles.popupContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isSelectionMode ? `${selectedNotifications.length} selected` : 'Today'}
            </Text>
            <View style={styles.headerRight}>
              {isSelectionMode ? (
                <>
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={() => handleBulkAction('markRead')}
                  >
                    <Icon name="check-all" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={() => handleBulkAction('delete')}
                  >
                    <Icon name="delete" size={24} color="#FF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={() => {
                      setIsSelectionMode(false);
                      setSelectedNotifications([]);
                    }}
                  >
                    <Icon name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {doNotDisturb && <Icon name="bell-sleep" size={20} color="#FF6B35" />}
                  <TouchableOpacity 
                    style={styles.calendarIconButton}
                    onPress={() => setShowCalendar(true)}
                  >
                    <Icon name="calendar" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.menuButton}
                    onPress={() => setShowMenu(!showMenu)}
                  >
                    <Icon name="dots-vertical" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsNotification(false)}>
                    <Icon name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Enhanced Menu Dropdown */}
          {showMenu && (
            <View style={styles.menuDropdown}>
              <TouchableOpacity style={styles.menuItem} onPress={handleMarkAllAsRead}>
                <Icon name="check-all" size={20} color="#FFFFFF" />
                <Text style={styles.menuItemText}>Mark all as read</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem} onPress={() => setShowFilters(!showFilters)}>
                <Icon name="filter" size={20} color="#FFFFFF" />
                <Text style={styles.menuItemText}>Filters & Sort</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem}>
                <Icon name="cog" size={20} color="#FFFFFF" />
                <Text style={styles.menuItemText}>Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem}>
                <Icon name="help-circle" size={20} color="#FFFFFF" />
                <Text style={styles.menuItemText}>Help</Text>
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <View style={styles.notificationToggleItem}>
                <View style={styles.notificationToggleLeft}>
                  <Icon name="bell-sleep" size={20} color="#FFFFFF" />
                  <Text style={styles.menuItemText}>Do Not Disturb</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.toggleSwitch, { backgroundColor: doNotDisturb ? '#4CD964' : '#3A3A3A' }]}
                  onPress={() => {
                    setDoNotDisturb(!doNotDisturb);
                    Vibration.vibrate(50);
                  }}
                >
                  <View style={[
                    styles.toggleThumb,
                    { 
                      transform: [{ translateX: doNotDisturb ? 16 : 2 }],
                      backgroundColor: doNotDisturb ? '#FFFFFF' : '#888888'
                    }
                  ]} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.notificationToggleItem}>
                <View style={styles.notificationToggleLeft}>
                  <Icon name="bell" size={20} color="#FFFFFF" />
                  <Text style={styles.menuItemText}>Allow notifications</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.toggleSwitch, { backgroundColor: allowNotifications ? '#4CD964' : '#3A3A3A' }]}
                  onPress={() => {
                    setAllowNotifications(!allowNotifications);
                    Vibration.vibrate(50);
                  }}
                >
                  <View style={[
                    styles.toggleThumb,
                    { 
                      transform: [{ translateX: allowNotifications ? 16 : 2 }],
                      backgroundColor: allowNotifications ? '#FFFFFF' : '#888888'
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
                      <Icon name={sort.icon} size={14} color={sortBy === sort.key ? '#FFFFFF' : '#888888'} />
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
                      <Icon name={filter.icon} size={14} color={filterType === filter.key ? '#FFFFFF' : '#888888'} />
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
            <Icon name="magnify" size={20} color="#888888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notifications..."
              placeholderTextColor="#888888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Icon name="close" size={16} color="#888888" />
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
                <View key={index} style={styles.calendarDay}>
                  <Text style={[
                    styles.dayText, 
                    { color: item.isWeekend ? '#FF6B35' : '#888888' }
                  ]}>
                    {item.day}
                  </Text>
                  <View style={[
                    styles.dateContainer,
                    item.isToday && styles.todayContainer
                  ]}>
                    <Text style={[
                      styles.dateText,
                      { color: item.isToday ? '#FFFFFF' : '#FFFFFF' }
                    ]}>
                      {item.date}
                    </Text>
                  </View>
                </View>
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
                  color={activeTab === 'closeFriends' ? '#FFFFFF' : '#888888'} 
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
                  color={activeTab === 'feed' ? '#FFFFFF' : '#888888'} 
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
                  color={activeTab === 'system' ? '#FFFFFF' : '#888888'} 
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
            onScrollBeginDrag={handleRefresh}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#FF6B35" />}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 50 }} />
            ) : activeTab === 'closeFriends' || activeTab === 'feed' ? (
                <>
                  {currentNotifications.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Icon name="bell-outline" size={48} color="#888888" />
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
                              style={styles.markAllButton}
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
                          <Text style={[styles.sectionTitle, { marginTop: 20, color: '#FF4444' }]}>Urgent</Text>
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
                {/* System Content */}
                <View style={styles.systemContentContainer}>
                  {systemContent.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.systemContentItem}>
                      <View style={styles.systemItemContent}>
                        <Text style={styles.systemContentTitle}>{item.title}</Text>
                        {item.subtitle && (
                          <Text style={styles.systemContentSubtitle}>{item.subtitle}</Text>
                        )}
                      </View>
                      <Icon name="chevron-right" size={20} color="#888888" />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            
            {/* Bottom Spacing for Pull to Refresh */}
            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Enhanced Calendar Popup */}
          {showCalendar && (
            <View style={styles.calendarOverlay}>
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
                  <Text style={styles.yearText}>{calendarYear}</Text>
                  <TouchableOpacity onPress={() => navigateYear('next')} style={styles.navButton}>
                    <Icon name="chevron-right" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.monthNavigation}>
                  <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
                    <Icon name="chevron-left" size={18} color="#FF6B35" />
                  </TouchableOpacity>
                  <Text style={styles.monthText}>{getCalendarMonth().month}</Text>
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
                          isToday(day) && styles.todayDateCell
                        ]}
                        onPress={() => {
                          if (day) {
                            setSelectedDate(day);
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
                            isToday(day) && styles.todayDateText
                          ]}>
                            {day}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  popupContainer: {
    height: height * 0.8,
    backgroundColor: '#1A1A1A',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    backgroundColor: '#2A2A2A',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  menuSectionTitle: {
    color: '#FF6B35',
    fontSize: 14,
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
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
  },
  activeFontSize: {
    backgroundColor: '#FF6B35',
  },
  fontSizeText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '500',
  },
  activeFontSizeText: {
    color: '#FFFFFF',
  },
  
  // Search Bar Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
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
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  
  // Filters Panel
  filtersPanel: {
    backgroundColor: '#2A2A2A',
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  filterRow: {
    marginBottom: 15,
  },
  filterLabel: {
    color: '#888888',
    fontSize: 14,
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
    backgroundColor: '#1A1A1A',
    gap: 4,
  },
  activeFilterButton: {
    backgroundColor: '#FF6B35',
  },
  filterButtonText: {
    color: '#888888',
    fontSize: 12,
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
  refreshControl: {
    // For iOS, you can style the tint color
    tintColor: '#FF6B35',
    // For Android, you can style the background color and the spinner color
    colors: ['#FF6B35'],
  },
  refreshingText: {
    color: '#FF6B35',
    fontSize: 14,
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
    fontSize: 12,
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
    fontSize: 14,
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
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#FFFFFF',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
  },
  markAllText: {
    color: '#FF6B35',
    fontSize: 12,
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
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
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
    color: '#FFFFFF',
  },
  notificationMessage: {
    fontWeight: '400',
    color: '#888888',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    color: '#FF4444',
  },
  notificationTime: {
    color: '#888888',
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
    gap: 8,
  },
  quickActionButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Swipe Indicator
  swipeIndicator: {
    position: 'absolute',
    right: 10,
    bottom: 5,
    opacity: 0.3,
  },
  swipeText: {
    color: '#888888',
    fontSize: 10,
    fontStyle: 'italic',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  
  // System Content
  systemContentContainer: {
    paddingTop: 10,
  },
  systemContentItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  systemItemContent: {
    flex: 1,
  },
  systemContentTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  systemContentSubtitle: {
    color: '#888888',
    fontSize: 14,
    marginTop: 5,
  },
  
  // Calendar Popup
  calendarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    minWidth: 50,
    textAlign: 'center',
  },
  navButton: {
    padding: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#888888',
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
    fontSize: 14,
    color: '#FFFFFF',
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