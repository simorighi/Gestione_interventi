import { Nav } from 'react-bootstrap';
import { Database, Wrench, UserRound, House, Settings } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Database },
    { id: 'segnalazioni', label: 'Segnalazioni', icon: Wrench },
    { id: 'tecnici', label: 'Tecnici', icon: UserRound },
    { id: 'edifici', label: 'Edifici', icon: House },
    { id: 'impostazioni', label: 'Impostazioni', icon: Settings }
  ];

  return (
    <div className="sidebar bg-dark text-white p-3" style={{ minHeight: '100vh', width: '250px' }}>
      <h4 className="text-center mb-4">NordFacility</h4>
      <Nav className="flex-column">
        {menuItems.map(item => (
          <Nav.Link
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`text-white mb-2 ${currentPage === item.id ? 'bg-primary' : ''}`}
            style={{ borderRadius: '5px' }}
          >
            {/* {item.icon} */} {item.label}
          </Nav.Link>
        ))}
      </Nav>
    </div>
  );
}