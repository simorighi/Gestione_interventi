import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Row, Spinner } from 'react-bootstrap';
import { BadgePriorita, BadgeStato } from '../components/Badges';
import { useAuth } from '../contexts/AuthContext';
import {
  api,
  ApiError,
  formattaData,
  nomeCompleto,
  prioritaEffettiva,
  type SegnalazioneDettaglio,
  type Stato,
  type TecnicoAssegnabile,
} from '../services/api';

interface DettaglioSegnalazioneProps {
  id: number;
  onTornaIndietro: () => void;
}

export function DettaglioSegnalazione({ id, onTornaIndietro }: DettaglioSegnalazioneProps) {
  const { haRuolo } = useAuth();
  const gestore = haRuolo('Responsabile manutenzione', 'Amministratore');
  const puoCambiareStato = gestore || haRuolo('Tecnico');

  const [s, setS] = useState<SegnalazioneDettaglio | null>(null);
  const [stati, setStati] = useState<Stato[]>([]);
  const [tecnici, setTecnici] = useState<TecnicoAssegnabile[]>([]);
  const [errore, setErrore] = useState('');
  const [messaggio, setMessaggio] = useState('');
  const [nuovoStato, setNuovoStato] = useState('');
  const [motivo, setMotivo] = useState('');
  const [tecnicoScelto, setTecnicoScelto] = useState('');
  const [invio, setInvio] = useState(false);

  const carica = useCallback(() => {
    api<SegnalazioneDettaglio>(`/segnalazioni/${id}`)
      .then((d) => {
        setS(d);
        setNuovoStato('');
      })
      .catch((e) => setErrore(e instanceof ApiError ? e.message : 'Errore di caricamento'));
  }, [id]);

  useEffect(() => {
    carica();
    api<Stato[]>('/stati').then(setStati).catch(() => setStati([]));
    if (gestore) api<TecnicoAssegnabile[]>('/tecnici').then(setTecnici).catch(() => setTecnici([]));
  }, [carica, gestore]);

  /** Esegue un'azione sul backend, mostra l'esito e ricarica il dettaglio. */
  const esegui = async (azione: () => Promise<unknown>, ok: string) => {
    setInvio(true);
    setErrore('');
    setMessaggio('');
    try {
      await azione();
      setMessaggio(ok);
      carica();
    } catch (e) {
      setErrore(e instanceof ApiError ? e.message : 'Operazione non riuscita');
    } finally {
      setInvio(false);
    }
  };

  const cambiaStato = () => {
    const stato = stati.find((x) => x.nome === nuovoStato);
    if (!stato) return;
    void esegui(
      () =>
        api(`/segnalazioni/${id}/stato`, {
          method: 'PATCH',
          body: { statoId: stato.id, motivo: motivo.trim() || undefined },
        }),
      `Stato aggiornato a "${stato.nome}"`,
    ).then(() => setMotivo(''));
  };

  const assegna = () => {
    if (!tecnicoScelto) return;
    void esegui(
      () => api(`/segnalazioni/${id}/assegnazioni`, { method: 'POST', body: { tecnicoIds: [Number(tecnicoScelto)] } }),
      'Tecnico assegnato',
    ).then(() => setTecnicoScelto(''));
  };

  if (errore && !s) {
    return (
      <div>
        <Button onClick={onTornaIndietro} className="mb-3">← Torna alla lista</Button>
        <Alert variant="danger">{errore}</Alert>
      </div>
    );
  }
  if (!s) return <Spinner />;

  const giaAssegnati = new Set(s.assegnazioni.map((a) => a.tecnicoId));
  const assegnabili = tecnici.filter((t) => !giaAssegnati.has(t.id));

  return (
    <div>
      <Button onClick={onTornaIndietro} className="mb-3">← Torna alla lista</Button>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <h2 className="mb-0 flex-grow-1">Segnalazione #{s.id}: {s.titolo}</h2>
        <span className="fs-5"><BadgeStato stato={s.stato} /></span>
      </div>

      {errore && <Alert variant="danger" dismissible onClose={() => setErrore('')}>{errore}</Alert>}
      {messaggio && <Alert variant="success" dismissible onClose={() => setMessaggio('')}>{messaggio}</Alert>}

      <Row>
        <Col xs={12} lg={8}>
          <Card className="mb-4">
            <Card.Header><h5 className="mb-0">Dettagli</h5></Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col sm={6}><strong>Luogo:</strong> {s.luogo.nome}</Col>
                <Col sm={6}><strong>Categoria:</strong> {s.categoria.nome}</Col>
                <Col sm={6}><strong>Priorità:</strong> <BadgePriorita priorita={prioritaEffettiva(s)} /></Col>
                <Col sm={6}><strong>Segnalata da:</strong> {nomeCompleto(s.segnalatore)}</Col>
                <Col sm={6}><strong>Creata:</strong> {formattaData(s.dataCreazione)}</Col>
                {s.dataChiusura && <Col sm={6}><strong>Chiusa:</strong> {formattaData(s.dataChiusura)}</Col>}
                <Col xs={12}>
                  <strong>Tecnici assegnati:</strong>{' '}
                  {s.assegnazioni.length === 0
                    ? 'nessuno'
                    : s.assegnazioni.map((a) => (
                        <Badge key={a.id} bg="light" text="dark" className="me-1 border">
                          {nomeCompleto(a.tecnico.utente)}
                        </Badge>
                      ))}
                </Col>
              </Row>
              <hr />
              <p className="mb-1"><strong>Descrizione</strong></p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{s.descrizione}</p>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header><h5 className="mb-0">Storico stati</h5></Card.Header>
            <ListGroup variant="flush">
              {s.storicoStati.map((e) => (
                <ListGroup.Item key={e.id} className="d-flex flex-column flex-sm-row justify-content-sm-between gap-1">
                  <div>
                    <strong>{e.statoPrecedente ? `${e.statoPrecedente.nome} → ${e.statoNuovo.nome}` : `Creata (${e.statoNuovo.nome})`}</strong>
                    <span className="text-muted ms-1">— {nomeCompleto(e.modificatoDa)}</span>
                    {e.motivo && <div className="small text-muted">{e.motivo}</div>}
                  </div>
                  <small className="text-muted flex-shrink-0">{formattaData(e.dataCambio)}</small>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>

        <Col xs={12} lg={4}>
          {puoCambiareStato && (
            <Card className="mb-4">
              <Card.Header><h5 className="mb-0">Cambia stato</h5></Card.Header>
              <Card.Body>
                {s.transizioniAmmesse.length === 0 ? (
                  <p className="text-muted mb-0">Stato finale: nessuna transizione possibile.</p>
                ) : (
                  <>
                    {/* Solo le transizioni che il backend dichiara ammesse da qui. */}
                    <Form.Select className="mb-2" value={nuovoStato} onChange={(e) => setNuovoStato(e.target.value)} aria-label="Nuovo stato">
                      <option value="">Scegli il nuovo stato...</option>
                      {s.transizioniAmmesse.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </Form.Select>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      maxLength={1000}
                      className="mb-2"
                      placeholder="Motivo (facoltativo, finisce nello storico)"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                    />
                    <Button className="w-100" disabled={!nuovoStato || invio} onClick={cambiaStato}>
                      Aggiorna stato
                    </Button>
                  </>
                )}
              </Card.Body>
            </Card>
          )}

          {gestore && !s.stato.isFinale && (
            <Card className="mb-4">
              <Card.Header><h5 className="mb-0">Assegna tecnico</h5></Card.Header>
              <Card.Body>
                {assegnabili.length === 0 ? (
                  <p className="text-muted mb-0">Nessun altro tecnico disponibile.</p>
                ) : (
                  <>
                    <Form.Select className="mb-2" value={tecnicoScelto} onChange={(e) => setTecnicoScelto(e.target.value)} aria-label="Tecnico">
                      <option value="">Scegli un tecnico...</option>
                      {assegnabili.map((t) => (
                        <option key={t.id} value={t.id}>
                          {nomeCompleto(t)}{t.specializzazione ? ` — ${t.specializzazione}` : ''}
                        </option>
                      ))}
                    </Form.Select>
                    <Button variant="secondary" className="w-100" disabled={!tecnicoScelto || invio} onClick={assegna}>
                      Assegna
                    </Button>
                  </>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
