import { Card, Row, Col, Table, Badge, Button } from 'react-bootstrap';
import { segnalazioni } from '../data/mockData';

export function Dashboard() {
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
      
      {/* KPI Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-start border-4 border-warning">
            <Card.Body>
              <h6 className="text-muted">Segnalazioni Aperte</h6>
              <h2 className="mb-0">{stats.aperte}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-start border-4 border-primary">
            <Card.Body>
              <h6 className="text-muted">In Lavorazione</h6>
              <h2 className="mb-0">{stats.inLavorazione}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-start border-4 border-danger">
            <Card.Body>
              <h6 className="text-muted">Urgenti</h6>
              <h2 className="mb-0">{stats.urgenti}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-start border-4 border-success">
            <Card.Body>
              <h6 className="text-muted">Risolti</h6>
              <h2 className="mb-0">{stats.risolti}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabella Segnalazioni */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Segnalazioni Recenti</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                {/* <th>ID</th> */}
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
                  {/* <td>{seg.id}</td> */}
                  <td>{seg.descrizione}</td>
                  <td>{seg.edificio}</td>
                  <td>{seg.categoria}</td>
                  <td>{getPrioritaBadge(seg.priorita)}</td>
                  <td>{getStatoBadge(seg.stato)}</td>
                  <td>
                    <Button variant="outline-primary" size="sm" className="me-2">
                      
                    </Button>
                    <Button variant="outline-secondary" size="sm">
                      ️
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}