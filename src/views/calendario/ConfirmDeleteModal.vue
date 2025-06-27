<template>
  <!--
    Modal di conferma eliminazione - Gestisce eventi singoli e ricorrenti

    Props:
    - visible: Boolean - mostra/nasconde la modal
    - evento: Object - evento da eliminare

    Emits:
    - close: chiude la modal
    - deleted: evento eliminato con successo
  -->
  <CModal
    :visible="visible"
    @close="handleClose"
    @update:visible="handleClose"
    class="confirm-delete-modal"
  >
    <CModalHeader class="border-0 pb-2">
      <CModalTitle class="h6 fw-bold d-flex align-items-center">
        <CIcon icon="cil-trash" class="me-2 text-danger"/>
        Conferma Eliminazione
      </CModalTitle>
    </CModalHeader>

    <CModalBody class="pt-0 pb-2">
      <div v-if="eventoCorrente">

        <!-- Preview dell'evento da eliminare -->
        <div class="evento-preview mb-4">
          <h6 class="mb-2 fw-bold text-truncate">{{ eventoCorrente.titolo || 'Evento senza titolo' }}</h6>

          <!-- Indicatore se è ricorrente -->
          <div v-if="isRicorrente" class="ricorrente-badge mb-3">
            <CIcon icon="cil-loop" class="me-2"/>
            <span>Evento ricorrente</span>
          </div>
        </div>

        <!-- Opzioni per eventi ricorrenti -->
        <div v-if="isRicorrente" class="eliminazione-options mb-4">
          <h6 class="mb-3">Cosa vuoi eliminare?</h6>

          <div class="options-list">
            <div
              v-for="opzione in opzioniEliminazione"
              :key="opzione.value"
              class="option-item"
              :class="{ 'selected': opzioneEliminazione === opzione.value }"
              @click="opzioneEliminazione = opzione.value"
            >
              <div class="option-radio">
                <input
                  type="radio"
                  :id="opzione.value"
                  :value="opzione.value"
                  v-model="opzioneEliminazione"
                  class="form-check-input"
                />
              </div>
              <div class="option-content">
                <label :for="opzione.value" class="option-label">{{ opzione.label }}</label>
                <p class="option-description">{{ opzione.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Messaggio per eventi singoli -->
        <div v-else class="eliminazione-message mb-4">
          <p class="text-muted mb-0">
            Sei sicuro di voler eliminare questo evento?
            <strong>Questa azione non può essere annullata.</strong>
          </p>
        </div>

      </div>
    </CModalBody>

    <CModalFooter class="border-0 pt-0">
      <div class="d-flex gap-2 w-100">
        <!-- Pulsante Annulla -->
        <CButton
          color="light"
          variant="outline"
          @click="handleClose"
          :disabled="loading"
          class="flex-grow-1"
        >
          <CIcon icon="cil-x" class="me-2"/>
          Annulla
        </CButton>

        <!-- Pulsante Elimina -->
        <CButton
          color="danger"
          @click="handleElimina"
          :disabled="loading || !eventoCorrente"
          class="flex-grow-1"
        >
          <CSpinner v-if="loading" size="sm" class="me-2"/>
          <CIcon v-else icon="cil-trash" class="me-2"/>
          {{ isRicorrente ? 'Elimina Selezionati' : 'Elimina Evento' }}
        </CButton>
      </div>
    </CModalFooter>
  </CModal>
</template>

<script setup>
/**
 * Modal di conferma eliminazione evento
 *
 * Gestisce l'eliminazione di eventi singoli e ricorrenti.
 * Per eventi ricorrenti mostra opzioni di cancellazione specifiche.
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
const emit = defineEmits(['close', 'deleted'])

// Composable per le funzioni del calendario
const { eliminaEvento, eliminaEventiRicorrenti, isEventoRicorrente, Direction } = useCalendario()

// Stato del componente
const loading = ref(false)
const opzioneEliminazione = ref('THIS_ONLY') // Opzione selezionata per eventi ricorrenti
// ⭐ RIMOSSO - eventoSalvato che causava problemi di cache

// Computed per verificare se l'evento è ricorrente - VERSIONE SEMPLIFICATA
const isRicorrente = computed(() => {
  console.log('🔍 [ConfirmDeleteModal] Debug evento ricevuto:', props.evento)
  console.log('🔍 [ConfirmDeleteModal] isEventoRicorrente result:', props.evento && isEventoRicorrente(props.evento))
  return props.evento && isEventoRicorrente(props.evento)
})

// Computed per ottenere l'evento corrente - VERSIONE SEMPLIFICATA
const eventoCorrente = computed(() => {
  console.log('🔍 [ConfirmDeleteModal] Usando direttamente props.evento:', {
    id: props.evento?.id,
    titolo: props.evento?.titolo
  })
  return props.evento // Usa sempre i props più aggiornati
})

// Opzioni per la selezione di eliminazione eventi ricorrenti
const opzioniEliminazione = [
  {
    value: 'THIS_ONLY', // ✅ Valore custom per solo questo evento
    label: 'Solo questo evento',
    description: 'Elimina solo l\'evento selezionato'
  },
  {
    value: Direction.FORWARD,
    label: 'Questo e tutti i futuri',
    description: 'Elimina questo evento e tutti quelli successivi della serie'
  },
  {
    value: Direction.ALL,
    label: 'Tutti gli eventi della serie',
    description: 'Elimina completamente la serie ricorrente'
  }
]

// Gestione chiusura modal - VERSIONE SEMPLIFICATA
const handleClose = () => {
  if (loading.value) return // Blocca chiusura durante operazioni

  console.log('🚪 [ConfirmDeleteModal] Chiusura modal - reset stato')

  // Reset solo lo stato dell'opzione
  opzioneEliminazione.value = 'THIS_ONLY'
  emit('close')
}

// Gestione eliminazione evento
const handleElimina = async () => {
  const evento = eventoCorrente.value
  if (!evento?.id || loading.value) return

  loading.value = true

  try {
    console.log('🗑️ [ConfirmDeleteModal] Inizio eliminazione evento:', {
      id: evento.id,
      tipo: typeof evento.id,
      titolo: evento.titolo
    })

    if (isRicorrente.value) {
      // Evento ricorrente - usa l'opzione selezionata
      console.log('📅 [ConfirmDeleteModal] Eliminazione evento ricorrente, opzione:', opzioneEliminazione.value)

      if (opzioneEliminazione.value === 'THIS_ONLY') {
        // Per "solo questo evento" usa eliminaEvento normale
        console.log('📄 [ConfirmDeleteModal] Eliminazione singolo evento ricorrente con ID:', evento.id)
        await eliminaEvento(evento.id)
      } else {
        // Per altre opzioni usa eliminaEventiRicorrenti con direction
        console.log('📅 [ConfirmDeleteModal] Eliminazione multipla eventi ricorrenti')
        await eliminaEventiRicorrenti(evento.id, opzioneEliminazione.value)
      }

      console.log('✅ [ConfirmDeleteModal] Eventi ricorrenti eliminati con successo')

    } else {
      // Evento singolo
      console.log('📄 [ConfirmDeleteModal] Eliminazione evento singolo con ID:', evento.id)
      await eliminaEvento(evento.id)
      console.log('✅ [ConfirmDeleteModal] Evento singolo eliminato con successo')
    }

    // Emetti evento di successo
    emit('deleted', evento.id)

    // Chiudi la modale
    handleClose()

  } catch (error) {
    console.error('❌ [ConfirmDeleteModal] Errore nell\'eliminazione:', error)

    // TODO: Qui potresti aggiungere una notifica di errore
    // Per ora manteniamo la modale aperta per permettere di riprovare

  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/**
 * Stili per la modal di conferma eliminazione
 * Design pulito con opzioni per eventi ricorrenti
 */

.confirm-delete-modal :deep(.modal-content) {
  border: none;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 15px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -5px rgba(0, 0, 0, 0.04);
}

.confirm-delete-modal :deep(.modal-header) {
  padding: 1.25rem 1.25rem 0.5rem 1.25rem;
}

.confirm-delete-modal :deep(.modal-body) {
  padding: 0.5rem 1.25rem;
}

.confirm-delete-modal :deep(.modal-footer) {
  padding: 0.5rem 1.25rem 1.25rem 1.25rem;
}

/* Preview dell'evento */
.evento-preview {
  background-color: var(--cui-gray-50);
  border: 2px solid var(--cui-border-color);
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid var(--cui-danger);
}

/* Badge per eventi ricorrenti */
.ricorrente-badge {
  display: inline-flex;
  align-items: center;
  background-color: var(--cui-primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Lista opzioni eliminazione */
.eliminazione-options h6 {
  color: var(--cui-body-color);
  font-weight: 600;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Singola opzione */
.option-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid var(--cui-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--cui-body-bg);
}

.option-item:hover {
  border-color: var(--cui-danger);
  background-color: rgba(var(--cui-danger-rgb), 0.05);
}

.option-item.selected {
  border-color: var(--cui-danger);
  background-color: rgba(var(--cui-danger-rgb), 0.1);
}

.option-radio {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.option-content {
  flex-grow: 1;
}

.option-label {
  display: block;
  font-weight: 600;
  color: var(--cui-body-color);
  margin-bottom: 0.25rem;
  cursor: pointer;
}

.option-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--cui-text-muted);
  line-height: 1.4;
}

/* Messaggio per eventi singoli */
.eliminazione-message {
  text-align: center;
  padding: 1rem;
  background-color: var(--cui-warning-bg);
  border: 1px solid var(--cui-warning-border);
  border-radius: 8px;
}

/* Pulsanti */
.confirm-delete-modal .btn {
  border-radius: 8px;
  font-weight: 500;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

/* Pulsante Elimina */
.confirm-delete-modal .btn-danger {
  background-color: var(--cui-danger);
  border-color: var(--cui-danger);
}

.confirm-delete-modal .btn-danger:hover {
  background-color: var(--cui-danger);
  border-color: var(--cui-danger);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(var(--cui-danger-rgb), 0.3);
}

/* Pulsante Annulla */
.confirm-delete-modal .btn-outline-light {
  border: 2px solid var(--cui-border-color);
  color: var(--cui-text-muted);
  background-color: var(--cui-body-bg);
}

.confirm-delete-modal .btn-outline-light:hover {
  background-color: var(--cui-gray-100);
  border-color: var(--cui-border-color);
  color: var(--cui-body-color);
}

/* Animazione di apertura */
.confirm-delete-modal :deep(.modal-content) {
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
  .confirm-delete-modal :deep(.modal-dialog) {
    margin: 1rem;
  }

  .confirm-delete-modal :deep(.modal-header),
  .confirm-delete-modal :deep(.modal-body),
  .confirm-delete-modal :deep(.modal-footer) {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .option-item {
    padding: 0.75rem;
  }

  .option-label {
    font-size: 0.875rem;
  }

  .option-description {
    font-size: 0.8rem;
  }
}

/* Stati di loading e disabilitato */
.confirm-delete-modal .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* Focus states per accessibilità */
.confirm-delete-modal .btn:focus,
.option-item:focus {
  outline: 2px solid var(--cui-danger);
  outline-offset: 2px;
}
</style>
