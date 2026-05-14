import { useState } from 'react';
import { workoutService } from '../../../services/workoutService';
import { CreateWorkoutRequest } from '../models/WorkoutTypes';

const DIVISIONS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body'];
const DEFAULT_DIVISION = 'A definir';
const DEFAULT_MUSCLE_GROUP = 'A definir';
const DEFAULT_DURATION = 45;

export function useNewWorkoutViewModel() {
  const [name, setName] = useState('');
  const [division, setDivision] = useState('');
  const [notes, setNotes] = useState('');
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

  async function handleCreate(onSuccess: () => void) {
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      const normalizedDivision = division.trim() || DEFAULT_DIVISION;
      const payload: CreateWorkoutRequest = {
        name: name.trim(),
        division: normalizedDivision,
        muscleGroup: DEFAULT_MUSCLE_GROUP,
        estimatedDuration: DEFAULT_DURATION,
        notes: notes.trim() || undefined,
      };

      await workoutService.create(payload);
      onSuccess();
    } catch (err: any) {
      setErrors({ general: err?.message || 'Erro ao criar treino.' });
    } finally {
      setLoading(false);
    }
  }

  return {
    name,
    setName,
    division,
    setDivision,
    notes,
    setNotes,
    loading,
    errors,
    divisions: DIVISIONS,
    handleCreate,
  };
}
