import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ListaSegnalazioni } from './pages/ListaSegnalazioni';
import { NuovaSegnalazione } from './pages/NuovaSegnalazione';
import { DettaglioSegnalazione } from './pages/DettaglioSegnalazione';
import { Tecnici } from './pages/Tecnici';
import { Impostazioni } from './pages/Impostazioni';
import { Edifici } from './pages/Edifici';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedSegnalazioneId, setSelectedSegnalazioneId] = useState<number | null>(null);

  const vaiAlDettaglio = (id: number) => {
    setSelectedSegnalazioneId(id);
    setCurrentPage('dettaglio');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
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
        case'edifici':
        return <Edifici />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;