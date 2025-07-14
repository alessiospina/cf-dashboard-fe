<template>
  <!--
    Componente SELECT SEMPLICE per province 
    Da usare come fallback se gli autocomplete non funzionano
  -->
  <div class="province-select-wrapper">
    <CFormLabel v-if="label" :for="inputId" class="form-label-clean">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </CFormLabel>

    <CFormSelect
      :id="inputId"
      v-model="selectedProvinciaId"
      @change="handleChange"
      :invalid="invalid"
      :disabled="disabled || loadingProvince"
      :class="inputClass"
    >
      <option value="">{{ loadingProvince ? 'Caricamento...' : 'Seleziona una provincia' }}</option>
      <option 
        v-for="provincia in province" 
        :key="provincia.id" 
        :value="provincia.id"
      >
        {{ provincia.nome }} ({{ provincia.siglaAutomobilistica }})
      </option>
    </CFormSelect>

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
import { ref, computed, watch } from 'vue'
import { useGeo } from '@/composables/useGeo'

const props = defineProps({
  modelValue: {
    type: [Number, String, null],
    default: null
  },
  label: {
    type: String,
    default: ''
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
  inputClass: {
    type: String,
    default: 'form-control-clean'
  }
})

const emit = defineEmits(['update:modelValue', 'provincia-changed'])

const {
  province,
  loadingProvince,
  errorProvince,
  loadProvince,
  getProvinciaById
} = useGeo()

const selectedProvinciaId = ref(null)
const inputId = computed(() => `province-select-${Math.random().toString(36).substr(2, 9)}`)

// Watch del modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    selectedProvinciaId.value = newValue
  },
  { immediate: true }
)

// Gestione cambio selezione
const handleChange = (event) => {
  const value = event.target.value || null
  selectedProvinciaId.value = value
  
  emit('update:modelValue', value)
  
  if (value) {
    const provincia = getProvinciaById(parseInt(value))
    emit('provincia-changed', provincia)
  } else {
    emit('provincia-changed', null)
  }
}
</script>

<style scoped>
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
</style>
