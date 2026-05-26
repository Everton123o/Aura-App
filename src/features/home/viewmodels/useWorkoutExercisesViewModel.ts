// src/features/home/viewmodels/useWorkoutExercisesViewModel.ts
import { useState, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Exercise } from '../models/WorkoutTypes';
import { exerciseService } from '../../../services/exerciseService';
import type { RootStackParamList } from '../../../navigation/AppNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function useWorkoutExercisesViewModel(workoutId: string) {
  const navigation = useNavigation<NavProp>();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await exerciseService.getExercises(workoutId);
      setExercises(data);
    } catch (e: any) {
      setError('Não foi possível carregar os exercícios');
    } finally {
      setIsLoading(false);
    }
  }, [workoutId]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const deleteExercise = async (exerciseId: string) => {
    try {
      await exerciseService.deleteExercise(workoutId, exerciseId);
      setExercises(prev => prev.filter(e => e.id !== exerciseId));
    } catch {
      setError('Não foi possível remover o exercício');
    }
  };

  const handleConclude = () => {
    // Volta pra Home após montar o treino
    navigation.navigate('Home');
  };

  return { exercises, isLoading, error, deleteExercise, handleConclude, reload: load };
}
