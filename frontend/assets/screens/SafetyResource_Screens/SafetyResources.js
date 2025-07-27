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
  AntDesign,
  Entypo,
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
  Octicons,
} from "@expo/vector-icons";

export default function SafetyResources({ setIsSafetyResources, setIsSOS, setIsTestSOS }) {
  const pan = useRef(new Animated.ValueXY()).current;

  // Setup PanResponder to detect horizontal swipe right
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
          // Trigger "go back"
          setIsSafetyResources(false);
          setIsSOS(true);
        } else {
          // Snap back to zero position
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const SectionHeader = ({ title }) => <Text style={styles.sectionHeader}>{title}</Text>;

  const MenuItem = ({ icon, text, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      {icon}
      <Text style={styles.menuText}>{text}</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        flex: 1,
        backgroundColor: "#000", // Black backdrop
        justifyContent: "flex-end",
        alignItems: "flex-end",
      }}
    >
      <Animated.View
        style={[
          styles.slidingPanel,
          {
            transform: [{ translateX: pan.x }],
          },
        ]}
      >
        {/* Everything inside your white panel */}
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 50 }}>
            <View>
              <Text style={styles.heading}>Safety</Text>
              <Text style={styles.heading}>Resources</Text>

              <TouchableOpacity style={styles.helpIcon}>
                <Octicons name="question" size={30} color="black" />
              </TouchableOpacity>

              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search something..."
                  placeholderTextColor="#888"
                />
              </View>

              {/* Your sections */}
              <SectionHeader title="How to Use the App" />
              <MenuItem
                icon={<MaterialIcons name="sos" size={20} color="black" />}
                text="Test SOS"
                onPress={() => {
                  setIsSafetyResources(false);
                  setIsTestSOS(true);
                }}
              />
              <MenuItem icon={<Entypo name="location" size={20} color="black" />} text="How to share Live Location" />
              <MenuItem icon={<Ionicons name="mic-outline" size={20} color="black" />} text="Activate Voice Recognition (Panic Word)" />

              <SectionHeader title="Safety Instructions" />
              <MenuItem icon={<Ionicons name="alert-circle-outline" size={20} color="black" />} text="What to do when feeling unsafe" />
              <MenuItem icon={<FontAwesome5 name="walking" size={20} color="black" />} text="Tips for walking alone" />
              <MenuItem icon={<Feather name="map-pin" size={20} color="black" />} text="Finding safe zones" />

              <SectionHeader title="Info & Support" />
              <MenuItem icon={<Entypo name="video" size={20} color="black" />} text="YouTube safety videos" />
              <MenuItem icon={<Entypo name="phone" size={20} color="black" />} text="Emergency contact" />
              <MenuItem icon={<MaterialIcons name="support-agent" size={20} color="black" />} text="Helpline numbers" />

              <SectionHeader title="History" />
              <MenuItem icon={<FontAwesome5 name="history" size={20} color="black" />} text="Previous walks" />

              <SectionHeader title="Download" />
              <MenuItem icon={<Feather name="download" size={20} color="black" />} text="Offline maps" />

              <TouchableOpacity style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Log out</Text>
                <MaterialIcons name="logout" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
  },
  heading: {
    fontSize: 25,
    fontWeight: "bold",
    paddingLeft: 0,
    fontFamily: "Helvetica",
  },
  helpIcon: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f5f5f5",
    marginTop: 20,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#000",
  },
  sectionHeader: {
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 25,
    marginBottom: 10,
    color: "#555",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 15,
  },
  menuText: {
    fontSize: 16,
    color: "#000",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    color: "red",
  },
  slidingPanel: {
    width: "90%",
    height: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
