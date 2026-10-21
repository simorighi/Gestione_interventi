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
  }
];

export const tecnici = [
  { id: 1, nome: 'Mario Rossi', specializzazione: 'Idraulica', stato: 'Disponibile' },
  { id: 2, nome: 'Luigi Neri', specializzazione: 'Elettrica', stato: 'In missione' }
];

export const edifici = [
  { id: 1, nome: 'Edificio A - Uffici', indirizzo: 'Via Roma 10', impianti: 15 },
  { id: 2, nome: 'Edificio B - Magazzino', indirizzo: 'Via Milano 5', impianti: 8 }
];