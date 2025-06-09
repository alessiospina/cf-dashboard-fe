<template>
  <CModal :visible="visible" @close="handleClose" size="lg" class="event-modal">
    <CModalHeader class="bg-primary text-white">
      <CModalTitle class="d-flex align-items-center">
        <CIcon :icon="isEdit ? 'cil-pencil' : 'cil-plus'" class="me-2" />
        {{ isEdit ? 'Modifica Appuntamento' : 'Nuovo Appuntamento' }}
      </CModalTitle>
    </CModalHeader>

    <CModalBody>
      <CForm @submit.prevent="handleSubmit">
        <!-- Informazioni Appuntamento -->
        <CCard class="mb-3">
          <CCardHeader>
            <h6 class="mb-0">
              <CIcon icon="cil-calendar" class="me-2" />
              Informazioni Appuntamento
            </h6>
          </CCardHeader>
          <CCardBody>
            <!-- Specialista -->
            <div class="mb-3">
              <CFormLabel class="fw-semibold">Specialista</CFormLabel>
              <CFormSelect v-model="form.specialistaId" :invalid="!!errors.specialistaId" required>
                <option value="">Seleziona specialista</option>
                <option v-for="specialista in specialisti" :key="specialista.id" :value="specialista.id">
                  {{ specialista.nome }} {{ specialista.cognome }} - {{ formatTipoTerapia(specialista.specializzazione) }}
                </option>
              </CFormSelect>
              <CFormFeedback v-if="errors.specialistaId" invalid>{{ errors.specialistaId }}</CFormFeedback>
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

            <!-- Tipo Terapia -->
            <div class="mb-3">
              <CFormLabel class="fw-semibold">Tipo Terapia</CFormLabel>
              <CFormSelect v-model="form.tipoTerapia" :invalid="!!errors.tipoTerapia" required>
                <option value="">Seleziona tipo terapia</option>
                <option v-for="terapia in TIPI_TERAPIA_OPTIONS" :key="terapia.value" :value="terapia.value">
                  {{ terapia.label }}
                </option>
              </CFormSelect>
              <CFormFeedback v-if="errors.tipoTerapia" invalid>{{ errors.tipoTerapia }}</CFormFeedback>
            </div>
          </CCardBody>
        </CCard>

        <!-- Informazioni Paziente -->
        <CCard class="mb-3">
          <CCardHeader>
            <h6 class="mb-0">
              <CIcon icon="cil-user" class="me-2" />
              Paziente
            </h6>
          </CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Nome</CFormLabel>
                  <CFormInput v-model="form.nomePaziente" :invalid="!!errors.nomePaziente" placeholder="Nome paziente" required />
                  <CFormFeedback v-if="errors.nomePaziente" invalid>{{ errors.nomePaziente }}</CFormFeedback>
                </div>
              </CCol>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Cognome</CFormLabel>
                  <CFormInput v-model="form.cognomePaziente" :invalid="!!errors.cognomePaziente" placeholder="Cognome paziente" required />
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
              Dettagli
            </h6>
          </CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Stato</CFormLabel>
                  <CFormSelect v-model="form.stato">
                    <option value="confermato">Confermato</option>
                    <option value="in_attesa">In Attesa</option>
                    <option value="completato">Completato</option>
                    <option value="cancellato">Cancellato</option>
                  </CFormSelect>
                </div>
              </CCol>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Sala</CFormLabel>
                  <CFormInput v-model="form.sala" placeholder="Es: Sala 1" />
                </div>
              </CCol>
            </CRow>
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

const { creaEvento, aggiornaEvento, eliminaEvento, TIPI_TERAPIA_OPTIONS } = useCalendario()

const isEdit = computed(() => !!props.evento?.id)

const form = reactive({
  specialistaId: '', data: '', oraInizio: '', oraFine: '', tipoTerapia: '',
  nomePaziente: '', cognomePaziente: '', stato: 'confermato', sala: '', note: ''
})

const errors = ref({})
const submitting = ref(false)
const deleting = ref(false)
const submitError = ref('')

const resetForm = () => {
  Object.keys(form).forEach(key => {
    form[key] = key === 'stato' ? 'confermato' : ''
  })
  errors.value = {}
  submitError.value = ''
}

const populateForm = (evento) => {
  if (evento) {
    const dataInizio = new Date(evento.dataInizio)
    const dataFine = new Date(evento.dataFine)
    
    form.specialistaId = evento.specialista?.id || ''
    form.data = dataInizio.toISOString().split('T')[0]
    form.oraInizio = dataInizio.toTimeString().slice(0, 5)
    form.oraFine = dataFine.toTimeString().slice(0, 5)
    form.tipoTerapia = evento.tipoTerapia || ''
    form.nomePaziente = evento.paziente?.nome || ''
    form.cognomePaziente = evento.paziente?.cognome || ''
    form.stato = evento.stato || 'confermato'
    form.sala = evento.sala || ''
    form.note = evento.note || ''
  }
}

const validateForm = () => {
  const newErrors = {}
  
  if (!form.specialistaId) newErrors.specialistaId = 'Specialista obbligatorio'
  if (!form.data) newErrors.data = 'Data obbligatoria'
  if (!form.oraInizio) newErrors.oraInizio = 'Ora inizio obbligatoria'
  if (!form.oraFine) newErrors.oraFine = 'Ora fine obbligatoria'
  if (!form.tipoTerapia) newErrors.tipoTerapia = 'Tipo terapia obbligatorio'
  if (!form.nomePaziente) newErrors.nomePaziente = 'Nome paziente obbligatorio'
  if (!form.cognomePaziente) newErrors.cognomePaziente = 'Cognome paziente obbligatorio'
  
  if (form.oraInizio && form.oraFine && form.oraInizio >= form.oraFine) {
    newErrors.oraFine = 'Ora fine deve essere successiva all\'ora inizio'
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
    
    const eventoData = {
      specialista: {
        id: form.specialistaId,
        ...props.specialisti.find(s => s.id === form.specialistaId)
      },
      paziente: {
        id: Date.now().toString(),
        nome: form.nomePaziente,
        cognome: form.cognomePaziente,
        nomeCompleto: `${form.nomePaziente} ${form.cognomePaziente}`
      },
      dataInizio: dataInizio.toISOString(),
      dataFine: dataFine.toISOString(),
      tipoTerapia: form.tipoTerapia,
      titolo: `TERAPIA ${form.tipoTerapia.replace('_', ' ')}`,
      stato: form.stato,
      sala: form.sala,
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
.event-modal :deep(.modal-content) { border-radius: 12px; overflow: hidden; }
.event-modal .modal-header { border-bottom: none; }
.event-modal .card-header { background-color: #f8f9fa; border-bottom: 2px solid #e9ecef; padding: 0.75rem 1rem; }
.event-modal .card-header h6 { color: #495057; font-weight: 600; }
.event-modal .form-label { color: #495057; font-weight: 500; }
.event-modal .form-control:focus, .event-modal .form-select:focus { border-color: #0d6efd; box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25); }
</style>
