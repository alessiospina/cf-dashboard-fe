<template>
  <div class="pazienti-import-page">
    <!-- Header della pagina -->
    <CRow class="mb-4">
      <CCol>
        <div class="d-flex align-items-center">
          <CButton
            color="light"
            variant="ghost"
            @click="goBackToPazienti"
            class="me-3"
          >
            <CIcon icon="cil-arrow-left" />
          </CButton>
          <div>
            <h2 class="page-title mb-0">
              <CIcon icon="cil-cloud-upload" class="me-2"/>
              Import Pazienti da Excel
            </h2>
            <p class="text-muted mb-0">
              Importa anagrafiche pazienti da file Excel (.xlsx)
            </p>
          </div>
        </div>
      </CCol>
    </CRow>

    <!-- Notifica -->
    <Transition
      name="notification"
      enter-active-class="notification-enter-active"
      leave-active-class="notification-leave-active"
      enter-from-class="notification-enter-from"
      leave-to-class="notification-leave-to"
    >
      <CAlert
        v-if="notification"
        :color="notification.type"
        dismissible
        @close="clearNotification"
        class="mb-4 notification-alert"
      >
        {{ notification.message }}
      </CAlert>
    </Transition>

    <!-- Card Upload File -->
    <CCard class="mb-4" v-if="!uploadComplete">
      <CCardHeader>
        <h5 class="mb-0">1. Seleziona file Excel</h5>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="8">
            <div class="upload-section">
              <input
                ref="fileInput"
                type="file"
                accept=".xlsx,.xls"
                @change="onFileChange"
                style="display: none"
              />
              <div class="d-flex align-items-center gap-3">
                <CButton
                  color="primary"
                  @click="$refs.fileInput.click()"
                  :disabled="loading"
                >
                  <CIcon icon="cil-folder-open" class="me-2"/>
                  Scegli File
                </CButton>
                <span v-if="file" class="text-muted">
                  {{ file.name }} ({{ formatFileSize(file.size) }})
                </span>
                <span v-else class="text-muted">
                  Nessun file selezionato
                </span>
              </div>
              <div class="mt-3">
                <CButton
                  color="success"
                  @click="uploadFile"
                  :disabled="!file || loading"
                >
                  <CSpinner v-if="loading" size="sm" class="me-2"/>
                  <CIcon v-else icon="cil-cloud-upload" class="me-2"/>
                  {{ loading ? 'Caricamento...' : 'Carica ed Elabora' }}
                </CButton>
              </div>
            </div>
          </CCol>
          <CCol md="4">
            <CAlert color="info" class="mb-0">
              <strong>Formato richiesto:</strong>
              <ul class="mb-0 mt-2">
                <li>File Excel (.xlsx o .xls)</li>
                <li>Prima riga: intestazioni colonne</li>
                <li>Colonne richieste: Nome, Cognome, Codice Fiscale, Email, Telefono, Indirizzo</li>
              </ul>
            </CAlert>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <!-- Sezione Risultati -->
    <div v-if="uploadComplete">
      <!-- Riepilogo -->
      <CCard class="mb-4">
        <CCardBody>
          <CRow>
            <CCol md="4">
              <div class="stats-card bg-success-subtle p-3 rounded">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-success mb-1">Record Validi</h6>
                    <h3 class="mb-0 text-success">{{ validCount }}</h3>
                  </div>
                  <CIcon icon="cil-check-circle" size="3xl" class="text-success opacity-50"/>
                </div>
              </div>
            </CCol>
            <CCol md="4">
              <div class="stats-card bg-danger-subtle p-3 rounded">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-danger mb-1">Record Invalidi</h6>
                    <h3 class="mb-0 text-danger">{{ invalidCount }}</h3>
                  </div>
                  <CIcon icon="cil-x-circle" size="3xl" class="text-danger opacity-50"/>
                </div>
              </div>
            </CCol>
            <CCol md="4">
              <div class="d-flex flex-column gap-2">
                <CButton
                  color="success"
                  @click="savePazientiToBackend"
                  :disabled="validCount === 0 || savingPazienti"
                  class="w-100"
                >
                  <CSpinner v-if="savingPazienti" size="sm" class="me-2"/>
                  <CIcon v-else icon="cil-save" class="me-2"/>
                  {{ savingPazienti ? 'Salvataggio...' : `Salva ${validCount} Pazienti` }}
                </CButton>
                <CButton
                  color="light"
                  variant="outline"
                  @click="reset"
                  class="w-100"
                >
                  <CIcon icon="cil-reload" class="me-2"/>
                  Nuovo Import
                </CButton>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <!-- Tabs per Record Validi e Invalidi -->
      <CCard>
        <CCardBody>
          <CTabs activeItemKey="valid">
            <CTabList variant="tabs">
              <CTab itemKey="valid">
                <CIcon icon="cil-check-circle" class="text-success me-2"/>
                Record Validi ({{ validCount }})
              </CTab>
              <CTab itemKey="invalid">
                <CIcon icon="cil-x-circle" class="text-danger me-2"/>
                Record Invalidi ({{ invalidCount }})
              </CTab>
            </CTabList>
            <CTabContent>
              <!-- Tab Record Validi -->
              <CTabPanel class="p-3" itemKey="valid">
                <div v-if="validCount === 0" class="text-center py-5 text-muted">
                  <CIcon icon="cil-info" size="3xl" class="mb-3"/>
                  <p>Nessun record valido trovato</p>
                </div>
                <div v-else>
                  <!-- Paginazione Header -->
                  <CRow class="mb-3 align-items-center">
                    <CCol md="6">
                      <div class="d-flex align-items-center gap-2">
                        <span class="text-muted">Mostra</span>
                        <CFormSelect
                          :model-value="validItemsPerPage"
                          @update:model-value="validItemsPerPage = Number($event)"
                          style="width: 80px;"
                          size="sm"
                        >
                          <option :value="10">10</option>
                          <option :value="25">25</option>
                          <option :value="50">50</option>
                          <option :value="100">100</option>
                        </CFormSelect>
                        <span class="text-muted">
                          di {{ validCount }} record
                        </span>
                      </div>
                    </CCol>
                    <CCol md="6">
                      <CPagination
                        v-if="validTotalPages > 1"
                        align="end"
                        size="sm"
                        aria-label="Navigazione pagine record validi"
                      >
                        <CPaginationItem
                          :disabled="validCurrentPage === 1"
                          @click="validCurrentPage = Math.max(1, validCurrentPage - 1)"
                          aria-label="Precedente"
                        >
                          <span aria-hidden="true">&laquo;</span>
                        </CPaginationItem>
                        <CPaginationItem
                          v-for="(page, index) in validPageNumbers"
                          :key="index"
                          :active="page === validCurrentPage"
                          :disabled="page === '...'"
                          @click="page !== '...' && (validCurrentPage = page)"
                        >
                          {{ page }}
                        </CPaginationItem>
                        <CPaginationItem
                          :disabled="validCurrentPage === validTotalPages"
                          @click="validCurrentPage = Math.min(validTotalPages, validCurrentPage + 1)"
                          aria-label="Successivo"
                        >
                          <span aria-hidden="true">&raquo;</span>
                        </CPaginationItem>
                      </CPagination>
                    </CCol>
                  </CRow>

                  <!-- Tabella Validi -->
                  <div class="table-responsive">
                    <CTable hover striped bordered small>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Nome</CTableHeaderCell>
                          <CTableHeaderCell>Cognome</CTableHeaderCell>
                          <CTableHeaderCell>CF</CTableHeaderCell>
                          <CTableHeaderCell>Email</CTableHeaderCell>
                          <CTableHeaderCell>Telefono</CTableHeaderCell>
                          <CTableHeaderCell>Data Nascita</CTableHeaderCell>
                          <CTableHeaderCell>Luogo Nascita</CTableHeaderCell>
                          <CTableHeaderCell>Comune Nascita</CTableHeaderCell>
                          <CTableHeaderCell>Provincia Nascita</CTableHeaderCell>
                          <CTableHeaderCell>Regione Nascita</CTableHeaderCell>
                          <CTableHeaderCell>Indirizzo Residenza</CTableHeaderCell>
                          <CTableHeaderCell>Comune Residenza</CTableHeaderCell>
                          <CTableHeaderCell>Provincia Residenza</CTableHeaderCell>
                          <CTableHeaderCell>Regione Residenza</CTableHeaderCell>
                          <CTableHeaderCell>Nazionalità</CTableHeaderCell>
                          <CTableHeaderCell>Data Creazione</CTableHeaderCell>
                          <CTableHeaderCell class="text-center" style="min-width: 100px;">Azioni</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        <CTableRow v-for="(paziente, index) in paginatedValidPazienti" :key="index">
                          <CTableDataCell>{{ paziente.nome || '-' }}</CTableDataCell>
                          <CTableDataCell>{{ paziente.cognome || '-' }}</CTableDataCell>
                          <CTableDataCell><code>{{ paziente.codiceFiscale || '-' }}</code></CTableDataCell>
                          <CTableDataCell>{{ paziente.email || '-' }}</CTableDataCell>
                          <CTableDataCell>{{ paziente.telefono || '-' }}</CTableDataCell>
                          <CTableDataCell>{{ formatDate(paziente.dataDiNascita) }}</CTableDataCell>
                          <CTableDataCell>
                            <span v-if="paziente.nazionalità">
                              {{ paziente.nazionalità.nome || paziente.nazionalità }}
                            </span>
                            <span v-else>Italia</span>
                          </CTableDataCell>
                          <CTableDataCell>
                            {{ paziente.comuneNascita?.nome || '-' }}
                          </CTableDataCell>
                          <CTableDataCell>
                            {{ paziente.provinciaNascita?.sigla || paziente.provinciaNascita?.nome || '-' }}
                          </CTableDataCell>
                          <CTableDataCell>
                            {{ paziente.regioneNascita?.nome || '-' }}
                          </CTableDataCell>
                          <CTableDataCell>{{ paziente.indirizzoResidenza || '-' }}</CTableDataCell>
                          <CTableDataCell>
                            {{ paziente.comuneResidenza?.nome || '-' }}
                          </CTableDataCell>
                          <CTableDataCell>
                            {{ paziente.provinciaResidenza?.sigla || paziente.provinciaResidenza?.nome || '-' }}
                          </CTableDataCell>
                          <CTableDataCell>
                            {{ paziente.regioneResidenza?.nome || '-' }}
                          </CTableDataCell>
                          <CTableDataCell>
                            <span v-if="paziente.nazionalità">
                              {{ paziente.nazionalità.nome || paziente.nazionalità }}
                            </span>
                            <span v-else>Italia</span>
                          </CTableDataCell>
                          <CTableDataCell>{{ formatDate(paziente.createdAt) }}</CTableDataCell>
                          <CTableDataCell class="text-center">
                            <CButtonGroup size="sm">
                              <CButton
                                color="info"
                                variant="ghost"
                                @click="startEdit(paziente, 'valid')"
                                title="Modifica"
                              >
                                <CIcon icon="cil-pencil"/>
                              </CButton>
                              <CButton
                                color="danger"
                                variant="ghost"
                                @click="removePaziente(paziente, 'valid')"
                                title="Elimina"
                              >
                                <CIcon icon="cil-trash"/>
                              </CButton>
                            </CButtonGroup>
                          </CTableDataCell>
                        </CTableRow>
                      </CTableBody>
                    </CTable>
                  </div>

                  <!-- Paginazione Footer -->
                  <CRow class="mt-3 align-items-center" v-if="validTotalPages > 1">
                    <CCol md="6">
                      <span class="text-muted">
                        Visualizzati {{ validStartIndex + 1 }}-{{ validEndIndex }} di {{ validCount }} record
                      </span>
                    </CCol>
                    <CCol md="6">
                      <CPagination
                        align="end"
                        size="sm"
                        aria-label="Navigazione pagine record validi"
                      >
                        <CPaginationItem
                          :disabled="validCurrentPage === 1"
                          @click="validCurrentPage = Math.max(1, validCurrentPage - 1)"
                          aria-label="Precedente"
                        >
                          <span aria-hidden="true">&laquo;</span>
                        </CPaginationItem>
                        <CPaginationItem
                          v-for="(page, index) in validPageNumbers"
                          :key="index"
                          :active="page === validCurrentPage"
                          :disabled="page === '...'"
                          @click="page !== '...' && (validCurrentPage = page)"
                        >
                          {{ page }}
                        </CPaginationItem>
                        <CPaginationItem
                          :disabled="validCurrentPage === validTotalPages"
                          @click="validCurrentPage = Math.min(validTotalPages, validCurrentPage + 1)"
                          aria-label="Successivo"
                        >
                          <span aria-hidden="true">&raquo;</span>
                        </CPaginationItem>
                      </CPagination>
                    </CCol>
                  </CRow>
                </div>
              </CTabPanel>

              <!-- Tab Record Invalidi -->
              <CTabPanel class="p-3" itemKey="invalid">
                <div v-if="invalidCount === 0" class="text-center py-5 text-muted">
                  <CIcon icon="cil-check" size="3xl" class="mb-3"/>
                  <p>Nessun record invalido. Ottimo lavoro! 🎉</p>
                </div>
                <div v-else>
                  <CAlert color="warning" class="mb-3">
                    <strong>Attenzione:</strong> Correggi gli errori e sposta i record nella lista validi per poterli salvare.
                  </CAlert>

                  <!-- Paginazione Header -->
                  <CRow class="mb-3 align-items-center">
                    <CCol md="6">
                      <div class="d-flex align-items-center gap-2">
                        <span class="text-muted">Mostra</span>
                        <CFormSelect
                          :model-value="invalidItemsPerPage"
                          @update:model-value="invalidItemsPerPage = Number($event)"
                          style="width: 80px;"
                          size="sm"
                        >
                          <option :value="10">10</option>
                          <option :value="25">25</option>
                          <option :value="50">50</option>
                          <option :value="100">100</option>
                        </CFormSelect>
                        <span class="text-muted">
                          di {{ invalidCount }} record
                        </span>
                      </div>
                    </CCol>
                    <CCol md="6">
                      <CPagination
                        v-if="invalidTotalPages > 1"
                        align="end"
                        size="sm"
                        aria-label="Navigazione pagine record invalidi"
                      >
                        <CPaginationItem
                          :disabled="invalidCurrentPage === 1"
                          @click="invalidCurrentPage = Math.max(1, invalidCurrentPage - 1)"
                          aria-label="Precedente"
                        >
                          <span aria-hidden="true">&laquo;</span>
                        </CPaginationItem>
                        <CPaginationItem
                          v-for="(page, index) in invalidPageNumbers"
                          :key="index"
                          :active="page === invalidCurrentPage"
                          :disabled="page === '...'"
                          @click="page !== '...' && (invalidCurrentPage = page)"
                        >
                          {{ page }}
                        </CPaginationItem>
                        <CPaginationItem
                          :disabled="invalidCurrentPage === invalidTotalPages"
                          @click="invalidCurrentPage = Math.min(invalidTotalPages, invalidCurrentPage + 1)"
                          aria-label="Successivo"
                        >
                          <span aria-hidden="true">&raquo;</span>
                        </CPaginationItem>
                      </CPagination>
                    </CCol>
                  </CRow>

                  <!-- Tabella Invalidi -->
                  <div class="table-responsive">
                    <CTable hover striped bordered small>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Nome</CTableHeaderCell>
                          <CTableHeaderCell>Cognome</CTableHeaderCell>
                          <CTableHeaderCell>CF</CTableHeaderCell>
                          <CTableHeaderCell>Email</CTableHeaderCell>
                          <CTableHeaderCell>Telefono</CTableHeaderCell>
                          <CTableHeaderCell>Indirizzo</CTableHeaderCell>
                          <CTableHeaderCell style="min-width: 200px;">Errore</CTableHeaderCell>
                          <CTableHeaderCell class="text-center" style="min-width: 120px;">Azioni</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        <CTableRow v-for="(paziente, index) in paginatedInvalidPazienti" :key="index">
                          <CTableDataCell>{{ paziente.nome || '-' }}</CTableDataCell>
                          <CTableDataCell>{{ paziente.cognome || '-' }}</CTableDataCell>
                          <CTableDataCell><code>{{ paziente.codiceFiscale || '-' }}</code></CTableDataCell>
                          <CTableDataCell>{{ paziente.email || '-' }}</CTableDataCell>
                          <CTableDataCell>{{ paziente.telefono || '-' }}</CTableDataCell>
                          <CTableDataCell>{{ paziente.indirizzo || paziente.indirizzoResidenza || '-' }}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge color="danger" class="text-wrap">{{ paziente.error }}</CBadge>
                          </CTableDataCell>
                          <CTableDataCell class="text-center">
                            <CButtonGroup size="sm">
                              <CButton
                                color="info"
                                variant="ghost"
                                @click="startEdit(paziente, 'invalid')"
                                title="Modifica"
                              >
                                <CIcon icon="cil-pencil"/>
                              </CButton>
                              <CButton
                                color="success"
                                variant="ghost"
                                @click="moveToValid(paziente)"
                                title="Sposta nei validi"
                              >
                                <CIcon icon="cil-arrow-right"/>
                              </CButton>
                              <CButton
                                color="danger"
                                variant="ghost"
                                @click="removePaziente(paziente, 'invalid')"
                                title="Elimina"
                              >
                                <CIcon icon="cil-trash"/>
                              </CButton>
                            </CButtonGroup>
                          </CTableDataCell>
                        </CTableRow>
                      </CTableBody>
                    </CTable>
                  </div>

                  <!-- Paginazione Footer -->
                  <CRow class="mt-3 align-items-center" v-if="invalidTotalPages > 1">
                    <CCol md="6">
                      <span class="text-muted">
                        Visualizzati {{ invalidStartIndex + 1 }}-{{ invalidEndIndex }} di {{ invalidCount }} record
                      </span>
                    </CCol>
                    <CCol md="6">
                      <CPagination
                        align="end"
                        size="sm"
                        aria-label="Navigazione pagine record invalidi"
                      >
                        <CPaginationItem
                          :disabled="invalidCurrentPage === 1"
                          @click="invalidCurrentPage = Math.max(1, invalidCurrentPage - 1)"
                          aria-label="Precedente"
                        >
                          <span aria-hidden="true">&laquo;</span>
                        </CPaginationItem>
                        <CPaginationItem
                          v-for="(page, index) in invalidPageNumbers"
                          :key="index"
                          :active="page === invalidCurrentPage"
                          :disabled="page === '...'"
                          @click="page !== '...' && (invalidCurrentPage = page)"
                        >
                          {{ page }}
                        </CPaginationItem>
                        <CPaginationItem
                          :disabled="invalidCurrentPage === invalidTotalPages"
                          @click="invalidCurrentPage = Math.min(invalidTotalPages, invalidCurrentPage + 1)"
                          aria-label="Successivo"
                        >
                          <span aria-hidden="true">&raquo;</span>
                        </CPaginationItem>
                      </CPagination>
                    </CCol>
                  </CRow>
                </div>
              </CTabPanel>
            </CTabContent>
          </CTabs>
        </CCardBody>
      </CCard>
    </div>

    <!-- Modale Modifica Paziente -->
    <PazienteImportModal
      :visible="editingPaziente !== null"
      :paziente="editingPaziente"
      :show-original-error="editingType === 'invalid'"
      @close="cancelEdit"
      @save="handleModalSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useImportPazienti } from '@/composables/useImportPazienti'
