import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Constants from 'expo-constants';

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
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Safety Zone</Text>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Constants.statusBarHeight,
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    paddingVertical: 5,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6347',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  iconCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    paddingVertical: 10,
  },
  iconContainer: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#FF6347',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    fontSize: 30,
  },
  iconLabel: {
    color: '#000000',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 75,
    fontWeight: '500',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  locationIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FF6347',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#FF6347',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  locationIcon: {
    fontSize: 22,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationType: {
    color: '#000000',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  locationAddress: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 18,
  },
  nearbyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 25,
    marginBottom: 18,
  },
  addButton: {
    backgroundColor: '#FF6347',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignSelf: 'center',
    marginTop: 25,
    marginBottom: 20,
    minWidth: 120,
    shadowColor: '#FF6347',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SafetyZones;