import { useState } from 'react';
import { Card, Table, Badge, Button, Row, Col, Form, Modal, ListGroup, Tabs, Tab } from 'react-bootstrap';
import { edifici, type Edificio } from '../data/mockData';

export function Edifici() {
  const [edificioSelezionato, setEdificioSelezionato] = useState<Edificio | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleVisualizzaDettaglio = (edificio: Edificio) => {
    setEdificioSelezionato(edificio);
    setShowModal(true);
  };

  const getTipoBadge = (tipo: string) => {
    const variants: Record<string, string> = {
      uffici: 'primary',
      magazzino: 'warning',
      locale_tecnico: 'danger',
      altro: 'secondary'
    };
    return <Badge bg={variants[tipo] || 'secondary'}>{tipo.replace('_', ' ').toUpperCase()}</Badge>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestione Edifici e Impianti</h2>
        <Button variant="primary">+ Nuovo Edificio</Button>
      </div>

      {/* Riepilogo Rapido */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-start border-4 border-primary">
            <Card.Body>
              <h6 className="text-muted">Totale Edifici</h6>
              <h2 className="mb-0">{edifici.length}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-start border-4 border-info">
            <Card.Body>
              <h6 className="text-muted">Totale Impianti</h6>
              <h2 className="mb-0">{edifici.reduce((acc, e) => acc + e.impianti.length, 0)}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-start border-4 border-warning">
            <Card.Body>
              <h6 className="text-muted">Interventi Attivi su Edifici</h6>
              <h2 className="mb-0">{edifici.reduce((acc, e) => acc + e.interventiAttivi, 0)}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabella Edifici */}
      <Card>
        <Card.Body>
          <Table striped bordered hover responsive className="mb-0">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Nome Edificio</th>
                <th>Indirizzo</th>
                <th>Tipo</th>
                <th>N. Impianti</th>
                <th>Interventi Attivi</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {edifici.map(edificio => (
                <tr key={edificio.id}>
                  <td>{edificio.id}</td>
                  <td><strong>{edificio.nome}</strong></td>
                  <td>{edificio.indirizzo}</td>
                  <td>{getTipoBadge(edificio.tipo)}</td>
                  <td className="text-center">{edificio.impianti.length}</td>
                  <td className="text-center">
                    <Badge bg={edificio.interventiAttivi > 0 ? 'warning' : 'success'} text={edificio.interventiAttivi > 0 ? 'dark' : 'white'}>
                      {edificio.interventiAttivi}
                    </Badge>
                  </td>
                  <td>
                    <Button variant="outline-primary" size="sm" onClick={() => handleVisualizzaDettaglio(edificio)}>
                      Dettagli & Impianti
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modale Dettaglio Edificio */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{edificioSelezionato?.nome}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {edificioSelezionato && (
            <Tabs defaultActiveKey="impianti" className="mb-3">
              <Tab eventKey="info" title="Informazioni">
                <Row className="mt-3">
                  <Col md={6}><strong>Indirizzo:</strong> {edificioSelezionato.indirizzo}</Col>
                  <Col md={6}><strong>Tipo:</strong> {getTipoBadge(edificioSelezionato.tipo)}</Col>
                  <Col md={6} className="mt-2"><strong>Interventi Attivi:</strong> {edificioSelezionato.interventiAttivi}</Col>
                  <Col md={6} className="mt-2"><strong>Totale Impianti:</strong> {edificioSelezionato.impianti.length}</Col>
                </Row>
              </Tab>
              
              <Tab eventKey="impianti" title="Impianti Installati">
                <Table hover className="mt-3">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome Impianto</th>
                      <th>Categoria</th>
                      <th>Ultima Manutenzione</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edificioSelezionato.impianti.map(impianto => (
                      <tr key={impianto.id}>
                        <td>{impianto.id}</td>
                        <td>{impianto.nome}</td>
                        <td><Badge bg="info">{impianto.categoria}</Badge></td>
                        <td>{impianto.ultimaManutenzione}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab>

              <Tab eventKey="storico" title="Storico Interventi">
                <div className="mt-3 text-center text-muted p-4">
                  <p>Qui verrà caricato lo storico completo degli interventi effettuati su questo edificio.</p>
                  <Button variant="outline-primary" size="sm">Vedi Storico Completo</Button>
                </div>
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Chiudi</Button>
          <Button variant="primary">Modifica Edificio</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}