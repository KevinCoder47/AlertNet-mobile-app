import React, { useRef, useState, useEffect } from "react";
import {
  PanResponder,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Entypo,
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
  Octicons,
} from "@expo/vector-icons";
import { contentIndex } from './contentIndex';

export default function SafetyResources({
  setIsSafetyResources,
  setIsSOS,
  setIsTestSOS,
  setIsLiveLocation,
  setIsVoiceTrigger,
  setIsUnsafePage,
  setIsPreviousWalks, 
  setIsEmergencyContacts,
  setIsLanguagePage,
  setIsSafetyVideos,
  setIsOfflineMap, // ADD THIS,
  setIsWalkingAloneTips,
  handleLogout,
  setIsSubscriptionScreen,
  setIsSafetyZones,
  previousScreen = "sos",
  backgroundContent
}) {
  const screenWidth = Dimensions.get('window').width;
  const pan = useRef(new Animated.ValueXY({ x: screenWidth * 0.9, y: 0 })).current;
  const [searchQuery, setSearchQuery] = useState("");

  // Entrance animation when component mounts
  useEffect(() => {
    console.log("SafetyResources Clicked from:", previousScreen);
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, []);

  // PanResponder for horizontal swipe right gesture to go back
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          pan.setValue({ x: gestureState.dx, y: 0 });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 100) {
          setIsSafetyResources(false);
          if (previousScreen === "sos") {
            setIsSOS(true);
          }
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Define all menu items with their search keywords
  const allMenuItems = [
    {
      section: "How to Use the App",
      items: [
        {
          icon: <MaterialIcons name="sos" size={18} color="#fff" />,
          text: "Test SOS",
          keywords: ["test", "sos", "emergency", "panic"],
          onPress: () => {
            setIsSafetyResources(false);
            setIsTestSOS(true);
          }
        },
        {
          icon: <Ionicons name="mic-outline" size={18} color="#fff" />,
          text: "Activate Voice Recognition (Panic Word)",
          keywords: ["voice", "recognition", "panic", "word", "activate", "mic", "microphone"],
          onPress: () => {
            console.log("Voice Trigger Clicked")
            setIsSafetyResources(false);
            setIsVoiceTrigger(true);
          }
        }
      ]
    },
    {
      section: "Safety Instructions",
      items: [
        {
          icon: <Ionicons name="alert-circle-outline" size={18} color="#fff" />,
          text: "What to do when feeling unsafe",
          keywords: ["unsafe", "feeling", "danger", "help", "emergency", "alert"],
          onPress: () => {
            setIsSafetyResources(false);
            setIsUnsafePage(true);
          }
        },
        {
          icon: <FontAwesome5 name="walking" size={18} color="#fff" />,
          text: "Tips for walking alone",
          keywords: ["walking", "alone", "tips", "safety", "walk"],
          onPress: () => {
            setIsSafetyResources(false)
            setIsWalkingAloneTips(true)
          }
        },
        {
          icon: <Feather name="map-pin" size={18} color="#fff" />,
          text: "Finding safe zones",
          keywords: ["safe", "zones", "finding", "location", "map", "pin"],
          onPress: () => {
            setIsSafetyResources(false);
            setIsSafetyZones(true);
          }
        }
      ]
    },
    {
      section: "Account",
      items: [
        {
          icon: <MaterialIcons name="subscriptions" size={18} color="#fff" />,
          text: "Subscription",
          keywords: ["subscription", "account", "premium", "billing"],
          onPress: () => {
            setIsSafetyResources(false)
            setIsSubscriptionScreen(true)
          }
        },
        {
          icon: <MaterialIcons name="language" size={18} color="#fff" />,
          text: "Language",
          keywords: ["language", "translate", "locale", "settings"],
          onPress: () => {
            setIsSafetyResources(false)
            setIsLanguagePage(true)
          }
        }
      ]
    },
    {
      section: "Info & Support",
      items: [
        {
          icon: <Entypo name="video" size={18} color="#fff" />,
          text: "YouTube safety videos",
          keywords: ["youtube", "videos", "safety", "tutorial", "help"],
          onPress: () => {
            setIsSafetyResources(false)
            setIsSafetyVideos(true)
          }
        },
        {
          icon: <MaterialIcons name="support-agent" size={18} color="#fff" />,
          text: "Emergency contact",
          keywords: ["emergency", "contact", "support", "help", "agent"],
          onPress: () => {
            setIsSafetyResources(false);
            setIsEmergencyContacts(true);
          }
        }
      ]
    },
    {
      section: "History",
      items: [
        {
          icon: <FontAwesome5 name="walking" size={18} color="#fff" />,
          text: "Previous walks",
          keywords: ["previous", "walks", "history", "past", "record"],
          onPress: () => {
            setIsSafetyResources(false);
            setIsPreviousWalks(true);
          }
        }
      ]
    },
    {
      section: "Download",
      items: [
        {
          icon: <Feather name="download" size={18} color="#fff" />,
          text: "Offline maps",
          keywords: ["offline", "maps", "download", "navigation"],
          onPress: () => {
            setIsSafetyResources(false);
            setIsOfflineMap(true);
          }
        }
      ]
    }
  ];

  // Filter menu items based on search query
  const getFilteredSections = () => {
    if (!searchQuery.trim()) {
      return allMenuItems;
    }

    const query = searchQuery.toLowerCase().trim();
    const filteredSections = [];

    allMenuItems.forEach(section => {
      const filteredItems = section.items.filter(item => {
        // Check if query matches text or any keywords
        const textMatch = item.text.toLowerCase().includes(query);
        const keywordMatch = item.keywords.some(keyword => 
          keyword.toLowerCase().includes(query)
        );
        
        // Check if query matches content from the page
        const contentMatch = contentIndex[item.text] && 
          contentIndex[item.text].content.some(content => 
            content.toLowerCase().includes(query)
          );
        
        return textMatch || keywordMatch || contentMatch;
      });

      if (filteredItems.length > 0) {
        filteredSections.push({
          ...section,
          items: filteredItems
        });
      }
    });

    return filteredSections;
  };

  const SectionHeader = ({ title }) => <Text style={styles.sectionHeader}>{title}</Text>;

  const MenuItem = ({ icon, text, onPress, showArrow = true }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemLeft}>
          <View style={styles.iconContainer}>
            {icon}
          </View>
          <Text style={styles.menuText}>{text}</Text>
        </View>
        {showArrow && (
          <MaterialIcons name="chevron-right" size={20} color="#ccc" />
        )}
      </View>
    </TouchableOpacity>
  );

  const filteredSections = getFilteredSections();

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      {backgroundContent && (
        <View style={styles.backgroundContent} pointerEvents="none">
          {backgroundContent}
        </View>
      )}
      <View style={styles.overlay} />
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          {
            flex: 1,
            justifyContent: "flex-end",
            alignItems: "flex-end",
          },
        ]}
      >
        <Animated.View
          style={[
            styles.slidingPanel,
            {
              transform: [{ translateX: pan.x }],
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.heading}>Safety</Text>
                  <Text style={styles.heading}>Resources</Text>
                </View>
                <TouchableOpacity style={styles.helpIcon} activeOpacity={0.7}>
                  <View style={styles.helpIconCircle}>
                    <Text style={styles.questionMark}>?</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Feather name="search" size={16} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search something..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => setSearchQuery("")}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Render filtered sections */}
              {filteredSections.length > 0 ? (
                filteredSections.map((section, sectionIndex) => (
                  <View key={sectionIndex}>
                    <SectionHeader title={section.section} />
                    <View style={styles.menuSection}>
                      {section.items.map((item, itemIndex) => (
                        <View key={itemIndex}>
                          <MenuItem
                            icon={item.icon}
                            text={item.text}
                            onPress={item.onPress}
                          />
                          {itemIndex < section.items.length - 1 && (
                            <View style={styles.separator} />
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
                  <Text style={styles.noResultsSubtext}>Try searching for something else</Text>
                </View>
              )}

              {/* Logout - only show if no search query */}
              {!searchQuery.trim() && (
                <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7}
                onPress={handleLogout}
                >
                <Text style={styles.logoutText}>Log out</Text>
                <MaterialIcons name="logout" size={18} color="red" />
              </TouchableOpacity>
              )}
            </View>
                      </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  backgroundContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Helvetica",
    color: "#000",
    lineHeight: 28,
  },
  helpIcon: {
    marginTop: 5,
  },
  helpIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  questionMark: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 25,
    paddingHorizontal: 15,
    backgroundColor: "#f8f8f8",
    marginBottom: 25,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  clearButton: {
    marginLeft: 8,
  },
  sectionHeader: {
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 10,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    color: "#000",
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginLeft: 55,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#999",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 20,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    color: "red",
    fontWeight: "500",
  },
  slidingPanel: {
    width: "90%",
    height: "100%",
    backgroundColor: "#f9f9f9",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});