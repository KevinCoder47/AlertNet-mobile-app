import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
  Animated,
  StatusBar,
  Modal,
  Alert,
  TouchableWithoutFeedback,
  useColorScheme,
  Linking,
  Pressable
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, storage } from '../../backend/Firebase/FirebaseConfig';
import { FirebaseService } from '../../backend/Firebase/FirebaseService';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { useNotifications } from '../contexts/NotificationContext';

const { width } = Dimensions.get('window');

const ChatScreen = ({ person, onClose, userData, navigation, onViewProfile }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollViewRef = useRef(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [friendPresence, setFriendPresence] = useState(null);
  const currentUserId = auth.currentUser?.uid;
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const soundRef = useRef(new Audio.Sound());

  // State for long-press menu
  const [longPressModalVisible, setLongPressModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const { setActiveChat, clearActiveChat } = useNotifications();

  // Generate a consistent chat room ID
  const chatRoomId = currentUserId && person?.id
    ? FirebaseService.getChatRoomId(currentUserId, person.id)
    : null;

  const [isAttachmentMenuVisible, setIsAttachmentMenuVisible] = useState(false);
  const [isOptionsMenuVisible, setIsOptionsMenuVisible] = useState(false);

  // Memoize the profile picture URI to prevent re-computation on every render
  const profilePictureUri = useMemo(() => {
    // Try multiple possible sources for the profile picture
    const uri = person?.avatar?.uri ||
                person?.avatar ||
                person?.profilePicture ||
                person?.imageUrl ||
                person?.ImageURL ||
                null;
    // This log will now only appear when the 'person' prop actually changes.
    console.log('Resolved profile picture URI (memoized):', uri);
    return uri;
  }, [person]); // Re-calculate only when the 'person' prop changes

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  // Listen for new messages from Firebase
  useEffect(() => {
    if (!chatRoomId) {
      console.log("ChatScreen: No chatRoomId available to listen for messages.");
      return;
    }

    console.log(`Listening for messages in chat room: ${chatRoomId}`);
    const unsubscribe = FirebaseService.listenToMessages(chatRoomId, (newMessages) => {
      setMessages(newMessages);
    });

    // Mark messages as read when entering the chat
    if (currentUserId) {
      FirebaseService.markMessagesAsRead(chatRoomId, currentUserId);
    }

    // Cleanup listener on unmount
    return () => {
      console.log(`Unsubscribing from chat room: ${chatRoomId}`);
      unsubscribe();
    };
  }, [chatRoomId, currentUserId]);

  // FIXED: Set and clear active chat room for notification handling with debug logs
  useEffect(() => {
    if (chatRoomId) {
      console.log('🏠 ChatScreen: Setting active chat room:', chatRoomId);
      setActiveChat(chatRoomId);
    } else {
      console.log('❌ ChatScreen: No chatRoomId to set as active');
    }
    
    return () => {
      console.log('🚪 ChatScreen: Clearing active chat room');
      clearActiveChat();
    };
  }, [chatRoomId, setActiveChat, clearActiveChat]);

  // Listen for friend's presence updates
  useEffect(() => {
    if (!person?.id) {
      console.log("ChatScreen: No person.id available to listen for presence.");
      return;
    }

    const unsubscribe = FirebaseService.listenToUser(person.id, (userData) => {
      if (userData) {
        setFriendPresence({ status: userData.status, lastSeen: userData.lastSeen });
      } else {
        setFriendPresence(null);
      }
    });

    return () => unsubscribe();
  }, [person?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Unload sound on component unmount
  useEffect(() => {
    return () => {
      console.log("ChatScreen unmounting: cleaning up audio resources.");
      soundRef.current.unloadAsync();
      if (recording) {
        console.log("Unloading active recording object.");
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]); // Add recording to the dependency array

  // FIXED: Send a new message to Firebase with debug logs
  const sendMessage = async () => {
    if (newMessage.trim() && chatRoomId && currentUserId && person?.id) {
      const messageText = newMessage.trim();
      setNewMessage('');

      // ADDED: Debug log for message sending
      console.log('📤 Sending message with notification data:', {
        recipientPhone: person.phone,
        senderName: userData.name,
        chatRoomId: chatRoomId,
        recipientId: person.id,
        currentUserId: currentUserId
      });

      // Optimistic UI update
      const optimisticMessage = {
        id: `temp_${Date.now()}`,
        text: messageText,
        senderId: currentUserId,
        createdAt: new Date(), // Use local time for the optimistic update
        isOptimistic: true,
      };
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      scrollToBottom();

      const result = await FirebaseService.sendMessage(chatRoomId, {
        text: messageText,
        senderId: currentUserId,
        recipientId: person.id,
        // Add data for notification
        senderName: userData.name,
        senderProfilePicture: userData.imageUrl,
        recipientPhone: person.phone,
        senderPhone: userData.phone,
      });

      if (!result.success) {
        console.error("Failed to send message:", result.error);
        Alert.alert("Error", "Could not send your message. Please try again.");
        // If sending fails, remove the optimistic message
        setMessages(prevMessages => prevMessages.filter(m => m.id !== optimisticMessage.id));
        // And restore the text
        setNewMessage(messageText);
      } else {
        console.log('✅ Message sent successfully, notification should be created');
      }
      // If successful, the onSnapshot listener will automatically replace the optimistic message
      // with the real one from Firestore, so no 'else' block is needed.
    } else {
      console.log('❌ Cannot send message - missing required data:', {
        hasMessage: !!newMessage.trim(),
        hasChatRoomId: !!chatRoomId,
        hasCurrentUserId: !!currentUserId,
        hasPersonId: !!person?.id,
        personPhone: person?.phone
      });
    }
  };

  const uploadAudio = async (uri) => {
    const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = (e) => {
            console.error(e);
            reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
    });

    const storageRef = ref(storage, `voice-notes/${chatRoomId}/${Date.now()}`);
    await uploadBytes(storageRef, blob);
    blob.close();

    return await getDownloadURL(storageRef);
  };

  const startRecording = async () => {
    // Safeguard to prevent multiple recording objects.
    if (recording) {
      console.warn("An existing recording was found. Unloading it before starting a new one.");
      await recording.stopAndUnloadAsync();
      setRecording(null);
    }

    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
         Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    console.log('Stopping recording..');
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);
    
    const status = await recording.getStatusAsync();
    const durationMillis = status.durationMillis;

    // Optimistic UI update for voice note
    const optimisticMessage = {
      id: `temp_${Date.now()}`,
      text: 'Voice Note',
      senderId: currentUserId,
      createdAt: new Date(),
      isOptimistic: true,
      type: 'audio',
      audioUrl: uri, // Use local URI for optimistic playback
      audioDuration: durationMillis,
    };
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    scrollToBottom();

    try {
        const audioUrl = await uploadAudio(uri);
        await FirebaseService.sendMessage(chatRoomId, {
            text: 'Voice Note',
            senderId: currentUserId,
            recipientId: person.id,
            type: 'audio',
            audioUrl: audioUrl,
            audioDuration: durationMillis,
            // Notification data
            senderName: userData.name,
            senderProfilePicture: userData.imageUrl,
            recipientPhone: person.phone,
            senderPhone: userData.phone,
        });
    } catch (error) {
        console.error("Failed to send voice message:", error);
        Alert.alert("Error", "Could not send your voice message. Please try again.");
        // If sending fails, remove the optimistic message
        setMessages(prevMessages => prevMessages.filter(m => m.id !== optimisticMessage.id));
    }
    setRecording(null);
  };

  const handleShareLocation = async () => {
    setIsAttachmentMenuVisible(false);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is needed to share your location.');
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    await FirebaseService.sendMessage(chatRoomId, {
      // Notification data
      senderName: userData.name,
      senderProfilePicture: userData.imageUrl,
      recipientPhone: person.phone,
      senderPhone: userData.phone,
      // Message data
      text: `Location Shared`,
      senderId: currentUserId,
      recipientId: person.id,
      type: 'location',
      location: { latitude, longitude },
    });
  };

  const handlePickImage = async () => {
    setIsAttachmentMenuVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access photos is required.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      const imageUrl = result.assets[0].uri;
      // TODO: The `sendMessage` service should be updated to take a local URI,
      // upload it to Firebase Storage, get the download URL, and then save
      // the message with the download URL. The current implementation just
      // saves the `imageUrl` field as is.
      await FirebaseService.sendMessage(chatRoomId, {
        text: 'Image',
        senderId: currentUserId,
        recipientId: person.id,
        type: 'image',
        imageUrl: imageUrl,
        senderName: userData.name,
        senderProfilePicture: userData.imageUrl,
        recipientPhone: person.phone,
        senderPhone: userData.phone,
      });
    }
  };

  const handleClearChat = async () => {
    setIsOptionsMenuVisible(false);
    Alert.alert('Clear Chat?', 'This will permanently delete all messages in this conversation.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Clear', 
        style: 'destructive', 
        onPress: async () => {
          if (chatRoomId) {
            const result = await FirebaseService.clearChatHistory(chatRoomId);
            if (!result.success) {
              Alert.alert("Error", "Could not clear chat history. Please try again.");
            }
          }
        } 
      }
    ]);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    // timestamp is now a JS Date object from FirebaseService
    return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const shouldShowTimestamp = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    if (!prevMsg.createdAt || !currentMsg.createdAt) return false;
    const timeDiff = new Date(currentMsg.createdAt) - new Date(prevMsg.createdAt);
    return timeDiff > 300000; // 5 minutes
  };

  const formatDuration = (millis) => {
    if (!millis) return '0:00';
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${(seconds < 10 ? '0' : '')}${seconds}`;
  };

  const playAudio = async (message) => {
    try {
        // Set the audio mode to playback. This is crucial for iOS to handle audio sessions
        // correctly, especially when switching from recording to playback.
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true, // Ensures audio plays even if the device is on silent
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          playThroughEarpieceAndroid: false,
        });
        const sound = soundRef.current;
        const status = await sound.getStatusAsync();

        if (status.isLoaded && playingAudioId === message.id) {
            if (status.isPlaying) {
                await sound.pauseAsync();
                setPlayingAudioId(null); // To change icon back to play
            } else {
                await sound.playAsync();
                setPlayingAudioId(message.id);
            }
        } else {
            if (status.isLoaded) {
                await sound.unloadAsync();
            }
            console.log('Loading Sound from', message.audioUrl);
            await sound.loadAsync({ uri: message.audioUrl });
            sound.setOnPlaybackStatusUpdate((playbackStatus) => {
                if (playbackStatus.didJustFinish) {
                    setPlayingAudioId(null);
                    sound.unloadAsync();
                }
            });
            await sound.playAsync();
            setPlayingAudioId(message.id);
        }
    } catch (error) {
        console.error('Failed to play audio', error);
        Alert.alert(
          "Playback Error",
          "Could not play the voice note. It might be corrupted or there was a network issue.",
          [{ text: "OK" }]
        );
        setPlayingAudioId(null);
    }
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Offline';
    
    const now = new Date();
    const lastSeenDate = timestamp.toDate(); // Convert Firestore Timestamp to JS Date
    const diffSeconds = Math.floor((now - lastSeenDate) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'last seen just now';
    if (diffMinutes < 60) return `last seen ${diffMinutes} min ago`;
    if (diffHours < 24) return `last seen ${diffHours} hr ago`;
    if (diffDays === 1) return 'last seen yesterday';
    return `last seen on ${lastSeenDate.toLocaleDateString()}`;
  };

  const renderPresence = () => {
    if (!friendPresence) {
      return <Text style={styles.headerStatus}>Offline</Text>;
    }
    if (friendPresence.status === 'online') {
      return <Text style={[styles.headerStatus, styles.onlineStatus]}>Online</Text>;
    }
    return <Text style={styles.headerStatus}>{formatLastSeen(friendPresence.lastSeen)}</Text>;
  };

  // Long-press handlers
  const handleLongPress = (message) => {
    setSelectedMessage(message);
    setLongPressModalVisible(true);
  };

  const closeLongPressModal = () => {
    setLongPressModalVisible(false);
    setSelectedMessage(null);
  };

  const handleOptionPress = (option) => {
    if (!selectedMessage) return;
    closeLongPressModal(); // Close the main options modal

    switch (option) {
      case 'Copy':
        if (selectedMessage?.text) {
          Clipboard.setStringAsync(selectedMessage.text).then(() => {
            Alert.alert('Copied', 'Message copied to clipboard.');
          });
        }
        break;
      case 'Delete':
        // Open the new delete confirmation modal
        setTimeout(() => setDeleteModalVisible(true), 250); // Smoother transition
        break;
      case 'Report':
        Alert.alert('Reported', 'Message has been reported.');
        break;
    }
  };

  const handleDeleteForMe = async () => {
    if (!selectedMessage) return;
    
    try {
      // This marks the message as deleted for you in Firebase
      await FirebaseService.deleteMessageForMe(chatRoomId, selectedMessage.id, currentUserId);
    } catch (error) {
      console.error("Error deleting message for me:", error);
      Alert.alert("Error", "Could not delete the message. Please try again.");
    }
    
    // This removes the message from your screen immediately
    setDeleteModalVisible(false);
    setSelectedMessage(null);
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMessage) return;
    
    try {
      // This deletes the message from Firebase for everyone
      await FirebaseService.deleteMessageForEveryone(chatRoomId, selectedMessage.id);
    } catch (error) {
      console.error("Error deleting message for everyone:", error);
      Alert.alert("Error", "Could not delete the message for everyone. Please try again.");
    }
    // This removes the message from your screen immediately
    setDeleteModalVisible(false);
    setSelectedMessage(null);
  };
  const renderTicks = (message) => {
    // Only show ticks for messages sent by the current user
    if (message.senderId !== currentUserId) return null;

    // Show a clock for optimistic messages that haven't been confirmed by the server
    if (message.isOptimistic) {
      return <Ionicons name="time-outline" size={14} color="#a5c9ff" style={styles.tickIcon} />;
    }
    
    // Show double ticks if the message has been read
    if (message.read) {
      return <Ionicons name="checkmark-done" size={16} color="#4FC3F7" style={styles.tickIcon} />;
    }
    
    // Show a single tick for sent but unread messages
    return <Ionicons name="checkmark" size={16} color="#a5c9ff" style={styles.tickIcon} />;
  };

  const renderMessage = (message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const isUserMessage = message.senderId === currentUserId;

    // Logic to show a date banner (e.g., "Today", "Yesterday")
    const showDateBanner = (() => {
      if (!prevMessage || !prevMessage.createdAt) return true;
      const currentMsgDate = new Date(message.createdAt).setHours(0, 0, 0, 0);
      const prevMsgDate = new Date(prevMessage.createdAt).setHours(0, 0, 0, 0);
      return currentMsgDate !== prevMsgDate;
    })();

    const formatDateBanner = (date) => {
        const today = new Date().setHours(0,0,0,0);
        const msgDate = new Date(date).setHours(0,0,0,0);
        if(today === msgDate) return "Today";
        return new Date(date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    }

    return (
      <Pressable key={message.id} onLongPress={() => handleLongPress(message)}>
        {showDateBanner && (
          <View style={styles.timestampContainer}>
            <View style={styles.timestampBadge}>
              <Text style={styles.timestampText}>{formatDateBanner(message.createdAt)}</Text>
            </View>
          </View>
        )}
        
        <View style={[
          styles.messageContainer,
          isUserMessage ? styles.userMessageContainer : styles.otherMessageContainer
        ]}>
          {!isUserMessage && (
            profilePictureUri ? (
              <Image
                source={{ uri: profilePictureUri }}
                style={styles.avatar}
                onError={(error) => {
                  console.log('Message avatar failed to load:', error.nativeEvent.error);
                }}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={16} color="#666" />
              </View>
            )
          )}
          
          <View style={[
            styles.messageBubble,
            isUserMessage ? styles.userMessage : styles.otherMessage,
            (message.type === 'image' || message.type === 'location' || message.type === 'audio') && { padding: message.type === 'audio' ? 10 : 4, backgroundColor: isDark ? '#222' : '#f0f0f0' }
          ]}>
            {message.type === 'audio' && message.audioUrl ? (
              <TouchableOpacity style={styles.audioPlayer} onPress={() => playAudio(message)}>
                <Ionicons name={playingAudioId === message.id ? "pause" : "play"} size={24} color={isUserMessage ? '#fff' : '#333'} />
                <View style={[styles.audioProgressContainer, {backgroundColor: isUserMessage ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'}]}>
                  <View style={styles.audioProgressDot} />
                </View>
                <Text style={[styles.audioDuration, { color: isUserMessage ? '#fff' : '#666' }]}>
                    {formatDuration(message.audioDuration)}
                </Text>
              </TouchableOpacity>
            ) : message.type === 'location' && message.location ? (
              <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${message.location.latitude},${message.location.longitude}`)}>
                <MapView
                  style={styles.mapSnapshot}
                  initialRegion={{ ...message.location, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker coordinate={message.location} />
                </MapView>
                <Text style={[styles.mediaCaption, isUserMessage && styles.userMessageText]}>
                  Location Shared
                </Text>
              </TouchableOpacity>
            ) : message.type === 'image' && message.imageUrl ? (
              <Image source={{ uri: message.imageUrl }} style={styles.chatImage} resizeMode="cover" />
            ) : (
              <Text style={[
                styles.messageText,
                isUserMessage ? styles.userMessageText : styles.otherMessageText
              ]}>
                {message.text}
              </Text>
            )}
          </View>
        </View>

        <View style={[
          styles.messageInfo,
          isUserMessage ? styles.userMessageInfo : styles.otherMessageInfo
        ]}>
          <Text style={styles.messageTime}>
            {formatTimestamp(message.createdAt)}
          </Text>
          {renderTicks(message)}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header is now outside the KeyboardAvoidingView to keep it static */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          {profilePictureUri ? (
            <Image
              source={{ uri: profilePictureUri }}
              style={styles.headerAvatar}
              onError={(error) => {
                console.log('Header avatar failed to load:', error.nativeEvent.error);
              }}
            />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color="#666" />
            </View>
          )}
          
          <View>
            <Text style={styles.headerName}>{person?.name || 'Chat'}</Text>
            {renderPresence()}
          </View>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={() => setIsOptionsMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* KeyboardAvoidingView now only wraps the content that needs to move */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        {messages.length > 0 ? (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            contentContainerStyle={{ paddingBottom: 10 }}
          >
            {messages.map((message, index) => renderMessage(message, index))}
          </ScrollView>
        ) : (
          <View style={styles.emptyChatContainer}>
            <Text style={styles.emptyChatMessage}>No messages to Display</Text>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.addButton} onPress={() => setIsAttachmentMenuVisible(true)}>
            <Ionicons name="add" size={24} color="#666" />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder={isRecording ? "Recording..." : "Message..."}
              placeholderTextColor="#999"
              multiline
              editable={!isRecording}
            />
          </View>
          
          {newMessage.trim() === '' ? (
            <Pressable
                onPressIn={startRecording}
                onPressOut={stopRecording}
                style={({ pressed }) => [
                    styles.sendButton,
                    { backgroundColor: pressed || isRecording ? '#e74c3c' : '#007AFF' }
                ]}
            >
                <Ionicons 
                    name="mic" 
                    size={20} 
                    color="white" 
                />
            </Pressable>
          ) : (
            <TouchableOpacity
                onPress={sendMessage}
                style={styles.sendButton}
                activeOpacity={0.7}
            >
                <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Menu Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAttachmentMenuVisible}
        onRequestClose={() => setIsAttachmentMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsAttachmentMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.attachmentMenu}>
              <TouchableOpacity style={styles.menuOption} onPress={handleShareLocation}>
                <Ionicons name="location-sharp" size={24} color="#3498db" />
                <Text style={styles.menuOptionText}>Location</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuOption} onPress={handlePickImage}>
                <Ionicons name="images" size={24} color="#2ecc71" />
                <Text style={styles.menuOptionText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuOption} onPress={() => Alert.alert("Camera", "Camera functionality to be added.")}>
                <Ionicons name="camera" size={24} color="#e74c3c" />
                <Text style={styles.menuOptionText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Options Menu Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isOptionsMenuVisible}
        onRequestClose={() => setIsOptionsMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOptionsMenuVisible(false)}>
          <View style={[styles.modalOverlay, { justifyContent: 'flex-start', alignItems: 'flex-end' }]}>
            <View style={styles.optionsMenu}>
              <TouchableOpacity 
                style={styles.optionsMenuItem} 
                onPress={() => {
                  setIsOptionsMenuVisible(false);
                  if (onViewProfile) onViewProfile(person);
                }}
              >
                <Ionicons name="person-circle-outline" size={22} color="#333" />
                <Text style={styles.optionsMenuText}>View Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.optionsMenuItem, { borderBottomWidth: 0 }]} onPress={handleClearChat}>
                <Ionicons name="trash-outline" size={22} color="#333" />
                <Text style={styles.optionsMenuText}>Clear Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* LONG PRESS MODAL */}
      <Modal transparent visible={longPressModalVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={closeLongPressModal}>
          <BlurView intensity={80} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={{
                  backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  width: '80%',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 8,
                }}
              >
                {['Copy', 'Delete', 'Report'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
                    onPress={() => handleOptionPress(opt)}
                  >
                    <Ionicons name={ opt === 'Copy' ? 'copy-outline' : opt === 'Delete' ? 'trash-outline' : 'warning-outline' } size={22} style={{ marginRight: 15, color: opt === 'Delete' ? '#ff4d4f' : (isDark ? '#FFF' : '#333') }} />
                    <Text style={{ fontSize: 16, color: opt === 'Delete' ? '#ff4d4f' : (isDark ? '#FFF' : '#333') }}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </TouchableWithoutFeedback>
          </BlurView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal transparent visible={deleteModalVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setDeleteModalVisible(false)}>
          <BlurView intensity={80} style={styles.deleteModalContainer}>
            <TouchableWithoutFeedback>
              <View style={[styles.deleteModalContent, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
                <Text style={[styles.deleteModalTitle, { color: isDark ? '#FFF' : '#333' }]}>
                  Delete message?
                </Text>

                {selectedMessage?.senderId === currentUserId && (
                  <TouchableOpacity
                    style={styles.deleteOptionButton}
                    onPress={handleDeleteForEveryone}
                  >
                    <Ionicons name="people-outline" size={22} color="#ff4d4f" />
                    <View style={styles.deleteOptionTextContainer}>
                      <Text style={styles.deleteOptionText}>Delete for everyone</Text>
                      <Text style={styles.deleteOptionSubtext}>
                        This message will be removed for all chat members.
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.deleteOptionButton}
                  onPress={handleDeleteForMe}
                >
                  <Ionicons name="person-outline" size={22} color="#007AFF" />
                  <View style={styles.deleteOptionTextContainer}>
                    <Text style={styles.deleteOptionText}>Delete for me</Text>
                    <Text style={styles.deleteOptionSubtext}>
                      This message will only be removed from your device.
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </BlurView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // Add padding for Android status bar to prevent content from overlapping
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerStatus: {
    fontSize: 12,
    color: '#999',
  },
  onlineStatus: {
    color: '#2ecc71',
    fontWeight: '600',
  },
  menuButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageWrapper: {
    marginVertical: 2,
  },
  timestampContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timestampBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timestampText: {
    fontSize: 12,
    color: '#666',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  messageBubble: {
    maxWidth: width * 0.7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  mapSnapshot: {
    width: width * 0.6,
    height: 120,
    borderRadius: 16,
  },
  chatImage: {
    width: width * 0.6,
    height: 200,
    borderRadius: 16,
  },
  mediaCaption: {
    padding: 8,
    fontSize: 14,
  },
  userMessage: {
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    backgroundColor: '#E8F5E8',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.5,
  },
  audioProgressContainer: {
    flex: 1,
    height: 3,
    marginHorizontal: 10,
    borderRadius: 2,
    justifyContent: 'center',
  },
  audioProgressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  audioDuration: {
    fontSize: 12,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userMessageInfo: {
    justifyContent: 'flex-end',
    marginRight: 8,
  },
  otherMessageInfo: {
    justifyContent: 'flex-start',
    marginLeft: 40,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  tickIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  addButton: {
    marginRight: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  attachmentMenu: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 40,
  },
  menuOption: {
    alignItems: 'center',
  },
  menuOptionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#333',
  },
  optionsMenu: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight + 50 : 100,
    marginRight: 16,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50, // Offset to center it better above the input
  },
  emptyChatMessage: {
    fontSize: 16,
    color: '#999',
  },
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionsMenuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  // Delete Modal Styles
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  deleteOptionTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  deleteOptionText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  deleteOptionSubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});

export default ChatScreen;