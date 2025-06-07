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

    <!-- Notifica con animazioni fade-in/fade-out -->
    <Transition
      name="notification"
      enter-active-class="notification-enter-active"
      leave-active-class="notification-leave-active"
      enter-from-class="notification-enter-from"
      leave-to-class="notification-leave-to"
    >
      <CAlert
        v-if="notification"
        :color="notification.type === 'error' ? 'danger' : notification.type"
        dismissible
        @close="clearNotificationWithTimer"
        class="mb-4 notification-alert"
      >
        {{ notification.message }}
      </CAlert>
    </Transition>

    <!-- Card contenitore principale -->
    <CCard>
      <CCardHeader>
        <CRow class="align-items-center">
          <CCol md="3">
            <h5 class="mb-0">Lista Pazienti</h5>
            <!-- Info di paginazione compatta nell'header -->
            <small v-if="!loading && sortedAndFilteredPazienti.length > 0" class="text-muted">
              {{ paginationInfo.showing }} di {{ paginationInfo.total }} pazienti
            </small>
          </CCol>

          <!-- Controlli paginazione header (mostrati solo se ci sono dati) -->
          <CCol md="5" v-if="!loading && sortedAndFilteredPazienti.length > 0">
            <CRow class="align-items-center justify-content-center">
              <!-- Selettore righe per pagina compatto -->
              <CCol md="auto">
                <div class="d-flex align-items-center">
                  <small class="text-muted me-2">Righe:</small>
                  <CFormSelect
                    v-model="itemsPerPage"
                    @change="handleItemsPerPageChange"
                    size="sm"
                    style="width: 80px;"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <!-- <option :value="sortedAndFilteredPazienti.length">Tutti</option> -->
                  </CFormSelect>
                </div>
              </CCol>

              <!-- Navigazione pagine compatta -->
              <CCol md="auto" v-if="showPagination" class="header-pagination-controls">
                <CButtonGroup size="sm">
                  <CButton
                    color="outline-secondary"
                    @click="goToFirstPage"
                    :disabled="currentPage === 1"
                    title="Prima pagina"
                  >
                    <font-awesome-icon icon="angle-double-left" />
                  </CButton>
                  <CButton
                    color="outline-secondary"
                    @click="goToPreviousPage"
                    :disabled="currentPage === 1"
                    title="Pagina precedente"
                  >
                    <font-awesome-icon icon="angle-left" />
                  </CButton>

                  <!-- Display pagina corrente -->
                  <CButton
                    color="outline-primary"
                    style="min-width: 70px; cursor: default;"
                    disabled
                  >
                    {{ currentPage }}/{{ totalPages }}
                  </CButton>

                  <CButton
                    color="outline-secondary"
                    @click="goToNextPage"
                    :disabled="currentPage === totalPages"
                    title="Pagina successiva"
                  >
                    <font-awesome-icon icon="angle-right" />
                  </CButton>
                  <CButton
                    color="outline-secondary"
                    @click="goToLastPage"
                    :disabled="currentPage === totalPages"
                    title="Ultima pagina"
                  >
                    <font-awesome-icon icon="angle-double-right" />
                  </CButton>
                </CButtonGroup>
              </CCol>
            </CRow>
          </CCol>

          <CCol md="4">
            <!-- Barra di ricerca -->
            <CInputGroup>
              <CFormInput
                v-model="searchTerm"
                placeholder="Cerca per nome, email, telefono, codice fiscale, terapia, data nascita..."
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
        <div v-else-if="sortedAndFilteredPazienti.length > 0">
          <!-- Controlli tabella avanzati -->
          <CRow class="align-items-center mb-3">
            <CCol md="6">
              <!-- Info risultati con ordinamento -->
              <p class="text-muted small mb-0">
                Mostrando {{ paginationInfo.showing }} di {{ paginationInfo.total }} pazienti
                <span v-if="searchTerm">
                  (filtrati per: "{{ searchTerm }}")
                </span>
                <span v-if="sortColumn">
                  - Ordinati per {{ getSortColumnLabel(sortColumn) }}
                  ({{ sortDirection === 'asc' ? 'crescente' : 'decrescente' }})
                </span>
                <span v-else>
                  - Ordine naturale
                </span>
              </p>
            </CCol>
            <CCol md="6">
              <CRow class="align-items-center">
                <!-- Pulsanti selezione globale -->
                <CCol md="auto" class="ms-auto">
                  <CButtonGroup size="sm">
                    <CButton
                      color="outline-primary"
                      @click="selectAllGlobal"
                      :disabled="selectedCount === sortedAndFilteredPazienti.length"
                      title="Seleziona tutti i pazienti (anche nelle altre pagine)"
                    >
                      <CIcon icon="cilCheckCircle" class="me-1" />
                      Seleziona Tutti ({{ sortedAndFilteredPazienti.length }})
                    </CButton>
                    <CButton
                      v-if="hasSelectedPazienti"
                      color="outline-secondary"
                      @click="clearSelection"
                      title="Deseleziona tutti i pazienti"
                    >
                      <CIcon icon="cilX" class="me-1" />
                      Deseleziona ({{ selectedCount }})
                    </CButton>
                  </CButtonGroup>
                </CCol>
              </CRow>
            </CCol>
          </CRow>

          <!-- Toolbar azioni bulk (mostrata solo quando ci sono selezioni) -->
          <CAlert
            v-if="hasSelectedPazienti"
            color="primary"
            class="d-flex align-items-center justify-content-between mb-3"
          >
            <div class="d-flex align-items-center">
              <CIcon icon="cilCheckCircle" class="me-2" />
              <strong>{{ selectedCount }} paziente{{ selectedCount > 1 ? 'i' : '' }} selezionat{{ selectedCount > 1 ? 'i' : 'o' }}</strong>
            </div>
            <div>
              <CButton
                color="light"
                size="sm"
                @click="clearSelection"
                class="me-2"
              >
                <CIcon icon="cilX" class="me-1" />
                Deseleziona tutti
              </CButton>
              <CButton
                color="danger"
                size="sm"
                @click="confirmBulkDelete"
                :disabled="bulkDeleting"
              >
                <CIcon icon="cilTrash" class="me-1" />
                Elimina selezionati
              </CButton>
            </div>
          </CAlert>

          <!-- Tabella responsive con ordinamento -->
          <CTable hover responsive striped>
            <CTableHead>
              <CTableRow>
                <!-- Checkbox per selezione multipla -->
                <CTableHeaderCell scope="col" style="width: 50px;">
                  <CFormCheck
                    :checked="isAllSelected"
                    :indeterminate="isPartiallySelected"
                    @change="toggleSelectAll"
                    title="Seleziona/Deseleziona tutti in questa pagina (usa 'Seleziona Tutti' per tutte le pagine)"
                  />
                </CTableHeaderCell>

                <!-- Nome Completo - Sortable -->
                <CTableHeaderCell
                  scope="col"
                  :class="getSortClass('nomeCompleto')"
                  @click="handleSort('nomeCompleto')"
                  style="cursor: pointer; user-select: none;"
                >
                  <div class="d-flex align-items-center justify-content-between">
                    <span>Nome Completo</span>
                    <CIcon
                      :icon="getSortIcon('nomeCompleto')"
                      size="sm"
                      class="sort-icon"
                    />
                  </div>
                </CTableHeaderCell>

                <!-- Data di Nascita - Sortable -->
                <CTableHeaderCell
                  scope="col"
                  :class="getSortClass('dataDiNascita')"
                  @click="handleSort('dataDiNascita')"
                  style="cursor: pointer; user-select: none;"
                >
                  <div class="d-flex align-items-center justify-content-between">
                    <span>Data di Nascita</span>
                    <CIcon
                      :icon="getSortIcon('dataDiNascita')"
                      size="sm"
                      class="sort-icon"
                    />
                  </div>
                </CTableHeaderCell>

                <!-- Email - Sortable -->
                <CTableHeaderCell
                  scope="col"
                  :class="getSortClass('email')"
                  @click="handleSort('email')"
                  style="cursor: pointer; user-select: none;"
                >
                  <div class="d-flex align-items-center justify-content-between">
                    <span>Email</span>
                    <CIcon
                      :icon="getSortIcon('email')"
                      size="sm"
                      class="sort-icon"
                    />
                  </div>
                </CTableHeaderCell>

                <!-- Telefono - Sortable -->
                <CTableHeaderCell
                  scope="col"
                  :class="getSortClass('telefono')"
                  @click="handleSort('telefono')"
                  style="cursor: pointer; user-select: none;"
                >
                  <div class="d-flex align-items-center justify-content-between">
                    <span>Telefono</span>
                    <CIcon
                      :icon="getSortIcon('telefono')"
                      size="sm"
                      class="sort-icon"
                    />
                  </div>
                </CTableHeaderCell>

                <!-- Tipo Terapia - Sortable -->
                <CTableHeaderCell
                  scope="col"
                  :class="getSortClass('tipoTerapia')"
                  @click="handleSort('tipoTerapia')"
                  style="cursor: pointer; user-select: none;"
                >
                  <div class="d-flex align-items-center justify-content-between">
                    <span>Tipo Terapia</span>
                    <CIcon
                      :icon="getSortIcon('tipoTerapia')"
                      size="sm"
                      class="sort-icon"
                    />
                  </div>
                </CTableHeaderCell>

                <!-- Azioni - Non sortable -->
                <CTableHeaderCell scope="col" class="text-center">
                  Azioni
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow
                v-for="paziente in paginatedPazienti"
                :key="paziente.id"
                class="table-row-hover"
                :class="{ 'table-selected': selectedPazienti.has(paziente.id) }"
              >
                <!-- Checkbox selezione -->
                <CTableDataCell>
                  <CFormCheck
                    :checked="selectedPazienti.has(paziente.id)"
                    @change="togglePazienteSelection(paziente.id)"
                  />
                </CTableDataCell>

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
                      <CIcon icon="cilPencil" />
                    </CButton>
                    <CButton
                      color="outline-danger"
                      size="sm"
                      @click="confirmDeletePaziente(paziente)"
                      title="Elimina paziente"
                    >
                      <CIcon icon="cilTrash" />
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>

          <!-- Paginazione avanzata -->
          <CRow class="align-items-center mt-4" v-if="showPagination">
            <CCol md="4">
              <p class="text-muted small mb-0">
                Pagina {{ currentPage }} di {{ totalPages }}
                ({{ paginationInfo.start }}-{{ paginationInfo.end }} di {{ paginationInfo.total }})
              </p>
            </CCol>
            <CCol md="4" class="text-center">
              <!-- Navigazione veloce -->
              <CButtonGroup size="sm">
                <CButton
                  color="outline-secondary"
                  @click="goToFirstPage"
                  :disabled="currentPage === 1"
                  title="Prima pagina"
                >
                  <font-awesome-icon icon="angle-double-left" />
                </CButton>
                <CButton
                  color="outline-secondary"
                  @click="goToPreviousPage"
                  :disabled="currentPage === 1"
                  title="Pagina precedente"
                >
                  <font-awesome-icon icon="angle-left" />
                </CButton>
                <!-- Input navigazione diretta -->
                <CInputGroup style="width: 100px;">
                  <CFormInput
                    v-model.number="directPageInput"
                    @keyup.enter="goToPage(directPageInput)"
                    @blur="validateDirectPageInput"
                    type="number"
                    :min="1"
                    :max="totalPages"
                    size="sm"
                    class="text-center"
                    title="Inserisci numero pagina"
                  />
                </CInputGroup>
                <CButton
                  color="outline-secondary"
                  @click="goToNextPage"
                  :disabled="currentPage === totalPages"
                  title="Pagina successiva"
                >
                  <font-awesome-icon icon="angle-right" />
                </CButton>
                <CButton
                  color="outline-secondary"
                  @click="goToLastPage"
                  :disabled="currentPage === totalPages"
                  title="Ultima pagina"
                >
                  <font-awesome-icon icon="angle-double-right" />
                </CButton>
              </CButtonGroup>
            </CCol>
            <CCol md="4">
              <!-- Paginazione classica (per numeri di pagina) -->
              <CPagination
                v-if="totalPages <= 10"
                class="justify-content-end"
                :pages="totalPages"
                :active-page="currentPage"
                @item-click="changePage"
                size="sm"
              />
              <!-- Paginazione compatta per molte pagine -->
              <div v-else class="d-flex justify-content-end">
                <small class="text-muted">
                  {{ totalPages }} pagine totali
                </small>
              </div>
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

    <!-- Modale di conferma eliminazione -->
    <CModal
      :visible="showDeleteModal"
      @close="cancelDelete"
      size="md"
      class="delete-confirmation-modal"
    >
      <CModalHeader class="bg-danger text-white">
        <CModalTitle class="d-flex align-items-center">
          <CIcon icon="cilWarning" class="me-2" />
          Conferma Eliminazione
        </CModalTitle>
      </CModalHeader>

      <CModalBody class="p-4">
        <div class="text-center">
          <CIcon icon="cilTrash" size="3xl" class="text-danger mb-3" />
          <h5 class="mb-3">Sei sicuro di voler eliminare questo paziente?</h5>

          <div v-if="pazienteToDelete" class="alert alert-light border">
            <div class="fw-bold">
              {{ pazienteToDelete.nome }} {{ pazienteToDelete.cognome }}
            </div>
            <small class="text-muted">
              CF: {{ pazienteToDelete.codiceFiscale }}
            </small>
          </div>

          <p class="text-muted mb-0">
            <strong>Attenzione:</strong> Questa azione non può essere annullata.
            Tutti i dati del paziente verranno eliminati definitivamente.
          </p>
        </div>
      </CModalBody>

      <CModalFooter class="justify-content-center">
        <CButton
          color="secondary"
          @click="cancelDelete"
          :disabled="deletingPaziente"
          class="me-2"
        >
          <CIcon icon="cilX" class="me-2" />
          Annulla
        </CButton>
        <CButton
          color="danger"
          @click="handleDeletePaziente"
          :disabled="deletingPaziente"
        >
          <CSpinner v-if="deletingPaziente" size="sm" class="me-2" />
          <CIcon v-else icon="cilTrash" class="me-2" />
          {{ deletingPaziente ? 'Eliminazione...' : 'Elimina Definitivamente' }}
        </CButton>
      </CModalFooter>
    </CModal>

    <!-- Modale di conferma eliminazione multipla -->
    <CModal
      :visible="showBulkDeleteModal"
      @close="cancelBulkDelete"
      size="lg"
      class="bulk-delete-confirmation-modal"
    >
      <CModalHeader class="bg-danger text-white">
        <CModalTitle class="d-flex align-items-center">
          <CIcon icon="cilWarning" class="me-2" />
          Conferma Eliminazione Multipla
        </CModalTitle>
      </CModalHeader>

      <CModalBody class="p-4">
        <div class="text-center mb-4">
          <CIcon icon="cilTrash" size="3xl" class="text-danger mb-3" />
          <h5 class="mb-3">
            Sei sicuro di voler eliminare {{ selectedCount }}
            paziente{{ selectedCount > 1 ? 'i' : '' }}?
          </h5>
        </div>

        <!-- Progress bar durante eliminazione -->
        <div v-if="bulkDeleting" class="mb-4">
          <div class="d-flex justify-content-between mb-2">
            <span>
              {{ bulkDeleteProgress === 100 ? 'Eliminazione completata!' : 'Eliminazione in corso...' }}
            </span>
            <span>{{ bulkDeleteProgress }}%</span>
          </div>
          <CProgress>
            <CProgressBar
              :value="bulkDeleteProgress"
              :color="bulkDeleteProgress === 100 ? 'success' : 'danger'"
            />
          </CProgress>
        </div>

        <!-- Lista pazienti selezionati (limitata per performance) -->
        <div v-if="!bulkDeleting" class="mb-4">
          <h6 class="mb-3">Pazienti selezionati per l'eliminazione:</h6>
          <div class="selected-patients-list" style="max-height: 200px; overflow-y: auto;">
            <div
              v-for="paziente in pazienti.filter(p => selectedPazienti.has(p.id)).slice(0, 10)"
              :key="paziente.id"
              class="alert alert-light border d-flex justify-content-between align-items-center mb-2"
            >
              <div>
                <div class="fw-bold">{{ paziente.nome }} {{ paziente.cognome }}</div>
                <small class="text-muted">CF: {{ paziente.codiceFiscale }}</small>
              </div>
              <CIcon icon="cilTrash" class="text-danger" />
            </div>
            <div v-if="selectedCount > 10" class="text-muted text-center">
              ... e altri {{ selectedCount - 10 }} pazienti
            </div>
          </div>
        </div>

        <div v-if="!bulkDeleting" class="alert alert-warning">
          <strong>Attenzione:</strong> Questa azione non può essere annullata.
          Tutti i dati dei pazienti selezionati verranno eliminati definitivamente.
        </div>
      </CModalBody>

      <CModalFooter class="justify-content-center">
        <CButton
          color="secondary"
          @click="cancelBulkDelete"
          :disabled="false"
          class="me-2"
        >
          <CIcon icon="cilX" class="me-2" />
          {{ bulkDeleting ? 'Chiudi' : 'Annulla' }}
        </CButton>
        <CButton
          v-if="!bulkDeleting"
          color="danger"
          @click="handleBulkDelete"
        >
          <CIcon icon="cilTrash" class="me-2" />
          Elimina {{ selectedCount > 1 ? selectedCount + ' Pazienti' : 'Paziente' }}
        </CButton>
      </CModalFooter>
    </CModal>
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
 * - Icone CoreUI come primarie e FontAwesome come fallback
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
  deletePaziente,

  // Utility
  formatDate,
  formatTipoTerapia,
  calculateAge
} = usePazienti()

