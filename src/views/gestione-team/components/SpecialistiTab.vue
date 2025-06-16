<template>
  <!-- Tab per la gestione degli Specialisti -->
  <div class="specialisti-tab">
    <!-- Header con pulsante Aggiungi e barra ricerca -->
    <CRow class="align-items-center mb-4">
      <CCol md="6">
        <h5 class="mb-2">
          <CIcon icon="cil-user" class="me-2" />
          Specialisti
        </h5>
        <small v-if="!loading && specialisti.length > 0" class="text-muted">
          {{ filteredSpecialisti.length }} di {{ specialisti.length }} specialisti
        </small>
      </CCol>
      <CCol md="3">
        <!-- Barra di ricerca -->
        <CInputGroup>
          <CFormInput
            v-model="searchTerm"
            placeholder="Cerca per nome, email, telefono..."
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
          Nuovo Specialista
        </CButton>
      </CCol>
    </CRow>

    <!-- Stato di caricamento -->
    <div v-if="loading" class="text-center py-5">
      <CSpinner color="primary" />
      <p class="mt-2 text-muted">Caricamento specialisti...</p>
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

    <!-- Lista specialisti -->
    <div v-else-if="filteredSpecialisti.length > 0">
      <!-- Tabella responsiva -->
      <CTable hover responsive striped>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell scope="col">Specialista</CTableHeaderCell>
            <CTableHeaderCell scope="col">Contatti</CTableHeaderCell>
            <CTableHeaderCell scope="col">Prestazione</CTableHeaderCell>
            <CTableHeaderCell scope="col">Data Creazione</CTableHeaderCell>
            <CTableHeaderCell scope="col" class="text-center">Azioni</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          <CTableRow
            v-for="specialista in filteredSpecialisti"
            :key="specialista.id"
            class="table-row-hover"
          >
            <!-- Nome e cognome -->
            <CTableDataCell>
              <div class="d-flex align-items-center">
                <!-- Avatar placeholder -->
                <div class="avatar-placeholder me-3">
                  <CIcon icon="cil-user" size="lg" />
                </div>
                <div>
                  <div class="fw-semibold">
                    {{ getFullName(specialista) }}
                  </div>
                  <small class="text-muted">
                    ID: {{ specialista.id }}
                  </small>
                </div>
              </div>
            </CTableDataCell>

            <!-- Contatti -->
            <CTableDataCell>
              <div class="contact-info">
                <!-- Email -->
                <div class="mb-1">
                  <CIcon icon="cil-envelope-closed" class="me-2 text-muted" size="sm" />
                  <a :href="`mailto:${specialista.email}`" class="text-decoration-none">
                    {{ specialista.email }}
                  </a>
                </div>
                <!-- Telefono -->
                <div v-if="specialista.telefono">
                  <CIcon icon="cil-phone" class="me-2 text-muted" size="sm" />
                  <a :href="`tel:${specialista.telefono}`" class="text-decoration-none">
                    {{ specialista.telefono }}
                  </a>
                </div>
                <div v-else class="text-muted small">
                  <CIcon icon="cil-phone" class="me-2" size="sm" />
                  Non specificato
                </div>
              </div>
            </CTableDataCell>

            <!-- Prestazione -->
            <CTableDataCell>
              <div v-if="specialista.prestazione" class="d-flex align-items-center">
                <!-- Indicatore colore prestazione -->
                <div
                  class="prestazione-indicator me-2"
                  :style="{ backgroundColor: specialista.prestazione.color }"
                ></div>
                <span class="fw-medium">{{ specialista.prestazione.tipologia }}</span>
              </div>
              <div v-else class="text-muted">
                <CIcon icon="cil-warning" class="me-1" />
                Prestazione non assegnata
              </div>
            </CTableDataCell>

            <!-- Data creazione -->
            <CTableDataCell>
              <div class="text-muted small">
                <CIcon icon="cil-calendar" class="me-1" />
                {{ formatDate(specialista.createdAt) }}
              </div>
            </CTableDataCell>

            <!-- Azioni -->
            <CTableDataCell class="text-center">
              <CButtonGroup size="sm">
                <CButton
                  variant="outline"
                  color="primary"
                  size="sm"
                  @click="$emit('edit', specialista)"
                  title="Modifica specialista"
                >
                  <CIcon icon="cil-pencil" />
                </CButton>
                <CButton
                  variant="outline"
                  color="danger"
                  size="sm"
                  @click="$emit('delete', specialista)"
                  title="Elimina specialista"
                >
                  <CIcon icon="cil-trash" />
                </CButton>
              </CButtonGroup>
            </CTableDataCell>
          </CTableRow>
        </CTableBody>
      </CTable>
    </div>

    <!-- Stato vuoto -->
    <div v-else class="text-center py-5">
      <CIcon icon="cil-user" size="3xl" class="text-muted mb-3" />
      <h5 class="text-muted">
        {{ searchTerm ? 'Nessuno specialista trovato' : 'Nessuno specialista presente' }}
      </h5>
      <p class="text-muted">
        {{ searchTerm
          ? 'Prova a modificare i criteri di ricerca'
          : 'Inizia aggiungendo il primo specialista'
        }}
      </p>
      <CButton
        v-if="!searchTerm"
        color="primary"
        @click="$emit('create')"
      >
        <CIcon icon="cil-plus" class="me-2" />
        Aggiungi Primo Specialista
      </CButton>
    </div>
  </div>
