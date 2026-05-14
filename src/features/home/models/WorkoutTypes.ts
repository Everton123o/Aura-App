export interface Workout {
  id: string;          
  name: string;
  division: string;
  muscleGroup: string;
  estimatedDuration: number;
  exerciseCount: number;
  notes?: string;
  createdAt?: string;
  lastUpdated: string;
  completedAt?: string | null;
}

export interface CreateWorkoutRequest {
  name: string;
  division: string;
  muscleGroup: string;
  estimatedDuration: number;
  notes?: string;
}
