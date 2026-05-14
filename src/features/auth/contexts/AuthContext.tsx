import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../../../services/authService';
import { AppUser } from '../types/AuthTypes';

interface AuthContextValue {
  user: AppUser | null;
  initializing: boolean;
  logout: () => Promise<void>;
  setAuthenticatedUser: (user: AppUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onSessionChanged(nextUser => {
      setUser(nextUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      logout: authService.logout,
      setAuthenticatedUser: setUser,
    }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
