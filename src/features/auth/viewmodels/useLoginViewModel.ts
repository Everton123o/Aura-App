import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../../../services/authService';

export function useLoginViewModel() {
  const { setAuthenticatedUser } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Informe seu email';
    else if (!/\S+@\S+\.\S+/.test(email.trim())) e.email = 'Email inválido';
    if (!password.trim()) e.password = 'Informe sua senha';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin(onSuccess: () => void) {
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await authService.login(email, password);
      setAuthenticatedUser(result.user);
      onSuccess();
    } catch (err: any) {
      setErrors({ general: err?.message || 'Não foi possível entrar.' });
    } finally {
      setLoading(false);
    }
  }

  return { email, setEmail, password, setPassword, loading, errors, handleLogin };
}
