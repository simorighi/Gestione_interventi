// ============ INTERFACCE ============

export interface Segnalazione {
  id: number;
  titolo: string;
  descrizione: string;
  edificio: string;
  categoria: string;
  priorita: 'bassa' | 'media' | 'alta' | 'urgente';
  stato: 'segnalato' | 'preso_in_carico' | 'in_lavorazione' | 'sospeso' | 'risolto';
  dataCreazione: string;
  tecnicoAssegnato?: string;
  storico: { data: string; utente: string; azione: string }[];
}

export interface Tecnico {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  specializzazione: string;
  stato: 'disponibile' | 'in_missione' | 'ferie';
  interventiAttivi: number;
}

export interface Categoria {
  id: number;
  nome: string;
  descrizione: string;
  attiva: boolean;
}

export interface Utente {
  id: number;
  username: string;
  nome: string;
  ruolo: 'segnalatore' | 'tecnico' | 'responsabile' | 'amministratore';
  attivo: boolean;
}

// ============ DATI MOCK ============

export const segnalazioni: Segnalazione[] = [
  {
    id: 101,
    titolo: 'Perdita acqua bagno',
    descrizione: 'Perdita visibile sotto il lavandino del secondo piano.',
    edificio: 'Edificio A - Uffici',
    categoria: 'Idraulica',
    priorita: 'alta',
    stato: 'in_lavorazione',
    dataCreazione: '2026-10-20',
    tecnicoAssegnato: 'Mario Rossi',
    storico: [
      { data: '2026-10-20 09:00', utente: 'Luigi Bianchi', azione: 'Segnalazione creata' },
      { data: '2026-10-20 10:30', utente: 'Resp. Manutenzione', azione: 'Stato cambiato in Preso in carico' },
      { data: '2026-10-20 11:00', utente: 'Resp. Manutenzione', azione: 'Assegnato a Mario Rossi' }
    ]
  },
  {
    id: 102,
    titolo: 'Condizionatore guasto',
    descrizione: 'Il condizionatore della sala riunioni non raffredda.',
    edificio: 'Edificio B - Magazzino',
    categoria: 'Climatizzazione',
    priorita: 'media',
    stato: 'segnalato',
    dataCreazione: '2026-10-21',
    storico: [
      { data: '2026-10-21 08:15', utente: 'Anna Verdi', azione: 'Segnalazione creata' }
    ]
  },
  {
    id: 103,
    titolo: 'Lampadina bruciata corridoio',
    descrizione: 'Lampadina bruciata al terzo piano, corridoio principale.',
    edificio: 'Edificio A - Uffici',
    categoria: 'Elettrica',
    priorita: 'bassa',
    stato: 'risolto',
    dataCreazione: '2026-10-18',
    tecnicoAssegnato: 'Luigi Neri',
    storico: [
      { data: '2026-10-18 14:00', utente: 'Segnalatore', azione: 'Segnalazione creata' },
      { data: '2026-10-18 15:30', utente: 'Luigi Neri', azione: 'Lampadina sostituita' }
    ]
  },
  {
    id: 104,
    titolo: 'Porta automatica bloccata',
    descrizione: 'La porta automatica dell\'ingresso principale non si apre.',
    edificio: 'Edificio C - Locale Tecnico',
    categoria: 'Meccanica',
    priorita: 'urgente',
    stato: 'preso_in_carico',
    dataCreazione: '2026-10-21',
    tecnicoAssegnato: 'Anna Bianchi',
    storico: [
      { data: '2026-10-21 07:45', utente: 'Guardia', azione: 'Segnalazione creata' },
      { data: '2026-10-21 08:00', utente: 'Resp. Manutenzione', azione: 'Preso in carico - urgente' }
    ]
  }
];

