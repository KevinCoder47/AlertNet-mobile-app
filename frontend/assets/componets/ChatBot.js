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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ChatBot = ({ setIsChatBot }) => {
  const [messages, setMessages] = useState([
    { 
      id: "1", 
      text: "Hello 👋, I'm AlertNet Assistant. How can I help you today?\n\nYou can ask me about:\n• SOS Emergency Help\n• Safety Zones\n• Walk Partner\n• Managing Friends\n• App Navigation", 
      sender: "bot",
      timestamp: new Date()
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { 
      id: Date.now().toString(), 
      text: input.trim(), 
      sender: "user",
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate bot thinking time (500-1500ms)
    const thinkingTime = 500 + Math.random() * 1000;
    
    setTimeout(() => {
      const botResponse = getBotResponse(userMessage.text);
      setMessages((prev) => [...prev, { 
        id: Date.now().toString(), 
        text: botResponse, 
        sender: "bot",
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, thinkingTime);
  };

  const getBotResponse = (userText) => {
    const lower = userText.toLowerCase();

    // SOS and Emergency
    if (lower.includes("sos") || lower.includes("emergency") || lower.includes("danger")) {
      return "🚨 If this is an emergency, please:\n\n1. Tap the SOS button on the home screen\n2. It will alert your emergency contacts\n3. Share your live location\n\nFor immediate danger, call emergency services: 911";
    }

    // Friends management
    if (lower.includes("friend") || lower.includes("contact")) {
      return "👥 Managing Friends:\n\n• Go to the 'People' tab\n• Tap '+' to add new contacts\n• Set emergency contacts\n• Share your location with trusted friends\n\nWould you like help with a specific friend feature?";
    }

    // Safety Zones
    if (lower.includes("safe zone") || lower.includes("safety zone") || lower.includes("zone")) {
      return "🛡️ Safety Zones:\n\nSet up areas where you feel safe:\n• Home\n• Work\n• School\n• Trusted locations\n\nYou'll get notified when entering/leaving these zones. Access this in the 'Resources' tab.";
    }

    // Walk Partner
    if (lower.includes("walk") || lower.includes("partner") || lower.includes("escort")) {
      return "🚶 Walk Partner Feature:\n\n• Request someone to virtually walk with you\n• Share live location during your journey\n• Get check-in reminders\n• Automatic alerts if you don't reach destination\n\nFind this on the Walk Partner page.";
    }

    // Location/Tracking
    if (lower.includes("location") || lower.includes("track") || lower.includes("gps")) {
      return "📍 Location Services:\n\n• Real-time location sharing\n• Location history\n• Geofencing alerts\n• Battery-efficient tracking\n\nEnsure location permissions are enabled in your phone settings.";
    }

    // Notifications
    if (lower.includes("notification") || lower.includes("alert")) {
      return "🔔 Notifications:\n\nManage your alerts for:\n• Emergency triggers\n• Safety zone entries/exits\n• Friend requests\n• Check-in reminders\n\nConfigure in Settings > Notifications";
    }

    // Privacy/Security
    if (lower.includes("privacy") || lower.includes("security") || lower.includes("safe")) {
      return "🔒 Privacy & Security:\n\n• Your location is encrypted\n• Only shared with chosen contacts\n• Delete history anytime\n• Anonymous emergency mode available\n\nYour safety data is protected.";
    }

    // How to use app
    if (lower.includes("how") || lower.includes("use") || lower.includes("navigate")) {
      return "📱 App Navigation:\n\n• Home: Quick SOS access\n• People: Manage contacts\n• Resources: Safety info & zones\n• Walk Partner: Journey sharing\n• Profile: Settings & preferences\n\nWhat would you like to explore?";
    }

    // Greetings
    if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey")) {
      return "Hello! 👋 I'm here to help you stay safe. What would you like to know about AlertNet?";
    }

    // Thank you
    if (lower.includes("thank") || lower.includes("thanks")) {
      return "You're welcome! 😊 Stay safe out there. Let me know if you need anything else!";
    }

    // Help or general query
    if (lower.includes("help") || lower.includes("what can you")) {
      return "I can help you with:\n\n🚨 SOS & Emergency Features\n👥 Friend Management\n🛡️ Safety Zones\n🚶 Walk Partner\n📍 Location Tracking\n🔔 Notifications\n🔒 Privacy Settings\n\nWhat would you like to learn about?";
    }

    // Default response with suggestions
    return "I'm not sure about that, but I'm here to help! Try asking about:\n\n• Emergency SOS features\n• Setting up safety zones\n• Adding friends\n• Walk Partner feature\n• Location sharing\n\nOr type 'help' for more options.";
  };

  const quickReplies = [
    { id: "q1", text: "SOS Help", icon: "alert-circle" },
    { id: "q2", text: "Add Friends", icon: "people" },
    { id: "q3", text: "Walk Partner", icon: "walk" },
    { id: "q4", text: "Safety Zones", icon: "shield" },
  ];

  const handleQuickReply = (text) => {
    setInput(text);
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  useEffect(() => {
    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Keyboard hidden
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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsChatBot(false)}>
          <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>AlertNet Assistant</Text>
          </View>
        </View>

        {/* Quick Replies */}
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
                ]}
              >
                {item.sender === "bot" && (
                  <View style={styles.botIcon}>
                    <Ionicons name="shield-checkmark" size={16} color="#FF6600" />
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
          contentContainerStyle={{ 
            padding: 10, 
            paddingBottom: 10,
          }}
          style={styles.messagesList}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color="#FF6600" />
              <Text style={styles.typingText}>Assistant is typing...</Text>
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor="#aaa"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            onFocus={() => {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            onPress={handleSend} 
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            disabled={!input.trim()}
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
    backgroundColor: "transparent" 
  },
  keyboardView: {
    flex: 1,
    backgroundColor: "transparent",
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

  chatBotHeader: {
    backgroundColor: '#FF6600',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  
  headerContent: {
    marginLeft: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  quickRepliesContainer: {
    backgroundColor: "rgba(20, 20, 20, 0.4)",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
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
    shadowColor: "#FF6600",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  userMessage: {
    backgroundColor: "rgba(255, 102, 0, 0.85)",
    alignSelf: "flex-end",
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  botMessage: {
    backgroundColor: "rgba(30, 30, 30, 0.75)",
    alignSelf: "flex-start",
    borderTopLeftRadius: 4,
    paddingLeft: 38,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  botIcon: {
    position: "absolute",
    left: 10,
    top: 12,
    backgroundColor: "rgba(255, 102, 0, 0.9)",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  messageText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timestamp: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
    marginHorizontal: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    backgroundColor: "transparent",
  },
  typingBubble: {
    backgroundColor: "rgba(30, 30, 30, 0.75)",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    maxWidth: "60%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  typingText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(20, 20, 20, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(40, 40, 40, 0.7)",
    color: "#fff",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: Platform.OS === "ios" ? 10 : 10,
    maxHeight: 100,
    fontSize: 15,
    minHeight: 40,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sendButton: {
    backgroundColor: "rgba(255, 102, 0, 0.95)",
    borderRadius: 50,
    padding: 10,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#FF6600",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(100, 100, 100, 0.5)",
    opacity: 0.5,
  },
});

export default ChatBot;