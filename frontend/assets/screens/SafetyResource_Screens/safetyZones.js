import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';

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

const SafetyZones = ({ setIsSafetyZones, setIsSafetyResources }) => {
  const handleBackPress = () => {
    setIsSafetyZones(false);
    if (setIsSafetyResources) {
      setIsSafetyResources(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
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
  );
};

const styles = StyleSheet.create({
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6347',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000', // Black text for contrast on white
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
    color: '#000000', // Black text
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 70,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5', // Light grey background for items
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5, // For Android shadow
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
    color: '#000000', // Black text
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationAddress: {
    color: '#666666', // Grey text for address
    fontSize: 12,
  },
  nearbyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Black text
    marginTop: 20,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#FF6347', // Orange background to match theme
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SafetyZones;