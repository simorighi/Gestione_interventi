import { Container, Navbar, Nav } from 'react-bootstrap';
import { Sidebar } from './Sidebar';
import type { AuthProfile } from '../contexts/AuthContext';
import { Button } from 'react-bootstrap';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  profile: AuthProfile;
  onSignOut: () => void;
}

export function Layout({ children, currentPage, onPageChange, profile, onSignOut }: LayoutProps) {
  return (
    <div className="d-flex">
      <Sidebar  currentPage={currentPage} onPageChange={onPageChange} />
      <div className="flex-grow-1">
        <Navbar bg="light" className="px-4">
          <Navbar.Brand>Smart Maintenance</Navbar.Brand>
          <Nav className="ms-auto align-items-center gap-2">
            <Nav.Item>{profile.nome} {profile.cognome} · {profile.ruoli.join(', ')}</Nav.Item>
            <Button size="sm" variant="outline-secondary" onClick={onSignOut}>Esci</Button>
          </Nav>
        </Navbar>
        <Container fluid className="p-4">
          {children}
        </Container>
      </div>
    </div>
  );
}