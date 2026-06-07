import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../../../services/authService';

export function useRegisterViewModel() {
  const { setAuthenticatedUser } = useAuth();
  const [username, setUsername]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [errors, setErrors]                   = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!username.trim())    e.username = 'Informe seu nome';
    if (!email.trim())       e.email    = 'Informe seu email';
    else if (!/\S+@\S+\.\S+/.test(email.trim())) e.email = 'Email inválido';
    if (!password.trim())    e.password = 'Informe sua senha';
    else if (password.length < 6) e.password = 'A senha precisa ter pelo menos 6 caracteres';
    if (!confirmPassword.trim())  e.confirmPassword = 'Confirme sua senha';
    else if (password !== confirmPassword) e.confirmPassword = 'As senhas não conferem';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister(onSuccess: () => void) {
    if (loading) return;
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await authService.register(username, email, password);
      setAuthenticatedUser(result.user);
      onSuccess();
    } catch (err: any) {
      const message = err?.message || 'Não foi possível criar sua conta.';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  }

  return {
    username, setUsername,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    loading, errors,
    handleRegister,
  };
}
