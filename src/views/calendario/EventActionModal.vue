<template>
  <!--
    Modal per scegliere l'azione da eseguire su un evento del calendario

    Props:
    - visible: Boolean - mostra/nasconde la modal
    - evento: Object - evento selezionato dal calendario

    Emits:
    - close: chiude la modal
    - modifica: apre la modal di modifica
    - cancella: cancella l'evento
  -->
  <CModal 
    :visible="visible" 
    @close="handleClose" 
    @update:visible="handleClose" 
    size="sm" 
    class="event-action-modal"
  >
    <CModalHeader class="border-0 pb-2">
      <CModalTitle class="h6 fw-bold d-flex align-items-center">
        <CIcon icon="cil-calendar" class="me-2 text-primary"/>
        Azione Evento
      </CModalTitle>
    </CModalHeader>

    <CModalBody class="pt-0 pb-2">
      <!-- Preview dell'evento - dati essenziali -->
      <div v-if="evento" class="evento-preview mb-4">
        <div class="preview-header">
          <h6 class="mb-2 fw-bold text-truncate">{{ evento.titolo || 'Evento senza titolo' }}</h6>
        </div>
        
        <div class="preview-details">
          <!-- Specialista -->
          <div v-if="nomeSpecialista" class="detail-item">
            <CIcon icon="cil-user" class="detail-icon text-primary"/>
            <span class="detail-text">{{ nomeSpecialista }}</span>
          </div>
          
          <!-- Data e Orario -->
          <div class="detail-item">
            <CIcon icon="cil-clock" class="detail-icon text-info"/>
            <span class="detail-text">{{ dataOraFormattata }}</span>
          </div>
          
          <!-- Stanza -->
          <div v-if="evento.stanza || evento.sala" class="detail-item">
            <CIcon icon="cil-room" class="detail-icon text-success"/>
            <span class="detail-text">{{ evento.stanza || evento.sala }}</span>
          </div>
        </div>
      </div>

      <!-- Messaggio di conferma -->
      <div class="action-message">
        <p class="text-muted mb-0 text-center">
          <small>Cosa vuoi fare con questo evento?</small>
        </p>
      </div>
    </CModalBody>

    <CModalFooter class="border-0 pt-0">
      <!-- Pulsanti azione affiancati -->
      <div class="d-flex gap-2 w-100">
        <CButton
          color="primary"
          variant="outline"
          @click="handleModifica"
          :disabled="loading"
          class="flex-grow-1"
        >
          <CIcon icon="cil-pencil" class="me-2"/>
          Modifica
        </CButton>

        <CButton
          color="danger"
          variant="outline"
          @click="handleCancella"
          :disabled="loading"
          class="flex-grow-1"
        >
          <CSpinner v-if="loading" size="sm" class="me-2"/>
          <CIcon v-else icon="cil-trash" class="me-2"/>
          Cancella
        </CButton>
      </div>

      <!-- Pulsante Annulla -->
      <div class="w-100 mt-2">
        <CButton
          color="light"
          variant="outline"
          @click="handleClose"
          :disabled="loading"
          class="w-100"
        >
          <CIcon icon="cil-x" class="me-2"/>
          Annulla
        </CButton>
      </div>
    </CModalFooter>
  </CModal>
</template>

<script setup>
/**
 * Modal per scegliere l'azione da eseguire su un evento
 * 
 * Fornisce opzioni per modificare o cancellare un evento selezionato,
 * mostrando un preview con i dati essenziali dell'evento.
 */

import { ref, computed } from 'vue'
import { useCalendario } from '@/composables/useCalendario'

// Props del componente
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  evento: {
    type: Object,
    default: null
  }
})

// Eventi emessi dal componente
const emit = defineEmits(['close', 'modifica', 'cancella'])

// Composable per le funzioni del calendario
const { eliminaEvento } = useCalendario()

// Stato del componente
const loading = ref(false)

// Computed per il nome dello specialista
const nomeSpecialista = computed(() => {
  if (!props.evento) return ''
  
  // Gestisce sia la struttura con oggetto specialista che quella con stringa
  if (props.evento.specialista) {
    if (typeof props.evento.specialista === 'object') {
      const nome = props.evento.specialista.nome || ''
      const cognome = props.evento.specialista.cognome || ''
      return `${nome} ${cognome}`.trim()
    } else if (typeof props.evento.specialista === 'string') {
      return props.evento.specialista
    }
  }
  
  // Fallback per campo professionista
  return props.evento.professionista || ''
})

