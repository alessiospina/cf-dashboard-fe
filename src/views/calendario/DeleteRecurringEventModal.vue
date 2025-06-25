<template>
  <CModal :visible="visible" @close="handleClose" size="md" class="delete-recurring-modal">
    <CModalHeader class="border-0 pb-0">
      <CModalTitle class="h5 fw-bold text-danger">
        <CIcon icon="cil-trash" class="me-2"/>
        {{ isEventoRicorrente ? 'Cancellazione Evento Ricorrente' : 'Cancellazione Evento' }}
      </CModalTitle>
    </CModalHeader>

    <CModalBody class="pt-2">
      <!-- Informazioni evento -->
      <div class="evento-info mb-4">
        <div class="d-flex align-items-center mb-3">
          <CIcon icon="cil-calendar" class="info-icon text-primary me-3"/>
          <div>
            <h6 class="mb-1 fw-bold">{{ evento?.titolo || 'Evento Ricorrente' }}</h6>
            <div class="text-muted small">
              <CIcon icon="cil-clock" class="me-1"/>
              {{ formatDataEvento(evento) }}
              <span v-if="evento?.specialista?.nomeCompleto" class="ms-3">
                <CIcon icon="cil-user" class="me-1"/>
                {{ evento.specialista.nomeCompleto }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Avviso importante -->
      <CAlert color="warning" class="mb-4" v-if="isEventoRicorrente">
        <div class="d-flex align-items-start">
          <CIcon icon="cil-warning" class="me-2 mt-1 flex-shrink-0"/>
          <div>
            <strong>Questo evento fa parte di una serie ricorrente.</strong>
            <p class="mb-0 mt-2">
              Scegli come vuoi procedere con la cancellazione:
            </p>
          </div>
        </div>
      </CAlert>

      <!-- Avviso per evento singolo -->
      <CAlert color="info" class="mb-4" v-if="!isEventoRicorrente">
        <div class="d-flex align-items-start">
          <CIcon icon="cil-info" class="me-2 mt-1 flex-shrink-0"/>
          <div>
            <strong>Conferma cancellazione evento</strong>
            <p class="mb-0 mt-2">
              Sei sicuro di voler cancellare questo evento? L'azione non può essere annullata.
            </p>
          </div>
        </div>
      </CAlert>

      <!-- Opzioni di cancellazione - SOLO per eventi ricorrenti -->
      <div v-if="isEventoRicorrente" class="cancellation-options">
        <h6 class="section-title mb-3">Opzioni di Cancellazione</h6>

        <div class="option-cards">
          <!-- Opzione 1: Solo questo evento -->
          <div
            class="option-card"
            :class="{ 'selected': selectedOption === 'THIS' }"
            @click="selectedOption = 'THIS'"
          >
            <div class="option-header">
              <CFormCheck
                v-model="selectedOption"
                value="THIS"
                name="deleteOption"
                :id="'option-this'"
                class="option-radio"
              />
              <CIcon icon="cil-calendar-check" class="option-icon text-info"/>
              <div class="option-info">
                <div class="option-title">Solo questo evento</div>
                <div class="option-description">
                  Cancella solo l'appuntamento del {{ formatDataCompleta(evento) }}
                </div>
              </div>
            </div>
            <div class="option-footer">
              <small class="text-muted">
                Gli altri eventi della serie rimangono invariati
              </small>
            </div>
          </div>

          <!-- Opzione 2: Questo e tutti i successivi -->
          <div
            class="option-card"
            :class="{ 'selected': selectedOption === 'THIS_AND_FOLLOWING' }"
            @click="selectedOption = 'THIS_AND_FOLLOWING'"
          >
            <div class="option-header">
              <CFormCheck
                v-model="selectedOption"
                value="THIS_AND_FOLLOWING"
                name="deleteOption"
                :id="'option-following'"
                class="option-radio"
              />
              <CIcon icon="cil-media-step-forward" class="option-icon text-warning"/>
              <div class="option-info">
                <div class="option-title">Questo e tutti i successivi</div>
                <div class="option-description">
                  Cancella l'evento del {{ formatDataCompleta(evento) }} e tutti quelli futuri
                </div>
              </div>
            </div>
            <div class="option-footer">
              <small class="text-muted">
                Gli eventi precedenti a questa data rimangono confermati
              </small>
            </div>
          </div>

          <!-- Opzione 3: Questo e tutti i precedenti -->
          <div
            class="option-card"
            :class="{ 'selected': selectedOption === 'THIS_AND_PREVIOUS' }"
            @click="selectedOption = 'THIS_AND_PREVIOUS'"
          >
            <div class="option-header">
              <CFormCheck
                v-model="selectedOption"
                value="THIS_AND_PREVIOUS"
                name="deleteOption"
                :id="'option-previous'"
                class="option-radio"
              />
              <CIcon icon="cil-media-step-backward" class="option-icon text-secondary"/>
              <div class="option-info">
                <div class="option-title">Questo e tutti i precedenti</div>
                <div class="option-description">
                  Cancella l'evento del {{ formatDataCompleta(evento) }} e tutti quelli passati
                </div>
              </div>
            </div>
            <div class="option-footer">
              <small class="text-muted">
                Gli eventi successivi a questa data rimangono confermati
              </small>
            </div>
          </div>

          <!-- Opzione 4: Tutta la serie -->
          <div
            class="option-card"
            :class="{ 'selected': selectedOption === 'ALL_SERIES' }"
            @click="selectedOption = 'ALL_SERIES'"
          >
            <div class="option-header">
              <CFormCheck
                v-model="selectedOption"
                value="ALL_SERIES"
                name="deleteOption"
                :id="'option-all'"
                class="option-radio"
              />
              <CIcon icon="cil-trash" class="option-icon text-danger"/>
              <div class="option-info">
                <div class="option-title">Tutta la serie ricorrente</div>
                <div class="option-description">
                  Cancella completamente tutti gli eventi della serie
                </div>
              </div>
            </div>
            <div class="option-footer">
              <small class="text-danger fw-medium">
                ⚠️ Questa azione cancellerà TUTTI gli eventi ricorrenti
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Anteprima impatto - SOLO per eventi ricorrenti -->
      <div v-if="selectedOption && isEventoRicorrente" class="impact-preview mt-4">
        <div class="preview-card">
          <div class="d-flex align-items-center mb-2">
            <CIcon icon="cil-info" class="me-2 text-info"/>
            <strong>Anteprima impatto:</strong>
          </div>
          <div class="impact-text">
            {{ getImpactDescription() }}
          </div>
        </div>
      </div>

      <!-- Errore -->
      <CAlert v-if="deleteError" color="danger" class="mb-0 mt-3">
        <CIcon icon="cil-warning" class="me-2"/>
        {{ deleteError }}
      </CAlert>
    </CModalBody>

    <CModalFooter class="border-0 pt-0">
      <div class="d-flex gap-2 w-100">
        <CButton
          color="light"
          variant="outline"
          @click="handleClose"
          :disabled="deleting"
          class="flex-grow-1"
        >
          Annulla
        </CButton>

        <CButton
          color="danger"
          @click="handleDelete"
          :disabled="(isEventoRicorrente && !selectedOption) || deleting"
          class="flex-grow-1"
        >
          <CSpinner v-if="deleting" size="sm" class="me-2"/>
          <CIcon v-else icon="cil-trash" class="me-2"/>
          {{ deleting ? 'Cancellazione...' : 'Conferma Cancellazione' }}
        </CButton>
      </div>
    </CModalFooter>
  </CModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCalendario } from '@/composables/useCalendario'
