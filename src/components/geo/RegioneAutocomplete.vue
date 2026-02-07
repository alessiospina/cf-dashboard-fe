<template>
  <!--
    Componente Autocomplete Regioni riusabile

    Questo componente gestisce l'autocomplete per la selezione di una regione italiana
    con filtro real-time e validazione per impedire selezioni non valide.
  -->
  <div class="regione-autocomplete-wrapper">
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
        :disabled="disabled || loadingRegioni"
        :class="inputClass"
        autocomplete="off"
        role="combobox"
        :aria-expanded="showDropdown"
        :aria-autocomplete="'list'"
      />

      <!-- Icona di caricamento -->
      <div v-if="loadingRegioni" class="loading-icon">
        <CSpinner size="sm" />
      </div>

      <!-- Pulsante rimuovi selezione (solo se c'è una selezione) -->
      <div
        v-else-if="selectedRegioneId && !disabled"
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
        <div v-if="filteredRegioni.length === 0" class="dropdown-item no-results">
          <CIcon icon="cil-magnifying-glass" class="me-2 text-muted" />
          Nessuna regione trovata
        </div>

        <!-- Lista regioni filtrate -->
        <div
          v-for="(regione, index) in filteredRegioni"
          :key="regione.id"
          class="dropdown-item"
          :class="{ 'highlighted': index === highlightedIndex }"
          @click="selectRegione(regione)"
          @mouseenter="highlightedIndex = index"
          role="option"
          :aria-selected="selectedRegioneId === regione.id"
        >
          <div class="regione-info">
            <div class="regione-nome">{{ regione.nome }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Messaggio di errore -->
    <CFormFeedback v-if="invalid && errorMessage" invalid>
      {{ errorMessage }}
    </CFormFeedback>

    <!-- Errore di caricamento -->
    <small v-if="errorRegioni" class="text-danger">
      {{ errorRegioni }}
      <CButton
        size="sm"
        color="link"
        class="p-0 ms-1"
        @click="loadRegioni"
      >
        Riprova
      </CButton>
    </small>
  </div>
</template>

<script setup>
/**
 * Componente Autocomplete Regioni
 *
 * Props:
 * - modelValue: ID della regione selezionata
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
 * - regione-changed: emesso con i dati completi della regione
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
    default: 'Cerca una regione...'
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
const emit = defineEmits(['update:modelValue', 'regione-changed'])

// Composable geografico
const {
  regioni,
  loadingRegioni,
  errorRegioni,
  loadRegioni,
  getRegioneById,
  filterRegioni
} = useGeo()

// Stato del componente
const searchText = ref('') // Testo digitato dall'utente
const showDropdown = ref(false) // Visibilità dropdown
const highlightedIndex = ref(-1) // Indice elemento evidenziato
const selectedRegioneId = ref(null) // ID regione selezionata
const blurTimeout = ref(null) // Timeout per gestire blur
const dropdownPosition = ref({ top: 0, left: 0, width: 0 }) // Posizione dropdown

// ID univoco per il campo input
const inputId = computed(() => `regione-autocomplete-${Math.random().toString(36).substr(2, 9)}`)

// Placeholder dinamico
const currentPlaceholder = computed(() => {
  if (loadingRegioni.value) {
    return 'Caricamento regioni...'
  }
  return props.placeholder
})

// Regioni filtrate in base al testo di ricerca
const filteredRegioni = computed(() => {
  return filterRegioni(searchText.value)
})

// Watch del modelValue per sincronizzare con il componente padre
watch(
  () => props.modelValue,
  (newValue) => {
    selectedRegioneId.value = newValue

    if (newValue) {
      // Trova la regione e imposta il testo dell'input
      const regione = getRegioneById(newValue)
      if (regione) {
        searchText.value = regione.nome
      }
    } else {
      // Reset dell'input se il valore è nullo
      searchText.value = ''
    }
  },
  { immediate: true }
)

// Watch per aggiornare il testo quando si caricano le regioni
watch(
  () => regioni.value,
  () => {
    // Ricalcola il testo dell'input se abbiamo un ID ma non il nome
    if (selectedRegioneId.value && !searchText.value) {
      const regione = getRegioneById(selectedRegioneId.value)
      if (regione) {
        searchText.value = regione.nome
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
  console.log('⌨️ Input digitato in RegioneAutocomplete:', searchText.value)
  console.log('📊 Debug handleInput:', {
    searchLength: searchText.value.length,
    disabled: props.disabled,
    loadingRegioni: loadingRegioni.value,
    regioniCount: regioni.value.length,
    currentDropdownState: showDropdown.value
  })

  // Se l'utente sta digitando, reset della selezione
  if (selectedRegioneId.value) {
    selectedRegioneId.value = null
    emit('update:modelValue', null)
    emit('regione-changed', null)
  }

  // Calcola posizione e mostra dropdown
  try {
    calculateDropdownPosition()
    showDropdown.value = true
    highlightedIndex.value = -1

    console.log('📋 Dropdown impostato:', {
      showDropdown: showDropdown.value,
      filteredCount: filteredRegioni.value.length,
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
  console.log('🎯 Focus su RegioneAutocomplete:', {
    disabled: props.disabled,
    loadingRegioni: loadingRegioni.value,
    regioniCount: regioni.value.length
  })

  if (!props.disabled && !loadingRegioni.value) {
    // Assicurati che i dati siano caricati prima di aprire il dropdown
    if (regioni.value.length === 0) {
      console.log('📥 Regioni non caricate - caricamento forzato')
      loadRegioni().then(() => {
        if (regioni.value.length > 0) {
          calculateDropdownPosition()
          showDropdown.value = true
          highlightedIndex.value = -1
          console.log('✅ Dropdown aperto dopo caricamento regioni')
        }
      }).catch(error => {
        console.error('❌ Errore caricamento regioni al focus:', error)
      })
    } else {
      calculateDropdownPosition()
      showDropdown.value = true
      highlightedIndex.value = -1
      console.log('✅ Dropdown aperto per regioni')
    }
  } else {
    console.log('❌ Dropdown NON aperto - condizioni non soddisfatte')
  }
}

// Gestione blur dell'input (con delay per permettere click su dropdown)
const handleBlur = () => {
  console.log('🔄 Blur su RegioneAutocomplete - impostato timeout')

  blurTimeout.value = setTimeout(() => {
    console.log('⏰ Timeout blur eseguito - chiudo dropdown')
    showDropdown.value = false
    highlightedIndex.value = -1

    // Validazione: se il testo non corrisponde a una regione valida, reset
    if (searchText.value && !selectedRegioneId.value) {
      const regioneEsistente = regioni.value.find(r =>
        r.nome.toLowerCase() === searchText.value.toLowerCase()
      )

      if (!regioneEsistente) {
        // Reset se non è una regione valida
        searchText.value = ''
        emit('update:modelValue', null)
        emit('regione-changed', null)
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
        filteredRegioni.value.length - 1
      )
      break

    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break

    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0 && filteredRegioni.value[highlightedIndex.value]) {
        selectRegione(filteredRegioni.value[highlightedIndex.value])
      }
      break

    case 'Escape':
      event.preventDefault()
      showDropdown.value = false
      highlightedIndex.value = -1
      break
  }
}

// Selezione di una regione dal dropdown
const selectRegione = (regione) => {
  // Cancella il timeout del blur
  if (blurTimeout.value) {
    clearTimeout(blurTimeout.value)
    blurTimeout.value = null
  }

  // Imposta la regione selezionata
  selectedRegioneId.value = regione.id
  searchText.value = regione.nome
  showDropdown.value = false
  highlightedIndex.value = -1

  // Emette gli eventi al componente padre
  emit('update:modelValue', regione.id)
  emit('regione-changed', regione)
}

// Toggle dropdown (click sull'icona)
const toggleDropdown = () => {
  if (props.disabled || loadingRegioni.value) return

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
  selectedRegioneId.value = null
  searchText.value = ''
  showDropdown.value = false
  highlightedIndex.value = -1

  // Emette gli eventi al componente padre con null
  emit('update:modelValue', null)
  emit('regione-changed', null)

  console.log('🗑️ Selezione regione rimossa')
}
</script>

<style scoped>
.regione-autocomplete-wrapper {
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

.regione-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.regione-nome {
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
