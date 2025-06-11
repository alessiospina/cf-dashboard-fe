<template>
  <CModal :visible="visible" @close="handleClose" size="xl" class="event-modal">
    <CModalHeader class="bg-primary text-white">
      <CModalTitle class="d-flex align-items-center">
        <CIcon :icon="isEdit ? 'cil-pencil' : 'cil-plus'" class="me-2" />
        {{ isEdit ? 'Modifica Appuntamento' : 'Nuovo Appuntamento' }}
      </CModalTitle>
    </CModalHeader>

    <CModalBody>
      <CForm @submit.prevent="handleSubmit">
        <!-- Informazioni Evento (Backend) -->
        <CCard class="mb-3">
          <CCardHeader>
            <h6 class="mb-0">
              <CIcon icon="cil-calendar" class="me-2" />
              Informazioni Evento
            </h6>
          </CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Titolo Evento</CFormLabel>
                  <CFormInput
                    v-model="form.titolo"
                    :invalid="!!errors.titolo"
                    placeholder="Es: Sessione di Logopedia"
                    maxlength="50"
                    required
                  />
                  <CFormFeedback v-if="errors.titolo" invalid>{{ errors.titolo }}</CFormFeedback>
                </div>
              </CCol>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Stanza</CFormLabel>
                  <CFormInput
                    v-model="form.stanza"
                    :invalid="!!errors.stanza"
                    placeholder="Es: Sala 1"
                    maxlength="50"
                    required
                  />
                  <CFormFeedback v-if="errors.stanza" invalid>{{ errors.stanza }}</CFormFeedback>
                </div>
              </CCol>
            </CRow>

            <div class="mb-3">
              <CFormLabel class="fw-semibold">Professionista</CFormLabel>
              <CFormInput
                v-model="form.professionista"
                :invalid="!!errors.professionista"
                placeholder="Nome Cognome del professionista"
                maxlength="50"
                required
              />
              <CFormFeedback v-if="errors.professionista" invalid>{{ errors.professionista }}</CFormFeedback>
            </div>

            <!-- Data e Orari -->
            <CRow>
              <CCol md="4">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Data</CFormLabel>
                  <CFormInput v-model="form.data" type="date" :invalid="!!errors.data" required />
                  <CFormFeedback v-if="errors.data" invalid>{{ errors.data }}</CFormFeedback>
                </div>
              </CCol>
              <CCol md="4">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Ora Inizio</CFormLabel>
                  <CFormInput v-model="form.oraInizio" type="time" :invalid="!!errors.oraInizio" required />
                  <CFormFeedback v-if="errors.oraInizio" invalid>{{ errors.oraInizio }}</CFormFeedback>
                </div>
              </CCol>
              <CCol md="4">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Ora Fine</CFormLabel>
                  <CFormInput v-model="form.oraFine" type="time" :invalid="!!errors.oraFine" required />
                  <CFormFeedback v-if="errors.oraFine" invalid>{{ errors.oraFine }}</CFormFeedback>
                </div>
              </CCol>
            </CRow>

            <CRow>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Posti Disponibili</CFormLabel>
                  <CFormInput
                    v-model.number="form.postiDisponibili"
                    type="number"
                    min="1"
                    max="50"
                    :invalid="!!errors.postiDisponibili"
                    required
                  />
                  <CFormFeedback v-if="errors.postiDisponibili" invalid>{{ errors.postiDisponibili }}</CFormFeedback>
                </div>
              </CCol>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Frequenza Evento</CFormLabel>
                  <CFormSelect v-model="form.frequenza" :invalid="!!errors.frequenza" required>
                    <option v-for="freq in FREQUENZA_EVENTO_OPTIONS" :key="freq.value" :value="freq.value">
                      {{ freq.label }}
                    </option>
                  </CFormSelect>
                  <CFormFeedback v-if="errors.frequenza" invalid>{{ errors.frequenza }}</CFormFeedback>
                </div>
              </CCol>
            </CRow>

            <!-- Data Fine Ripetizione - Solo se frequenza non è UNICA -->
            <div v-if="form.frequenza !== FrequenzaEvento.UNICA" class="mb-3">
              <CFormLabel class="fw-semibold">Data Fine Ripetizione</CFormLabel>
              <CFormInput
                v-model="form.dataFineRipetizione"
                type="date"
                :invalid="!!errors.dataFineRipetizione"
                :required="form.frequenza !== FrequenzaEvento.UNICA"
              />
              <CFormFeedback v-if="errors.dataFineRipetizione" invalid>{{ errors.dataFineRipetizione }}</CFormFeedback>
              <CFormText class="text-muted">
                La data fino alla quale l'evento si ripeterà secondo la frequenza selezionata
              </CFormText>
            </div>
          </CCardBody>
        </CCard>

        <!-- Configurazione Frontend -->
        <CCard class="mb-3">
          <CCardHeader>
            <h6 class="mb-0">
              <CIcon icon="cil-settings" class="me-2" />
              Configurazione Display
            </h6>
          </CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Specialista (per visualizzazione)</CFormLabel>
                  <CFormSelect v-model="form.specialistaId" :invalid="!!errors.specialistaId">
                    <option value="">Seleziona specialista</option>
                    <option v-for="specialista in specialisti" :key="specialista.id" :value="specialista.id">
                      {{ specialista.nome }} {{ specialista.cognome }} - {{ formatTipoTerapia(specialista.specializzazione) }}
                    </option>
                  </CFormSelect>
                  <CFormFeedback v-if="errors.specialistaId" invalid>{{ errors.specialistaId }}</CFormFeedback>
                  <CFormText class="text-muted">
                    Seleziona per associazione con specialista esistente
                  </CFormText>
                </div>
              </CCol>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Tipo Terapia (per categorizzazione)</CFormLabel>
                  <CFormSelect v-model="form.tipoTerapia" :invalid="!!errors.tipoTerapia">
                    <option value="">Seleziona tipo terapia</option>
                    <option v-for="terapia in TIPI_TERAPIA_OPTIONS" :key="terapia.value" :value="terapia.value">
                      {{ terapia.label }}
                    </option>
                  </CFormSelect>
                  <CFormFeedback v-if="errors.tipoTerapia" invalid>{{ errors.tipoTerapia }}</CFormFeedback>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <!-- Informazioni Paziente -->
        <CCard class="mb-3">
          <CCardHeader>
            <h6 class="mb-0">
              <CIcon icon="cil-user" class="me-2" />
              Paziente (opzionale per prenotazione)
            </h6>
          </CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Nome</CFormLabel>
                  <CFormInput
                    v-model="form.nomePaziente"
                    :invalid="!!errors.nomePaziente"
                    placeholder="Nome paziente"
                  />
                  <CFormFeedback v-if="errors.nomePaziente" invalid>{{ errors.nomePaziente }}</CFormFeedback>
                </div>
              </CCol>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Cognome</CFormLabel>
                  <CFormInput
                    v-model="form.cognomePaziente"
                    :invalid="!!errors.cognomePaziente"
                    placeholder="Cognome paziente"
                  />
                  <CFormFeedback v-if="errors.cognomePaziente" invalid>{{ errors.cognomePaziente }}</CFormFeedback>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <!-- Dettagli Aggiuntivi -->
        <CCard>
          <CCardHeader>
            <h6 class="mb-0">
              <CIcon icon="cil-info" class="me-2" />
              Dettagli Aggiuntivi
            </h6>
          </CCardHeader>
          <CCardBody>
            <div class="mb-3">
              <CFormLabel class="fw-semibold">Stato</CFormLabel>
              <CFormSelect v-model="form.stato">
                <option value="confermato">Confermato</option>
                <option value="in_attesa">In Attesa</option>
                <option value="completato">Completato</option>
                <option value="cancellato">Cancellato</option>
              </CFormSelect>
            </div>

            <div class="mb-0">
              <CFormLabel class="fw-semibold">Note</CFormLabel>
              <CFormTextarea v-model="form.note" rows="3" placeholder="Note aggiuntive per l'appuntamento..." />
            </div>
          </CCardBody>
        </CCard>

        <!-- Errore generale -->
        <CAlert v-if="submitError" color="danger" class="mt-3">
          <CIcon icon="cil-warning" class="me-2" />
          {{ submitError }}
        </CAlert>
      </CForm>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" @click="handleClose" :disabled="submitting">
        <CIcon icon="cil-x" class="me-2" />
        Annulla
      </CButton>

      <CButton v-if="isEdit" color="danger" @click="handleDelete" :disabled="submitting" class="me-2">
        <CSpinner v-if="deleting" size="sm" class="me-2" />
        <CIcon v-else icon="cil-trash" class="me-2" />
        Elimina
      </CButton>

      <CButton color="primary" @click="handleSubmit" :disabled="submitting">
        <CSpinner v-if="submitting" size="sm" class="me-2" />
        <CIcon v-else :icon="isEdit ? 'cil-save' : 'cil-plus'" class="me-2" />
        {{ isEdit ? 'Salva' : 'Crea' }}
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useCalendario } from '@/composables/useCalendario'

