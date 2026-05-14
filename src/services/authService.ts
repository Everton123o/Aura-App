import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../constants/firebaseConfig';
import { AppUser, AuthResult } from '../features/auth/types/AuthTypes';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'app/unknown',
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string) {
  return username.trim().replace(/\s+/g, ' ');
}

function userDocRef(uid: string) {
  return doc(db, 'users', uid);
}

function mapFirebaseAuthError(error: any): AppError {
  const code = error?.code ?? 'auth/unknown';

  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Este email já está cadastrado.',
    'auth/invalid-email': 'Informe um email válido.',
    'auth/invalid-credential': 'Email ou senha incorretos.',
    'auth/user-not-found': 'Email ou senha incorretos.',
    'auth/wrong-password': 'Email ou senha incorretos.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',
  };

  return new AppError(messages[code] ?? 'Não foi possível concluir a operação.', code, error);
}

function mapUser(firebaseUser: User, profile?: Partial<AppUser>): AppUser {
  const fallbackName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário';

  return {
    uid: firebaseUser.uid,
    username: normalizeUsername(profile?.username || fallbackName),
    email: normalizeEmail(profile?.email || firebaseUser.email || ''),
    createdAt: profile?.createdAt,
  };
}

async function getUserProfile(firebaseUser: User): Promise<AppUser> {
  try {
    const snapshot = await getDoc(userDocRef(firebaseUser.uid));

    if (!snapshot.exists()) {
      await syncUserProfile(firebaseUser).catch(() => undefined);
      return mapUser(firebaseUser);
    }

    return mapUser(firebaseUser, snapshot.data() as Partial<AppUser>);
  } catch {
    return mapUser(firebaseUser);
  }
}

async function syncUserProfile(firebaseUser: User, username?: string) {
  const appUser = mapUser(firebaseUser, username ? { username } : undefined);

  await setDoc(userDocRef(firebaseUser.uid), {
    username: appUser.username,
    email: appUser.email,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });

  return appUser;
}

export const authService = {
  register: async (username: string, email: string, password: string): Promise<AuthResult> => {
    const safeUsername = normalizeUsername(username);
    const safeEmail = normalizeEmail(email);
    let createdUser: User | null = null;

    try {
      const credential = await createUserWithEmailAndPassword(auth, safeEmail, password);
      createdUser = credential.user;

      await updateProfile(createdUser, { displayName: safeUsername });
      await syncUserProfile(createdUser, safeUsername).catch(() => undefined);

      return { user: mapUser(createdUser, { username: safeUsername, email: safeEmail }) };
    } catch (error: any) {
      if (createdUser && error?.code !== 'auth/email-already-in-use') {
        await signOut(auth).catch(() => undefined);
      }

      throw mapFirebaseAuthError(error);
    }
  },

  login: async (email: string, password: string): Promise<AuthResult> => {
    try {
      const credential = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
      return { user: await getUserProfile(credential.user) };
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  getCurrentUser: async (): Promise<AppUser | null> => {
    return auth.currentUser ? getUserProfile(auth.currentUser) : null;
  },

  onSessionChanged: (callback: (user: AppUser | null) => void) => {
    return onAuthStateChanged(auth, async firebaseUser => {
      if (!firebaseUser) {
        callback(null);
        return;
      }

      try {
        callback(await getUserProfile(firebaseUser));
      } catch {
        callback(mapUser(firebaseUser));
      }
    });
  },
};
