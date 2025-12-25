import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env';

// Only import AsyncStorage on native platforms
let AsyncStorage: any = null;
if (Platform.OS !== 'web') {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY || 'AIzaSyBgSL4oK4dwtw5yUKwTRXxwZtKtHo43nB0',
  authDomain: FIREBASE_AUTH_DOMAIN || 'fit-and-power.firebaseapp.com',
  projectId: FIREBASE_PROJECT_ID || 'fit-and-power',
  storageBucket: FIREBASE_STORAGE_BUCKET || 'fit-and-power.firebasestorage.app',
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID || '861114584019',
  appId: FIREBASE_APP_ID || '1:861114584019:web:cc85de1847835c09027d26',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with platform-specific persistence
export const auth = Platform.OS === 'web'
  ? initializeAuth(app, {
      persistence: browserLocalPersistence
    })
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;