import { useDeleteRecurringEvent } from '@/composables/useDeleteRecurringEvent'

/**
 * Modal per la cancellazione di eventi ricorrenti
 *
 * Fornisce 4 opzioni di cancellazione:
 * - THIS: Solo l'evento selezionato
 * - THIS_AND_FOLLOWING: Evento selezionato e tutti i successivi
 * - THIS_AND_PREVIOUS: Evento selezionato e tutti i precedenti
 * - ALL_SERIES: Tutta la serie ricorrente
 */

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

const emit = defineEmits(['close', 'deleted'])

// Composable per gestione eventi
const {
  eliminaEvento,
  eliminaEventiRicorrenti,
  getEventiSerie,
  Direction
} = useCalendario()

// Composable per verificare ricorrenza
const {
  checkIsEventoRicorrente
} = useDeleteRecurringEvent()

// Stato locale
const selectedOption = ref('')
const deleting = ref(false)
const deleteError = ref('')

// Computed per verificare se è evento ricorrente
const isEventoRicorrente = computed(() => {
  return checkIsEventoRicorrente(props.evento)
})

// Computed per mappare le opzioni alla Direction enum
const directionMapping = computed(() => ({
  'THIS': Direction.THIS,
  'THIS_AND_FOLLOWING': Direction.THIS_AND_FOLLOWING,
  'THIS_AND_PREVIOUS': Direction.THIS_AND_PREVIOUS,
  'ALL_SERIES': Direction.ALL_SERIES
}))

