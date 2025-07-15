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
        <!-- Navigazione Tabs -->
        <div class="tabs-navigation mb-4">
          <div class="tabs-header">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              class="tab-button"
              :class="{
                'active': activeTab === tab.id,
                'completed': isTabCompleted(tab.id),
                'has-errors': hasTabErrors(tab.id)
              }"
              @click="switchTab(tab.id)"
            >
              <div class="tab-icon">
                <CIcon
                  :icon="tab.icon"
                  :class="hasTabErrors(tab.id) ? 'text-danger' : isTabCompleted(tab.id) ? 'text-success' : ''"
                />
              </div>
              <div class="tab-content">
                <div class="tab-title">{{ tab.title }}</div>
                <div class="tab-subtitle">{{ tab.subtitle }}</div>
              </div>
              <div class="tab-indicator">
                <div v-if="hasTabErrors(tab.id)" class="error-badge">
                  {{ getTabErrorsCount(tab.id) }}
                </div>
                <div v-else-if="isTabCompleted(tab.id)" class="success-badge">
                  <CIcon icon="cil-check" size="sm" />
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Contenuto Tabs -->
        <div class="tab-content-container">
          <!-- Tab 1: Anagrafica -->
          <div v-if="activeTab === 'anagrafica'" class="tab-pane active">
            <div class="form-section">
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
          </div>

          <!-- Tab 2: Residenza -->
          <div v-if="activeTab === 'residenza'" class="tab-pane active">
            <div class="form-section">
              <!-- Sezione Dati di Nascita -->
              <div class="sub-section mb-4">
                <h6 class="sub-section-title">Luogo di Nascita</h6>
                <CRow class="g-3">
                  <CCol md="6">
                    <div class="input-group-with-icon">
                      <CIcon icon="cil-map" class="input-icon"/>
                      <div class="input-content">
                        <ProvinceAutocomplete
                          v-model="form.provinciaNascitaId"
                          label="Provincia di nascita"
                          placeholder="Cerca provincia di nascita..."
                          :invalid="!!errors.provinciaNascitaId"
                          :error-message="errors.provinciaNascitaId"
                          @provincia-changed="handleProvinciaNascitaChange"
                        />
                      </div>
                    </div>
                  </CCol>
                  <CCol md="6">
                    <div class="input-group-with-icon">
                      <CIcon icon="cil-location-pin" class="input-icon"/>
                      <div class="input-content">
                        <ComuniAutocomplete
                          v-model="form.comuneNascitaId"
                          :provincia-id="form.provinciaNascitaId"
                          label="Comune di nascita"
                          placeholder="Cerca comune di nascita..."
                          :invalid="!!errors.comuneNascitaId"
                          :error-message="errors.comuneNascitaId"
                          @comune-changed="handleComuneNascitaChange"
                        />
                      </div>
                    </div>
                  </CCol>
                </CRow>
              </div>

              <!-- Sezione Residenza -->
              <div class="sub-section mb-4">
                <h6 class="sub-section-title">Residenza Attuale</h6>
                <CRow class="g-3">
                  <CCol cols="12" md="6">
                    <div class="input-group-with-icon">
                      <CIcon icon="cil-map" class="input-icon"/>
                      <div class="input-content">
                        <ProvinceAutocomplete
                          v-model="form.provinciaResidenzaId"
                          label="Provincia di residenza"
                          placeholder="Cerca provincia di residenza..."
                          :invalid="!!errors.provinciaResidenzaId"
                          :error-message="errors.provinciaResidenzaId"
                          @provincia-changed="handleProvinciaResidenzaChange"
                        />
                      </div>
                    </div>
                  </CCol>
                  <CCol cols="12" md="6">
                    <div class="input-group-with-icon">
                      <CIcon icon="cil-location-pin" class="input-icon"/>
                      <div class="input-content">
                        <ComuniAutocomplete
                          v-model="form.comuneResidenzaId"
                          :provincia-id="form.provinciaResidenzaId"
                          label="Comune di residenza"
                          placeholder="Cerca comune di residenza..."
                          :invalid="!!errors.comuneResidenzaId"
                          :error-message="errors.comuneResidenzaId"
                          @comune-changed="handleComuneResidenzaChange"
                        />
                      </div>
                    </div>
                  </CCol>
                  <CCol cols="12">
                    <div class="input-group-with-icon">
                      <CIcon icon="cil-home" class="input-icon"/>
                      <div class="input-content">
                        <CFormLabel class="form-label-clean">Indirizzo di residenza (opzionale)</CFormLabel>
                        <CFormInput
                          v-model="form.indirizzoResidenza"
                          placeholder="Via Roma, 123"
                          class="form-control-clean"
                          :invalid="!!errors.indirizzoResidenza"
                        />
                        <CFormFeedback v-if="errors.indirizzoResidenza" invalid>{{ errors.indirizzoResidenza }}</CFormFeedback>
                      </div>
                    </div>
                  </CCol>
                </CRow>
              </div>

              <!-- Helper per i campi geografici -->
              <div class="mt-2">
                <small class="text-muted">
                  <CIcon icon="cil-info" class="me-1" size="sm"/>
                  I campi geografici sono opzionali. Usa il pulsante "X" per rimuovere una selezione.
                </small>
              </div>
            </div>
          </div>

          <!-- Tab 3: Contatti -->
          <div v-if="activeTab === 'contatti'" class="tab-pane active">
            <div class="form-section">
              <CRow class="g-3">
                <CCol sm="12">
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
                <CCol sm="12">
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
              </CRow>
            </div>
          </div>
        </div>

        <!-- Anteprima Paziente (mostrata sempre) -->
        <div v-if="form.nome || form.cognome" class="input-group-with-icon mb-4 mt-4">
          <CIcon icon="cil-user" class="input-icon text-success"/>
          <div class="input-content">
            <div class="paziente-preview">
              <div class="d-flex align-items-center">
                <span class="me-2">Anteprima:</span>
                <strong>{{ form.nome }} {{ form.cognome }}</strong>
                <span v-if="form.email" class="text-muted ms-2">({{ form.email }})</span>
              </div>
              <div v-if="form.comuneNascitaId || form.comuneResidenzaId" class="mt-2">
                <small class="text-muted d-block">
                  <span v-if="form.comuneNascitaId">
                    Nato a: {{ getComuneNome(form.comuneNascitaId) }}
                  </span>
                  <span v-if="form.comuneNascitaId && form.comuneResidenzaId"> • </span>
                  <span v-if="form.comuneResidenzaId">
                    Residente a: {{ getComuneNome(form.comuneResidenzaId) }}
                  </span>
                </small>
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

      <!-- Indicatori shortcut -->
      <div class="shortcuts-hint mt-2">
        <small class="text-muted">
          <CIcon icon="cil-keyboard" class="me-1" size="sm"/>
          Scorciatoie: <strong>Ctrl+1-3</strong> per navigare tra i tabs • <strong>Ctrl+Enter</strong> per salvare
        </small>
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
import { useGeo } from '@/composables/useGeo'
import ProvinceAutocomplete from '@/components/geo/ProvinceAutocomplete.vue'
import ComuniAutocomplete from '@/components/geo/ComuniAutocomplete.vue'

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
} = usePazienti()

