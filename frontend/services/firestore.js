/**
 * Create a walk request document
 * @param {string} userId - User ID
 * @param {Object} requestData - Walk request data
 * @returns {Promise<string>} - Request ID
 */
export const createWalkRequest = async (userId, requestData) => {  
  try {  
    const requestRef = doc(collection(db, "walkRequests"));  

    // Ensure all required fields are present
    const walkRequestData = {
      requesterId: userId,  
      requesterName: requestData.requesterName || 'Unknown User',  
      pickup: requestData.pickup || 'Unknown Location',  
      destination: requestData.destination || 'Unknown Destination',  
      meetupPoint: requestData.meetupPoint || requestData.pickup,
      preferredGender: requestData.preferredGender || 'Any',
      status: 'pending',  
      createdAt: new Date(),  
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };

    console.log('Creating walk request with data:', walkRequestData);

    await setDoc(requestRef, walkRequestData);  

    console.log('Walk request created with ID:', requestRef.id);
    return requestRef.id;  
  } catch (error) {  
    console.error('Error creating walk request', error);  
    throw error;  
  }  
};
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  deleteDoc,
  writeBatch,
  runTransaction,
  FieldValue,
  query,         
  collection,   
  where,         
  getDocs 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../backend/Firebase/FirebaseConfig';
import { app } from '../backend/Firebase/FirebaseConfig';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * Creates a new user document in Firestore matching your schema
 * @param {string} userId - Firebase Auth UID
 * @param {Object} userData - User data to store
 * @returns {Promise<boolean>} - True if successful
 */
export const createUserDocument = async (userId, userData, profileImageUri = null) => {
  try {
    let imageUrl = userData.imageUrl || '';
    
    console.log("createUserDocument received profileImageUri:", profileImageUri);
    
    // Upload image if provided and it's a local file
    if (profileImageUri && (profileImageUri.startsWith('file://') || profileImageUri.startsWith('/'))) {
      try {
        console.log("Starting image upload for user:", userId);
        
        const formattedUri = profileImageUri.startsWith("file://") 
          ? profileImageUri 
          : `file://${profileImageUri}`;
        
        // Convert image file to blob
        console.log("Fetching image from:", formattedUri);
        const response = await fetch(formattedUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log("Image blob created successfully, size:", blob.size);

        // Create a storage reference
        const timestamp = Date.now();
        const storageRef = ref(storage, `profileImages/${userId}/${timestamp}.jpg`);
        console.log("Storage reference:", storageRef.fullPath);

        const metadata = {
          contentType: 'image/jpeg',
        };
        
        console.log("Uploading image to Firebase Storage...");
        await uploadBytes(storageRef, blob, metadata);
        console.log("Image uploaded successfully");
        
        // Get the download URL
        imageUrl = await getDownloadURL(storageRef);
        console.log("Download URL obtained:", imageUrl);
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        // Don't continue with local URI if upload fails
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }
    } else if (profileImageUri && profileImageUri.startsWith('https://')) {
      // If it's already a URL (from previous upload), use it directly
      imageUrl = profileImageUri;
      console.log("Using existing image URL:", imageUrl);
    } else {
      console.log("No valid profile image provided");
    }

    // Ensure all values are defined
    const safeUserData = {
      campus: userData.campus || "",
      currentLocation: userData.currentLocation || { 
        latitude: -26.2041, 
        longitude: 28.0473 
      },
      email: userData.email || "",
      friends: userData.friends || [],
      gender: userData.gender || "",
      imageUrl: imageUrl,
      name: userData.name || "",
      phone: userData.phone || "",
      rating: userData.rating || 0,
      residenceAddress: userData.residenceAddress || { 
        latitude: 0, 
        longitude: 0 
      },
      schoolAddress: userData.schoolAddress || {  // Add this field
        latitude: 0, 
        longitude: 0 
      },
      surname: userData.surname || "",
      walks: userData.walks || 0
    };

    // Map to Firestore schema
const firestoreData = {
  Campus: safeUserData.campus,
  CreatedAt: new Date(),
  CurrentLocation: safeUserData.currentLocation,
  Email: safeUserData.email,
  Friends: safeUserData.friends,
  Gender: safeUserData.gender,
  ImageURL: safeUserData.imageUrl,
  LastLogin: new Date(),
  Name: safeUserData.name,
  Phone: safeUserData.phone,
  Rating: safeUserData.rating,
  ResidenceAddress: safeUserData.residenceAddress,
  SchoolAddress: safeUserData.schoolAddress || {  
    latitude: 0,
    longitude: 0
  },
  Surname: safeUserData.surname,
  Walks: safeUserData.walks,
  userID: userId,
  PushToken: null, // Will be updated after user grants permission
  PushTokenUpdatedAt: null,
  DevicePlatform: Platform.OS
};

    console.log("Creating user document with data:", firestoreData);
    await setDoc(doc(db, "users", userId), firestoreData);
    console.log("User document created successfully");
    
    return true;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error creating user document:", {
      userId,
      userData,
      handledError
    });
    throw handledError;
  }
};

