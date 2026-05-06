import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest } from '../features/auth/types/AuthTypes';
import { API_BASE_URL } from '../constants/config';
 
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
 
export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', {
      username: data.username,
      email: data.email,
      password: data.password,
    });
    return response.data;
  },
 
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', {
      username: data.username,
      email: data.email,
      password: data.password,
    });
    return response.data;
  },
};
 