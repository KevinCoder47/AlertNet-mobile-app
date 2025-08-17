import { StyleSheet, Text, View, Dimensions, Image, TouchableOpacity, Platform, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import * as Contacts from 'expo-contacts';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleUserData, createUserDocument } from '../../../services/firestore';
import { getUsersByPhoneNumbers } from '../../../services/firestore';
import { getAuth } from 'firebase/auth';

const { width, height } = Dimensions.get('window');

// Platform-specific sizing
const IMAGE_SIZE = Platform.OS === 'android' ? 80 : 100;
const IMAGE_OVERLAP = Platform.OS === 'android' ? -40 : -50;
const TOP_MARGIN = Platform.OS === 'android' ? height * 0.28 : height * 0.3;
const HEADING_SIZE = Platform.OS === 'android' ? 32 : 40;
const HEADING_LH = Platform.OS === 'android' ? 40 : 50;
const PARAGRAPH_SIZE = Platform.OS === 'android' ? 12 : 13;
const PARAGRAPH_LH = Platform.OS === 'android' ? 18 : 20;
const BUTTON_BOTTOM = Platform.OS === 'android' ? 40 : 60;
const COUNTER_SIZE = Platform.OS === 'android' ? 13 : 15;

// Helper function to normalize phone numbers
const normalizePhoneNumber = (phoneNumber) => {
  return phoneNumber.replace(/\D/g, '').replace(/^0/, '+27');
};

const ContactPickerModal = ({ 
  visible, 
  onClose, 
  contacts, 
  selectedContacts, 
  onSelectContacts 
}) => {
  const [tempSelected, setTempSelected] = useState(selectedContacts);

    const toggleContact = (contact) => {
    const isSelected = tempSelected.some(c => c.uid === contact.uid); // Compare by UID
    if (isSelected) {
        setTempSelected(tempSelected.filter(c => c.uid !== contact.uid));
    } else {
        setTempSelected([...tempSelected, contact]);
    }
    };

  const handleConfirm = () => {
    onSelectContacts(tempSelected);
    onClose();
  };
    
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Alertnet Contacts</Text>
          <TouchableOpacity onPress={handleConfirm}>
            <Text style={styles.modalConfirm}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => toggleContact(item)}
            >
              <View style={styles.contactInfo}>
                {item.imageAvailable ? (
                  <Image 
                    source={{ uri: item.image.uri }} 
                    style={styles.contactImage} 
                  />
                ) : (
                  <View style={[styles.contactImage, styles.placeholderImage]} />
                )}
                <Text style={styles.contactName}>{item.name}</Text>
              </View>
              
                <View style={styles.checkbox}>
                {tempSelected.some(c => c.uid === item.uid) && ( // Check by UID
                    <View style={styles.checkboxSelected} />
                )}
                </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
};

const AddFriends = ({ navigation, setIsLoggedIn }) => {
    const [totalContacts, setTotalContacts] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [allContacts, setAllContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [userData, setUserData] = useState(null);
    const [registeredContacts, setRegisteredContacts] = useState([]);
    const [isCheckingContacts, setIsCheckingContacts] = useState(false);
    
    // Get user data from AsyncStorage
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const jsonValue = await AsyncStorage.getItem('userData');
                if (jsonValue) {
                    const data = JSON.parse(jsonValue);
                    setUserData({
                        ...data,
                        fullName: `${data.name} ${data.surname}`,
                        phoneNumber: data.phone
                    });
                    
                    // Load and migrate previously selected contacts
                    if (data.friends) {
                        // Migrate old format to new format
                        const migratedFriends = data.friends.map(friend => {
                            // If friend doesn't have uid, use id temporarily
                            return {
                                uid: friend.uid || friend.id,
                                name: friend.name,
                                email: friend.email,
                                phoneNumber: friend.phoneNumber
                            };
                        });
                        setSelectedContacts(migratedFriends);
                    }
                }
            } catch (e) {
                console.error('Error reading user data:', e);
            }
        };
        
        fetchUserData();
    }, []);


