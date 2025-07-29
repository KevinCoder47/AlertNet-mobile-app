import React, { useRef } from "react";
import {
  PanResponder,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

export default function SafetyResources({
  setIsSafetyResources,
  setIsSOS,
  setIsTestSOS,
  setIsLiveLocation,
  setIsVoiceTrigger,
  setIsUnsafePage,
}) {
  const pan = useRef(new Animated.ValueXY()).current;

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
          setIsSOS(true);
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

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

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          {
            flex: 1,
            backgroundColor: "#000",
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
                />
              </View>

              {/* How to Use the App Section */}
              <SectionHeader title="How to Use the App" />
              <View style={styles.menuSection}>
                <MenuItem
                  icon={<MaterialIcons name="sos" size={18} color="#fff" />}
                  text="Test SOS"
                  onPress={() => {
                    setIsSafetyResources(false);
                    setIsTestSOS(true);
                  }}
                />
                <View style={styles.separator} />
                <MenuItem
                  icon={<Ionicons name="mic-outline" size={18} color="#fff" />}
                  text="Activate Voice Recognition (Panic Word)"
                  onPress={() => {
                    console.log("Voice Trigger Clicked")
                    setIsSafetyResources(false);
                    setIsVoiceTrigger(true);
                  }}
                />
              </View>

              {/* Safety Instructions Section */}
              <SectionHeader title="Safety Instructions" />
              <View style={styles.menuSection}>
                <MenuItem
                  icon={<Ionicons name="alert-circle-outline" size={18} color="#fff" />}
                  text="What to do when feeling unsafe"
                  onPress={() => {
                    setIsSafetyResources(false);
                    setIsUnsafePage(true);
                  }}
                />
                <View style={styles.separator} />
                <MenuItem 
                  icon={<FontAwesome5 name="walking" size={18} color="#fff" />} 
                  text="Tips for walking alone" 
                />
                <View style={styles.separator} />
                <MenuItem 
                  icon={<Feather name="map-pin" size={18} color="#fff" />} 
                  text="Finding safe zones" 
                />
              </View>

              {/* Account Section */}
              <SectionHeader title="Account" />
              <View style={styles.menuSection}>
                <MenuItem 
                  icon={<MaterialIcons name="subscriptions" size={18} color="#fff" />} 
                  text="Subscription" 
                />
                <View style={styles.separator} />
                <MenuItem 
                  icon={<MaterialIcons name="language" size={18} color="#fff" />} 
                  text="Language" 
                />
              </View>

              {/* Info & Support Section */}
              <SectionHeader title="Info & Support" />
              <View style={styles.menuSection}>
                <MenuItem 
                  icon={<Entypo name="video" size={18} color="#fff" />} 
                  text="YouTube safety videos" 
                />
                <View style={styles.separator} />
                <MenuItem 
                  icon={<MaterialIcons name="support-agent" size={18} color="#fff" />} 
                  text="Emergency contact" 
                />
              </View>

              {/* History Section */}
              <SectionHeader title="History" />
              <View style={styles.menuSection}>
                <MenuItem 
                  icon={<FontAwesome5 name="walking" size={18} color="#fff" />} 
                  text="Previous walks" 
                />
              </View>

              {/* Download Section */}
              <SectionHeader title="Download" />
              <View style={styles.menuSection}>
                <MenuItem 
                  icon={<Feather name="download" size={18} color="#fff" />} 
                  text="Offline maps" 
                />
              </View>

              {/* Logout */}
              <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7}>
                <Text style={styles.logoutText}>Log out</Text>
                <MaterialIcons name="logout" size={18} color="red" />
              </TouchableOpacity>
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
    backgroundColor: "#000",
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