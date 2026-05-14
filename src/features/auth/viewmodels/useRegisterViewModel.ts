import { useState } from 'react';
import { authService } from '../../../services/authService';

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

  async function handleRegister(onSuccess: () => void) {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.register(username, email, password);
      onSuccess();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setErrors({ general: 'This email is already registered' });
      } else if (code === 'auth/weak-password') {
        setErrors({ general: 'Password is too weak' });
      } else {
        setErrors({ general: 'Registration failed. Try again.' });
      }
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