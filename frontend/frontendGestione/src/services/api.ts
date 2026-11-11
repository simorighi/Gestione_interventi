import { supabase } from './supabase';

export interface HealthResponse {
  status: 'ok' | 'error';
  database: 'up' | 'down';
}

export interface CategoriaApi {
  id: number;
  nome: string;
  descrizione: string | null;
  attiva: boolean;
}

export interface PrioritaApi {
  id: number;
  nome: string;
  livello: number;
}

export interface StatoApi {
  id: number;
  nome: string;
  ordine: number;
  isFinale: boolean;
}

export interface LuogoApi {
  id: number;
  nome: string;
  tipo: string;
  via?: string | null;
  citta?: string | null;
  cap?: string | null;
  padreId: number | null;
  archivedAt?: string | null;
  padre?: { id: number; nome: string } | null;
}

export interface SegnalazioneApi {
  id: number;
  titolo: string;
  descrizione: string;
  dataCreazione: string;
  luogo: Pick<LuogoApi, 'id' | 'nome' | 'tipo'>;
  categoria: Pick<CategoriaApi, 'id' | 'nome'>;
  stato: Pick<StatoApi, 'id' | 'nome'>;
  prioritaProposta: Pick<PrioritaApi, 'id' | 'nome' | 'livello'>;
  prioritaAssegnata: Pick<PrioritaApi, 'id' | 'nome' | 'livello'> | null;
  segnalatore: { id: number; nome: string; cognome: string; email: string };
  archivedAt?: string | null;
  assegnazioni?: AssegnazioneApi[];
  storicoStati?: Record<string, unknown>[];
  noteTecniche?: NotaApi[];
}

export interface NotaApi {
  id: number;
  testo: string;
  dataInserimento: string;
  autore: { id: number; nome: string; cognome: string };
}

export interface AssegnazioneApi {
  id: number;
  tecnico: { utente: { id: number; nome: string; cognome: string } };
  responsabile: { id: number; nome: string; cognome: string };
  dataAssegnazione: string;
}

export interface TecnicoApi {
  utenteId: number;
  tipo: string;
  azienda: string | null;
  specializzazione: string;
  utente: { id: number; nome: string; cognome: string; email: string };
  interventiAttivi: number;
}

export interface UtenteApi {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  attivo: boolean;
  ruoli: { ruolo: { nome: string } }[];
  tecnico: { tipo: string; azienda: string | null; specializzazione: string } | null;
}

export interface TransizioneApi {
  id: number;
  daStatoId: number;
  aStatoId: number;
  daStato: StatoApi;
  aStato: StatoApi;
}

export interface LuogoInput {
  nome: string;
  tipo: 'edificio' | 'area' | 'impianto';
  via?: string | null;
  citta?: string | null;
  cap?: string | null;
  padreId?: number | null;
}

export interface CategoriaInput {
  nome: string;
  descrizione?: string | null;
  attiva?: boolean;
}

export interface UtenteInput {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  ruolo: string;
  specializzazione?: string;
  tipoTecnico?: 'interno' | 'esterno';
  azienda?: string;
}

export interface WorkflowStateInput {
  nome: string;
  ordine: number;
  isFinale: boolean;
}

export interface PaginaSegnalazioniApi {
  items: SegnalazioneApi[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DettaglioSegnalazioneApi extends SegnalazioneApi {
  transizioniAmmesse: string[];
}

export interface CreaSegnalazioneInput {
  titolo: string;
  descrizione: string;
  luogoId: number;
  categoriaId: number;
  prioritaPropostaId: number;
}

export interface CambiaStatoInput {
  statoId: number;
  motivo?: string;
}

export class ApiError extends Error {
  public readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { data: { session } } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null } };
  if (!session) throw new ApiError('Accedi per continuare.', 401);

  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${session.access_token}`,
      ...init.headers,
    },
    cache: 'no-store',
  });
  const body: unknown = await response.json().catch(() => null);

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
        : `Richiesta non riuscita (HTTP ${response.status}).`;
    throw new ApiError(message, response.status);
  }

  return body as T;
}

function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== 'object' || value === null) return false;

  const response = value as Record<string, unknown>;
  return (
    (response.status === 'ok' || response.status === 'error') &&
    (response.database === 'up' || response.database === 'down')
  );
}

export async function getHealth(signal: AbortSignal): Promise<HealthResponse> {
  const startedAt = performance.now();
  if (import.meta.env.DEV) {
    console.debug('[api] controllo connessione avviato', { path: '/api/health' });
  }

  try {
    const response = await fetch('/api/health', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal,
    });
    const body: unknown = await response.json();

    if (!isHealthResponse(body)) {
      throw new Error('Il backend ha restituito una risposta non valida.');
    }

    if (!response.ok && body.status !== 'error') {
      throw new Error(`Il controllo del backend è fallito (HTTP ${response.status}).`);
    }

    if (import.meta.env.DEV) {
      console.debug('[api] risposta controllo connessione', {
        status: response.status,
        backend: body.status,
        database: body.database,
        durationMs: Math.round(performance.now() - startedAt),
      });
    }
    return body;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[api] controllo connessione fallito', {
        durationMs: Math.round(performance.now() - startedAt),
        errorName: error instanceof Error ? error.name : 'UnknownError',
        aborted: signal.aborted,
      });
    }
    throw error;
  }
}

export function getSegnalazioni(
  params: URLSearchParams,
  signal?: AbortSignal,
) {
  const query = params.toString();
  return requestJson<PaginaSegnalazioniApi>(
    `/api/segnalazioni${query ? `?${query}` : ''}`,
    { signal },
  );
}

export function getCategorie(signal?: AbortSignal) {
  return requestJson<CategoriaApi[]>('/api/categorie', { signal });
}

export function getPriorita(signal?: AbortSignal) {
  return requestJson<PrioritaApi[]>('/api/priorita', { signal });
}

export function getStati(signal?: AbortSignal) {
  return requestJson<StatoApi[]>('/api/stati', { signal });
}

export function getLuoghi(signal?: AbortSignal) {
  return requestJson<LuogoApi[]>('/api/luoghi', { signal });
}

export function getDettaglioSegnalazione(id: number, signal?: AbortSignal) {
  return requestJson<DettaglioSegnalazioneApi>(`/api/segnalazioni/${id}`, {
    signal,
  });
}

export function creaSegnalazione(input: CreaSegnalazioneInput) {
  return requestJson<SegnalazioneApi>('/api/segnalazioni', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function cambiaStato(
  id: number,
  input: CambiaStatoInput,
) {
  return requestJson<SegnalazioneApi>(`/api/segnalazioni/${id}/stato`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function updateSegnalazione(id: number, input: Partial<CreaSegnalazioneInput>) {
  return requestJson<SegnalazioneApi>(`/api/segnalazioni/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function archiveSegnalazione(id: number, motivo: string) {
  return requestJson<{ id: number; archivedAt: string }>(`/api/segnalazioni/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ motivo }),
  });
}

export function getNote(id: number) {
  return requestJson<NotaApi[]>(`/api/segnalazioni/${id}/note`);
}

export function addNota(id: number, testo: string) {
  return requestJson<NotaApi>(`/api/segnalazioni/${id}/note`, {
    method: 'POST',
    body: JSON.stringify({ testo }),
  });
}

export function archiveNota(id: number) {
  return requestJson<{ id: number }>(`/api/note/${id}`, { method: 'DELETE' });
}

export function updateNota(id: number, testo: string) {
  return requestJson<NotaApi>(`/api/note/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ testo }),
  });
}

