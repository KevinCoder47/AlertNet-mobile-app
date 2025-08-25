import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, fetchSignInMethodsForEmail } from 'firebase/auth';
import { app } from './FirebaseConfig';


const auth = getAuth(app);

/**
 * Checks if a user exists with the given email
 * @param {string} email - Email address to check
 * @returns {Promise<boolean>} - True if user exists, false otherwise
 */
export const checkUserExists = async (email) => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {
    console.error('Error checking user existence:', error);
    throw new Error('Failed to check user existence');
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (email, password) => {
  try {
    // Check if user already exists
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) {
      throw new Error('User already exists with this email.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};