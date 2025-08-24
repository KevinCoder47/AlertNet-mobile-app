import { StyleSheet, Text, View, Dimensions, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Linking } from 'react-native'
import { useTheme } from '../contexts/ColorContext';
import React, { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

const { width, height } = Dimensions.get('window')

const Helpline = ({ onClose = () => console.log('Close button pressed - please implement onClose prop') }) => {
  const { colors } = useTheme()
  const [showAddContact, setShowAddContact] = useState(false)
  const [customContacts, setCustomContacts] = useState([])
  const [favorites, setFavorites] = useState([])
  const [newContact, setNewContact] = useState({ name: '', number: '', description: '' })
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

  // Load saved contacts and favorites on mount
  useEffect(() => {
    AsyncStorage.getItem('customContacts').then(data => {
      if (data) setCustomContacts(JSON.parse(data));
    });
    AsyncStorage.getItem('favoriteContacts').then(data => {
      if (data) setFavorites(JSON.parse(data));
    });
  }, []);

  // Save custom contacts when they change
  useEffect(() => {
    AsyncStorage.setItem('customContacts', JSON.stringify(customContacts));
  }, [customContacts]);

  // Save favorites when they change
  useEffect(() => {
    AsyncStorage.setItem('favoriteContacts', JSON.stringify(favorites));
  }, [favorites]);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const emergencyServices = [
    { title: 'Police Emergency', number: '10111', description: 'Crime, accidents, emergencies', icon: '🚔', color: '#E74C3C', priority: 'Critical' },
    { title: 'Campus Security', number: '011 559 2885', description: 'On-campus safety & security', icon: '🛡️', color: '#3498DB', priority: 'High' },
    { title: 'Medical Emergency', number: '10177', description: 'Ambulance & medical assistance', icon: '🚑', color: '#27AE60', priority: 'Critical' },
    { title: 'Fire Department', number: '10177', description: 'Fire emergencies & rescue', icon: '🚒', color: '#F39C12', priority: 'Critical' },
    { title: 'Crisis Counseling', number: '0800 567 567', description: '24/7 mental health support', icon: '🤝', color: '#1ABC9C', priority: 'High' },
    { title: 'Add Emergency Contact', number: 'Tap to add new contact', description: 'Add personal emergency contacts', icon: '➕', color: '#9B59B6', priority: 'Normal', isAddButton: true }
  ];

  const allServices = [...emergencyServices, ...customContacts];

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', text);
  }

  const handleCall = async (service) => {
    if (service.isAddButton) {
      setShowAddContact(true)
      return
    }
    const phoneNumber = service.number.replace(/\s/g, '')
    const url = `tel:${phoneNumber}`
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        Alert.alert('Call ' + service.title, `Please call: ${service.number}`, [
          { text: 'Copy Number', onPress: () => copyToClipboard(service.number) },
          { text: 'OK', style: 'cancel' }
        ])
      }
    } catch {
      Alert.alert('Call ' + service.title, `Please call: ${service.number}`, [{ text: 'OK', style: 'cancel' }])
    }
  }

  const handleLongPress = (service, index) => {
    if (service.isAddButton) return
    Alert.alert('Quick Actions', `${service.title} - ${service.number}`, [
      { text: 'Call Now', onPress: () => handleCall(service) },
      { text: 'Copy Number', onPress: () => copyToClipboard(service.number) },
      { text: favorites.includes(index) ? 'Remove from Favorites' : 'Add to Favorites', onPress: () => toggleFavorite(index) },
      { text: 'Cancel', style: 'cancel' }
    ])
  }

  const toggleFavorite = (index) => {
    if (favorites.includes(index)) {
      setFavorites(favorites.filter(i => i !== index))
    } else {
      setFavorites([...favorites, index])
    }
  }

  const handleDeleteContact = (index) => {
    if (index < 0) return;
    Alert.alert('Delete Contact', 'Are you sure you want to delete this emergency contact?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        const updated = customContacts.filter((_, i) => i !== index)
        setCustomContacts(updated)
        Alert.alert('Deleted', 'Emergency contact removed')
      }}
    ])
  }

  const handleAddContact = () => {
    if (newContact.name && newContact.number) {
      const contact = { title: newContact.name, number: newContact.number, description: newContact.description || 'Personal emergency contact', icon: '👤', color: '#8E44AD', priority: 'Personal' }
      setCustomContacts([...customContacts, contact])
      setNewContact({ name: '', number: '', description: '' })
      setShowAddContact(false)
      Alert.alert('Success', 'Emergency contact added successfully!')
    } else {
      Alert.alert('Error', 'Please enter both name and phone number.')
    }
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Critical': return '#E74C3C'
      case 'High': return '#F39C12'
      default: return '#95A5A6'
    }
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={() => onClose()} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <View style={styles.emergencyBadge}><View style={styles.statusDot} /><Text style={styles.badgeText}>LIVE</Text></View>
            <Text style={styles.mainTitle}>Emergency Services</Text>
          </View>
          <Text style={styles.subtitle}>🚨 Professional emergency response • Available 24/7 • Immediate assistance</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}><Text style={styles.statNumber}>{allServices.length}</Text><Text style={styles.statLabel}>Services</Text></View>
            <View style={styles.statItem}><Text style={styles.statNumber}>24/7</Text><Text style={styles.statLabel}>Available</Text></View>
            <View style={styles.statItem}><Text style={styles.statNumber}>5s</Text><Text style={styles.statLabel}>Response</Text></View>
            <View style={styles.statItem}><Text style={styles.statNumber}>{currentTime}</Text><Text style={styles.statLabel}>Current</Text></View>
          </View>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {allServices.map((service, index) => {
            const isCustomContact = !emergencyServices.includes(service);
            const customIndex = customContacts.findIndex(c => c.title === service.title && c.number === service.number);
            return (
              <TouchableOpacity
                key={`${service.title}-${index}`}
                style={[styles.serviceButton, { borderLeftColor: service.color }]}
                activeOpacity={0.8}
                onPress={() => handleCall(service)}
                onLongPress={() => handleLongPress(service, index)}
                delayLongPress={800}
              >
                <View style={styles.serviceContent}>
                  <View style={[styles.iconSection, { backgroundColor: service.color + '20' }]}>
                    <Text style={styles.serviceIcon}>{service.icon}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(service.priority) }]}>
                      <Text style={styles.priorityText}>{service.priority}</Text>
                    </View>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                    <Text style={[styles.serviceNumber, { color: service.color }]}>{service.number}</Text>
                  </View>

                  <View style={styles.actionSection}>
                    {isCustomContact && <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteContact(customIndex)}>
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>}
                    <View style={[styles.callButton, { backgroundColor: service.color }]}><Text style={styles.callButtonText}>{service.isAddButton ? '✨' : '📞'}</Text></View>
                  </View>
                </View>
                {!service.isAddButton && <View style={styles.quickHint}><Text style={styles.quickHintText}>Hold for quick actions</Text></View>}
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        <View style={styles.footerSection}>
          <View style={styles.footerRow}>
            <View style={styles.systemStatus}><View style={styles.statusIndicator} /><Text style={styles.statusText}>All systems operational</Text></View>
            <Text style={styles.lastUpdated}>Updated {currentTime}</Text>
          </View>
          <View style={styles.emergencyTip}><Text style={styles.emergencyTipText}>💡 Tip: Hold any service for quick actions • Swipe for more options</Text></View>
          <View style={styles.legalDisclaimer}><Text style={styles.disclaimerText}>⚠️ For immediate life-threatening emergencies, call emergency services directly</Text></View>
        </View>
      </View>

      <Modal visible={showAddContact} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddContact(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>
            <TouchableOpacity onPress={() => setShowAddContact(false)} style={styles.modalCloseButton}><Text style={styles.modalCloseText}>✕</Text></TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Contact Name *</Text>
              <TextInput style={styles.textInput} placeholder="e.g., Mom, Dad, Doctor..." placeholderTextColor="#95A5A6" value={newContact.name} onChangeText={(text) => setNewContact({...newContact, name: text})} />
            </View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput style={styles.textInput} placeholder="e.g., +27 123 456 7890" placeholderTextColor="#95A5A6" keyboardType="phone-pad" value={newContact.number} onChangeText={(text) => setNewContact({...newContact, number: text})} />
            </View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput style={styles.textInput} placeholder="e.g., Family doctor, Close friend..." placeholderTextColor="#95A5A6" value={newContact.description} onChangeText={(text) => setNewContact({...newContact, description: text})} />
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddContact} activeOpacity={0.8}><Text style={styles.addButtonText}>➕ Add Emergency Contact</Text></TouchableOpacity>
            <View style={styles.modalTip}><Text style={styles.modalTipText}>💡 Your contacts are saved locally and will appear in the main list</Text></View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default Helpline




