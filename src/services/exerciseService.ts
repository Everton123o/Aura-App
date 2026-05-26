// src/services/exerciseService.ts
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { auth, db } from '../constants/firebaseConfig';
import { Exercise } from '../features/home/models/WorkoutTypes';

// Caminho: users/{uid}/workouts/{workoutId}/exercises/{exerciseId}

const exercisesRef = (workoutId: string) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado');
  return collection(db, 'users', uid, 'workouts', workoutId, 'exercises');
};

const workoutDocRef = (workoutId: string) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado');
  return doc(db, 'users', uid, 'workouts', workoutId);
};

export const exerciseService = {

  async getExercises(workoutId: string): Promise<Exercise[]> {
    const ref  = exercisesRef(workoutId);
    const snap = await getDocs(query(ref, orderBy('order', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Exercise));
  },

  async addExercise(
    workoutId: string,
    data: { name: string; sets: number; weight: number; reps: number }
  ): Promise<void> {
    const ref  = exercisesRef(workoutId);

    // Descobre o próximo order
    const snap = await getDocs(ref);
    const order = snap.size;

    await addDoc(ref, {
      ...data,
      order,
      createdAt: new Date().toISOString(),
    });

    // Atualiza contador no documento do treino
    await updateDoc(workoutDocRef(workoutId), {
      exerciseCount: increment(1),
      lastUpdated: new Date().toISOString(),
    });
  },

  async deleteExercise(workoutId: string, exerciseId: string): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Usuário não autenticado');

    await deleteDoc(
      doc(db, 'users', uid, 'workouts', workoutId, 'exercises', exerciseId)
    );

    // Decrementa contador (não vai abaixo de 0)
    await updateDoc(workoutDocRef(workoutId), {
      exerciseCount: increment(-1),
      lastUpdated: new Date().toISOString(),
    });
  },
};