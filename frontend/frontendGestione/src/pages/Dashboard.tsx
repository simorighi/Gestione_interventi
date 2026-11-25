import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Row, Spinner, Table } from 'react-bootstrap';
import { BadgePriorita, BadgeStato } from '../components/Badges';
import { useAuth } from '../contexts/AuthContext';
import { api, ApiError, formattaData, prioritaEffettiva, type Pagina, type SegnalazioneRiga } from '../services/api';

interface DashboardProps {
  onVisualizzaDettaglio: (id: number) => void;
}

// I contatori riguardano le segnalazioni che l'utente può vedere: il filtro per
// ruolo lo applica il backend (un tecnico vede solo le sue).
export function Dashboard({ onVisualizzaDettaglio }: DashboardProps) {
  const { utente } = useAuth();
  const [segnalazioni, setSegnalazioni] = useState<SegnalazioneRiga[]>([]);
  const [totale, setTotale] = useState(0);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    api<Pagina<SegnalazioneRiga>>('/segnalazioni?pageSize=100')
      .then((p) => {
        setSegnalazioni(p.items);
        setTotale(p.total);
      })
      .catch((e) => setErrore(e instanceof ApiError ? e.message : 'Errore di caricamento'))
      .finally(() => setCaricamento(false));
  }, []);

  const conta = (...stati: string[]) => segnalazioni.filter((s) => stati.includes(s.stato.nome)).length;
  const kpi = [
    { titolo: 'Da prendere in carico', valore: conta('Segnalato'), bordo: 'warning' },
    { titolo: 'In corso', valore: conta('Preso in carico', 'In lavorazione', 'Sospeso'), bordo: 'primary' },
    {
      titolo: 'Urgenti aperte',
      valore: segnalazioni.filter((s) => !s.stato.isFinale && prioritaEffettiva(s).livello >= 4).length,
      bordo: 'danger',
    },
    { titolo: 'Risolte', valore: conta('Risolto'), bordo: 'success' },
  ];

  return (
    <div>
      <h2 className="mb-1">Dashboard</h2>
      <p className="text-muted mb-4">Ciao {utente?.nome}: ecco le segnalazioni di tua competenza.</p>

      {errore && <Alert variant="danger">{errore}</Alert>}
      {totale > segnalazioni.length && (
        <Alert variant="info">Contatori calcolati sulle {segnalazioni.length} segnalazioni più recenti su {totale}.</Alert>
      )}

      <Row className="mb-4 g-3">
        {kpi.map((k) => (
          <Col key={k.titolo} xs={12} sm={6} lg={3}>
            <Card className={`border-start border-4 border-${k.bordo} h-100`}>
              <Card.Body>
                <h6 className="text-muted mb-2">{k.titolo}</h6>
                <h2 className="mb-0">{caricamento ? <Spinner size="sm" /> : k.valore}</h2>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Segnalazioni recenti</h5>
        </Card.Header>
        <Card.Body>
          {!caricamento && segnalazioni.length === 0 && !errore && <p className="mb-0 text-muted">Nessuna segnalazione.</p>}
          {segnalazioni.length > 0 && (
            <Table hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>Titolo</th>
                  <th className="d-none d-md-table-cell">Luogo</th>
                  <th className="d-none d-md-table-cell">Categoria</th>
                  <th>Priorità</th>
                  <th>Stato</th>
                  <th className="d-none d-lg-table-cell">Creata</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {segnalazioni.slice(0, 10).map((s) => (
                  <tr key={s.id}>
                    <td>{s.titolo}</td>
                    <td className="d-none d-md-table-cell">{s.luogo.nome}</td>
                    <td className="d-none d-md-table-cell">{s.categoria.nome}</td>
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
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
