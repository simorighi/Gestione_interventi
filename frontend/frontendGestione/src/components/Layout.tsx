import { Container, Navbar, Nav } from 'react-bootstrap';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  return (
    <div className="d-flex">
      <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
      <div className="flex-grow-1">
        <Navbar bg="light" className="px-4">
          <Navbar.Brand>Smart Maintenance</Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link>Responsabile Manutenzione</Nav.Link>
          </Nav>
        </Navbar>
        <Container fluid className="p-4">
          {children}
        </Container>
      </div>
    </div>
  );
}