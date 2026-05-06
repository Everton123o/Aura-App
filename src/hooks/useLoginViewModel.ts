import { useState } from 'react';
import { authService } from '../services/authService';
import { LoginRequest } from '../features/auth/types/AuthTypes';

export function useLoginViewModel() {
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = 'Username is required';
    if (!email.trim())    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password.trim()) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin(onSuccess: (token: string) => void) {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: LoginRequest = { username, email, password };
      const res = await authService.login(payload);
      onSuccess(res.token);
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.message || 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return { username, setUsername, email, setEmail, password, setPassword, loading, errors, handleLogin };
}