const props = defineProps({
  visible: { type: Boolean, default: false },
  evento: { type: Object, default: null },
  specialisti: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'created', 'updated', 'deleted'])

const {
  creaEvento,
  aggiornaEvento,
  eliminaEvento,
  TIPI_TERAPIA_OPTIONS,
  FrequenzaEvento,
  FREQUENZA_EVENTO_OPTIONS,
  EventoMapper,
  EventoValidator
} = useCalendario()

const isEdit = computed(() => !!props.evento?.id)

const form = reactive({
  // Campi dell'evento (backend)
  titolo: '',
  stanza: '',
  professionista: '',
  postiDisponibili: 1,
  frequenza: FrequenzaEvento.UNICA,
  dataFineRipetizione: '',

  // Campi per l'interfaccia utente
  specialistaId: '',
  data: '',
  oraInizio: '',
  oraFine: '',
  tipoTerapia: '',
  nomePaziente: '',
  cognomePaziente: '',
  stato: 'confermato',
  note: ''
})

const errors = ref({})
const submitting = ref(false)
const deleting = ref(false)
const submitError = ref('')

const resetForm = () => {
  // Reset ai valori di default
  form.titolo = ''
  form.stanza = ''
  form.professionista = ''
  form.postiDisponibili = 1
  form.frequenza = FrequenzaEvento.UNICA
  form.dataFineRipetizione = ''

  form.specialistaId = ''
  form.data = ''
  form.oraInizio = ''
  form.oraFine = ''
  form.tipoTerapia = ''
  form.nomePaziente = ''
  form.cognomePaziente = ''
  form.stato = 'confermato'
  form.note = ''

  errors.value = {}
  submitError.value = ''
}

