import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Alert, Badge, Button, Card, Form, Modal, Spinner, Tab, Table, Tabs } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import {
  addTransizione,
  archiveCategoria,
  archiveStato,
  archiveTransizione,
  archiveUtente,
  createCategoria,
  createStato,
  createUtente,
  getAllCategorie,
  getTransizioni,
  getUtenti,
  getWorkflow,
  updateUtente,
  updateCategoria,
  updateStato,
  type CategoriaApi,
  type StatoApi,
  type TransizioneApi,
  type UtenteApi,
} from '../services/api';

type SettingsTab = 'categorie' | 'utenti' | 'workflow';
const roles = ['Segnalatore', 'Tecnico', 'Responsabile manutenzione', 'Amministratore'];

export function Impostazioni() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<SettingsTab>('categorie');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const showError = useCallback((message: string) => setError(message), []);

  if (!profile?.ruoli.includes('Amministratore')) {
    return (
      <Alert variant="warning">
        La gestione di categorie, utenti e workflow è riservata agli amministratori.
      </Alert>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Impostazioni di sistema</h2>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert>}
      <Tabs activeKey={tab} onSelect={(key) => setTab((key as SettingsTab) || 'categorie')} className="mb-4">
        <Tab eventKey="categorie" title="Categorie">
          <CategorySettings
            busy={busy}
            setBusy={setBusy}
            setError={showError}
            setNotice={setNotice}
          />
        </Tab>
        <Tab eventKey="utenti" title="Utenti e tecnici">
          <UserSettings
            busy={busy}
            setBusy={setBusy}
            setError={showError}
            setNotice={setNotice}
          />
        </Tab>
        <Tab eventKey="workflow" title="Workflow">
          <WorkflowSettings
            busy={busy}
            setBusy={setBusy}
            setError={showError}
            setNotice={setNotice}
          />
        </Tab>
      </Tabs>
      <Alert variant="info" className="mb-0">
        SMTP, integrazione AI e backup non sono collegati a servizi o configurazioni
        server-side in questo progetto e non vengono salvati dall’interfaccia.
      </Alert>
    </div>
  );
}

interface SectionProps {
  busy: boolean;
  setBusy: (busy: boolean) => void;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
}

