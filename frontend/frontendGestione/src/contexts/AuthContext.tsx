/* eslint-disable react-refresh/only-export-components -- il contesto esporta anche il suo hook */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, EVENTO_SESSIONE_SCADUTA, sessione, type RispostaLogin, type Ruolo, type Utente } from '../services/api';

interface AuthValue {
  utente: Utente | null;
  /** true finché non sappiamo se la sessione salvata è ancora valida */
  caricamento: boolean;
  /** messaggio mostrato nella pagina di login (es. sessione scaduta) */
  avviso: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  haRuolo: (...ruoli: Ruolo[]) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utente, setUtente] = useState<Utente | null>(null);
  const [caricamento, setCaricamento] = useState(() => sessione.token() !== null);
  const [avviso, setAvviso] = useState('');

  // All'avvio: se c'è un token salvato, chiediamo al backend chi siamo.
  useEffect(() => {
    if (!sessione.token()) return;
    api<Utente>('/auth/me')
      .then(setUtente)
      .catch(() => sessione.cancella())
      .finally(() => setCaricamento(false));
  }, []);

  // Qualsiasi 401 dal backend (token scaduto) riporta al login.
  useEffect(() => {
    const scaduta = () => {
      setUtente(null);
      setAvviso('Sessione scaduta: accedi di nuovo.');
    };
    window.addEventListener(EVENTO_SESSIONE_SCADUTA, scaduta);
    return () => window.removeEventListener(EVENTO_SESSIONE_SCADUTA, scaduta);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<RispostaLogin>('/auth/login', { method: 'POST', body: { email, password } });
    sessione.salva(r.token);
    setAvviso('');
    setUtente(r.utente);
  }, []);

  const logout = useCallback(() => {
    sessione.cancella();
    setUtente(null);
  }, []);

  const haRuolo = useCallback(
    (...ruoli: Ruolo[]) => !!utente && utente.ruoli.some((r) => ruoli.includes(r)),
    [utente],
  );

  return (
    <AuthContext.Provider value={{ utente, caricamento, avviso, login, logout, haRuolo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth va usato dentro <AuthProvider>');
  return ctx;
}