// Stato locale per la paginazione e ordinamento
const currentPage = ref(1)
const itemsPerPage = ref(10)
const directPageInput = ref(1)

// Computed properties per informazioni di paginazione
const showPagination = computed(() => totalPages.value > 1 || Number(itemsPerPage.value) < sortedAndFilteredPazienti.value.length)

const paginationInfo = computed(() => {
  const total = sortedAndFilteredPazienti.value.length
  // Converte itemsPerPage.value in numero per operazioni matematiche corrette
  const itemsPerPageNum = Number(itemsPerPage.value)
  const start = total === 0 ? 0 : (currentPage.value - 1) * itemsPerPageNum + 1
  const end = Math.min(currentPage.value * itemsPerPageNum, total)
  const showing = `${start}-${end}`

  return {
    total,
    start,
    end,
    showing
  }
})

// Stato per l'ordinamento
const sortColumn = ref(null) // null = nessun ordinamento attivo
const sortDirection = ref('asc') // 'asc' o 'desc'

// Stato per la modale di conferma eliminazione
const showDeleteModal = ref(false)
const pazienteToDelete = ref(null)
const deletingPaziente = ref(false)

// Stato per la selezione multipla
const selectedPazienti = ref(new Set())
const showBulkDeleteModal = ref(false)
const bulkDeleting = ref(false)
const bulkDeleteProgress = ref(0)