/**
 * Updates an existing user document
 * @param {string} userId - Firebase Auth UID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} - True if successful
 */
export const updateUserDocument = async (userId, updates) => {
  try {
    // Map updates to your Firestore schema
    const firestoreUpdates = {};
    
    // Direct mapping for simple fields
const fieldMap = {
  campus: "Campus",
  currentLocation: "CurrentLocation",
  email: "Email",
  friends: "Friends",
  gender: "Gender",
  imageUrl: "ImageURL",
  name: "Name",
  phone: "Phone",
  rating: "Rating",
  residenceAddress: "ResidenceAddress",
  schoolAddress: "SchoolAddress",  // Add this line
  surname: "Surname",
  walks: "Walks"
};
    
    for (const [key, value] of Object.entries(updates)) {
      if (fieldMap[key]) {
        firestoreUpdates[fieldMap[key]] = value;
      }
    }
    
    // Always update LastLogin timestamp
    firestoreUpdates.LastLogin = new Date();
    
    await updateDoc(doc(db, "users", userId), firestoreUpdates);
    console.log("User document updated:", userId);
    return true;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error updating user document:", handledError);
    throw handledError;
  }
};

/**
 * Fetches a user document
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<Object|null>} - User data or null if not found
 */
export const getUserDocument = async (userId) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Map back to our app's naming convention
      const data = docSnap.data();
      return {
        userId: data.userID,
        campus: data.Campus,
        createdAt: data.CreatedAt?.toDate() || null,
        currentLocation: data.CurrentLocation || { latitude: 0, longitude: 0 },
        email: data.Email,
        friends: data.Friends.map(friend => ({
          uid: friend.uid || friend.id || '',
          name: friend.name || '',
          email: friend.email || '',
          phoneNumber: friend.phoneNumber || ''
        })),
        gender: data.Gender,
        imageUrl: data.ImageURL,
        lastLogin: data.LastLogin?.toDate() || null,
        name: data.Name,
        phone: data.Phone,
        rating: data.Rating,
        residenceAddress: data.ResidenceAddress || { latitude: 0, longitude: 0 },
        schoolAddress: data.SchoolAddress || { latitude: 0, longitude: 0 },  // Add this line
        surname: data.Surname,
        walks: data.Walks,
        lastLocationUpdate: data.LastLocationUpdate?.toDate() || null
      };
    }
    return null;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error fetching user document:", handledError);
    throw handledError;
  }
};

/**
 * Deletes a user document
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<boolean>} - True if successful
 */
export const deleteUserDocument = async (userId) => {
  try {
    await deleteDoc(doc(db, "users", userId));
    console.log("User document deleted:", userId);
    return true;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error deleting user document:", handledError);
    throw handledError;
  }
};

/**
 * Centralized user data handler
 * @param {string} action - 'create', 'update', 'get', or 'delete'
 * @param {string} userId - Firebase Auth UID
 * @param {Object} [data] - Data for create/update actions
 * @returns {Promise} - Result of the operation
 */
export const handleUserData = async (action, userId, data = null) => {
  switch (action.toLowerCase()) {
    case 'create':
      return createUserDocument(userId, data);
    case 'update':
      return updateUserDocument(userId, data);
    case 'get':
      return getUserDocument(userId);
    case 'delete':
      return deleteUserDocument(userId);
    default:
      throw new Error('Invalid action specified');
  }
};

/**
 * Batch create multiple documents
 * @param {Array} documents - Array of { collection, id, data }
 * @returns {Promise<boolean>} - True if successful
 */
