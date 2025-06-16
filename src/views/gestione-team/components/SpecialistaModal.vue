<template>
  <!-- Modale per creazione/modifica Specialista -->
  <CModal
    :visible="visible"
    @close="handleClose"
    size="lg"
    class="specialista-modal"
  >
    <CModalHeader>
      <CModalTitle>
        <CIcon :icon="isEditing ? 'cil-pencil' : 'cil-plus'" class="me-2" />
        {{ isEditing ? 'Modifica Specialista' : 'Nuovo Specialista' }}
      </CModalTitle>
    </CModalHeader>

    <CForm @submit.prevent="handleSubmit">
      <CModalBody>
        <CRow>
          <!-- Nome -->
          <CCol md="6" class="mb-3">
            <CFormLabel>Nome *</CFormLabel>
            <CFormInput
              v-model="formData.nome"
              placeholder="Nome dello specialista"
              :invalid="!!errors.nome"
              :disabled="loading"
            />
            <CFormFeedback v-if="errors.nome" invalid>
              {{ errors.nome }}
            </CFormFeedback>
          </CCol>

          <!-- Cognome -->
          <CCol md="6" class="mb-3">
            <CFormLabel>Cognome *</CFormLabel>
            <CFormInput
              v-model="formData.cognome"
              placeholder="Cognome dello specialista"
              :invalid="!!errors.cognome"
              :disabled="loading"
            />
            <CFormFeedback v-if="errors.cognome" invalid>
              {{ errors.cognome }}
            </CFormFeedback>
          </CCol>
        </CRow>

        <CRow>
          <!-- Email -->
          <CCol md="6" class="mb-3">
            <CFormLabel>Email *</CFormLabel>
            <CFormInput
              v-model="formData.email"
              type="email"
              placeholder="email@esempio.com"
              :invalid="!!errors.email"
              :disabled="loading"
            />
            <CFormFeedback v-if="errors.email" invalid>
              {{ errors.email }}
            </CFormFeedback>
          </CCol>

          <!-- Telefono -->
          <CCol md="6" class="mb-3">
            <CFormLabel>Telefono</CFormLabel>
            <CFormInput
              v-model="formData.telefono"
              placeholder="Numero di telefono"
              :invalid="!!errors.telefono"
              :disabled="loading"
            />
            <CFormFeedback v-if="errors.telefono" invalid>
              {{ errors.telefono }}
            </CFormFeedback>
          </CCol>
        </CRow>

        <!-- Prestazione -->
        <CRow>
          <CCol class="mb-3">
            <CFormLabel>Prestazione</CFormLabel>
            <CFormSelect
              v-model="formData.prestazioneID"
              :invalid="!!errors.prestazioneID"
              :disabled="loading"
            >
              <option value="">Seleziona una prestazione...</option>
              <option value="null" class="text-muted">Non configurata</option>
              <option
                v-for="prestazione in prestazioni"
                :key="prestazione.id"
                :value="prestazione.id"
              >
                {{ prestazione.tipologia }}
              </option>
            </CFormSelect>
            <CFormFeedback v-if="errors.prestazioneID" invalid>
              {{ errors.prestazioneID }}
            </CFormFeedback>
            <CFormText class="text-muted">
              <CIcon icon="cil-info" class="me-1" />
              Puoi assegnare una prestazione in seguito dalla sezione modifica
            </CFormText>
          </CCol>
        </CRow>

        <!-- Preview prestazione selezionata -->
        <CRow v-if="selectedPrestazione">
          <CCol>
            <CFormLabel>Prestazione Selezionata</CFormLabel>
            <div class="p-3 border rounded d-flex align-items-center">
              <div
                class="prestazione-indicator me-3"
                :style="{ backgroundColor: selectedPrestazione.color }"
              ></div>
              <span class="fw-medium">{{ selectedPrestazione.tipologia }}</span>
            </div>
          </CCol>
        </CRow>

        <!-- Preview per "Non configurata" -->
        <CRow v-else-if="formData.prestazioneID === 'null'">
          <CCol>
            <CFormLabel>Prestazione Selezionata</CFormLabel>
            <div class="p-3 border rounded d-flex align-items-center bg-light">
              <div class="prestazione-indicator-empty me-3">
                <CIcon icon="cil-ban" size="sm" />
              </div>
              <span class="fw-medium text-muted">Non configurata</span>
              <small class="ms-auto text-muted">
                Lo specialista potrà essere assegnato a una prestazione in seguito
              </small>
            </div>
          </CCol>
        </CRow>
      </CModalBody>

      <CModalFooter>
        <div class="me-auto">
          <small class="text-muted">* Campi obbligatori</small>
        </div>
        <CButton
          color="secondary"
          @click="handleClose"
          :disabled="loading"
          class="me-2"
        >
          Annulla
        </CButton>
        <CButton
          color="primary"
          type="submit"
          :disabled="loading || !isFormValid"
        >
          <CSpinner v-if="loading" size="sm" class="me-2" />
          {{ loading ? 'Salvataggio...' : (isEditing ? 'Aggiorna' : 'Crea') }}
        </CButton>
      </CModalFooter>
    </CForm>
  </CModal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  visible: Boolean,
  specialista: Object,
  prestazioni: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'created', 'updated'])

