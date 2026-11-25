import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Pagination, Row, Spinner, Table } from 'react-bootstrap';
import { BadgePriorita, BadgeStato } from '../components/Badges';
import { useAuth } from '../contexts/AuthContext';
import { api, ApiError, formattaData, prioritaEffettiva, type Pagina, type SegnalazioneRiga, type Stato } from '../services/api';

interface ListaSegnalazioniProps {
  onVisualizzaDettaglio: (id: number) => void;
  onNuovaSegnalazione: () => void;
}

const PER_PAGINA = 20;

// Filtri e paginazione sono fatti dal backend (GET /api/segnalazioni):
// il browser riceve solo la pagina richiesta e solo le segnalazioni visibili all'utente.
export function ListaSegnalazioni({ onVisualizzaDettaglio, onNuovaSegnalazione }: ListaSegnalazioniProps) {
  const { haRuolo } = useAuth();
  const [stati, setStati] = useState<Stato[]>([]);
  const [statoId, setStatoId] = useState('');
  const [ricerca, setRicerca] = useState('');
  const [testo, setTesto] = useState(''); // ricerca applicata (dopo una breve pausa di digitazione)
  const [pagina, setPagina] = useState(1);
  const [risultato, setRisultato] = useState<Pagina<SegnalazioneRiga> | null>(null);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    api<Stato[]>('/stati').then(setStati).catch(() => setStati([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setTesto(ricerca.trim());
      setPagina(1);
    }, 300);
    return () => clearTimeout(t);
  }, [ricerca]);

  useEffect(() => {
    const q = new URLSearchParams({ page: String(pagina), pageSize: String(PER_PAGINA) });
    if (statoId) q.set('statoId', statoId);
    if (testo) q.set('q', testo);
    let attivo = true;
    api<Pagina<SegnalazioneRiga>>(`/segnalazioni?${q}`)
      .then((r) => {
        if (!attivo) return;
        setRisultato(r);
        setErrore('');
      })
      .catch((e) => attivo && setErrore(e instanceof ApiError ? e.message : 'Errore di caricamento'));
    return () => {
      attivo = false;
    };
  }, [pagina, statoId, testo]);

  const pagine = risultato ? Math.max(1, Math.ceil(risultato.total / PER_PAGINA)) : 1;
  const puoCreare = haRuolo('Segnalatore', 'Responsabile manutenzione', 'Amministratore');

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Segnalazioni</h2>
        {puoCreare && <Button onClick={onNuovaSegnalazione}>+ Nuova segnalazione</Button>}
      </div>

      <Card className="mb-4">
        <Card.Body>
          <Row className="g-2">
            <Col md={8}>
              <Form.Control
                placeholder="Cerca per titolo o descrizione..."
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                aria-label="Cerca"
              />
            </Col>
            <Col md={4}>
              <Form.Select
                value={statoId}
                onChange={(e) => {
                  setStatoId(e.target.value);
                  setPagina(1);
                }}
                aria-label="Filtra per stato"
              >
                <option value="">Tutti gli stati</option>
                {stati.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {errore && <Alert variant="danger">{errore}</Alert>}
      {!risultato && !errore && <Spinner />}

      {risultato && (
        <>
          <p className="text-muted">{risultato.total} segnalazioni</p>
          <Table striped hover responsive className="bg-white">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Titolo</th>
                <th className="d-none d-md-table-cell">Luogo</th>
                <th>Priorità</th>
                <th>Stato</th>
                <th className="d-none d-lg-table-cell">Creata</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {risultato.items.map((s) => (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td>{s.titolo}</td>
                  <td className="d-none d-md-table-cell">{s.luogo.nome}</td>
                  <td><BadgePriorita priorita={prioritaEffettiva(s)} /></td>
                  <td><BadgeStato stato={s.stato} /></td>
                  <td className="d-none d-lg-table-cell">{formattaData(s.dataCreazione)}</td>
                  <td>
                    <Button variant="outline-primary" size="sm" onClick={() => onVisualizzaDettaglio(s.id)}>
                      Dettagli
                    </Button>
                  </td>
                </tr>
              ))}
              {risultato.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted">Nessuna segnalazione trovata</td>
                </tr>
              )}
            </tbody>
          </Table>
          {pagine > 1 && (
            <Pagination>
              <Pagination.Prev disabled={pagina === 1} onClick={() => setPagina(pagina - 1)} />
              <Pagination.Item active>{pagina} / {pagine}</Pagination.Item>
              <Pagination.Next disabled={pagina === pagine} onClick={() => setPagina(pagina + 1)} />
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
