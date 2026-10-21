import { useState } from 'react';
import { Card, Tabs, Tab, Table, Badge, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { categorie, utenti, type Categoria } from '../data/mockData';
import { Info, FolderDown, FolderUp, Trash2 } from 'lucide-react';

export function Impostazioni() {
  const [activeTab, setActiveTab] = useState('categorie');

  return (
    <div>
      <h2 className="mb-4">Impostazioni di Sistema</h2>
      <Alert variant="info" className="d-flex align-items-center gap-2">
        <Info size={20} className="flex-shrink-0" />
        <div>
          <strong>Pannello Amministratore:</strong> Le modifiche apportate qui influenzano il comportamento dell'intera applicazione senza necessità di interventi sul codice sorgente.
        </div>
      </Alert>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'categorie')} className="mb-4">
        <Tab eventKey="categorie" title="📋 Categorie Intervento">
          <GestioneCategorie />
        </Tab>
        <Tab eventKey="utenti" title="👥 Gestione Utenti">
          <GestioneUtenti />
        </Tab>
        <Tab eventKey="workflow" title=" Workflow Stati">
          <GestioneWorkflow />
        </Tab>
        <Tab eventKey="sistema" title="⚙️ Configurazione Sistema">
          <ConfigurazioneSistema />
        </Tab>
      </Tabs>
    </div>
  );
}