const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 60,
    height: height * 0.75,
    width: width * 0.95,
    alignSelf: "center",
    zIndex: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    padding: 20,
  },

  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  headerSection: {
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.4)',
  },

  statusDot: {
    width: 6,
    height: 6,
    backgroundColor: '#E74C3C',
    borderRadius: 3,
    marginRight: 6,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E74C3C',
  },

  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },

  subtitle: {
    fontSize: 13,
    color: '#CCCCCC',
    marginBottom: 16,
    lineHeight: 18,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  statItem: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  statLabel: {
    fontSize: 11,
    color: '#AAAAAA',
    marginTop: 2,
  },

  scrollContainer: {
    flex: 1,
    marginVertical: 16,
  },

  serviceButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#404040',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  iconSection: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },

  serviceIcon: {
    fontSize: 22,
  },

  priorityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  priorityText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },

  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  serviceDescription: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 6,
    lineHeight: 16,
  },

  serviceNumber: {
    fontSize: 14,
    fontWeight: '600',
  },

  actionSection: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },

  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.4)',
  },

  deleteButtonText: {
    fontSize: 14,
  },

  quickHint: {
    position: 'absolute',
    bottom: 4,
    right: 16,
  },

  quickHintText: {
    fontSize: 9,
    color: '#666666',
    fontStyle: 'italic',
  },

  emergencyTip: {
    backgroundColor: 'rgba(52, 152, 219, 0.15)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498DB',
  },

  emergencyTipText: {
    fontSize: 11,
    color: '#87CEEB',
    lineHeight: 14,
  },

  legalDisclaimer: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E74C3C',
  },

  disclaimerText: {
    fontSize: 10,
    color: '#FFB6C1',
    textAlign: 'center',
    lineHeight: 13,
    fontWeight: '500',
  },

  modalTip: {
    backgroundColor: 'rgba(155, 89, 182, 0.15)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#9B59B6',
  },

  modalTipText: {
    fontSize: 12,
    color: '#DDA0DD',
    lineHeight: 16,
  },

  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  callButtonText: {
    fontSize: 18,
  },

  footerSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  systemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusIndicator: {
    width: 6,
    height: 6,
    backgroundColor: '#27AE60',
    borderRadius: 3,
    marginRight: 8,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#27AE60',
  },

  lastUpdated: {
    fontSize: 11,
    color: '#AAAAAA',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  modalContent: {
    flex: 1,
    padding: 20,
  },

  inputGroup: {
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },

  textInput: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },

  addButton: {
    backgroundColor: '#9B59B6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});