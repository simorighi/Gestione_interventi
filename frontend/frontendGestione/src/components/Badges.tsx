import { Badge } from 'react-bootstrap';
import type { Priorita, Stato } from '../services/api';

const COLORE_STATO: Record<string, string> = {
  Segnalato: 'secondary',
  'Preso in carico': 'primary',
  'In lavorazione': 'info',
  Sospeso: 'warning',
  Risolto: 'success',
};

export function BadgeStato({ stato }: { stato: Stato }) {
  return <Badge bg={COLORE_STATO[stato.nome] ?? 'dark'}>{stato.nome}</Badge>;
}

const COLORE_PRIORITA: Record<number, string> = { 1: 'secondary', 2: 'primary', 3: 'warning', 4: 'danger' };

export function BadgePriorita({ priorita }: { priorita: Priorita }) {
  return <Badge bg={COLORE_PRIORITA[priorita.livello] ?? 'dark'}>{priorita.nome}</Badge>;
}
