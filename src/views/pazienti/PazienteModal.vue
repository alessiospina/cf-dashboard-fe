<template>
  <CModal :visible="visible" @close="handleClose" size="lg" class="paziente-modal-simple">
    <CModalHeader class="border-0 pb-0">
      <CModalTitle class="h5 fw-bold text-dark">
        <CIcon :icon="isEdit ? 'cil-pencil' : 'cil-user-plus'" class="me-2 text-primary"/>
        {{ isEdit ? 'Modifica Paziente' : 'Nuovo Paziente' }}
      </CModalTitle>
    </CModalHeader>

    <CModalBody class="pt-2">
      <CForm @submit.prevent="handleSubmit">

        <!-- Sezione Dati Anagrafici -->
        <div class="form-section mb-4">
          <h6 class="section-title">Dati Anagrafici</h6>
          <CRow class="g-3">
            <CCol md="6">
              <div class="input-group-with-icon">
                <CIcon icon="cil-user" class="input-icon"/>
                <div class="input-content">
                  <CFormLabel class="form-label-clean">Nome</CFormLabel>
                  <CFormInput
                    v-model="form.nome"
                    :invalid="!!errors.nome"
                    placeholder="Inserisci il nome"
                    class="form-control-clean"
                    required
                  />
                  <CFormFeedback v-if="errors.nome" invalid>{{ errors.nome }}</CFormFeedback>
                </div>
              </div>
            </CCol>
            <CCol md="6">
              <div class="input-group-with-icon">
                <CIcon icon="cil-people" class="input-icon"/>
                <div class="input-content">
                  <CFormLabel class="form-label-clean">Cognome</CFormLabel>
                  <CFormInput
                    v-model="form.cognome"
                    :invalid="!!errors.cognome"
                    placeholder="Inserisci il cognome"
                    class="form-control-clean"
                    required
                  />
                  <CFormFeedback v-if="errors.cognome" invalid>{{ errors.cognome }}</CFormFeedback>
                </div>
              </div>
            </CCol>
            <CCol md="6">
              <div class="input-group-with-icon">
                <CIcon icon="cil-calendar" class="input-icon"/>
                <div class="input-content">
                  <CFormLabel class="form-label-clean">Data di nascita</CFormLabel>
                  <CFormInput
                    v-model="form.dataDiNascita"
                    type="date"
                    :invalid="!!errors.dataDiNascita"
                    class="form-control-clean"
                    required
                  />
                  <CFormFeedback v-if="errors.dataDiNascita" invalid>{{ errors.dataDiNascita }}</CFormFeedback>
                </div>
              </div>
            </CCol>
            <CCol md="6">
              <div class="input-group-with-icon">
                <CIcon icon="cil-file" class="input-icon"/>
                <div class="input-content">
                  <CFormLabel class="form-label-clean">Codice fiscale</CFormLabel>
                  <CFormInput
                    v-model="form.codiceFiscale"
                    :invalid="!!errors.codiceFiscale"
                    placeholder="RSSMRA80A01H501Z"
                    maxlength="16"
                    class="form-control-clean codice-fiscale"
                    required
                  />
                  <CFormFeedback v-if="errors.codiceFiscale" invalid>{{ errors.codiceFiscale }}</CFormFeedback>
                </div>
              </div>
            </CCol>
          </CRow>
        </div>

        <!-- Sezione Contatti -->
        <div class="form-section mb-4">
          <h6 class="section-title">Contatti</h6>
          <CRow class="g-3">
            <CCol md="6">
              <div class="input-group-with-icon">
                <CIcon icon="cil-envelope-closed" class="input-icon"/>
                <div class="input-content">
                  <CFormLabel class="form-label-clean">Email</CFormLabel>
                  <CFormInput
                    v-model="form.email"
                    type="email"
                    :invalid="!!errors.email"
                    placeholder="nome@example.com"
                    class="form-control-clean"
                    required
                  />
                  <CFormFeedback v-if="errors.email" invalid>{{ errors.email }}</CFormFeedback>
                </div>
              </div>
            </CCol>
            <CCol md="6">
              <div class="input-group-with-icon">
                <CIcon icon="cil-phone" class="input-icon"/>
                <div class="input-content">
                  <CFormLabel class="form-label-clean">Telefono (opzionale)</CFormLabel>
                  <CFormInput
                    v-model="form.telefono"
                    type="tel"
                    placeholder="123 456 7890"
                    class="form-control-clean"
                  />
                </div>
              </div>
            </CCol>
            <CCol cols="12">
              <div class="input-group-with-icon">
                <CIcon icon="cil-location-pin" class="input-icon"/>
                <div class="input-content">
                  <CFormLabel class="form-label-clean">Indirizzo (opzionale)</CFormLabel>
                  <CFormInput
                    v-model="form.indirizzo"
                    placeholder="Via Roma, 123 - 80100 Napoli"
                    class="form-control-clean"
                  />
                </div>
              </div>
            </CCol>
          </CRow>
        </div>

        <!-- Anteprima Paziente -->
        <div v-if="form.nome || form.cognome" class="input-group-with-icon mb-4">
          <CIcon icon="cil-user" class="input-icon text-success"/>
          <div class="input-content">
            <div class="paziente-preview">
              <div class="d-flex align-items-center">
                <span class="me-2">Anteprima:</span>
                <strong>{{ form.nome }} {{ form.cognome }}</strong>
                <span v-if="form.email" class="text-muted ms-2">({{ form.email }})</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Errore generale -->
        <CAlert v-if="submitError" color="danger" class="mb-0">
          <CIcon icon="cil-warning" class="me-2"/>
          {{ submitError }}
        </CAlert>
      </CForm>
    </CModalBody>

    <CModalFooter class="border-0 pt-0">
      <div class="d-flex gap-2 w-100">
        <CButton
          color="light"
          variant="outline"
          @click="handleClose"
          :disabled="submitting"
          class="flex-grow-1"
        >
          Annulla
        </CButton>

        <CButton
          color="primary"
          @click="handleSubmit"
          :disabled="submitting"
          class="flex-grow-1"
        >
          <CSpinner v-if="submitting" size="sm" class="me-2"/>
          <CIcon v-else :icon="isEdit ? 'cil-save' : 'cil-user-plus'" class="me-2"/>
          {{ isEdit ? 'Salva Modifiche' : 'Crea Paziente' }}
        </CButton>
      </div>
    </CModalFooter>
  </CModal>
