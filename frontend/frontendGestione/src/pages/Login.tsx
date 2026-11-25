import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';

export function Login() {
  const { login, avviso } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');
  const [invio, setInvio] = useState(false);

  const invia = async (e: FormEvent) => {
    e.preventDefault();
    setErrore('');
    setInvio(true);
    try {
      await login(email, password);
    } catch (err) {
      setErrore(err instanceof ApiError ? err.message : 'Accesso non riuscito');
    } finally {
      setInvio(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center bg-light" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '100%', maxWidth: 380 }} className="shadow-sm">
        <Card.Body className="p-4">
          <h1 className="h4 mb-1">Smart Maintenance</h1>
          <p className="text-muted mb-4">NordFacility — accedi per continuare</p>

          {avviso && !errore && <Alert variant="warning">{avviso}</Alert>}
          {errore && <Alert variant="danger">{errore}</Alert>}

          <Form onSubmit={invia}>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            <Button type="submit" className="w-100" disabled={invio}>
              {invio ? <Spinner size="sm" /> : 'Accedi'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
