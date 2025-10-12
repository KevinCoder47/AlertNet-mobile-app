import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { 
  getAIResponse, 
  analyzeEmergencyUrgency, 
  detectCommand,
  detectSafetyWord,
  processFriendRequest
} from "../services/aiService";
import { SOSService } from '../services/SOSService';
import { SOSFirebaseService } from '../../backend/Firebase/SOSFirebaseService';

const ChatBot = ({ 
  setIsChatBot, 
  onAddContact, 
  myPhone, 
  userEmail, 
  userData, // This prop is already passed from Home.js
  userId, 
  userLocation,
  onActivateSOS // NEW: Callback to navigate to SOS screen
}) => {
  const [messages, setMessages] = useState([
    { 
      id: "1", 
      text: "Hello 👋, I'm AlertNet Assistant. How can I help you today?\n\n⚠️ SAFETY WORD ACTIVE: Type 'help' for immediate emergency assistance.\n\nYou can ask me about:\n• SOS Emergency Help\n• Safety Zones\n• Walk Partner\n• Managing Friends (try 'Add [name] [phone]')\n• App Navigation", 
      sender: "bot",
      timestamp: new Date()
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { 
      id: Date.now().toString(), 
      text: input.trim(), 
      sender: "user",
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    const userText = input.trim();
    setInput("");
    setIsTyping(true);

    try {
      // PRIORITY 1: Check for safety word FIRST
      if (detectSafetyWord(userText)) {
        await handleSafetyWordActivation(userText);
        return;
      }

      // Step 2: Analyze urgency
      const urgencyAnalysis = await analyzeEmergencyUrgency(userText);
      console.log("Urgency Analysis:", urgencyAnalysis);
      
      // Step 3: Detect commands
      const commandResult = await detectCommand(userText);
      console.log("Command Detection:", commandResult);
      
      // Step 4: Handle critical emergencies
      if (urgencyAnalysis.urgency === 'critical') {
        handleCriticalEmergency(urgencyAnalysis);
      }
      
      // Step 5: Execute commands if detected
      if (commandResult.hasCommand && commandResult.confidence > 0.6) {
        await handleCommand(commandResult);
        return;
      }
      
      // Step 6: Get AI response
      const aiResponse = await getAIResponse(userText);
      
      setMessages((prev) => [...prev, { 
        id: (Date.now() + 1).toString(), 
        text: aiResponse, 
        sender: "bot",
        timestamp: new Date()
      }]);
    } catch (error) {
      console.log("Error getting AI response:", error.message);
      
      const fallbackResponse = getBotResponse(userText);
      
      setMessages((prev) => [...prev, { 
        id: (Date.now() + 1).toString(), 
        text: fallbackResponse, 
        sender: "bot",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSafetyWordActivation = async (triggerMessage) => {
    try {
      setEmergencyMode(true);
      setIsTyping(true);

      // Show initial detection message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "🚨 SAFETY WORD DETECTED 🚨\n\nInitiating Emergency Protocol...\nTriggering SOS system...",
        sender: "bot",
        timestamp: new Date(),
        isEmergency: true
      }]);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // CRITICAL: Trigger the actual SOS system
      console.log('Chatbot: Triggering real SOS via SOSService...');
      const sosSessionId = await SOSService.initiateSOSSession('chatbot_safety_word', userData);

      console.log('Chatbot: SOS Session ID received:', sosSessionId);

      // Log to the SOS session
      await SOSFirebaseService.addLogToSOSSession(
        sosSessionId,
        `Safety word "${triggerMessage}" detected in AI chat assistant`,
        'safety_word_trigger'
      );

      // Show success message
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: `✅ SOS ACTIVATED\n\nEmergency Session: ${sosSessionId}\n\n🚨 Police are being notified\n📱 Emergency contacts are being alerted\n📍 Your location is being shared\n\nNavigating to SOS screen...`,
        sender: "bot",
        timestamp: new Date(),
        isEmergency: true
      }]);

      // Wait a moment for user to see the message
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Close chat and navigate to SOS screen
      setIsChatBot(false);
      
      // Call the SOS navigation callback with the session ID
      if (onActivateSOS) {
        console.log('Chatbot: Calling onActivateSOS callback with session:', sosSessionId);
        onActivateSOS(sosSessionId);
      } else {
        console.error('Chatbot: onActivateSOS callback not provided!');
        Alert.alert(
          "Navigation Error",
          "Could not navigate to SOS screen. Please check the home screen for emergency status.",
          [{ text: "OK" }]
        );
      }

      Alert.alert(
        "🚨 SOS Activated via Chat",
        "Emergency services have been contacted. You are being redirected to the SOS screen to monitor progress.",
        [{ text: "OK" }],
        { cancelable: false }
      );

    } catch (error) {
      console.error("Safety word SOS activation error:", error);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `⚠️ SOS activation encountered an error: ${error.message}\n\nPlease use the physical SOS button or call emergency services directly at 911.`,
        sender: "bot",
        timestamp: new Date(),
        isEmergency: true
      }]);

      Alert.alert(
        "SOS Activation Error",
        `Could not activate SOS via chat: ${error.message}\n\nPlease press the SOS button on the home screen or call emergency services directly.`,
        [
          { 
            text: "Call 911", 
            onPress: () => {
              // Fallback to direct emergency call
              console.log("User chose to call 911 directly");
            },
            style: "destructive"
          },
          { text: "OK", style: "cancel" }
        ]
      );
    } finally {
      setIsTyping(false);
      setEmergencyMode(false);
    }
  };

  const handleCriticalEmergency = (urgencyAnalysis) => {
    Alert.alert(
      "🚨 Emergency Detected",
      `${urgencyAnalysis.reason}\n\nSuggested Action: ${urgencyAnalysis.suggestedAction}\n\nWould you like to activate SOS?`,
      [
        {
          text: "Activate SOS Now",
          onPress: async () => {
            console.log("User chose to activate SOS from critical emergency detection");
            // Trigger safety word activation
            await handleSafetyWordActivation("emergency detected by AI");
          },
          style: "destructive"
        },
        {
          text: "Call 911",
          onPress: () => {
            console.log("Calling 911...");
          },
          style: "destructive"
        },
        {
          text: "I'm Safe",
          style: "cancel"
        }
      ]
    );
  };

  const handleCommand = async (commandResult) => {
    const { command, parameters } = commandResult;
    
    switch (command) {
      case 'ADD_CONTACT':
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: `🔍 Processing friend request for ${parameters.firstName || 'contact'}...\n\nVerifying details...`,
          sender: "bot",
          timestamp: new Date()
        }]);
        
        setIsTyping(true);
        
        try {
          const result = await processFriendRequest(
            parameters, // Contains recipient info from user's text
            userData // Pass the whole userData object
          );
          
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: result.message,
            sender: "bot",
            timestamp: new Date(),
            isSuccess: result.success
          }]);
          
          if (result.success) {
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: (Date.now() + 2).toString(),
                text: "Would you like to:\n\n• Send another friend request?\n• View your friends list?\n• Return to the main menu?",
                sender: "bot",
                timestamp: new Date()
              }]);
            }, 1500);
          }
          
        } catch (error) {
          console.error('Error handling friend request:', error);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: "⚠️ Something went wrong while processing the friend request. Please try again or use the '+add' button to add friends manually.",
            sender: "bot",
            timestamp: new Date()
          }]);
        } finally {
          setIsTyping(false);
        }
        break;
        
      case 'ACTIVATE_SOS':
        Alert.alert(
          "🚨 Activate SOS?",
          "This will alert your emergency contacts and share your location.",
          [
            {
              text: "Activate Now",
              onPress: async () => {
                console.log("Activating SOS from command...");
                await handleSafetyWordActivation("SOS command");
              },
              style: "destructive"
            },
            { text: "Cancel", style: "cancel" }
          ]
        );
        break;
        
      case 'START_WALK_PARTNER':
        const destination = parameters.destination || 'your destination';
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: `🚶 Walk Partner activated! I'll track your journey to ${destination}.`,
          sender: "bot",
          timestamp: new Date()
        }]);
        break;
        
      default:
        break;
    }
  };

  const getBotResponse = (userText) => {
    const lower = userText.toLowerCase();

    if (lower.includes("sos") || lower.includes("emergency")) {
      return "🚨 If this is an emergency:\n\n1. Type 'help' to activate emergency mode\n2. Tap the SOS button on home screen\n3. Call 911 directly\n\nI can activate SOS for you right now. Just say the word!";
    }

    if (lower.includes("friend") || lower.includes("contact")) {
      return "👥 Managing Friends:\n\n• Type 'Add [name] [phone]' to send a friend request\n• Example: 'Add Sarah 0821234567'\n• Or use the '+add' button\n• Go to 'People' tab to view friends";
    }

    if (lower.includes("add") && (lower.includes("friend") || lower.includes("contact"))) {
      return "To add a friend, use this format:\n\n'Add [FirstName] [LastName] [PhoneNumber]'\n\nExamples:\n• Add Sarah 0821234567\n• Add Mike Smith 082-123-4567\n• Add Lisa +27821234567\n\nI'll handle the rest! 😊";
    }

    return "I can help you with:\n\n🚨 SOS & Emergency\n👥 Friends (try 'Add [name] [phone]')\n🛡️ Safety Zones\n🚶 Walk Partner\n\nWhat would you like to do?";
  };

  const quickReplies = [
    { id: "q1", text: "SOS Help", icon: "alert-circle" },
    { id: "q2", text: "Add Friends", icon: "people" },
    { id: "q3", text: "Walk Partner", icon: "walk" },
    { id: "q4", text: "Safety Zones", icon: "shield" },
  ];

  const handleQuickReply = (text) => {
    setInput(text);
    setTimeout(() => handleSend(), 100);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {/* Header - FIXED at top */}
      <View style={[styles.header, emergencyMode && styles.headerEmergency]}>
        <TouchableOpacity onPress={() => setIsChatBot(false)}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {emergencyMode ? "🚨 EMERGENCY MODE" : "AlertNet Assistant"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {emergencyMode ? "SOS activation in progress" : "Type your message below"}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Quick Replies - FIXED below header */}
      <View style={styles.quickRepliesContainer}>
        <FlatList
          horizontal
          data={quickReplies}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.quickReplyButton}
              onPress={() => handleQuickReply(item.text)}
            >
              <Text style={styles.quickReplyText}>{item.text}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.quickRepliesList}
        />
      </View>

      {/* Scrollable Content Area with Keyboard Avoidance */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.messageWrapper}>
              <View
                style={[
                  styles.message,
                  item.sender === "user" ? styles.userMessage : styles.botMessage,
                  item.isEmergency && styles.emergencyMessage,
                  item.isSuccess && styles.successMessage,
                  item.isSuccess === false && styles.warningMessage,
                ]}
              >
                {item.sender === "bot" && (
                  <View style={[
                    styles.botIcon, 
                    item.isEmergency && styles.botIconEmergency,
                    item.isSuccess && styles.botIconSuccess,
                  ]}>
                    <Ionicons 
                      name={
                        item.isEmergency ? "warning" : 
                        item.isSuccess ? "checkmark-circle" : 
                        "shield-checkmark"
                      } 
                      size={16} 
                      color={
                        item.isEmergency ? "#FF0000" : 
                        item.isSuccess ? "#4BB543" : 
                        "#FF6600"
                      } 
                    />
                  </View>
                )}
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
              <Text style={[
                styles.timestamp,
                item.sender === "user" ? styles.timestampRight : styles.timestampLeft
              ]}>
                {formatTime(item.timestamp)}
              </Text>
            </View>
          )}
          contentContainerStyle={{ padding: 10, paddingBottom: 10 }}
          style={styles.messagesList}
          keyboardShouldPersistTaps="handled"
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color="#FF6600" />
              <Text style={styles.typingText}>
                {emergencyMode ? "Processing emergency..." : "Assistant is typing..."}
              </Text>
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={emergencyMode ? "Emergency mode active..." : "Ask me anything..."}
            placeholderTextColor="#aaa"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
            editable={!emergencyMode}
          />
          <TouchableOpacity 
            onPress={handleSend} 
            style={[styles.sendButton, (!input.trim() || emergencyMode) && styles.sendButtonDisabled]}
            disabled={!input.trim() || isTyping || emergencyMode}
          >
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "transparent",
  },
  keyboardView: { 
    flex: 1, 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 102, 0, 0.85)",
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.15)",
  },
  headerEmergency: {
    backgroundColor: "rgba(220, 20, 20, 0.95)",
  },
  headerContent: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    marginTop: 2,
  },
  quickRepliesContainer: {
    backgroundColor: "rgba(20, 20, 20, 0.4)",
    paddingVertical: 10,
  },
  quickRepliesList: {
    paddingHorizontal: 10,
  },
  quickReplyButton: {
    backgroundColor: "rgba(255, 102, 0, 0.25)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 102, 0, 0.5)",
  },
  quickReplyText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  messageWrapper: {
    marginVertical: 4,
  },
  messagesList: {
    flex: 1,
    backgroundColor: "transparent",
  },
  message: {
    maxWidth: "80%",
    borderRadius: 18,
    padding: 12,
    position: "relative",
  },
  userMessage: {
    backgroundColor: "rgba(255, 102, 0, 0.85)",
    alignSelf: "flex-end",
    borderTopRightRadius: 4,
  },
  botMessage: {
    backgroundColor: "rgba(30, 30, 30, 0.75)",
    alignSelf: "flex-start",
    borderTopLeftRadius: 4,
    paddingLeft: 38,
  },
  emergencyMessage: {
    backgroundColor: "rgba(180, 20, 20, 0.85)",
    borderColor: "rgba(255, 0, 0, 0.5)",
    borderWidth: 2,
  },
  successMessage: {
    backgroundColor: "rgba(75, 181, 67, 0.2)",
    borderColor: "rgba(75, 181, 67, 0.5)",
    borderWidth: 1.5,
  },
  warningMessage: {
    backgroundColor: "rgba(255, 77, 79, 0.2)",
    borderColor: "rgba(255, 77, 79, 0.5)",
    borderWidth: 1.5,
  },
  botIcon: {
    position: "absolute",
    left: 10,
    top: 12,
    backgroundColor: "rgba(255, 102, 0, 0.9)",
    borderRadius: 12,
    padding: 4,
  },
  botIconEmergency: {
    backgroundColor: "rgba(255, 0, 0, 0.9)",
  },
  botIconSuccess: {
    backgroundColor: "rgba(75, 181, 67, 0.9)",
  },
  messageText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
    marginHorizontal: 8,
  },
  timestampRight: {
    alignSelf: "flex-end",
  },
  timestampLeft: {
    alignSelf: "flex-start",
    marginLeft: 46,
  },
  typingContainer: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  typingBubble: {
    backgroundColor: "rgba(30, 30, 30, 0.75)",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    maxWidth: "60%",
  },
  typingText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(20, 20, 20, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(40, 40, 40, 0.7)",
    color: "#fff",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: "rgba(255, 102, 0, 0.95)",
    borderRadius: 50,
    padding: 10,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(100, 100, 100, 0.5)",
    opacity: 0.5,
  },
});

export default ChatBot;