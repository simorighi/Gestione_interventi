export interface HealthResponse {
  status: 'ok' | 'error';
  database: 'up' | 'down';
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
