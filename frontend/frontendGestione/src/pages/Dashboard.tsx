import { useEffect, useState } from 'react';
import { Alert, Card, Row, Col, Table, Badge, Button, Spinner } from 'react-bootstrap';
import { segnalazioni } from '../data/mockData';
import { getHealth } from '../services/api';

export function Dashboard() {
  const [healthAttempt, setHealthAttempt] = useState(0);
  const [health, setHealth] = useState<
    | { status: 'loading' }
    | { status: 'ok' }
    | { status: 'database-down' }
    | { status: 'unavailable'; message: string }
  >({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 8000);

    getHealth(controller.signal)
      .then(result => {
        if (active) {
          setHealth(result.status === 'ok' && result.database === 'up'
            ? { status: 'ok' }
            : { status: 'database-down' });
        }
      })
      .catch(error => {
        if (!active) return;

        const message = timedOut
          ? 'Il backend non ha risposto entro 8 secondi.'
          : error instanceof TypeError
            ? 'Backend non raggiungibile. Verifica che sia avviato.'
            : error instanceof Error
              ? error.message
              : 'Errore imprevisto durante il controllo del backend.';
        setHealth({ status: 'unavailable', message });
      })
      .finally(() => window.clearTimeout(timeoutId));

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [healthAttempt]);

  const stats = {
    aperte: segnalazioni.filter(s => s.stato === 'segnalato').length,
    inLavorazione: segnalazioni.filter(s => s.stato === 'in_lavorazione').length,
    urgenti: segnalazioni.filter(s => s.priorita === 'urgente').length,
    risolti: segnalazioni.filter(s => s.stato === 'risolto').length
  };

  const getStatoBadge = (stato: string) => {
    const variants: Record<string, string> = {
      segnalato: 'secondary',
      in_lavorazione: 'info',
      risolto: 'success',
      sospeso: 'warning'
    };
    const labels: Record<string, string> = {
      segnalato: 'Segnalato',
      in_lavorazione: 'In Lavorazione',
      risolto: 'Risolto',
      sospeso: 'Sospeso'
    };
    return <Badge bg={variants[stato]}>{labels[stato]}</Badge>;
  };

  const getPrioritaBadge = (priorita: string) => {
    const variants: Record<string, string> = {
      bassa: 'secondary',
      media: 'primary',
      alta: 'warning',
      urgente: 'danger'
    };
    return <Badge bg={variants[priorita]}>{priorita}</Badge>;
  };

  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>
      <Alert
        variant={health.status === 'ok' ? 'success' : health.status === 'loading' ? 'secondary' : 'warning'}
        className="d-flex align-items-center justify-content-between gap-3"
        role="status"
        aria-live="polite"
      >
        <span>
          {health.status === 'loading' && (
            <>
              <Spinner size="sm" animation="border" className="me-2" />
              Verifica connessione al backend...
            </>
          )}
          {health.status === 'ok' && 'Backend e database connessi'}
          {health.status === 'database-down' && 'Backend raggiungibile, ma database non disponibile'}
          {health.status === 'unavailable' && health.message}
        </span>
        {health.status !== 'loading' && (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              setHealth({ status: 'loading' });
              setHealthAttempt(attempt => attempt + 1);
            }}
          >
            Riprova
          </Button>
        )}
      </Alert>
      
      {/* KPI Cards - responsive: 1 col mobile, 2 col tablet, 4 col desktop */}
      <Row className="mb-4 g-3">
        <Col xs={12} sm={6} lg={3}>
          <Card className="border-start border-4 border-warning h-100">
            <Card.Body>
              <h6 className="text-muted mb-2">Segnalazioni Aperte</h6>
              <h2 className="mb-0">{stats.aperte}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="border-start border-4 border-primary h-100">
            <Card.Body>
              <h6 className="text-muted mb-2">In Lavorazione</h6>
              <h2 className="mb-0">{stats.inLavorazione}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="border-start border-4 border-danger h-100">
            <Card.Body>
              <h6 className="text-muted mb-2">Urgenti</h6>
              <h2 className="mb-0">{stats.urgenti}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="border-start border-4 border-success h-100">
            <Card.Body>
              <h6 className="text-muted mb-2">Risolti</h6>
              <h2 className="mb-0">{stats.risolti}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabella Segnalazioni - visibile solo da md in su */}
      <Card className="d-none d-md-block">
        <Card.Header>
          <h5 className="mb-0">Segnalazioni Recenti</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive className="mb-0">
            <thead>
              <tr>
                <th>Descrizione</th>
                <th>Edificio</th>
                <th>Categoria</th>
                <th>Priorità</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {segnalazioni.map(seg => (
                <tr key={seg.id}>
                  <td>{seg.descrizione}</td>
                  <td>{seg.edificio}</td>
                  <td>{seg.categoria}</td>
                  <td>{getPrioritaBadge(seg.priorita)}</td>
                  <td>{getStatoBadge(seg.stato)}</td>
                  <td>
                    <Button variant="outline-primary" size="sm" className="me-2">
                      👁️
                    </Button>
                    <Button variant="outline-secondary" size="sm">
                      ✏️
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Vista Card per mobile - visibile solo sotto md */}
      <div className="d-md-none">
        <h5 className="mb-3">Segnalazioni Recenti</h5>
        {segnalazioni.map(seg => (
          <Card key={seg.id} className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="mb-0 flex-grow-1 me-2">{seg.descrizione}</h6>
                {getStatoBadge(seg.stato)}
              </div>
              <div className="mb-2">
                <small className="text-muted d-block">📍 {seg.edificio}</small>
                <small className="text-muted">️ {seg.categoria}</small>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  Priorità: {getPrioritaBadge(seg.priorita)}
                </div>
                <div>
                  <Button variant="outline-primary" size="sm" className="me-1">
                    👁️
                  </Button>
                  <Button variant="outline-secondary" size="sm">
                    ✏️
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
}