/**
 * Formatta la data dell'evento per il display
 * @param {Object} evento - Evento da formattare
 * @returns {string} Data formattata
 */
const formatDataEvento = (evento) => {
  if (!evento) return ''

  try {
    let data
    let oraInizio, oraFine

    // Gestisce sia nuova che vecchia struttura dati
    if (evento.date && evento.timeStart && evento.timeEnd) {
      // Nuova struttura
      data = new Date(evento.date)
      oraInizio = evento.timeStart
      oraFine = evento.timeEnd
    } else if (evento.dataInizio && evento.dataFine) {
      // Vecchia struttura
      const dataInizio = new Date(evento.dataInizio)
      const dataFineDate = new Date(evento.dataFine)

      data = dataInizio
      oraInizio = dataInizio.toTimeString().slice(0, 5)
      oraFine = dataFineDate.toTimeString().slice(0, 5)
    } else {
      return 'Data non disponibile'
    }

    return `${data.toLocaleDateString('it-IT')} dalle ${oraInizio} alle ${oraFine}`
  } catch (error) {
    console.error('Errore nel formato data evento:', error)
    return 'Data non valida'
  }
}

/**
 * Formatta la data completa per le opzioni
 * @param {Object} evento - Evento da formattare
 * @returns {string} Data formattata
 */
const formatDataCompleta = (evento) => {
  if (!evento) return ''

  try {
    let data

    // Gestisce sia nuova che vecchia struttura dati
    if (evento.date) {
      data = new Date(evento.date)
    } else if (evento.dataInizio) {
      data = new Date(evento.dataInizio)
    } else {
      return 'data non disponibile'
    }

    return data.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Errore nel formato data completa:', error)
    return 'data non valida'
  }
}

/**
 * Genera la descrizione dell'impatto della cancellazione
 * @returns {string} Descrizione impatto
 */
const getImpactDescription = () => {
  if (!selectedOption.value || !props.evento) return ''

  try {
    // Ottieni tutti gli eventi della serie per calcolare l'impatto
    const eventiSerie = getEventiSerie(props.evento)
    const eventoCorrente = props.evento
    const dataCorrente = new Date(eventoCorrente.date || eventoCorrente.dataInizio)

    switch (selectedOption.value) {
      case 'THIS':
        return 'Verrà cancellato solo questo evento. Tutti gli altri appuntamenti della serie rimangono confermati.'

      case 'THIS_AND_FOLLOWING': {
        const eventiSuccessivi = eventiSerie.filter(evento => {
          const dataEvento = new Date(evento.date || evento.dataInizio)
          return dataEvento >= dataCorrente
        })
        const numeroSuccessivi = eventiSuccessivi.length

        return `Verranno cancellati ${numeroSuccessivi} eventi (incluso questo) a partire da oggi in poi.`
      }

      case 'THIS_AND_PREVIOUS': {
        const eventiPrecedenti = eventiSerie.filter(evento => {
          const dataEvento = new Date(evento.date || evento.dataInizio)
          return dataEvento <= dataCorrente
        })
        const numeroPrecedenti = eventiPrecedenti.length

        return `Verranno cancellati ${numeroPrecedenti} eventi (incluso questo) fino a oggi compreso.`
      }

      case 'ALL_SERIES': {
        const totaleEventi = eventiSerie.length
        return `Verranno cancellati TUTTI i ${totaleEventi} eventi della serie ricorrente.`
      }

      default:
        return ''
    }
  } catch (error) {
    console.error('Errore nel calcolo impatto:', error)
    return 'Impossibile calcolare l\'impatto. Procedere con cautela.'
  }
}