function GestioneCategorie() {
  const [listaCategorie, setListaCategorie] = useState<Categoria[]>(categorie);

  const toggleAttiva = (id: number) => {
    setListaCategorie(prev => 
      prev.map(c => c.id === id ? { ...c, attiva: !c.attiva } : c)
    );
  };

  return (
    <Card>
      <Card.Header className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
        <h5 className="mb-0">Categorie di Intervento</h5>
        <Button variant="primary" size="sm">+ Aggiungi Categoria</Button>
      </Card.Header>
      <Card.Body>
        <div className="table-responsive">
          <Table striped hover className="mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Descrizione</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {listaCategorie.map(cat => (
                <tr key={cat.id} className={!cat.attiva ? 'text-muted' : ''}>
                  <td>{cat.id}</td>
                  <td><strong>{cat.nome}</strong></td>
                  <td>{cat.descrizione}</td>
                  <td>
                    <Badge bg={cat.attiva ? 'success' : 'secondary'}>
                      {cat.attiva ? 'Attiva' : 'Disattivata'}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button 
                        variant={cat.attiva ? 'outline-warning' : 'outline-success'} 
                        size="sm"
                        onClick={() => toggleAttiva(cat.id)}
                      >
                        {cat.attiva ? 'Disattiva' : 'Attiva'}
                      </Button>
                      <Button variant="outline-primary" size="sm">Modifica</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
}

function GestioneUtenti() {
  const getRuoloBadge = (ruolo: string) => {
    const variants: Record<string, string> = {
      amministratore: 'danger',
      responsabile: 'primary',
      tecnico: 'info',
      segnalatore: 'secondary'
    };
    return <Badge bg={variants[ruolo]}>{ruolo.toUpperCase()}</Badge>;
  };

  return (
    <Card>
      <Card.Header className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
        <h5 className="mb-0">Utenti e Ruoli</h5>
        <Button variant="primary" size="sm">+ Nuovo Utente</Button>
      </Card.Header>
      <Card.Body>
        <div className="table-responsive">
          <Table striped hover className="mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Nome</th>
                <th>Ruolo</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {utenti.map(utente => (
                <tr key={utente.id}>
                  <td>{utente.id}</td>
                  <td><code>{utente.username}</code></td>
                  <td>{utente.nome}</td>
                  <td>{getRuoloBadge(utente.ruolo)}</td>
                  <td>
                    <Badge bg={utente.attivo ? 'success' : 'danger'}>
                      {utente.attivo ? 'Attivo' : 'Disattivato'}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button variant="outline-primary" size="sm">Modifica</Button>
                      <Button variant="outline-danger" size="sm">Elimina</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
}

function GestioneWorkflow() {
  const statiWorkflow = [
    { id: 1, nome: 'Segnalato', colore: 'secondary', descrizione: 'Segnalazione appena creata' },
    { id: 2, nome: 'Preso in carico', colore: 'primary', descrizione: 'Assegnato a un tecnico' },
    { id: 3, nome: 'In lavorazione', colore: 'info', descrizione: 'Tecnico al lavoro' },
    { id: 4, nome: 'Sospeso', colore: 'warning', descrizione: 'In attesa di ricambi o informazioni' },
    { id: 5, nome: 'Risolto', colore: 'success', descrizione: 'Intervento completato' }
  ];

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Stati del Workflow</h5>
      </Card.Header>
      <Card.Body>
        <Alert variant="warning" className="d-flex align-items-center gap-2">
          <span className="fs-5">⚠️</span>
          <div>
            <strong>Attenzione:</strong> La modifica degli stati del workflow può influenzare le segnalazioni esistenti. Procedere con cautela.
          </div>
        </Alert>
        <div className="table-responsive">
          <Table striped hover className="mb-3">
            <thead>
              <tr>
                <th>Ordine</th>
                <th>Nome Stato</th>
                <th>Colore</th>
                <th>Descrizione</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {statiWorkflow.map((stato, idx) => (
                <tr key={stato.id}>
                  <td>{idx + 1}</td>
                  <td><Badge bg={stato.colore}>{stato.nome}</Badge></td>
                  <td><code>{stato.colore}</code></td>
                  <td>{stato.descrizione}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button variant="outline-primary" size="sm">Modifica</Button>
                      <Button variant="outline-danger" size="sm">Elimina</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <Button variant="primary" className="w-100">+ Aggiungi Nuovo Stato</Button>
      </Card.Body>
    </Card>
  );
}

function ConfigurazioneSistema() {
  return (
    <Row className="g-4">
      <Col xs={12} md={6}>
        <Card className="h-100">
          <Card.Header><h5 className="mb-0">Configurazione Email</h5></Card.Header>
          <Card.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Server SMTP</Form.Label>
                <Form.Control defaultValue="smtp.nordfacility.it" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Porta</Form.Label>
                <Form.Control defaultValue="587" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Utente</Form.Label>
                <Form.Control defaultValue="noreply@nordfacility.it" />
              </Form.Group>
              <Button variant="primary" className="w-100">Salva Configurazione</Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card className="h-100">
          <Card.Header><h5 className="mb-0">Configurazione AI</h5></Card.Header>
          <Card.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Check 
                  type="switch"
                  id="ai-enabled"
                  label="Abilita suggerimenti AI"
                  defaultChecked
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Modello AI</Form.Label>
                <Form.Select defaultValue="gpt-4">
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5">GPT-3.5</option>
                  <option value="custom">Modello Custom</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Soglia confidenza minima (%)</Form.Label>
                <Form.Control type="number" defaultValue="75" />
              </Form.Group>
              <Button variant="primary" className="w-100">Salva Configurazione</Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
      <Col xs={12}>
        <Card>
          <Card.Header><h5 className="mb-0">Backup e Manutenzione</h5></Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col xs={12} sm={4}>
                <Button variant="outline-primary" className="w-100 d-flex align-items-center justify-content-center gap-2">
                  <FolderDown size={18} /> Esporta Database
                </Button>
              </Col>
              <Col xs={12} sm={4}>
                <Button variant="outline-warning" className="w-100 d-flex align-items-center justify-content-center gap-2">
                  <FolderUp size={18} /> Importa Database
                </Button>
              </Col>
              <Col xs={12} sm={4}>
                <Button variant="outline-danger" className="w-100 d-flex align-items-center justify-content-center gap-2">
                  <Trash2 size={18} /> Pulizia Log
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}