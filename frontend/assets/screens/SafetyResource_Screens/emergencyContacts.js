import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

// --- Sample Data ---
// Replace this with your actual data source (e.g., from app state or an API).
const contactsData = [
  {
    id: '1',
    name: 'Josh Naidoo',
    phoneNumber: '072 654 2234',
    // IMPORTANT: Replace this with the actual path to your image asset.
    image: require('../../images/josh_Naidoo.jpg'),
  },
  {
    id: '2',
    name: 'Lebron James',
    phoneNumber: '067 878 976',
    // IMPORTANT: Replace this with the actual path to your image asset.
    image: require('../../images/Lebron_James.jpg'),
  },
];

const EmergencyContacts = ({ setIsEmergencyContacts, setIsSafetyResources }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* --- Header --- */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setIsEmergencyContacts(false);
              setIsSafetyResources(true);
            }}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Emergency Contact</Text>
          <Text style={styles.subtitle}>
            This contact will be notified in case of an emergency
          </Text>
        </View>

        {/* --- Contacts List --- */}
        <View style={styles.listContainer}>
          <View style={styles.separator} />
          {contactsData.map(contact => (
            <View key={contact.id} style={styles.contactCard}>
              <Image source={contact.image} style={styles.profileImage} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactNumber}>
                  Contact No: {contact.phoneNumber}
                </Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.separator} />
        </View>

        {/* --- Add Button --- */}
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ADD</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
// Carefully crafted to match the screenshot provided.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 5,
  },
  backButtonText: {
    fontSize: 28,
    color: '#000000',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '80%',
  },
  listContainer: {
    marginBottom: 30,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0c0b8', // Light reddish line from design annotations
    marginHorizontal: 10,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#383838', // Dark charcoal color
    borderRadius: 20,
    padding: 12,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30, // Makes the image circular
    marginRight: 15,
  },
  contactInfo: {
    flex: 1, // Takes up available space
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  contactNumber: {
    fontSize: 14,
    color: '#cccccc',
    marginTop: 4,
  },
  editButton: {
    backgroundColor: '#202020', // Even darker shade for the button
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#a0a0a0',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignSelf: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmergencyContacts;