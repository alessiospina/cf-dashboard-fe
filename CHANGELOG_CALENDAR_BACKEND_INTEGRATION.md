# Changelog: Integrazione Entità Backend per il Calendario

## Riassunto delle Modifiche

Questo documento descrive tutte le modifiche apportate al frontend per adeguare l'entità degli appuntamenti secondo la struttura delle entità backend Event e Slot.

## Struttura Entità Backend

### Entità Event
```typescript
interface EventoBackend {
  id: number
  titolo: string (max 50 caratteri)
  stanza: string (max 50 caratteri)  
  professionista: string (max 50 caratteri)
  dataInizio: Date
  dataFine: Date
  postiDisponibili: number
  frequenza: FrequenzaEvento (UNICA|GIORNALIERA|SETTIMANALE|MENSILE)
  dataFineRipetizione?: Date
  eventoNextId?: number
  createdAt: Date
  slots: Slot[]
}
```

### Entità Slot
```typescript
interface SlotBackend {
  id: number
  dataInizio: Date
  dataFine: Date
  evento: Event
  paziente?: Paziente
}
```

## File Creati/Modificati

### 1. `src/types/backend.types.js` (NUOVO)
**Scopo**: Definisce tupi, mapper e validatori per le entità backend
**Funzionalità principali**:
- Enum `FrequenzaEvento` 
- Classi `EventoBackend`, `SlotBackend`
- DTO `CreateEventoDto`, `CreateSlotDto`
- Mapper `EventoMapper` per conversione frontend ↔ backend
- Validator `EventoValidator` per validazione dati

### 2