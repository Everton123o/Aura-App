// src/features/home/models/WorkoutTypes.ts

export interface Workout {
  id: string;
  name: string;
  division: string;
  muscleGroup: string;
  estimatedDuration: number;
  exerciseCount: number;
  notes?: string;
  createdAt?: string;   // ISO
  lastUpdated: string; // ISO
  completedAt: string | null; // ISO
}

export interface CreateWorkoutRequest {
  name: string;
  division: string;
  muscleGroup: string;
  estimatedDuration: number;
  notes?: string;
}


export interface Exercise {
  id: string;
  name: string;
  sets: number;
  weight: number;
  reps: number;
  order: number;       // para manter a ordem da lista
  createdAt: string;   // ISO
}
