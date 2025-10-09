import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ColorContext';
 // Add this import

// Enhanced EMS Channels Data
const emsChannelsData = [
  {
    id: '1',
    name: 'Metro Police',
    description: 'Report incidents • Emergency updates',
    logo: '🚓',
    followers: '12,847',
    lastMessage: 'Traffic alert: Major accident on M1 North...',
    lastMessageTime: '2 hours ago',
    status: 'online',
    type: 'police',
    emergencyAction: 'Report Crime',
  },
  {
    id: '2',
    name: 'Emergency Medical Services',
    description: 'Medical emergencies • Ambulance requests',
    logo: '🚑',
    followers: '8,243',
    lastMessage: 'Health advisory: Heat wave precautions...',
    lastMessageTime: '45 minutes ago',
    status: 'online',
    type: 'medical',
    emergencyAction: 'Request Ambulance',
  },
  {
    id: '3',
    name: 'Fire & Rescue Department',
    description: 'Fire emergencies • Safety alerts',
    logo: '🚒',
    followers: '5,921',
    lastMessage: 'Fire safety reminder: Check smoke detectors...',
    lastMessageTime: '1 hour ago',
    status: 'online',
    type: 'fire',
    emergencyAction: 'Report Fire',
  },
  {
    id: '4',
    name: 'Charlotte Maxeke Hospital',
    description: 'Hospital updates • Visiting hours',
    logo: '🏥',
    followers: '3,156',
    lastMessage: 'Visiting hours update for this week...',
    lastMessageTime: '3 hours ago',
    status: 'online',
    type: 'hospital',
    emergencyAction: 'Medical Info',
  },
  {
    id: '5',
    name: 'Disaster Management',
    description: 'Weather alerts • Emergency warnings',
    logo: '⚠️',
    followers: '15,632',
    lastMessage: 'Weather warning: Severe thunderstorms expected...',
    lastMessageTime: '6 hours ago',
    status: 'online',
    type: 'disaster',
    emergencyAction: 'Report Emergency',
  },
];

// Sample broadcast messages for channel detail
const broadcastMessages = [
  {
    id: '1',
    content: '🚨 TRAFFIC ALERT\n\nMajor accident on M1 North between Grayston and Rivonia. Lane closures in effect. Use alternative routes.',
    timestamp: 'Today, 2:15 PM',
    hasImage: true,
    reactions: { thumbsUp: 24, alert: 12, sad: 8 },
  },
  {
    id: '2',
    content: 'CRIME PREVENTION TIP\n\nRemember to lock your vehicle and avoid leaving valuables visible. Report suspicious activities immediately.',
    timestamp: 'Today, 11:30 AM',
    hasImage: false,
    reactions: { thumbsUp: 156, heart: 43 },
  },
  {
    id: '3',
    content: '📋 CASE UPDATE\n\nThe vehicle theft reported in Sandton has been resolved. Suspect apprehended. Thank you for community cooperation.',
    timestamp: 'Yesterday, 4:45 PM',
    hasImage: false,
    reactions: { thumbsUp: 89, clap: 67, heart: 23 },
  },
];

