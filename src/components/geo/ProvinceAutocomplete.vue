<template>
  <!--
    Componente Autocomplete Province riusabile

    Questo componente gestisce l'autocomplete per la selezione di una provincia italiana
    con filtro real-time e validazione per impedire selezioni non valide.
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

      <!-- Dropdown con suggerimenti SENZA Teleport -->
      <div
        v-if="showDropdown"
        class="dropdown-menu-no-teleport"
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
/**
 * Componente Autocomplete Province
 *
 * Props:
 * - modelValue: ID della provincia selezionata
 * - label: etichetta del campo
 * - placeholder: testo placeholder personalizzato
 * - required: campo obbligatorio
 * - invalid: stato di errore
 * - disabled: disabilitato
 * - errorMessage: messaggio di errore personalizzato
 * - inputClass: classi CSS aggiuntive per l'input
 *
 * Emits:
 * - update:modelValue: emesso quando cambia la selezione
 * - provincia-changed: emesso con i dati completi della provincia
 */

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
const searchText = ref('') // Testo digitato dall'utente
const showDropdown = ref(false) // Visibilità dropdown
const highlightedIndex = ref(-1) // Indice elemento evidenziato
const selectedProvinciaId = ref(null) // ID provincia selezionata
const blurTimeout = ref(null) // Timeout per gestire blur
const dropdownPosition = ref({ top: 0, left: 0, width: 0 }) // Posizione dropdown

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
  return filterProvince(searchText.value)
})

// Watch del modelValue per sincronizzare con il componente padre
watch(
  () => props.modelValue,
  (newValue) => {
    selectedProvinciaId.value = newValue

    if (newValue) {
      // Trova la provincia e imposta il testo dell'input
      const provincia = getProvinciaById(newValue)
      if (provincia) {
        searchText.value = provincia.nome
      }
    } else {
      // Reset dell'input se il valore è nullo
      searchText.value = ''
    }
  },
  { immediate: true }
)

// Watch per aggiornare il testo quando si caricano le province
watch(
  () => province.value,
  () => {
    // Ricalcola il testo dell'input se abbiamo un ID ma non il nome
    if (selectedProvinciaId.value && !searchText.value) {
      const provincia = getProvinciaById(selectedProvinciaId.value)
      if (provincia) {
        searchText.value = provincia.nome
      }
    }
  },
  { immediate: true }
)

// Watch per debug del dropdown
watch(
  () => showDropdown.value,
  (newValue) => {
    console.log('👁️ Dropdown visibilità cambiata:', newValue)
  }
)

// Gestione input dell'utente
const handleInput = () => {
  console.log('⌨️ Input digitato in ProvinceAutocomplete:', searchText.value)
  console.log('📊 Debug handleInput:', {
    searchLength: searchText.value.length,
    disabled: props.disabled,
    loadingProvince: loadingProvince.value,
    provinceCount: province.value.length,
    currentDropdownState: showDropdown.value
  })

  // Se l'utente sta digitando, reset della selezione
  if (selectedProvinciaId.value) {
    selectedProvinciaId.value = null
    emit('update:modelValue', null)
    emit('provincia-changed', null)
  }

  // Calcola posizione e mostra dropdown
  try {
    calculateDropdownPosition()
    showDropdown.value = true
    highlightedIndex.value = -1

    console.log('📋 Dropdown impostato:', {
      showDropdown: showDropdown.value,
      filteredCount: filteredProvince.value.length,
      dropdownPosition: dropdownPosition.value
    })
  } catch (error) {
    console.error('❌ Errore in handleInput:', error)
  }
}

// Calcola la posizione del dropdown
const calculateDropdownPosition = () => {
  const input = document.getElementById(inputId.value)
  if (input) {
    const rect = input.getBoundingClientRect()
    const scrollY = window.scrollY || window.pageYOffset

    dropdownPosition.value = {
      top: rect.bottom + scrollY,
      left: rect.left,
      width: rect.width
    }
    console.log('📐 Posizione dropdown calcolata:', dropdownPosition.value)
  }
}

// Gestione focus dell'input
const handleFocus = () => {
  console.log('🎯 Focus su ProvinceAutocomplete:', {
    disabled: props.disabled,
    loadingProvince: loadingProvince.value,
    provinceCount: province.value.length
  })

  if (!props.disabled && !loadingProvince.value) {
    // Assicurati che i dati siano caricati prima di aprire il dropdown
    if (province.value.length === 0) {
      console.log('📥 Province non caricate - caricamento forzato')
      loadProvince().then(() => {
        if (province.value.length > 0) {
          calculateDropdownPosition()
          showDropdown.value = true
          highlightedIndex.value = -1
          console.log('✅ Dropdown aperto dopo caricamento province')
        }
      }).catch(error => {
        console.error('❌ Errore caricamento province al focus:', error)
      })
    } else {
      calculateDropdownPosition()
      showDropdown.value = true
      highlightedIndex.value = -1
      console.log('✅ Dropdown aperto per province')
    }
  } else {
    console.log('❌ Dropdown NON aperto - condizioni non soddisfatte')
  }
}

