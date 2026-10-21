import { useState } from 'react';
import { Nav, Offcanvas, Button } from 'react-bootstrap';
import { Database, Wrench, UserRound, House, Settings, Menu } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [show, setShow] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Database },
    { id: 'segnalazioni', label: 'Segnalazioni', icon: Wrench },
    { id: 'tecnici', label: 'Tecnici', icon: UserRound },
    { id: 'edifici', label: 'Edifici', icon: House },
    { id: 'impostazioni', label: 'Impostazioni', icon: Settings }
  ];

  const handlePageChange = (page: string) => {
    onPageChange(page);
    setShow(false); // Chiude il menu mobile dopo il click
  };

  return (
    <>
      {/* Pulsante Hamburger - visibile solo su mobile */}
      <Button
        variant="dark"
        className="d-md-none position-fixed end-0 top-0 m-2"
        onClick={() => setShow(true)}
        style={{ zIndex: 1050, maxWidth: '40px', maxHeight: '40px'}}
      >
        <Menu size={20} />
      </Button>

      {/* Sidebar Desktop - visibile da md in su */}
      <div className="d-none d-md-block bg-dark text-white p-3" style={{ minWidth: '200px', minHeight: '100vh' }}>
        <h4 className="text-center mb-4">NordFacility</h4>
        <Nav className="flex-column">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <Nav.Link
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`text-white mb-2 d-flex align-items-center gap-2 ${currentPage === item.id ? 'bg-primary' : ''}`}
                style={{ borderRadius: '5px' }}
              >
                <Icon size={20} /> {item.label}
              </Nav.Link>
            );
          })}
        </Nav>
      </div>

      {/* Sidebar Mobile - Offcanvas */}
      <Offcanvas show={show} onHide={() => setShow(false)} placement="start" className="d-md-none" style={{ maxWidth: '250px' }}>
        <Offcanvas.Header closeButton className="bg-dark text-white">
          <Offcanvas.Title>NordFacility</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-3 bg-dark">
          <Nav className="flex-column">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <Nav.Link
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`text-white mb-2 d-flex align-items-center gap-2 ${currentPage === item.id ? 'bg-primary' : ''}`}
                  style={{ borderRadius: '5px' }}
                >
                  <Icon size={20} /> {item.label}
                </Nav.Link>
              );
            })}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}