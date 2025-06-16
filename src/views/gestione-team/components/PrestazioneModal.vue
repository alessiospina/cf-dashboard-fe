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
        <!-- Tipologia e Colore sulla stessa riga -->
        <CRow class="mb-3">
          <CCol md="8">
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
          <CCol md="4">
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
            <div class="p-3 border rounded d-flex align-items-center">
              <div
                class="color-preview me-3"
                :style="{ backgroundColor: formData.color }"
              ></div>
              <span>{{ formData.tipologia || 'Nome Prestazione' }}</span>
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
  color: '#007bff'
})

const isEditing = computed(() => !!props.prestazione?.id)

const isFormValid = computed(() => {
  return formData.value.tipologia.trim() && formData.value.color
})

const validateForm = () => {
  errors.value = {}

  if (!formData.value.tipologia.trim()) {
    errors.value.tipologia = 'La tipologia è obbligatoria'
  }

  if (!formData.value.color) {
    errors.value.color = 'Il colore è obbligatorio'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    const data = {
      tipologia: formData.value.tipologia.trim(),
      color: formData.value.color
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
    formData.value = { tipologia: '', color: '#007bff' }
    errors.value = {}
    emit('close')
  }
}

watch(() => props.visible, (visible) => {
  if (visible && props.prestazione) {
    nextTick(() => {
      formData.value = {
        tipologia: props.prestazione.tipologia || '',
        color: props.prestazione.color || '#007bff'
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
</style>
