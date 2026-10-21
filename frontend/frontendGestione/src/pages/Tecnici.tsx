import { useState } from 'react';
import { Card, Table, Badge, Button, Row, Col, Form, Modal } from 'react-bootstrap';
import { tecnici, type Tecnico } from '../data/mockData';

export function Tecnici() {
  const [filtroSpecializzazione, setFiltroSpecializzazione] = useState('tutte');
  const [showModal, setShowModal] = useState(false);
  const [tecnicoSelezionato, setTecnicoSelezionato] = useState<Tecnico | null>(null);

  const specializzazioni = [...new Set(tecnici.map(t => t.specializzazione))];

  const tecniciFiltrati = tecnici.filter(t => 
    filtroSpecializzazione === 'tutte' || t.specializzazione === filtroSpecializzazione
  );

  const getStatoBadge = (stato: string) => {
    const variants: Record<string, string> = {
      disponibile: 'success',
      in_missione: 'warning',
      ferie: 'secondary'
    };
    const labels: Record<string, string> = {
      disponibile: 'Disponibile',
      in_missione: 'In Missione',
      ferie: 'In Ferie'
    };
    return <Badge bg={variants[stato]}>{labels[stato]}</Badge>;
  };

  const handleModifica = (tecnico: Tecnico) => {
    setTecnicoSelezionato(tecnico);
    setShowModal(true);
  };

  const handleNuovo = () => {
    setTecnicoSelezionato(null);
    setShowModal(true);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestione Tecnici</h2>
        <Button variant="primary" onClick={handleNuovo}>+ Nuovo Tecnico</Button>
      </div>

      {/* Filtri */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Filtra per specializzazione</Form.Label>
                <Form.Select 
                  value={filtroSpecializzazione} 
                  onChange={e => setFiltroSpecializzazione(e.target.value)}
                >
                  <option value="tutte">Tutte le specializzazioni</option>
                  {specializzazioni.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8} className="d-flex align-items-end">
              <div className="ms-auto">
                <Badge bg="success" className="me-2">Disponibili: {tecnici.filter(t => t.stato === 'disponibile').length}</Badge>
                <Badge bg="warning" className="me-2">In Missione: {tecnici.filter(t => t.stato === 'in_missione').length}</Badge>
                <Badge bg="secondary">In Ferie: {tecnici.filter(t => t.stato === 'ferie').length}</Badge>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabella Tecnici */}
      <Table striped bordered hover responsive className="bg-white">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Telefono</th>
            <th>Specializzazione</th>
            <th>Stato</th>
            <th>Interventi Attivi</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {tecniciFiltrati.map(tecnico => (
            <tr key={tecnico.id}>
              <td>{tecnico.id}</td>
              <td>{tecnico.nome} {tecnico.cognome}</td>
              <td>{tecnico.email}</td>
              <td>{tecnico.telefono}</td>
              <td><Badge bg="info">{tecnico.specializzazione}</Badge></td>
              <td>{getStatoBadge(tecnico.stato)}</td>
              <td className="text-center">
                <Badge bg={tecnico.interventiAttivi > 0 ? 'primary' : 'light'} text={tecnico.interventiAttivi > 0 ? 'white' : 'dark'}>
                  {tecnico.interventiAttivi}
                </Badge>
              </td>
              <td>
                <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleModifica(tecnico)}>
                  Modifica
                </Button>
                <Button variant="outline-danger" size="sm">
                  Elimina
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal Modifica/Nuovo Tecnico */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{tecnicoSelezionato ? 'Modifica Tecnico' : 'Nuovo Tecnico'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nome</Form.Label>
                  <Form.Control defaultValue={tecnicoSelezionato?.nome} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Cognome</Form.Label>
                  <Form.Control defaultValue={tecnicoSelezionato?.cognome} />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" defaultValue={tecnicoSelezionato?.email} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Telefono</Form.Label>
                  <Form.Control defaultValue={tecnicoSelezionato?.telefono} />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Specializzazione</Form.Label>
                  <Form.Select defaultValue={tecnicoSelezionato?.specializzazione}>
                    <option>Idraulica</option>
                    <option>Elettrica</option>
                    <option>Climatizzazione</option>
                    <option>Meccanica</option>
                    <option>Edilizia</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Stato</Form.Label>
                  <Form.Select defaultValue={tecnicoSelezionato?.stato}>
                    <option value="disponibile">Disponibile</option>
                    <option value="in_missione">In Missione</option>
                    <option value="ferie">In Ferie</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Annulla</Button>
          <Button variant="primary">Salva</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}