# Documentazione: Cancellazione Eventi Ricorrenti

## Panoramica

Il sistema di cancellazione degli eventi ricorrenti fornisce 4 opzioni per permettere all'utente di scegliere come gestire la cancellazione di un evento che fa parte di una serie ricorrente.

## Opzioni di Cancellazione

### 1. Solo questo evento (THIS)
- **Descrizione**: Cancella solo l'evento selezionato
- **Comportamento**: Gli altri eventi della serie rimangono invariati
- **Codice backend**: `Direction.THIS`

### 2. Questo e tutti i successivi (THIS_AND_FOLLOWING)
- **Descrizione**: Cancella l'evento selezionato e tutti quelli futuri nella serie
- **Comportamento**: Gli eventi precedenti alla data selezionata rimangono confermati
- **Codice backend**: `Direction.THIS_AND_FOLLOWING`

### 3. Questo e tutti i precedenti (THIS_AND_PREVIOUS)
- **Descrizione**: Cancella l'evento selezionato e tutti quelli passati nella serie
- **Comportamento**: Gli eventi successivi alla data selezionata rimangono confermati
- **Codice backend**: `Direction.THIS_AND_PREVIOUS`

### 4. Tutta la serie ricorrente (ALL_SERIES)
- **Descrizione**: Cancella completamente tutti gli eventi della serie
- **Comportamento**: Elimina tutti gli eventi ricorrenti collegati
- **Codice backend**: `Direction.ALL_SERIES`

## Componenti Implementati

### 1. DeleteRecurringEventModal.vue
Modal principale che presenta le 4 opzioni all'utente:

```vue
<DeleteRecurringEventModal
  :visible="showModal"
  :evento="eventoSelezionato"
  @close="handleClose"
  @deleted="handleDeleted"
/>
```

**Props:**
- `visible`: Boolean - controlla la visibilità della modal
- `evento`: Object - evento ricorrente da cancellare

**Eventi emessi:**
- `close`: Modal chiusa senza azione
- `deleted`: Cancellazione completata con risultato

### 2. useDeleteRecurringEvent.js
Composable riusabile per la gestione:

```javascript
import { useDeleteRecurringEvent } from '@/composables/useDeleteRecurringEvent'

const {
  showDeleteRecurringModal,
  handleDeleteEvent,
  handleRecurringDeleted,
  handleRecurringDeleteClosed,
  checkIsEventoRicorrente
} = useDeleteRecurringEvent()

// Utilizzo
const handleDelete = async (evento) => {
  await handleDeleteEvent(evento, (risultato) => {
    console.log('Evento cancellato:', risultato)
    // Ricarica dati...
  })
}
```

### 3. Tipi TypeScript (ricorrenza.types.ts)
Definisce le interfacce e utilità:

```typescript
import { 
  TipoCancellazioneEvento,
  isEventoRicorrente,
  calcolaImpattoCancellazione 
} from '@/types/ricorrenza.types.ts'
```

## Integrazione nei Componenti

### EventModal.vue
La modal di modifica eventi integra automaticamente la cancellazione ricorrente:

```javascript
const handleDelete = async () => {
  if (isEventoRicorrenteInModifica.value) {
    // Mostra modal opzioni cancellazione
    showDeleteRecurringModal.value = true
    return
  }
  
  // Cancellazione normale per eventi singoli
  await eliminaEvento(props.evento.id)
}
```

### EventCard.vue
Le card eventi supportano il menu contestuale con cancellazione:

```javascript
// Click destro per aprire menu contestuale
@contextmenu.prevent="showContextMenu = true"

// Gestione cancellazione dal menu
const handleElimina = async () => {
  await handleDeleteEvent(props.evento, (risultato) => {
    emit('deleted', risultato)
  })
}
```

### CalendarioView.vue
Il container principale gestisce gli eventi di cancellazione:

```javascript
const handleEventoEliminato = async (risultato) => {
  if (risultato.deletedIds) {
    // Cancellazione multipla (eventi ricorrenti)
    console.log(`${risultato.deletedIds.length} eventi eliminati`)
  } else {
    // Cancellazione singola
    console.log('Evento singolo eliminato')
  }
  
  // Ricarica eventi
  await caricaEventi(dataSelezionata.value)
}
```

## Flusso di Utilizzo

1. **Rilevamento evento ricorrente**:
   ```javascript
   if (isEventoRicorrente(evento)) {
     // Mostra modal opzioni
   } else {
     // Cancellazione diretta
   }
   ```

2. **Presentazione opzioni**:
   - Modal mostra 4 card con le opzioni
   - Anteprima dell'impatto della cancellazione
   - Validazione della selezione

3. **Esecuzione cancellazione**:
   ```javascript
   const eventiEliminati = await eliminaEventiRicorrenti(
     evento.id, 
     direction
   )
   ```

4. **Gestione risultato**:
   ```javascript
   emit('deleted', {
     eventoId: evento.id,
     option: selectedOption,
     direction: direction,
     deletedIds: eventiEliminati
   })
   ```

## API Backend

### Endpoint utilizzato
```
DELETE /api/ricorrenza/{eventoId}
```

### Payload
```json
{
  "direction": "THIS_AND_FOLLOWING"
}
```

### Risposta
```json
{
  "data": [1, 2, 3, 4, 5], // IDs eventi eliminati
  "success": true
}
```

## Testing

### Test di integrazione consigliati:

1. **Cancellazione evento singolo**: verificare che non mostri la modal
2. **Cancellazione evento ricorrente**: verificare apertura modal
3. **Opzioni di cancellazione**: testare tutte e 4 le opzioni
4. **Validazione**: testare con eventi senza serie
5. **UI responsivo**: testare su dispositivi mobile

### Casi edge da testare:

- Eventi ricorrenti con solo un'istanza
- Eventi master senza figli
- Eventi figli senza master valido
- Cancellazione con errori di rete

## Troubleshooting

### Errori comuni:

1. **Modal non si apre**: verificare che `isEventoRicorrente()` restituisca `true`
2. **Opzioni non funzionano**: controllare mapping Direction nel backend
3. **UI non aggiornata**: verificare che il callback `onDeleted` ricarichi i dati
4. **Errori TypeScript**: verificare import corretti da `ricorrenza.types.ts`

### Debug:

```javascript
// Verifica evento ricorrente
console.log('È ricorrente?', isEventoRicorrente(evento))
console.log('Evento:', evento)

// Verifica risultato cancellazione
console.log('Risultato:', risultato)
console.log('IDs eliminati:', risultato.deletedIds)
```
