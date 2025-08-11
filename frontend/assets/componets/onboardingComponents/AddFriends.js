import { StyleSheet, Text, View, Dimensions, Image, TouchableOpacity, Platform, Modal, FlatList, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import * as Contacts from 'expo-contacts';
import Ionicons from '@expo/vector-icons/Ionicons';
import { setDoc, doc } from 'firebase/firestore';
import { db, app } from '../../../backend/Firebase/FirebaseConfig';
import GeneralLoader from '../Loaders/GeneralLoarder';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser } from '../../../backend/Firebase/authentication';
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

const ContactPickerModal = ({ 
  visible, 
  onClose, 
  contacts, 
  selectedContacts, 
  onSelectContacts 
}) => {
  const [tempSelected, setTempSelected] = useState(selectedContacts);

  const toggleContact = (contact) => {
    const isSelected = tempSelected.some(c => c.id === contact.id);
    if (isSelected) {
      setTempSelected(tempSelected.filter(c => c.id !== contact.id));
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
          <Text style={styles.modalTitle}>Select Contacts</Text>
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
                {tempSelected.some(c => c.id === item.id) && (
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
    const [contactsWithAlertnet] = useState(3);
    const [isLoading, setIsLoading] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [allContacts, setAllContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [userData, setUserData] = useState(null);

    // Get user data from AsyncStorage
useEffect(() => {
  // Temporary: Clear storage for debugging
  AsyncStorage.clear().then(() => {
    console.log('AsyncStorage cleared');
  });
        const fetchUserData = async () => {
            try {
                const jsonValue = await AsyncStorage.getItem('userData');
                if (jsonValue) {
                    const data = JSON.parse(jsonValue);
                    // Map stored data to expected format
                    setUserData({
                        ...data,
                        fullName: `${data.name} ${data.surname}`,
                        phoneNumber: data.phone
                    });
                }
            } catch (e) {
                console.error('Error reading user data:', e);
            }
        };
        
        fetchUserData();
    }, []);

    const requestContactsPermission = async () => {
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
        }
        
        setIsLoading(false);
        return status === 'granted';
    };

    const handleAllowFullAccess = async () => {
        const granted = await requestContactsPermission();
        if (granted) {
            setSelectedContacts(allContacts); // Select all contacts
        }
    };

    const handleSelectContacts = async () => {
        const granted = await requestContactsPermission();
        if (granted) {
            setModalVisible(true);
        }
    };

    const handleContactsSelected = (contacts) => {
        setSelectedContacts(contacts);
    };

    // Save user data to Firestore
    const saveUserToFirestore = async () => {
        // if (!userData) {
        //     Alert.alert('Error', 'User data not found');
        //     return;
        // }

        // setIsLoading(true);
        
        // try {
        //     // Register user with Firebase Authentication
        //     const auth = getAuth(app); // Use the app instance from FirebaseConfig
        //     const userCredential = await registerUser(userData.email, userData.password);
        //     const userId = userCredential.user.uid;
            
        //     // Prepare friends data with safe access to phone numbers
        //     const friends = selectedContacts.map(contact => ({
        //         id: contact.id,
        //         name: contact.name,
        //         phoneNumber: contact.phoneNumbers?.[0]?.number || 'No phone number',
        //     }));

        //     // Create user document in Firestore
        //     const userDoc = {
        //         uid: userId,
        //         fullName: userData.fullName,
        //         phone: userData.phoneNumber,
        //         email: userData.email,
        //         friends,
        //         imageurl: '', // Will be added later
        //         currentLocation: { lat: 0, lng: 0 },
        //         createdAt: new Date(),
        //     };

        //     await setDoc(doc(db, "users", userId), userDoc);
            
        //     // Update AsyncStorage with user ID
        //     await AsyncStorage.setItem('userData', JSON.stringify({
        //         ...userData,
        //         uid: userId
        //     }));
            
        //     // Set logged in state
        //     setIsLoggedIn(true);
            
        //     // Navigate to main app
        //     await AsyncStorage.setItem('isLoggedIn', 'true');
            
        // } catch (error) {
        //     console.error('Firestore save error:', error);
        //     Alert.alert('Error', error.message || 'Failed to save user data');
        // } finally {
        //     setIsLoading(false);
        // }
        await AsyncStorage.setItem('isLoggedIn', 'true');
        setIsLoggedIn(true);
    };

    if (isLoading) {
        return <GeneralLoader />;
    }

    // Determine contacts to display based on selection method
    let displayContacts = [];
    let extraCount = 0;
    
    if (selectedContacts.length > 0) {
        displayContacts = selectedContacts.slice(0, 3);
        extraCount = Math.max(0, selectedContacts.length - 3);
    } else if (permissionGranted && allContacts.length > 0) {
        displayContacts = allContacts
            .filter(contact => contact.imageAvailable)
            .slice(0, 3);
        extraCount = Math.max(0, totalContacts - 3);
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
                                {" "}contacts
                            </>
                        ) : (
                            <>
                                You have{" "}
                                <Text style={{ fontWeight: '800' }}>{totalContacts}</Text>
                                {" "}contacts in total,{" "}
                                <Text style={{ fontWeight: '800', color: '#F57527' }}>
                                    {contactsWithAlertnet}
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
                    Selecting friends lets you pick the ones
                    you want to add right now. You can
                    always add more later. Allowing full
                    access will add all your contacts active on
                    the app.
                </Text>
            </View>
            
            <View style={[styles.buttonContainer, { marginBottom: BUTTON_BOTTOM }]}>
                <TouchableOpacity onPress={handleAllowFullAccess}>
                    <Text style={[styles.btnText, { color: '#C84022' }]}>
                        Allow Full Access
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={handleSelectContacts} 
                    style={styles.selectContacts}
                >
                    <Text style={[styles.btnText, { color: 'white' }]}>
                        Select Contacts
                    </Text>
                </TouchableOpacity>
            </View>

            <ContactPickerModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                contacts={allContacts}
                selectedContacts={selectedContacts}
                onSelectContacts={handleContactsSelected}
            />
            
            {/* Floating Action Button */}
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
            >
                <Ionicons name="arrow-forward-circle" size={60} color="#C84022" />
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
        textAlign: 'center'
    },
    bigText: {
        textAlign: 'center',
        fontWeight: '600',
        marginTop: 40,
        maxWidth: width * 0.8,
    },
    p2: {
        textAlign: 'center',
        maxWidth: width * 0.7,
        marginTop: 20,
    },
    selectContacts: {
        marginBottom: 20,
        width: width * 0.8,
        height: 52,
        backgroundColor: '#C84022',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
        color: 'white'
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
    },
    modalCancel: {
        color: 'gray',
    },
    modalConfirm: {
        color: '#C84022',
        fontWeight: 'bold',
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