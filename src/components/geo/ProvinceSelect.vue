<template>
  <!-- 
    Componente Select Province riusabile
    
    Questo componente gestisce la selezione di una provincia italiana
    con caricamento automatico dei dati e gestione errori.
  -->
  <div class="province-select-wrapper">
    <CFormLabel v-if="label" :for="selectId" class="form-label-clean">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </CFormLabel>
    
    <CFormSelect
      :id="selectId"
      :model-value="modelValue"
      @update:model-value="handleChange"
      :invalid="invalid"
      :disabled="disabled || loadingProvince"
      :class="selectClass"
    >
      <!-- Opzione placeholder -->
      <option value="">
        {{ loadingProvince ? 'Caricamento province...' : placeholder }}
      </option>
      
      <!-- Opzioni province -->
      <option 
        v-for="provincia in province" 
        :key="provincia.id" 
        :value="provincia.id"
      >
        {{ provincia.nome }} ({{ provincia.siglaAutomobilistica }})
      </option>
    </CFormSelect>

    <!-- Icona di caricamento -->
    <div v-if="loadingProvince" class="loading-icon">
      <CSpinner size="sm" />
    </div>

    <!-- Messaggio di errore -->
    <CFormFeedback v-if="invalid && errorMessage" invalid>
      {{ errorMessage }}
    </CFormFeedback>

    <!-- Errore di caricamento -->
    <small v-if="errorProvince" class="text-danger">
      {{ errorProvince }}
      <CButton 
        size="sm" 
        color="link" 
        class="p-0 ms-1" 
        @click="loadProvince"
      >
        Riprova
      </CButton>
    </small>
  </div>
</template>

<script setup>
/**
 * Componente Select Province
 * 
 * Props:
 * - modelValue: valore selezionato (provincia ID)
 * - label: etichetta del campo
 * - placeholder: testo placeholder
 * - required: campo obbligatorio
 * - invalid: stato di errore
 * - disabled: disabilitato
 * - errorMessage: messaggio di errore personalizzato
 * - selectClass: classi CSS aggiuntive
 * 
 * Emits:
 * - update:modelValue: emesso quando cambia la selezione
 * - provincia-changed: emesso con i dati completi della provincia
 */

import { computed } from 'vue'
import { useGeo } from '@/composables/useGeo'

// Props del componente
const props = defineProps({
  modelValue: {
    type: [Number, String, null],
    default: null
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Seleziona una provincia'
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
  }
})

// Eventi emessi
const emit = defineEmits(['update:modelValue', 'provincia-changed'])

// Composable geografico
const { 
  province, 
  loadingProvince, 
  errorProvince, 
  loadProvince,
  getProvinciaById 
} = useGeo()

// ID univoco per il campo select
const selectId = computed(() => `province-select-${Math.random().toString(36).substr(2, 9)}`)

// Gestione del cambio di selezione
const handleChange = (value) => {
  // Converte il valore in numero se non è vuoto
  const provinciaId = value ? Number(value) : null
  
  // Emette il nuovo valore
  emit('update:modelValue', provinciaId)
  
  // Emette anche i dati completi della provincia
  const provinciaData = provinciaId ? getProvinciaById(provinciaId) : null
  emit('provincia-changed', provinciaData)
}
</script>

<style scoped>
.province-select-wrapper {
  position: relative;
}

.loading-icon {
  position: absolute;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
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

.btn-link {
  text-decoration: underline;
  color: #3b82f6;
}

.btn-link:hover {
  color: #1d4ed8;
}
</style>
