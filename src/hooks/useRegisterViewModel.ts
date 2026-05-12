import { useState, useRef, useEffect } from 'react';
import { authService } from '../services/authService';
import { RegisterRequest } from '../features/auth/types/AuthTypes';

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/email-already-in-use':   'Este email já está cadastrado.',
  'auth/invalid-email':          'Email inválido.',
  'auth/weak-password':          'Senha fraca. Use ao menos 6 caracteres.',
  'auth/network-request-failed': 'Sem conexão com a internet.',
  'auth/too-many-requests':      'Muitas tentativas. Tente mais tarde.',
};

export function useRegisterViewModel() {
  const [username, setUsername]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [errors, setErrors]                   = useState<Record<string, string>>({});
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  function validate(): boolean {
    setErrors({}); // limpa erros anteriores
    const e: Record<string, string> = {};

    if (!username.trim())
      e.username = 'Username is required';
    else if (username.trim().length < 3)
      e.username = 'Mínimo 3 caracteres';

    if (!email.trim())
      e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email))
      e.email = 'Invalid email';

    if (!password.trim())
      e.password = 'Password is required';
    else if (password.length < 6)
      e.password = 'Password must be at least 6 characters';

    if (!confirmPassword.trim())
      e.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword)
      e.confirmPassword = 'Passwords do not match';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister(onSuccess: (token: string) => void) {
  if (!validate()) return;
  setLoading(true);
  try {
    const payload: RegisterRequest = { username, email, password };
    const res = await authService.register(payload);
    if (mounted.current) setLoading(false); // ← para o loading ANTES de navegar
    onSuccess(res.token);
  } catch (err: any) {
    console.log('ERRO COMPLETO:', JSON.stringify(err));
    console.log('CODIGO:', err?.code);
    console.log('MENSAGEM:', err?.message);
    if (mounted.current) {
      const message = FIREBASE_ERRORS[err?.code] ?? 'Registration failed. Please try again.';
      setErrors({ general: message });
    }
  } finally {
    if (mounted.current) setLoading(false);
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