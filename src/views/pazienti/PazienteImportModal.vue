<template>
  <CModal :visible="visible" @close="handleClose" size="xl">
    <CModalHeader>
      <CModalTitle>
        <CIcon icon="cil-pencil" class="me-2"/>
        Modifica Paziente - {{ paziente?.nome }} {{ paziente?.cognome }}
      </CModalTitle>
    </CModalHeader>

    <CModalBody>
      <CForm @submit.prevent="handleSubmit">
        <!-- Tabs -->
        <CTabs :activeItemKey="activeTab" @update:activeItemKey="activeTab = $event">
          <CTabList variant="tabs" class="mb-4">
            <CTab itemKey="anagrafica">
              <CIcon icon="cil-user" class="me-2"/>
              Anagrafica
              <CBadge v-if="anagraficaErrors" color="danger" class="ms-2">
                {{ anagraficaErrors }}
              </CBadge>
            </CTab>
            <CTab itemKey="geografico">
              <CIcon icon="cil-location-pin" class="me-2"/>
              Dati Geografici
              <CBadge v-if="geograficoErrors" color="danger" class="ms-2">
                {{ geograficoErrors }}
              </CBadge>
            </CTab>
            <CTab itemKey="contatti">
              <CIcon icon="cil-phone" class="me-2"/>
              Contatti
              <CBadge v-if="contattiErrors" color="danger" class="ms-2">
                {{ contattiErrors }}
              </CBadge>
            </CTab>
          </CTabList>

          <CTabContent>
            <!-- Tab Anagrafica -->
            <CTabPanel itemKey="anagrafica" class="p-3">
              <CRow class="g-3">
                <CCol md="6">
                  <CFormLabel>Nome *</CFormLabel>
                  <CFormInput
                    v-model="form.nome"
                    :invalid="!!errors.nome"
                    placeholder="Nome"
                  />
                  <CFormFeedback v-if="errors.nome" invalid>{{ errors.nome }}</CFormFeedback>
                </CCol>

                <CCol md="6">
                  <CFormLabel>Cognome *</CFormLabel>
                  <CFormInput
                    v-model="form.cognome"
                    :invalid="!!errors.cognome"
                    placeholder="Cognome"
                  />
                  <CFormFeedback v-if="errors.cognome" invalid>{{ errors.cognome }}</CFormFeedback>
                </CCol>

                <CCol md="6">
                  <CFormLabel>Codice Fiscale *</CFormLabel>
                  <CFormInput
                    v-model="form.codiceFiscale"
                    :invalid="!!errors.codiceFiscale"
                    placeholder="RSSMRA80A01H501U"
                    maxlength="16"
                    @input="form.codiceFiscale = form.codiceFiscale.toUpperCase()"
                  />
                  <CFormFeedback v-if="errors.codiceFiscale" invalid>{{ errors.codiceFiscale }}</CFormFeedback>
                </CCol>

                <CCol md="6">
                  <CFormLabel>Data di Nascita *</CFormLabel>
                  <CFormInput
                    type="date"
                    v-model="form.dataDiNascita"
                    :invalid="!!errors.dataDiNascita"
                  />
                  <CFormFeedback v-if="errors.dataDiNascita" invalid>{{ errors.dataDiNascita }}</CFormFeedback>
                </CCol>

                <CCol md="6">
                  <CFormLabel>Email *</CFormLabel>
                  <CFormInput
                    type="email"
                    v-model="form.email"
                    :invalid="!!errors.email"
                    placeholder="email@example.com"
                  />
                  <CFormFeedback v-if="errors.email" invalid>{{ errors.email }}</CFormFeedback>
                </CCol>

                <CCol md="6">
                  <CFormLabel>Nazionalità *</CFormLabel>
                  <CFormSelect
                    v-model="form.nazionalita"
                    :invalid="!!errors.nazionalita"
                  >
                    <option value="">Seleziona nazionalità</option>
                    <option value="italia">Italia</option>
                    <option value="estero">Estero</option>
                  </CFormSelect>
                  <CFormFeedback v-if="errors.nazionalita" invalid>{{ errors.nazionalita }}</CFormFeedback>
                </CCol>
              </CRow>
            </CTabPanel>

            <!-- Tab Dati Geografici -->
            <CTabPanel itemKey="geografico" class="p-3">
              <!-- Sezione Nascita (solo se italiano) -->
              <div v-if="isItaliano" class="mb-4">
                <h6 class="mb-3">
                  <CIcon icon="cil-location-pin" class="me-2"/>
                  Luogo di Nascita
                </h6>
                <CRow class="g-3">
                  <CCol md="4">
                    <CFormLabel>Regione Nascita *</CFormLabel>
                    <CFormInput
                      v-model="form.regioneNascita"
                      :invalid="!!errors.regioneNascita"
                      placeholder="Regione"
                    />
                    <CFormFeedback v-if="errors.regioneNascita" invalid>{{ errors.regioneNascita }}</CFormFeedback>
                  </CCol>

                  <CCol md="4">
                    <CFormLabel>Provincia Nascita *</CFormLabel>
                    <CFormInput
                      v-model="form.provinciaNascita"
                      :invalid="!!errors.provinciaNascita"
                      placeholder="Provincia"
                    />
                    <CFormFeedback v-if="errors.provinciaNascita" invalid>{{ errors.provinciaNascita }}</CFormFeedback>
                  </CCol>

                  <CCol md="4">
                    <CFormLabel>Comune Nascita *</CFormLabel>
                    <CFormInput
                      v-model="form.comuneNascita"
                      :invalid="!!errors.comuneNascita"
                      placeholder="Comune"
                    />
                    <CFormFeedback v-if="errors.comuneNascita" invalid>{{ errors.comuneNascita }}</CFormFeedback>
                  </CCol>
                </CRow>

                <!-- Switch Residenza = Nascita -->
                <div class="mt-3">
                  <CFormCheck
                    v-model="residenzaUgualeNascita"
                    :id="`switch-residenza-${paziente?.codiceFiscale}`"
                    switch
                    label="La residenza coincide con il luogo di nascita"
                  />
                </div>
              </div>

              <!-- Sezione Residenza -->
              <div>
                <h6 class="mb-3">
                  <CIcon icon="cil-home" class="me-2"/>
                  Residenza
                </h6>
                <CRow class="g-3">
                  <CCol md="12">
                    <CFormLabel>Indirizzo Residenza *</CFormLabel>
                    <CFormInput
                      v-model="form.indirizzoResidenza"
                      :invalid="!!errors.indirizzoResidenza"
                      placeholder="Via Roma, 123"
                    />
                    <CFormFeedback v-if="errors.indirizzoResidenza" invalid>{{ errors.indirizzoResidenza }}</CFormFeedback>
                  </CCol>

                  <CCol md="4">
                    <CFormLabel>Regione Residenza *</CFormLabel>
                    <CFormInput
                      v-model="form.regioneResidenza"
                      :invalid="!!errors.regioneResidenza"
                      placeholder="Regione"
                      :disabled="isItaliano && residenzaUgualeNascita"
                    />
                    <CFormFeedback v-if="errors.regioneResidenza" invalid>{{ errors.regioneResidenza }}</CFormFeedback>
                  </CCol>

                  <CCol md="4">
                    <CFormLabel>Provincia Residenza *</CFormLabel>
                    <CFormInput
                      v-model="form.provinciaResidenza"
                      :invalid="!!errors.provinciaResidenza"
                      placeholder="Provincia"
                      :disabled="isItaliano && residenzaUgualeNascita"
                    />
                    <CFormFeedback v-if="errors.provinciaResidenza" invalid>{{ errors.provinciaResidenza }}</CFormFeedback>
                  </CCol>

                  <CCol md="4">
                    <CFormLabel>Comune Residenza *</CFormLabel>
                    <CFormInput
                      v-model="form.comuneResidenza"
                      :invalid="!!errors.comuneResidenza"
                      placeholder="Comune"
                      :disabled="isItaliano && residenzaUgualeNascita"
                    />
                    <CFormFeedback v-if="errors.comuneResidenza" invalid>{{ errors.comuneResidenza }}</CFormFeedback>
                  </CCol>
                </CRow>
              </div>
            </CTabPanel>

            <!-- Tab Contatti -->
            <CTabPanel itemKey="contatti" class="p-3">
              <CRow class="g-3">
                <CCol md="12">
                  <CFormLabel>Telefono</CFormLabel>
                  <CFormInput
                    v-model="form.telefono"
                    :invalid="!!errors.telefono"
                    placeholder="+39 123 456 7890"
                  />
                  <CFormFeedback v-if="errors.telefono" invalid>{{ errors.telefono }}</CFormFeedback>
                  <CFormText class="text-muted">Campo opzionale</CFormText>
                </CCol>
              </CRow>

              <!-- Mostra errore originale se presente -->
              <CAlert v-if="showOriginalError && paziente?.error" color="warning" class="mt-3">
                <strong>Errore originale durante l'import:</strong><br>
                {{ paziente.error }}
              </CAlert>
            </CTabPanel>
          </CTabContent>
        </CTabs>
      </CForm>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" @click="handleClose">
        Annulla
      </CButton>
      <CButton color="primary" @click="handleSubmit">
        <CIcon icon="cil-save" class="me-2"/>
        Salva Modifiche
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CForm, CFormLabel, CFormInput, CFormSelect, CFormFeedback, CFormText, CFormCheck,
  CButton, CRow, CCol, CAlert, CBadge,
  CTabs, CTabList, CTab, CTabContent, CTabPanel
} from '@coreui/vue'
import { CIcon } from '@coreui/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  paziente: {
    type: Object,
    default: null
  },
  showOriginalError: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'save'])

