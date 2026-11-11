import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Badge, Button, Card, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import {
  archiveLuogo,
  createLuogo,
  getAllLuoghi,
  updateLuogo,
  type LuogoApi,
  type LuogoInput,
} from '../services/api';

export function Edifici() {
  const { profile } = useAuth();
  const [places, setPlaces] = useState<LuogoApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<LuogoApi | null>(null);
  const [showForm, setShowForm] = useState(false);
  const canEdit = profile?.ruoli.some((role) => ['Responsabile manutenzione', 'Amministratore'].includes(role)) ?? false;
  const canArchive = profile?.ruoli.includes('Amministratore') ?? false;

  useEffect(() => {
    const controller = new AbortController();
    getAllLuoghi()
      .then((result) => {
        if (!controller.signal.aborted) setPlaces(result);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Caricamento luoghi non riuscito.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get('tipo')) as LuogoInput['tipo'];
    const parentValue = String(form.get('padreId') ?? '');
    const payload: LuogoInput = {
      nome: String(form.get('nome') ?? ''),
      tipo: type,
      via: String(form.get('via') ?? ''),
      citta: String(form.get('citta') ?? ''),
      cap: String(form.get('cap') ?? ''),
      padreId: parentValue ? Number(parentValue) : null,
    };
    setSaving(true);
    setError('');
    try {
      if (selected) await updateLuogo(selected.id, payload);
      else await createLuogo(payload);
      setShowForm(false);
      setSelected(null);
      setNotice('Luogo salvato nel database.');
      setLoading(true);
      setAttempt((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Salvataggio luogo non riuscito.');
    } finally {
      setSaving(false);
    }
  };

  const archive = async (place: LuogoApi) => {
    if (!window.confirm(`Archiviare "${place.nome}"? Le voci figlie e le segnalazioni associate devono essere prima archiviate.`)) return;
    setSaving(true);
    try {
      await archiveLuogo(place.id);
      setNotice('Luogo archiviato.');
      setLoading(true);
      setAttempt((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Archiviazione luogo non riuscita.');
    } finally {
      setSaving(false);
    }
  };

  const activePlaces = places.filter((place) => !place.archivedAt);
  const parentCandidates = activePlaces.filter((place) =>
    place.id !== selected?.id && place.tipo !== 'impianto',
  );
  const openNew = () => {
    setSelected(null);
    setShowForm(true);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h2 className="mb-1">Luoghi e impianti</h2><p className="text-muted mb-0">Gerarchia dei luoghi letta dal database.</p></div>
        {canEdit && <Button onClick={openNew}>Nuovo luogo</Button>}
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert>}
      <Card>
        <Card.Body>
          {loading ? <div className="text-center p-4"><Spinner animation="border" /></div> : (
            <Table responsive striped hover>
              <thead><tr><th>Nome</th><th>Tipo</th><th>Luogo padre</th><th>Indirizzo</th><th>Stato</th><th>Azioni</th></tr></thead>
              <tbody>
                {places.map((place) => (
                  <tr key={place.id} className={place.archivedAt ? 'text-muted' : ''}>
                    <td>{place.padreId ? '↳ ' : ''}{place.nome}</td>
                    <td><Badge bg="info">{place.tipo}</Badge></td>
                    <td>{place.padre?.nome ?? '—'}</td>
                    <td>{[place.via, place.citta, place.cap].filter(Boolean).join(', ') || '—'}</td>
                    <td>{place.archivedAt ? 'Archiviato' : 'Attivo'}</td>
                    <td className="d-flex gap-2">
                      {canEdit && !place.archivedAt && <Button size="sm" variant="outline-primary" onClick={() => { setSelected(place); setShowForm(true); }}>Modifica</Button>}
                      {canArchive && !place.archivedAt && <Button size="sm" variant="outline-danger" disabled={saving} onClick={() => void archive(place)}>Archivia</Button>}
                    </td>
                  </tr>
                ))}
                {!places.length && <tr><td colSpan={6}>Nessun luogo presente.</td></tr>}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      <Modal show={showForm} onHide={() => !saving && setShowForm(false)} centered>
        <Form onSubmit={save}>
          <Modal.Header closeButton><Modal.Title>{selected ? 'Modifica luogo' : 'Nuovo luogo'}</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Nome</Form.Label><Form.Control name="nome" required minLength={2} maxLength={150} defaultValue={selected?.nome} /></Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Select name="tipo" defaultValue={selected?.tipo ?? 'edificio'}>
                <option value="edificio">Edificio</option><option value="area">Area / piano / stanza</option><option value="impianto">Impianto</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Luogo padre (obbligatorio per area e impianto)</Form.Label>
              <Form.Select name="padreId" defaultValue={selected?.padreId ?? ''}>
                <option value="">Nessuno / edificio principale</option>
                {parentCandidates.map((place) => <option key={place.id} value={place.id}>{place.nome} ({place.tipo})</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3"><Form.Label>Via</Form.Label><Form.Control name="via" maxLength={150} defaultValue={selected?.via ?? ''} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Città</Form.Label><Form.Control name="citta" maxLength={100} defaultValue={selected?.citta ?? ''} /></Form.Group>
            <Form.Group><Form.Label>CAP</Form.Label><Form.Control name="cap" maxLength={10} defaultValue={selected?.cap ?? ''} /></Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>Annulla</Button>
            <Button type="submit" disabled={saving}>{saving ? <Spinner size="sm" /> : 'Salva'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
