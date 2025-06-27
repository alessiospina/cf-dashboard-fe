<template>
  <!-- Tab per la gestione delle Prestazioni -->
  <div class="prestazioni-tab">
    <!-- Header con pulsante Aggiungi e barra ricerca -->
    <CRow class="align-items-center mb-4">
      <CCol md="6">
        <h5 class="mb-2">
          <CIcon icon="cil-medical-cross" class="me-2" />
          Prestazioni
        </h5>
        <small v-if="!loading && prestazioni.length > 0" class="text-muted">
          {{ filteredPrestazioni.length }} di {{ prestazioni.length }} prestazioni
        </small>
      </CCol>
      <CCol md="3">
        <!-- Barra di ricerca -->
        <CInputGroup>
          <CFormInput
            v-model="searchTerm"
            placeholder="Cerca per tipologia o colore..."
            :disabled="loading"
          />
          <CInputGroupText>
            <CIcon icon="cil-magnifying-glass" />
          </CInputGroupText>
        </CInputGroup>
      </CCol>
      <CCol md="3" class="text-end">
        <CButton
          color="primary"
          @click="$emit('create')"
          :disabled="loading"
        >
          <CIcon icon="cil-plus" class="me-2" />
          Nuova Prestazione
        </CButton>
      </CCol>
    </CRow>

    <!-- Stato di caricamento -->
    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <p class="mt-2 text-muted">Caricamento prestazioni...</p>
    </div>

    <!-- Messaggio di errore -->
    <CAlert v-else-if="error" color="danger" class="d-flex align-items-center justify-content-between">
      <div>
        <CIcon icon="cil-warning" class="me-2" />
        {{ error }}
      </div>
      <CButton
        color="light"
        size="sm"
        @click="$emit('refresh')"
      >
        <CIcon icon="cil-reload" class="me-1" />
        Riprova
      </CButton>
    </CAlert>

    <!-- Lista prestazioni -->
    <div v-else-if="filteredPrestazioni.length > 0">
      <!-- Vista a griglia delle prestazioni -->
      <CRow>
        <CCol
          v-for="prestazione in filteredPrestazioni"
          :key="prestazione.id"
          lg="4"
          md="6"
          class="mb-4"
        >
          <!-- Card della prestazione -->
          <CCard class="prestazione-card h-100">
            <!-- Header della card con colore -->
            <CCardHeader
              class="prestazione-header text-white d-flex align-items-center justify-content-between"
              :style="{ backgroundColor: prestazione.color }"
            >
              <div class="d-flex align-items-center">
                <CIcon icon="cil-medical-cross" class="me-2" />
                <span class="fw-bold">{{ prestazione.tipologia }}</span>
              </div>
              <!-- Dropdown azioni -->
              <CDropdown class="prestazione-dropdown">
                <CDropdownToggle
                  color="light"
                  variant="ghost"
                  size="sm"
                  class="text-white"
                  style="border: none; box-shadow: none;"
                  caret
                >
                  <CIcon icon="cil-options" />
                </CDropdownToggle>
                <CDropdownMenu class="prestazione-dropdown-menu">
                  <CDropdownItem @click="$emit('edit', prestazione)">
                    <CIcon icon="cil-pencil" class="me-2" />
                    Modifica
                  </CDropdownItem>
                  <CDropdownDivider />
                  <CDropdownItem
                    @click="$emit('delete', prestazione)"
                    class="text-danger"
                  >
                    <CIcon icon="cil-trash" class="me-2" />
                    Elimina
                  </CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </CCardHeader>

            <!-- Corpo della card -->
            <CCardBody>
              <!-- Informazioni prestazione -->
              <div class="mb-3">
                <!-- Prezzo della prestazione -->
                <div class="d-flex align-items-center mb-2">
                  <strong class="me-2">Prezzo:</strong>
                  <span class="prezzo-text fw-bold text-success">{{ formatPrezzo(prestazione.prezzo) }}</span>
                </div>

                <!-- Colore con preview -->
                <div class="d-flex align-items-center mb-2">
                  <strong class="me-2">Colore:</strong>
                  <div
                    class="color-preview me-2"
                    :style="{ backgroundColor: prestazione.color }"
                  ></div>
                  <code class="text-muted small">{{ prestazione.color }}</code>
                </div>

                <!-- Data creazione -->
                <div class="d-flex align-items-center text-muted small">
                  <CIcon icon="cil-calendar" class="me-2" />
                  Creata: {{ formatDate(prestazione.createdAt) }}
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>

    <!-- Stato vuoto -->
    <div v-else class="text-center py-5">
      <CIcon icon="cil-medical-cross" size="3xl" class="text-muted mb-3" />
      <h5 class="text-muted">
        {{ searchTerm ? 'Nessuna prestazione trovata' : 'Nessuna prestazione presente' }}
      </h5>
      <p class="text-muted">
        {{ searchTerm
          ? 'Prova a modificare i criteri di ricerca'
          : 'Inizia aggiungendo la prima prestazione'
        }}
      </p>
      <CButton
        v-if="!searchTerm"
        color="primary"
        @click="$emit('create')"
      >
        <CIcon icon="cil-plus" class="me-2" />
        Aggiungi Prima Prestazione
      </CButton>
    </div>
  </div>
