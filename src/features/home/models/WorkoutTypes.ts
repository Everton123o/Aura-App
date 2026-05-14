export interface Workout {
  id: string;          
  name: string;
  division: string;
  muscleGroup: string;
  estimatedDuration: number;
  exerciseCount: number;
  notes?: string;
  lastUpdated: string;
}

export interface CreateWorkoutRequest {
  name: string;
  division: string;
  muscleGroup: string;
  estimatedDuration: number;
  notes?: string;
}