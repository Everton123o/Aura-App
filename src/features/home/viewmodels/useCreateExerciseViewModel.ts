import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { exerciseService } from '../../../services/exerciseService';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface CreateExercisePayload {
  name: string;
  sets: number;
  weight: number;
  reps: number;
}

export function useCreateExerciseViewModel(workoutId: string) {
  const navigation = useNavigation<NavProp>();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (payload: CreateExercisePayload) => {
    try {
      setIsLoading(true);
      setError('');
      await exerciseService.addExercise(workoutId, payload);
      Alert.alert('Sucesso', 'Exercício salvo com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      setError('Não foi possível salvar o exercício');
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, handleSave };
}