</template>

<script setup>
/**
 * Componente Modale Migliorato per Paziente
 *
 * Questo componente gestisce sia la creazione che la modifica di un paziente
 * con un'interfaccia moderna conforme ai temi CoreUI.
 *
 * Miglioramenti implementati:
 * - Layout semplificato senza colonne
 * - Icone CoreUI per ogni campo input
 * - Colori conformi alla sidebar (colorScheme dark)
 * - Classi CoreUI native per dark/light mode
 * - Raggruppamento logico in sezioni con CCard
 * - Design responsivo e accessibile
 */

import { ref, reactive, computed, watch } from 'vue'
import { usePazienti } from '@/composables/usePazienti'

// Props: dati che arrivano dal componente padre
const props = defineProps({
  // Controlla se la modale è visibile
  visible: {
    type: Boolean,
    default: false
  },
  // Paziente da modificare (null per creazione)
  paziente: {
    type: Object,
    default: null
  }
})

// Emits: eventi che il componente può inviare al padre
const emit = defineEmits([
  'close',           // Chiusura modale
  'created',         // Paziente creato
  'updated'          // Paziente aggiornato
])

// Composable per la logica dei pazienti
const {
  validatePazienteForm,
  createPaziente,
  updatePaziente
  // TIPI_TERAPIA_OPTIONS rimosso - non più necessario
} = usePazienti()

// Computed: determina se siamo in modalità modifica
const isEdit = computed(() => !!props.paziente?.id)

// Stato reattivo del form
const form = reactive({
  nome: '',
  cognome: '',
  dataDiNascita: '',
  indirizzo: '',
  codiceFiscale: '',
  email: '',
  telefono: ''
  // tipoTerapia rimosso - non più necessario per il paziente
})

// Stato per errori di validazione
const errors = ref({})

// Stato per il salvataggio
const submitting = ref(false)
const submitError = ref('')

// Funzione per resettare il form
const resetForm = () => {
  Object.keys(form).forEach(key => {
    form[key] = ''
  })
  errors.value = {}
  submitError.value = ''
}

// Funzione per popolare il form con i dati del paziente (in modifica)
const populateForm = (paziente) => {
  if (paziente) {
    form.nome = paziente.nome || ''
    form.cognome = paziente.cognome || ''
    // Formattiamo la data per l'input date
    form.dataDiNascita = paziente.dataDiNascita ?
      new Date(paziente.dataDiNascita).toISOString().split('T')[0] : ''
    form.indirizzo = paziente.indirizzo || ''
    form.codiceFiscale = paziente.codiceFiscale || ''
    form.email = paziente.email || ''
    form.telefono = paziente.telefono || ''
    // tipoTerapia rimosso - non più associato al paziente
  }
}

// Watch: osserva i cambiamenti nelle props
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      // Quando la modale si apre
      if (isEdit.value) {
        populateForm(props.paziente)
      } else {
        resetForm()
      }
    }
  },
  { immediate: true }
)

// Gestione chiusura modale con controlli di sicurezza
const handleClose = () => {
  // Impedisce la chiusura durante il salvataggio
  if (submitting.value) {
    return
  }

  // Reset del form e chiusura
  resetForm()
  emit('close')
}