const loading = ref(false)
const errors = ref({})

const formData = ref({
  nome: '',
  cognome: '',
  email: '',
  telefono: '',
  prestazioneID: ''
})

const isEditing = computed(() => !!props.specialista?.id)

const selectedPrestazione = computed(() => {
  // Se è selezionato "null", non mostrare nessuna prestazione
  if (!formData.value.prestazioneID || formData.value.prestazioneID === 'null') return null
  return props.prestazioni.find(p => p.id == formData.value.prestazioneID)
})

const isFormValid = computed(() => {
  return formData.value.nome.trim() &&
         formData.value.cognome.trim() &&
         formData.value.email.trim() &&
         // La prestazione non è più obbligatoria
         Object.keys(errors.value).length === 0
})

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateForm = () => {
  errors.value = {}

  if (!formData.value.nome.trim()) {
    errors.value.nome = 'Il nome è obbligatorio'
  }

  if (!formData.value.cognome.trim()) {
    errors.value.cognome = 'Il cognome è obbligatorio'
  }

  if (!formData.value.email.trim()) {
    errors.value.email = 'L\'email è obbligatoria'
  } else if (!validateEmail(formData.value.email)) {
    errors.value.email = 'Formato email non valido'
  }

  // Rimossa la validazione obbligatoria per la prestazione
  // Ora è opzionale

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  console.log('🔄 [SpecialistaModal] Inizio handleSubmit')
  console.log('📝 [SpecialistaModal] Form data raw:', formData.value)
  console.log('✏️ [SpecialistaModal] Is editing:', isEditing.value)
  console.log('👤 [SpecialistaModal] Props specialista:', props.specialista)

  if (!validateForm()) {
    console.log('❌ [SpecialistaModal] Validazione fallita:', errors.value)
    return
  }

  console.log('✅ [SpecialistaModal] Validazione superata')
  loading.value = true

  try {
    // Preparazione dati con logging dettagliato
    const data = {
      nome: formData.value.nome.trim(),
      cognome: formData.value.cognome.trim(),
      email: formData.value.email.trim(),
      telefono: formData.value.telefono.trim(),
      // Gestione del valore null per prestazione non configurata
      prestazioneID: formData.value.prestazioneID === 'null' || formData.value.prestazioneID === ''
        ? null
        : parseInt(formData.value.prestazioneID)
    }

    console.log('📦 [SpecialistaModal] Dati preparati per invio:', data)

    // Emette solo l'evento con i dati, lasciando che il componente padre gestisca l'API
    if (isEditing.value) {
      const updateData = { id: props.specialista.id, ...data }
      console.log('🔄 [SpecialistaModal] Emettendo evento "updated" con dati:', updateData)
      emit('updated', updateData)
    } else {
      console.log('➕ [SpecialistaModal] Emettendo evento "created" con dati:', data)
      emit('created', data)
    }

    console.log('✅ [SpecialistaModal] Evento emesso con successo')
    handleClose()
  } catch (error) {
    console.error('❌ [SpecialistaModal] Errore nel form specialista:', error)
  } finally {
    loading.value = false
    console.log('🏁 [SpecialistaModal] Fine handleSubmit')
  }
}

const handleClose = () => {
  formData.value = {
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    prestazioneID: ''
  }
  errors.value = {}
  emit('close')
}

watch(() => props.visible, (visible) => {
  if (visible && props.specialista) {
    nextTick(() => {
      formData.value = {
        nome: props.specialista.nome || '',
        cognome: props.specialista.cognome || '',
        email: props.specialista.email || '',
        telefono: props.specialista.telefono || '',
        // Gestione del valore null/undefined per la prestazione
        prestazioneID: props.specialista.prestazione?.id
          ? props.specialista.prestazione.id.toString()
          : 'null'
      }
    })
  }
})
</script>

<style scoped>
.prestazione-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.prestazione-indicator-empty {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #f8f9fa;
  border: 2px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
}

/* Stile per l'opzione "Non configurata" */
option[value="null"] {
  font-style: italic;
  color: #6c757d !important;
}

/* Preview per prestazione non configurata */
.bg-light {
  background-color: #f8f9fa !important;
}

/* Responsive */
@media (max-width: 768px) {
  .prestazione-indicator,
  .prestazione-indicator-empty {
    width: 14px;
    height: 14px;
  }

  .prestazione-indicator-empty {
    font-size: 0.7rem;
  }
}

/* Supporto tema dark */
[data-coreui-theme="dark"] .prestazione-indicator-empty {
  background-color: #3b4252;
  border-color: #4c566a;
  color: #81a1c1;
}

[data-coreui-theme="dark"] .bg-light {
  background-color: #3b4252 !important;
}
</style>