const activeTab = ref('anagrafica')
const residenzaUgualeNascita = ref(false)
const errors = ref({})

const form = reactive({
  nome: '',
  cognome: '',
  codiceFiscale: '',
  dataDiNascita: '',
  email: '',
  telefono: '',
  nazionalita: 'italia',
  regioneNascita: '',
  provinciaNascita: '',
  comuneNascita: '',
  indirizzoResidenza: '',
  regioneResidenza: '',
  provinciaResidenza: '',
  comuneResidenza: ''
})

// Computed per nazionalità italiana
const isItaliano = computed(() => form.nazionalita === 'italia')

// Conta errori per tab
const anagraficaErrors = computed(() => {
  const fields = ['nome', 'cognome', 'codiceFiscale', 'dataDiNascita', 'email', 'nazionalita']
  return fields.filter(f => errors.value[f]).length || 0
})

const geograficoErrors = computed(() => {
  const fields = ['regioneNascita', 'provinciaNascita', 'comuneNascita',
                  'indirizzoResidenza', 'regioneResidenza', 'provinciaResidenza', 'comuneResidenza']
  return fields.filter(f => errors.value[f]).length || 0
})

const contattiErrors = computed(() => {
  return errors.value.telefono ? 1 : 0
})

// Watch per popolare form quando cambia paziente
watch(() => props.paziente, (newPaziente) => {
  if (newPaziente) {
    form.nome = newPaziente.nome || ''
    form.cognome = newPaziente.cognome || ''
    form.codiceFiscale = newPaziente.codiceFiscale || ''
    form.dataDiNascita = newPaziente.dataDiNascita ? formatDateForInput(newPaziente.dataDiNascita) : ''
    form.email = newPaziente.email || ''
    form.telefono = newPaziente.telefono || ''

    // Determina nazionalità
    if (newPaziente.nazionalità?.nome && newPaziente.nazionalità.nome !== 'Italia') {
      form.nazionalita = 'estero'
    } else {
      form.nazionalita = 'italia'
    }

    // Dati nascita
    form.regioneNascita = newPaziente.regioneNascita?.nome || ''
    form.provinciaNascita = newPaziente.provinciaNascita?.sigla || newPaziente.provinciaNascita?.nome || ''
    form.comuneNascita = newPaziente.comuneNascita?.nome || ''

    // Dati residenza
    form.indirizzoResidenza = newPaziente.indirizzoResidenza || ''
    form.regioneResidenza = newPaziente.regioneResidenza?.nome || ''
    form.provinciaResidenza = newPaziente.provinciaResidenza?.sigla || newPaziente.provinciaResidenza?.nome || ''
    form.comuneResidenza = newPaziente.comuneResidenza?.nome || ''

    // Reset errori
    errors.value = {}
  }
}, { immediate: true })

