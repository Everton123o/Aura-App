import { useState } from 'react';
import { authService } from '../services/authService';
import { RegisterRequest } from '../features/auth/types/AuthTypes';

export function useRegisterViewModel() {
  const [username, setUsername]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [errors, setErrors]                   = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!username.trim())    e.username = 'Username is required';
    if (!email.trim())       e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password.trim())    e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!confirmPassword.trim())  e.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister(onSuccess: (token: string) => void) {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: RegisterRequest = { username, email, password, confirmPassword };
      const res = await authService.register(payload);
      onSuccess(res.token);
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return { username, setUsername, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, loading, errors, handleRegister };
}
