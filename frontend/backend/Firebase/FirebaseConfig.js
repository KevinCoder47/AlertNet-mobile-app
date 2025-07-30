// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWDLMdCk8tP1oCei70QCc3tAC0zo5CwFE",
  authDomain: "alertnet-1ecfb.firebaseapp.com",
  projectId: "alertnet-1ecfb",
  storageBucket: "alertnet-1ecfb.firebasestorage.app",
  messagingSenderId: "535753118943",
  appId: "1:535753118943:web:a51328dbfedef5c1c0456a",
  measurementId: "G-XZ80NK3MH0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);