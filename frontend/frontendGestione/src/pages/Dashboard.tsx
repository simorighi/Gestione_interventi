import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Spinner, Table } from 'react-bootstrap';
import {
  getHealth,
  getSegnalazioni,
  type HealthResponse,
  type SegnalazioneApi,
} from '../services/api';

export function Dashboard() {
  const [attempt, setAttempt] = useState(0);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [items, setItems] = useState<SegnalazioneApi[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [healthResult, reportResult] = await Promise.all([
          getHealth(controller.signal),
          getSegnalazioni(new URLSearchParams({ page: '1', pageSize: '5' }), controller.signal),
        ]);
        if (controller.signal.aborted) return;
        setHealth(healthResult);
        setItems(reportResult.items);
        setTotal(reportResult.total);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'Impossibile caricare i dati.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  const count = (predicate: (report: SegnalazioneApi) => boolean) =>
    items.filter(predicate).length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Dashboard</h2>
        <Button variant="outline-primary" onClick={() => setAttempt((value) => value + 1)} disabled={loading}>
          Aggiorna dati
        </Button>
      </div>
      {health && (
        <Alert variant={health.status === 'ok' && health.database === 'up' ? 'success' : 'danger'}>
          API: {health.status === 'ok' ? 'online' : 'errore'} · Database: {health.database}
        </Alert>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="mb-4 g-3">
        {[
          { label: 'Segnalazioni caricate', value: total, color: 'primary' },
          { label: 'Aperte in questa pagina', value: count((report) => report.stato.nome === 'Segnalato'), color: 'warning' },
          { label: 'In lavorazione in questa pagina', value: count((report) => report.stato.nome === 'In lavorazione'), color: 'info' },
          { label: 'Risolte in questa pagina', value: count((report) => report.stato.nome === 'Risolto'), color: 'success' },
        ].map((stat) => (
          <Col key={stat.label} xs={12} sm={6} lg={3}>
            <Card className={`border-start border-4 border-${stat.color} h-100`}>
              <Card.Body>
                <h6 className="text-muted">{stat.label}</h6>
                <h2 className="mb-0">{loading ? <Spinner size="sm" /> : stat.value}</h2>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      <Card>
        <Card.Header><strong>Segnalazioni recenti dal database</strong></Card.Header>
        <Card.Body>
          {loading && !items.length ? (
            <div className="text-center p-4"><Spinner animation="border" /></div>
          ) : items.length ? (
            <Table responsive striped hover className="mb-0">
              <thead>
                <tr><th>Titolo</th><th>Luogo</th><th>Categoria</th><th>Priorità</th><th>Stato</th></tr>
              </thead>
              <tbody>
                {items.map((report) => (
                  <tr key={report.id}>
                    <td>#{report.id} · {report.titolo}</td>
                    <td>{report.luogo.nome}</td>
                    <td>{report.categoria.nome}</td>
                    <td>{report.prioritaAssegnata?.nome ?? report.prioritaProposta.nome}</td>
                    <td><Badge bg="secondary">{report.stato.nome}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            !loading && <p className="text-muted mb-0">Nessuna segnalazione presente.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
