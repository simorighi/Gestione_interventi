import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import {
  getSegnalazioni,
  getStati,
  type PaginaSegnalazioniApi,
  type StatoApi,
} from '../services/api';

interface ListaSegnalazioniProps {
  onVisualizzaDettaglio: (id: number) => void;
  onNuovaSegnalazione: () => void;
}

export function ListaSegnalazioni({
  onVisualizzaDettaglio,
  onNuovaSegnalazione,
}: ListaSegnalazioniProps) {
  const [data, setData] = useState<PaginaSegnalazioniApi | null>(null);
  const [states, setStates] = useState<StatoApi[]>([]);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [stateId, setStateId] = useState('');
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pageSize = 10;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (submittedSearch.trim()) params.set('q', submittedSearch.trim());
      if (stateId) params.set('statoId', stateId);
      try {
        const [result, workflow] = await Promise.all([
          getSegnalazioni(params, controller.signal),
          getStati(controller.signal),
        ]);
        if (controller.signal.aborted) return;
        setData(result);
        setStates(workflow);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Errore caricamento segnalazioni.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [page, stateId, submittedSearch, attempt]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSubmittedSearch(search);
  };
  const pageCount = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h2 className="mb-0">Lista Segnalazioni</h2>
        <Button onClick={onNuovaSegnalazione}>+ Nuova Segnalazione</Button>
      </div>
      {error && (
        <Alert variant="danger">
          {error}
          <Button variant="link" onClick={() => setAttempt((value) => value + 1)}>Riprova</Button>
        </Alert>
      )}
      <Card className="mb-3">
        <Card.Body>
          <Form onSubmit={submitSearch}>
            <Row className="g-2">
              <Col xs={12} md={7}>
                <Form.Control
                  aria-label="Ricerca segnalazioni"
                  placeholder="Cerca per titolo o descrizione"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </Col>
              <Col xs={8} md={3}>
                <Form.Select
                  aria-label="Filtra per stato"
                  value={stateId}
                  onChange={(event) => {
                    setStateId(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tutti gli stati</option>
                  {states.map((state) => <option key={state.id} value={state.id}>{state.nome}</option>)}
                </Form.Select>
              </Col>
              <Col xs={4} md={2}>
                <Button type="submit" className="w-100">Cerca</Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
      <Card>
        <Card.Body>
          {loading && !data ? (
            <div className="text-center p-4"><Spinner animation="border" /></div>
          ) : data?.items.length ? (
            <>
              <Table responsive striped bordered hover>
                <thead className="table-dark">
                  <tr><th>ID</th><th>Titolo</th><th>Luogo</th><th>Categoria</th><th>Priorità</th><th>Stato</th><th>Azioni</th></tr>
                </thead>
                <tbody>
                  {data.items.map((report) => (
                    <tr key={report.id}>
                      <td>#{report.id}</td>
                      <td><strong>{report.titolo}</strong><br /><small>{report.descrizione}</small></td>
                      <td>{report.luogo.nome}</td>
                      <td>{report.categoria.nome}</td>
                      <td>{report.prioritaAssegnata?.nome ?? report.prioritaProposta.nome}</td>
                      <td><Badge bg="secondary">{report.stato.nome}</Badge></td>
                      <td>
                        <Button size="sm" variant="outline-primary" onClick={() => onVisualizzaDettaglio(report.id)}>
                          Dettaglio
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="d-flex justify-content-between align-items-center">
                <small>{data.total} segnalazioni · pagina {page} di {pageCount}</small>
                <div className="d-flex gap-2">
                  <Button size="sm" variant="outline-secondary" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Precedente</Button>
                  <Button size="sm" variant="outline-secondary" disabled={page >= pageCount || loading} onClick={() => setPage((value) => value + 1)}>Successiva</Button>
                </div>
              </div>
            </>
          ) : (
            !loading && <p className="text-muted mb-0">Nessuna segnalazione trovata.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