export const batchCreateDocuments = async (documents) => {
  const batch = writeBatch(db);
  
  try {
    documents.forEach(({ collection, id, data }) => {
      const docRef = doc(db, collection, id);
      batch.set(docRef, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Batch create error:", handledError);
    throw handledError;
  }
};

/**
 * Transactional update with data validation
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @param {Function} validator - Validation function
 * @returns {Promise<boolean>} - True if successful
 */
export const safeUpdateUser = async (userId, updates, validator) => {
  try {
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        throw new Error("User document does not exist");
      }
      
      // Validate updates
      if (validator && !validator(userDoc.data(), updates)) {
        throw new Error("Update validation failed");
      }
      
      transaction.update(userRef, {
        ...updates,
        LastLogin: new Date()
      });
    });
    
    return true;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Transactional update error:", handledError);
    throw handledError;
  }
};

/**
 * Add user with additional collections
 * @param {string} userId - User ID
 * @param {Object} userData - User data
 * @param {Object} additionalData - { collection: data }
 * @returns {Promise<boolean>} - True if successful
 */
export const createUserWithCollections = async (userId, userData, additionalData = {}) => {
  try {
    // Create user document
    await createUserDocument(userId, userData);
    
    // Create additional documents
    const promises = Object.entries(additionalData).map(
      ([collection, data]) => {
        const docRef = doc(db, collection, userId);
        return setDoc(docRef, {
          ...data,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    );
    
    await Promise.all(promises);
    return true;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Create user with collections error:", handledError);
    throw handledError;
  }
};

/**
 * Increment user's walk count atomically
 * @param {string} userId - User ID
 * @param {number} amount - Amount to increment (default 1)
 * @returns {Promise<boolean>} - True if successful
 */
export const incrementWalkCount = async (userId, amount = 1) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      Walks: FieldValue.increment(amount),
      LastLogin: new Date()
    });
    return true;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Increment walk count error:", handledError);
    throw handledError;
  }
};

/**
 * Update user's location
 * @param {string} userId - User ID
 * @param {Object} location - { latitude, longitude }
 * @param {boolean} isResidence - True for residence, false for current
 * @returns {Promise<boolean>} - True if successful
 */
export const updateUserLocation = async (userId, location, isResidence = false) => {
  try {
    const field = isResidence ? "ResidenceAddress" : "CurrentLocation";
    await updateDoc(doc(db, "users", userId), {
      [field]: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      LastLogin: new Date()
    });
    return true;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Update location error:", handledError);
    throw handledError;
  }
};

/**
 * Error handling function
 * @param {Error} error - Original error object
 * @returns {Object} - Enhanced error information
 */
export const handleFirestoreError = (error) => {
  console.error("Firestore Error:", error);
  
  const errorMap = {
    'permission-denied': 'You don\'t have permission to perform this action',
    'not-found': 'The requested document was not found',
    'invalid-argument': 'Invalid data provided',
    'failed-precondition': 'Operation rejected due to current state',
    'unauthenticated': 'Authentication required',
    'resource-exhausted': 'Quota exceeded',
    'cancelled': 'Operation was cancelled',
    'already-exists': 'Document already exists',
    'aborted': 'Operation aborted',
    'out-of-range': 'Value out of range',
    'unimplemented': 'Operation not implemented',
    'internal': 'Internal server error',
    'unavailable': 'Service unavailable',
    'data-loss': 'Irrecoverable data loss',
  };
  
  // Extract the error code if it exists
  const code = error.code || 'unknown';
  const message = errorMap[code] || error.message || 'Database operation failed';
  
  return {
    code,
    message,
    original: error
  };
};

/**
 * Find users by phone numbers
 * @param {Array<string>} phoneNumbers - Array of phone numbers to search
 * @returns {Promise<Object>} - Map of phone numbers to user data
 */
export const getUsersByPhoneNumbers = async (phoneNumbers) => {
  try {
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return {};
    }
    
    const batchSize = 10;
    const userMap = {};
    
    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
      const batch = phoneNumbers.slice(i, i + batchSize);
      
      if (batch.length === 0) continue;
      
      const q = query(
        collection(db, "users"),
        where("Phone", "in", batch)
      );
      
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(doc => {
        const userData = doc.data();
        userMap[userData.Phone] = {
          id: doc.id,
          ...userData
        };
      });
    }
    
    return userMap;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error finding users by phone:", handledError);
    throw handledError;
  }
};


/**
 * Offline Maps Functions
 */