// Watch nazionalità: resetta campi nascita quando cambia
watch(() => form.nazionalita, (newVal, oldVal) => {
  if (oldVal && newVal !== oldVal) {
    if (newVal === 'estero') {
      // Passaggio a estero: svuota campi nascita
      form.regioneNascita = ''
      form.provinciaNascita = ''
      form.comuneNascita = ''
      residenzaUgualeNascita.value = false
    }
  }
})

// Watch switch residenza = nascita
watch(residenzaUgualeNascita, (newVal) => {
  if (newVal && isItaliano.value) {
    form.regioneResidenza = form.regioneNascita
    form.provinciaResidenza = form.provinciaNascita
    form.comuneResidenza = form.comuneNascita
  }
})

// Watch campi nascita se switch attivo
watch([() => form.regioneNascita, () => form.provinciaNascita, () => form.comuneNascita], () => {
  if (residenzaUgualeNascita.value && isItaliano.value) {
    form.regioneResidenza = form.regioneNascita
    form.provinciaResidenza = form.provinciaNascita
    form.comuneResidenza = form.comuneNascita
  }
})

const formatDateForInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const validateForm = () => {
  errors.value = {}

  // Campi obbligatori anagrafica
  if (!form.nome?.trim()) errors.value.nome = 'Il nome è obbligatorio'
  if (!form.cognome?.trim()) errors.value.cognome = 'Il cognome è obbligatorio'
  if (!form.codiceFiscale?.trim()) {
    errors.value.codiceFiscale = 'Il codice fiscale è obbligatorio'
  } else if (!/^[A-Z0-9]{16}$/.test(form.codiceFiscale)) {
    errors.value.codiceFiscale = 'Il codice fiscale deve essere di 16 caratteri alfanumerici'
  }
  if (!form.dataDiNascita) errors.value.dataDiNascita = 'La data di nascita è obbligatoria'
  if (!form.email?.trim()) {
    errors.value.email = 'L\'email è obbligatoria'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.value.email = 'L\'email non è valida'
  }
  if (!form.nazionalita) errors.value.nazionalita = 'La nazionalità è obbligatoria'

  // Campi obbligatori geografici (nascita solo se italiano)
  if (isItaliano.value) {
    if (!form.regioneNascita?.trim()) errors.value.regioneNascita = 'La regione di nascita è obbligatoria'
    if (!form.provinciaNascita?.trim()) errors.value.provinciaNascita = 'La provincia di nascita è obbligatoria'
    if (!form.comuneNascita?.trim()) errors.value.comuneNascita = 'Il comune di nascita è obbligatorio'
  }

  // Residenza sempre obbligatoria
  if (!form.indirizzoResidenza?.trim()) errors.value.indirizzoResidenza = 'L\'indirizzo è obbligatorio'
  if (!form.regioneResidenza?.trim()) errors.value.regioneResidenza = 'La regione di residenza è obbligatoria'
  if (!form.provinciaResidenza?.trim()) errors.value.provinciaResidenza = 'La provincia di residenza è obbligatoria'
  if (!form.comuneResidenza?.trim()) errors.value.comuneResidenza = 'Il comune di residenza è obbligatorio'

  // Telefono è opzionale, nessuna validazione

  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (validateForm()) {
    emit('save', { ...form })
  } else {
    // Vai al primo tab con errori
    if (anagraficaErrors.value > 0) {
      activeTab.value = 'anagrafica'
    } else if (geograficoErrors.value > 0) {
      activeTab.value = 'geografico'
    } else if (contattiErrors.value > 0) {
      activeTab.value = 'contatti'
    }
  }
}

const handleClose = () => {
  errors.value = {}
  emit('close')
}
</script>

<style scoped>
.form-control-clean {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.form-control-clean:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}
</style>
