<template>
  <!--
    Versione ALTERNATIVA del componente Province Autocomplete
    Senza Teleport per evitare conflitti con le modali CoreUI
  -->
  <div class="province-autocomplete-wrapper">
    <CFormLabel v-if="label" :for="inputId" class="form-label-clean">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </CFormLabel>

    <div class="autocomplete-container" :class="{ 'is-open': showDropdown }">
      <CFormInput
        :id="inputId"
        v-model="searchText"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        :placeholder="currentPlaceholder"
        :invalid="invalid"
        :disabled="disabled || loadingProvince"
        :class="inputClass"
        autocomplete="off"
        role="combobox"
        :aria-expanded="showDropdown"
        :aria-autocomplete="'list'"
      />

      <!-- Icona di caricamento -->
      <div v-if="loadingProvince" class="loading-icon">
        <CSpinner size="sm" />
      </div>

      <!-- Icona dropdown -->
      <div v-else class="dropdown-icon" @click="toggleDropdown">
        <CIcon icon="cil-chevron-bottom" :class="{ 'rotated': showDropdown }" />
      </div>

      <!-- Dropdown SENZA Teleport - posizionamento relativo -->
      <div
        v-if="showDropdown"
        class="dropdown-menu-fixed"
        role="listbox"
        @mousedown.prevent
      >
        <!-- Nessun risultato -->
        <div v-if="filteredProvince.length === 0" class="dropdown-item no-results">
          <CIcon icon="cil-magnifying-glass" class="me-2 text-muted" />
          Nessuna provincia trovata
        </div>

        <!-- Lista province filtrate -->
        <div
          v-for="(provincia, index) in filteredProvince"
          :key="provincia.id"
          class="dropdown-item"
          :class="{ 'highlighted': index === highlightedIndex }"
          @click="selectProvincia(provincia)"
          @mouseenter="highlightedIndex = index"
          role="option"
          :aria-selected="selectedProvinciaId === provincia.id"
        >
          <div class="provincia-info">
            <div class="provincia-nome">{{ provincia.nome }}</div>
            <div class="provincia-sigla">({{ provincia.siglaAutomobilistica }})</div>
          </div>
        </div>
      </div>
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
// Lo script è identico a ProvinceAutocomplete.vue ma senza il Teleport
// (Copia tutto lo script da ProvinceAutocomplete.vue)
import { ref, computed, watch, nextTick } from 'vue'
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
    default: 'Cerca una provincia...'
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

// Eventi emessi
const emit = defineEmits(['update:modelValue', 'provincia-changed'])

// Composable geografico
const {
  province,
  loadingProvince,
  errorProvince,
  loadProvince,
  getProvinciaById,
  filterProvince
} = useGeo()

// Stato del componente
const searchText = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const selectedProvinciaId = ref(null)
const blurTimeout = ref(null)

// ID univoco per il campo input
const inputId = computed(() => `province-autocomplete-${Math.random().toString(36).substr(2, 9)}`)

// Placeholder dinamico
const currentPlaceholder = computed(() => {
  if (loadingProvince.value) {
    return 'Caricamento province...'
  }
  return props.placeholder
})

// Province filtrate in base al testo di ricerca
const filteredProvince = computed(() => {
  const result = filterProvince(searchText.value)
  console.log('🔍 Province filtrate:', result.length, 'per testo:', searchText.value)
  return result
})

// (Copia tutti i metodi da ProvinceAutocomplete.vue...)
// [Tutti gli altri metodi identici]

// Watch del modelValue per sincronizzare con il componente padre
watch(
  () => props.modelValue,
  (newValue) => {
    selectedProvinciaId.value = newValue

    if (newValue) {
      const provincia = getProvinciaById(newValue)
      if (provincia) {
        searchText.value = provincia.nome
      }
    } else {
      searchText.value = ''
    }
  },
  { immediate: true }
)

// [Copia tutti gli altri watch e metodi da ProvinceAutocomplete.vue]
</script>

<style scoped>
/* Tutto identico a ProvinceAutocomplete.vue TRANNE dropdown-menu */

.province-autocomplete-wrapper {
  position: relative;
}

.autocomplete-container {
  position: relative;
}

/* DIFFERENZA CHIAVE: dropdown con position absolute invece di fixed */
.dropdown-menu-fixed {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #3b82f6;
  border-top: none;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 99999; /* Z-index alto ma non 999999 */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  min-width: 200px;
}

/* Resto dello stile identico... */
.dropdown-item {
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: all 0.15s ease;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover,
.dropdown-item.highlighted {
  background-color: #f8fafc;
}

.dropdown-item.no-results {
  color: #6b7280;
  cursor: default;
  font-style: italic;
}

.dropdown-item.no-results:hover {
  background-color: transparent;
}

.provincia-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.provincia-nome {
  font-weight: 500;
  color: #374151;
}

.provincia-sigla {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 600;
}

/* [Copia tutto il resto dello stile da ProvinceAutocomplete.vue] */
</style>
