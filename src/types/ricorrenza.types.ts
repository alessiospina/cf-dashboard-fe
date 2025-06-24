// types/ricorrenza.types.ts

// Enum per le direzioni del backend (corrispondono al BE)
export enum Direction {
  ALL = 'ALL',          
  BACKWARD = 'BACKWARD',
  FORWARD = 'FORWARD'    
}

// Enum per le opzioni dell'interfaccia utente
export enum TipoModificaEvento {
  EVENTO_SINGOLO = 'EVENTO_SINGOLO',
  QUESTO_E_SUCCESSIVI = 'QUESTO_E_SUCCESSIVI',
  QUESTO_E_PRECEDENTI = 'QUESTO_E_PRECEDENTI',
  TUTTI = 'TUTTI'
}

// Interfaccia per la selezione dell'utente
export interface OpzioneModificaEvento {
  valore: TipoModificaEvento;
  label: string;
  direction?: Direction; // undefined per evento singolo (usa API normale)
}

// Array delle opzioni disponibili per la UI
export const OPZIONI_MODIFICA_EVENTO: OpzioneModificaEvento[] = [
  {
    valore: TipoModificaEvento.EVENTO_SINGOLO,
    label: 'Solo questo evento',
    direction: undefined // Usa API normale /api/evento/:id
  },
  {
    valore: TipoModificaEvento.QUESTO_E_SUCCESSIVI,
    label: 'Questo evento e i successivi',
    direction: Direction.FORWARD
  },
  {
    valore: TipoModificaEvento.QUESTO_E_PRECEDENTI,
    label: 'Questo evento e i precedenti', 
    direction: Direction.BACKWARD
  },
  {
    valore: TipoModificaEvento.TUTTI,
    label: 'Tutti gli eventi ricorrenti',
    direction: Direction.ALL
  }
];

// Funzione helper per mappare il tipo UI alla direction del backend
export function getDirectionFromTipo(tipo: TipoModificaEvento): Direction | undefined {
  const opzione = OPZIONI_MODIFICA_EVENTO.find(opt => opt.valore === tipo);
  return opzione?.direction;
}

// Funzione helper per verificare se un evento è ricorrente
export function isEventoRicorrente(evento: any): boolean {
  return evento.master !== null && evento.master !== undefined;
}
