<template>
  <!--
    Modale migliorata per creare o modificare un paziente

    Miglioramenti implementati:
    - Layout semplificato con input in riga singola
    - Icone CoreUI intuitive per ogni campo
    - Design conforme ai temi CoreUI (dark/light mode)
    - Colori consistent con la sidebar
    - Raggruppamento logico dei campi
  -->
  <CModal
    :visible="visible"
    @close="handleClose"
    size="lg"
    class="paziente-modal"
  >
    <!-- Header della modale con colorScheme dark come la sidebar -->
    <CModalHeader class="modern-header bg-dark text-white border-bottom">
      <CModalTitle class="d-flex align-items-center">
        <CIcon
          :icon="isEdit ? 'cilPencil' : 'cilUserPlus'"
          class="me-2"
        />
        {{ isEdit ? 'Modifica Paziente' : 'Nuovo Paziente' }}
      </CModalTitle>
    </CModalHeader>

    <!-- Corpo della modale con il form migliorato -->
    <CModalBody class="modern-body">
      <CForm @submit.prevent="handleSubmit">

        <!-- Sezione: Dati Anagrafici -->
        <CCard class="form-section mb-3">
          <CCardHeader class="bg-body-secondary border-bottom">
            <h6 class="mb-0 d-flex align-items-center text-body">
              <CIcon icon="cilUser" class="me-2" />
              Dati Anagrafici
            </h6>
          </CCardHeader>
          <CCardBody>

            <!-- Campo Nome -->
            <div class="modern-input-group mb-3">
              <div class="input-icon bg-dark text-white">
                <CIcon icon="cilUser" />
              </div>
              <div class="input-wrapper">
                <CFormLabel for="nome" class="form-label fw-semibold text-body">Nome</CFormLabel>
                <CFormInput
                  id="nome"
                  v-model="form.nome"
                  :invalid="!!errors.nome"
                  placeholder="Inserisci il nome del paziente"
                  required
                  class="modern-input"
                />
                <CFormFeedback v-if="errors.nome" invalid>
                  {{ errors.nome }}
                </CFormFeedback>
              </div>
            </div>

            <!-- Campo Cognome -->
            <div class="modern-input-group mb-3">
              <div class="input-icon bg-dark text-white">
                <CIcon icon="cilPeople" />
              </div>
              <div class="input-wrapper">
                <CFormLabel for="cognome" class="form-label fw-semibold text-body">Cognome</CFormLabel>
                <CFormInput
                  id="cognome"
                  v-model="form.cognome"
                  :invalid="!!errors.cognome"
                  placeholder="Inserisci il cognome del paziente"
                  required
                  class="modern-input"
                />
                <CFormFeedback v-if="errors.cognome" invalid>
                  {{ errors.cognome }}
                </CFormFeedback>
              </div>
            </div>

            <!-- Campo Data di Nascita -->
            <div class="modern-input-group mb-3">
              <div class="input-icon bg-dark text-white">
                <CIcon icon="cilCalendar" />
              </div>
              <div class="input-wrapper">
                <CFormLabel for="dataDiNascita" class="form-label fw-semibold text-body">Data di Nascita</CFormLabel>
                <CFormInput
                  id="dataDiNascita"
                  v-model="form.dataDiNascita"
                  type="date"
                  :invalid="!!errors.dataDiNascita"
                  required
                  class="modern-input"
                />
                <CFormFeedback v-if="errors.dataDiNascita" invalid>
                  {{ errors.dataDiNascita }}
                </CFormFeedback>
              </div>
            </div>

            <!-- Campo Codice Fiscale -->
            <div class="modern-input-group mb-0">
              <div class="input-icon bg-dark text-white">
                <CIcon icon="cilFile" />
              </div>
              <div class="input-wrapper">
                <CFormLabel for="codiceFiscale" class="form-label fw-semibold text-body">Codice Fiscale</CFormLabel>
                <CFormInput
                  id="codiceFiscale"
                  v-model="form.codiceFiscale"
                  :invalid="!!errors.codiceFiscale"
                  placeholder="RSSMRA80A01H501Z"
                  maxlength="16"
                  style="text-transform: uppercase"
                  required
                  class="modern-input codice-fiscale"
                />
                <CFormFeedback v-if="errors.codiceFiscale" invalid>
                  {{ errors.codiceFiscale }}
                </CFormFeedback>
              </div>
            </div>
          </CCardBody>
        </CCard>

        <!-- Sezione: Contatti -->
        <CCard class="form-section mb-3">
          <CCardHeader class="bg-body-secondary border-bottom">
            <h6 class="mb-0 d-flex align-items-center text-body">
              <CIcon icon="cilAddressBook" class="me-2" />
              Contatti
            </h6>
          </CCardHeader>
          <CCardBody>

            <!-- Campo Email -->
            <div class="modern-input-group mb-3">
              <div class="input-icon bg-dark text-white">
                <CIcon icon="cilEnvelopeClosed" />
              </div>
              <div class="input-wrapper">
                <CFormLabel for="email" class="form-label fw-semibold text-body">Email</CFormLabel>
                <CFormInput
                  id="email"
                  v-model="form.email"
                  type="email"
                  :invalid="!!errors.email"
                  placeholder="nome@example.com"
                  required
                  class="modern-input"
                />
                <CFormFeedback v-if="errors.email" invalid>
                  {{ errors.email }}
                </CFormFeedback>
              </div>
            </div>

            <!-- Campo Telefono -->
            <div class="modern-input-group mb-3">
              <div class="input-icon bg-dark text-white">
                <CIcon icon="cilPhone" />
              </div>
              <div class="input-wrapper">
                <CFormLabel for="telefono" class="form-label optional fw-semibold text-body">Telefono</CFormLabel>
                <CFormInput
                  id="telefono"
                  v-model="form.telefono"
                  type="tel"
                  placeholder="123 456 7890"
                  class="modern-input"
                />
                <small class="text-body-secondary">Campo opzionale</small>
              </div>
            </div>

            <!-- Campo Indirizzo -->
            <div class="modern-input-group mb-0">
              <div class="input-icon bg-dark text-white">
                <CIcon icon="cilLocationPin" />
              </div>
              <div class="input-wrapper">
                <CFormLabel for="indirizzo" class="form-label optional fw-semibold text-body">Indirizzo</CFormLabel>
                <CFormInput
                  id="indirizzo"
                  v-model="form.indirizzo"
                  placeholder="Via Roma, 123 - 80100 Napoli"
                  class="modern-input"
                />
                <small class="text-body-secondary">Campo opzionale</small>
              </div>
            </div>
          </CCardBody>
        </CCard>

        <!-- Sezione: Terapia -->
        <CCard class="form-section">
          <CCardHeader class="bg-body-secondary border-bottom">
            <h6 class="mb-0 d-flex align-items-center text-body">
              <CIcon icon="cilHeart" class="me-2" />
              Informazioni Terapia
            </h6>
          </CCardHeader>
          <CCardBody>

            <!-- Campo Tipo di Terapia -->
            <div class="modern-input-group mb-0">
              <div class="input-icon bg-dark text-white">
                <CIcon icon="cilMedicalCross" />
              </div>
              <div class="input-wrapper">
                <CFormLabel for="tipoTerapia" class="form-label fw-semibold text-body">Tipo di Terapia</CFormLabel>
                <CFormSelect
                  id="tipoTerapia"
                  v-model="form.tipoTerapia"
                  :invalid="!!errors.tipoTerapia"
                  required
                  class="modern-input"
                >
                  <option value="">Seleziona un tipo di terapia</option>
                  <option
                    v-for="option in TIPI_TERAPIA_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </CFormSelect>
                <CFormFeedback v-if="errors.tipoTerapia" invalid>
                  {{ errors.tipoTerapia }}
                </CFormFeedback>
              </div>
            </div>
          </CCardBody>
        </CCard>

        <!-- Messaggio di errore generale -->
        <CAlert v-if="submitError" color="danger" class="mt-3">
          <CIcon icon="cilWarning" class="me-2" />
          {{ submitError }}
        </CAlert>
      </CForm>
    </CModalBody>

    <!-- Footer della modale con pulsanti CoreUI -->
    <CModalFooter class="border-top">
      <CButton
        color="secondary"
        @click="handleClose"
        :disabled="submitting"
        class="me-2"
      >
        <CIcon icon="cilX" class="me-2" />
        Annulla
      </CButton>
      <CButton
        color="primary"
        @click="handleSubmit"
        :disabled="submitting"
      >
        <!-- Mostriamo uno spinner durante il salvataggio -->
        <CSpinner v-if="submitting" size="sm" class="me-2" />
        <CIcon v-else :icon="isEdit ? 'cilSave' : 'cilPlus'" class="me-2" />
        {{ isEdit ? 'Aggiorna' : 'Crea' }}
      </CButton>
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
  updatePaziente,
  TIPI_TERAPIA_OPTIONS
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
  telefono: '',
  tipoTerapia: ''
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
    form.tipoTerapia = paziente.tipoTerapia || ''
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
      telefono: form.telefono?.trim() || null,
      tipoTerapia: form.tipoTerapia
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

