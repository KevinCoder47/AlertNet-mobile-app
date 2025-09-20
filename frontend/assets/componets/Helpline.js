import { StyleSheet, Text, View, Dimensions, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Linking, Animated, PanResponder } from 'react-native'
import { useTheme } from '../contexts/ColorContext';
import React, { useState, useEffect, useRef } from 'react'
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
  const [isExpanded, setIsExpanded] = useState(false)

  // Enhanced animation system like PeopleBar
  const baseHeight = height * 0.35;
  const maxHeight = Math.min(height * 0.65, height - 100);
  
  const animatedHeight = useRef(new Animated.Value(baseHeight)).current;
  const animatedOpacity = useRef(new Animated.Value(1)).current;
  
  // Drag configuration
  const dragState = useRef({
    isDragging: false,
    startHeight: baseHeight,
    minHeight: baseHeight,
    maxHeight,
  }).current;

  useEffect(() => {
    AsyncStorage.getItem('customContacts').then(data => {
      if (data) setCustomContacts(JSON.parse(data));
    });
    AsyncStorage.getItem('favoriteContacts').then(data => {
      if (data) setFavorites(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('customContacts', JSON.stringify(customContacts));
  }, [customContacts]);

  useEffect(() => {
    AsyncStorage.setItem('favoriteContacts', JSON.stringify(favorites));
  }, [favorites]);

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

  // Enhanced PanResponder system from PeopleBar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: (_, gestureState) => {
        dragState.isDragging = true;
        dragState.startHeight = animatedHeight._value;
        animatedHeight.stopAnimation();
        animatedOpacity.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (!dragState.isDragging) return;
        
        const newHeight = Math.max(
          dragState.minHeight,
          Math.min(dragState.maxHeight, dragState.startHeight - gestureState.dy)
        );
        
        animatedHeight.setValue(newHeight);
        
        const heightProgress = (newHeight - dragState.minHeight) / (dragState.maxHeight - dragState.minHeight);
        animatedOpacity.setValue(1 - heightProgress);
        
        const midPoint = (dragState.minHeight + dragState.maxHeight) / 2;
        const shouldExpand = newHeight > midPoint;
        if (shouldExpand !== isExpanded) {
          setIsExpanded(shouldExpand);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        dragState.isDragging = false;
        
        const currentHeight = animatedHeight._value;
        const velocity = gestureState.vy;
        const midPoint = (dragState.minHeight + dragState.maxHeight) / 2;
        
        let targetHeight, targetExpanded;
        
        if (Math.abs(velocity) > 0.5) {
          targetHeight = velocity < 0 ? dragState.maxHeight : dragState.minHeight;
          targetExpanded = velocity < 0;
        } else {
          targetHeight = currentHeight > midPoint ? dragState.maxHeight : dragState.minHeight;
          targetExpanded = currentHeight > midPoint;
        }
        
        setIsExpanded(targetExpanded);
        Animated.parallel([
          Animated.spring(animatedHeight, {
            toValue: targetHeight,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(animatedOpacity, {
            toValue: targetExpanded ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        dragState.isDragging = false;
        const currentHeight = animatedHeight._value;
        const midPoint = (dragState.minHeight + dragState.maxHeight) / 2;
        const targetHeight = currentHeight > midPoint ? dragState.maxHeight : dragState.minHeight;
        const targetExpanded = currentHeight > midPoint;
        
        setIsExpanded(targetExpanded);
        Animated.parallel([
          Animated.spring(animatedHeight, { toValue: targetHeight, useNativeDriver: false }),
          Animated.timing(animatedOpacity, { toValue: targetExpanded ? 0 : 1, duration: 200, useNativeDriver: true }),
        ]).start();
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  // Function to toggle panel programmatically
  const togglePanel = (expand) => {
    const targetHeight = expand ? dragState.maxHeight : dragState.minHeight;
    setIsExpanded(expand);
    
    Animated.parallel([
      Animated.spring(animatedHeight, {
        toValue: targetHeight,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(animatedOpacity, {
        toValue: expand ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

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
    
    // Check if this is a custom contact (added after the default emergency services)
    const isCustomContact = index >= emergencyServices.length
    
    const actions = [
      { text: 'Call Now', onPress: () => handleCall(service) },
      { text: 'Copy Number', onPress: () => copyToClipboard(service.number) },
      { text: favorites.includes(index) ? 'Remove from Favorites' : 'Add to Favorites', onPress: () => toggleFavorite(index) },
    ]
    
    // Add delete option only for custom contacts
    if (isCustomContact) {
      const customContactIndex = index - emergencyServices.length
      actions.push({ 
        text: 'Delete Contact', 
        style: 'destructive', 
        onPress: () => handleDeleteContact(customContactIndex) 
      })
    }
    
    actions.push({ text: 'Cancel', style: 'cancel' })
    
    Alert.alert('Quick Actions', `${service.title} - ${service.number}`, actions)
  }

  const toggleFavorite = (index) => {
    if (favorites.includes(index)) {
      setFavorites(favorites.filter(i => i !== index))
    } else {
      setFavorites([...favorites, index])
    }
  }

  const handleDeleteContact = (customContactIndex) => {
    if (customContactIndex < 0 || customContactIndex >= customContacts.length) return;
    
    const contactToDelete = customContacts[customContactIndex]
    
    Alert.alert(
      'Delete Contact', 
      `Are you sure you want to delete "${contactToDelete.title}"?`, 
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            const updatedContacts = customContacts.filter((_, i) => i !== customContactIndex)
            setCustomContacts(updatedContacts)
            
            // Also update favorites list to remove any references to deleted contacts
            const totalEmergencyServices = emergencyServices.length
            const deletedContactGlobalIndex = totalEmergencyServices + customContactIndex
            const updatedFavorites = favorites
              .filter(favIndex => favIndex !== deletedContactGlobalIndex)
              .map(favIndex => {
                // Adjust indices for contacts that come after the deleted one
                if (favIndex > deletedContactGlobalIndex) {
                  return favIndex - 1
                }
                return favIndex
              })
            setFavorites(updatedFavorites)
            
            Alert.alert('Deleted', `"${contactToDelete.title}" has been removed from your emergency contacts.`)
          }
        }
      ]
    )
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
      <Animated.View style={[styles.container, { height: animatedHeight }]}>
        {/* Enhanced drag handle with PeopleBar styling */}
        <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
          <Animated.Text style={[styles.swipeHint, { opacity: animatedOpacity }]}>
            {isExpanded ? 'Swipe down to collapse' : 'Swipe up to expand'}
          </Animated.Text>
          {isExpanded && (
            <Text style={styles.dragDownHint}>
              Drag down to collapse
            </Text>
          )}
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>🚨 Emergency Services</Text>
            {isExpanded && (
              <TouchableOpacity 
                onPress={() => togglePanel(false)} 
                style={styles.collapseButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.collapseButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.headerSubtitle}>Tap to call • Long press for options</Text>
          <Text style={styles.timeText}>Current time: {currentTime}</Text>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={true} 
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled={true}
        >
          {allServices.map((service, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.card, { borderLeftColor: service.color }]} 
              onPress={() => handleCall(service)} 
              onLongPress={() => handleLongPress(service, index)}
              activeOpacity={0.7}
            >
              <View style={styles.leftSection}>
                <Text style={styles.cardIcon}>{service.icon}</Text>
                {favorites.includes(index) && (
                  <View style={styles.favoriteIndicator}>
                    <Text style={styles.favoriteStar}>⭐</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardContent}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{service.title}</Text>
                  {favorites.includes(index) && (
                    <Text style={styles.favoriteStarInline}>★</Text>
                  )}
                </View>
                <Text style={styles.cardDesc}>{service.description}</Text>
                <Text style={styles.cardNumber}>{service.number}</Text>
              </View>
              <View style={styles.rightSection}>
                <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(service.priority) }]}>
                  <Text style={styles.priorityText}>{service.priority}</Text>
                </View>
                {favorites.includes(index) && (
                  <Text style={styles.favoriteStarCorner}>★</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <Modal visible={showAddContact} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Name" 
              placeholderTextColor="#999" 
              value={newContact.name} 
              onChangeText={(text) => setNewContact({ ...newContact, name: text })} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Phone Number" 
              placeholderTextColor="#999" 
              keyboardType="phone-pad" 
              value={newContact.number} 
              onChangeText={(text) => setNewContact({ ...newContact, number: text })} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Description (optional)" 
              placeholderTextColor="#999" 
              value={newContact.description} 
              onChangeText={(text) => setNewContact({ ...newContact, description: text })} 
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                onPress={() => setShowAddContact(false)} 
                style={[styles.modalButton, { backgroundColor: '#E74C3C' }]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleAddContact} 
                style={[styles.modalButton, { backgroundColor: '#27AE60' }]}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

export default Helpline

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 60,
    width: width * 0.95,
    alignSelf: "center",
    zIndex: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
  },
  dragHandle: {
    width: 50,
    height: 4,
    backgroundColor: '#555',
    borderRadius: 2,
  },
  swipeHint: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 6,
    textAlign: 'center',
  },
  dragDownHint: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  headerInfo: { 
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1, 
    borderBottomColor: '#333' 
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  headerSubtitle: { 
    color: '#ccc', 
    fontSize: 12, 
    marginBottom: 2 
  },
  timeText: { 
    color: '#999', 
    fontSize: 11 
  },
  collapseButton: {
    padding: 6,
    backgroundColor: '#333',
    borderRadius: 6,
  },
  collapseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    marginVertical: 6, 
    backgroundColor: '#2C2C2C', 
    borderRadius: 10, 
    borderLeftWidth: 5 
  },
  leftSection: {
    position: 'relative',
    marginRight: 12,
    alignItems: 'center',
  },
  favoriteIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  favoriteStar: {
    fontSize: 12,
    color: '#fff',
  },
  cardIcon: { 
    fontSize: 24, 
  },
  cardContent: { 
    flex: 1 
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  favoriteStarInline: {
    fontSize: 16,
    color: '#FFD700',
    marginLeft: 8,
  },
  cardTitle: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold',
    flex: 1,
  },
  cardDesc: { 
    color: '#ccc', 
    fontSize: 12 
  },
  cardNumber: { 
    color: '#bbb', 
    fontSize: 14, 
    marginTop: 2 
  },
  rightSection: {
    alignItems: 'flex-end',
    position: 'relative',
  },
  favoriteStarCorner: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 4,
  },
  priorityTag: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  priorityText: { 
    color: '#fff', 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.7)' 
  },
  modalContent: { 
    width: '90%', 
    backgroundColor: '#1A1A1A', 
    borderRadius: 16, 
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 16,
    textAlign: 'center',
  },
  input: { 
    backgroundColor: '#2C2C2C', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 12, 
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
  },
  modalButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 8, 
    marginHorizontal: 6, 
    alignItems: 'center' 
  },
  modalButtonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16,
  }
});