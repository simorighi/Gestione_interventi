import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Badge, Button, Card, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import {
  archiveTecnico,
  createTecnico,
  getTecnici,
  updateTecnico,
  type TecnicoApi,
} from '../services/api';

export function Tecnici() {
  const { profile } = useAuth();
  const [technicians, setTechnicians] = useState<TecnicoApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<TecnicoApi | null>(null);
  const [showForm, setShowForm] = useState(false);
  const canEdit = profile?.ruoli.some((role) => ['Responsabile manutenzione', 'Amministratore'].includes(role)) ?? false;
  const canArchive = profile?.ruoli.includes('Amministratore') ?? false;

  useEffect(() => {
    const controller = new AbortController();
    getTecnici()
      .then((result) => {
        if (!controller.signal.aborted) setTechnicians(result);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Caricamento tecnici non riuscito.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      nome: String(form.get('nome') ?? ''),
      cognome: String(form.get('cognome') ?? ''),
      email: String(form.get('email') ?? ''),
      ruolo: 'Tecnico',
      specializzazione: String(form.get('specializzazione') ?? ''),
      tipoTecnico: String(form.get('tipoTecnico') ?? 'interno') as 'interno' | 'esterno',
      azienda: String(form.get('azienda') ?? ''),
    };
    setSaving(true);
    setError('');
    try {
      if (selected) await updateTecnico(selected.utenteId, input);
      else await createTecnico({
        ...input,
        password: String(form.get('password') ?? ''),
      });
      setShowForm(false);
      setSelected(null);
      setNotice(selected ? 'Tecnico aggiornato.' : 'Account tecnico creato.');
      setLoading(true);
      setAttempt((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Salvataggio tecnico non riuscito.');
    } finally {
      setSaving(false);
    }
  };

  const archive = async (technician: TecnicoApi) => {
    if (!window.confirm(`Disattivare l’account di ${technician.utente.nome} ${technician.utente.cognome}?`)) return;
    setSaving(true);
    try {
      await archiveTecnico(technician.utenteId);
      setNotice('Account tecnico disattivato; assegnazioni e storico restano conservati.');
      setLoading(true);
      setAttempt((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Disattivazione tecnico non riuscita.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = technicians.filter((tech) =>
    !filter || tech.specializzazione.toLowerCase().includes(filter.toLowerCase()),
  );
  const openNew = () => { setSelected(null); setShowForm(true); };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div><h2 className="mb-1">Gestione Tecnici</h2><p className="text-muted mb-0">Profili tecnici e account del database.</p></div>
        {canEdit && <Button onClick={openNew}>Nuovo tecnico</Button>}
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert>}
      <Card className="mb-3"><Card.Body>
        <Form.Group><Form.Label>Filtra per specializzazione</Form.Label><Form.Control value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Es. elettrico" /></Form.Group>
      </Card.Body></Card>
      <Card><Card.Body>
        {loading ? <div className="text-center p-4"><Spinner animation="border" /></div> : (
          <Table responsive striped bordered hover>
            <thead className="table-dark"><tr><th>Nome</th><th>Email</th><th>Specializzazione</th><th>Tipo</th><th>Azienda</th><th>Assegnazioni</th><th>Azioni</th></tr></thead>
            <tbody>
              {filtered.map((tech) => (
                <tr key={tech.utenteId}>
                  <td>{tech.utente.nome} {tech.utente.cognome}</td><td>{tech.utente.email}</td>
                  <td><Badge bg="info">{tech.specializzazione}</Badge></td><td>{tech.tipo}</td><td>{tech.azienda ?? '—'}</td>
                  <td>{tech.interventiAttivi}</td>
                  <td className="d-flex gap-2">
                    {canEdit && <Button size="sm" variant="outline-primary" onClick={() => { setSelected(tech); setShowForm(true); }}>Modifica</Button>}
                    {canArchive && <Button size="sm" variant="outline-danger" disabled={saving} onClick={() => void archive(tech)}>Disattiva</Button>}
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7}>Nessun tecnico disponibile.</td></tr>}
            </tbody>
          </Table>
        )}
      </Card.Body></Card>
      <Modal show={showForm} onHide={() => !saving && setShowForm(false)} centered>
        <Form onSubmit={save}>
          <Modal.Header closeButton><Modal.Title>{selected ? 'Modifica tecnico' : 'Nuovo tecnico'}</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Nome</Form.Label><Form.Control name="nome" required maxLength={100} defaultValue={selected?.utente.nome} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Cognome</Form.Label><Form.Control name="cognome" required maxLength={100} defaultValue={selected?.utente.cognome} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Email account</Form.Label><Form.Control type="email" name="email" required maxLength={255} defaultValue={selected?.utente.email} disabled={Boolean(selected)} /></Form.Group>
            {!selected && <Form.Group className="mb-3"><Form.Label>Password iniziale</Form.Label><Form.Control type="password" name="password" minLength={12} required autoComplete="new-password" /></Form.Group>}
            <Form.Group className="mb-3"><Form.Label>Specializzazione</Form.Label><Form.Control name="specializzazione" required defaultValue={selected?.specializzazione} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Tipo</Form.Label><Form.Select name="tipoTecnico" defaultValue={selected?.tipo ?? 'interno'}><option value="interno">Interno</option><option value="esterno">Esterno</option></Form.Select></Form.Group>
            <Form.Group><Form.Label>Azienda</Form.Label><Form.Control name="azienda" defaultValue={selected?.azienda ?? ''} /></Form.Group>
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>Annulla</Button><Button type="submit" disabled={saving}>{saving ? <Spinner size="sm" /> : 'Salva'}</Button></Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
