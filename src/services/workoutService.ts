import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../constants/firebaseConfig';
import { CreateWorkoutRequest, Workout } from '../features/home/models/WorkoutTypes';
import { AppError } from './authService';

function requireCurrentUserId() {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new AppError('Sessão expirada. Entre novamente para continuar.', 'auth/session-expired');
  }

  return uid;
}

function workoutsRef(uid = requireCurrentUserId()) {
  return collection(db, 'users', uid, 'workouts');
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeDuration(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new AppError('Informe uma duração válida.', 'workout/invalid-duration');
  }

  return Math.round(value);
}

function timestampToIso(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  return undefined;
}

function mapWorkout(id: string, data: any): Workout {
  return {
    id,
    name: String(data.name ?? ''),
    division: String(data.division ?? ''),
    muscleGroup: String(data.muscleGroup ?? ''),
    estimatedDuration: Number(data.estimatedDuration ?? 0),
    exerciseCount: Number(data.exerciseCount ?? 0),
    notes: data.notes ? String(data.notes) : undefined,
    createdAt: timestampToIso(data.createdAt),
    lastUpdated: timestampToIso(data.lastUpdated) ?? new Date(0).toISOString(),
    completedAt: timestampToIso(data.completedAt) ?? null,
  };
}

function buildCreatePayload(data: CreateWorkoutRequest) {
  const name = normalizeText(data.name);
  const division = normalizeText(data.division);
  const muscleGroup = normalizeText(data.muscleGroup);

  if (!name || !division || !muscleGroup) {
    throw new AppError('Preencha os dados obrigatórios do treino.', 'workout/invalid-payload');
  }

  return {
    name,
    division,
    muscleGroup,
    estimatedDuration: normalizeDuration(data.estimatedDuration),
    exerciseCount: 0,
    notes: data.notes?.trim() || null,
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
    completedAt: null,
  };
}

function mapWorkoutError(error: any, fallbackMessage: string, fallbackCode: string): AppError {
  const code = error?.code ?? fallbackCode;

  const messages: Record<string, string> = {
    'permission-denied': 'Sem permissao para salvar este treino. Confira as regras do Firestore para users/{uid}/workouts.',
    unauthenticated: 'Sessao expirada. Entre novamente para continuar.',
    unavailable: 'Nao foi possivel conectar ao Firestore. Verifique sua internet e tente novamente.',
    'failed-precondition': 'O Firestore recusou a operacao por configuracao ou indice ausente.',
    'invalid-argument': 'Dados invalidos para criar o treino.',
    'not-found': 'Caminho do Firestore nao encontrado.',
  };

  return new AppError(messages[code] ?? fallbackMessage, code, error);
}

export const workoutService = {
  getAll: async (): Promise<Workout[]> => {
    try {
      const q = query(workoutsRef(), orderBy('lastUpdated', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => mapWorkout(d.id, d.data()));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapWorkoutError(error, 'Nao foi possivel carregar os treinos.', 'workout/list-failed');
    }
  },

  create: async (data: CreateWorkoutRequest): Promise<Workout> => {
    try {
      const payload = buildCreatePayload(data);
      const docRef = await addDoc(workoutsRef(), payload);

      return mapWorkout(docRef.id, {
        ...payload,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapWorkoutError(error, 'Erro ao criar treino.', 'workout/create-failed');
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'users', requireCurrentUserId(), 'workouts', id));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapWorkoutError(error, 'Erro ao excluir treino.', 'workout/delete-failed');
    }
  },

  update: async (id: string, data: Partial<CreateWorkoutRequest>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'users', requireCurrentUserId(), 'workouts', id), {
        ...data,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapWorkoutError(error, 'Erro ao atualizar treino.', 'workout/update-failed');
    }
  },
};
