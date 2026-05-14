// features/auth/types/AuthTypes.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AppUser {
  uid: string;
  username: string;
  email: string;
  createdAt?: string;
}

export interface AuthResult {
  user: AppUser;
}