// Computed per data e ora formattata
const dataOraFormattata = computed(() => {
  if (!props.evento) return ''
  
  try {
    let data, oraInizio, oraFine
    
    // Gestione nuova struttura (date, timeStart, timeEnd)
    if (props.evento.date && props.evento.timeStart && props.evento.timeEnd) {
      data = props.evento.date
      oraInizio = props.evento.timeStart
      oraFine = props.evento.timeEnd
    }
    // Gestione vecchia struttura (dataInizio, dataFine)
    else if (props.evento.dataInizio && props.evento.dataFine) {
      const dataInizio = new Date(props.evento.dataInizio)
      const dataFineDate = new Date(props.evento.dataFine)
      
      data = dataInizio.toISOString().split('T')[0]
      oraInizio = dataInizio.toTimeString().slice(0, 5)
      oraFine = dataFineDate.toTimeString().slice(0, 5)
    }
    else {
      return 'Data non disponibile'
    }
    
    // Formatta la data in formato italiano
    const dataObj = new Date(data)
    const dataFormattata = dataObj.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
    
    // Normalizza gli orari (rimuove i secondi se presenti)
    const oraInizioFormatted = oraInizio.length > 5 ? oraInizio.slice(0, 5) : oraInizio
    const oraFineFormatted = oraFine.length > 5 ? oraFine.slice(0, 5) : oraFine
    
    return `${dataFormattata} • ${oraInizioFormatted} - ${oraFineFormatted}`
    
  } catch (error) {
    console.error('Errore nella formattazione data/ora:', error)
    return 'Data non valida'
  }
})

// Gestione chiusura modal
const handleClose = () => {
  if (loading.value) return // Blocca chiusura durante operazioni
  emit('close')
}

// Gestione modifica evento
const handleModifica = () => {
  if (loading.value) return
  emit('modifica', props.evento)
}

// Gestione cancellazione evento
const handleCancella = async () => {
  if (!props.evento?.id || loading.value) return
  
  loading.value = true
  
  try {
    console.log('🗑️ [EventActionModal] Cancellazione evento:', props.evento.id)
    
    // Chiama la funzione di eliminazione dal composable
    await eliminaEvento(props.evento.id)
    
    console.log('✅ [EventActionModal] Evento cancellato con successo')
    
    // Emetti evento di cancellazione con l'ID dell'evento
    emit('cancella', props.evento.id)
    
  } catch (error) {
    console.error('❌ [EventActionModal] Errore nella cancellazione:', error)
    
    // TODO: Qui potresti aggiungere una notifica di errore
    // Per ora logghiamo l'errore, il parent gestirà gli errori
    
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/**
 * Stili per la modal di azione evento
 * Design pulito e user-friendly
 */

.event-action-modal :deep(.modal-content) {
  border: none;
  border-radius: 12px;
  box-shadow: 0 15px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -5px rgba(0, 0, 0, 0.04);
}

.event-action-modal :deep(.modal-header) {
  padding: 1.25rem 1.25rem 0.5rem 1.25rem;
}

.event-action-modal :deep(.modal-body) {
  padding: 0.5rem 1.25rem;
}

.event-action-modal :deep(.modal-footer) {
  padding: 0.5rem 1.25rem 1.25rem 1.25rem;
}

/* Preview dell'evento */
.evento-preview {
  background-color: var(--cui-gray-50);
  border: 2px solid var(--cui-border-color);
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid var(--cui-primary);
}

.preview-header h6 {
  color: var(--cui-body-color);
  margin-bottom: 0.75rem;
}

.preview-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detail-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.detail-text {
  color: var(--cui-text-muted);
  font-size: 0.875rem;
  font-weight: 500;
}

/* Messaggio di azione */
.action-message {
  text-align: center;
  padding: 0.5rem 0;
}

/* Pulsanti */
.event-action-modal .btn {
  border-radius: 8px;
  font-weight: 500;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

/* Pulsante Modifica */
.event-action-modal .btn-outline-primary {
  border: 2px solid var(--cui-primary);
  color: var(--cui-primary);
  background-color: rgba(var(--cui-primary-rgb), 0.05);
}

.event-action-modal .btn-outline-primary:hover {
  background-color: var(--cui-primary);
  border-color: var(--cui-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(var(--cui-primary-rgb), 0.3);
}

/* Pulsante Cancella */
.event-action-modal .btn-outline-danger {
  border: 2px solid var(--cui-danger);
  color: var(--cui-danger);
  background-color: rgba(var(--cui-danger-rgb), 0.05);
}

.event-action-modal .btn-outline-danger:hover {
  background-color: var(--cui-danger);
  border-color: var(--cui-danger);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(var(--cui-danger-rgb), 0.3);
}

/* Pulsante Annulla */
.event-action-modal .btn-outline-light {
  border: 2px solid var(--cui-border-color);
  color: var(--cui-text-muted);
  background-color: var(--cui-body-bg);
}

.event-action-modal .btn-outline-light:hover {
  background-color: var(--cui-gray-100);
  border-color: var(--cui-border-color);
  color: var(--cui-body-color);
}

/* Animazioni */
.event-action-modal :deep(.modal-content) {
  animation: modalSlideIn 0.25s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Responsive */
@media (max-width: 576px) {
  .event-action-modal :deep(.modal-dialog) {
    margin: 1rem;
  }
  
  .event-action-modal :deep(.modal-header),
  .event-action-modal :deep(.modal-body),
  .event-action-modal :deep(.modal-footer) {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .preview-details {
    gap: 0.375rem;
  }
  
  .detail-text {
    font-size: 0.8rem;
  }
  
  .event-action-modal .btn {
    padding: 0.625rem 0.75rem;
    font-size: 0.8rem;
  }
}

/* Focus states per accessibilità */
.event-action-modal .btn:focus {
  outline: 2px solid var(--cui-primary);
  outline-offset: 2px;
}

.event-action-modal .btn-outline-danger:focus {
  outline-color: var(--cui-danger);
}

/* Stato loading */
.event-action-modal .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}
</style>