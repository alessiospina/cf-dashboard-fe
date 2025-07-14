<template>
  <!-- 
    Componente Select Comuni riusabile
    
    Questo componente gestisce la selezione di un comune italiano
    basato sulla provincia selezionata (select a cascata).
  -->
  <div class="comuni-select-wrapper">
    <CFormLabel v-if="label" :for="selectId" class="form-label-clean">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </CFormLabel>
    
    <CFormSelect
      :id="selectId"
      :model-value="modelValue"
      @update:model-value="handleChange"
      :invalid="invalid"
      :disabled="disabled || loadingComuni || !provinciaId"
      :class="selectClass"
    >
      <!-- Opzioni dinamiche -->
      <option 
        v-for="option in comuniOptions" 
        :key="option.value || 'placeholder'" 
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </CFormSelect>

    <!-- Icona di caricamento -->
    <div v-if="loadingComuni" class="loading-icon">
      <CSpinner size="sm" />
    </div>

    <!-- Messaggio di errore -->
    <CFormFeedback v-if="invalid && errorMessage" invalid>
      {{ errorMessage }}
    </CFormFeedback>

    <!-- Errore di caricamento -->
    <small v-if="errorComuni" class="text-danger">
      {{ errorComuni }}
      <CButton 
        size="sm" 
        color="link" 
        class="p-0 ms-1" 
        @click="reloadComuni"
      >
        Riprova
      </CButton>
    </small>

    <!-- Helper text -->
    <small v-if="!provinciaId && !invalid" class="text-muted">
      Seleziona prima una provincia per visualizzare i comuni
    </small>
  </div>
</template>

<script setup>
/**
 * Componente Select Comuni
 * 
 * Props:
 * - modelValue: valore selezionato (comune ID)
 * - provinciaId: ID della provincia (necessario per caricare i comuni)
 * - label: etichetta del campo
 * - placeholder: testo placeholder personalizzato
 * - required: campo obbligatorio
 * - invalid: stato di errore
 * - disabled: disabilitato
 * - errorMessage: messaggio di errore personalizzato
 * - selectClass: classi CSS aggiuntive
 * - autoLoad: carica automaticamente i comuni quando cambia la provincia
 * 
 * Emits:
 * - update:modelValue: emesso quando cambia la selezione
 * - comune-changed: emesso con i dati completi del comune
 */

import { computed, watch } from 'vue'
import { useGeo } from '@/composables/useGeo'

// Props del componente
const props = defineProps({
  modelValue: {
    type: [Number, String, null],
    default: null
  },
  provinciaId: {
    type: [Number, String, null],
    default: null
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Seleziona un comune'
  },
  required: {
    type: Boolean,
    default: false
  },
  invalid: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  },
  selectClass: {
    type: String,
    default: 'form-control-clean'
  },
  autoLoad: {
    type: Boolean,
    default: true
  }
})

// Eventi emessi
const emit = defineEmits(['update:modelValue', 'comune-changed'])

// Composable geografico
const { 
  loadingComuni, 
  errorComuni, 
  loadComuniByProvincia,
  getComuniOptions,
  findComuneById 
} = useGeo()

// ID univoco per il campo select
const selectId = computed(() => `comuni-select-${Math.random().toString(36).substr(2, 9)}`)

// Opzioni dei comuni in base alla provincia selezionata
const comuniOptions = computed(() => {
  if (!props.provinciaId) {
    return [{ 
      value: null, 
      label: 'Seleziona prima una provincia' 
    }]
  }

  return getComuniOptions(props.provinciaId)
})

// Gestione del cambio di selezione
const handleChange = (value) => {
  // Converte il valore in numero se non è vuoto
  const comuneId = value ? Number(value) : null
  
  // Emette il nuovo valore
  emit('update:modelValue', comuneId)
  
  // Emette anche i dati completi del comune
  const comuneData = comuneId ? findComuneById(comuneId) : null
  emit('comune-changed', comuneData)
}

// Funzione per ricaricare i comuni
const reloadComuni = () => {
  if (props.provinciaId) {
    loadComuniByProvincia(props.provinciaId)
  }
}

// Carica automaticamente i comuni quando cambia la provincia
watch(
  () => props.provinciaId,
  (newProvinciaId, oldProvinciaId) => {
    if (props.autoLoad && newProvinciaId && newProvinciaId !== oldProvinciaId) {
      // Reset del valore selezionato quando cambia provincia
      if (props.modelValue) {
        emit('update:modelValue', null)
        emit('comune-changed', null)
      }
      
      // Carica i nuovi comuni
      loadComuniByProvincia(newProvinciaId)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.comuni-select-wrapper {
  position: relative;
}

.loading-icon {
  position: absolute;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 1;
}

.form-label-clean {
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

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

.form-control-clean:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.text-danger {
  color: #ef4444 !important;
}

.text-muted {
  color: #6b7280 !important;
}

.btn-link {
  text-decoration: underline;
  color: #3b82f6;
}

.btn-link:hover {
  color: #1d4ed8;
}
</style>