// Gestione submit del form
const handleSubmit = async () => {
  // Reset errori precedenti
  errors.value = {}
  submitError.value = ''

  // Validazione
  const validation = validatePazienteForm(form)

  if (!validation.isValid) {
    errors.value = validation.errors
    return
  }

  submitting.value = true

  try {
    // Prepariamo i dati da inviare
    const pazienteData = {
      nome: form.nome.trim(),
      cognome: form.cognome.trim(),
      dataDiNascita: form.dataDiNascita,
      indirizzo: form.indirizzo?.trim() || null,
      codiceFiscale: form.codiceFiscale.toUpperCase().trim(),
      email: form.email.trim(),
      telefono: form.telefono?.trim() || null
      // tipoTerapia rimosso - non più necessario per il paziente
    }

    if (isEdit.value) {
      // Modifica paziente esistente
      pazienteData.id = props.paziente.id
      const updatedPaziente = await updatePaziente(pazienteData)
      emit('updated', updatedPaziente)
    } else {
      // Crea nuovo paziente
      const newPaziente = await createPaziente(pazienteData)
      emit('created', newPaziente)
    }

    // Chiudi modale automaticamente dopo successo
    handleClose()

  } catch (error) {
    // Gestione errori
    console.error('Errore nel salvataggio:', error)

    if (error.response?.data?.message) {
      submitError.value = error.response.data.message
    } else {
      submitError.value = 'Si è verificato un errore durante il salvataggio'
    }
  } finally {
    submitting.value = false
  }
}

// Auto-conversione in maiuscolo solo per codice fiscale
watch(
  () => form.codiceFiscale,
  (newCodiceFiscale) => {
    if (newCodiceFiscale) {
      form.codiceFiscale = newCodiceFiscale.toUpperCase()
    }
  }
)

// Conversione email in minuscolo
watch(
  () => form.email,
  (newEmail) => {
    if (newEmail) {
      form.email = newEmail.toLowerCase()
    }
  }
)
</script>

<style scoped>
/* Design semplificato per la modal paziente */
.paziente-modal-simple :deep(.modal-content) {
  border: none;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.paziente-modal-simple :deep(.modal-header) {
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.paziente-modal-simple :deep(.modal-body) {
  padding: 1rem 1.5rem;
}

.paziente-modal-simple :deep(.modal-footer) {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

/* Sezioni del form */
.form-section {
  position: relative;
}

.section-title {
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f3f4f6;
}

/* Labels pulite */
.form-label-clean {
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

/* Input puliti */
.form-control-clean {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background-color: #ffffff;
}

.form-control-clean:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background-color: #ffffff;
}

.form-control-clean:invalid {
  border-color: #ef4444;
}

/* Stile speciale per codice fiscale */
.codice-fiscale {
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  font-weight: 600;
  text-transform: uppercase;
}

/* Input group con icone */
.input-group-with-icon {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0;
}

.input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #f3f4f6;
  color: #6b7280;
  flex-shrink: 0;
  margin-top: 1.625rem; /* Posizionamento perfettamente centrato sull'input text */
  transition: all 0.2s ease;
}

.input-icon.text-success {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.input-content {
  flex: 1;
}

/* Anteprima paziente */
.paziente-preview {
  background-color: #f8fafc;
  border: 2px solid #e5e7eb;
  border-left: 4px solid #10b981;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

/* Icone specifiche per display elements */
.paziente-preview .input-icon {
  margin-top: 0; /* Nessun margine per le icone accanto ai display boxes */
  align-self: flex-start;
}

/* Bottoni */
.paziente-modal-simple .btn {
  border-radius: 8px;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.paziente-modal-simple .btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
}

.paziente-modal-simple .btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 10px -1px rgba(59, 130, 246, 0.3);
}

.paziente-modal-simple .btn-outline-light {
  border: 2px solid #e5e7eb;
  color: #6b7280;
}

.paziente-modal-simple .btn-outline-light:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

/* Responsive */
@media (max-width: 768px) {
  .paziente-modal-simple :deep(.modal-dialog) {
    margin: 0.5rem;
  }

  .paziente-modal-simple :deep(.modal-header),
  .paziente-modal-simple :deep(.modal-body),
  .paziente-modal-simple :deep(.modal-footer) {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* Animazioni */
.paziente-modal-simple :deep(.modal-content) {
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

/* Alert semplificato */
.paziente-modal-simple .alert {
  border-radius: 8px;
  border: none;
  font-size: 0.875rem;
}

.paziente-modal-simple .alert-danger {
  background-color: #fef2f2;
  color: #dc2626;
  border-left: 4px solid #dc2626;
}

/* Effetti hover sui campi */
.form-control-clean:hover:not(:focus) {
  border-color: #d1d5db;
}

/* Focus ring migliorato */
.form-control-clean:focus {
  outline: none;
}

/* Responsive per le icone */
@media (max-width: 768px) {
  .paziente-modal-simple :deep(.modal-dialog) {
    margin: 0.5rem;
  }

  .paziente-modal-simple :deep(.modal-header),
  .paziente-modal-simple :deep(.modal-body),
  .paziente-modal-simple :deep(.modal-footer) {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .input-group-with-icon {
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-icon {
    align-self: flex-start;
    margin-top: 0;
    width: 36px;
    height: 36px;
  }
}
</style>
