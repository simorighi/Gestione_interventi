import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import {
  addAssegnazione,
  addNota,
  archiveAssegnazione,
  archiveNota,
  archiveSegnalazione,
  cambiaStato,
  getDettaglioSegnalazione,
  getStati,
  getTecnici,
  updateNota,
  updateSegnalazione,
  type DettaglioSegnalazioneApi,
  type StatoApi,
  type TecnicoApi,
} from '../services/api';

interface DettaglioSegnalazioneProps {
  id: number;
  onTornaIndietro: () => void;
}

export function DettaglioSegnalazione({ id, onTornaIndietro }: DettaglioSegnalazioneProps) {
  const { profile } = useAuth();
  const [detail, setDetail] = useState<DettaglioSegnalazioneApi | null>(null);
  const [states, setStates] = useState<StatoApi[]>([]);
  const [technicians, setTechnicians] = useState<TecnicoApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [statusId, setStatusId] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [note, setNote] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const [report, workflow, technicianList] = await Promise.all([
        getDettaglioSegnalazione(id, signal),
        getStati(signal),
        getTecnici(),
      ]);
      if (signal?.aborted) return;
      setDetail(report);
      setStates(workflow);
      setTechnicians(technicianList);
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : 'Errore caricamento segnalazione.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadDetail() {
      await load(controller.signal);
    }
    void loadDetail();
    return () => controller.abort();
  }, [load]);

  const submitStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail || !statusId) return;
    setSaving(true);
    setError('');
    try {
      await cambiaStato(detail.id, {
        statoId: Number(statusId),
        ...(statusReason.trim() ? { motivo: statusReason.trim() } : {}),
      });
      setNotice('Stato aggiornato.');
      setStatusId('');
      setStatusReason('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Cambio stato non riuscito.');
    } finally {
      setSaving(false);
    }
  };

  const submitNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail || !note.trim()) return;
    setSaving(true);
    setError('');
    try {
      await addNota(detail.id, note.trim());
      setNote('');
      setNotice('Nota salvata.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Salvataggio nota non riuscito.');
    } finally {
      setSaving(false);
    }
  };

  const submitAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail || !technicianId) return;
    setSaving(true);
    setError('');
    try {
      await addAssegnazione(detail.id, Number(technicianId));
      setTechnicianId('');
      setNotice('Tecnico assegnato.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Assegnazione non riuscita.');
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError('');
    try {
      await updateSegnalazione(detail.id, {
        titolo: String(form.get('titolo') ?? ''),
        descrizione: String(form.get('descrizione') ?? ''),
        luogoId: Number(form.get('luogoId')),
        categoriaId: Number(form.get('categoriaId')),
        prioritaPropostaId: Number(form.get('prioritaPropostaId')),
      });
      setShowEdit(false);
      setNotice('Segnalazione aggiornata.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Modifica non riuscita.');
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    if (!detail) return;
    const reason = window.prompt('Motivo dell’annullamento (obbligatorio):');
    if (!reason?.trim()) return;
    setSaving(true);
    setError('');
    try {
      await archiveSegnalazione(detail.id, reason.trim());
      onTornaIndietro();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Archiviazione non riuscita.');
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
  if (!detail) {
    return <><Alert variant="danger">{error || 'Segnalazione non trovata.'}</Alert><Button onClick={onTornaIndietro}>Torna alla lista</Button></>;
  }

  const roles = profile?.ruoli ?? [];
  const canEdit = roles.some((role) => ['Segnalatore', 'Responsabile manutenzione', 'Amministratore'].includes(role));
  const canManage = roles.some((role) => ['Responsabile manutenzione', 'Amministratore'].includes(role));
  const canChangeStatus = roles.some((role) => ['Tecnico', 'Responsabile manutenzione', 'Amministratore'].includes(role));
  const usableStates = detail.transizioniAmmesse
    .map((name) => states.find((state) => state.nome === name))
    .filter((state): state is StatoApi => Boolean(state));

  return (
    <div>
      <Button variant="outline-secondary" className="mb-3" onClick={onTornaIndietro}>← Torna alla lista</Button>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert>}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h2 className="mb-0">Segnalazione #{detail.id}: {detail.titolo}</h2>
        <Badge bg="primary">{detail.stato.nome}</Badge>
      </div>
      <Row className="g-3">
        <Col xs={12} lg={8}>
          <Card className="mb-3">
            <Card.Header><strong>Dettagli intervento</strong></Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col sm={6}><strong>Luogo:</strong> {detail.luogo.nome}</Col>
                <Col sm={6}><strong>Categoria:</strong> {detail.categoria.nome}</Col>
                <Col sm={6}><strong>Priorità proposta:</strong> {detail.prioritaProposta.nome}</Col>
                <Col sm={6}><strong>Segnalatore:</strong> {detail.segnalatore.nome} {detail.segnalatore.cognome}</Col>
                <Col sm={6}><strong>Creata:</strong> {new Date(detail.dataCreazione).toLocaleString()}</Col>
              </Row>
              <hr />
              <p className="mb-0">{detail.descrizione}</p>
            </Card.Body>
            {canEdit && (
              <Card.Footer className="d-flex gap-2">
                <Button size="sm" variant="outline-primary" onClick={() => setShowEdit(true)}>Modifica</Button>
                {canManage && <Button size="sm" variant="outline-danger" onClick={() => void archive()} disabled={saving}>Annulla segnalazione</Button>}
              </Card.Footer>
            )}
          </Card>

          <Card className="mb-3">
            <Card.Header><strong>Storico stati</strong></Card.Header>
            <ListGroup variant="flush">
              {(detail.storicoStati ?? []).map((raw, index) => {
                const event = raw as {
                  dataCambio?: string;
                  motivo?: string | null;
                  statoPrecedente?: { nome: string } | null;
                  statoNuovo?: { nome: string };
                  modificatoDa?: { nome: string; cognome: string };
                };
                return (
                  <ListGroup.Item key={`${event.dataCambio ?? index}-${index}`}>
                    <strong>{event.statoNuovo?.nome ?? 'Cambio stato'}</strong>
                    {event.statoPrecedente && <> · da {event.statoPrecedente.nome}</>}
                    <span className="text-muted"> · {event.modificatoDa?.nome} {event.modificatoDa?.cognome}</span>
                    <small className="d-block text-muted">
                      {event.dataCambio ? new Date(event.dataCambio).toLocaleString() : ''}
                      {event.motivo ? ` · ${event.motivo}` : ''}
                    </small>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </Card>

          <Card>
            <Card.Header><strong>Note tecniche</strong></Card.Header>
            <ListGroup variant="flush">
              {(detail.noteTecniche ?? []).map((entry) => (
                <ListGroup.Item key={entry.id} className="d-flex justify-content-between gap-2">
                  <div>
                    {entry.testo}
                    <small className="d-block text-muted">
                      {entry.autore.nome} {entry.autore.cognome} · {new Date(entry.dataInserimento).toLocaleString()}
                    </small>
                  </div>
                  {canManage && (
                    <div className="d-flex gap-1">
                      <Button size="sm" variant="outline-primary" onClick={() => {
                        const text = window.prompt('Modifica nota', entry.testo);
                        if (!text?.trim()) return;
                        void updateNota(entry.id, text.trim()).then(() => load()).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Modifica nota non riuscita.'));
                      }}>Modifica</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => {
                        if (!window.confirm('Archiviare questa nota?')) return;
                        void archiveNota(entry.id).then(() => load()).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Archiviazione nota non riuscita.'));
                      }}>Archivia</Button>
                    </div>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
            {canChangeStatus && (
              <Card.Body>
                <Form onSubmit={submitNote}>
                  <Form.Group className="mb-2">
                    <Form.Label>Aggiungi nota</Form.Label>
                    <Form.Control as="textarea" rows={3} value={note} onChange={(event) => setNote(event.target.value)} required maxLength={10000} />
                  </Form.Group>
                  <Button size="sm" type="submit" disabled={saving || !note.trim()}>Salva nota</Button>
                </Form>
              </Card.Body>
            )}
          </Card>
        </Col>

        <Col xs={12} lg={4}>
          {canChangeStatus && (
            <Card className="mb-3">
              <Card.Header><strong>Workflow</strong></Card.Header>
              <Card.Body>
                {usableStates.length ? (
                  <Form onSubmit={submitStatus}>
                    <Form.Group className="mb-2">
                      <Form.Label>Prossimo stato</Form.Label>
                      <Form.Select value={statusId} onChange={(event) => setStatusId(event.target.value)} required>
                        <option value="">Seleziona</option>
                        {usableStates.map((state) => <option key={state.id} value={state.id}>{state.nome}</option>)}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Motivo</Form.Label>
                      <Form.Control value={statusReason} onChange={(event) => setStatusReason(event.target.value)} maxLength={1000} />
                    </Form.Group>
                    <Button type="submit" disabled={saving || !statusId}>Aggiorna stato</Button>
                  </Form>
                ) : <p className="text-muted mb-0">Nessuna transizione consentita.</p>}
              </Card.Body>
            </Card>
          )}
          <Card className="mb-3">
            <Card.Header><strong>Assegnazioni tecnici</strong></Card.Header>
            <ListGroup variant="flush">
              {(detail.assegnazioni ?? []).map((assignment) => (
                <ListGroup.Item key={assignment.id} className="d-flex justify-content-between align-items-center gap-2">
                  <span>{assignment.tecnico.utente.nome} {assignment.tecnico.utente.cognome}</span>
                  {canManage && (
                    <Button size="sm" variant="outline-danger" onClick={() => {
                      void archiveAssegnazione(assignment.id).then(() => load()).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Rimozione assegnazione non riuscita.'));
                    }}>
                      Rimuovi
                    </Button>
                  )}
                </ListGroup.Item>
              ))}
              {!detail.assegnazioni?.length && <ListGroup.Item className="text-muted">Nessun tecnico assegnato</ListGroup.Item>}
            </ListGroup>
            {canManage && (
              <Card.Body>
                <Form onSubmit={submitAssignment}>
                  <Form.Group className="mb-2">
                    <Form.Label>Assegna tecnico</Form.Label>
                    <Form.Select value={technicianId} onChange={(event) => setTechnicianId(event.target.value)}>
                      <option value="">Seleziona tecnico</option>
                      {technicians.map((technician) => (
                        <option key={technician.utenteId} value={technician.utenteId}>
                          {technician.utente.nome} {technician.utente.cognome}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Button size="sm" type="submit" disabled={saving || !technicianId}>Assegna</Button>
                </Form>
              </Card.Body>
            )}
          </Card>
        </Col>
      </Row>

      <EditReportModal
        show={showEdit}
        detail={detail}
        states={states}
        onHide={() => setShowEdit(false)}
        onSubmit={submitEdit}
        saving={saving}
      />
    </div>
  );
}

function EditReportModal({
  show,
  detail,
  states,
  onHide,
  onSubmit,
  saving,
}: {
  show: boolean;
  detail: DettaglioSegnalazioneApi;
  states: StatoApi[];
  onHide: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton><Modal.Title>Modifica segnalazione</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3"><Form.Label>Titolo</Form.Label><Form.Control name="titolo" required minLength={3} maxLength={200} defaultValue={detail.titolo} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Descrizione</Form.Label><Form.Control as="textarea" name="descrizione" required minLength={10} maxLength={5000} defaultValue={detail.descrizione} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Categoria ID</Form.Label><Form.Control type="number" name="categoriaId" required min={1} defaultValue={detail.categoria.id} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Luogo ID</Form.Label><Form.Control type="number" name="luogoId" required min={1} defaultValue={detail.luogo.id} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Priorità proposta ID</Form.Label><Form.Control type="number" name="prioritaPropostaId" required min={1} defaultValue={detail.prioritaProposta.id} /></Form.Group>
          <small className="text-muted">Stati disponibili: {states.map((state) => state.nome).join(', ')}</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={saving}>Annulla</Button>
          <Button type="submit" disabled={saving}>{saving ? <Spinner size="sm" className="me-2" /> : null}Salva</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
