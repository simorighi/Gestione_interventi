import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { api, ApiError, type Categoria, type Luogo, type Priorita, type SegnalazioneRiga } from '../services/api';

interface NuovaSegnalazioneProps {
  onAnnulla: () => void;
  onCreata: (id: number) => void;
}

interface Campi {
  titolo: string;
  descrizione: string;
  luogoId: string;
  categoriaId: string;
  prioritaPropostaId: string;
}

// Le regole qui sotto sono le stesse dello schema del backend
// (web/src/server/validation/segnalazioni.ts), che resta l'unico controllo che conta:
// qui servono solo a dare l'errore subito, senza aspettare il server.
export function NuovaSegnalazione({ onAnnulla, onCreata }: NuovaSegnalazioneProps) {
  const [luoghi, setLuoghi] = useState<Luogo[]>([]);
  const [categorie, setCategorie] = useState<Categoria[]>([]);
  const [priorita, setPriorita] = useState<Priorita[]>([]);
  const [errore, setErrore] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Campi>();

  useEffect(() => {
    Promise.all([api<Luogo[]>('/luoghi'), api<Categoria[]>('/categorie'), api<Priorita[]>('/priorita')])
      .then(([l, c, p]) => {
        setLuoghi(l);
        setCategorie(c);
        setPriorita(p);
      })
      .catch((e) => setErrore(e instanceof ApiError ? e.message : 'Impossibile caricare luoghi e categorie'));
  }, []);

  const invia = async (c: Campi) => {
    setErrore('');
    try {
      const creata = await api<SegnalazioneRiga>('/segnalazioni', {
        method: 'POST',
        body: {
          titolo: c.titolo,
          descrizione: c.descrizione,
          luogoId: Number(c.luogoId),
          categoriaId: Number(c.categoriaId),
          prioritaPropostaId: Number(c.prioritaPropostaId),
        },
      });
      onCreata(creata.id);
    } catch (e) {
      setErrore(e instanceof ApiError ? e.message : 'Invio non riuscito');
    }
  };

  // Nome del luogo con il percorso (es. "Sede Centrale › Piano 1 › Sala A").
  const perId = new Map(luoghi.map((l) => [l.id, l]));
  const percorso = (l: Luogo): string => {
    const padre = l.padreId ? perId.get(l.padreId) : undefined;
    return padre ? `${percorso(padre)} › ${l.nome}` : l.nome;
  };
  const opzioniLuogo = luoghi.map((l) => ({ id: l.id, nome: percorso(l) })).sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div>
      <h2 className="mb-4">Nuova segnalazione</h2>
      {errore && <Alert variant="danger">{errore}</Alert>}
      <Card>
        <Card.Body>
          <Form noValidate onSubmit={handleSubmit(invia)}>
            <Form.Group className="mb-3" controlId="titolo">
              <Form.Label>Titolo</Form.Label>
              <Form.Control
                isInvalid={!!errors.titolo}
                placeholder="Es. Luci sala riunioni non funzionanti"
                {...register('titolo', {
                  validate: (v) => (v.trim().length >= 3 && v.trim().length <= 200) || 'Da 3 a 200 caratteri',
                })}
              />
              <Form.Control.Feedback type="invalid">{errors.titolo?.message}</Form.Control.Feedback>
            </Form.Group>

            <Row className="mb-3 g-3">
              <Col md={6}>
                <Form.Group controlId="luogo">
                  <Form.Label>Luogo</Form.Label>
                  <Form.Select isInvalid={!!errors.luogoId} {...register('luogoId', { required: 'Scegli il luogo' })}>
                    <option value="">Seleziona...</option>
                    {opzioniLuogo.map((l) => (
                      <option key={l.id} value={l.id}>{l.nome}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.luogoId?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="categoria">
                  <Form.Label>Categoria</Form.Label>
                  <Form.Select isInvalid={!!errors.categoriaId} {...register('categoriaId', { required: 'Scegli la categoria' })}>
                    <option value="">Seleziona...</option>
                    {categorie.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.categoriaId?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="descrizione">
              <Form.Label>Descrizione del problema</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                isInvalid={!!errors.descrizione}
                placeholder="Descrivi il guasto: cosa non funziona, da quando, dove esattamente."
                {...register('descrizione', {
                  validate: (v) => (v.trim().length >= 10 && v.trim().length <= 5000) || 'Da 10 a 5000 caratteri',
                })}
              />
              <Form.Control.Feedback type="invalid">{errors.descrizione?.message}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4" controlId="priorita">
              <Form.Label>Priorità proposta</Form.Label>
              <Form.Select isInvalid={!!errors.prioritaPropostaId} {...register('prioritaPropostaId', { required: 'Scegli la priorità' })}>
                <option value="">Seleziona...</option>
                {priorita.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </Form.Select>
              <Form.Text muted>La priorità definitiva la decide il responsabile della manutenzione.</Form.Text>
              <Form.Control.Feedback type="invalid">{errors.prioritaPropostaId?.message}</Form.Control.Feedback>
            </Form.Group>

            <div className="d-flex flex-column flex-md-row gap-2">
              <Button type="submit" disabled={isSubmitting}>Invia segnalazione</Button>
              <Button variant="secondary" onClick={onAnnulla}>Annulla</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