// Composable geografico per gestire province e comuni
const {
  loadComuniByProvincia,
  findProvinciaByComune,
  findComuneById,
  initialize,
  hasProvince,
  province
} = useGeo()

// Stato per i tabs
const activeTab = ref('anagrafica')

// Configurazione tabs
const tabs = [
  {
    id: 'anagrafica',
    title: 'Anagrafica',
    subtitle: 'Dati personali',
    icon: 'cil-user'
  },
  {
    id: 'residenza',
    title: 'Residenza',
    subtitle: 'Luoghi e indirizzi',
    icon: 'cil-location-pin'
  },
  {
    id: 'contatti',
    title: 'Contatti',
    subtitle: 'Email e telefono',
    icon: 'cil-envelope-closed'
  }
]

// Computed: determina se siamo in modalità modifica
const isEdit = computed(() => !!props.paziente?.id)

// Stato reattivo del form
const form = reactive({
  nome: '',
  cognome: '',
  dataDiNascita: '',
  // Campi geografici per nascita
  provinciaNascitaId: null,
  comuneNascitaId: null,
  // Campi geografici per residenza
  provinciaResidenzaId: null,
  comuneResidenzaId: null,
  indirizzoResidenza: '',
  // Campi contatti
  codiceFiscale: '',
  email: '',
  telefono: ''
})

