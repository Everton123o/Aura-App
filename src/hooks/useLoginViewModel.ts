import { useState, useRef, useEffect } from 'react';
import { authService } from '../services/authService';
import { LoginRequest } from '../features/auth/types/AuthTypes';

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/user-not-found':         'Usuário não encontrado.',
  'auth/wrong-password':         'Senha incorreta.',
  'auth/invalid-email':          'Email inválido.',
  'auth/user-disabled':          'Usuário desativado.',
  'auth/too-many-requests':      'Muitas tentativas. Tente mais tarde.',
  'auth/network-request-failed': 'Sem conexão com a internet.',
  'auth/invalid-credential':     'Email ou senha incorretos.',
};

export function useLoginViewModel() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  function validate(): boolean {
    setErrors({});
    const e: Record<string, string> = {};
    if (!email.trim())
      e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email))
      e.email = 'Invalid email';
    if (!password.trim())
      e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin(onSuccess: (token: string) => void) {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: LoginRequest = { email, password };
      const res = await authService.login(payload);
      if (mounted.current) setLoading(false);
      onSuccess(res.token);
    } catch (err: any) {
      if (mounted.current) {
        const message = FIREBASE_ERRORS[err?.code] ?? 'Login failed. Please try again.';
        setErrors({ general: message });
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  return { email, setEmail, password, setPassword, loading, errors, handleLogin };
}