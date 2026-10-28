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

  return body;
}