function CategorySettings({ busy, setBusy, setError, setNotice }: SectionProps) {
  const [categories, setCategories] = useState<CategoriaApi[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<CategoriaApi | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getAllCategorie()
      .then((result) => {
        if (!controller.signal.aborted) setCategories(result);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Caricamento categorie non riuscito.');
      });
    return () => controller.abort();
  }, [attempt, setError]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const payload = {
        nome: String(form.get('nome') ?? ''),
        descrizione: String(form.get('descrizione') ?? ''),
      };
      if (selected) await updateCategoria(selected.id, { ...payload, attiva: selected.attiva });
      else await createCategoria(payload);
      setShowForm(false);
      setSelected(null);
      setNotice('Categoria salvata.');
      setAttempt((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Salvataggio categoria non riuscito.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (category: CategoriaApi) => {
    setBusy(true);
    try {
      if (category.attiva) await archiveCategoria(category.id);
      else await updateCategoria(category.id, {
        nome: category.nome,
        descrizione: category.descrizione,
        attiva: true,
      });
      setNotice(category.attiva ? 'Categoria disattivata.' : 'Categoria riattivata.');
      setAttempt((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Aggiornamento categoria non riuscito.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <strong>Categorie di intervento</strong>
          <Button size="sm" onClick={() => { setSelected(null); setShowForm(true); }}>Aggiungi categoria</Button>
        </Card.Header>
        <Card.Body>
          <Table responsive striped hover>
            <thead><tr><th>Nome</th><th>Descrizione</th><th>Stato</th><th>Azioni</th></tr></thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.nome}</td><td>{category.descrizione ?? '—'}</td>
                  <td><Badge bg={category.attiva ? 'success' : 'secondary'}>{category.attiva ? 'Attiva' : 'Disattivata'}</Badge></td>
                  <td className="d-flex gap-2">
                    <Button size="sm" variant="outline-primary" onClick={() => { setSelected(category); setShowForm(true); }}>Modifica</Button>
                    <Button size="sm" variant={category.attiva ? 'outline-danger' : 'outline-success'} disabled={busy} onClick={() => void toggle(category)}>
                      {category.attiva ? 'Disattiva' : 'Riattiva'}
                    </Button>
                  </td>
                </tr>
              ))}
              {!categories.length && <tr><td colSpan={4}>Nessuna categoria disponibile.</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form key={selected?.id ?? 'new-category'} onSubmit={save}>
          <Modal.Header closeButton><Modal.Title>{selected ? 'Modifica categoria' : 'Nuova categoria'}</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Nome</Form.Label><Form.Control name="nome" required minLength={2} maxLength={100} defaultValue={selected?.nome} /></Form.Group>
            <Form.Group><Form.Label>Descrizione</Form.Label><Form.Control as="textarea" name="descrizione" maxLength={1000} defaultValue={selected?.descrizione ?? ''} /></Form.Group>
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setShowForm(false)}>Annulla</Button><Button type="submit" disabled={busy}>{busy ? <Spinner size="sm" /> : 'Salva'}</Button></Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

function UserSettings({ busy, setBusy, setError, setNotice }: SectionProps) {
  const [users, setUsers] = useState<UtenteApi[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<UtenteApi | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getUtenti()
      .then((result) => {
        if (!controller.signal.aborted) setUsers(result);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Caricamento utenti non riuscito.');
      });
    return () => controller.abort();
  }, [attempt, setError]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ruolo = String(form.get('ruolo') ?? '');
    setBusy(true);
    setError('');
    try {
      const input = {
        nome: String(form.get('nome') ?? ''),
        cognome: String(form.get('cognome') ?? ''),
        email: String(form.get('email') ?? ''),
        ruolo,
        ...(ruolo === 'Tecnico' ? {
          specializzazione: String(form.get('specializzazione') ?? ''),
          tipoTecnico: String(form.get('tipoTecnico') ?? 'interno') as 'interno' | 'esterno',
          azienda: String(form.get('azienda') ?? ''),
        } : {}),
      };
      if (selected) await updateUtente(selected.id, input);
      else await createUtente({
        ...input,
        password: String(form.get('password') ?? ''),
      });
      setShowForm(false);
      setSelected(null);
      setNotice(selected ? 'Utente aggiornato.' : 'Utente creato in Supabase Auth e collegato al database.');
      setAttempt((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Creazione utente non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async (user: UtenteApi) => {
    if (!window.confirm(`Disattivare ${user.nome} ${user.cognome}?`)) return;
    setBusy(true);
    try {
      await archiveUtente(user.id);
      setNotice('Utente disattivato.');
      setAttempt((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Disattivazione non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <strong>Utenti e tecnici</strong>
          <Button size="sm" onClick={() => { setSelected(null); setShowForm(true); }}>Crea utente</Button>
        </Card.Header>
        <Card.Body>
          <Table responsive striped hover>
            <thead><tr><th>Nome</th><th>Email</th><th>Ruoli</th><th>Stato</th><th>Azione</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.nome} {user.cognome}</td><td>{user.email}</td>
                  <td>{user.ruoli.map(({ ruolo }) => ruolo.nome).join(', ')}</td>
                  <td><Badge bg={user.attivo ? 'success' : 'secondary'}>{user.attivo ? 'Attivo' : 'Disattivato'}</Badge></td>
                  <td className="d-flex gap-2">
                    <Button size="sm" variant="outline-primary" onClick={() => { setSelected(user); setShowForm(true); }}>Modifica</Button>
                    {user.attivo && <Button size="sm" variant="outline-danger" disabled={busy} onClick={() => void deactivate(user)}>Disattiva</Button>}
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={5}>Nessun utente disponibile.</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form key={selected?.id ?? 'new-user'} onSubmit={save}>
          <Modal.Header closeButton><Modal.Title>{selected ? 'Modifica utente' : 'Nuovo utente'}</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Nome</Form.Label><Form.Control name="nome" required maxLength={100} defaultValue={selected?.nome} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Cognome</Form.Label><Form.Control name="cognome" required maxLength={100} defaultValue={selected?.cognome} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" name="email" required maxLength={255} defaultValue={selected?.email} disabled={Boolean(selected)} /></Form.Group>
            {!selected && <Form.Group className="mb-3"><Form.Label>Password iniziale</Form.Label><Form.Control type="password" name="password" required minLength={12} autoComplete="new-password" /></Form.Group>}
            <Form.Group className="mb-3"><Form.Label>Ruolo</Form.Label><Form.Select name="ruolo" required defaultValue={selected?.ruoli[0]?.ruolo.nome ?? 'Segnalatore'}>{roles.map((role) => <option key={role}>{role}</option>)}</Form.Select></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Specializzazione (per tecnici)</Form.Label><Form.Control name="specializzazione" defaultValue={selected?.tecnico?.specializzazione ?? ''} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Tipo tecnico</Form.Label><Form.Select name="tipoTecnico" defaultValue={selected?.tecnico?.tipo ?? 'interno'}><option value="interno">Interno</option><option value="esterno">Esterno</option></Form.Select></Form.Group>
            <Form.Group><Form.Label>Azienda (per tecnici)</Form.Label><Form.Control name="azienda" defaultValue={selected?.tecnico?.azienda ?? ''} /></Form.Group>
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setShowForm(false)}>Annulla</Button><Button type="submit" disabled={busy}>{busy ? <Spinner size="sm" /> : selected ? 'Salva modifiche' : 'Crea account'}</Button></Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

function WorkflowSettings({ busy, setBusy, setError, setNotice }: SectionProps) {
  const [states, setStates] = useState<StatoApi[]>([]);
  const [transitions, setTransitions] = useState<TransizioneApi[]>([]);
  const [showState, setShowState] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const load = useCallback(async () => {
    try {
      const [nextStates, nextTransitions] = await Promise.all([getWorkflow(), getTransizioni()]);
      setStates(nextStates);
      setTransitions(nextTransitions);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Caricamento workflow non riuscito.');
    }
  }, [setError]);

  useEffect(() => {
    async function loadWorkflow() {
      await load();
    }
    void loadWorkflow();
  }, [load, attempt]);

  const saveState = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      nome: String(form.get('nome') ?? ''),
      ordine: Number(form.get('ordine')),
      isFinale: form.get('isFinale') === 'on',
    };
    setBusy(true);
    try {
      await createStato(input);
      setShowState(false);
      setNotice('Stato aggiunto al workflow.');
      setAttempt((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Creazione stato non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  const saveTransition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await addTransizione(Number(form.get('daStatoId')), Number(form.get('aStatoId')));
      setShowTransition(false);
      setNotice('Transizione aggiunta.');
      setAttempt((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Creazione transizione non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  const removeTransition = async (transition: TransizioneApi) => {
    setBusy(true);
    try {
      await archiveTransizione(transition.id);
      setNotice('Transizione rimossa.');
      setAttempt((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Rimozione transizione non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  const editState = async (state: StatoApi) => {
    const name = window.prompt('Nome dello stato', state.nome);
    if (!name?.trim()) return;
    const orderValue = window.prompt('Ordine', String(state.ordine));
    if (!orderValue || !Number.isInteger(Number(orderValue))) return;
    setBusy(true);
    try {
      await updateStato(state.id, { nome: name.trim(), ordine: Number(orderValue), isFinale: state.isFinale });
      setNotice('Stato aggiornato.');
      setAttempt((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Modifica stato non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  const removeState = async (state: StatoApi) => {
    if (!window.confirm(`Archiviare lo stato "${state.nome}"? Rimuovi prima le transizioni associate.`)) return;
    setBusy(true);
    try {
      await archiveStato(state.id);
      setNotice('Stato archiviato.');
      setAttempt((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Archiviazione stato non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <strong>Stati del workflow</strong>
          <Button size="sm" onClick={() => setShowState(true)}>Aggiungi stato</Button>
        </Card.Header>
        <Card.Body>
          <Alert variant="warning">
            Le transizioni configurate vengono applicate dal backend. Non archiviare
            lo stato iniziale né stati ancora usati da segnalazioni.
          </Alert>
          <Table responsive striped hover>
            <thead><tr><th>Ordine</th><th>Stato</th><th>Finale</th><th>Azioni</th></tr></thead>
            <tbody>
              {states.map((state) => (
                <tr key={state.id}>
                  <td>{state.ordine}</td><td>{state.nome}</td><td>{state.isFinale ? 'Sì' : 'No'}</td>
                  <td className="d-flex gap-2">
                    <Button size="sm" variant="outline-primary" disabled={busy} onClick={() => void editState(state)}>Modifica</Button>
                    <Button size="sm" variant="outline-danger" disabled={busy || state.nome === 'Segnalato'} onClick={() => void removeState(state)}>Archivia</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <strong>Transizioni consentite</strong>
          <Button size="sm" onClick={() => setShowTransition(true)}>Aggiungi transizione</Button>
        </Card.Header>
        <Card.Body>
          <Table responsive striped hover>
            <thead><tr><th>Da</th><th>A</th><th>Azioni</th></tr></thead>
            <tbody>
              {transitions.map((transition) => (
                <tr key={transition.id}>
                  <td>{transition.daStato.nome}</td><td>{transition.aStato.nome}</td>
                  <td><Button size="sm" variant="outline-danger" disabled={busy} onClick={() => void removeTransition(transition)}>Rimuovi</Button></td>
                </tr>
              ))}
              {!transitions.length && <tr><td colSpan={3}>Nessuna transizione configurata.</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      <Modal show={showState} onHide={() => setShowState(false)} centered>
        <Form onSubmit={saveState}>
          <Modal.Header closeButton><Modal.Title>Nuovo stato</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Nome</Form.Label><Form.Control name="nome" required minLength={2} maxLength={50} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Ordine</Form.Label><Form.Control name="ordine" type="number" min={1} required /></Form.Group>
            <Form.Check name="isFinale" label="Stato finale" />
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setShowState(false)}>Annulla</Button><Button type="submit" disabled={busy}>Salva</Button></Modal.Footer>
        </Form>
      </Modal>
      <Modal show={showTransition} onHide={() => setShowTransition(false)} centered>
        <Form onSubmit={saveTransition}>
          <Modal.Header closeButton><Modal.Title>Nuova transizione</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Da stato</Form.Label><Form.Select name="daStatoId" required>{states.map((state) => <option key={state.id} value={state.id}>{state.nome}</option>)}</Form.Select></Form.Group>
            <Form.Group><Form.Label>A stato</Form.Label><Form.Select name="aStatoId" required>{states.map((state) => <option key={state.id} value={state.id}>{state.nome}</option>)}</Form.Select></Form.Group>
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setShowTransition(false)}>Annulla</Button><Button type="submit" disabled={busy || states.length < 2}>Salva transizione</Button></Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
