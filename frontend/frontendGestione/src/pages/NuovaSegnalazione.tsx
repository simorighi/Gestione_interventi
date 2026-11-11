import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import {
  creaSegnalazione,
  getCategorie,
  getLuoghi,
  getPriorita,
  type CategoriaApi,
  type LuogoApi,
  type PrioritaApi,
} from '../services/api';

interface NuovaSegnalazioneProps {
  onAnnulla: () => void;
}

export function NuovaSegnalazione({ onAnnulla }: NuovaSegnalazioneProps) {
  const [places, setPlaces] = useState<LuogoApi[]>([]);
  const [categories, setCategories] = useState<CategoriaApi[]>([]);
  const [priorities, setPriorities] = useState<PrioritaApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getLuoghi(controller.signal),
      getCategorie(controller.signal),
      getPriorita(controller.signal),
    ])
      .then(([nextPlaces, nextCategories, nextPriorities]) => {
        setPlaces(nextPlaces);
        setCategories(nextCategories);
        setPriorities(nextPriorities);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Errore caricamento dati.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await creaSegnalazione({
        titolo: String(form.get('titolo') ?? ''),
        descrizione: String(form.get('descrizione') ?? ''),
        luogoId: Number(form.get('luogoId')),
        categoriaId: Number(form.get('categoriaId')),
        prioritaPropostaId: Number(form.get('prioritaPropostaId')),
      });
      onAnnulla();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Salvataggio non riuscito.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Nuova Segnalazione</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <div className="text-center p-4"><Spinner animation="border" /></div>
      ) : (
        <Card>
          <Card.Body>
            <Form onSubmit={submit}>
              <Row className="g-3 mb-3">
                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label>Luogo</Form.Label>
                    <Form.Select name="luogoId" required defaultValue="">
                      <option value="" disabled>Seleziona luogo</option>
                      {places.map((place) => (
                        <option key={place.id} value={place.id}>
                          {place.padreId ? '↳ ' : ''}{place.nome} ({place.tipo})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label>Categoria</Form.Label>
                    <Form.Select name="categoriaId" required defaultValue="">
                      <option value="" disabled>Seleziona categoria</option>
                      {categories.map((category) => <option key={category.id} value={category.id}>{category.nome}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Titolo</Form.Label>
                <Form.Control name="titolo" required minLength={3} maxLength={200} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Descrizione</Form.Label>
                <Form.Control
                  as="textarea"
                  name="descrizione"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={5}
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label>Priorità proposta</Form.Label>
                <Form.Select name="prioritaPropostaId" required defaultValue="">
                  <option value="" disabled>Seleziona priorità</option>
                  {priorities.map((priority) => <option key={priority.id} value={priority.id}>{priority.nome}</option>)}
                </Form.Select>
              </Form.Group>
              <div className="d-flex gap-2">
                <Button type="submit" disabled={saving || !places.length || !categories.length || !priorities.length}>
                  {saving && <Spinner size="sm" className="me-2" />}
                  Crea segnalazione
                </Button>
                <Button type="button" variant="secondary" onClick={onAnnulla} disabled={saving}>Annulla</Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
