import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../constants/firebaseConfig';

export const authService = {

  // ── Registro ────────────────────────────────────────────────────────────────
  register: async (username: string, email: string, password: string) => {
    // Cria o usuário no Firebase Auth
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Salva o username no perfil
    await updateProfile(user, { displayName: username });

    // Salva dados extras no Firestore
    await setDoc(doc(db, 'users', user.uid), {
      username,
      email,
      createdAt: new Date().toISOString(),
    });

    return user;
  },

  // ── Login ───────────────────────────────────────────────────────────────────
  login: async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  },

  // ── Logout ──────────────────────────────────────────────────────────────────
  logout: async () => {
    await signOut(auth);
  },

  // ── Usuário atual ───────────────────────────────────────────────────────────
  getCurrentUser: () => auth.currentUser,
};