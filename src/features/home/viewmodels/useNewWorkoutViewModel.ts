import { useState } from 'react';
import { workoutService } from '../../../services/workoutService';
import { CreateWorkoutRequest } from '../models/WorkoutTypes';

const DIVISIONS     = ['Treino A', 'Treino B', 'Treino C', 'Full Body'];
const MUSCLE_GROUPS = ['Peito', 'Costas', 'Pernas', 'Ombro', 'Bíceps', 'Tríceps', 'Abdômen'];

export function useNewWorkoutViewModel() {
  const [name, setName]               = useState('');
  const [division, setDivision]       = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [duration, setDuration]       = useState('');
  const [notes, setNotes]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim())        e.name        = 'Nome é obrigatório';
    if (!division.trim())    e.division    = 'Escolha uma divisão';
    if (!muscleGroup.trim()) e.muscleGroup = 'Escolha um grupo muscular';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate(onSuccess: () => void) {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: CreateWorkoutRequest = {
        name,
        division,
        muscleGroup,
        estimatedDuration: Number(duration) || 45,
        notes,
      };
      await workoutService.create(payload);
      onSuccess();
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.message || 'Erro ao criar treino.' });
    } finally {
      setLoading(false);
    }
  }

  return {
    name, setName,
    division, setDivision,
    muscleGroup, setMuscleGroup,
    duration, setDuration,
    notes, setNotes,
    loading, errors,
    divisions: DIVISIONS,
    muscleGroups: MUSCLE_GROUPS,
    handleCreate,
  };
}