</template>

<script setup>
/**
 * Componente Tab Specialisti
 *
 * Gestisce la visualizzazione e le azioni per gli specialisti
 * in formato tabella con informazioni dettagliate
 */

import { ref, computed } from 'vue'

// Props
const props = defineProps({
  specialisti: {
    type: Array,
    default: () => []
  },
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
const filteredSpecialisti = computed(() => {
  if (!searchTerm.value) return props.specialisti

  const search = searchTerm.value.toLowerCase()
  return props.specialisti.filter(specialista =>
    specialista.nome?.toLowerCase().includes(search) ||
    specialista.cognome?.toLowerCase().includes(search) ||
    specialista.email?.toLowerCase().includes(search) ||
    specialista.telefono?.toLowerCase().includes(search) ||
    specialista.prestazione?.tipologia?.toLowerCase().includes(search)
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

const getFullName = (specialista) => {
  if (!specialista) return ''
  return `${specialista.nome || ''} ${specialista.cognome || ''}`.trim()
}

// Metodi per le statistiche
const getPrestazioniWithSpecialisti = () => {
  const prestazioniAttive = new Set()
  props.specialisti.forEach(specialista => {
    if (specialista.prestazione?.id) {
      prestazioniAttive.add(specialista.prestazione.id)
    }
  })
  return prestazioniAttive.size
}

const getSpecialistiWithEmail = () => {
  return props.specialisti.filter(s => s.email).length
}

const getSpecialistiWithPhone = () => {
  return props.specialisti.filter(s => s.telefono).length
}
</script>

<style scoped>
/**
 * Stili specifici per il tab Specialisti
 */

.specialisti-tab {
  min-height: 400px;
}

/* Avatar placeholder */
.avatar-placeholder {
  width: 48px;
  height: 48px;
  background-color: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  border: 2px solid #e9ecef;
}

/* Indicatore colore prestazione */
.prestazione-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* Informazioni contatto */
.contact-info {
  font-size: 0.9rem;
}

.contact-info a {
  color: inherit;
  transition: color 0.15s ease-in-out;
}

.contact-info a:hover {
  color: #0056b3;
}

/* Hover della riga */
.table-row-hover {
  transition: background-color 0.15s ease-in-out;
}

.table-row-hover:hover {
  background-color: rgba(0, 123, 255, 0.05) !important;
}

/* Panel statistiche */
.statistics-panel {
  border: 1px solid #e9ecef;
}

.stat-item {
  padding: 1rem 0;
}

.stat-number {
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  .specialisti-tab .col-md-6,
  .specialisti-tab .col-md-3 {
    margin-bottom: 1rem;
  }

  .avatar-placeholder {
    width: 40px;
    height: 40px;
  }

  .contact-info {
    font-size: 0.8rem;
  }

  .statistics-panel .col-md-3 {
    margin-bottom: 1rem;
  }

  .stat-item {
    padding: 0.5rem 0;
  }
}

/* Supporto tema dark */
[data-coreui-theme="dark"] .avatar-placeholder {
  background-color: #3b4252;
  border-color: #4c566a;
  color: #81a1c1;
}

[data-coreui-theme="dark"] .statistics-panel {
  background-color: #3b4252 !important;
  border-color: #4c566a;
}

[data-coreui-theme="dark"] .prestazione-indicator {
  border-color: #4c566a;
}

[data-coreui-theme="dark"] .contact-info a:hover {
  color: #88c0d0;
}
</style>