import PazienteImportModal from './PazienteImportModal.vue'
import {
  CRow, CCol, CCard, CCardHeader, CCardBody, CButton, CButtonGroup,
  CAlert, CSpinner, CTable, CTableHead, CTableBody, CTableRow,
  CTableHeaderCell, CTableDataCell, CBadge,
  CTabs, CTabList, CTab, CTabContent, CTabPanel, CPagination, CPaginationItem, CFormSelect
} from '@coreui/vue'
import { CIcon } from '@coreui/icons-vue'

const router = useRouter()

const {
  file,
  loading,
  uploadComplete,
  validPazienti,
  invalidPazienti,
  notification,
  editingPaziente,
  editingType,
  savingPazienti,
  validCount,
  invalidCount,
  handleFileSelect,
  uploadFile,
  startEdit,
  cancelEdit,
  saveEdit,
  removePaziente,
  moveToValid,
  savePazientiToBackend,
  reset,
  clearNotification,
  formatDate,
} = useImportPazienti()

const fileInput = ref(null)

// Paginazione per record validi
const validCurrentPage = ref(1)
const validItemsPerPage = ref(10)

const validTotalPages = computed(() => {
  const pages = Math.ceil(validCount.value / validItemsPerPage.value)
  return pages || 1
})

const validStartIndex = computed(() => (validCurrentPage.value - 1) * validItemsPerPage.value)
const validEndIndex = computed(() => Math.min(validStartIndex.value + validItemsPerPage.value, validCount.value))

