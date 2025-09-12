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
      imageUrl: imageUrl, // Use the uploaded image URL or existing one
      name: userData.name || "",
      phone: userData.phone || "",
      rating: userData.rating || 0,
      residenceAddress: userData.residenceAddress || { 
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
      Friends: safeUserData.friends.map(friend => ({
        id: friend.uid || friend.id || '', // Use uid first, then fallback to id
        uid: friend.uid || friend.id || '', // Also store uid separately for clarity
        name: friend.name || '',
        email: friend.email || '',
        phoneNumber: friend.phoneNumber || ''
      })),
      Gender: safeUserData.gender,
      ImageURL: safeUserData.imageUrl,
      LastLogin: new Date(),
      Name: safeUserData.name,
      Phone: safeUserData.phone,
      Rating: safeUserData.rating,
      ResidenceAddress: safeUserData.residenceAddress,
      Surname: safeUserData.surname,
      Walks: safeUserData.walks,
      userID: userId
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
        uid: friend.uid || friend.id || '', // Use uid first, then fallback to id
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
      surname: data.Surname,
      walks: data.Walks
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

// Export all functions
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
  deleteEmergencyContact
};