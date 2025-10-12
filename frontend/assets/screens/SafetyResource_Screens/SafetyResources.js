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
  Alert,
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
import QRScanner from './QRScanner';
import FontSizePopup from '../../componets/FontSizePopup';
import AppearancePopup from '../../componets/AppearancePopup'; // Add this import
import { useFontSize } from '../../contexts/FontSizeContext';
import { useTheme } from '../../contexts/ColorContext'; // Updated import

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
  setIsOfflineMap,
  setIsWalkingAloneTips,
  handleLogout,
  setIsSubscriptionScreen,
  setIsSafetyZones,
  previousScreen = "sos",
  setIsDownloadedMaps,
  // New props for appearance settings
  setIsAppearanceSettings,
  setIsFontSizeSettings,
  setIsScanning,
  backgroundContent,
  onQRCodeScanned
}) {
  const screenWidth = Dimensions.get('window').width;
  const pan = useRef(new Animated.ValueXY({ x: screenWidth * 0.9, y: 0 })).current;
  const [searchQuery, setSearchQuery] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showFontSizePopup, setShowFontSizePopup] = useState(false);
  const [showAppearancePopup, setShowAppearancePopup] = useState(false); // Add this state

  // Get font size and theme context
  const { getScaledFontSize } = useFontSize();
  const { colors, isDark } = useTheme(); // Using your existing context properties

  // Entrance animation when component mounts
  useEffect(() => {
    // console.log($&);
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, []);

  // Handle QR code scanning result
  const handleQRScanned = (scannedUserId, scannedSosId) => {
    // console.log($&);
    
    // Close the scanner and safety resources
    setShowQRScanner(false);
    setIsSafetyResources(false);
    
    // Navigate to QrCode page with scanned data
    if (onQRCodeScanned) {
      onQRCodeScanned(scannedUserId, scannedSosId);
    }
  };

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
        // {
        //   icon: <Ionicons name="mic-outline" size={18} color="#fff" />,
        //   text: "Activate Voice Recognition (Panic Word)",
        //   keywords: ["voice", "recognition", "panic", "word", "activate", "mic", "microphone"],
        //   onPress: () => {
        //     console.log("Voice Trigger Clicked")
        //     setIsSafetyResources(false);
        //     setIsVoiceTrigger(true);
        //   }
        // },
        {
          icon: <Ionicons name="qr-code-outline" size={18} color="#fff" />,
          text: "Scan SOS QR Code",
          keywords: ["qr", "code", "scan", "sos", "emergency", "scanner"],
          onPress: () => {
            // console.log($&);
            setShowQRScanner(true);
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
        // {
        //   icon: <MaterialIcons name="language" size={18} color="#fff" />,
        //   text: "Language",
        //   keywords: ["language", "translate", "locale", "settings"],
        //   onPress: () => {
        //     setIsSafetyResources(false)
        //     setIsLanguagePage(true)
        //   }
        // },
        {
          icon: <Ionicons name="color-palette-outline" size={18} color="#fff" />,
          text: "Appearance & Theme",
          keywords: ["appearance", "theme", "dark", "light", "mode", "color", "display"],
          onPress: () => {
            // Show popup instead of navigating to separate screen
            setShowAppearancePopup(true);
          }
        },
        {
          icon: <MaterialIcons name="format-size" size={18} color="#fff" />,
          text: "Font Size",
          keywords: ["font", "size", "text", "accessibility", "large", "small", "readable"],
          onPress: () => {
            // Show popup instead of navigating to separate screen
            setShowFontSizePopup(true);
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
          icon: <FontAwesome5 name="user-friends" size={16} color="#fff" />,
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
            setIsDownloadedMaps(true);
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

  const SectionHeader = ({ title }) => (
    <Text style={[styles.sectionHeader, { 
      fontSize: getScaledFontSize(13),
      color: colors.textSecondary || colors.secondary 
    }]}>
      {title}
    </Text>
  );

  const MenuItem = ({ icon, text, onPress, showArrow = true }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemLeft}>
          <View style={styles.iconContainer}>
            {icon}
          </View>
          <Text style={[styles.menuText, { 
            fontSize: getScaledFontSize(15),
            color: colors.text 
          }]}>
            {text}
          </Text>
        </View>
        {showArrow && (
          <MaterialIcons 
            name="chevron-right" 
            size={20} 
            color={colors.textSecondary || colors.secondary} 
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const filteredSections = getFilteredSections();

  // Show QR Scanner if active
  if (showQRScanner) {
    return (
      <QRScanner 
        setIsScanning={setShowQRScanner}
        onQRScanned={handleQRScanned}
      />
    );
  }

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    safeAreaContainer: {
      flex: 1,
      backgroundColor: "transparent",
    },
    slidingPanel: {
      width: "90%",
      height: "100%",
      backgroundColor: colors.surface || colors.background,
      borderTopLeftRadius: 20,
      borderBottomLeftRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: -2, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.inputBorder || colors.border,
      borderRadius: 25,
      paddingHorizontal: 15,
      backgroundColor: colors.inputBackground || (isDark ? '#2a2a2a' : '#f8f8f8'),
      marginBottom: 25,
      height: 45,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
    },
    menuSection: {
      backgroundColor: colors.card || colors.background,
      borderRadius: 12,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    separator: {
      height: 1,
      backgroundColor: colors.separator || (isDark ? '#404040' : '#f0f0f0'),
      marginLeft: 55,
    },
    helpIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.text,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.card || colors.background,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.safeAreaContainer}>
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
            dynamicStyles.slidingPanel,
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
                    <Text style={[styles.heading, { 
                      fontSize: getScaledFontSize(24),
                      color: colors.text 
                    }]}>Safety</Text>
                    <Text style={[styles.heading, { 
                      fontSize: getScaledFontSize(24),
                      color: colors.text 
                    }]}>Resources</Text>
                  </View>
                  <TouchableOpacity style={styles.helpIcon} activeOpacity={0.7}>
                    <View style={dynamicStyles.helpIconCircle}>
                      <Feather 
                        name="help-circle" 
                        size={getScaledFontSize(20)} 
                        color={colors.text} 
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={dynamicStyles.searchContainer}>
                  <Feather 
                    name="search" 
                    size={16} 
                    color={colors.placeholder || colors.secondary} 
                    style={styles.searchIcon} 
                  />
                  <TextInput
                    style={[dynamicStyles.searchInput, { fontSize: getScaledFontSize(14) }]}
                    placeholder="Search something..."
                    placeholderTextColor={colors.placeholder || colors.secondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity 
                      onPress={() => setSearchQuery("")}
                      style={styles.clearButton}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.placeholder || colors.secondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Render filtered sections */}
                {filteredSections.length > 0 ? (
                  filteredSections.map((section, sectionIndex) => (
                    <View key={sectionIndex}>
                      <SectionHeader title={section.section} />
                      <View style={dynamicStyles.menuSection}>
                        {section.items.map((item, itemIndex) => (
                          <View key={itemIndex}>
                            <MenuItem
                              icon={item.icon}
                              text={item.text}
                              onPress={item.onPress}
                            />
                            {itemIndex < section.items.length - 1 && (
                              <View style={dynamicStyles.separator} />
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.noResultsContainer}>
                    <Text style={[styles.noResultsText, { 
                      fontSize: getScaledFontSize(16),
                      color: colors.textSecondary || colors.secondary 
                    }]}>
                      No results found for "{searchQuery}"
                    </Text>
                    <Text style={[styles.noResultsSubtext, { 
                      fontSize: getScaledFontSize(14),
                      color: colors.textTertiary || colors.secondary 
                    }]}>
                      Try searching for something else
                    </Text>
                  </View>
                )}

                {/* Logout - only show if no search query */}
                {!searchQuery.trim() && (
                  <TouchableOpacity 
                    style={styles.logoutBtn} 
                    activeOpacity={0.7}
                    onPress={handleLogout}
                  >
                    <Text style={[styles.logoutText, { fontSize: getScaledFontSize(15) }]}>Log out</Text>
                    <MaterialIcons name="logout" size={18} color="red" />
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Font Size Popup */}
      <FontSizePopup 
        visible={showFontSizePopup}
        onClose={() => setShowFontSizePopup(false)}
      />

      {/* Appearance Popup */}
      <AppearancePopup 
        visible={showAppearancePopup}
        onClose={() => setShowAppearancePopup(false)}
      />
    </SafeAreaView>
  );
}

// Updated styles with theme support
const styles = StyleSheet.create({
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
    fontWeight: "bold",
    fontFamily: "Helvetica",
    lineHeight: 28,
  },
  helpIcon: {
    marginTop: 5,
  },
  questionMark: {
    fontWeight: "bold",
  },
  searchIcon: {
    marginRight: 10,
  },
  clearButton: {
    marginLeft: 8,
  },
  sectionHeader: {
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    flex: 1,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontWeight: "500",
    marginBottom: 8,
  },
  noResultsSubtext: {
    // Color will be set dynamically
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
    color: "red",
    fontWeight: "500",
  },
});