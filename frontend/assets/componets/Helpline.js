import { StyleSheet, Text, View, Dimensions, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Linking, Animated, PanResponder, Platform, StatusBar } from 'react-native'
import { useTheme } from '../contexts/ColorContext';
import { useFontSize } from '../contexts/FontSizeContext';
import React, { useState, useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window')

// Cross-platform safe area calculations (copied from PeopleBar)
const getStatusBarHeight = () => {
  if (Platform.OS === 'ios') {
    return height >= 812 ? 44 : 20;
  }
  return StatusBar.currentHeight || 24;
};

const Helpline = ({ onClose = () => console.log('Close button pressed - please implement onClose prop') }) => {
  const { colors, isDark } = useTheme() // Use your theme context instead of useColorScheme
  const { getScaledFontSize } = useFontSize(); // Add font scaling support
  const [showAddContact, setShowAddContact] = useState(false)
  const [customContacts, setCustomContacts] = useState([])
  const [favorites, setFavorites] = useState([])
  const [newContact, setNewContact] = useState({ name: '', number: '', description: '' })
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
  const [isExpanded, setIsExpanded] = useState(false)

  // Remove the useColorScheme hook - we're using useTheme instead
  
  // Responsive dimensions (matching PeopleBar exactly)
  const statusBarHeight = getStatusBarHeight();
  const baseHeight = height * 0.33;
  const maxHeight = Math.min(height * 0.65, height - 150);
  
  // Animation values (matching PeopleBar)
  const animatedHeight = useRef(new Animated.Value(baseHeight)).current;
  const animatedOpacity = useRef(new Animated.Value(1)).current;
  
  // Drag configuration (matching PeopleBar)
  const dragState = useRef({
    isDragging: false,
    startHeight: baseHeight,
    minHeight: baseHeight,
    maxHeight,
  }).current;

  const styles = getStyles(isDark, colors, getScaledFontSize); // Pass getScaledFontSize to styles

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
    { title: 'Police Emergency', number: '10111', description: 'Crime, accidents, emergencies', icon: { pack: 'MaterialIcons', name: 'local-police' }, color: '#E74C3C', priority: 'Critical', infoIcon: 'help-circle-outline' },
    { title: 'Campus Security', number: '011 559 2885', description: 'On-campus safety & security', icon: { pack: 'Ionicons', name: 'shield-checkmark-outline' }, color: '#3498DB', priority: 'High' },
    { title: 'Medical Emergency', number: '10177', description: 'Ambulance & medical assistance', icon: { pack: 'MaterialCommunityIcons', name: 'ambulance' }, color: '#27AE60', priority: 'Critical' },
    { title: 'Fire Department', number: '10177', description: 'Fire emergencies & rescue', icon: { pack: 'MaterialCommunityIcons', name: 'fire-truck' }, color: '#F39C12', priority: 'Critical' },
    { title: 'Crisis Counseling', number: '0800 567 567', description: '24/7 mental health support', icon: { pack: 'Ionicons', name: 'heart-outline' }, color: '#1ABC9C', priority: 'High' },
    { title: 'Add Emergency Contact', number: 'Tap to add new contact', description: 'Add personal emergency contacts', icon: { pack: 'Ionicons', name: 'add' }, color: '#9B59B6', priority: 'Normal', isAddButton: true }
  ];

  const allServices = [...emergencyServices, ...customContacts];

  // Enhanced PanResponder system (matching PeopleBar)
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

  // Function to toggle panel programmatically (matching PeopleBar)
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

  const handleInfoPress = (service) => {
    Alert.alert(
      `${service.title} Information`,
      `The number ${service.number} is the national toll-free number for the South African Police Service (SAPS) for any crime-related emergencies.`,
      [{ text: 'OK' }]
    );
  };


  const handleLongPress = (service, index) => {
    if (service.isAddButton) return
    
    const isCustomContact = index >= emergencyServices.length
    
    const actions = [
      { text: 'Call Now', onPress: () => handleCall(service) },
      { text: 'Copy Number', onPress: () => copyToClipboard(service.number) },
      { text: favorites.includes(index) ? 'Remove from Favorites' : 'Add to Favorites', onPress: () => toggleFavorite(index) },
    ]
    
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
            
            const totalEmergencyServices = emergencyServices.length
            const deletedContactGlobalIndex = totalEmergencyServices + customContactIndex
            const updatedFavorites = favorites
              .filter(favIndex => favIndex !== deletedContactGlobalIndex)
              .map(favIndex => {
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
      const contact = { title: newContact.name, number: newContact.number, description: newContact.description || 'Personal emergency contact', icon: { pack: 'FontAwesome5', name: 'user-friends' }, color: '#8E44AD', priority: 'Personal' }
      setCustomContacts([...customContacts, contact])
      setNewContact({ name: '', number: '', description: '' })
      setShowAddContact(false)
      Alert.alert('Success', 'Emergency contact added successfully!')
    } else {
      Alert.alert('Error', 'Please enter both name and phone number.')
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return '#E74C3C'
      case 'High': return '#F39C12'
      default: return '#95A5A6'
    }
  }

  const renderIcon = (iconData) => {
    const iconSize = 24;
    const iconColor = colors.text;

    if (iconData?.pack === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={iconData.name} size={iconSize} color={iconColor} />;
    }
    if (iconData?.pack === 'MaterialIcons') {
      return <MaterialIcons name={iconData.name} size={iconSize} color={iconColor} />;
    }
    if (iconData?.pack === 'FontAwesome5') {
      return <FontAwesome5 name={iconData.name} size={iconSize} color={iconColor} />;
    }
    return <Ionicons name={iconData?.name || 'help-circle-outline'} size={iconSize} color={iconColor} />;
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* Updated container to match PeopleBar format */}
      <Animated.View style={[styles.container, { height: animatedHeight }]}>
        <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={styles.blurContainer}>
          <View style={styles.glassOverlay} />

          {/* Enhanced drag handle matching PeopleBar */}
          <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
            <Animated.Text style={[styles.swipeHint, { opacity: animatedOpacity }]}>
              {isExpanded ? 'Swipe down to collapse' : 'Swipe up to expand'}
            </Animated.Text>
          </View>

          {/* Header matching PeopleBar style */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <AntDesign name="alert" size={22} color="#E74C3C" style={styles.headerIcon} />
              <Text style={styles.headerText}>Emergency Services</Text>
            </View>
            <View style={styles.headerRight}>
              {isExpanded && (
                <TouchableOpacity 
                  onPress={() => togglePanel(false)} 
                  style={styles.collapseButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary || colors.secondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Subtitle */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>Tap to call • Long press for options</Text>
          </View>

          {/* Content container matching PeopleBar */}
          <View style={styles.contentContainer}>
            <ScrollView 
              style={styles.list} 
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              nestedScrollEnabled
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
                    <View style={styles.iconContainer}>
                      {renderIcon(service.icon)}
                      {favorites.includes(index) && (
                        <View style={styles.favoriteIndicator}>
                          <Ionicons name="star" size={12} color="#FFD700" />
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.cardContent}>
                    <View style={styles.titleRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{service.title}</Text>
                      {favorites.includes(index) && (
                        <Ionicons name="star" size={16} color="#FFD700" style={styles.favoriteStarInline} />
                      )}
                    </View>
                    <Text style={styles.cardDesc} numberOfLines={1}>{service.description}</Text>
                    <Text style={styles.cardNumber} numberOfLines={1}>{service.number}</Text>
                  </View>
                  
                  <View style={styles.rightSection}>
                    <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(service.priority) }]}>
                      <Text style={styles.priorityText}>{service.priority}</Text>
                    </View>
                    {service.infoIcon && (
                      <TouchableOpacity 
                        style={styles.infoIcon} 
                        onPress={() => handleInfoPress(service)}
                      >
                        <Ionicons name={service.infoIcon} size={getScaledFontSize(22)} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </BlurView>
      </Animated.View>

      {/* Modal for adding contacts */}
      <Modal visible={showAddContact} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Name" 
              placeholderTextColor={colors.placeholder || colors.secondary} 
              value={newContact.name} 
              onChangeText={(text) => setNewContact({ ...newContact, name: text })} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Phone Number" 
              placeholderTextColor={colors.placeholder || colors.secondary} 
              keyboardType="phone-pad" 
              value={newContact.number} 
              onChangeText={(text) => setNewContact({ ...newContact, number: text })} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Description (optional)" 
              placeholderTextColor={colors.placeholder || colors.secondary} 
              value={newContact.description} 
              onChangeText={(text) => setNewContact({ ...newContact, description: text })} 
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                onPress={() => setShowAddContact(false)} 
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleAddContact} 
                style={[styles.modalButton, styles.addButton]}
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

// Updated styles to use theme colors consistently and add font scaling
const getStyles = (isDark, colors, getScaledFontSize) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,
    width: width * 0.95,
    alignSelf: 'center',
    zIndex: 20,
  },
  blurContainer: {
    flex: 1,
    padding: 10,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)',
    borderRadius: 18,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 30,
    height: 4,
    backgroundColor: colors.textSecondary || colors.secondary,
    borderRadius: 2,
  },
  swipeHint: {
    fontSize: getScaledFontSize(10),
    color: colors.textSecondary || colors.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginBottom: 5,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerText: {
    fontSize: getScaledFontSize(18),
    fontWeight: 'bold',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lastUpdatedText: {
    fontSize: getScaledFontSize(10),
    color: colors.textSecondary || colors.secondary,
  },
  collapseButton: {
    padding: 4,
  },
  subtitleContainer: {
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: getScaledFontSize(12),
    color: colors.textSecondary || colors.secondary,
  },
  contentContainer: {
    flex: 1,
  },
  list: { 
    flex: 1,
  },
  listContent: { 
    paddingBottom: 5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.separator || (isDark ? '#444' : '#ccc'),
    borderLeftWidth: 4,
    borderRadius: 8,
    marginVertical: 2,
    backgroundColor: colors.surface || (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
  },
  leftSection: {
    marginRight: 12,
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  favoriteIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.card || colors.background,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: getScaledFontSize(15),
    color: colors.text,
    flex: 1,
  },
  favoriteStarInline: {
    marginLeft: 8,
  },
  cardDesc: {
    fontSize: getScaledFontSize(12),
    color: colors.textSecondary || colors.secondary,
    marginBottom: 2,
  },
  cardNumber: {
    fontSize: getScaledFontSize(12),
    color: colors.textSecondary || colors.secondary,
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priorityTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: getScaledFontSize(9),
    fontWeight: 'bold',
  },
  infoIcon: {
    marginTop: 8,
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  modalContent: {
    width: '90%',
    backgroundColor: colors.card || colors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: getScaledFontSize(18),
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.inputBackground || (isDark ? '#2C2C2C' : '#f5f5f5'),
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.inputBorder || colors.border,
    fontSize: getScaledFontSize(16),
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
  cancelButton: {
    backgroundColor: '#E74C3C',
  },
  addButton: {
    backgroundColor: '#27AE60',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: getScaledFontSize(16),
  }
});

export default Helpline