/**
 * Gestisce la cancellazione dell'evento
 */
const handleDelete = async () => {
  if (isEventoRicorrente.value && !selectedOption.value) {
    // Per eventi ricorrenti, richiedi selezione opzione
    return
  }

  if (!props.evento?.id) return

  deleting.value = true
  deleteError.value = ''

  try {
    if (isEventoRicorrente.value) {
      // Gestione evento ricorrente con opzioni
      console.log('🗑️ [DeleteRecurringModal] Avvio cancellazione ricorrente:', {
        eventoId: props.evento.id,
        opzione: selectedOption.value,
        direction: directionMapping.value[selectedOption.value]
      })

      // Mappa l'opzione alla Direction enum
      const direction = directionMapping.value[selectedOption.value]

      if (!direction) {
        throw new Error('Opzione di cancellazione non valida')
      }

      // Usa la funzione del composable per cancellare
      const eventiEliminati = await eliminaEventiRicorrenti(props.evento.id, direction)

      console.log('✅ [DeleteRecurringModal] Cancellazione ricorrente completata:', {
        eventiEliminati: eventiEliminati.length,
        ids: eventiEliminati
      })

      // Emetti evento di successo
      emit('deleted', {
        eventoId: props.evento.id,
        option: selectedOption.value,
        direction: direction,
        deletedIds: eventiEliminati
      })
    } else {
      // Gestione evento singolo
      console.log('🗑️ [DeleteRecurringModal] Avvio cancellazione evento singolo:', props.evento.id)

      await eliminaEvento(props.evento.id)

      console.log('✅ [DeleteRecurringModal] Evento singolo cancellato')

      // Emetti evento di successo per evento singolo
      emit('deleted', props.evento.id)
    }

    // Chiudi la modal
    handleClose()

  } catch (error) {
    console.error('❌ [DeleteRecurringModal] Errore cancellazione:', error)
    deleteError.value = 'Errore durante la cancellazione degli eventi. Riprova.'
  } finally {
    deleting.value = false
  }
}

/**
 * Gestisce la chiusura della modal
 */
const handleClose = () => {
  if (deleting.value) return

  // Reset stato
  selectedOption.value = ''
  deleteError.value = ''

  // Emetti evento di chiusura
  emit('close')
}

</script>

<style scoped>
/* Modal container */
.delete-recurring-modal :deep(.modal-content) {
  border: none;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.delete-recurring-modal :deep(.modal-header) {
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.delete-recurring-modal :deep(.modal-body) {
  padding: 1rem 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.delete-recurring-modal :deep(.modal-footer) {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

/* Informazioni evento */
.evento-info {
  background-color: var(--cui-gray-50);
  border: 2px solid var(--cui-border-color);
  border-radius: 12px;
  padding: 1rem;
  border-left: 4px solid var(--cui-primary);
}

.info-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--cui-primary-rgb), 0.1);
  border-radius: 8px;
  flex-shrink: 0;
}

/* Sezione titolo */
.section-title {
  color: var(--cui-body-color);
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--cui-border-color);
}

/* Opzioni di cancellazione */
.option-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-card {
  border: 2px solid var(--cui-border-color);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--cui-body-bg);
}