const populateForm = (evento) => {
  if (evento) {
    const dataInizio = new Date(evento.dataInizio)
    const dataFine = new Date(evento.dataFine)

    // Campi backend
    form.titolo = evento.titolo || `TERAPIA ${evento.tipoTerapia?.replace('_', ' ') || ''}`
    form.stanza = evento.sala || evento.stanza || ''
    form.professionista = evento.specialista?.nomeCompleto ||
                         `${evento.specialista?.nome || ''} ${evento.specialista?.cognome || ''}`.trim()
    form.postiDisponibili = evento.postiDisponibili || 1
    form.frequenza = evento.frequenza || FrequenzaEvento.UNICA
    form.dataFineRipetizione = evento.dataFineRipetizione ?
                              new Date(evento.dataFineRipetizione).toISOString().split('T')[0] : ''

    // Campi interfaccia
    form.specialistaId = evento.specialista?.id || ''
    form.data = dataInizio.toISOString().split('T')[0]
    form.oraInizio = dataInizio.toTimeString().slice(0, 5)
    form.oraFine = dataFine.toTimeString().slice(0, 5)
    form.tipoTerapia = evento.tipoTerapia || ''
    form.nomePaziente = evento.paziente?.nome || ''
    form.cognomePaziente = evento.paziente?.cognome || ''
    form.stato = evento.stato || 'confermato'
    form.note = evento.note || ''
  }
}

