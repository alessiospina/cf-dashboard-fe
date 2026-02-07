<template>
  <!--
    Componente Autocomplete Comuni riusabile

    Questo componente gestisce l'autocomplete per la selezione di un comune italiano
    basato sulla provincia selezionata con filtro real-time e validazione.
  -->
  <div class="comuni-autocomplete-wrapper">
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
        :disabled="disabled || loadingTuttiComuni || !provinciaId"
        :class="inputClass"
        autocomplete="off"
        role="combobox"
        :aria-expanded="showDropdown"
        :aria-autocomplete="'list'"
      />

      <!-- Icona di caricamento -->
      <div v-if="loadingTuttiComuni" class="loading-icon">
        <CSpinner size="sm" />
      </div>

      <!-- Pulsante rimuovi selezione (solo se c'è una selezione) -->
      <div
        v-else-if="selectedComuneId && provinciaId && !disabled"
        class="clear-button"
        @click="clearSelection"
        title="Rimuovi selezione"
      >
        <CIcon icon="cil-x" />
      </div>

      <!-- Icona dropdown -->
      <div v-else-if="provinciaId" class="dropdown-icon" @click="toggleDropdown">
        <CIcon icon="cil-chevron-bottom" :class="{ 'rotated': showDropdown }" />
      </div>

      <!-- Dropdown con suggerimenti SENZA Teleport -->
      <div
        v-if="showDropdown && provinciaId"
        class="dropdown-menu-no-teleport"
        role="listbox"
        @mousedown.prevent
      >
        <!-- Nessun risultato -->
        <div v-if="filteredComuni.length === 0" class="dropdown-item no-results">
          <CIcon icon="cil-magnifying-glass" class="me-2 text-muted" />
          Nessun comune trovato
        </div>

        <!-- Lista comuni filtrati -->
        <div
          v-for="(comune, index) in filteredComuni"
          :key="comune.id"
          class="dropdown-item"
          :class="{ 'highlighted': index === highlightedIndex }"
          @click="selectComune(comune)"
          @mouseenter="highlightedIndex = index"
          role="option"
          :aria-selected="selectedComuneId === comune.id"
        >
          <div class="comune-info">
            <div class="comune-nome">{{ comune.nome }}</div>
            <div class="comune-provincia" v-if="comune.provincia">
              ({{ comune.provincia.siglaAutomobilistica }})
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Messaggio di errore -->
    <CFormFeedback v-if="invalid && errorMessage" invalid>
      {{ errorMessage }}
    </CFormFeedback>

    <!-- Errore di caricamento -->
    <small v-if="errorTuttiComuni" class="text-danger">
      {{ errorTuttiComuni }}
      <CButton
        size="sm"
        color="link"
        class="p-0 ms-1"
        @click="loadAllComuni"
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
 * Componente Autocomplete Comuni
 *
 * Props:
 * - modelValue: ID del comune selezionato
 * - provinciaId: ID della provincia (necessario per filtrare i comuni)
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
 * - comune-changed: emesso con i dati completi del comune
 */

import { ref, computed, watch, nextTick } from 'vue'
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
    default: 'Cerca un comune...'
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
const emit = defineEmits(['update:modelValue', 'comune-changed'])

// Composable geografico
const {
  loadingTuttiComuni,
  errorTuttiComuni,
  loadAllComuni,
  findComuneById,
  filterComuniByProvincia,
  tuttiIComuni // ✅ AGGIUNTO: mancava questo import
} = useGeo()

// Stato del componente
const searchText = ref('') // Testo digitato dall'utente
const showDropdown = ref(false) // Visibilità dropdown
const highlightedIndex = ref(-1) // Indice elemento evidenziato
const selectedComuneId = ref(null) // ID comune selezionato
const blurTimeout = ref(null) // Timeout per gestire blur
const dropdownPosition = ref({ top: 0, left: 0, width: 0 }) // Posizione dropdown

// ID univoco per il campo input
const inputId = computed(() => `comuni-autocomplete-${Math.random().toString(36).substr(2, 9)}`)

// Placeholder dinamico
const currentPlaceholder = computed(() => {
  if (loadingTuttiComuni.value) {
    return 'Caricamento comuni...'
  }
  if (!props.provinciaId) {
    return 'Seleziona prima una provincia'
  }
  return props.placeholder
})

// Comuni filtrati in base alla provincia e al testo di ricerca
const filteredComuni = computed(() => {
  if (!props.provinciaId) {
    return []
  }
  return filterComuniByProvincia(props.provinciaId, searchText.value)
})

// Watch del modelValue per sincronizzare con il componente padre
watch(
  () => props.modelValue,
  (newValue) => {
    selectedComuneId.value = newValue

    if (newValue) {
      // Trova il comune e imposta il testo dell'input
      const comune = findComuneById(newValue)
      if (comune) {
        searchText.value = comune.nome
      }
    } else {
      // Reset dell'input se il valore è nullo
      searchText.value = ''
    }
  },
  { immediate: true }
)

// Watch per aggiornare il testo quando si caricano i comuni
watch(
  () => [props.modelValue, props.provinciaId],
  () => {
    // Ricalcola il testo dell'input se abbiamo un ID ma non il nome
    if (selectedComuneId.value && !searchText.value) {
      const comune = findComuneById(selectedComuneId.value)
      if (comune) {
        searchText.value = comune.nome
      }
    }
  },
  { immediate: true }
)

// Watch della provincia per reset del comune quando cambia
watch(
  () => props.provinciaId,
  (newProvinciaId, oldProvinciaId) => {
    // Reset del comune solo se la provincia è effettivamente cambiata
    if (newProvinciaId !== oldProvinciaId) {
      // Reset solo se il comune attualmente selezionato non appartiene alla nuova provincia
      if (selectedComuneId.value) {
        const comune = findComuneById(selectedComuneId.value)
        if (!comune || comune.provincia?.id !== newProvinciaId) {
          // Reset perché il comune non appartiene alla nuova provincia
          selectedComuneId.value = null
          searchText.value = ''
          emit('update:modelValue', null)
          emit('comune-changed', null)
        }
      }

      // Chiudi dropdown quando cambia provincia
      showDropdown.value = false
      highlightedIndex.value = -1
    }
  }
)

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
  }
}