// Stato per errori di validazione
const errors = ref({})

// Stato per il salvataggio
const submitting = ref(false)
const submitError = ref('')

// Flag per controllare quando stiamo popolando il form (evita reset comuni)
const isPopulatingForm = ref(false)

// Funzione per resettare il form
const resetForm = () => {
  Object.keys(form).forEach(key => {
    form[key] = ''
  })
  errors.value = {}
  submitError.value = ''
  activeTab.value = tabs[0].id // Sempre il primo tab
}

// Funzione per popolare il form con i dati del paziente (in modifica)
const populateForm = async (paziente) => {
  if (!paziente) return

  console.log('📝 Popolamento form paziente:', paziente.nome, paziente.cognome)

  // Imposta flag per evitare reset durante il popolamento
  isPopulatingForm.value = true

  // Dati base
  form.nome = paziente.nome || ''
  form.cognome = paziente.cognome || ''
  form.dataDiNascita = paziente.dataDiNascita ?
    new Date(paziente.dataDiNascita).toISOString().split('T')[0] : ''
  form.indirizzoResidenza = paziente.indirizzoResidenza || ''
  form.codiceFiscale = paziente.codiceFiscale || ''
  form.email = paziente.email || ''
  form.telefono = paziente.telefono || ''

  try {
    // Attendi che i dati geografici siano caricati
    await initialize()

    // Pre-selezione comune e provincia di nascita
    if (paziente.comuneNascita?.id) {
      console.log('🏙️ Pre-selezione nascita:', paziente.comuneNascita.nome)

      // Usa il nuovo metodo per trovare il comune nella lista completa
      const comuneNascita = findComuneById(paziente.comuneNascita.id)

      if (comuneNascita) {
        console.log('🔍 Comune nascita trovato:', comuneNascita)
        form.comuneNascitaId = comuneNascita.id

        // Prova 1: Imposta la provincia dal comune trovato
        if (comuneNascita.provincia?.id) {
          form.provinciaNascitaId = comuneNascita.provincia.id
          console.log('📍 Provincia nascita da comune:', comuneNascita.provincia.nome)
        } else {
          // Prova 2: Usa i dati dal paziente se disponibili
          if (paziente.comuneNascita.provincia?.id) {
            form.provinciaNascitaId = paziente.comuneNascita.provincia.id
            console.log('📍 Provincia nascita da paziente:', paziente.comuneNascita.provincia.nome)
          } else {
            console.log('❌ Provincia nascita non disponibile')
          }
        }
      } else {
        console.log('❌ Comune nascita non trovato:', paziente.comuneNascita.id)
      }
    }

    // Pre-selezione comune e provincia di residenza
    if (paziente.comuneResidenza?.id) {
      console.log('🏠 Pre-selezione residenza:', paziente.comuneResidenza.nome)

      // Usa il nuovo metodo per trovare il comune nella lista completa
      const comuneResidenza = findComuneById(paziente.comuneResidenza.id)

      if (comuneResidenza) {
        console.log('🔍 Comune residenza trovato:', comuneResidenza)
        form.comuneResidenzaId = comuneResidenza.id

        // Prova 1: Imposta la provincia dal comune trovato
        if (comuneResidenza.provincia?.id) {
          form.provinciaResidenzaId = comuneResidenza.provincia.id
          console.log('📍 Provincia residenza da comune:', comuneResidenza.provincia.nome)
        } else {
          // Prova 2: Usa i dati dal paziente se disponibili
          if (paziente.comuneResidenza.provincia?.id) {
            form.provinciaResidenzaId = paziente.comuneResidenza.provincia.id
            console.log('📍 Provincia residenza da paziente:', paziente.comuneResidenza.provincia.nome)
          } else {
            console.log('❌ Provincia residenza non disponibile')
          }
        }
      } else {
        console.log('❌ Comune residenza non trovato:', paziente.comuneResidenza.id)
      }
    }

    console.log('✅ Form popolato con successo')
    console.log('   → Provincia nascita ID:', form.provinciaNascitaId)
    console.log('   → Comune nascita ID:', form.comuneNascitaId)
    console.log('   → Provincia residenza ID:', form.provinciaResidenzaId)
    console.log('   → Comune residenza ID:', form.comuneResidenzaId)

  } catch (error) {
    console.error('❌ Errore nel popolamento form:', error)
  } finally {
    // ✅ RIMUOVI FLAG: fine popolamento, permetti reset normali
    isPopulatingForm.value = false
  }
}

