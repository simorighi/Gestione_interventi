import { Card, Row, Col, Badge, Button, Form, ListGroup, Alert } from 'react-bootstrap';
import { segnalazioni } from '../data/mockData';

interface DettaglioSegnalazioneProps {
  id: number;
  onTornaIndietro: () => void;
}

export function DettaglioSegnalazione({ id, onTornaIndietro }: DettaglioSegnalazioneProps) {
  const segnalazione = segnalazioni.find(s => s.id === id);

  if (!segnalazione) return <Alert variant="danger">Segnalazione non trovata</Alert>;

  return (
  <div>
    {/* Pulsante Torna Indietro */}
    <Button onClick={onTornaIndietro} className="mb-3  btn-primary">
      ← Torna alla lista
    </Button>

    {/* Header con titolo e stato */}
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
      <h2 className="mb-0 flex-grow-1">
        Segnalazione #{segnalazione.id}: {segnalazione.titolo}
      </h2>
      <Badge bg="primary" className="fs-6 flex-shrink-0">
        {segnalazione.stato.replace('_', ' ').toUpperCase()}
      </Badge>
    </div>

    <Row>
      {/* Colonna Sinistra: Info e Storico */}
      <Col xs={12} lg={8}>
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Dettagli Intervento</h5>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col xs={12} sm={6}>
                <strong>Edificio:</strong> {segnalazione.edificio}
              </Col>
              <Col xs={12} sm={6}>
                <strong>Categoria:</strong> {segnalazione.categoria}
              </Col>
              <Col xs={12} sm={6}>
                <strong>Data Creazione:</strong> {segnalazione.dataCreazione}
              </Col>
              <Col xs={12} sm={6}>
                <strong>Tecnico Assegnato:</strong> {segnalazione.tecnicoAssegnato || 'Nessuno'}
              </Col>
            </Row>
            <hr />
            <p><strong>Descrizione:</strong></p>
            <p>{segnalazione.descrizione}</p>
          </Card.Body>
        </Card>

        {/* Storico / Tracciabilità (Punto 7) */}
        <Card>
          <Card.Header>
            <h5 className="mb-0">Storico e Tracciabilità</h5>
          </Card.Header>
          <ListGroup variant="flush">
            {segnalazione.storico.map((evento, idx) => (
              <ListGroup.Item key={idx} className="d-flex flex-column flex-sm-row justify-content-sm-between gap-1">
                <div>
                  <strong>{evento.azione}</strong>
                  <span className="text-muted ms-1">- {evento.utente}</span>
                </div>
                <small className="text-muted flex-shrink-0">
                  {evento.data}
                </small>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      </Col>

      {/* Colonna Destra: Azioni Workflow */}
      <Col xs={12} lg={4}>
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Gestione Workflow</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Cambia Stato</Form.Label>
              <Form.Select>
                <option value="preso_in_carico">Preso in carico</option>
                <option value="in_lavorazione">In lavorazione</option>
                <option value="sospeso">Sospeso</option>
                <option value="risolto">Risolto</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Assegna Tecnico</Form.Label>
              <Form.Select>
                <option>Mario Rossi</option>
                <option>Luigi Neri</option>
              </Form.Select>
            </Form.Group>
            <Button variant="primary" className="w-100 mb-2">
              Aggiorna Stato
            </Button>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h5 className="mb-0">Aggiungi Nota Tecnica</h5>
          </Card.Header>
          <Card.Body>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Inserisci note sull'intervento..."
              className="mb-2"
            />
            <Button variant="secondary" className="w-100">
              Salva Nota
            </Button>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </div>
);
}