export default function AlertNetEMSChannels() {
  const { colors, isDark } = useTheme(); // Use theme context instead of useColorScheme
  const styles = getStyles(isDark, colors); // Pass colors to styles
  
  // State management
  const [currentScreen, setCurrentScreen] = useState('channels'); // 'channels', 'detail', 'chat'
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(emsChannelsData);
  const [isFollowing, setIsFollowing] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    {
      id: '1',
      text: 'Hello! This is a private channel. How can we assist you today? For emergencies, please call 10111.',
      sender: 'ems',
      timestamp: '2 min ago',
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'report', 'case'

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setData([...emsChannelsData]);
      setRefreshing(false);
    }, 1500);
  }, []);

  const handleChannelPress = (channel) => {
    setSelectedChannel(channel);
    setCurrentScreen('detail');
  };

  const handleBackPress = () => {
    if (currentScreen === 'chat') {
      setCurrentScreen('detail');
    } else if (currentScreen === 'detail') {
      setCurrentScreen('channels');
    }
  };

  const handleTalkToEMS = () => {
    setCurrentScreen('chat');
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'user',
        timestamp: 'Now',
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage('');
      
      // Simulate EMS response
      setTimeout(() => {
        const response = {
          id: (Date.now() + 1).toString(),
          text: 'Thank you for your message. An officer will review this and contact you if needed.',
          sender: 'ems',
          timestamp: 'Just now',
        };
        setChatMessages(prev => [...prev, response]);
      }, 2000);
    }
  };

  const handleReaction = (messageId, reactionType) => {
    Alert.alert('Reaction Added', `You reacted with ${reactionType}`);
  };

  const handleShare = (messageId) => {
    Alert.alert('Share Message', 'Message shared successfully!');
  };

  const handleEmergencyAction = (actionType) => {
    switch (actionType) {
      case 'location':
        Alert.alert('Location Shared', '📍 Your location has been shared with the EMS team.');
        break;
      case 'callback':
        Alert.alert('Callback Requested', '📞 An officer will call you within 30 minutes.');
        break;
      default:
        Alert.alert('Action Completed', `${actionType} form submitted successfully.`);
    }
  };

  // Get header title based on channel type - SHORT TITLES ONLY
  const getHeaderTitle = (channel) => {
    switch (channel?.type) {
      case 'police':
        return 'Police Channel';
      case 'medical':
        return 'Medical Services';
      case 'fire':
        return 'Fire Department';
      case 'hospital':
        return 'Hospital Channel';
      case 'disaster':
        return 'Emergency Alert';
      default:
        return 'EMS Channel';
    }
  };

  // Render Channel List Item
  const renderChannelItem = ({ item }) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.channelRow}
      onPress={() => handleChannelPress(item)}
    >
      <View style={styles.channelAvatar}>
        <Text style={styles.avatarEmoji}>{item.logo}</Text>
      </View>
      <View style={styles.channelInfo}>
        <Text style={styles.channelName}>{item.name}</Text>
        <Text style={styles.channelDescription}>{item.description}</Text>
        <View style={styles.channelStats}>
          <Text style={styles.statText}>{item.followers} followers</Text>
          <Text style={styles.statText}>{item.lastMessageTime}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary || colors.secondary} />
    </TouchableOpacity>
  );

  // Render Broadcast Message
  const renderBroadcastMessage = ({ item }) => (
    <View style={styles.messageCard}>
      <View style={styles.messageContent}>
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
        {item.hasImage && (
          <View style={styles.messageImage}>
            <Ionicons name="image" size={24} color={colors.textSecondary || colors.secondary} />
            <Text style={styles.imageText}>Accident Scene Photo</Text>
          </View>
        )}
      </View>
      
      <View style={styles.messageActions}>
        <View style={styles.reactions}>
          {Object.entries(item.reactions).map(([key, count]) => (
            <TouchableOpacity 
              key={key}
              style={styles.reactionBtn}
              onPress={() => handleReaction(item.id, key)}
            >
              <Text style={styles.reactionText}>
                {key === 'thumbsUp' && '👍'} 
                {key === 'alert' && '🚨'} 
                {key === 'sad' && '😢'} 
                {key === 'heart' && '❤️'} 
                {key === 'clap' && '👏'} 
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={() => handleShare(item.id)}>
          <Ionicons name="share-social" size={16} color={colors.textSecondary || colors.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render Chat Message
  const renderChatMessage = ({ item }) => (
    <View style={[
      styles.chatMessage, 
      item.sender === 'user' ? styles.userMessage : styles.emsMessage
    ]}>
      <Text style={styles.chatMessageText}>{item.text}</Text>
      <Text style={styles.chatTimestamp}>{item.timestamp}</Text>
    </View>
  );

  // Screen Components
  const ChannelsListScreen = () => (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderChannelItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );

  const ChannelDetailScreen = () => (
    <View style={styles.container}>
      <View style={styles.channelHeader}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.channelAvatar}>
          <Text style={styles.avatarEmoji}>{selectedChannel?.logo}</Text>
        </View>
        <View style={styles.channelHeaderInfo}>
          <Text style={styles.channelHeaderName}>{selectedChannel?.name}</Text>
          <Text style={styles.followerCount}>{selectedChannel?.followers} followers</Text>
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => {
            Alert.alert(
              'Channel Options',
              'Choose an action',
              [
                {
                  text: isFollowing ? 'Unfollow' : 'Follow',
                  onPress: () => setIsFollowing(!isFollowing)
                },
                {
                  text: 'Share Channel',
                  onPress: () => Alert.alert('Share', 'Channel shared!')
                },
                {
                  text: 'Report Channel',
                  onPress: () => Alert.alert('Report', 'Channel reported!')
                },
                {
                  text: 'Cancel',
                  style: 'cancel'
                }
              ]
            );
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary || colors.secondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={broadcastMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderBroadcastMessage}
        contentContainerStyle={styles.messagesContainer}
      />

      <TouchableOpacity style={styles.talkToEMSBtn} onPress={handleTalkToEMS}>
        <Ionicons name="chatbubble" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const PrivateChatScreen = () => (
    <View style={styles.container}>
      <View style={styles.chatHeaderContainer}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderTitle}>{selectedChannel?.name}</Text>
          <Text style={styles.chatHeaderSubtitle}>Online • Tap for info</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'report' && styles.activeTab]}
          onPress={() => setActiveTab('report')}
        >
          <Text style={[styles.tabText, activeTab === 'report' && styles.activeTabText]}>Report</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'case' && styles.activeTab]}
          onPress={() => setActiveTab('case')}
        >
          <Text style={[styles.tabText, activeTab === 'case' && styles.activeTabText]}>Open Case</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'chat' && (
        <View style={styles.chatScreenContainer}>
          <View style={styles.quickActions}>
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleEmergencyAction('location')}
              >
                <Ionicons name="location" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Location</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleEmergencyAction('callback')}
              >
                <Ionicons name="call" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Call Back</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={chatMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderChatMessage}
            style={styles.chatContainer}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.chatInputContainer}>
            <TouchableOpacity style={styles.attachBtn}>
              <Ionicons name="add" size={24} color={colors.textSecondary || colors.secondary} />
            </TouchableOpacity>
            <TextInput
              style={styles.chatInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Message..."
              placeholderTextColor={colors.placeholder || colors.secondary}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === 'report' && (
        <ScrollView style={styles.formContainer}>
          <View style={styles.emergencyForm}>
            <Text style={styles.formTitle}>📝 {selectedChannel?.emergencyAction} Form</Text>
            <Text style={styles.formLabel}>Incident Type</Text>
            <TextInput 
              style={styles.formInput} 
              placeholder="Select incident type..." 
              placeholderTextColor={colors.placeholder || colors.secondary}
            />
            
            <Text style={styles.formLabel}>Location</Text>
            <TextInput 
              style={styles.formInput} 
              placeholder="Street address or landmark" 
              placeholderTextColor={colors.placeholder || colors.secondary}
            />
            <TouchableOpacity 
              style={styles.locationBtn}
              onPress={() => handleEmergencyAction('location')}
            >
              <Text style={styles.locationBtnText}>📍 Use Current Location</Text>
            </TouchableOpacity>
            
            <Text style={styles.formLabel}>Description</Text>
            <TextInput 
              style={[styles.formInput, styles.textArea]} 
              placeholder="Describe what happened..."
              placeholderTextColor={colors.placeholder || colors.secondary}
              multiline
              numberOfLines={4}
            />
            
            <TouchableOpacity 
              style={styles.submitBtn}
              onPress={() => handleEmergencyAction('report')}
            >
              <Text style={styles.submitBtnText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {activeTab === 'case' && (
        <ScrollView style={styles.formContainer}>
          <View style={styles.emergencyForm}>
            <Text style={styles.formTitle}>📋 Open New Case</Text>
            <Text style={styles.formLabel}>Case Type</Text>
            <TextInput 
              style={styles.formInput} 
              placeholder="Select case type..." 
              placeholderTextColor={colors.placeholder || colors.secondary}
            />
            
            <Text style={styles.formLabel}>Your Details</Text>
            <TextInput 
              style={styles.formInput} 
              placeholder="Full name" 
              placeholderTextColor={colors.placeholder || colors.secondary}
            />
            <TextInput 
              style={styles.formInput} 
              placeholder="ID number" 
              placeholderTextColor={colors.placeholder || colors.secondary}
            />
            <TextInput 
              style={styles.formInput} 
              placeholder="Contact number" 
              placeholderTextColor={colors.placeholder || colors.secondary}
            />
            
            <Text style={styles.formLabel}>Incident Details</Text>
            <TextInput 
              style={[styles.formInput, styles.textArea]} 
              placeholder="Provide detailed information..."
              placeholderTextColor={colors.placeholder || colors.secondary}
              multiline
              numberOfLines={4}
            />
            
            <TouchableOpacity 
              style={styles.submitBtn}
              onPress={() => handleEmergencyAction('case')}
            >
              <Text style={styles.submitBtnText}>Open Case</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );

  // Main render based on current screen
  return (
    <SafeAreaView style={styles.safeArea}>
      {currentScreen === 'channels' && <ChannelsListScreen />}
      {currentScreen === 'detail' && <ChannelDetailScreen />}
      {currentScreen === 'chat' && <PrivateChatScreen />}
    </SafeAreaView>
  );
}

const getStyles = (isDark, colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface || colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.surface || colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#075e54',
      paddingHorizontal: 15,
      paddingVertical: 15,
      gap: 15,
    },
    headerTitle: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    headerChannelInfo: {
      flex: 1,
    },
    headerSubtitle: {
      color: '#b8d4d1',
      fontSize: 13,
      marginTop: 2,
    },
    urgentBanner: {
      backgroundColor: '#dc3545',
      paddingVertical: 8,
      alignItems: 'center',
    },
    urgentText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    listContainer: {
      paddingVertical: 8,
    },
    channelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 0.5,
      borderColor: colors.separator || colors.border,
      backgroundColor: colors.card || colors.background,
    },
    channelAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#128c7e',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 15,
    },
    avatarEmoji: {
      fontSize: 30,
    },
    channelInfo: {
      flex: 1,
    },
    channelName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 3,
    },
    channelDescription: {
      fontSize: 13,
      color: colors.textSecondary || colors.secondary,
      marginBottom: 3,
    },
    channelStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statText: {
      fontSize: 12,
      color: colors.textSecondary || colors.secondary,
    },
    channelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card || colors.background,
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 0.5,
      borderColor: colors.separator || colors.border,
    },
    channelHeaderInfo: {
      flex: 1,
      marginLeft: 15,
    },
    backButton: {
      padding: 8,
      marginRight: 10,
    },
    channelNameContainer: {
      flex: 1,
    },
    chatHeaderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card || colors.background,
      paddingHorizontal: 15,
      paddingVertical: 15,
      borderBottomWidth: 0.5,
      borderColor: colors.separator || colors.border,
      gap: 15,
    },
    chatHeaderInfo: {
      flex: 1,
    },
    chatHeaderTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
    },
    chatHeaderSubtitle: {
      color: colors.textSecondary || colors.secondary,
      fontSize: 13,
      marginTop: 2,
    },
    channelHeaderName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    followerCount: {
      fontSize: 12,
      color: colors.textSecondary || colors.secondary,
    },
    followBtn: {
      backgroundColor: '#25d366',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    followingBtn: {
      backgroundColor: colors.inputBackground || (isDark ? '#333' : '#e8e8e8'),
    },
    followBtnText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    messagesContainer: {
      paddingVertical: 10,
    },
    messageCard: {
      backgroundColor: colors.card || colors.background,
      marginHorizontal: 10,
      marginBottom: 8,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
      padding: 15,
    },
    messageContent: {
      marginBottom: 12,
    },
    messageText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
      marginBottom: 8,
    },
    messageTimestamp: {
      fontSize: 12,
      color: colors.textSecondary || colors.secondary,
      alignSelf: 'flex-end',
    },
    messageImage: {
      height: 100,
      backgroundColor: colors.inputBackground || (isDark ? '#333' : '#f0f0f0'),
      borderRadius: 4,
      marginTop: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    imageText: {
      fontSize: 12,
      color: colors.textSecondary || colors.secondary,
      marginTop: 5,
    },
    messageActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderColor: colors.separator || colors.border,
    },
    reactions: {
      flexDirection: 'row',
      gap: 15,
    },
    reactionBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    reactionText: {
      fontSize: 14,
      color: colors.textSecondary || colors.secondary,
    },
    shareBtn: {
      fontSize: 12,
      color: colors.textSecondary || colors.secondary,
    },
    talkToEMSBtn: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#dc3545',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.inputBackground || (isDark ? '#2a2a2a' : '#f8f9fa'),
      borderBottomWidth: 0.5,
      borderColor: colors.separator || colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: colors.card || colors.background,
      borderBottomWidth: 2,
      borderBottomColor: '#075e54',
    },
    tabText: {
      fontSize: 12,
      color: colors.textSecondary || colors.secondary,
    },
    activeTabText: {
      color: '#075e54',
      fontWeight: '600',
    },
    quickActions: {
      backgroundColor: colors.inputBackground || (isDark ? '#2a2a2a' : '#f8f9fa'),
      marginHorizontal: 15,
      marginTop: 10,
      marginBottom: 15,
      padding: 12,
      borderRadius: 12,
    },
    actionsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    actionBtn: {
      flex: 1,
      backgroundColor: '#25d366',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    actionBtnText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    chatScreenContainer: {
      flex: 1,
    },
    chatContainer: {
      flex: 1,
      paddingHorizontal: 15,
    },
    chatMessage: {
      maxWidth: '75%',
      padding: 12,
      borderRadius: 18,
      marginBottom: 8,
    },
    userMessage: {
      backgroundColor: '#dcf8c6',
      alignSelf: 'flex-end',
      borderBottomRightRadius: 4,
    },
    emsMessage: {
      backgroundColor: colors.card || colors.background,
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
    },
    chatMessageText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 20,
    },
    chatTimestamp: {
      fontSize: 11,
      color: colors.textSecondary || colors.secondary,
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    chatInputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 15,
      paddingVertical: 12,
      backgroundColor: colors.card || colors.background,
      borderTopWidth: 0.5,
      borderColor: colors.separator || colors.border,
      gap: 8,
    },
    attachBtn: {
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chatInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.inputBorder || colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      maxHeight: 100,
      color: colors.text,
      backgroundColor: colors.inputBackground || (isDark ? '#2a2a2a' : '#f8f9fa'),
      fontSize: 15,
    },
    sendBtn: {
      backgroundColor: '#25d366',
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    formContainer: {
      flex: 1,
    },
    emergencyForm: {
      backgroundColor: colors.card || (isDark ? '#2a2a2a' : '#fff3cd'),
      margin: 10,
      padding: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border || (isDark ? '#333' : '#ffeaa7'),
    },
    formTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffc107' : '#856404',
      marginBottom: 15,
    },
    formLabel: {
      fontSize: 12,
      color: colors.textSecondary || colors.secondary,
      marginBottom: 5,
      marginTop: 10,
      fontWeight: '500',
    },
    formInput: {
      backgroundColor: colors.inputBackground || colors.background,
      borderWidth: 1,
      borderColor: colors.inputBorder || colors.border,
      borderRadius: 4,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
      marginBottom: 5,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    locationBtn: {
      backgroundColor: '#007bff',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 4,
      alignItems: 'center',
      marginTop: 5,
      marginBottom: 10,
    },
    locationBtnText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    submitBtn: {
      backgroundColor: '#dc3545',
      paddingVertical: 12,
      borderRadius: 4,
      alignItems: 'center',
      marginTop: 20,
    },
    submitBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
  });