// Watch: osserva i cambiamenti nelle props
watch(
  () => props.visible,
  async (newVisible) => {
    if (newVisible) {
      console.log('👁️ Modale aperta, modalità:', isEdit.value ? 'MODIFICA' : 'CREAZIONE')

      // Assicurati che il primo tab sia sempre attivo quando si apre la modale
      activeTab.value = tabs[0].id // Sempre il primo tab (anagrafica)
      console.log('📂 Tab attivo impostato:', activeTab.value)

      // Aggiungi listener per le scorciatoie da tastiera
      document.addEventListener('keydown', handleKeyboardShortcuts)

      // Quando la modale si apre
      if (isEdit.value) {
        console.log('📝 Avvio popolamento form per paziente:', props.paziente?.nome)
        isPopulatingForm.value = true // Imposta flag prima del popolamento
        await populateForm(props.paziente)
      } else {
        console.log('🆕 Reset form per nuovo paziente')
        resetForm()
      }
    } else {
      console.log('👁️ Modale chiusa')
      // Rimuovi listener per le scorciatoie da tastiera
      document.removeEventListener('keydown', handleKeyboardShortcuts)
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

    // Navigazione automatica al primo tab con errori (solo durante validazione)
    const firstErrorTab = tabs.find(tab => hasTabErrors(tab.id))
    if (firstErrorTab) {
      console.log('🚨 Navigazione automatica al tab con errori:', firstErrorTab.id)
      activeTab.value = firstErrorTab.id
    }

    return
  }

  submitting.value = true

  try {
    // Prepariamo i dati da inviare
    const pazienteData = {
      nome: form.nome.trim(),
      cognome: form.cognome.trim(),
      dataDiNascita: form.dataDiNascita,
      // Campi geografici
      comuneNascitaId: form.comuneNascitaId || null,
      comuneResidenzaId: form.comuneResidenzaId || null,
      indirizzoResidenza: form.indirizzoResidenza?.trim() || null,
      // Campi contatti
      codiceFiscale: form.codiceFiscale.toUpperCase().trim(),
      email: form.email.trim(),
      telefono: form.telefono?.trim() || null
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

// Gestione dei cambi di provincia e comune
const handleProvinciaNascitaChange = (provinciaData) => {
  // Reset del comune quando cambia la provincia SOLO se non stiamo popolando il form
  if (!isPopulatingForm.value) {
    form.comuneNascitaId = null
  }
}

const handleProvinciaResidenzaChange = (provinciaData) => {
  // Reset del comune quando cambia la provincia SOLO se non stiamo popolando il form
  if (!isPopulatingForm.value) {
    form.comuneResidenzaId = null
  }
}

const handleComuneNascitaChange = (comuneData) => {
  // Puoi aggiungere logica aggiuntiva se necessario
  console.log('Comune nascita selezionato:', comuneData)
}

const handleComuneResidenzaChange = (comuneData) => {
  // Puoi aggiungere logica aggiuntiva se necessario
  console.log('Comune residenza selezionato:', comuneData)
}

// Funzione helper per ottenere il nome del comune
const getComuneNome = (comuneId) => {
  if (!comuneId) return ''
  const comune = findComuneById(comuneId)
  return comune ? comune.nome : ''
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

// Funzioni per la gestione dei tabs
const switchTab = (tabId) => {
  activeTab.value = tabId
}

// Funzione per verificare se un tab è completato
const isTabCompleted = (tabId) => {
  switch (tabId) {
    case 'anagrafica':
      return !!(form.nome && form.cognome && form.dataDiNascita && form.codiceFiscale)
    case 'residenza':
      // I campi geografici sono opzionali, quindi il tab è sempre "completato"
      return true
    case 'contatti':
      return !!(form.email) // Email è obbligatorio, telefono opzionale
    default:
      return false
  }
}

// Funzione per verificare se un tab ha errori
const hasTabErrors = (tabId) => {
  const tabErrors = getTabErrors(tabId)
  return tabErrors.length > 0
}

// Funzione per ottenere errori di un tab specifico
const getTabErrors = (tabId) => {
  const allErrors = Object.keys(errors.value)

  const tabFields = {
    anagrafica: ['nome', 'cognome', 'dataDiNascita', 'codiceFiscale'],
    residenza: ['provinciaNascitaId', 'comuneNascitaId', 'provinciaResidenzaId', 'comuneResidenzaId', 'indirizzoResidenza'],
    contatti: ['email', 'telefono']
  }

  return allErrors.filter(field => tabFields[tabId]?.includes(field))
}

// Funzione per contare gli errori di un tab
const getTabErrorsCount = (tabId) => {
  return getTabErrors(tabId).length
}

// Gestione scorciatoie da tastiera
const handleKeyboardShortcuts = (event) => {
  // Solo se la modale è aperta
  if (!props.visible) return

  // Ctrl/Cmd + Number per navigare tra i tabs
  if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '3') {
    event.preventDefault()
    const tabIndex = parseInt(event.key) - 1
    if (tabs[tabIndex]) {
      switchTab(tabs[tabIndex].id)
    }
  }

  // Ctrl/Cmd + Enter per salvare
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    handleSubmit()
  }
}
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
  width: 100%; /* Assicura che l'input prenda tutta la larghezza disponibile */
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

/* === STILI TABS === */

/* Navigazione tabs */
.tabs-navigation {
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
}

.tabs-header {
  display: flex;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  width: 100%; /* Assicura che l'header occupi tutta la larghezza */
}

.tabs-header::-webkit-scrollbar {
  display: none;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;
  min-width: 0;
  flex: 1; /* Ogni tab occupa lo stesso spazio disponibile */
  flex-shrink: 0;
  position: relative;
  text-align: center; /* Centra il contenuto del tab */
}

.tab-button:hover {
  color: #374151;
  background-color: #f9fafb;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background-color: #f8fafc;
}

.tab-button.completed {
  color: #10b981;
}

.tab-button.completed.active {
  color: #3b82f6;
}

.tab-button.has-errors {
  color: #ef4444;
}

.tab-button.has-errors.active {
  color: #ef4444;
}

.tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.tab-title {
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.25;
  white-space: nowrap;
}

.tab-subtitle {
  font-size: 0.75rem;
  opacity: 0.7;
  white-space: nowrap;
}

.tab-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.error-badge {
  background-color: #fee2e2;
  color: #dc2626;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  min-width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-badge {
  background-color: #dcfce7;
  color: #16a34a;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Contenuto tabs */
.tab-content-container {
  min-height: 400px;
}

.tab-pane {
  display: none;
}

.tab-pane.active {
  display: block;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Sub-sezioni nei tabs */
.sub-section {
  position: relative;
}

.sub-section-title {
  color: #6b7280;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

/* Responsive per tabs */
@media (max-width: 768px) {
  .tab-button {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    text-align: center;
  }

  .tab-title {
    font-size: 0.75rem;
  }

  .tab-subtitle {
    font-size: 0.625rem;
  }

  .tab-icon {
    width: 20px;
    height: 20px;
  }

  .tab-content-container {
    min-height: 300px;
  }
}

/* Animazione hover sui tabs */
.tab-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.1));
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: -1;
}

.tab-button:hover::before {
  opacity: 1;
}

.tab-button.active::before {
  opacity: 1;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.1));
}

/* Indicatori shortcut */
.shortcuts-hint {
  text-align: center;
  border-top: 1px solid #f3f4f6;
  padding-top: 0.5rem;
}

.shortcuts-hint strong {
  color: #3b82f6;
  font-weight: 600;
}
</style>
