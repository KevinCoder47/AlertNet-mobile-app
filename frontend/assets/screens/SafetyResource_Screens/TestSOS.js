import { Text, View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import Feather from '@expo/vector-icons/Feather';
import SOSBtn from "../../componets/SOSBtn";

export default function TestSOS({ setIsSafetyResources, setIsTestSOS }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => {
              setIsTestSOS(false);
              setIsSafetyResources(true);
            }}
          >
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Test SOS</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Subheading */}
        <Text style={styles.subtitle}>
          Learn how to activate the SOS feature and{" "}
          <Text style={styles.bold}>test its function safely.</Text>
        </Text>

        {/* Box 1 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            This is a <Text style={styles.bold}>Silent SOS</Text>, Triggers a help request without making noise.
          </Text>
        </View>

        {/* Box 2 - Modified */}
        <View style={[styles.infoBox, styles.infoBoxRow]}>
          <View style={styles.sosButtonPlaceholder}>
            <SOSBtn />
          </View>
          <View style={styles.instructions}>
            <Text style={styles.step}><Text style={styles.bold}>1.</Text> Hold the <Text style={styles.bold}>SOS Button</Text> for 3 seconds.</Text>
            <Text style={styles.step}><Text style={styles.bold}>2.</Text> App will <Text style={styles.bold}>simulate an SOS message</Text> (no real alert will be sent).</Text>
            <Text style={styles.step}><Text style={styles.bold}>3.</Text> Ensure your <Text style={styles.bold}>location is enabled</Text>.</Text>
          </View>
        </View>

        {/* Box 3 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Use this <Text style={styles.bold}>Test at least once a month</Text> to ensure everything is working.
          </Text>
        </View>

        {/* Box 4 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Our SOS is <Text style={styles.bold}>Voice activated</Text> (Optional),{" "}
            <Text style={styles.bold}>Triggered by your phone button</Text>{" "}
            (Default - Press and release Power Button 3 times), and can be{" "}
            <Text style={styles.bold}>Triggered on the app</Text>.
          </Text>
        </View>

        {/* Final Test Button */}
        <View style={styles.testNow}>
          <Text style={styles.testNowTitle}>TEST NOW</Text>
          <Text style={styles.testNowSubtitle}>This is only a Test</Text>
          <View style={styles.redBtnWrapper}>
            <SOSBtn />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40, // So nothing is cut off
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
    marginBottom: 20,
  },
  bold: {
    fontWeight: "bold",
  },
  infoBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  infoBoxRow: { // New style for side-by-side layout
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
  },
  sosButtonPlaceholder: {
    alignItems: "center",
    // marginBottom: 15, // No longer needed
  },
  instructions: {
    gap: 10,
    flex: 1, // Allows the text container to fill the remaining space
  },
  step: {
    fontSize: 14,
    color: "#333",
  },
  testNow: {
    alignItems: "center",
    marginTop: 30,
  },
  testNowTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  testNowSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  redBtnWrapper: {
    alignItems: "center",
  },
});