<template>
  <!--
    Pagina principale per la gestione dei Pazienti

    Questa pagina include:
    - Header con titolo e pulsante per aggiungere paziente
    - Barra di ricerca
    - Tabella paginata dei pazienti
    - Modale per creazione/modifica
    - Gestione notifiche
  -->
  <div class="pazienti-page">
    <!-- Header della pagina -->
    <CRow class="mb-4">
      <CCol>
        <h2 class="page-title">
          <CIcon icon="cil-people" class="me-2" />
          Gestione Pazienti
        </h2>
        <p class="text-muted">
          Gestisci i pazienti del centro
        </p>
      </CCol>
      <CCol md="auto">
        <CButton
          color="primary"
          @click="openCreateModal"
          :disabled="loading"
        >
          <CIcon icon="cil-plus" class="me-2" />
          Nuovo Paziente
        </CButton>
      </CCol>
    </CRow>

    <!-- Notifica -->
    <CAlert
      v-if="notification"
      :color="notification.type === 'error' ? 'danger' : notification.type"
      dismissible
      @close="clearNotification"
      class="mb-4"
    >
      {{ notification.message }}
    </CAlert>

    <!-- Card contenitore principale -->
    <CCard>
      <CCardHeader>
        <CRow class="align-items-center">
          <CCol>
            <h5 class="mb-0">Lista Pazienti</h5>
          </CCol>
          <CCol md="4">
            <!-- Barra di ricerca -->
            <CInputGroup>
              <CFormInput
                v-model="searchTerm"
                placeholder="Cerca per nome, cognome o email..."
                :disabled="loading"
              />
              <CInputGroupText>
                <CIcon icon="cil-magnifying-glass" />
              </CInputGroupText>
            </CInputGroup>
          </CCol>
        </CRow>
      </CCardHeader>

      <CCardBody>
        <!-- Stato di caricamento -->
        <div v-if="loading" class="text-center py-4">
          <CSpinner color="primary" />
          <p class="mt-2 text-muted">Caricamento pazienti...</p>
        </div>

        <!-- Messaggio di errore -->
        <CAlert v-else-if="error" color="danger">
          {{ error }}
          <CButton
            color="link"
            size="sm"
            @click="loadPazienti"
            class="ms-2"
          >
            Riprova
          </CButton>
        </CAlert>

        <!-- Tabella pazienti -->
        <div v-else-if="filteredPazienti.length > 0">
          <!-- Info risultati -->
          <p class="text-muted small mb-3">
            Mostrando {{ filteredPazienti.length }} di {{ totalPazienti }} pazienti
            <span v-if="searchTerm">
              (filtrati per: "{{ searchTerm }}")
            </span>
          </p>

          <!-- Tabella responsive -->
          <CTable hover responsive striped>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col">Nome Completo</CTableHeaderCell>
                <CTableHeaderCell scope="col">Data di Nascita</CTableHeaderCell>
                <CTableHeaderCell scope="col">Email</CTableHeaderCell>
                <CTableHeaderCell scope="col">Telefono</CTableHeaderCell>
                <CTableHeaderCell scope="col">Tipo Terapia</CTableHeaderCell>
                <CTableHeaderCell scope="col" class="text-center">Azioni</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow
                v-for="paziente in paginatedPazienti"
                :key="paziente.id"
                class="table-row-hover"
              >
                <!-- Nome completo -->
                <CTableDataCell>
                  <div class="fw-semibold">
                    {{ paziente.nome }} {{ paziente.cognome }}
                  </div>
                  <small class="text-muted">
                    CF: {{ paziente.codiceFiscale }}
                  </small>
                </CTableDataCell>

                <!-- Data di nascita -->
                <CTableDataCell>
                  {{ formatDate(paziente.dataDiNascita) }}
                </CTableDataCell>

                <!-- Email -->
                <CTableDataCell>
                  <a :href="`mailto:${paziente.email}`" class="text-decoration-none">
                    {{ paziente.email }}
                  </a>
                </CTableDataCell>

                <!-- Telefono -->
                <CTableDataCell>
                  <span v-if="paziente.telefono">
                    <a :href="`tel:${paziente.telefono}`" class="text-decoration-none">
                      {{ paziente.telefono }}
                    </a>
                  </span>
                  <span v-else class="text-muted">-</span>
                </CTableDataCell>

                <!-- Tipo Terapia -->
                <CTableDataCell>
                  <CBadge
                    :color="getTerapiaBadgeColor(paziente.tipoTerapia)"
                    shape="rounded-pill"
                  >
                    {{ formatTipoTerapia(paziente.tipoTerapia) }}
                  </CBadge>
                </CTableDataCell>

                <!-- Azioni -->
                <CTableDataCell class="text-center">
                  <CButtonGroup size="sm">
                    <CButton
                      color="outline-primary"
                      size="sm"
                      @click="selectPazienteForEdit(paziente)"
                      title="Modifica paziente"
                    >
                      <CIcon icon="cil-pencil" />
                    </CButton>
                    <!-- Placeholder per altre azioni future -->
                    <CButton
                      color="outline-secondary"
                      size="sm"
                      @click="viewPazienteDetails(paziente)"
                      title="Visualizza dettagli"
                    >
                      <CIcon icon="cil-eye" />
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>

          <!-- Paginazione -->
          <CRow class="align-items-center mt-4" v-if="totalPages > 1">
            <CCol md="6">
              <p class="text-muted small mb-0">
                Pagina {{ currentPage }} di {{ totalPages }}
              </p>
            </CCol>
            <CCol md="6">
              <CPagination
                class="justify-content-end"
                :pages="totalPages"
                :active-page="currentPage"
                @item-click="changePage"
                size="sm"
              />
            </CCol>
          </CRow>
        </div>

        <!-- Stato vuoto -->
        <div v-else class="text-center py-5">
          <CIcon icon="cil-people" size="3xl" class="text-muted mb-3" />
          <h5 class="text-muted">
            {{ searchTerm ? 'Nessun paziente trovato' : 'Nessun paziente presente' }}
          </h5>
          <p class="text-muted">
            {{ searchTerm
              ? 'Prova a modificare i criteri di ricerca'
              : 'Inizia aggiungendo il primo paziente'
            }}
          </p>
          <CButton
            v-if="!searchTerm"
            color="primary"
            @click="openCreateModal"
          >
            <CIcon icon="cil-plus" class="me-2" />
            Aggiungi Primo Paziente
          </CButton>
        </div>
      </CCardBody>
    </CCard>

    <!-- Modale per creazione/modifica paziente -->
    <PazienteModal
      :visible="showCreateModal || showEditModal"
      :paziente="selectedPaziente"
      @close="handleModalClose"
      @created="handlePazienteCreated"
      @updated="handlePazienteUpdated"
    />
  </div>