// Auto-conversione in maiuscolo
watch(
  [
    () => form.codiceFiscale,
    () => form.nome,
    () => form.cognome,
    () => form.indirizzo,
    () => form.email
  ],
  ([newCodiceFiscale, newNome, newCognome, newIndirizzo, newEmail]) => {

    if (newCodiceFiscale)
      form.codiceFiscale = newCodiceFiscale.toUpperCase()

    if (newNome)
      form.nome = newNome.toUpperCase()

    if (newCognome)
      form.cognome = newCognome.toUpperCase()

    if (newIndirizzo)
      form.indirizzo = newIndirizzo.toUpperCase()

    if(newEmail)
      form.email = newEmail.toLowerCase()

  }
)
</script>

<style scoped>
/**
 * Stili CoreUI-compatibili per la modale paziente
 *
 * Design conforme ai temi CoreUI:
 * - Utilizzo classi CoreUI native
 * - Compatibilità dark/light mode automatica
 * - Colori consistent con la sidebar
 * - Layout responsive
 */

/* Rimozione del border radius personalizzato per usare quello di CoreUI */
.paziente-modal :deep(.modal-content) {
  /* CoreUI gestisce automaticamente il border radius */
}

/* Header con colori della sidebar (dark scheme) */
.modern-header {
  /* Utilizziamo le classi CoreUI native per consistency */
}