const paginatedValidPazienti = computed(() => {
  return validPazienti.value.slice(validStartIndex.value, validEndIndex.value)
})

// Reset page when items per page changes
watch(validItemsPerPage, () => {
  validCurrentPage.value = 1
})

// Paginazione per record invalidi
const invalidCurrentPage = ref(1)
const invalidItemsPerPage = ref(10)

const invalidTotalPages = computed(() => {
  const pages = Math.ceil(invalidCount.value / invalidItemsPerPage.value)
  return pages || 1
})

const invalidStartIndex = computed(() => (invalidCurrentPage.value - 1) * invalidItemsPerPage.value)
const invalidEndIndex = computed(() => Math.min(invalidStartIndex.value + invalidItemsPerPage.value, invalidCount.value))

const paginatedInvalidPazienti = computed(() => {
  return invalidPazienti.value.slice(invalidStartIndex.value, invalidEndIndex.value)
})

// Reset page when items per page changes
watch(invalidItemsPerPage, () => {
  invalidCurrentPage.value = 1
})

/**
 * Genera array di numeri di pagina per la paginazione
 */
const getPageNumbers = (currentPage, totalPages) => {
  const pages = []
  const maxVisible = 5

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    }
  }

  return pages
}

const validPageNumbers = computed(() => getPageNumbers(validCurrentPage.value, validTotalPages.value))
const invalidPageNumbers = computed(() => getPageNumbers(invalidCurrentPage.value, invalidTotalPages.value))

