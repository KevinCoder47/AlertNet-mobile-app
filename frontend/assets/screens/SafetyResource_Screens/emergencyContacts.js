import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import SOSService from '../../services/SOSService';



const EmergencyContacts = ({ setIsEmergencyContacts, setIsSafetyResources }) => {
  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phoneNumber: '' });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const savedContacts = await SOSService.getEmergencyContacts();
    setContacts(savedContacts);
  };

  const addContact = async () => {
    if (!newContact.name || !newContact.phoneNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const contact = {
      id: Date.now().toString(),
      name: newContact.name,
      phoneNumber: newContact.phoneNumber,
    };

    const updatedContacts = [...contacts, contact];
    await SOSService.saveEmergencyContacts(updatedContacts);
    setContacts(updatedContacts);
    setNewContact({ name: '', phoneNumber: '' });
    setShowAddForm(false);
  };

  const removeContact = async (contactId) => {
    const updatedContacts = contacts.filter(c => c.id !== contactId);
    await SOSService.saveEmergencyContacts(updatedContacts);
    setContacts(updatedContacts);
  };
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
          {contacts.map(contact => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileInitial}>{contact.name.charAt(0)}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactNumber}>
                  Contact No: {contact.phoneNumber}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeContact(contact.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.separator} />
        </View>

        {/* --- Add Contact Form --- */}
        {showAddForm && (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="Contact Name"
              value={newContact.name}
              onChangeText={(text) => setNewContact({...newContact, name: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={newContact.phoneNumber}
              onChangeText={(text) => setNewContact({...newContact, phoneNumber: text})}
              keyboardType="phone-pad"
            />
            <View style={styles.formButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddForm(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={addContact}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* --- Add Button --- */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
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
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInitial: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
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
  removeButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  addForm: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#666',
    padding: 10,
    borderRadius: 5,
    flex: 0.45,
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 5,
    flex: 0.45,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
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