</template>

<script setup>
/**
 * Componente Tab Prestazioni
 *
 * Gestisce la visualizzazione e le azioni per le prestazioni
 * in formato griglia con card colorate
 */

import { ref, computed } from 'vue'

// Props
const props = defineProps({
  prestazioni: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  }
})

// Eventi emessi al componente padre
const emit = defineEmits(['create', 'edit', 'delete', 'refresh'])

// Stato locale per la ricerca
const searchTerm = ref('')

// Computed properties
const filteredPrestazioni = computed(() => {
  if (!searchTerm.value) return props.prestazioni

  const search = searchTerm.value.toLowerCase()
  return props.prestazioni.filter(prestazione =>
    prestazione.tipologia?.toLowerCase().includes(search) ||
    prestazione.color?.toLowerCase().includes(search)
  )
})

// Metodi utility
const formatDate = (dateString) => {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

const formatPrezzo = (prezzo) => {
  // Se il prezzo non è definito o è null
  if (prezzo === null || prezzo === undefined) return '-'

  // Converte il prezzo in numero se è una stringa
  const prezzoNumero = typeof prezzo === 'string' ? parseFloat(prezzo) : prezzo

  // Se non è un numero valido
  if (isNaN(prezzoNumero)) return '-'

  // Formatta il prezzo in Euro con punto come separatore decimale
  return '€ ' + prezzoNumero.toFixed(2)
}
</script>

<style scoped>
/**
 * Stili specifici per il tab Prestazioni
 */

.prestazioni-tab {
  min-height: 400px;
}

/* Card prestazione */
.prestazione-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.prestazione-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Header della card */
.prestazione-header {
  border-bottom: none;
  padding: 1rem;
}

/* Preview del colore */
.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* Stile per il prezzo */
.prezzo-text {
  font-size: 1.1rem;
  color: #28a745 !important;
}

/* Dropdown nel header */
.prestazione-header .dropdown-toggle {
  color: white !important;
  border: none;
  background: rgba(255, 255, 255, 0.2);
}

.prestazione-header .dropdown-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
}

.prestazione-header .dropdown-toggle::after {
  border-top-color: white;
}

/* Fix per z-index del dropdown menu */
.prestazione-dropdown {
  position: relative;
  z-index: 10;
}

.prestazione-dropdown-menu {
  z-index: 1060 !important;
  position: absolute !important;
  will-change: transform;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

/* Stati vuoti migliorati */
.empty-state-icon {
  opacity: 0.5;
  transition: opacity 0.3s ease-in-out;
}

.empty-state-icon:hover {
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 768px) {
  .prestazioni-tab .col-md-6,
  .prestazioni-tab .col-md-3 {
    margin-bottom: 1rem;
  }

  .prestazione-card {
    margin-bottom: 1rem;
  }

  .prestazione-header {
    padding: 0.75rem;
  }

  .prestazione-header .fw-bold {
    font-size: 0.9rem;
  }
}

/* Supporto tema dark */
[data-coreui-theme="dark"] .prestazione-card {
  background-color: #3b4252;
  border-color: #4c566a;
}

[data-coreui-theme="dark"] .color-preview {
  border-color: #4c566a;
}
</style>
