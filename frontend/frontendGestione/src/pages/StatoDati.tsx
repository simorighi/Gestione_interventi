import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import {
  ApiError,
  cambiaStato,
  creaSegnalazione,
  getCategorie,
  getDettaglioSegnalazione,
  getHealth,
  getLuoghi,
  getPriorita,
  getSegnalazioni,
  getStati,
  type CategoriaApi,
  type DettaglioSegnalazioneApi,
  type LuogoApi,
  type PaginaSegnalazioniApi,
  type PrioritaApi,
  type SegnalazioneApi,
  type StatoApi,
} from '../services/api';

const pageSize = 10;

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Utente non riconosciuto. Controlla l’ID utente.';
    if (error.status === 403) return 'L’utente non ha il ruolo necessario per questa operazione.';
    if (error.status === 409) return 'Il record è stato modificato da un altro utente. Ricarica i dati.';
    return error.message;
  }
  if (error instanceof TypeError) return 'Backend non raggiungibile. Verifica che sia avviato.';
  return error instanceof Error ? error.message : 'Errore imprevisto.';
}

export function StatoDati() {
  const [health, setHealth] = useState<
    | { state: 'loading' }
    | { state: 'ok' }
    | { state: 'down'; message: string }
  >({ state: 'loading' });
  const [healthAttempt, setHealthAttempt] = useState(0);
  const [healthCheckedAt, setHealthCheckedAt] = useState<Date | null>(null);
  const [records, setRecords] = useState<PaginaSegnalazioniApi | null>(null);
  const [categorie, setCategorie] = useState<CategoriaApi[]>([]);
  const [priorita, setPriorita] = useState<PrioritaApi[]>([]);
  const [stati, setStati] = useState<StatoApi[]>([]);
  const [luoghi, setLuoghi] = useState<LuogoApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataAttempt, setDataAttempt] = useState(0);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] =
    useState<DettaglioSegnalazioneApi | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusTarget, setStatusTarget] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal)
      .then((result) => {
        setHealth(result.database === 'up' ? { state: 'ok' } : {
          state: 'down',
          message: 'Backend raggiungibile, ma database non disponibile.',
        });
        setHealthCheckedAt(new Date());
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setHealth({ state: 'down', message: errorMessage(cause) });
          setHealthCheckedAt(new Date());
        }
      });
    return () => controller.abort();
  }, [healthAttempt]);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (submittedQuery.trim()) params.set('q', submittedQuery.trim());

    try {
      const [result, categoriesResult, prioritiesResult, statesResult, placesResult] =
        await Promise.all([
          getSegnalazioni(params, signal),
          getCategorie(signal),
          getPriorita(signal),
          getStati(signal),
          getLuoghi(signal),
        ]);
      setRecords(result);
      setCategorie(categoriesResult);
      setPriorita(prioritiesResult);
      setStati(statesResult);
      setLuoghi(placesResult);
    } catch (cause) {
      if (!signal?.aborted) setError(errorMessage(cause));
    }
  }, [page, submittedQuery]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      await loadData(controller.signal);
      if (!controller.signal.aborted) setLoading(false);
    }
    void load();
    return () => controller.abort();
  }, [dataAttempt, loadData]);

  const refresh = () => {
    setLoading(true);
    setDataAttempt((attempt) => attempt + 1);
    setHealthAttempt((attempt) => attempt + 1);
  };

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSubmittedQuery(query);
    setLoading(true);
    setDataAttempt((attempt) => attempt + 1);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError('');
    const formData = new FormData(event.currentTarget);
    const luogoId = Number(formData.get('luogoId'));
    const categoriaId = Number(formData.get('categoriaId'));
    const prioritaPropostaId = Number(formData.get('prioritaPropostaId'));
    if (!luogoId || !categoriaId || !prioritaPropostaId) {
      setCreateError('Seleziona luogo, categoria e priorità.');
      return;
    }

    setCreating(true);
    try {
      await creaSegnalazione({
        titolo: String(formData.get('titolo') ?? ''),
        descrizione: String(formData.get('descrizione') ?? ''),
        luogoId,
        categoriaId,
        prioritaPropostaId,
      });
      setShowCreate(false);
      setSuccess('Segnalazione creata e salvata nel database.');
      if (page !== 1) setPage(1);
      setLoading(true);
      setDataAttempt((attempt) => attempt + 1);
    } catch (cause) {
      setCreateError(errorMessage(cause));
    } finally {
      setCreating(false);
    }
  };

  const openStatusEditor = async (record: SegnalazioneApi) => {
    setSelectedId(record.id);
    setSelectedDetail(null);
    setStatusError('');
    setStatusTarget('');
    setStatusReason('');
    setLoadingDetail(true);
    try {
      const detail = await getDettaglioSegnalazione(record.id);
      setSelectedDetail(detail);
    } catch (cause) {
      setStatusError(errorMessage(cause));
    } finally {
      setLoadingDetail(false);
    }
  };

  const saveStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId || !statusTarget) return;
    const target = stati.find((state) => state.nome === statusTarget);
    if (!target) {
      setStatusError('Lo stato selezionato non è valido.');
      return;
    }

    setSavingStatus(true);
    setStatusError('');
    try {
      await cambiaStato(selectedId, {
        statoId: target.id,
        ...(statusReason.trim() ? { motivo: statusReason.trim() } : {}),
      });
      setSelectedId(null);
      setSuccess('Stato aggiornato e storico registrato.');
      setLoading(true);
      setDataAttempt((attempt) => attempt + 1);
    } catch (cause) {
      setStatusError(errorMessage(cause));
    } finally {
      setSavingStatus(false);
    }
  };

  const totalPages = records ? Math.max(1, Math.ceil(records.total / pageSize)) : 1;

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h2 className="mb-1">Stato backend e gestione dati</h2>
          <p className="text-muted mb-0">
            Controlla il database e lavora sulle segnalazioni salvate via API.
          </p>
        </div>
        <Button variant="outline-primary" onClick={refresh} disabled={loading}>
          {loading ? <Spinner size="sm" className="me-2" /> : null}
          Aggiorna
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Body className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h5 className="mb-1">Connessione API e database</h5>
            <div className="text-muted">
              {health.state === 'loading' && 'Verifica in corso...'}
              {health.state === 'ok' && 'API raggiungibile · Database connesso'}
              {health.state === 'down' && health.message}
            </div>
            {healthCheckedAt && (
              <small className="text-muted">
                Ultimo controllo: {healthCheckedAt.toLocaleTimeString()}
              </small>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge bg={health.state === 'ok' ? 'success' : health.state === 'loading' ? 'secondary' : 'danger'}>
              {health.state === 'ok' ? 'ONLINE' : health.state === 'loading' ? 'VERIFICA' : 'OFFLINE'}
            </Badge>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => setHealthAttempt((attempt) => attempt + 1)}
            >
              Verifica
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Alert variant="info">
        Le operazioni disponibili sono autorizzate dal backend usando la sessione
        Supabase dell’utente autenticato.
      </Alert>

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
          <Button
            size="sm"
            variant="link"
            onClick={() => {
              setLoading(true);
              setDataAttempt((attempt) => attempt + 1);
            }}
          >
            Riprova
          </Button>
        </Alert>
      )}

      <Card>
        <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <strong>Segnalazioni dal database</strong>
          <Button
            variant="primary"
            onClick={() => {
              setCreateError('');
              setShowCreate(true);
            }}
          >
            Nuova segnalazione
          </Button>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={search} className="mb-3">
            <Row className="g-2">
              <Col xs={12} md={8}>
                <Form.Control
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cerca per titolo o descrizione"
                  aria-label="Cerca segnalazioni"
                />
              </Col>
              <Col xs={12} md="auto">
                <Button type="submit" variant="outline-primary">Cerca</Button>
              </Col>
            </Row>
          </Form>

          {loading && !records ? (
            <div className="text-center p-4"><Spinner animation="border" /></div>
          ) : records?.items.length ? (
            <>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>ID / Titolo</th>
                    <th>Luogo</th>
                    <th>Categoria</th>
                    <th>Priorità</th>
                    <th>Stato</th>
                    <th>Creata</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {records.items.map((record) => (
                    <tr key={record.id}>
                      <td><strong>#{record.id} · {record.titolo}</strong><br /><small>{record.descrizione}</small></td>
                      <td>{record.luogo.nome}</td>
                      <td>{record.categoria.nome}</td>
                      <td>{record.prioritaAssegnata?.nome ?? record.prioritaProposta.nome}</td>
                      <td><Badge bg="secondary">{record.stato.nome}</Badge></td>
                      <td>{new Date(record.dataCreazione).toLocaleDateString()}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => void openStatusEditor(record)}
                        >
                          Cambia stato
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  {records.total} risultati · pagina {records.page} di {totalPages}
                </small>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    disabled={page <= 1 || loading}
                    onClick={() => {
                      setLoading(true);
                      setPage((current) => current - 1);
                    }}
                  >
                    Precedente
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    disabled={page >= totalPages || loading}
                    onClick={() => {
                      setLoading(true);
                      setPage((current) => current + 1);
                    }}
                  >
                    Successiva
                  </Button>
                </div>
              </div>
            </>
          ) : (
            !loading && <Alert variant="light" className="mb-0">Nessuna segnalazione trovata.</Alert>
          )}
        </Card.Body>
      </Card>

      <Alert variant="warning" className="mt-4 mb-0">
        Da questa pagina sono supportate creazione e transizioni di stato perché
        esistono le relative API. Modifica completa ed eliminazione non sono
        abilitate: il backend non espone ancora endpoint per queste operazioni.
      </Alert>

      <Modal show={showCreate} onHide={() => !creating && setShowCreate(false)} centered>
        <Form onSubmit={handleCreate}>
          <Modal.Header closeButton={!creating}>
            <Modal.Title>Nuova segnalazione</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {createError && <Alert variant="danger">{createError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Titolo</Form.Label>
              <Form.Control name="titolo" required minLength={3} maxLength={200} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descrizione</Form.Label>
              <Form.Control as="textarea" name="descrizione" required minLength={10} maxLength={5000} rows={4} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Luogo</Form.Label>
              <Form.Select name="luogoId" required defaultValue="">
                <option value="" disabled>Seleziona luogo</option>
                {luoghi.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.padreId ? '↳ ' : ''}{place.nome} ({place.tipo})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Categoria</Form.Label>
              <Form.Select name="categoriaId" required defaultValue="">
                <option value="" disabled>Seleziona categoria</option>
                {categorie.map((category) => (
                  <option key={category.id} value={category.id}>{category.nome}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Priorità proposta</Form.Label>
              <Form.Select name="prioritaPropostaId" required defaultValue="">
                <option value="" disabled>Seleziona priorità</option>
                {priorita.map((level) => (
                  <option key={level.id} value={level.id}>{level.nome}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreate(false)} disabled={creating}>Annulla</Button>
            <Button type="submit" disabled={creating || !luoghi.length || !categorie.length || !priorita.length}>
              {creating ? <Spinner size="sm" className="me-2" /> : null}
              Salva nel database
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={selectedId !== null}
        onHide={() => !savingStatus && setSelectedId(null)}
        centered
      >
        <Form onSubmit={saveStatus}>
          <Modal.Header closeButton={!savingStatus}>
            <Modal.Title>Cambia stato segnalazione #{selectedId}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {statusError && <Alert variant="danger">{statusError}</Alert>}
            {loadingDetail ? (
              <div className="text-center p-3"><Spinner animation="border" /></div>
            ) : selectedDetail ? (
              selectedDetail.transizioniAmmesse.length ? (
                <>
                  <p>
                    Stato attuale: <strong>{selectedDetail.stato.nome}</strong>
                  </p>
                  <Form.Group className="mb-3">
                    <Form.Label>Nuovo stato</Form.Label>
                    <Form.Select
                      required
                      value={statusTarget}
                      onChange={(event) => setStatusTarget(event.target.value)}
                    >
                      <option value="">Seleziona uno stato ammesso</option>
                      {selectedDetail.transizioniAmmesse.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Motivo (facoltativo)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      maxLength={1000}
                      value={statusReason}
                      onChange={(event) => setStatusReason(event.target.value)}
                    />
                  </Form.Group>
                </>
              ) : (
                <Alert variant="info">La segnalazione è in uno stato finale e non ha transizioni disponibili.</Alert>
              )
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedId(null)} disabled={savingStatus}>Chiudi</Button>
            {selectedDetail?.transizioniAmmesse.length ? (
              <Button type="submit" disabled={savingStatus || loadingDetail || !statusTarget}>
                {savingStatus ? <Spinner size="sm" className="me-2" /> : null}
                Salva stato
              </Button>
            ) : null}
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
