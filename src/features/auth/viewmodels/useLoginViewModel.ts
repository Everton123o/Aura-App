import { useState } from 'react';
import { authService } from '../../../services/authService';

export function useLoginViewModel() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!email.trim())    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password.trim()) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin(onSuccess: () => void) {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.login(email, password);
      onSuccess();
    } catch (err: any) {
      // Traduz erros do Firebase para mensagens amigáveis
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrors({ general: 'Email or password incorrect' });
      } else if (code === 'auth/too-many-requests') {
        setErrors({ general: 'Too many attempts. Try again later.' });
      } else {
        setErrors({ general: 'Login failed. Try again.' });
      }
    } finally {
      setLoading(false);
    }
  }

  return { email, setEmail, password, setPassword, loading, errors, handleLogin };
}