const validateForm = () => {
  const newErrors = {}

  // Validazione campi backend obbligatori
  if (!form.titolo) newErrors.titolo = 'Titolo obbligatorio'
  if (!form.stanza) newErrors.stanza = 'Stanza obbligatoria'
  if (!form.professionista) newErrors.professionista = 'Professionista obbligatorio'
  if (!form.postiDisponibili || form.postiDisponibili < 1) {
    newErrors.postiDisponibili = 'Posti disponibili deve essere almeno 1'
  }

  // Validazione campi interfaccia
  if (!form.data) newErrors.data = 'Data obbligatoria'
  if (!form.oraInizio) newErrors.oraInizio = 'Ora inizio obbligatoria'
  if (!form.oraFine) newErrors.oraFine = 'Ora fine obbligatoria'

  // Validazione logica date/orari
  if (form.oraInizio && form.oraFine && form.oraInizio >= form.oraFine) {
    newErrors.oraFine = 'Ora fine deve essere successiva all\'ora inizio'
  }

  // Validazione data fine ripetizione
  if (form.frequenza !== FrequenzaEvento.UNICA && !form.dataFineRipetizione) {
    newErrors.dataFineRipetizione = 'Data fine ripetizione obbligatoria per eventi ricorrenti'
  }

  if (form.dataFineRipetizione && form.data && form.dataFineRipetizione <= form.data) {
    newErrors.dataFineRipetizione = 'Data fine ripetizione deve essere successiva alla data evento'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  submitting.value = true
  submitError.value = ''

  try {
    const dataInizio = new Date(`${form.data}T${form.oraInizio}:00`)
    const dataFine = new Date(`${form.data}T${form.oraFine}:00`)

    // Preparazione dati evento con mapping backend
    const eventoData = {
      // Campi backend
      titolo: form.titolo,
      stanza: form.stanza,
      professionista: form.professionista,
      dataInizio: dataInizio.toISOString(),
      dataFine: dataFine.toISOString(),
      postiDisponibili: form.postiDisponibili,
      frequenza: form.frequenza,
      dataFineRipetizione: form.dataFineRipetizione ?
        new Date(`${form.dataFineRipetizione}T23:59:59`).toISOString() : null,

      // Campi per compatibilità frontend
      specialista: form.specialistaId ? {
        id: form.specialistaId,
        ...props.specialisti.find(s => s.id === form.specialistaId)
      } : {
        id: `temp-${Date.now()}`,
        nome: form.professionista.split(' ')[0] || '',
        cognome: form.professionista.split(' ').slice(1).join(' ') || '',
        nomeCompleto: form.professionista
      },
      paziente: (form.nomePaziente && form.cognomePaziente) ? {
        id: Date.now().toString(),
        nome: form.nomePaziente,
        cognome: form.cognomePaziente,
        nomeCompleto: `${form.nomePaziente} ${form.cognomePaziente}`
      } : null,
      tipoTerapia: form.tipoTerapia || 'LOGOPEDIA',
      stato: form.stato,
      sala: form.stanza, // Mapping per compatibilità
      note: form.note
    }

    if (isEdit.value) {
      eventoData.id = props.evento.id
      const updated = await aggiornaEvento(eventoData)
      emit('updated', updated)
    } else {
      const created = await creaEvento(eventoData)
      emit('created', created)
    }

    handleClose()

  } catch (error) {
    console.error('Errore salvataggio evento:', error)
    submitError.value = 'Errore nel salvataggio dell\'evento'
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  if (!props.evento?.id) return

  deleting.value = true

  try {
    await eliminaEvento(props.evento.id)
    emit('deleted', props.evento.id)
    handleClose()
  } catch (error) {
    console.error('Errore eliminazione evento:', error)
    submitError.value = 'Errore nell\'eliminazione dell\'evento'
  } finally {
    deleting.value = false
  }
}

const handleClose = () => {
  if (submitting.value || deleting.value) return
  resetForm()
  emit('close')
}

const formatTipoTerapia = (tipoTerapia) => {
  const labels = {
    'LOGOPEDIA': 'Logopedia',
    'NEUROPSICHIATRIA_INFANTILE': 'Neuropsichiatria Infantile',
    'NEUROPSICOMOTRICITÀ': 'Neuropsicomotricità',
    'TERAPIA_ABA': 'Terapia ABA',
    'PSICOLOGA': 'Psicologa',
    'COLLOQUIO_CONOSCITIVO': 'Colloquio Conoscitivo'
  }
  return labels[tipoTerapia] || tipoTerapia
}

// Auto-popolamento del professionista quando si seleziona uno specialista
watch(() => form.specialistaId, (newSpecialistaId) => {
  if (newSpecialistaId) {
    const specialista = props.specialisti.find(s => s.id === newSpecialistaId)
    if (specialista) {
      form.professionista = `${specialista.nome} ${specialista.cognome}`
      if (!form.tipoTerapia) {
        form.tipoTerapia = specialista.specializzazione
      }
      if (!form.titolo) {
        form.titolo = `Sessione di ${formatTipoTerapia(specialista.specializzazione)}`
      }
    }
  }
})

// Auto-popolamento del titolo quando si cambia tipo terapia
watch(() => form.tipoTerapia, (newTipoTerapia) => {
  if (newTipoTerapia && !form.titolo) {
    form.titolo = `Sessione di ${formatTipoTerapia(newTipoTerapia)}`
  }
})

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    if (isEdit.value) {
      populateForm(props.evento)
    } else {
      resetForm()
      if (props.evento?.dataInizio) {
        populateForm(props.evento)
      }
    }
  }
}, { immediate: true })
</script>

<style scoped>
/* Stili per la modal migliorata */
.event-modal :deep(.modal-content) {
  border-radius: 12px;
  overflow: hidden;
}

.event-modal .modal-header {
  border-bottom: none;
}

.event-modal .card-header {
  background-color: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
  padding: 0.75rem 1rem;
}

.event-modal .card-header h6 {
  color: #495057;
  font-weight: 600;
}

.event-modal .form-label {
  color: #495057;
  font-weight: 500;
}

.event-modal .form-control:focus,
.event-modal .form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

/* Separazione visiva tra sezioni */
.event-modal .card + .card {
  margin-top: 1rem;
}

/* Evidenziazione campi obbligatori backend */
.event-modal .card:first-of-type .form-label::after {
  content: " *";
  color: #dc3545;
}

/* Stile per campi condizionali */
.event-modal .form-text {
  font-size: 0.875em;
  margin-top: 0.25rem;
}
</style>
