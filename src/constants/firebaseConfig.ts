import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Substitua com suas credenciais do Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyD6y71uHe04RsddYZhWjDySG0NsBH_iZ1w",
  authDomain: "aura-app-9f4b0.firebaseapp.com",
  projectId: "aura-app-9f4b0",
  storageBucket: "aura-app-9f4b0.firebasestorage.app",
  messagingSenderId: "1047052620725",
  appId: "1:1047052620725:web:5253bd19d25e9120ed7ffc",
  measurementId: "G-LZW5LFLMQE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);