

import { SaudiRiyalIcon } from 'lucide-react-native'
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
// For icons, you can use a library like @expo/vector-icons or use your own image assets
// For this example, I'll use text placeholders for icons.
// To use real icons: npm install @expo/vector-icons
// import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// --- Mock Data based on the image ---
const safetyCategories = [
  { name: 'Police Station', icon: '👮' },
  { name: 'Hospital & Clinics', icon: '➕' },
  { name: 'Public Safety Centers', icon: '🛡️' },
  { name: 'Fire Stations', icon: '🔥' },
];

const savedLocations = [
  {
    type: 'Home',
    address: '52 Richmond Avenue, Johannesburg',
    icon: '🏠',
  },
  {
    type: 'School',
    address: 'UJ APB Bunting Road Campus',
    icon: '🎓',
  },
  {
    type: 'Work',
    address: '23 Midrand, Johannesburg',
    icon: '💼',
  },
];

const nearbyLocations = [
  {
    type: 'Police Station',
    address: 'High St & Mercury St, Brixton Johannesburg, 2019',
    icon: '👮',
  },
  {
    type: 'Government Hospital',
    address: '1 Perth Road Auckland Park, Rossmore, Johannesburg, 2092',
    icon: '➕',
  },
];

const SafetyZones = ({ setIsSafetyZones }) => {
  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={() => setIsSafetyZones(false)} // Close when clicking outside the main card
      />
      <SafeAreaView style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Safety Zone</Text>

          {/* --- Top Icon Categories --- */}
          <View style={styles.iconCategoryRow}>
            {safetyCategories.map((category) => (
              <TouchableOpacity key={category.name} style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Text style={styles.icon}>{category.icon}</Text>
                </View>
                <Text style={styles.iconLabel} numberOfLines={2}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* --- Saved Locations List --- */}
          {savedLocations.map((location, index) => (
            <TouchableOpacity key={index} style={styles.locationItem}>
              <View style={styles.locationIconContainer}>
                <Text style={styles.locationIcon}>{location.icon}</Text>
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationType}>{location.type}</Text>
                <Text style={styles.locationAddress}>{location.address}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* --- Nearby Section --- */}
          <Text style={styles.nearbyTitle}>Nearby</Text>
          {nearbyLocations.map((location, index) => (
            <TouchableOpacity key={index} style={styles.locationItem}>
              <View style={styles.locationIconContainer}>
                <Text style={styles.locationIcon}>{location.icon}</Text>
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationType}>{location.type}</Text>
                <Text style={styles.locationAddress}>{location.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
          
          {/* --- Add Button --- */}
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ add</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#2C2C2E', // A dark grey color from the image
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '85%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 25,
  },
  iconCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  iconContainer: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6347', // Tomato/Orange color
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 28,
  },
  iconLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 70,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3C', // Slightly lighter dark grey
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6347',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  locationIcon: {
    fontSize: 20,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationType: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationAddress: {
    color: '#E5E5EA',
    fontSize: 12,
  },
  nearbyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#48484A',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SafetyZones;
