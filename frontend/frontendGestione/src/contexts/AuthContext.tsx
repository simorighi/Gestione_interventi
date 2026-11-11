import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../services/supabase';

export interface AuthProfile {
  id: number;
  email: string;
  nome: string;
  cognome: string;
  ruoli: string[];
}

interface AuthContextValue {
  session: Session | null;
  profile: AuthProfile | null;
  loading: boolean;
  error: string;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [authResolved, setAuthResolved] = useState(!supabaseConfigured);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setAuthResolved(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setProfile(null);
      setError('');
      if (!nextSession) {
        setAuthResolved(true);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof body === 'object' &&
            body !== null &&
            'error' in body &&
            typeof body.error === 'object' &&
            body.error !== null &&
            'message' in body.error &&
            typeof body.error.message === 'string'
              ? body.error.message
              : 'Utente non abilitato per questa applicazione.';
          throw new Error(message);
        }
        return body as AuthProfile;
      })
      .then((nextProfile) => {
        if (active) setProfile(nextProfile);
      })
      .catch((cause: unknown) => {
        if (active) {
          setProfile(null);
          setError(cause instanceof Error ? cause.message : 'Errore di autenticazione.');
        }
      });

    return () => {
      active = false;
    };
  }, [session]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Configura VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
    setError('');
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading: !authResolved || (session !== null && profile === null && error === ''),
        error,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve essere usato dentro AuthProvider.');
  return { ...context, configured: supabaseConfigured };
}