.option-card:hover {
  border-color: rgba(var(--cui-primary-rgb), 0.5);
  background-color: rgba(var(--cui-primary-rgb), 0.02);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.option-card.selected {
  border-color: var(--cui-primary);
  background-color: rgba(var(--cui-primary-rgb), 0.05);
  box-shadow: 0 0 0 3px rgba(var(--cui-primary-rgb), 0.1);
}

.option-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.option-radio {
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.option-radio :deep(.form-check-input) {
  cursor: pointer;
  border: 2px solid var(--cui-border-color);
  transition: all 0.2s ease;
}

.option-radio :deep(.form-check-input:checked) {
  background-color: var(--cui-primary);
  border-color: var(--cui-primary);
}

.option-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
  margin-top: -0.25rem;
}

.option-icon.text-info {
  background-color: rgba(var(--cui-info-rgb), 0.1);
}

.option-icon.text-warning {
  background-color: rgba(var(--cui-warning-rgb), 0.1);
}

.option-icon.text-secondary {
  background-color: rgba(var(--cui-secondary-rgb), 0.1);
}

.option-icon.text-danger {
  background-color: rgba(var(--cui-danger-rgb), 0.1);
}

.option-info {
  flex: 1;
  min-width: 0;
}

.option-title {
  font-weight: 600;
  color: var(--cui-body-color);
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.option-description {
  color: var(--cui-text-muted);
  font-size: 0.85rem;
  line-height: 1.4;
}

.option-footer {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--cui-border-color);
}

/* Anteprima impatto */
.impact-preview {
  animation: impactSlideIn 0.3s ease-out;
}

@keyframes impactSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.preview-card {
  background-color: rgba(var(--cui-info-rgb), 0.05);
  border: 2px solid rgba(var(--cui-info-rgb), 0.2);
  border-radius: 12px;
  padding: 1rem;
  border-left: 4px solid var(--cui-info);
}

.impact-text {
  color: var(--cui-body-color);
  font-size: 0.875rem;
  line-height: 1.5;
  margin-top: 0.5rem;
}

/* Bottoni */
.delete-recurring-modal .btn {
  border-radius: 8px;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.delete-recurring-modal .btn-danger {
  background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%);
  border: none;
  box-shadow: 0 4px 6px -1px rgba(220, 53, 69, 0.2);
}

.delete-recurring-modal .btn-danger:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 10px -1px rgba(220, 53, 69, 0.3);
}

.delete-recurring-modal .btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-recurring-modal .btn-outline-light {
  border: 2px solid var(--cui-border-color);
  color: var(--cui-text-muted);
}

.delete-recurring-modal .btn-outline-light:hover {
  background-color: var(--cui-gray-100);
  border-color: var(--cui-border-color);
  color: var(--cui-body-color);
}

/* Alert */
.delete-recurring-modal .alert {
  border-radius: 12px;
  border: none;
  font-size: 0.875rem;
}

.delete-recurring-modal .alert-warning {
  background-color: rgba(var(--cui-warning-rgb), 0.1);
  color: var(--cui-body-color);
  border-left: 4px solid var(--cui-warning);
}

.delete-recurring-modal .alert-danger {
  background-color: rgba(var(--cui-danger-rgb), 0.1);
  color: var(--cui-danger);
  border-left: 4px solid var(--cui-danger);
}

/* Responsive */
@media (max-width: 768px) {
  .delete-recurring-modal :deep(.modal-dialog) {
    margin: 0.5rem;
  }

  .delete-recurring-modal :deep(.modal-header),
  .delete-recurring-modal :deep(.modal-body),
  .delete-recurring-modal :deep(.modal-footer) {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .option-cards {
    gap: 0.5rem;
  }

  .option-card {
    padding: 0.75rem;
  }

  .option-header {
    gap: 0.5rem;
  }

  .option-icon {
    width: 36px;
    height: 36px;
  }

  .option-title {
    font-size: 0.85rem;
  }

  .option-description {
    font-size: 0.8rem;
  }

  .preview-card {
    padding: 0.75rem;
  }

  .impact-text {
    font-size: 0.8rem;
  }
}

/* Animazioni */
.delete-recurring-modal :deep(.modal-content) {
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .evento-info {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .option-card {
    background-color: rgba(255, 255, 255, 0.02);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .option-card:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .preview-card {
    background-color: rgba(255, 255, 255, 0.03);
    border-color: rgba(var(--cui-info-rgb), 0.3);
  }
}
</style>