// Computed properties per la paginazione
const totalPazienti = computed(() => sortedAndFilteredPazienti.value.length)
const totalPages = computed(() => Math.ceil(totalPazienti.value / itemsPerPage.value))

// Computed per pazienti filtrati e ordinati
const sortedAndFilteredPazienti = computed(() => {
  let result = [...filteredPazienti.value]

  if (sortColumn.value) {
    result.sort((a, b) => {
      let valueA, valueB

      switch (sortColumn.value) {
        case 'nomeCompleto':
          // Ordinamento combinato nome + cognome
          valueA = `${a.nome || ''} ${a.cognome || ''}`.trim().toLowerCase()
          valueB = `${b.nome || ''} ${b.cognome || ''}`.trim().toLowerCase()
          break

        case 'dataDiNascita':
          // Ordinamento per data
          valueA = a.dataDiNascita ? new Date(a.dataDiNascita) : new Date(0)
          valueB = b.dataDiNascita ? new Date(b.dataDiNascita) : new Date(0)
          break

        case 'email':
          valueA = (a.email || '').toLowerCase()
          valueB = (b.email || '').toLowerCase()
          break

        case 'telefono':
          valueA = (a.telefono || '').toLowerCase()
          valueB = (b.telefono || '').toLowerCase()
          break

        case 'tipoTerapia':
          // Ordinamento per etichetta terapia (più leggibile)
          valueA = formatTipoTerapia(a.tipoTerapia || '').toLowerCase()
          valueB = formatTipoTerapia(b.tipoTerapia || '').toLowerCase()
          break

        default:
          valueA = ''
          valueB = ''
      }

      // Gestione comparazione
      let comparison = 0
      if (valueA > valueB) {
        comparison = 1
      } else if (valueA < valueB) {
        comparison = -1
      }

      // Applica direzione ordinamento
      return sortDirection.value === 'desc' ? comparison * -1 : comparison
    })
  }

  return result
})