//get users by phone number from firestore
const fetchAndFilterContacts = async () => {
  setIsLoading(true);
  const { status } = await Contacts.requestPermissionsAsync();
  
  if (status === 'granted') {
    setPermissionGranted(true);
    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name, 
        Contacts.Fields.Image,
        Contacts.Fields.PhoneNumbers
      ],
    });
    
    setTotalContacts(data.length);
    setAllContacts(data);
    
    // Extract and normalize phone numbers
    const phoneNumbers = data.flatMap(contact => 
      (contact.phoneNumbers || []).map(p => 
        normalizePhoneNumber(p.number)
      )
    ).filter(Boolean);
    
    if (phoneNumbers.length > 0) {
      setIsCheckingContacts(true);
      try {
        // Find Alertnet users by phone numbers
        const usersMap = await getUsersByPhoneNumbers(phoneNumbers);
        
        // Map contacts to Alertnet users
        const verifiedContacts = data.reduce((acc, contact) => {
          if (!contact.phoneNumbers) return acc;
          
          // Try to find a matching phone number
          for (const phoneObj of contact.phoneNumbers) {
            const normalizedPhone = normalizePhoneNumber(phoneObj.number);
            const user = usersMap[normalizedPhone];
            
                if (user) {
                acc.push({
                    ...contact,
                    alertnetUser: user, // Contains friend's Firebase UID
                    uid: user.id, // Store friend's Firebase UID here
                    phoneNumber: normalizedPhone,
                    name: contact.name || `${user.Name} ${user.Surname}`,
                    imageAvailable: Boolean(user.ImageURL),
                    image: user.ImageURL ? { uri: user.ImageURL } : null
                });
                break;
                }
            }
            return acc;
            }, []);
        
        setRegisteredContacts(verifiedContacts);
      } catch (error) {
        console.error('Failed to find Alertnet users:', error);
        Alert.alert('Notice', 'No registered contacts found');
        setRegisteredContacts([]); // Set empty array on error
      } finally {
        setIsCheckingContacts(false);
      }
    } else {
      // No phone numbers found
      setRegisteredContacts([]);
    }
  }
  
  setIsLoading(false);
  return status === 'granted';
};

    // Filter contacts to only include Alertnet users
    const filterRegisteredContacts = async (contacts) => {
        const verifiedContacts = [];
        
        for (const contact of contacts) {
            if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) continue;
            
            for (const phoneObj of contact.phoneNumbers) {
                try {
                    const normalizedPhone = normalizePhoneNumber(phoneObj.number);
                    const email = `${normalizedPhone}@student.uj.ac.za`;
                    
                    // Check if user exists with this email
                    const userExists = await checkUserExists(email);
                    
                    if (userExists) {
                        verifiedContacts.push({
                            ...contact,
                            alertnetEmail: email,
                            phoneNumber: normalizedPhone
                        });
                        break; // Stop checking other numbers for this contact
                    }
                } catch (error) {
                    console.error('Error checking contact:', contact.name, error);
                }
            }
        }
        
        return verifiedContacts;
    };

useEffect(() => {
  const fetchUserData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('userData');
      console.log('Stored userData:', jsonValue);  // Debug log
      
      if (jsonValue) {
        const data = JSON.parse(jsonValue);
        console.log('Parsed userData:', data);  // Debug log
        
        setUserData({
          ...data,
          fullName: `${data.name} ${data.surname}`,
          phoneNumber: data.phone
        });
        
        if (data.friends) {
          setSelectedContacts(data.friends);
        }
      }
    } catch (e) {
      console.error('Error reading user data:', e);
    }
  };
  
  fetchUserData();
}, []);

    const handleAllowFullAccess = async () => {
        const granted = await fetchAndFilterContacts();
        if (granted) {
            // Auto-select all registered contacts
            setSelectedContacts(registeredContacts);
        }
    };

    const handleSelectContacts = async () => {
        const granted = await fetchAndFilterContacts();
        if (granted) {
            setModalVisible(true);
        }
    };

    const handleContactsSelected = (contacts) => {
        setSelectedContacts(contacts);
    };

