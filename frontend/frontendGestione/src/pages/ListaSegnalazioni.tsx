import { useState } from 'react';
import { Card, Table, Badge, Button, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { segnalazioni } from '../data/mockData';

interface ListaSegnalazioniProps {
  onVisualizzaDettaglio: (id: number) => void;
  onNuovaSegnalazione: () => void;
}

export function ListaSegnalazioni({ onVisualizzaDettaglio, onNuovaSegnalazione }: ListaSegnalazioniProps) {
  const [filtroStato, setFiltroStato] = useState('tutti');
  const [ricerca, setRicerca] = useState('');

  const segnalazioniFiltrate = segnalazioni.filter(s => {
    const matchStato = filtroStato === 'tutti' || s.stato === filtroStato;
    const matchRicerca = s.titolo.toLowerCase().includes(ricerca.toLowerCase()) || 
                         s.descrizione.toLowerCase().includes(ricerca.toLowerCase());
    return matchStato && matchRicerca;
  });

  const getStatoBadge = (stato: string) => {
    const variants: Record<string, string> = {
      segnalato: 'secondary', preso_in_carico: 'primary', in_lavorazione: 'info',
      sospeso: 'warning', risolto: 'success'
    };
    return <Badge bg={variants[stato]}>{stato.replace('_', ' ').toUpperCase()}</Badge>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Lista Segnalazioni</h2>
        <Button variant="primary" onClick={onNuovaSegnalazione}>+ Nuova Segnalazione</Button>
      </div>

      {/* Filtri */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <Form.Control placeholder="Cerca per titolo o descrizione..." value={ricerca} onChange={e => setRicerca(e.target.value)} />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filtroStato} onChange={e => setFiltroStato(e.target.value)}>
                <option value="tutti">Tutti gli stati</option>
                <option value="segnalato">Segnalato</option>
                <option value="preso_in_carico">Preso in carico</option>
                <option value="in_lavorazione">In lavorazione</option>
                <option value="risolto">Risolto</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabella */}
      <Table striped bordered hover responsive className="bg-white">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Titolo</th>
            <th>Edificio</th>
            <th>Priorità</th>
            <th>Stato</th>
            <th>Tecnico</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {segnalazioniFiltrate.map(seg => (
            <tr key={seg.id}>
              <td>#{seg.id}</td>
              <td>{seg.titolo}</td>
              <td>{seg.edificio}</td>
              <td><Badge bg={seg.priorita === 'urgente' ? 'danger' : seg.priorita === 'alta' ? 'warning' : 'secondary'}>{seg.priorita}</Badge></td>
              <td>{getStatoBadge(seg.stato)}</td>
              <td>{seg.tecnicoAssegnato || '-'}</td>
              <td>
                <Button variant="outline-primary" size="sm" onClick={() => onVisualizzaDettaglio(seg.id)}>Dettagli</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}