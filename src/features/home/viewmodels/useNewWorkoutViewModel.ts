import { useState } from 'react';
import { workoutService } from '../../../services/workoutService';
import { CreateWorkoutRequest } from '../models/WorkoutTypes';

const DEFAULT_DIVISION = 'A definir';
const DEFAULT_MUSCLE_GROUP = 'A definir';
const DEFAULT_DURATION = 45;

export function useNewWorkoutViewModel() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = 'Nome é obrigatório';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleCreate(onSuccess: (workoutId: string) => void) {
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: CreateWorkoutRequest = {
        name: name.trim(),
        division: DEFAULT_DIVISION,
        muscleGroup: DEFAULT_MUSCLE_GROUP,
        estimatedDuration: DEFAULT_DURATION,
      };

      const workout = await workoutService.create(payload);
      onSuccess(workout.id);
    } catch (err: any) {
      setErrors({ general: err?.message || 'Erro ao criar treino.' });
    } finally {
      setLoading(false);
    }
  }

  return {
    name,
    setName,
    loading,
    errors,
    handleCreate,
  };
}