export const saveUserOfflineMap = async (userId, mapData) => {
  try {
    const mapRef = doc(db, "users", userId, "offlineMaps", mapData.id);
    await setDoc(mapRef, {
      ...mapData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, id: mapData.id };
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error saving offline map:", handledError);
    throw handledError;
  }
};

export const getUserOfflineMaps = async (userId) => {
  try {
    const mapsRef = collection(db, "users", userId, "offlineMaps");
    const querySnapshot = await getDocs(mapsRef);
    const maps = [];
    querySnapshot.forEach((doc) => {
      maps.push({ id: doc.id, ...doc.data() });
    });
    return maps;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error getting offline maps:", handledError);
    throw handledError;
  }
};

export const updateOfflineMapUsage = async (userId, mapId) => {
  try {
    const mapRef = doc(db, "users", userId, "offlineMaps", mapId);
    await updateDoc(mapRef, {
      accessCount: FieldValue.increment(1),
      lastAccessed: new Date(),
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error updating map usage:", handledError);
    throw handledError;
  }
};

export const deleteUserOfflineMap = async (userId, mapId) => {
  try {
    const mapRef = doc(db, "users", userId, "offlineMaps", mapId);
    await deleteDoc(mapRef);
    return { success: true };
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error deleting offline map:", handledError);
    throw handledError;
  }
};

/**
 * Emergency Contacts Functions
 */
export const addEmergencyContact = async (userId, contactData) => {
  try {
    const contactRef = doc(collection(db, "users", userId, "emergencyContacts"));
    await setDoc(contactRef, {
      ...contactData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, id: contactRef.id };
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error adding emergency contact:", handledError);
    throw handledError;
  }
};

export const getEmergencyContacts = async (userId) => {
  try {
    const contactsRef = collection(db, "users", userId, "emergencyContacts");
    const querySnapshot = await getDocs(contactsRef);
    const contacts = [];
    querySnapshot.forEach((doc) => {
      contacts.push({ id: doc.id, ...doc.data() });
    });
    return contacts;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error getting emergency contacts:", handledError);
    throw handledError;
  }
};

export const updateEmergencyContact = async (userId, contactId, updates) => {
  try {
    const contactRef = doc(db, "users", userId, "emergencyContacts", contactId);
    await updateDoc(contactRef, {
      ...updates,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error updating emergency contact:", handledError);
    throw handledError;
  }
};

export const deleteEmergencyContact = async (userId, contactId) => {
  try {
    const contactRef = doc(db, "users", userId, "emergencyContacts", contactId);
    await deleteDoc(contactRef);
    return { success: true };
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error deleting emergency contact:", handledError);
    throw handledError;
  }
};


//update current location
export const updateCurrentLocation = async (userId, location) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      CurrentLocation: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      LastLocationUpdate: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error updating location:", error);
    return false;
  }
};

/**
 * Save user address to Firestore
 * @param {string} userId - User ID
 * @param {Object} addressData - Address data to save
 * @returns {Promise<boolean>} - True if successful
 */
export const saveUserAddress = async (userId, addressData) => {
  try {
    // Determine which field to update based on location type
    let field;
    const locationType = addressData.locationType.toLowerCase();
    
    if (locationType.includes('home') || 
        locationType.includes('house') || 
        locationType.includes('residence') || 
        locationType.includes('res') ||
        locationType.includes('apartment') ||
        locationType.includes('flat')) {
      field = "ResidenceAddress";
    } else if (locationType.includes('school') || 
               locationType.includes('campus') || 
               locationType.includes('college') || 
               locationType.includes('university') ||
               locationType.includes('uj')) {
      field = "SchoolAddress";
    } else {
      // Default to ResidenceAddress if we can't determine the type
      field = "ResidenceAddress";
    }
    
    await updateDoc(doc(db, "users", userId), {
      [field]: {
        address: addressData.address,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
        timestamp: new Date()
      }
    });
    return true;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error saving address:", handledError);
    throw handledError;
  }
};

/**
 * Get all saved addresses for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of addresses
 */
export const getUserAddresses = async (userId) => {
  try {
    const addressesRef = collection(db, "users", userId, "savedAddresses");
    const querySnapshot = await getDocs(addressesRef);
    const addresses = [];
    querySnapshot.forEach((doc) => {
      addresses.push({ id: doc.id, ...doc.data() });
    });
    return addresses;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error getting addresses:", handledError);
    throw handledError;
  }
};

/**
 * Update existing address
 * @param {string} userId - User ID
 * @param {string} addressId - Address document ID
 * @param {Object} updates - Address fields to update
 * @returns {Promise<boolean>} - True if successful
 */
export const updateUserAddress = async (userId, addressId, updates) => {
  try {
    const addressRef = doc(db, "users", userId, "savedAddresses", addressId);
    await updateDoc(addressRef, {
      ...updates,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error updating address:", handledError);
    throw handledError;
  }
};

/**
 * Delete user address
 * @param {string} userId - User ID
 * @param {string} addressId - Address document ID
 * @returns {Promise<boolean>} - True if successful
 */
export const deleteUserAddress = async (userId, addressId) => {
  try {
    const addressRef = doc(db, "users", userId, "savedAddresses", addressId);
    await deleteDoc(addressRef);
    return true;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error deleting address:", handledError);
    throw handledError;
  }
};

/**
 * Sync addresses from Firebase to AsyncStorage
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of addresses
 */
export const syncAddressesFromFirebase = async (userId) => {
  try {
    const addresses = await getUserAddresses(userId);
    await AsyncStorage.setItem('@saved_addresses', JSON.stringify(addresses));
    return addresses;
  } catch (error) {
    console.error("Error syncing addresses from Firebase:", error);
    throw error;
  }
};

// Export all functions

/**
 * Get Expo Push Token
 * @returns {Promise<string>} - Expo push token
 */
export const getExpoPushToken = async () => {
  try {
    console.log('Starting push token request...');
    
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return 'ExponentPushToken[SIMULATOR_MOCK_TOKEN]';
    }

    console.log('Requesting permissions...');
    const { status: existingStatus } = await Promise.race([
      Notifications.getPermissionsAsync(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Permission check timeout')), 5000)
      )
    ]);
    
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('Requesting new permissions...');
      const { status } = await Promise.race([
        Notifications.requestPermissionsAsync(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Permission request timeout')), 10000)
        )
      ]);
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    console.log('Permission granted, getting token...');
    
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    
    if (!projectId) {
      console.error('Project ID not found in app config');
      return null;
    }

    console.log('Using project ID:', projectId);

    const tokenData = await Promise.race([
      Notifications.getExpoPushTokenAsync({ projectId }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Token fetch timeout')), 10000)
      )
    ]);
    
    console.log('Token obtained successfully');
    return tokenData.data;
    
  } catch (error) {
    console.error('Error getting push token:', error.message);
    return null;
  }
};

/**
 * Save push token to user document
 * @param {string} userId - Firebase Auth UID
 * @param {string} pushToken - Expo push token
 * @returns {Promise<boolean>} - True if successful
 */
export const savePushToken = async (userId, pushToken) => {
  try {
    if (!pushToken) {
      console.log('No push token to save');
      return false;
    }

    await updateDoc(doc(db, "users", userId), {
      PushToken: pushToken,
      PushTokenUpdatedAt: new Date(),
      DevicePlatform: Platform.OS,
      LastLogin: new Date()
    });
    
    console.log('Push token saved successfully');
    return true;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error saving push token:", handledError);
    throw handledError;
  }
};

/**
 * Get push tokens for specific users (for sending notifications)
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Promise<Array>} - Array of { userId, pushToken }
 */
export const getPushTokensForUsers = async (userIds) => {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return [];
    }
    
    const tokens = [];
    const batchSize = 10;
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const q = query(
        collection(db, "users"),
        where("userID", "in", batch)
      );
      
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.PushToken) {
          tokens.push({
            userId: data.userID,
            pushToken: data.PushToken,
            name: data.Name,
            surname: data.Surname
          });
        }
      });
    }
    
    return tokens;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error getting push tokens:", handledError);
    throw handledError;
  }
};

/**
 * Remove push token (on logout)
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<boolean>} - True if successful
 */
export const removePushToken = async (userId) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      PushToken: null,
      PushTokenUpdatedAt: new Date()
    });
    
    console.log('Push token removed successfully');
    return true;
  } catch (error) {
    const handledError = handleFirestoreError(error);
    console.error("Error removing push token:", handledError);
    throw handledError;
  }
};

export default {
  createUserDocument,
  updateUserDocument,
  getUserDocument,
  deleteUserDocument,
  handleUserData,
  batchCreateDocuments,
  safeUpdateUser,
  createUserWithCollections,
  incrementWalkCount,
  updateUserLocation,
  handleFirestoreError,
  getUsersByPhoneNumbers,
  saveUserOfflineMap,
  getUserOfflineMaps,
  updateOfflineMapUsage,
  deleteUserOfflineMap,
  addEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
  deleteEmergencyContact,
  updateCurrentLocation,
  saveUserAddress,
  updateUserAddress,
  getUserAddresses,
  getExpoPushToken,
  savePushToken,
  getPushTokensForUsers,
  removePushToken,
  createWalkRequest
};