// Computed per la selezione multipla
const hasSelectedPazienti = computed(() => selectedPazienti.value.size > 0)
const selectedCount = computed(() => selectedPazienti.value.size)
const isAllSelected = computed(() => {
  return paginatedPazienti.value.length > 0 &&
         paginatedPazienti.value.every(p => selectedPazienti.value.has(p.id))
})
const isPartiallySelected = computed(() => {
  return selectedPazienti.value.size > 0 && !isAllSelected.value
})

const paginatedPazienti = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  // Converte esplicitamente itemsPerPage.value in numero per evitare concatenazione di stringhe
  const end = start + Number(itemsPerPage.value)
  return sortedAndFilteredPazienti.value.slice(start, end)
})

// Metodi per la gestione della paginazione avanzata
const changePage = (pageNumber) => {
  if (pageNumber >= 1 && pageNumber <= totalPages.value) {
    currentPage.value = pageNumber
    directPageInput.value = pageNumber
  }
}

const goToFirstPage = () => changePage(1)
const goToPreviousPage = () => changePage(currentPage.value - 1)
const goToNextPage = () => changePage(currentPage.value + 1)
const goToLastPage = () => changePage(totalPages.value)

const goToPage = (pageNumber) => {
  const page = parseInt(pageNumber)
  if (!isNaN(page)) {
    changePage(page)
  }
}

