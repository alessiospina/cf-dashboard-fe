<template>
  <!--
    Componente Autocomplete Stati riusabile

    Questo componente gestisce l'autocomplete per la selezione di uno stato/nazione
    con filtro real-time e validazione per impedire selezioni non valide.
  -->
  <div class="stato-autocomplete-wrapper">
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
        :disabled="disabled || loadingStati"
        :class="inputClass"
        autocomplete="off"
        role="combobox"
        :aria-expanded="showDropdown"
        :aria-autocomplete="'list'"
      />

      <!-- Icona di caricamento -->
      <div v-if="loadingStati" class="loading-icon">
        <CSpinner size="sm" />
      </div>

      <!-- Pulsante rimuovi selezione (solo se c'è una selezione) -->
      <div
        v-else-if="selectedStatoId && !disabled"
        class="clear-button"
        @click="clearSelection"
        title="Rimuovi selezione"
      >
        <CIcon icon="cil-x" />
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
        <div v-if="filteredStati.length === 0" class="dropdown-item no-results">
          <CIcon icon="cil-magnifying-glass" class="me-2 text-muted" />
          Nessuno stato trovato
        </div>

        <!-- Lista stati filtrati -->
        <div
          v-for="(stato, index) in filteredStati"
          :key="stato.id"
          class="dropdown-item"
          :class="{ 'highlighted': index === highlightedIndex }"
          @click="selectStato(stato)"
          @mouseenter="highlightedIndex = index"
          role="option"
          :aria-selected="selectedStatoId === stato.id"
        >
          <div class="stato-info">
            <div class="stato-nome">{{ stato.nome }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Messaggio di errore -->
    <CFormFeedback v-if="invalid && errorMessage" invalid>
      {{ errorMessage }}
    </CFormFeedback>

    <!-- Errore di caricamento -->
    <small v-if="errorStati" class="text-danger">
      {{ errorStati }}
      <CButton
        size="sm"
        color="link"
        class="p-0 ms-1"
        @click="loadStati"
      >
        Riprova
      </CButton>
    </small>
  </div>
</template>

<script setup>
/**
 * Componente Autocomplete Stati
 *
 * Props:
 * - modelValue: ID dello stato selezionato
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
 * - stato-changed: emesso con i dati completi dello stato
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
    default: 'Cerca uno stato...'
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
const emit = defineEmits(['update:modelValue', 'stato-changed'])

// Composable geografico
const {
  stati,
  loadingStati,
  errorStati,
  loadStati,
  getStatoById,
  filterStati
} = useGeo()

// Stato del componente
const searchText = ref('') // Testo digitato dall'utente
const showDropdown = ref(false) // Visibilità dropdown
const highlightedIndex = ref(-1) // Indice elemento evidenziato
const selectedStatoId = ref(null) // ID stato selezionato
const blurTimeout = ref(null) // Timeout per gestire blur
const dropdownPosition = ref({ top: 0, left: 0, width: 0 }) // Posizione dropdown

// ID univoco per il campo input
const inputId = computed(() => `stato-autocomplete-${Math.random().toString(36).substr(2, 9)}`)

// Placeholder dinamico
const currentPlaceholder = computed(() => {
  if (loadingStati.value) {
    return 'Caricamento stati...'
  }
  return props.placeholder
})

// Stati filtrati in base al testo di ricerca
const filteredStati = computed(() => {
  return filterStati(searchText.value)
})

// Watch del modelValue per sincronizzare con il componente padre
watch(
  () => props.modelValue,
  (newValue) => {
    selectedStatoId.value = newValue

    if (newValue) {
      // Trova lo stato e imposta il testo dell'input
      const stato = getStatoById(newValue)
      if (stato) {
        searchText.value = stato.nome
      }
    } else {
      // Reset dell'input se il valore è nullo
      searchText.value = ''
    }
  },
  { immediate: true }
)

// Watch per aggiornare il testo quando si caricano gli stati
watch(
  () => stati.value,
  () => {
    // Ricalcola il testo dell'input se abbiamo un ID ma non il nome
    if (selectedStatoId.value && !searchText.value) {
      const stato = getStatoById(selectedStatoId.value)
      if (stato) {
        searchText.value = stato.nome
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
  console.log('⌨️ Input digitato in StatiAutocomplete:', searchText.value)
  console.log('📊 Debug handleInput:', {
    searchLength: searchText.value.length,
    disabled: props.disabled,
    loadingStati: loadingStati.value,
    statiCount: stati.value.length,
    currentDropdownState: showDropdown.value
  })

  // Se l'utente sta digitando, reset della selezione
  if (selectedStatoId.value) {
    selectedStatoId.value = null
    emit('update:modelValue', null)
    emit('stato-changed', null)
  }

  // Calcola posizione e mostra dropdown
  try {
    calculateDropdownPosition()
    showDropdown.value = true
    highlightedIndex.value = -1

    console.log('📋 Dropdown impostato:', {
      showDropdown: showDropdown.value,
      filteredCount: filteredStati.value.length,
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
  console.log('🎯 Focus su StatiAutocomplete:', {
    disabled: props.disabled,
    loadingStati: loadingStati.value,
    statiCount: stati.value.length
  })

  if (!props.disabled && !loadingStati.value) {
    // Assicurati che i dati siano caricati prima di aprire il dropdown
    if (stati.value.length === 0) {
      console.log('📥 Stati non caricati - caricamento forzato')
      loadStati().then(() => {
        if (stati.value.length > 0) {
          calculateDropdownPosition()
          showDropdown.value = true
          highlightedIndex.value = -1
          console.log('✅ Dropdown aperto dopo caricamento stati')
        }
      }).catch(error => {
        console.error('❌ Errore caricamento stati al focus:', error)
      })
    } else {
      calculateDropdownPosition()
      showDropdown.value = true
      highlightedIndex.value = -1
      console.log('✅ Dropdown aperto per stati')
    }
  } else {
    console.log('❌ Dropdown NON aperto - condizioni non soddisfatte')
  }
}

// Gestione blur dell'input (con delay per permettere click su dropdown)
const handleBlur = () => {
  console.log('🔄 Blur su StatiAutocomplete - impostato timeout')

  blurTimeout.value = setTimeout(() => {
    console.log('⏰ Timeout blur eseguito - chiudo dropdown')
    showDropdown.value = false
    highlightedIndex.value = -1

    // Validazione: se il testo non corrisponde a uno stato valido, reset
    if (searchText.value && !selectedStatoId.value) {
      const statoEsistente = stati.value.find(s =>
        s.nome.toLowerCase() === searchText.value.toLowerCase()
      )

      if (!statoEsistente) {
        // Reset se non è uno stato valido
        searchText.value = ''
        emit('update:modelValue', null)
        emit('stato-changed', null)
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
        filteredStati.value.length - 1
      )
      break

    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break

    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0 && filteredStati.value[highlightedIndex.value]) {
        selectStato(filteredStati.value[highlightedIndex.value])
      }
      break

    case 'Escape':
      event.preventDefault()
      showDropdown.value = false
      highlightedIndex.value = -1
      break
  }
}

// Selezione di uno stato dal dropdown
const selectStato = (stato) => {
  // Cancella il timeout del blur
  if (blurTimeout.value) {
    clearTimeout(blurTimeout.value)
    blurTimeout.value = null
  }

  // Imposta lo stato selezionato
  selectedStatoId.value = stato.id
  searchText.value = stato.nome
  showDropdown.value = false
  highlightedIndex.value = -1

  // Emette gli eventi al componente padre
  emit('update:modelValue', stato.id)
  emit('stato-changed', stato)
}

// Toggle dropdown (click sull'icona)
const toggleDropdown = () => {
  if (props.disabled || loadingStati.value) return

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

// Funzione per rimuovere la selezione corrente
const clearSelection = () => {
  if (props.disabled) return

  // Reset completo della selezione
  selectedStatoId.value = null
  searchText.value = ''
  showDropdown.value = false
  highlightedIndex.value = -1

  // Emette gli eventi al componente padre con null
  emit('update:modelValue', null)
  emit('stato-changed', null)

  console.log('🗑️ Selezione stato rimossa')
}
</script>

<style scoped>
.stato-autocomplete-wrapper {
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

.clear-button {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  z-index: 1;
  background-color: #fef2f2;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.clear-button:hover {
  background-color: #fee2e2;
  color: #b91c1c;
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

.stato-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stato-nome {
  font-weight: 500;
  color: #374151;
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
