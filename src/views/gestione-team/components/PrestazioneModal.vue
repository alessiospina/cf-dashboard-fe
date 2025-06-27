<template>
  <!-- Modale per creazione/modifica Prestazione -->
  <CModal
    :visible="visible"
    @close="handleClose"
    size="md"
    class="prestazione-modal"
  >
    <CModalHeader>
      <CModalTitle>
        <CIcon :icon="isEditing ? 'cil-pencil' : 'cil-plus'" class="me-2" />
        {{ isEditing ? 'Modifica Prestazione' : 'Nuova Prestazione' }}
      </CModalTitle>
    </CModalHeader>

    <CForm @submit.prevent="handleSubmit">
      <CModalBody>
        <!-- Tipologia prestazione -->
        <CRow class="mb-3">
          <CCol>
            <CFormLabel>Tipologia Prestazione *</CFormLabel>
            <CFormInput
              v-model="formData.tipologia"
              placeholder="Es. Logopedia, Fisioterapia..."
              :invalid="!!errors.tipologia"
              :disabled="loading"
            />
            <CFormFeedback v-if="errors.tipologia" invalid>
              {{ errors.tipologia }}
            </CFormFeedback>
          </CCol>
        </CRow>

        <!-- Prezzo e Colore sulla stessa riga -->
        <CRow class="mb-3">
          <CCol md="6">
            <CFormLabel>Prezzo (€) *</CFormLabel>
            <CInputGroup>
              <CInputGroupText>€</CInputGroupText>
              <CFormInput
                v-model="formData.prezzo"
                placeholder="0.00"
                :invalid="!!errors.prezzo"
                :disabled="loading"
                @input="formatPrezzoInput"
                @blur="formatPrezzoOnBlur"
                class="prezzo-input"
              />
            </CInputGroup>
            <CFormFeedback v-if="errors.prezzo" invalid>
              {{ errors.prezzo }}
            </CFormFeedback>
          </CCol>
          <CCol md="6">
            <CFormLabel>Colore *</CFormLabel>
            <CFormInput
              v-model="formData.color"
              type="color"
              :invalid="!!errors.color"
              :disabled="loading"
              class="color-input"
            />
            <CFormFeedback v-if="errors.color" invalid>
              {{ errors.color }}
            </CFormFeedback>
          </CCol>
        </CRow>

        <!-- Preview -->
        <CRow>
          <CCol>
            <CFormLabel>Anteprima</CFormLabel>
            <div class="p-3 border rounded d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center">
                <div
                  class="color-preview me-3"
                  :style="{ backgroundColor: formData.color }"
                ></div>
                <span>{{ formData.tipologia || 'Nome Prestazione' }}</span>
              </div>
              <span class="fw-bold text-success">{{ formatPrezzoPreview(formData.prezzo) }}</span>
            </div>
          </CCol>
        </CRow>
      </CModalBody>

      <CModalFooter>
        <CButton
          color="secondary"
          @click="handleClose"
          :disabled="loading"
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
  prestazione: Object
})

const emit = defineEmits(['close', 'created', 'updated'])

const loading = ref(false)
const errors = ref({})

const formData = ref({
  tipologia: '',
  color: '#007bff',
  prezzo: ''
})

const isEditing = computed(() => !!props.prestazione?.id)

const isFormValid = computed(() => {
  return formData.value.tipologia.trim() &&
         formData.value.color &&
         formData.value.prezzo &&
         !isNaN(parseFloat(formData.value.prezzo))
})

const validateForm = () => {
  errors.value = {}

  if (!formData.value.tipologia.trim()) {
    errors.value.tipologia = 'La tipologia è obbligatoria'
  }

  if (!formData.value.color) {
    errors.value.color = 'Il colore è obbligatorio'
  }

  if (!formData.value.prezzo) {
    errors.value.prezzo = 'Il prezzo è obbligatorio'
  } else {
    const prezzoNumber = parseFloat(formData.value.prezzo)
    if (isNaN(prezzoNumber) || prezzoNumber <= 0) {
      errors.value.prezzo = 'Il prezzo deve essere un numero valido maggiore di 0'
    }
  }

  return Object.keys(errors.value).length === 0
}

