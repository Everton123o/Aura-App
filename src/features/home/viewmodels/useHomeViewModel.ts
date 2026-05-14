import { useState, useEffect, useCallback } from 'react';
import { workoutService } from '../../../services/workoutService';
import { Workout } from '../models/WorkoutTypes';

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
    } catch {
      setError('Não foi possível carregar os treinos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  async function deleteWorkout(id: string) {
    try {
      await workoutService.delete(id);
      setWorkouts(prev => prev.filter(w => w.id !== id));
    } catch {
      setError('Erro ao excluir treino.');
    }
  }

  return { workouts, loading, error, deleteWorkout, refresh: fetchWorkouts };
}