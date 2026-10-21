import { useState } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';

interface NuovaSegnalazioneProps {
  onAnnulla: () => void;
}

export function NuovaSegnalazione({ onAnnulla }: NuovaSegnalazioneProps) {
  const [descrizione, setDescrizione] = useState('');
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);

  // Simulazione AI: quando l'utente scrive più di 20 caratteri, mostra il suggerimento
  const handleDescrizioneChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescrizione(e.target.value);
    if (e.target.value.length > 20) setShowAiSuggestion(true);
    else setShowAiSuggestion(false);
  };

  const accettaSuggerimento = () => {
    // Qui in futuro aggiorneremo i campi categoria e priorità
    alert('Suggerimento AI accettato! (Logica da implementare)');
    setShowAiSuggestion(false);
  };

  return (
    <div>
      <h2 className="mb-4">Nuova Segnalazione</h2>
      <Card>
        <Card.Body>
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Edificio / Luogo</Form.Label>
                  <Form.Select>
                    <option>Seleziona edificio...</option>
                    <option>Edificio A - Uffici</option>
                    <option>Edificio B - Magazzino</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Categoria</Form.Label>
                  <Form.Select>
                    <option>Seleziona categoria...</option>
                    <option>Idraulica</option>
                    <option>Elettrica</option>
                    <option>Climatizzazione</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descrizione del problema</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4} 
                placeholder="Descrivi il guasto o l'anomalia..." 
                value={descrizione}
                onChange={handleDescrizioneChange}
              />
            </Form.Group>

            {/* Box Suggerimento AI (Punto 10 del PDF) */}
            {showAiSuggestion && (
              <Alert variant="info" className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>🤖 Suggerimento AI:</strong> Basato sulla descrizione, suggeriamo Categoria: <b>Idraulica</b>, Priorità: <b>Alta</b>.
                </div>
                <div>
                  <Button variant="success" size="sm" className="me-2" onClick={accettaSuggerimento}>Accetta</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => setShowAiSuggestion(false)}>Ignora</Button>
                </div>
              </Alert>
            )}

            <Form.Group className="mb-4">
              <Form.Label>Priorità</Form.Label>
              <Form.Select>
                <option value="bassa">Bassa</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Allega Fotografie</Form.Label>
              <Form.Control type="file" multiple />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="button">Invia Segnalazione</Button>
              <Button variant="secondary" onClick={onAnnulla}>Annulla</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}