// Save user data to Firestore - UPDATED TO CREATE DOCUMENT
    const saveUserToFirestore = async () => {
        try {
            setIsLoading(true);
            
            const jsonValue = await AsyncStorage.getItem('userData');
            if (!jsonValue) {
                throw new Error('User data not found in storage');
            }
            
            const currentUserData = JSON.parse(jsonValue);
            const userId = currentUserData.userId;
            
            if (!userId) {
                throw new Error('User ID not available');
            }

            // Prepare contacts data with FRIEND'S FIREBASE UID
            const alertnetContacts = selectedContacts.map(contact => ({
                uid: contact.alertnetUser?.id || contact.uid, // Use friend's Firebase UID
                name: contact.name,
                email: contact.alertnetUser?.Email || contact.email,
                phoneNumber: contact.phoneNumber
            }));

            // Create user document with friends
            await createUserDocument(userId, {
                name: currentUserData.name || '',
                surname: currentUserData.surname || '',
                phone: currentUserData.phoneNumber || '',
                email: currentUserData.email || '',
                imageUrl: currentUserData.imageUrl || '',
                gender: currentUserData.gender || '',
                campus: currentUserData.campus || "",  
                currentLocation: currentUserData.currentLocation || {  
                    latitude: -26.2041,  
                    longitude: 28.0473
                },
                residenceAddress: currentUserData.residenceAddress || {  
                    latitude: 0,
                    longitude: 0
                },
                rating: currentUserData.rating || 0,  
                walks: currentUserData.walks || 0,
                friends: alertnetContacts
            });
            
            // Update AsyncStorage with new contacts format
            const updatedUserData = {
                ...currentUserData,
                friends: alertnetContacts
            };
            await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
            
            // Update local state
            setUserData(updatedUserData);
            
            // Mark user as logged in
            await AsyncStorage.setItem('isLoggedIn', 'true');
            setIsLoggedIn(true);
        } catch (error) {
            console.error('Failed to save contacts:', error);
            Alert.alert('Error', error.message || 'Failed to save your data');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || isCheckingContacts) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#C84022" />
                {isCheckingContacts && (
                    <Text style={styles.loaderText}>Finding Alertnet contacts...</Text>
                )}
            </View>
        );
    }

    // Determine contacts to display based on selection method
    let displayContacts = [];
    let extraCount = 0;
    
    if (selectedContacts.length > 0) {
        displayContacts = selectedContacts.slice(0, 3);
        extraCount = Math.max(0, selectedContacts.length - 3);
    } else if (permissionGranted && registeredContacts.length > 0) {
        displayContacts = registeredContacts
            .filter(contact => contact.imageAvailable)
            .slice(0, 3);
        extraCount = Math.max(0, registeredContacts.length - 3);
    }

    const placeholderImage = require('../../images/profile-pictures/14.jpg');

    return (
        <View style={styles.container}>
            <View style={[styles.halfView]} />
            <View style={[styles.rest, { marginTop: TOP_MARGIN }]}>
                <View style={styles.profileContainer}>
                    {displayContacts.map((contact, index) => (
                        <Image
                            key={contact.id}
                            style={[
                                styles.image, 
                                index > 0 && { marginLeft: IMAGE_OVERLAP }
                            ]}
                            source={
                                contact.imageAvailable 
                                    ? { uri: contact.image.uri } 
                                    : placeholderImage
                            }
                        />
                    ))}
                    
                    {displayContacts.length === 0 && permissionGranted && (
                        <Image
                            style={styles.image}
                            source={placeholderImage}
                        />
                    )}

                    {extraCount > 0 && (
                        <Text style={[styles.counter, { fontSize: COUNTER_SIZE }]}>
                            + {extraCount}
                        </Text>
                    )}
                </View>

                <Text style={styles.p}>
                    {permissionGranted ? (
                        selectedContacts.length > 0 ? (
                            <>
                                You've selected{" "}
                                <Text style={{ fontWeight: '800' }}>{selectedContacts.length}</Text>
                                {" "}Alertnet contacts
                            </>
                        ) : (
                            <>
                                You have{" "}
                                <Text style={{ fontWeight: '800' }}>{totalContacts}</Text>
                                {" "}contacts in total,{" "}
                                <Text style={{ fontWeight: '800', color: '#F57527' }}>
                                    {registeredContacts.length}
                                </Text>
                                {" "}are on Alertnet
                            </>
                        )
                    ) : (
                        "Connect your contacts to find friends on Alertnet"
                    )}
                </Text>

                <Text style={[styles.bigText, { fontSize: HEADING_SIZE, lineHeight: HEADING_LH }]}>
                    How do you want to add friends?
                </Text>

                <Text style={[styles.p2, { 
                    fontSize: PARAGRAPH_SIZE, 
                    lineHeight: PARAGRAPH_LH 
                }]}>
                    {selectedContacts.length > 0 ? (
                        "You're only adding contacts who are registered on Alertnet"
                    ) : (
                        "We'll only add contacts who are registered on Alertnet"
                    )}
                </Text>
            </View>
            
            <View style={[styles.buttonContainer, { marginBottom: BUTTON_BOTTOM }]}>
                {/* Allow Full Access Button - Original Style */}
                <TouchableOpacity 
                    onPress={handleAllowFullAccess}
                    disabled={isCheckingContacts}
                >
                    <Text style={[styles.btnText, { color: '#C84022' }]}>
                        Add all Contacts
                    </Text>
                </TouchableOpacity>
                
                {/* Select Contacts Button - Original Style */}
                <TouchableOpacity 
                    onPress={handleSelectContacts} 
                    style={styles.selectContacts}
                    disabled={isCheckingContacts}
                >
                    <Text style={[styles.btnText, { color: 'white' }]}>
                        Select Contacts
                    </Text>
                </TouchableOpacity>
            </View>

            <ContactPickerModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                contacts={registeredContacts}
                selectedContacts={selectedContacts}
                onSelectContacts={handleContactsSelected}
            />
            
            {/* Floating Action Button - MODIFIED TO ALLOW EMPTY CONTACTS */}
            <TouchableOpacity
                onPress={saveUserToFirestore}
                style={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    zIndex: 100,
                    backgroundColor: 'transparent',
                }}
                activeOpacity={0.7}
                disabled={isCheckingContacts}  // Only disable when checking
            >
                <Ionicons 
                    name="arrow-forward-circle" 
                    size={60} 
                    color={isCheckingContacts ? "#CCCCCC" : "#C84022"} 
                />
            </TouchableOpacity>
        </View>
    );
};

