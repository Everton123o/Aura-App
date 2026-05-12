import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { LoginRequest, RegisterRequest, AuthResponse } from '../features/auth/types/AuthTypes';

export const authService = {

  async register({ username, email, password }: RegisterRequest): Promise<AuthResponse> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: username });
    await setDoc(doc(db, 'users', credential.user.uid), {
      username,
      email,
      createdAt: serverTimestamp(),
    });
    const token = await credential.user.getIdToken();
    return { token, uid: credential.user.uid };
  },

  async login({ email, password }: LoginRequest): Promise<AuthResponse> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const token = await credential.user.getIdToken();
    return { token, uid: credential.user.uid };
  },

};