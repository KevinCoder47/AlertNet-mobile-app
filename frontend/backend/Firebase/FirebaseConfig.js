import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
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

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(() => {
  // Analytics not supported
});

export { app, auth, analytics, db };