// Gestione blur dell'input (con delay per permettere click su dropdown)
const handleBlur = () => {
  console.log('🔄 Blur su ProvinceAutocomplete - impostato timeout')

  blurTimeout.value = setTimeout(() => {
    console.log('⏰ Timeout blur eseguito - chiudo dropdown')
    showDropdown.value = false
    highlightedIndex.value = -1

    // Validazione: se il testo non corrisponde a una provincia valida, reset
    if (searchText.value && !selectedProvinciaId.value) {
      const provinciaEsistente = province.value.find(p =>
        p.nome.toLowerCase() === searchText.value.toLowerCase()
      )

      if (!provinciaEsistente) {
        // Reset se non è una provincia valida
        searchText.value = ''
        emit('update:modelValue', null)
        emit('provincia-changed', null)
      }
    }
  }, 1000) // Aumentato da 500 a 1000ms per le modali
}

// Gestione navigazione con tastiera
const handleKeydown = (event) => {
  if (!showDropdown.value) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(
        highlightedIndex.value + 1,
        filteredProvince.value.length - 1
      )
      break

    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break

    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0 && filteredProvince.value[highlightedIndex.value]) {
        selectProvincia(filteredProvince.value[highlightedIndex.value])
      }
      break

    case 'Escape':
      event.preventDefault()
      showDropdown.value = false
      highlightedIndex.value = -1
      break
  }
}

// Selezione di una provincia dal dropdown
const selectProvincia = (provincia) => {
  // Cancella il timeout del blur
  if (blurTimeout.value) {
    clearTimeout(blurTimeout.value)
    blurTimeout.value = null
  }

  // Imposta la provincia selezionata
  selectedProvinciaId.value = provincia.id
  searchText.value = provincia.nome
  showDropdown.value = false
  highlightedIndex.value = -1

  // Emette gli eventi al componente padre
  emit('update:modelValue', provincia.id)
  emit('provincia-changed', provincia)
}

// Toggle dropdown (click sull'icona)
const toggleDropdown = () => {
  if (props.disabled || loadingProvince.value) return

  if (!showDropdown.value) {
    calculateDropdownPosition() // Calcola posizione prima di aprire
  }

  showDropdown.value = !showDropdown.value
  highlightedIndex.value = -1

  if (showDropdown.value) {
    // Focus sull'input quando si apre il dropdown
    nextTick(() => {
      const input = document.getElementById(inputId.value)
      if (input) input.focus()
    })
  }
}
</script>

<style scoped>
.province-autocomplete-wrapper {
  position: relative;
}

.autocomplete-container {
  position: relative;
}

/* Visualizzazione quando dropdown è aperto */
.autocomplete-container.is-open .form-control-clean {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom-color: #3b82f6;
}

.loading-icon {
  position: absolute;
  right: 2.5rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 1;
}

.dropdown-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  z-index: 1;
}

.dropdown-icon:hover {
  background-color: #f3f4f6;
}

.dropdown-icon .icon {
  transition: transform 0.2s ease;
}

.dropdown-icon .icon.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: fixed; /* Fixed invece di absolute per sfuggire al contesto della modale */
  top: 100%;
  left: 0;
  right: 0;
  background: white !important;
  border: 2px solid #3b82f6 !important;
  border-top: none;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 999999 !important; /* Z-index ancora più alto per CoreUI modali */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
  /* Assicura che sia sempre visibile */
  min-width: 200px;
  display: block !important; /* Forza display */
  visibility: visible !important; /* Forza visibilità */
  opacity: 1 !important; /* Forza opacità */
}

/* Dropdown SENZA Teleport - posizione relativa */
.dropdown-menu-no-teleport {
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
  z-index: 999999;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
  min-width: 200px;
}

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

.form-label-clean {
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.form-control-clean {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem 3rem 0.75rem 0.75rem; /* Padding extra a destra per l'icona */
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background-color: #ffffff;
}

.form-control-clean:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background-color: #ffffff;
  outline: none;
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

/* Scrollbar personalizzata per il dropdown */
.dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Responsive */
@media (max-width: 768px) {
  .form-control-clean {
    padding-right: 2.5rem; /* Meno padding su mobile */
  }

  .dropdown-icon {
    right: 0.5rem;
  }

  .loading-icon {
    right: 2rem;
  }
}
</style>
