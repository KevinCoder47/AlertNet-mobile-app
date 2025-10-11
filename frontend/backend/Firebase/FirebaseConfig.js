import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAWDLMdCk8tP1oCei70QCc3tAC0zo5CwFE",
  authDomain: "alertnet-1ecfb.firebaseapp.com",
  projectId: "alertnet-1ecfb",
  storageBucket: "alertnet-1ecfb.firebasestorage.app", 
  messagingSenderId: "535753118943",
  appId: "1:535753118943:web:a51328dbfedef5c1c0456a",
  measurementId: "G-XZ80NK3MH0"
  
};


// Prevent duplicate initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence
const auth = getApps().length
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

const db = getFirestore(app);
const storage = getStorage(app);

// console.log($&);

let analytics = null;
isSupported()
  .then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  })
  .catch((error) => {
    // console.log($&);
  });

export { app, auth, analytics, db, storage };