const validateDirectPageInput = () => {
  if (directPageInput.value < 1) {
    directPageInput.value = 1
  } else if (directPageInput.value > totalPages.value) {
    directPageInput.value = totalPages.value
  }
}

const handleItemsPerPageChange = () => {
  // Reset alla prima pagina quando cambia il numero di righe
  resetPagination()
  // Se seleziono "Tutti", disabilita la paginazione
  // Converte in numero per confronto corretto
  if (Number(itemsPerPage.value) >= sortedAndFilteredPazienti.value.length) {
    currentPage.value = 1
  }
}

// Reset paginazione quando cambia la ricerca o l'ordinamento
const resetPagination = () => {
  currentPage.value = 1
  directPageInput.value = 1
}

// Funzione per gestire l'ordinamento con ciclo completo
const handleSort = (column) => {
  if (sortColumn.value === column) {
    // Stessa colonna: cicla attraverso ASC → DESC → NEUTRAL
    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc'
    } else {
      // Da DESC torna a NEUTRAL (nessun ordinamento)
      sortColumn.value = null
      sortDirection.value = 'asc'
    }
  } else {
    // Nuova colonna: inizia con ASC
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
  resetPagination()
}

// Funzione per ottenere l'icona di ordinamento corretta
const getSortIcon = (column) => {
  if (sortColumn.value !== column) {
    return 'cilSwapVertical' // Icona neutra (doppia freccia)
  }
  // Usa icone specifiche per ogni direzione (no rotazione CSS)
  return sortDirection.value === 'asc' ? 'cilArrowTop' : 'cilArrowBottom'
}

// Funzione per ottenere la classe CSS dell'header
const getSortClass = (column) => {
  return {
    'sortable-header': true,
    'sorted': sortColumn.value === column,
    'sort-asc': sortColumn.value === column && sortDirection.value === 'asc',
    'sort-desc': sortColumn.value === column && sortDirection.value === 'desc'
  }
}

// Funzione per ottenere l'etichetta leggibile della colonna ordinata
const getSortColumnLabel = (column) => {
  const labels = {
    'nomeCompleto': 'Nome Completo',
    'dataDiNascita': 'Data di Nascita',
    'email': 'Email',
    'telefono': 'Telefono',
    'tipoTerapia': 'Tipo Terapia'
  }
  return labels[column] || column
}

// Watch del termine di ricerca per reset paginazione
watch(searchTerm, () => {
  resetPagination()
  clearSelection() // Reset selezione quando cambia la ricerca
})

// Watch della pagina corrente per sincronizzare l'input
watch(currentPage, (newPage) => {
  directPageInput.value = newPage
})

// Watch per gestire il cambio di items per pagina
watch(itemsPerPage, () => {
  // Quando cambia il numero di elementi per pagina,
  // prova a mantenere l'utente sulla stessa posizione relativa
  const itemsPerPageNum = Number(itemsPerPage.value) // Converte in numero
  const currentFirstItem = (currentPage.value - 1) * itemsPerPageNum + 1
  const newPage = Math.ceil(currentFirstItem / itemsPerPageNum)
  changePage(newPage)
})

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
  // Chiudiamo esplicitamente la modale di creazione
  closeCreateModal()
  // Reset paginazione per mostrare il nuovo paziente
  resetPagination()
}