</template>

<script setup>
/**
 * Pagina Gestione Pazienti
 *
 * Questo è il componente principale che orchestrea tutta la gestione dei pazienti.
 * Utilizza:
 * - Composables per la logica riutilizzabile
 * - Componenti child per la modale
 * - Computed properties per la reattività
 * - Lifecycle hooks per il caricamento dati
 */

import { ref, computed, onMounted, watch } from 'vue'
import { usePazienti } from '@/composables/usePazienti'
import PazienteModal from './PazienteModal.vue'

// Utilizziamo il composable per accedere a tutta la logica dei pazienti
const {
  // Stato
  pazienti,
  filteredPazienti,
  loading,
  error,
  selectedPaziente,
  searchTerm,
  showCreateModal,
  showEditModal,
  notification,

  // Metodi
  loadPazienti,
  selectPazienteForEdit,
  openCreateModal,
  closeCreateModal,
  closeEditModal,
  clearNotification,

  // Utility
  formatDate,
  formatTipoTerapia,
  calculateAge
} = usePazienti()

// Stato locale per la paginazione
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Computed properties per la paginazione
const totalPazienti = computed(() => filteredPazienti.value.length)
const totalPages = computed(() => Math.ceil(totalPazienti.value / itemsPerPage.value))

const paginatedPazienti = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredPazienti.value.slice(start, end)
})

// Metodi per la gestione della paginazione
const changePage = (pageNumber) => {
  if (pageNumber >= 1 && pageNumber <= totalPages.value) {
    currentPage.value = pageNumber
  }
}

// Reset paginazione quando cambia la ricerca
const resetPagination = () => {
  currentPage.value = 1
}

// Watch del termine di ricerca per reset paginazione
watch(searchTerm, resetPagination)

// Gestione eventi modale
const handleModalClose = () => {
  if (showCreateModal.value) {
    closeCreateModal()
  } else if (showEditModal.value) {
    closeEditModal()
  }
}

const handlePazienteCreated = (newPaziente) => {
  console.log('Paziente creato:', newPaziente)
  // Il composable si occupa già di aggiornare la lista
  resetPagination()
}

const handlePazienteUpdated = (updatedPaziente) => {
  console.log('Paziente aggiornato:', updatedPaziente)
  // Il composable si occupa già di aggiornare la lista
}

// Utility per il colore dei badge delle terapie
const getTerapiaBadgeColor = (tipoTerapia) => {
  const colors = {
    'LOGOPEDIA': 'primary',
    'NEUROPSICHIATRIA_INFANTILE': 'success',
    'NEUROPSICOMOTRICITÀ': 'info',
    'TERAPIA_ABA': 'warning',
    'PSICOLOGA': 'secondary',
    'COLLOQUIO_CONOSCITIVO': 'dark'
  }
  return colors[tipoTerapia] || 'light'
}

// Placeholder per visualizzazione dettagli (da implementare)
const viewPazienteDetails = (paziente) => {
  console.log('Visualizza dettagli paziente:', paziente)
  // TODO: implementare visualizzazione dettagli
}

// Caricamento dati all'avvio
onMounted(() => {
  // I dati vengono caricati automaticamente dal composable
  console.log('Pagina Pazienti caricata')
})
</script>

<style scoped>
/**
 * Stili specifici per la pagina Pazienti
 */

.pazienti-page {
  padding: 0;
}

.page-title {
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.table-row-hover {
  transition: background-color 0.15s ease-in-out;
}

.table-row-hover:hover {
  background-color: rgba(0, 123, 255, 0.05) !important;
}

/* Styling per i link nella tabella */
.table a {
  color: inherit;
  transition: color 0.15s ease-in-out;
}

.table a:hover {
  color: #0056b3;
}

/* Responsive miglioramenti */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .table-responsive {
    font-size: 0.875rem;
  }

  .btn-group .btn {
    padding: 0.25rem 0.5rem;
  }
}

/* Animazioni per i badge */
.badge {
  transition: transform 0.15s ease-in-out;
}

.badge:hover {
  transform: scale(1.05);
}

/* Loading state miglioramenti */
.spinner-border {
  animation: spinner-border 0.75s linear infinite;
}

/* Notifiche con animazione */
.alert {
  animation: slideInDown 0.3s ease-out;
}

@keyframes slideInDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Stati vuoti migliorati */
.empty-state-icon {
  opacity: 0.5;
  transition: opacity 0.3s ease-in-out;
}

.empty-state-icon:hover {
  opacity: 0.7;
}
</style>