export default AddFriends;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: width,
        height: height,
        alignItems: 'center',
        position: 'absolute',
        backgroundColor: '#FEF7EE'
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FEF7EE'
    },
    loaderText: {
        marginTop: 20,
        color: '#C84022',
        fontWeight: '500'
    },
    halfView: {
        width: width,
        height: height * 0.5,
        backgroundColor: '#FFF2E1',
        borderRadius: 20,
        zIndex: 1,
        position: 'absolute'
    },
    rest: {
        zIndex: 2,
        flexDirection: 'column',
        width: width,
        alignItems: 'center'
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        zIndex: 2,
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: IMAGE_SIZE / 2,
        borderWidth: 3,
        borderColor: 'white',
        backgroundColor: '#f0f0f0',
    },
    counter: {
        fontWeight: '800',
        marginLeft: 10,
        color: '#F57527',
        alignSelf: 'center',
    },
    p: {
        fontSize: 11,
        fontWeight: '400',
        marginTop: 30,
        textAlign: 'center',
        color: '#333'
    },
    bigText: {
        textAlign: 'center',
        fontWeight: '600',
        marginTop: 40,
        maxWidth: width * 0.8,
        color: '#222'
    },
    p2: {
        textAlign: 'center',
        maxWidth: width * 0.7,
        marginTop: 20,
        color: '#555'
    },
    selectContacts: {
        marginBottom: 20,
        width: width * 0.8,
        height: 52,
        backgroundColor: '#C84022',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
    },
    btnText: {
        fontSize: 15,
        fontWeight: '700'
    },
    buttonContainer: { 
        marginTop: 'auto', 
        flexDirection: 'column-reverse', 
        alignItems: 'center',
        width: '100%',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'white',
        paddingTop: 50,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#222'
    },
    modalCancel: {
        color: 'gray',
        fontSize: 16
    },
    modalConfirm: {
        color: '#C84022',
        fontWeight: 'bold',
        fontSize: 16
    },
    contactItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    contactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 15,
    },
    placeholderImage: {
        backgroundColor: '#e0e0e0',
    },
    contactName: {
        fontSize: 16,
        color: '#333'
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#C84022',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#C84022',
    },
});