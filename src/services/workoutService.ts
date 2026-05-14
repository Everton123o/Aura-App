import {
  collection, addDoc, getDocs, deleteDoc,
  doc, query, where, orderBy, updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../constants/firebaseConfig';
import { Workout, CreateWorkoutRequest } from '../features/home/models/WorkoutTypes';

// Referência à coleção de treinos do usuário logado
function workoutsRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado');
  return collection(db, 'users', uid, 'workouts');
}

export const workoutService = {

  // ── Buscar todos os treinos ─────────────────────────────────────────────────
  getAll: async (): Promise<Workout[]> => {
    const q = query(workoutsRef(), orderBy('lastUpdated', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id:                d.id,
      ...(d.data() as Omit<Workout, 'id'>),
    }));
  },

  // ── Criar treino ────────────────────────────────────────────────────────────
  create: async (data: CreateWorkoutRequest): Promise<Workout> => {
    const newWorkout = {
      ...data,
      exerciseCount: 0,
      lastUpdated:   new Date().toISOString(),
    };
    const docRef = await addDoc(workoutsRef(), newWorkout);
    return { id: docRef.id, ...newWorkout };
  },

  // ── Excluir treino ──────────────────────────────────────────────────────────
  delete: async (id: string): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Usuário não autenticado');
    await deleteDoc(doc(db, 'users', uid, 'workouts', id));
  },

  // ── Atualizar treino ────────────────────────────────────────────────────────
  update: async (id: string, data: Partial<CreateWorkoutRequest>): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Usuário não autenticado');
    await updateDoc(doc(db, 'users', uid, 'workouts', id), {
      ...data,
      lastUpdated: new Date().toISOString(),
    });
  },
};