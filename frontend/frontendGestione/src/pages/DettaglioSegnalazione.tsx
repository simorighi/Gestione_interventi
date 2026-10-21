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
      <Button variant="link" onClick={onTornaIndietro} className="mb-3 p-0">← Torna alla lista</Button>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Segnalazione #{segnalazione.id}: {segnalazione.titolo}</h2>
        <Badge bg="primary" className="fs-6">{segnalazione.stato.replace('_', ' ').toUpperCase()}</Badge>
      </div>

      <Row>
        {/* Colonna Sinistra: Info e Storico */}
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header><h5 className="mb-0">Dettagli Intervento</h5></Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}><strong>Edificio:</strong> {segnalazione.edificio}</Col>
                <Col md={6}><strong>Categoria:</strong> {segnalazione.categoria}</Col>
                <Col md={6} className="mt-2"><strong>Data Creazione:</strong> {segnalazione.dataCreazione}</Col>
                <Col md={6} className="mt-2"><strong>Tecnico Assegnato:</strong> {segnalazione.tecnicoAssegnato || 'Nessuno'}</Col>
              </Row>
              <hr />
              <p><strong>Descrizione:</strong></p>
              <p>{segnalazione.descrizione}</p>
            </Card.Body>
          </Card>

          {/* Storico / Tracciabilità (Punto 7) */}
          <Card>
            <Card.Header><h5 className="mb-0">Storico e Tracciabilità</h5></Card.Header>
            <ListGroup variant="flush">
              {segnalazione.storico.map((evento, idx) => (
                <ListGroup.Item key={idx} className="d-flex justify-content-between">
                  <span><strong>{evento.azione}</strong> <span className="text-muted">- {evento.utente}</span></span>
                  <span className="text-muted">{evento.data}</span>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>

        {/* Colonna Destra: Azioni Workflow */}
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header><h5 className="mb-0">Gestione Workflow</h5></Card.Header>
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
              <Button variant="primary" className="w-100 mb-2">Aggiorna Stato</Button>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header><h5 className="mb-0">Aggiungi Nota Tecnica</h5></Card.Header>
            <Card.Body>
              <Form.Control as="textarea" rows={3} placeholder="Inserisci note sull'intervento..." className="mb-2" />
              <Button variant="secondary" className="w-100">Salva Nota</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}