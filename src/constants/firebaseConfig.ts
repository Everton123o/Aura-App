import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  inMemoryPersistence,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

const firebaseConfig = {
  apiKey: requireEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: requireEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = (() => {
  try {
    if (Platform.OS === 'web') {
      return getAuth(app);
    }
    return initializeAuth(app, {
      persistence: __DEV__
        ? inMemoryPersistence
        : getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();

export const db = (() => {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
})();