/* Body con background CoreUI */
.modern-body {
  background-color: var(--cui-tertiary-bg);
  /* CoreUI gestisce automaticamente la dark/light mode */
}

/* Sezioni del form usando CCard CoreUI */
.form-section {
  /* CCard ha già tutti gli stili necessari per dark/light mode */
}

/* Gruppi di input moderni con layout flexbox */
.modern-input-group {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

/* Icone degli input con colori della sidebar */
.input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  flex-shrink: 0;
  margin-top: 1.8rem; /* Allineamento con l'input */
}

/* Wrapper degli input */
.input-wrapper {
  flex: 1;
}

/* Labels con classi CoreUI */
.form-label::after {
  content: " *";
  color: var(--cui-danger);
  font-weight: normal;
}

.form-label.optional::after {
  content: "";
}

/* Input con stili CoreUI migliorati */
.modern-input {
  border-width: 1px;
  border-radius: 6px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.modern-input:focus {
  border-color: var(--cui-primary);
  box-shadow: 0 0 0 0.2rem rgba(var(--cui-primary-rgb), 0.25);
}

/* Stile speciale per codice fiscale */
.codice-fiscale {
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  font-weight: 600;
}

/* Responsive design */
@media (max-width: 768px) {
  .modern-body {
    padding: 1rem;
  }

  .modern-input-group {
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-icon {
    align-self: flex-start;
    margin-top: 0;
  }
}

/* Animazioni con transizioni CoreUI */
.form-section {
  transition: transform 0.15s ease-in-out;
}

.form-section:hover {
  transform: translateY(-1px);
}

/* Focus states migliorati */
.modern-input:focus,
.btn:focus {
  outline: 0;
}

/* Hover effects per gli input */
.modern-input:hover:not(:focus) {
  border-color: var(--cui-border-color-translucent);
}
</style>
