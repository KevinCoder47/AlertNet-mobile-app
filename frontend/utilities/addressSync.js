import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserAddresses, deleteUserAddress } from '../services/firestore';

/**
 * Get addresses with synchronization logic˚
 * @returns {Promise<Array>} - Array of addresses
 */
export const getSyncedAddresses = async () => {
  try {
    // Get userId from AsyncStorage
    const userDataJSON = await AsyncStorage.getItem('userData');
    let userId = null;
    
    if (userDataJSON) {
      const userData = JSON.parse(userDataJSON);
      userId = userData.userId;
    }
    
    // First try to get addresses from AsyncStorage
    const addressesJSON = await AsyncStorage.getItem('@saved_addresses');
    
    if (addressesJSON) {
      const addresses = JSON.parse(addressesJSON);
      
      // If we have a userId, check if Firebase has more recent data
      if (userId) {
        try {
          const firebaseAddresses = await getUserAddresses(userId);
          
          // If Firebase has addresses but local storage is empty, use Firebase
          if (firebaseAddresses.length > 0 && addresses.length === 0) {
            await AsyncStorage.setItem('@saved_addresses', JSON.stringify(firebaseAddresses));
            return firebaseAddresses;
          }
          
          // If Firebase has more addresses, sync them
          if (firebaseAddresses.length > addresses.length) {
            await AsyncStorage.setItem('@saved_addresses', JSON.stringify(firebaseAddresses));
            return firebaseAddresses;
          }
        } catch (error) {
          console.error('Error checking Firebase addresses:', error);
          // Return local addresses if Firebase fails
        }
      }
      
      return addresses;
    } else if (userId) {
      // If no local addresses but user is logged in, try to get from Firebase
      try {
        const addresses = await getUserAddresses(userId);
        await AsyncStorage.setItem('@saved_addresses', JSON.stringify(addresses));
        return addresses;
      } catch (error) {
        console.error('Error syncing addresses from Firebase:', error);
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error getting synced addresses:', error);
    return [];
  }
};

/**
 * Clear all addresses from both storage systems
 * @returns {Promise<boolean>} - True if successful
 */
export const clearAllAddresses = async () => {
  try {
    // Get userId from AsyncStorage
    const userDataJSON = await AsyncStorage.getItem('userData');
    let userId = null;
    
    if (userDataJSON) {
      const userData = JSON.parse(userDataJSON);
      userId = userData.userId;
    }
    
    // Clear AsyncStorage
    await AsyncStorage.removeItem('@saved_addresses');
    
    // If user is logged in, clear Firebase addresses
    if (userId) {
      try {
        const addresses = await getUserAddresses(userId);
        const deletePromises = addresses.map(address => 
          deleteUserAddress(userId, address.id)
        );
        await Promise.all(deletePromises);
      } catch (firebaseError) {
        console.error('Error clearing Firebase addresses:', firebaseError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing all addresses:', error);
    return false;
  }
};