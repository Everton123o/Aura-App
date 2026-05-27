// src/services/workoutSessionService.ts
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../constants/firebaseConfig';
import { AppError } from './authService';

// Estrutura Firestore:
// users/{uid}/workouts/{workoutId}/exercises/{exerciseId}/records/{recordId}
// Cada record = uma série executada em um determinado dia

interface SeriesRecord {
  workoutId:  string;
  exerciseId: string;
  series:     number;
  reps:       number;
  weight:     number;
}

function mapSessionError(error: any): AppError {
  const code = error?.code ?? 'session/save-failed';

  const messages: Record<string, string> = {
    'permission-denied': 'Sem permissao para registrar a serie. Confira as regras do Firestore para a subcollection records.',
    unauthenticated: 'Sessao expirada. Entre novamente para continuar.',
    unavailable: 'Nao foi possivel conectar ao Firestore. Verifique sua internet e tente novamente.',
  };

  return new AppError(messages[code] ?? 'Nao foi possivel registrar a serie.', code, error);
}

export const workoutSessionService = {

  async saveSeriesRecord(data: SeriesRecord): Promise<void> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new AppError('Sessao expirada. Entre novamente para continuar.', 'unauthenticated');

      const ref = collection(
        db,
        'users', uid,
        'workouts',  data.workoutId,
        'exercises', data.exerciseId,
        'records',
      );

      await addDoc(ref, {
        series:    data.series,
        reps:      data.reps,
        weight:    data.weight,
        executedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSessionError(error);
    }
  },

  async getLastRecord(
    workoutId: string,
    exerciseId: string
  ): Promise<{ reps: number; weight: number } | null> {
    // Importação dinâmica para não poluir o bundle se não for usada
    const { getDocs, query, orderBy, limit, collection: col } = await import('firebase/firestore');
    const uid = auth.currentUser?.uid;
    if (!uid) return null;

    const ref  = col(db, 'users', uid, 'workouts', workoutId, 'exercises', exerciseId, 'records');
    const snap = await getDocs(query(ref, orderBy('executedAt', 'desc'), limit(1)));
    if (snap.empty) return null;

    const d = snap.docs[0].data();
    return { reps: d.reps, weight: d.weight };
  },
};
