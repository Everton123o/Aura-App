import { useCallback, useState } from 'react';
import { workoutService } from '../../../services/workoutService';
import { Workout } from '../models/WorkoutTypes';

function isSameWeek(dateIso?: string | null) {
  if (!dateIso) return false;

  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return date >= startOfWeek && date < endOfWeek;
}

export function useHomeViewModel() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await workoutService.getAll();
      setWorkouts(data);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar os treinos.');
    } finally {
      setLoading(false);
    }
  }, []);

  async function deleteWorkout(id: string) {
    try {
      await workoutService.delete(id);
      setWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir treino.');
    }
  }

  const completedThisWeek = workouts.filter(w => isSameWeek(w.completedAt)).length;

  return { workouts, loading, error, completedThisWeek, deleteWorkout, refresh: fetchWorkouts };
}