export function getAssegnazioni(id: number) {
  return requestJson<AssegnazioneApi[]>(`/api/segnalazioni/${id}/assegnazioni`);
}

export function addAssegnazione(segnalazioneId: number, tecnicoId: number) {
  return requestJson<AssegnazioneApi>(`/api/segnalazioni/${segnalazioneId}/assegnazioni`, {
    method: 'POST',
    body: JSON.stringify({ tecnicoId }),
  });
}

export function archiveAssegnazione(id: number) {
  return requestJson<{ id: number }>(`/api/assegnazioni/${id}`, { method: 'DELETE' });
}

export function getTecnici() {
  return requestJson<TecnicoApi[]>('/api/tecnici');
}

export function createTecnico(input: UtenteInput) {
  return requestJson<UtenteApi>('/api/tecnici', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTecnico(id: number, input: Partial<UtenteInput>) {
  return requestJson<UtenteApi>(`/api/tecnici/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function archiveTecnico(id: number) {
  return requestJson<UtenteApi>(`/api/tecnici/${id}`, { method: 'DELETE' });
}

export function getUtenti() {
  return requestJson<UtenteApi[]>('/api/utenti');
}

export function createUtente(input: UtenteInput) {
  return requestJson<UtenteApi>('/api/utenti', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateUtente(id: number, input: Partial<UtenteInput> & { attivo?: boolean }) {
  return requestJson<UtenteApi>(`/api/utenti/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function archiveUtente(id: number) {
  return requestJson<UtenteApi>(`/api/utenti/${id}`, { method: 'DELETE' });
}

export function getAllCategorie() {
  return requestJson<CategoriaApi[]>('/api/categorie?includeInactive=true');
}

export function createCategoria(input: CategoriaInput) {
  return requestJson<CategoriaApi>('/api/categorie', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCategoria(id: number, input: CategoriaInput) {
  return requestJson<CategoriaApi>(`/api/categorie/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function archiveCategoria(id: number) {
  return requestJson<CategoriaApi>(`/api/categorie/${id}`, { method: 'DELETE' });
}

export function getAllLuoghi() {
  return requestJson<LuogoApi[]>('/api/luoghi?includeArchived=true');
}

export function createLuogo(input: LuogoInput) {
  return requestJson<LuogoApi>('/api/luoghi', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateLuogo(id: number, input: LuogoInput) {
  return requestJson<LuogoApi>(`/api/luoghi/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function archiveLuogo(id: number) {
  return requestJson<LuogoApi>(`/api/luoghi/${id}`, { method: 'DELETE' });
}

export function getWorkflow() {
  return requestJson<StatoApi[]>('/api/workflow/stati');
}

export function getTransizioni() {
  return requestJson<TransizioneApi[]>('/api/workflow/transizioni');
}

export function createStato(input: WorkflowStateInput) {
  return requestJson<StatoApi>('/api/workflow/stati', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateStato(id: number, input: WorkflowStateInput) {
  return requestJson<StatoApi>(`/api/workflow/stati/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function archiveStato(id: number) {
  return requestJson<StatoApi>(`/api/workflow/stati/${id}`, { method: 'DELETE' });
}

export function addTransizione(daStatoId: number, aStatoId: number) {
  return requestJson<TransizioneApi>('/api/workflow/transizioni', {
    method: 'POST',
    body: JSON.stringify({ daStatoId, aStatoId }),
  });
}

export function archiveTransizione(id: number) {
  return requestJson<{ id: number }>(`/api/workflow/transizioni/${id}`, { method: 'DELETE' });
}