// Funzioni per la formattazione del prezzo
const formatPrezzoInput = (event) => {
  // Permette solo numeri e punti durante la digitazione
  let value = event.target.value

  // Rimuove caratteri non validi (mantiene solo numeri e punto)
  value = value.replace(/[^0-9.]/g, '')

  // Permette solo un punto decimale
  const parts = value.split('.')
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('')
  }

  // Limita a 2 decimali dopo il punto
  if (parts[1] && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2)
  }

  formData.value.prezzo = value
}

const formatPrezzoOnBlur = () => {
  // Formattazione automatica quando l'utente esce dal campo
  if (!formData.value.prezzo) return

  const prezzoNumber = parseFloat(formData.value.prezzo)

  if (!isNaN(prezzoNumber)) {
    // Formatta sempre con 2 decimali e punto come separatore
    formData.value.prezzo = prezzoNumber.toFixed(2)
  }
}

const formatPrezzoPreview = (prezzo) => {
  if (!prezzo) return '€ 0.00'

  const prezzoNumber = parseFloat(prezzo)

  if (isNaN(prezzoNumber)) return '€ 0.00'

  // Formatta in euro con punto come separatore decimale
  return '€ ' + prezzoNumber.toFixed(2)
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    // Il prezzo è già in formato corretto (con punto come separatore)
    const prezzoNumber = parseFloat(formData.value.prezzo)

    const data = {
      tipologia: formData.value.tipologia.trim(),
      color: formData.value.color,
      prezzo: prezzoNumber
    }

    console.log('Dati prestazione da inviare:', data)

    // Emette l'evento con i dati, il componente padre gestirà l'API
    if (isEditing.value) {
      emit('updated', { id: props.prestazione.id, ...data })
    } else {
      emit('created', data)
    }

    // Non impostiamo loading.value = false qui
    // Il componente padre si occuperà di chiudere la modale
    // che resetterà automaticamente il loading

  } catch (error) {
    console.error('Errore nel form prestazione:', error)
    loading.value = false
  }
}

const handleClose = () => {
  // Reset del form solo se non stiamo caricando
  if (!loading.value) {
    formData.value = { tipologia: '', color: '#007bff', prezzo: '' }
    errors.value = {}
    emit('close')
  }
}

watch(() => props.visible, (visible) => {
  if (visible && props.prestazione) {
    nextTick(() => {
      // Formatta il prezzo esistente con punto come separatore se presente
      let prezzoFormattato = ''
      if (props.prestazione.prezzo !== null && props.prestazione.prezzo !== undefined) {
        const prezzoNumber = typeof props.prestazione.prezzo === 'string'
          ? parseFloat(props.prestazione.prezzo)
          : props.prestazione.prezzo

        if (!isNaN(prezzoNumber)) {
          prezzoFormattato = prezzoNumber.toFixed(2)
        }
      }

      formData.value = {
        tipologia: props.prestazione.tipologia || '',
        color: props.prestazione.color || '#007bff',
        prezzo: prezzoFormattato
      }
    })
  } else if (!visible) {
    // Reset quando la modale si chiude
    loading.value = false
  }
})
</script>

<style scoped>
.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

/* Stili per il color input */
.color-input {
  height: 38px;
  padding: 2px;
  border-radius: 6px;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
  border: none;
  border-radius: 4px;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}

/* Firefox */
.color-input::-moz-color-swatch {
  border: none;
  border-radius: 4px;
}

/* Stili per il campo prezzo */
.prezzo-input {
  text-align: right;
  font-weight: 500;
}

.prezzo-input:focus {
  border-color: #28a745;
  box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
}

/* Stile per il gruppo input del prezzo */
.input-group-text {
  background-color: #28a745;
  color: white;
  border-color: #28a745;
  font-weight: bold;
}
</style>
