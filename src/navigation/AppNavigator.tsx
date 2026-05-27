import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen      from '../features/auth/screens/LoginScreen';
import RegisterScreen   from '../features/auth/screens/RegisterScreen';
import HomeScreen       from '../features/home/views/HomeScreen';
import NewWorkoutScreen from '../features/home/views/NewWorkoutScreen';
import WorkoutExercisesScreen from '../features/home/views/WorkoutExercisesScreen';
import CreateExerciseScreen from '../features/home/views/CreateExerciseScreen';
import ChooseExerciseScreen from '../features/workout/views/ChooseExerciseScreen';
import ExecuteSeriesScreen from '../features/workout/views/ExecuteSeriesScreen';
import RestTimerScreen from '../features/workout/views/RestTimerScreen';
import { useAuth } from '../features/auth/contexts/AuthContext';

export type RootStackParamList = {
  Login:          undefined;
  Register:       undefined;
  Home:           undefined;
  NewWorkout:     undefined;
  WorkoutExercises: { workoutId: string };
  CreateExercise:   { workoutId: string };
  EditWorkout:    { workoutId: string };
  ExecuteWorkout: { workoutId: string };
  ChooseExercise: { workoutId: string; completedExerciseId?: string; completedExerciseIds?: string[] };
  ExecuteSeries: {
    workoutId: string;
    exerciseId: string;
    exerciseName: string;
    totalSets: number;
    currentSeries: number;
    completedExerciseIds?: string[];
  };
  RestTimer: {
    workoutId: string;
    exerciseId: string;
    exerciseName: string;
    totalSets: number;
    currentSeries: number;
    completedExerciseIds?: string[];
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={s.loading}>
        <ActivityIndicator color="#4A6CF7" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        id="Root"
        initialRouteName={user ? 'Home' : 'Register'}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        {user ? (
          <>
            <Stack.Screen name="Home"       component={HomeScreen} />
            <Stack.Screen name="NewWorkout" component={NewWorkoutScreen} />
            <Stack.Screen name="WorkoutExercises" component={WorkoutExercisesScreen} />
            <Stack.Screen name="CreateExercise" component={CreateExerciseScreen} />
            <Stack.Screen name="ChooseExercise" component={ChooseExerciseScreen} />
            <Stack.Screen name="ExecuteSeries" component={ExecuteSeriesScreen} />
            <Stack.Screen name="RestTimer" component={RestTimerScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Login"    component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FC' },
});