const handlePazienteUpdated = (updatedPaziente) => {
  console.log('Paziente aggiornato:', updatedPaziente)
  // Chiudiamo esplicitamente la modale di modifica
  closeEditModal()
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

// Funzione per aprire la modale di conferma eliminazione
const confirmDeletePaziente = (paziente) => {
  pazienteToDelete.value = paziente
  showDeleteModal.value = true
}

// Funzione per annullare l'eliminazione
const cancelDelete = () => {
  showDeleteModal.value = false
  pazienteToDelete.value = null
  deletingPaziente.value = false
}

// Funzione per eliminare il paziente
const handleDeletePaziente = async () => {
  if (!pazienteToDelete.value) return

  deletingPaziente.value = true

  try {
    // Chiama la funzione di eliminazione dal composable
    await deletePaziente(pazienteToDelete.value.id)

    // Rimuovi dalla selezione se era selezionato
    selectedPazienti.value.delete(pazienteToDelete.value.id)

    // Chiudi la modale
    cancelDelete()

    // Reset paginazione se necessario
    resetPagination()

  } catch (error) {
    console.error('Errore nell\'eliminazione del paziente:', error)
    // L'errore viene gestito dal composable con notifiche
  } finally {
    deletingPaziente.value = false
  }
}

// Caricamento dati all'avvio
onMounted(() => {
  // I dati vengono caricati automaticamente dal composable
  console.log('Pagina Pazienti caricata')
})

// Cleanup al dismount per evitare memory leaks
onUnmounted(() => {
  if (notificationTimer.value) {
    clearTimeout(notificationTimer.value)
  }
})

// Helper per la gestione delle icone con fallback
const getIconComponent = (coreUIIcon, fontAwesomeIcon) => {
  // In futuro si può implementare una logica per verificare se l'icona CoreUI esiste
  // Per ora usiamo direttamente quella specificata
  return coreUIIcon
}

// Mappa delle icone di navigazione con fallback FontAwesome
// Strategia:
// 1. Prova sempre prima con CoreUI (cil-nome)
// 2. Se non disponibile, usa FontAwesome (fas fa-nome)
// 3. Per i controlli di paginazione usiamo direttamente FontAwesome perché sono più comuni
const navigationIcons = {
  first: { coreUI: 'cilMediaSkipBackward', fontAwesome: 'fas fa-angle-double-left' },
  previous: { coreUI: 'cilChevronLeft', fontAwesome: 'fas fa-angle-left' },
  next: { coreUI: 'cilChevronRight', fontAwesome: 'fas fa-angle-right' },
  last: { coreUI: 'cilMediaSkipForward', fontAwesome: 'fas fa-angle-double-right' }
}

// Stato per il timer di auto-dismiss delle notifiche
const notificationTimer = ref(null)

// Funzione per mostrare notifiche con auto-dismiss
const showNotificationWithAutoHide = (message, type, duration = 4000) => {
  // Cancella il timer precedente se esiste
  if (notificationTimer.value) {
    clearTimeout(notificationTimer.value)
  }

  // Imposta la notifica
  notification.value = {
    message,
    type
  }

  // Auto-hide solo per notifiche di successo e warning
  if (type === 'success' || type === 'warning') {
    notificationTimer.value = setTimeout(() => {
      notification.value = null
      notificationTimer.value = null
    }, duration)
  }
}

// Override della funzione clearNotification per cancellare anche il timer
const clearNotificationWithTimer = () => {
  if (notificationTimer.value) {
    clearTimeout(notificationTimer.value)
    notificationTimer.value = null
  }
  clearNotification()
}
// Funzioni per la selezione multipla avanzata
const togglePazienteSelection = (pazienteId) => {
  if (selectedPazienti.value.has(pazienteId)) {
    selectedPazienti.value.delete(pazienteId)
  } else {
    selectedPazienti.value.add(pazienteId)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // Deseleziona tutti nella pagina corrente
    paginatedPazienti.value.forEach(p => selectedPazienti.value.delete(p.id))
  } else {
    // Seleziona tutti nella pagina corrente
    paginatedPazienti.value.forEach(p => selectedPazienti.value.add(p.id))
  }
}

const selectAllGlobal = () => {
  // Seleziona tutti i pazienti filtrati (in tutte le pagine)
  sortedAndFilteredPazienti.value.forEach(p => selectedPazienti.value.add(p.id))
}

const clearSelection = () => {
  selectedPazienti.value.clear()
}

// Funzioni per l'eliminazione multipla
const confirmBulkDelete = () => {
  if (selectedPazienti.value.size === 0) return
  showBulkDeleteModal.value = true
}

const cancelBulkDelete = () => {
  // Chiudi sempre la modale
  showBulkDeleteModal.value = false

  // Reset degli stati solo se non c'è un'operazione in corso
  // (per permettere la chiusura forzata anche durante l'elaborazione)
  setTimeout(() => {
    bulkDeleting.value = false
    bulkDeleteProgress.value = 0
  }, 100)
}

const handleBulkDelete = async () => {
  if (selectedPazienti.value.size === 0) return

  bulkDeleting.value = true
  bulkDeleteProgress.value = 0

  const selectedIds = Array.from(selectedPazienti.value)
  const total = selectedIds.length
  let completed = 0
  let errors = 0

  try {
    // Elimina uno per volta con progress tracking
    for (const pazienteId of selectedIds) {
      try {
        await deletePaziente(pazienteId)
        completed++
      } catch (error) {
        console.error(`Errore eliminazione paziente ${pazienteId}:`, error)
        errors++
      }

      // Aggiorna progress bar
      bulkDeleteProgress.value = Math.round((completed + errors) / total * 100)
    }

  } catch (error) {
    console.error('Errore critico nell\'eliminazione multipla:', error)
    errors = total // Considera tutti come errori se c'è un errore critico
  } finally {
    // Reset stati di loading
    bulkDeleting.value = false

    // Pulisci sempre la selezione e reset paginazione IMMEDIATAMENTE
    clearSelection()
    resetPagination()

    // 1. PRIMA chiudi la modale subito
    cancelBulkDelete()

    // 2. POI mostra la notifica dopo un breve delay per permettere alla modale di chiudersi
    setTimeout(() => {
      if (errors === 0 && completed > 0) {
        showNotificationWithAutoHide(
          `${completed} pazient${completed > 1 ? 'i' : 'e'} eliminat${completed > 1 ? 'i' : 'o'} con successo`,
          'success',
          4000 // 4 secondi per messaggi di successo
        )
      } else if (completed > 0 && errors > 0) {
        showNotificationWithAutoHide(
          `${completed} pazient${completed > 1 ? 'i' : 'e'} eliminat${completed > 1 ? 'i' : 'o'}, ${errors} errore${errors > 1 ? 'i' : ''}`,
          'warning',
          6000 // 6 secondi per messaggi di warning
        )
      } else if (completed === 0) {
        // Errori restano visibili fino alla chiusura manuale
        notification.value = {
          message: 'Errore nell\'eliminazione dei pazienti selezionati',
          type: 'error'
        }
      }
    }, 300) // Delay di 300ms per permettere alla modale di chiudersi completamente
  }
}
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

/* Stili per l'ordinamento */
.sortable-header {
  transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out;
}

.sortable-header:hover {
  background-color: rgba(0, 123, 255, 0.1) !important;
  color: #0056b3;
}

.sortable-header.sorted {
  background-color: rgba(0, 123, 255, 0.15) !important;
  color: #0056b3;
  font-weight: 600;
}

.sort-icon {
  opacity: 0.3;
  transition: opacity 0.15s ease-in-out;
  /* Rimuoviamo la transizione transform che causava l'effetto strano */
}

.sortable-header:hover .sort-icon {
  opacity: 0.6;
}

.sortable-header.sorted .sort-icon {
  opacity: 1;
  color: #0056b3;
}

/* Icona neutra più evidente al hover */
.sortable-header:not(.sorted):hover .sort-icon {
  opacity: 0.8;
}

/* Rimuoviamo la rotazione CSS che causava il problema */
/* .sort-desc .sort-icon { transform: rotate(180deg); } */

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

/* Notifiche con animazioni fade-in/fade-out migliorate */
.notification-alert {
  position: relative;
  z-index: 1050;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 8px;
}

/* Animazioni per le transizioni delle notifiche */
.notification-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.notification-enter-from {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}

.notification-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
}