/**
 * Gestisce il cambio di file nell'input
 */
const onFileChange = (event) => {
  const selectedFile = event.target.files[0]
  if (selectedFile) {
    handleFileSelect(selectedFile)
  }
}

/**
 * Formatta la dimensione del file
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Torna alla pagina pazienti
 */
const goBackToPazienti = () => {
  router.push({ name: 'Pazienti' })
}

/**
 * Gestisce il salvataggio dal modal
 */
const handleModalSave = (updatedPaziente) => {
  if (!editingPaziente.value) return

  // Aggiorna i dati del paziente in editingPaziente
  Object.assign(editingPaziente.value, updatedPaziente)

  // Chiama il metodo saveEdit del composable che gestisce il salvataggio
  saveEdit()
}
</script>

<style scoped>
.pazienti-import-page {
  padding: 20px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
}

.upload-section {
  padding: 20px;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.stats-card {
  border: 1px solid transparent;
}

.bg-success-subtle {
  background-color: #d1e7dd !important;
}

.bg-danger-subtle {
  background-color: #f8d7da !important;
}

/* Animazioni notifiche */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Stile per il codice fiscale */
code {
  background-color: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.875rem;
  white-space: nowrap;
}

/* Tabelle responsive */
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Text wrap per badge errori */
.text-wrap {
  white-space: normal !important;
  word-break: break-word;
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }
}
</style>
