import { Button, Container, Navbar, Nav } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { utente, logout } = useAuth();
  return (
    <div className="d-flex">
      <Sidebar  currentPage={currentPage} onPageChange={onPageChange} />
      <div className="flex-grow-1">
        <Navbar bg="light" className="px-4">
          <Navbar.Brand>Smart Maintenance</Navbar.Brand>
          <Nav className="ms-auto align-items-center gap-3">
            {utente && (
              <Navbar.Text>
                {utente.nome} {utente.cognome} · <small className="text-muted">{utente.ruoli.join(', ')}</small>
              </Navbar.Text>
            )}
            <Button variant="outline-secondary" size="sm" onClick={logout}>
              Esci
            </Button>
          </Nav>
        </Navbar>
        <Container fluid className="p-4">
          {children}
        </Container>
      </div>
    </div>
  );
}