/* Animazione legacy per compatibilità */
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

/* Stili per la modale di eliminazione */
.delete-confirmation-modal :deep(.modal-content) {
  border: none;
  border-radius: 12px;
  overflow: hidden;
}

.delete-confirmation-modal .modal-header {
  border-bottom: none;
}

.delete-confirmation-modal .modal-footer {
  border-top: 1px solid #dee2e6;
  padding: 1.5rem;
}

/* Pulsante elimina con effetto hover */
.btn-danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.btn-danger:disabled {
  transform: none;
  box-shadow: none;
}

/* Stili per la selezione multipla */
.table-selected {
  background-color: rgba(0, 123, 255, 0.1) !important;
}

.table-selected:hover {
  background-color: rgba(0, 123, 255, 0.15) !important;
}

/* Toolbar azioni bulk */
.alert-primary {
  border-left: 4px solid var(--cui-primary);
}

/* Stili per la lista pazienti selezionati */
.selected-patients-list .alert {
  transition: background-color 0.15s ease-in-out;
}

.selected-patients-list .alert:hover {
  background-color: rgba(248, 249, 250, 0.8) !important;
}

/* Progress bar personalizzata */
.progress {
  height: 8px;
  border-radius: 4px;
}

/* Modale eliminazione multipla */
.bulk-delete-confirmation-modal :deep(.modal-content) {
  border: none;
  border-radius: 12px;
  overflow: hidden;
}

