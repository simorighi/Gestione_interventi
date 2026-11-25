// CLIENT DELL'API DEL BACKEND
// Le chiamate usano percorsi relativi (/api/...): in sviluppo le inoltra il
// proxy di Vite (vite.config.ts), nel cluster l'Ingress. Nessun URL del
// backend scritto nel codice.
//
// Il token di accesso sta in sessionStorage: sparisce chiudendo la scheda e
// viaggia nell'header Authorization (non in un cookie), quindi niente CSRF.

const CHIAVE_TOKEN = 'nordfacility.token';

export const sessione = {
  token: () => sessionStorage.getItem(CHIAVE_TOKEN),
  salva: (token: string) => sessionStorage.setItem(CHIAVE_TOKEN, token),
  cancella: () => sessionStorage.removeItem(CHIAVE_TOKEN),
};

/** Evento lanciato quando il backend risponde 401: la sessione è scaduta o non valida. */
export const EVENTO_SESSIONE_SCADUTA = 'nordfacility:sessione-scaduta';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function api<T>(percorso: string, opzioni: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = sessione.token();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opzioni.body !== undefined) headers['Content-Type'] = 'application/json';

  let risposta: Response;
  try {
    risposta = await fetch(`/api${percorso}`, {
      method: opzioni.method ?? 'GET',
      headers,
      body: opzioni.body === undefined ? undefined : JSON.stringify(opzioni.body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Server non raggiungibile. Controlla la connessione e riprova.');
  }

  const testo = await risposta.text();
  const dati: unknown = testo ? JSON.parse(testo) : null;

  if (!risposta.ok) {
    const errore = (dati as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    if (risposta.status === 401 && percorso !== '/auth/login') {
      sessione.cancella();
      window.dispatchEvent(new Event(EVENTO_SESSIONE_SCADUTA));
    }
    throw new ApiError(
      risposta.status,
      errore?.code ?? 'HTTP_ERROR',
      errore?.message ?? `Errore ${risposta.status}`,
      errore?.details,
    );
  }
  return dati as T;
}

// ---------------------------------------------------------------------------
// Tipi delle risposte (vedi /api/openapi.json)
// ---------------------------------------------------------------------------

export type Ruolo = 'Segnalatore' | 'Tecnico' | 'Responsabile manutenzione' | 'Amministratore';

export interface Utente {
  id: number;
  email: string;
  nome: string;
  cognome: string;
  ruoli: Ruolo[];
}

export interface Persona {
  id: number;
  nome: string;
  cognome: string;
}

export interface Stato {
  id: number;
  nome: string;
  ordine: number;
  isFinale: boolean;
}

export interface Priorita {
  id: number;
  nome: string;
  livello: number;
}

export interface Categoria {
  id: number;
  nome: string;
  descrizione: string | null;
  attiva: boolean;
}

export interface Luogo {
  id: number;
  nome: string;
  tipo: 'edificio' | 'area' | 'impianto';
  padreId: number | null;
}

export interface TecnicoAssegnabile {
  id: number;
  nome: string;
  cognome: string;
  specializzazione: string | null;
}

export interface SegnalazioneRiga {
  id: number;
  titolo: string;
  descrizione: string;
  dataCreazione: string;
  dataChiusura: string | null;
  stato: Stato;
  categoria: Categoria;
  luogo: Pick<Luogo, 'id' | 'nome' | 'tipo'>;
  prioritaProposta: Priorita;
  prioritaAssegnata: Priorita | null;
  segnalatore: Persona;
}

export interface SegnalazioneDettaglio extends SegnalazioneRiga {
  assegnazioni: {
    id: number;
    dataAssegnazione: string;
    tecnicoId: number;
    tecnico: { utente: Persona };
    responsabile: Persona;
  }[];
  storicoStati: {
    id: number;
    dataCambio: string;
    motivo: string | null;
    statoPrecedente: Stato | null;
    statoNuovo: Stato;
    modificatoDa: Persona;
  }[];
  transizioniAmmesse: string[];
}

export interface Pagina<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RispostaLogin {
  token: string;
  expiresIn: number;
  utente: Utente;
}

export const nomeCompleto = (p: Persona) => `${p.nome} ${p.cognome}`;

export const formattaData = (iso: string) =>
  new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });

/** Priorità decisa dal responsabile, se c'è; altrimenti quella proposta dal segnalatore. */
export const prioritaEffettiva = (s: SegnalazioneRiga) => s.prioritaAssegnata ?? s.prioritaProposta;
