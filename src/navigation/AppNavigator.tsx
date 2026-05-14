import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen      from '../features/auth/screens/LoginScreen';
import RegisterScreen   from '../features/auth/screens/RegisterScreen';
import HomeScreen       from '../features/home/views/HomeScreen';
import NewWorkoutScreen from '../features/home/views/NewWorkoutScreen';

export type RootStackParamList = {
  Login:          undefined;
  Register:       undefined;
  Home:           undefined;
  NewWorkout:     undefined;
  EditWorkout:    { workoutId: number };
  ExecuteWorkout: { workoutId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="Login"      component={LoginScreen} />
        <Stack.Screen name="Register"   component={RegisterScreen} />
        <Stack.Screen name="Home"       component={HomeScreen} />
        <Stack.Screen name="NewWorkout" component={NewWorkoutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}