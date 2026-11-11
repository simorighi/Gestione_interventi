import { useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ListaSegnalazioni } from './pages/ListaSegnalazioni';
import { NuovaSegnalazione } from './pages/NuovaSegnalazione';
import { DettaglioSegnalazione } from './pages/DettaglioSegnalazione';
import { Tecnici } from './pages/Tecnici';
import { Impostazioni } from './pages/Impostazioni';
import { Edifici } from './pages/Edifici';
import { StatoDati } from './pages/StatoDati';
import { Login } from './pages/Login';
import { useAuth } from './contexts/AuthContext';

function App() {
  const auth = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedSegnalazioneId, setSelectedSegnalazioneId] = useState<number | null>(null);

  if (auth.loading) {
    return <div className="min-vh-100 d-flex align-items-center justify-content-center"><Spinner animation="border" /></div>;
  }
  if (!auth.profile) {
    return (
      <>
        <Login notice={auth.session ? auth.error : ''} />
        {auth.session && (
          <div className="position-fixed bottom-0 end-0 p-3">
            <Button variant="outline-secondary" onClick={() => void auth.signOut()}>
              Esci dalla sessione
            </Button>
          </div>
        )}
      </>
    );
  }

  const vaiAlDettaglio = (id: number) => {
    setSelectedSegnalazioneId(id);
    setCurrentPage('dettaglio');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'stato-dati':
        return <StatoDati />;
      case 'segnalazioni':
        return (
          <ListaSegnalazioni 
            onVisualizzaDettaglio={vaiAlDettaglio} 
            onNuovaSegnalazione={() => setCurrentPage('nuova')} 
          />
        );
      case 'nuova':
        return <NuovaSegnalazione onAnnulla={() => setCurrentPage('segnalazioni')} />;
      case 'dettaglio':
        return (
          <DettaglioSegnalazione 
            id={selectedSegnalazioneId || 0} 
            onTornaIndietro={() => setCurrentPage('segnalazioni')} 
          />
        );
      case 'tecnici':
        return <Tecnici />;
      case 'impostazioni':
        return <Impostazioni />;
      case 'edifici':
        return <Edifici />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      profile={auth.profile}
      onSignOut={() => void auth.signOut()}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;