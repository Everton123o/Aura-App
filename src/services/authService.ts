import {
  User,
  createUserWithEmailAndPassword,
  deleteUser,
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

interface UserProfileOptions {
  strict?: boolean;
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
    'permission-denied': 'Cadastro bloqueado pelas regras do Firestore. Permita escrita em /users/{uid}.',
    'unavailable': 'O Firestore está indisponível no momento. Tente novamente mais tarde.',
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

async function getUserProfile(firebaseUser: User, options: UserProfileOptions = {}): Promise<AppUser> {
  try {
    const snapshot = await getDoc(userDocRef(firebaseUser.uid));

    if (!snapshot.exists()) {
      await syncUserProfile(firebaseUser);
      return mapUser(firebaseUser);
    }

    return mapUser(firebaseUser, snapshot.data() as Partial<AppUser>);
  } catch (error) {
    if (options.strict) {
      throw error;
    }

    return mapUser(firebaseUser);
  }
}

async function syncUserProfile(firebaseUser: User, username?: string) {
  const appUser = mapUser(firebaseUser, username ? { username } : undefined);

  await setDoc(
    userDocRef(firebaseUser.uid),
    {
      username: appUser.username,
      email: appUser.email,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

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
      await syncUserProfile(createdUser, safeUsername);

      return { user: mapUser(createdUser, { username: safeUsername, email: safeEmail }) };
    } catch (error: any) {
      if (createdUser) {
        await deleteUser(createdUser).catch(() => signOut(auth).catch(() => undefined));
      }

      throw mapFirebaseAuthError(error);
    }
  },

  login: async (email: string, password: string): Promise<AuthResult> => {
    let signedInUser: User | null = null;

    try {
      const credential = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
      signedInUser = credential.user;

      return { user: await getUserProfile(credential.user, { strict: true }) };
    } catch (error) {
      if (signedInUser) {
        await signOut(auth).catch(() => undefined);
      }

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
