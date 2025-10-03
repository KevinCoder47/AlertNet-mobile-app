import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SOSService } from '../../services/SOSService';
import { useFontSize } from '../../contexts/FontSizeContext';
import { useTheme } from '../../contexts/ColorContext'; // ✅ theme

const EmergencyContacts = ({ setIsEmergencyContacts, setIsSafetyResources }) => {
  const { getScaledFontSize } = useFontSize();
  const { colors } = useTheme(); // ✅ theme

  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phoneNumber: '',
    relationship: 'Family',
    isPrimary: false,
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
        isVerified: false,
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

  const selectedRelationshipBg = '#FFA500'; // orange accent

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setIsEmergencyContacts(false);
              setIsSafetyResources(true);
            }}
          >
            <Text style={[styles.backButtonText, { fontSize: getScaledFontSize(28), color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { fontSize: getScaledFontSize(22), color: colors.text }]}>
            Emergency Contact
          </Text>
          <Text style={[styles.subtitle, { fontSize: getScaledFontSize(14), color: colors.textSecondary || colors.text }]}>
            This contact will be notified in case of an emergency
          </Text>
        </View>

        {/* Contacts List */}
        <View style={styles.listContainer}>
          <View style={[styles.separator, { backgroundColor: selectedRelationshipBg }]} />
          {contacts.map(contact => (
            <View key={contact.id} style={[styles.contactCard, { backgroundColor: colors.card }]}>
              <View style={styles.profileImagePlaceholder}>
                <Text style={[styles.profileInitial, { fontSize: getScaledFontSize(24), color: colors.text }]}>
                  {contact.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { fontSize: getScaledFontSize(16), color: colors.text }]}>
                  {contact.name}
                </Text>
                <Text style={[styles.contactNumber, { fontSize: getScaledFontSize(14), color: colors.textSecondary || colors.text }]}>
                  Contact No: {contact.phoneNumber}
                </Text>
                <Text style={[styles.contactRelationship, { fontSize: getScaledFontSize(12), color: colors.textSecondary || colors.text }]}>
                  {contact.relationship} {contact.isPrimary ? '(Primary)' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeContact(contact.id)}
              >
                <Text style={[styles.removeButtonText, { fontSize: getScaledFontSize(14), color: colors.error }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={[styles.separator, { backgroundColor: selectedRelationshipBg }]} />
        </View>

        {/* Add Contact Form */}
        {showAddForm && (
          <View style={[styles.addForm, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.input, { fontSize: getScaledFontSize(16), backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Contact Name"
              placeholderTextColor={colors.textSecondary || colors.text}
              value={newContact.name}
              onChangeText={(text) => setNewContact({ ...newContact, name: text })}
            />
            <TextInput
              style={[styles.input, { fontSize: getScaledFontSize(16), backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Phone Number"
              placeholderTextColor={colors.textSecondary || colors.text}
              value={newContact.phoneNumber}
              onChangeText={(text) => setNewContact({ ...newContact, phoneNumber: text })}
              keyboardType="phone-pad"
            />
            <View style={styles.pickerContainer}>
              <Text style={[styles.pickerLabel, { fontSize: getScaledFontSize(16), color: colors.text }]}>Relationship:</Text>
              <View style={styles.relationshipButtons}>
                {['Family', 'Friend', 'Colleague', 'Other'].map(rel => (
                  <TouchableOpacity
                    key={rel}
                    style={[
                      styles.relationshipButton,
                      newContact.relationship === rel && { backgroundColor: selectedRelationshipBg, borderColor: selectedRelationshipBg }
                    ]}
                    onPress={() => setNewContact({ ...newContact, relationship: rel })}
                  >
                    <Text style={[
                      styles.relationshipText,
                      { color: newContact.relationship === rel ? '#fff' : colors.textSecondary || colors.text, fontSize: getScaledFontSize(14) }
                    ]}>
                      {rel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={styles.primaryToggle}
              onPress={() => setNewContact({ ...newContact, isPrimary: !newContact.isPrimary })}
            >
              <Text style={[styles.primaryToggleText, { fontSize: getScaledFontSize(16), color: colors.text }]}>
                {newContact.isPrimary ? '✓' : '○'} Primary Contact
              </Text>
            </TouchableOpacity>
            <View style={styles.formButtons}>
              <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.border }]} onPress={() => setShowAddForm(false)}>
                <Text style={[styles.cancelButtonText, { fontSize: getScaledFontSize(16), color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: selectedRelationshipBg }]} onPress={addContact}>
                <Text style={[styles.saveButtonText, { fontSize: getScaledFontSize(16), color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: selectedRelationshipBg }]}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={[styles.addButtonText, { fontSize: getScaledFontSize(16), color: '#fff' }]}>+ADD</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { paddingHorizontal: 20 },
  header: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  backButton: { position: 'absolute', left: 0, top: 0, padding: 5 },
  backButtonText: { fontWeight: 'bold' },
  title: { fontWeight: 'bold' },
  subtitle: { textAlign: 'center', marginTop: 8, maxWidth: '80%' },
  listContainer: { marginBottom: 30 },
  separator: { height: 1, marginHorizontal: 10 },
  contactCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 12, marginVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  profileImagePlaceholder: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  profileInitial: { fontWeight: 'bold' },
  contactInfo: { flex: 1 },
  contactName: { fontWeight: 'bold' },
  contactNumber: { marginTop: 4 },
  contactRelationship: { marginTop: 2, fontStyle: 'italic' },
  removeButton: { paddingVertical: 6, paddingHorizontal: 15, borderRadius: 15 },
  removeButtonText: { fontWeight: '500' },
  addForm: { padding: 20, borderRadius: 10, marginBottom: 20 },
  input: { borderWidth: 1, padding: 10, borderRadius: 5, marginBottom: 10 },
  formButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelButton: { padding: 10, borderRadius: 5, flex: 0.45 },
  cancelButtonText: { textAlign: 'center', fontWeight: 'bold' },
  saveButton: { padding: 10, borderRadius: 5, flex: 0.45 },
  saveButtonText: { textAlign: 'center', fontWeight: 'bold' },
  pickerContainer: { marginBottom: 15 },
  pickerLabel: { fontWeight: 'bold', marginBottom: 8 },
  relationshipButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relationshipButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1 },
  relationshipText: {},
  primaryToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, marginBottom: 10 },
  primaryToggleText: { marginLeft: 5 },
  addButton: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8, alignSelf: 'center', marginBottom: 20 },
  addButtonText: { fontWeight: 'bold' },
});

export default EmergencyContacts;
