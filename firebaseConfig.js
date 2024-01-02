// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, browserSessionPersistence } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
const persistence = Platform.OS === 'web'
           ? browserSessionPersistence
           : getReactNativePersistence(ReactNativeAsyncStorage);
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCQSoSmi0kPhM4YnsEgo0ms98JoCKJcsoU",
  authDomain: "movier-88f92.firebaseapp.com",
  projectId: "movier-88f92",
  storageBucket: "movier-88f92.appspot.com",
  messagingSenderId: "999143967958",
  appId: "1:999143967958:web:4cafff4849232ecb314d77",
  measurementId: "G-2T8DW451EW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// initialize Firebase Auth for that app immediately
initializeAuth(app, {persistence});

// Initialize Firebase Authentication and get a reference to the service
export default app;
