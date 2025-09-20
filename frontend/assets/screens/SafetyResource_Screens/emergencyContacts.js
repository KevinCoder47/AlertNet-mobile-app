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
import { SOSService } from '../../services/SOSService';



const EmergencyContacts = ({ setIsEmergencyContacts, setIsSafetyResources }) => {
  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ 
    name: '', 
    phoneNumber: '', 
    relationship: 'Family',
    isPrimary: false 
  });

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

    try {
      await SOSService.addEmergencyContact({
        name: newContact.name,
        phoneNumber: newContact.phoneNumber,
        relationship: newContact.relationship,
        isPrimary: newContact.isPrimary,
        isVerified: false
      });
      await loadContacts();
      setNewContact({ name: '', phoneNumber: '', relationship: 'Family', isPrimary: false });
      setShowAddForm(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add contact');
    }
  };

  const removeContact = async (contactId) => {
    try {
      await SOSService.removeEmergencyContact(contactId);
      await loadContacts();
    } catch (error) {
      Alert.alert('Error', 'Failed to remove contact');
    }
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
                <Text style={styles.contactRelationship}>
                  {contact.relationship} {contact.isPrimary ? '(Primary)' : ''}
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
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Relationship:</Text>
              <View style={styles.relationshipButtons}>
                {['Family', 'Friend', 'Colleague', 'Other'].map(rel => (
                  <TouchableOpacity
                    key={rel}
                    style={[styles.relationshipButton, newContact.relationship === rel && styles.selectedRelationship]}
                    onPress={() => setNewContact({...newContact, relationship: rel})}
                  >
                    <Text style={[styles.relationshipText, newContact.relationship === rel && styles.selectedRelationshipText]}>{rel}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={styles.primaryToggle}
              onPress={() => setNewContact({...newContact, isPrimary: !newContact.isPrimary})}
            >
              <Text style={styles.primaryToggleText}>
                {newContact.isPrimary ? '✓' : '○'} Primary Contact
              </Text>
            </TouchableOpacity>
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
  contactRelationship: {
    fontSize: 12,
    color: '#aaaaaa',
    marginTop: 2,
    fontStyle: 'italic',
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
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  relationshipButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedRelationship: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  relationshipText: {
    fontSize: 14,
    color: '#666',
  },
  selectedRelationshipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  primaryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  primaryToggleText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 5,
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