export const tecnici: Tecnico[] = [
  {
    id: 1,
    nome: 'Mario',
    cognome: 'Rossi',
    email: 'mario.rossi@nordfacility.it',
    telefono: '333 1234567',
    specializzazione: 'Idraulica',
    stato: 'disponibile',
    interventiAttivi: 2
  },
  {
    id: 2,
    nome: 'Luigi',
    cognome: 'Neri',
    email: 'luigi.neri@nordfacility.it',
    telefono: '333 7654321',
    specializzazione: 'Elettrica',
    stato: 'in_missione',
    interventiAttivi: 1
  },
  {
    id: 3,
    nome: 'Anna',
    cognome: 'Bianchi',
    email: 'anna.bianchi@nordfacility.it',
    telefono: '333 9876543',
    specializzazione: 'Climatizzazione',
    stato: 'disponibile',
    interventiAttivi: 0
  },
  {
    id: 4,
    nome: 'Paolo',
    cognome: 'Verdi',
    email: 'paolo.verdi@nordfacility.it',
    telefono: '333 4567890',
    specializzazione: 'Meccanica',
    stato: 'ferie',
    interventiAttivi: 0
  }
];

export const categorie: Categoria[] = [
  { id: 1, nome: 'Idraulica', descrizione: 'Interventi su impianti idrici e sanitari', attiva: true },
  { id: 2, nome: 'Elettrica', descrizione: 'Interventi su impianti elettrici e illuminazione', attiva: true },
  { id: 3, nome: 'Climatizzazione', descrizione: 'Interventi su HVAC e condizionamento', attiva: true },
  { id: 4, nome: 'Meccanica', descrizione: 'Interventi su porte, serrature, meccanismi', attiva: true },
  { id: 5, nome: 'Edilizia', descrizione: 'Interventi strutturali e muratura', attiva: false }
];

export const utenti: Utente[] = [
  { id: 1, username: 'admin', nome: 'Amministratore Sistema', ruolo: 'amministratore', attivo: true },
  { id: 2, username: 'resp.manutenzione', nome: 'Giuseppe Responsabile', ruolo: 'responsabile', attivo: true },
  { id: 3, username: 'm.rossi', nome: 'Mario Rossi', ruolo: 'tecnico', attivo: true },
  { id: 4, username: 'l.neri', nome: 'Luigi Neri', ruolo: 'tecnico', attivo: true },
  { id: 5, username: 'segnalatore1', nome: 'Luigi Bianchi', ruolo: 'segnalatore', attivo: true }
];

export interface Impianto {
  id: number;
  nome: string;
  categoria: string;
  ultimaManutenzione: string;
}

export interface Edificio {
  id: number;
  nome: string;
  indirizzo: string;
  tipo: 'uffici' | 'magazzino' | 'locale_tecnico' | 'altro';
  impianti: Impianto[];
  interventiAttivi: number;
}

export const edifici: Edificio[] = [
  {
    id: 1,
    nome: 'Edificio A - Uffici Centrali',
    indirizzo: 'Via Roma 10, Milano',
    tipo: 'uffici',
    interventiAttivi: 3,
    impianti: [
      { id: 101, nome: 'Caldaia Centrale', categoria: 'Climatizzazione', ultimaManutenzione: '2026-09-15' },
      { id: 102, nome: 'Impianto Elettrico Piano 1', categoria: 'Elettrica', ultimaManutenzione: '2026-08-20' },
      { id: 103, nome: 'Ascensore Principale', categoria: 'Meccanica', ultimaManutenzione: '2026-10-01' }
    ]
  },
  {
    id: 2,
    nome: 'Edificio B - Magazzino Logistico',
    indirizzo: 'Via Milano 5, Sesto San Giovanni',
    tipo: 'magazzino',
    interventiAttivi: 1,
    impianti: [
      { id: 201, nome: 'Portone Sezionale', categoria: 'Meccanica', ultimaManutenzione: '2026-07-10' },
      { id: 202, nome: 'Impianto Antincendio', categoria: 'Sicurezza', ultimaManutenzione: '2026-09-30' }
    ]
  },
  {
    id: 3,
    nome: 'Edificio C - Locale Tecnico',
    indirizzo: 'Via Torino 22, Milano',
    tipo: 'locale_tecnico',
    interventiAttivi: 2,
    impianti: [
      { id: 301, nome: 'Quadro Elettrico Generale', categoria: 'Elettrica', ultimaManutenzione: '2026-06-15' },
      { id: 302, nome: 'Gruppo Elettrogeno', categoria: 'Meccanica', ultimaManutenzione: '2026-10-10' }
    ]
  }
];