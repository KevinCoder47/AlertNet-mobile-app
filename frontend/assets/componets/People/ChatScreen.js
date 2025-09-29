import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  PixelRatio,
  Pressable,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../contexts/ColorContext';

const scaleFont = (size) => size * PixelRatio.getFontScale();

export default function ChatScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const person = params?.person || {
    name: 'Unknown User',
    avatar: null,
    status: 'offline',
    battery: '50%',
    location: 'Unknown',
    distance: '— km away',
  };

  // Use your theme context instead of useColorScheme
  const { colors: themeColors, isDark } = useTheme();

  // Updated color scheme to use your theme colors
  const colors = {
    header: themeColors.card || themeColors.background,
    textPrimary: themeColors.text,
    textSecondary: themeColors.textSecondary || themeColors.secondary,
    bullet: themeColors.textSecondary || themeColors.secondary,
    bannerText: themeColors.textSecondary || themeColors.secondary,
    inputBg: themeColors.inputBackground || (isDark ? '#2a2a2a' : '#f0f0f0'),
    inputText: themeColors.text,
    chatBg: themeColors.background,
    myMessageBg: isDark ? '#35d07f' : '#0a9f58',
    friendMessageBg: themeColors.surface || (isDark ? '#333' : '#e1e1e1'),
    messageText: themeColors.text,
    responseBtnBg: themeColors.inputBackground || (isDark ? '#555' : '#ddd'),
    responseBtnSelectedBg: '#35d07f',
    bottomBarBg: themeColors.surface || (isDark ? '#1c1c1c' : '#eaeaea'),
    micBtnBg: isDark ? '#333' : '#888',
    sendBtnBg: isDark ? '#333' : '#888',
    checkInBtnBg: themeColors.inputBackground || (isDark ? '#2d2d2d' : '#ccc'),
    safetyBtnBg: themeColors.inputBackground || (isDark ? '#444' : '#bbb'),
    checkInText: themeColors.text,
    safetyText: themeColors.text,
    responseText: themeColors.text,
  };

  const statusOnline = (person.status || '').toLowerCase() === 'online';
  const statusColor = statusOnline ? '#51e651' : '#9AA0A6';

  const getBatteryIconName = (batteryPercentStr) => {
    const percent = parseInt(batteryPercentStr || '', 10);
    if (Number.isNaN(percent)) return 'battery-dead';
    if (percent >= 80) return 'battery-full';
    if (percent >= 50) return 'battery-half';
    if (percent >= 20) return 'battery-low';
    return 'battery-dead';
  };
  const batteryIcon = getBatteryIconName(person.battery);

  const [messages, setMessages] = useState([
    { id: '1', text: 'Hey, how are you?', sender: 'friend' },
    { id: '2', text: 'I am good, thanks!', sender: 'me' },
  ]);
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const flatListRef = useRef();

  // Long-press modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const handleLongPress = (message) => {
    setSelectedMessage(message);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMessage(null);
  };

  const handleOptionPress = (option) => {
    if (!selectedMessage) return;
    closeModal(); // Close the main options modal

    switch (option) {
      case 'Reply':
        setReplyingTo(selectedMessage);
        break;
      case 'Copy':
        if (selectedMessage?.text) {
          Clipboard.setStringAsync(selectedMessage.text).then(() => {
            Alert.alert('Copied', 'Message copied to clipboard.');
          });
        }
        break;
      case 'Delete':
        // Open the new delete confirmation modal instead of deleting directly
        setTimeout(() => setDeleteModalVisible(true), 250); // Timeout for smoother transition
        break;
      case 'Report':
        Alert.alert('Reported', 'Message has been reported.');
        break;
    }
  };

  const handleDeleteForMe = () => {
    if (!selectedMessage) return;
    setMessages(prev => prev.filter(msg => msg.id !== selectedMessage.id));
    setDeleteModalVisible(false);
    setSelectedMessage(null);
  };

  const handleDeleteForEveryone = () => {
    // In a real app, you would call an API here to delete the message on the server.
    // For this example, we'll just delete it locally.
    handleDeleteForMe();
  };
  

  // VOICE RECORDING
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
    } catch (err) {
      console.log('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      sendVoiceMessage(uri);
      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      console.log('Failed to stop recording', err);
    }
  };

  const sendVoiceMessage = (uri) => {
    const newMessage = {
      id: Date.now().toString(),
      text: '🎤 Voice Note',
      sender: 'me',
      type: 'voice',
      audioUri: uri,
      replyTo: replyingTo?.id || null,
    };
    setMessages(prev => [...prev, newMessage]);
    setReplyingTo(null);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'me',
      replyTo: replyingTo?.id || null,
    };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setReplyingTo(null);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.chatBg }]}>
      {/* HEADER */}
      <View style={[styles.headerWrap, { backgroundColor: colors.header }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.avatarWrap}>
            {!!person.avatar && <Image source={person.avatar} style={styles.avatar} />}
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <View style={[styles.batteryPill, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
              <Ionicons name={batteryIcon} size={11} color={colors.textPrimary} />
              <Text style={[styles.batteryPillText, { color: colors.textPrimary }]}>
                {person.battery || '--%'}
              </Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{person.name}</Text>
              <MaterialIcons name="verified" size={16} color="#ffb74d" style={{ marginLeft: 6 }} />
            </View>
            <View style={styles.subRow}>
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>{person.location}</Text>
              <Text style={[styles.bullet, { color: colors.bullet }]}> • </Text>
              <Text style={[styles.distanceText, { color: colors.textSecondary }]}>{person.distance}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* CHAT LIST */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 12, paddingTop: 110 }}
        ListHeaderComponent={
          <Text style={[styles.infoText, { color: colors.bannerText }]}>
            Messages are automatically deleted after 24 hours.
          </Text>
        }
        renderItem={({ item }) => {
          const isMe = item.sender === 'me';
          const bubbleStyle = [
            styles.messageBubble,
            {
              backgroundColor: isMe ? colors.myMessageBg : colors.friendMessageBg,
              alignSelf: isMe ? 'flex-end' : 'flex-start',
            },
          ];

          const repliedMessage = item.replyTo
            ? messages.find(m => m.id === item.replyTo)
            : null;

          return (
            <TouchableOpacity
              onLongPress={() => handleLongPress(item)}
              activeOpacity={0.7}
              style={bubbleStyle}
            >
              {repliedMessage && (
                <TouchableOpacity
                  onPress={() => {
                    const index = messages.findIndex(m => m.id === repliedMessage.id);
                    flatListRef.current?.scrollToIndex({ index, animated: true });
                  }}
                  style={styles.replyBanner}
                >
                  <Text style={styles.replyBannerText}>
                    {repliedMessage.sender === 'me' ? 'You' : person.name}: {repliedMessage.text}
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={[styles.messageText, { color: colors.messageText }]}>{item.text}</Text>
            </TouchableOpacity>
          );
        }}
      />

{/* LONG PRESS MODAL */}
<Modal transparent visible={modalVisible} animationType="fade">
  <TouchableWithoutFeedback onPress={closeModal}>
    <BlurView intensity={80} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* Elevated message */}
      {selectedMessage && (
        <View
          style={{
            backgroundColor: selectedMessage.sender === 'me' ? colors.myMessageBg : colors.friendMessageBg,
            padding: 16,
            borderRadius: 16,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 8,
            maxWidth: '75%',
            alignSelf: selectedMessage.sender === 'me' ? 'flex-end' : 'flex-start',
          }}
        >
          <Text style={{ fontSize: 16, color: colors.messageText }}>
            {selectedMessage.text}
          </Text>
        </View>
      )}

      {/* Options popup */}
      <Animated.View
        style={{
          backgroundColor: themeColors.card || themeColors.background,
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
        {['Reply', 'Copy', 'Delete', 'Report'].map((opt) => (
          <TouchableOpacity
            key={opt}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
            onPress={() => handleOptionPress(opt)}
          >
            <Ionicons
              name={ // prettier-ignore
                opt === 'Reply'
                  ? 'chatbubble-ellipses-outline'
                  : opt === 'Copy'
                  ? 'copy-outline'
                  : opt === 'Delete'
                  ? 'trash-outline'
                  : 'warning-outline'
              }
              size={22}
              style={{ marginRight: 10, color: opt === 'Delete' ? 'red' : themeColors.text }}
            />
            <Text style={{ fontSize: 16, color: opt === 'Delete' ? 'red' : themeColors.text }}>{opt}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={closeModal} style={{ marginTop: 10, alignItems: 'center' }}>
          <Text style={{ fontWeight: '700', color: 'red' }}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </BlurView>
  </TouchableWithoutFeedback>
</Modal>

{/* DELETE CONFIRMATION MODAL */}
<Modal transparent visible={deleteModalVisible} animationType="fade">
  <TouchableWithoutFeedback onPress={() => setDeleteModalVisible(false)}>
    <BlurView intensity={80} style={styles.deleteModalContainer}>
      <TouchableWithoutFeedback>
        <View style={[styles.deleteModalContent, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.deleteModalTitle, { color: themeColors.text }]}>
            Delete message?
          </Text>

          {selectedMessage?.sender === 'me' && (
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

          <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={styles.deleteCancelButton}>
            <Text style={styles.deleteCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </BlurView>
  </TouchableWithoutFeedback>
</Modal>

      {/* INPUT BAR */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {replyingTo && (
          <View style={[styles.replyBanner, { backgroundColor: colors.inputBg, marginHorizontal: 12 }]}>
            <Text style={[styles.replyBannerText, { color: colors.textSecondary }]}>
              Replying to {replyingTo.sender === 'me' ? 'You' : person.name}: {replyingTo.text}
            </Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
        <View style={[styles.bottomBar, { backgroundColor: colors.bottomBarBg }]}>
          {input.trim().length === 0 ? (
            <Pressable
              style={[styles.micBtn, { backgroundColor: isRecording ? '#ff4d4d' : colors.micBtnBg }]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
            >
              <Ionicons name="mic" size={20} color="#fff" />
            </Pressable>
          ) : null}

          <TextInput
            style={[styles.chatInput, { backgroundColor: colors.inputBg, color: colors.inputText }]}
            placeholder="Type a message..."
            placeholderTextColor={themeColors.placeholder || themeColors.secondary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
          />

          {input.trim().length === 0 ? (
            <>
              <TouchableOpacity
                style={[styles.checkInBtn, { backgroundColor: colors.checkInBtnBg }]}
                onPress={() => Alert.alert('Check-In', 'Check-in sent')}
              >
                <Text style={[styles.checkInText, { color: colors.checkInText }]}>Check-In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.safetyBtn, { backgroundColor: colors.safetyBtnBg }]}
                onPress={() => Alert.alert('Safety Request', 'Request sent')}
              >
                <Text style={[styles.safetyText, { color: colors.safetyText }]}>Safety Request</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.sendBtnBg }]}
              onPress={sendMessage}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarWrap: { width: 48, height: 48, marginRight: 12 },
  avatar: { width: '100%', height: '100%', borderRadius: 24 },
  statusDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  batteryPill: { position: 'absolute', bottom: -6, left: '45%', transform: [{ translateX: -20 }], borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', alignItems: 'center' },
  batteryPillText: { fontSize: 10, marginLeft: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: scaleFont(15), fontWeight: '700', marginLeft: -5 },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  locationText: { fontSize: scaleFont(13), marginLeft: -5 },
  bullet: { marginHorizontal: 6 },
  distanceText: { fontSize: scaleFont(13) },
  infoText: { fontSize: scaleFont(12), fontStyle: 'italic', marginVertical: 8, marginHorizontal: 30 },
  messageBubble: { padding: 10, borderRadius: 16, marginVertical: 4, maxWidth: '75%' },
  messageText: { fontSize: 14 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  micBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 6, marginBottom: 20 },
  chatInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, fontSize: 14, marginRight: 6, marginBottom: 20 },
  checkInBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginRight: 6, marginBottom: 20 },
  checkInText: { fontSize: 13, fontWeight: '600' },
  safetyBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginBottom: 20 },
  safetyText: { fontSize: 13, fontWeight: '600' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  replyBanner: { backgroundColor: 'rgba(0,0,0,0.1)', padding: 4, borderLeftWidth: 3, borderLeftColor: '#35d07f', marginBottom: 4, borderRadius: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  replyBannerText: { fontSize: 12, flex: 1, marginRight: 4, color: '#666' },
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
  deleteCancelButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  deleteCancelText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});