// Gestione input dell'utente
const handleInput = () => {
  if (!props.provinciaId) return

  // Se l'utente sta digitando, reset della selezione
  if (selectedComuneId.value) {
    selectedComuneId.value = null
    emit('update:modelValue', null)
    emit('comune-changed', null)
  }

  // Calcola posizione e mostra dropdown
  calculateDropdownPosition()
  showDropdown.value = true
  highlightedIndex.value = -1
}

// Gestione focus dell'input
const handleFocus = () => {
  if (!props.disabled && !loadingTuttiComuni.value && props.provinciaId) {
    // Assicurati che i dati siano caricati prima di aprire il dropdown
    if (tuttiIComuni.value.length === 0) {
      console.log('📥 Comuni non caricati - caricamento forzato')
      loadAllComuni().then(() => {
        if (tuttiIComuni.value.length > 0) {
          calculateDropdownPosition()
          showDropdown.value = true
          highlightedIndex.value = -1
          console.log('✅ Dropdown comuni aperto dopo caricamento')
        }
      }).catch(error => {
        console.error('❌ Errore caricamento comuni al focus:', error)
      })
    } else {
      calculateDropdownPosition()
      showDropdown.value = true
      highlightedIndex.value = -1
      console.log('✅ Dropdown comuni aperto')
    }
  } else {
    console.log('❌ Dropdown comuni NON aperto - condizioni non soddisfatte:', {
      disabled: props.disabled,
      loading: loadingTuttiComuni.value,
      provinciaId: props.provinciaId
    })
  }
}

// Gestione blur dell'input (con delay per permettere click su dropdown)
const handleBlur = () => {
  blurTimeout.value = setTimeout(() => {
    showDropdown.value = false
    highlightedIndex.value = -1

    // Validazione: se il testo non corrisponde a un comune valido, reset
    if (searchText.value && !selectedComuneId.value && props.provinciaId) {
      const comuniProvincia = filterComuniByProvincia(props.provinciaId, '')
      const comuneEsistente = comuniProvincia.find(c =>
        c.nome.toLowerCase() === searchText.value.toLowerCase()
      )

      if (!comuneEsistente) {
        // Reset se non è un comune valido per questa provincia
        searchText.value = ''
        emit('update:modelValue', null)
        emit('comune-changed', null)
      }
    }
  }, 1000) // Aumentato da 500 a 1000ms per le modali
}

// Gestione navigazione con tastiera
const handleKeydown = (event) => {
  if (!showDropdown.value || !props.provinciaId) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(
        highlightedIndex.value + 1,
        filteredComuni.value.length - 1
      )
      break

    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break

    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0 && filteredComuni.value[highlightedIndex.value]) {
        selectComune(filteredComuni.value[highlightedIndex.value])
      }
      break

    case 'Escape':
      event.preventDefault()
      showDropdown.value = false
      highlightedIndex.value = -1
      break
  }
}

// Selezione di un comune dal dropdown
const selectComune = (comune) => {
  // Cancella il timeout del blur
  if (blurTimeout.value) {
    clearTimeout(blurTimeout.value)
    blurTimeout.value = null
  }

  // Imposta il comune selezionato
  selectedComuneId.value = comune.id
  searchText.value = comune.nome
  showDropdown.value = false
  highlightedIndex.value = -1

  // Emette gli eventi al componente padre
  emit('update:modelValue', comune.id)
  emit('comune-changed', comune)
}

// Toggle dropdown (click sull'icona)
const toggleDropdown = () => {
  if (props.disabled || loadingTuttiComuni.value || !props.provinciaId) return

  if (!showDropdown.value) {
    calculateDropdownPosition()
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
  selectedComuneId.value = null
  searchText.value = ''
  showDropdown.value = false
  highlightedIndex.value = -1

  // Emette gli eventi al componente padre con null
  emit('update:modelValue', null)
  emit('comune-changed', null)

  console.log('🗑️ Selezione comune rimossa')
}
</script>

<style scoped>
.comuni-autocomplete-wrapper {
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

.comune-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comune-nome {
  font-weight: 500;
  color: #374151;
}

.comune-provincia {
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
  padding: 0.75rem 2.5rem 0.75rem 0.75rem; /* Padding extra a destra per l'icona */
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background-color: #ffffff;
  /* Text truncation to prevent overlap with dropdown icon */
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
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