/* Stili per i controlli di paginazione avanzati */
.pagination-controls {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.pagination-controls .form-select {
  min-width: 80px;
}

/* Styling per l'input di navigazione diretta */
.pagination-controls input[type="number"] {
  text-align: center;
  font-weight: 600;
}

.pagination-controls input[type="number"]::-webkit-outer-spin-button,
.pagination-controls input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.pagination-controls input[type="number"] {
  -moz-appearance: textfield;
}

/* Stili per i pulsanti di selezione globale */
.global-selection-controls .btn {
  transition: all 0.2s ease-in-out;
}

.global-selection-controls .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Responsive per i controlli */
@media (max-width: 768px) {
  .pagination-controls {
    padding: 0.75rem;
  }

  .pagination-controls .form-select {
    font-size: 0.875rem;
  }

  .global-selection-controls .btn {
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
  }
}

/* Stili per i controlli nell'header - supporto tema dark */
.card-header {
  background-color: var(--cui-card-header-bg, #f8f9fa);
  border-bottom: 2px solid var(--cui-border-color, #e9ecef);
}

/* Override per tema dark */
[data-coreui-theme="dark"] .card-header {
  background-color: var(--cui-dark-bg, #2e3440);
  border-bottom-color: var(--cui-dark-border, #4c566a);
}

.card-header h5 {
  color: var(--cui-body-color, #2c3e50);
  font-weight: 600;
}

/* Miglioramento testo per tema dark */
[data-coreui-theme="dark"] .card-header h5 {
  color: var(--cui-dark-color, #eceff4);
}

.card-header small {
  display: block;
  margin-top: 0.25rem;
  color: var(--cui-text-muted, #6c757d);
}

[data-coreui-theme="dark"] .card-header small {
  color: var(--cui-dark-text-muted, #81a1c1);
}

/* Controlli paginazione compatti nell'header - tema dark */
.header-pagination-controls .btn {
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: var(--cui-btn-bg, transparent);
  border-color: var(--cui-btn-border-color, #6c757d);
  color: var(--cui-btn-color, #495057);
}

.header-pagination-controls .btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: var(--cui-btn-hover-bg, #e9ecef);
}

/* Override per tema dark */
[data-coreui-theme="dark"] .header-pagination-controls .btn {
  background-color: var(--cui-dark-btn-bg, #3b4252);
  border-color: var(--cui-dark-btn-border, #4c566a);
  color: var(--cui-dark-btn-color, #eceff4);
}

[data-coreui-theme="dark"] .header-pagination-controls .btn:not(:disabled):hover {
  background-color: var(--cui-dark-btn-hover-bg, #434c5e);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.header-pagination-controls .form-select {
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: var(--cui-form-select-bg, #fff);
  border-color: var(--cui-form-select-border, #ced4da);
  color: var(--cui-form-select-color, #495057);
}

/* Select per tema dark */
[data-coreui-theme="dark"] .header-pagination-controls .form-select {
  background-color: var(--cui-dark-form-bg, #3b4252);
  border-color: var(--cui-dark-form-border, #4c566a);
  color: var(--cui-dark-form-color, #eceff4);
}

/* Icone nei controlli - assicura visibilità */
.btn .icon,
.btn [class*="cil-"],
.btn .fas,
.btn .fa,
.btn svg {
  display: inline-block;
  vertical-align: middle;
}

/* Stili specifici per icone FontAwesome nei controlli - tema dark */
.pagination-controls .fas,
.header-pagination-controls .fas,
.pagination-controls svg,
.header-pagination-controls svg {
  font-size: 0.875rem;
  color: inherit;
  width: 1em;
  height: 1em;
}

.btn:disabled .fas,
.btn:disabled svg {
  opacity: 0.5;
}

/* Miglioramento visibilità icone tema dark */
[data-coreui-theme="dark"] .pagination-controls .fas,
[data-coreui-theme="dark"] .header-pagination-controls .fas,
[data-coreui-theme="dark"] .pagination-controls svg,
[data-coreui-theme="dark"] .header-pagination-controls svg {
  color: var(--cui-dark-icon-color, #eceff4);
}

[data-coreui-theme="dark"] .btn:disabled .fas,
[data-coreui-theme="dark"] .btn:disabled svg {
  opacity: 0.3;
}

/* Consistency tra icone CoreUI e FontAwesome */
.btn .fas,
.btn svg {
  width: 1em;
  text-align: center;
}

/* Responsive aggiuntivo per header - tema dark supportato */
@media (max-width: 768px) {
  .card-header .row > .col-md-3,
  .card-header .row > .col-md-5,
  .card-header .row > .col-md-4 {
    margin-bottom: 0.75rem;
  }

  .card-header h5 {
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
  }

  .header-pagination-controls .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .header-pagination-controls .form-select {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
}

/* Supporto aggiuntivo per tema dark - elementi della pagina */
[data-coreui-theme="dark"] .text-muted {
  color: var(--cui-dark-text-muted, #81a1c1) !important;
}

[data-coreui-theme="dark"] .page-title {
  color: var(--cui-dark-heading-color, #eceff4);
}

/* Input di ricerca tema dark */
[data-coreui-theme="dark"] .form-control {
  background-color: var(--cui-dark-form-bg, #3b4252);
  border-color: var(--cui-dark-form-border, #4c566a);
  color: var(--cui-dark-form-color, #eceff4);
}

[data-coreui-theme="dark"] .form-control:focus {
  background-color: var(--cui-dark-form-bg, #3b4252);
  border-color: var(--cui-primary, #0d6efd);
  color: var(--cui-dark-form-color, #eceff4);
}

[data-coreui-theme="dark"] .input-group-text {
  background-color: var(--cui-dark-form-bg, #3b4252);
  border-color: var(--cui-dark-form-border, #4c566a);
  color: var(--cui-dark-form-color, #eceff4);
}
</style>
