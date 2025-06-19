<template>
  <div class="attivita-page">
    <!-- Header della pagina -->
    <CRow class="mb-4">
      <CCol>
        <h2 class="page-title">
          <CIcon icon="cil-task" class="me-2" />
          Attività Centro
        </h2>
        <p class="text-muted">
          Visualizza tutte le attività svolte al centro con informazioni complete su pazienti, specialisti e prestazioni
        </p>
      </CCol>
      <CCol md="auto">
        <!-- Statistiche rapide -->
        <div class="stats-cards" v-if="!loading && filteredAttivita.length > 0">
          <CRow class="g-2">
            <CCol>
              <CCard class="text-center border-0 bg-primary text-white">
                <CCardBody class="py-2">
                  <h6 class="mb-0">{{ statistiche.totaleAttivita }}</h6>
                  <small>Attività</small>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol>
              <CCard class="text-center border-0 bg-success text-white">
                <CCardBody class="py-2">
                  <h6 class="mb-0">{{ statistiche.pazientiUnici }}</h6>
                  <small>Pazienti</small>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol>
              <CCard class="text-center border-0 bg-info text-white">
                <CCardBody class="py-2">
                  <h6 class="mb-0">{{ statistiche.specialistiUnichi }}</h6>
                  <small>Specialisti</small>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </div>
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

    <!-- Card filtri -->
    <CCard class="mb-4">
      <CCardHeader>
        <CRow class="align-items-center">
          <CCol>
            <h5 class="mb-0">
              <CIcon icon="cil-filter" class="me-2" />
              Filtri
            </h5>
          </CCol>
          <CCol md="auto">
            <CButton
              variant="outline"
              color="secondary"
              size="sm"
              @click="resetFiltri"
              :disabled="loading"
            >
              <CIcon icon="cil-refresh" class="me-1" />
              Reset Filtri
            </CButton>
          </CCol>
        </CRow>
      </CCardHeader>
      <CCardBody>
        <CRow class="g-3">
          <!-- Filtro Prestazione -->
          <CCol md="3">
            <CFormLabel for="filtro-prestazione">Prestazione</CFormLabel>
            <CFormSelect
              id="filtro-prestazione"
              v-model="filtri.prestazioneId"
              @change="applicaFiltriConDebounce"
              :disabled="loading"
            >
              <option value="">Tutte le prestazioni</option>
              <option
                v-for="prestazione in prestazioniOptions"
                :key="prestazione.value"
                :value="prestazione.value"
              >
                {{ prestazione.label }}
              </option>
            </CFormSelect>
          </CCol>

          <!-- Filtro Specialista -->
          <CCol md="3">
            <CFormLabel for="filtro-specialista">Specialista</CFormLabel>
            <CFormSelect
              id="filtro-specialista"
              v-model="filtri.specialistaId"
              @change="applicaFiltriConDebounce"
              :disabled="loading"
            >
              <option value="">Tutti gli specialisti</option>
              <option
                v-for="specialista in specialistiOptions"
                :key="specialista.value"
                :value="specialista.value"
              >
                {{ specialista.label }}{{ specialista.prestazione ? ' (' + specialista.prestazione + ')' : '' }}
              </option>
            </CFormSelect>
          </CCol>

          <!-- Filtro Data Inizio -->
          <CCol md="3">
            <CFormLabel for="filtro-data-inizio">Data Inizio</CFormLabel>
            <CFormInput
              id="filtro-data-inizio"
              type="date"
              v-model="filtri.dataInizio"
              @change="applicaFiltriConDebounce"
              :disabled="loading"
            />
          </CCol>

          <!-- Filtro Data Fine -->
          <CCol md="3">
            <CFormLabel for="filtro-data-fine">Data Fine</CFormLabel>
            <CFormInput
              id="filtro-data-fine"
              type="date"
              v-model="filtri.dataFine"
              @change="applicaFiltriConDebounce"
              :disabled="loading"
            />
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <!-- Card contenitore principale -->
    <CCard>
      <CCardHeader>
        <CRow class="align-items-center">
          <CCol md="6">
            <h5 class="mb-0">Lista Attività</h5>
            <small v-if="!loading && sortedAndFilteredAttivita.length > 0" class="text-muted">
              {{ paginationInfo.showing }} di {{ paginationInfo.total }} attività
            </small>
          </CCol>
          <CCol md="6">
            <!-- Barra di ricerca -->
            <CInputGroup>
              <CFormInput
                v-model="searchTerm"
                placeholder="Cerca per paziente, specialista, prestazione..."
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
          <p class="mt-2 text-muted">Caricamento attività...</p>
        </div>

        <!-- Messaggio di errore -->
        <CAlert v-else-if="error" color="danger">
          {{ error }}
          <CButton
            color="link"
            size="sm"
            @click="initializeData"
            class="ms-2"
          >
            Riprova
          </CButton>
        </CAlert>

        <!-- Tabella attività -->
        <div v-else-if="sortedAndFilteredAttivita.length > 0">
          <!-- Info filtri attivi -->
          <CRow class="align-items-center mb-3" v-if="hasActiveFiltri">
            <CCol>
              <div class="d-flex flex-wrap gap-1">
                <CBadge
                  v-if="filtri.prestazioneId"
                  color="primary"
                  class="active-filter-badge"
                >
                  {{ getPrestazioneLabel(filtri.prestazioneId) }}
                  <CButton
                    variant="ghost"
                    size="sm"
                    @click="clearFiltro('prestazioneId')"
                    class="ms-1 p-0"
                    style="font-size: 0.7rem;"
                  >
                    ×
                  </CButton>
                </CBadge>
                <CBadge
                  v-if="filtri.specialistaId"
                  color="info"
                  class="active-filter-badge"
                >
                  {{ getSpecialistaLabel(filtri.specialistaId) }}
                  <CButton
                    variant="ghost"
                    size="sm"
                    @click="clearFiltro('specialistaId')"
                    class="ms-1 p-0"
                    style="font-size: 0.7rem;"
                  >
                    ×
                  </CButton>
                </CBadge>
                <CBadge
                  v-if="filtri.dataInizio || filtri.dataFine"
                  color="success"
                  class="active-filter-badge"
                >
                  {{ getDateRangeLabel() }}
                  <CButton
                    variant="ghost"
                    size="sm"
                    @click="clearDateFilters"
                    class="ms-1 p-0"
                    style="font-size: 0.7rem;"
                  >
                    ×
                  </CButton>
                </CBadge>
              </div>
            </CCol>
          </CRow>

          <!-- Tabella responsive con ordinamento -->
          <CTable hover responsive striped>
            <CTableHead>
              <CTableRow>
                <!-- Data Attività - Sortable -->
                <CTableHeaderCell
                  scope="col"
                  :class="getSortClass('dataEvento')"
                  @click="handleSort('dataEvento')"
                  style="cursor: pointer; user-select: none; width: 120px;"
                >
                  <div class="d-flex align-items-center justify-content-between">
                    <span>Data</span>
                    <CIcon
                      :icon="getSortIcon('dataEvento')"
                      size="sm"
                      class="sort-icon"
                    />
                  </div>
                </CTableHeaderCell>

                <!-- Paziente - Sortable -->
                <CTableHeaderCell
                  scope="col"
                  :class="getSortClass('paziente')"
                  @click="handleSort('paziente')"
                  style="cursor: pointer; user-select: none;"
                >
                  <div class="d-flex align-items-center justify-content-between">
                    <span>Paziente</span>
                    <CIcon
                      :icon="getSortIcon('paziente')"
                      size="sm"
                      class="sort-icon"
                    />
                  </div>
                </CTableHeaderCell>

                <!-- Specialista - Sortable -->
                <CTableHeaderCell
                  scope="col"
                  :class="getSortClass('specialista')"
                  @click="handleSort('specialista')"
                  style="cursor: pointer; user-select: none;"
                >
                  <div class="d-flex align-items-center justify-content-between">
                    <span>Specialista</span>
                    <CIcon
                      :icon="getSortIcon('specialista')"
                      size="sm"
                      class="sort-icon"
                    />
                  </div>
                </CTableHeaderCell>

                <!-- Prestazione - Sortable -->
                <CTableHeaderCell
                  scope="col"
                  :class="getSortClass('prestazione')"
                  @click="handleSort('prestazione')"
                  style="cursor: pointer; user-select: none;"
                >
                  <div class="d-flex align-items-center justify-content-between">
                    <span>Prestazione</span>
                    <CIcon
                      :icon="getSortIcon('prestazione')"
                      size="sm"
                      class="sort-icon"
                    />
                  </div>
                </CTableHeaderCell>

                <!-- Evento Info -->
                <CTableHeaderCell scope="col">
                  Evento
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow
                v-for="attivita in paginatedAttivita"
                :key="attivita.id"
                class="table-row-hover"
              >
                <!-- Data -->
                <CTableDataCell>
                  <strong>{{ formatDate(attivita.evento.dataEvento) }}</strong>
                  <small class="text-muted d-block">
                    {{ formatDateTime(attivita.evento.dataInizio) }}
                  </small>
                </CTableDataCell>

                <!-- Paziente -->
                <CTableDataCell>
                  <div v-if="attivita.paziente" class="paziente-info">
                    <div class="fw-semibold">
                      {{ attivita.paziente.nomeCompleto }}
                    </div>
                    <small class="text-muted d-block">
                      CF: {{ attivita.paziente.codiceFiscale }}
                    </small>
                    <small class="text-muted d-block">
                      {{ formatDate(attivita.paziente.dataDiNascita) }}
                    </small>
                  </div>
                  <span v-else class="text-muted">-</span>
                </CTableDataCell>

                <!-- Specialista -->
                <CTableDataCell>
                  <div v-if="attivita.specialista" class="specialista-info">
                    <div class="fw-semibold">
                      {{ attivita.specialista.nomeCompleto }}
                    </div>
                    <small v-if="attivita.specialista.email" class="text-muted d-block">
                      {{ attivita.specialista.email }}
                    </small>
                  </div>
                  <span v-else class="text-muted">-</span>
                </CTableDataCell>

                <!-- Prestazione -->
                <CTableDataCell>
                  <div v-if="attivita.prestazione" class="prestazione-info">
                    <CBadge
                      :style="{ backgroundColor: attivita.prestazione.color, color: getContrastColor(attivita.prestazione.color) }"
                      class="prestazione-badge"
                    >
                      {{ attivita.prestazione.tipologia }}
                    </CBadge>
                  </div>
                  <span v-else class="text-muted">-</span>
                </CTableDataCell>

                <!-- Evento Info -->
                <CTableDataCell>
                  <div class="evento-info">
                    <div class="fw-semibold">{{ attivita.evento.titolo }}</div>
                    <small class="text-muted d-block">
                      <CIcon icon="cil-location-pin" size="sm" class="me-1" />
                      {{ attivita.evento.stanza }}
                    </small>
                  </div>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>

          <!-- Paginazione -->
          <CRow class="align-items-center mt-4" v-if="totalPages > 1">
            <CCol md="6">
              <p class="text-muted small mb-0">
                Pagina {{ currentPage }} di {{ totalPages }}
                ({{ paginationInfo.start }}-{{ paginationInfo.end }} di {{ paginationInfo.total }})
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
          <CIcon icon="cil-task" size="3xl" class="text-muted mb-3" />
          <h5 class="text-muted">
            {{ searchTerm || hasActiveFiltri ? 'Nessuna attività trovata' : 'Nessuna attività presente' }}
          </h5>
          <p class="text-muted">
            {{ searchTerm || hasActiveFiltri
              ? 'Prova a modificare i criteri di ricerca o i filtri'
              : 'Non ci sono attività registrate per il periodo selezionato'
            }}
          </p>
          <CButton
            v-if="hasActiveFiltri"
            color="primary"
            @click="resetFiltri"
          >
            <CIcon icon="cil-refresh" class="me-2" />
            Reset Filtri
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  </div>
</template>

<script setup>
/**
 * Pagina Gestione Attività
 *
 * Questa pagina mostra tutte le attività del centro con informazioni complete
 * su pazienti, specialisti, prestazioni ed eventi. Include funzionalità di:
 * - Filtraggi dinamici per prestazione, specialista e periodo
 * - Ricerca testuale
 * - Ordinamento colonne
 * - Paginazione
 * - Statistiche riassuntive
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAttivita } from '@/composables/useAttivita'

// Utilizziamo il composable per la logica di business delle attività
const {
  filteredAttivita,
  loading,
  error,
  filtri,
  notification,
  searchTerm,
  prestazioni,
  specialisti,
  prestazioniOptions,
  specialistiOptions,
  statistiche,
  initializeData,
  applicaFiltri,
  resetFiltri,
  clearNotification,
  formatDate,
  formatDateTime
} = useAttivita()

// Stati locali per paginazione e ordinamento
const currentPage = ref(1)
const itemsPerPage = ref(10)
const sortColumn = ref('dataEvento')
const sortDirection = ref('desc')

// Computed properties per paginazione e ordinamento
const paginationInfo = computed(() => {
  const total = sortedAndFilteredAttivita.value.length
  const itemsPerPageNum = Number(itemsPerPage.value)
  const start = total === 0 ? 0 : (currentPage.value - 1) * itemsPerPageNum + 1
  const end = Math.min(currentPage.value * itemsPerPageNum, total)
  const showing = `${start}-${end}`

  return { total, start, end, showing }
})

const totalPages = computed(() => Math.ceil(sortedAndFilteredAttivita.value.length / itemsPerPage.value))

// Computed per ordinamento e filtraggi
const sortedAndFilteredAttivita = computed(() => {
  let result = [...filteredAttivita.value]

  // Applicazione ordinamento se presente
  if (sortColumn.value) {
    result.sort((a, b) => {
      let valueA, valueB

      switch (sortColumn.value) {
        case 'dataEvento':
          valueA = a.evento.dataEvento ? new Date(a.evento.dataEvento) : new Date(0)
          valueB = b.evento.dataEvento ? new Date(b.evento.dataEvento) : new Date(0)
          break
        case 'paziente':
          valueA = (a.paziente?.nomeCompleto || '').toLowerCase()
          valueB = (b.paziente?.nomeCompleto || '').toLowerCase()
          break
        case 'specialista':
          valueA = (a.specialista?.nomeCompleto || '').toLowerCase()
          valueB = (b.specialista?.nomeCompleto || '').toLowerCase()
          break
        case 'prestazione':
          valueA = (a.prestazione?.tipologia || '').toLowerCase()
          valueB = (b.prestazione?.tipologia || '').toLowerCase()
          break
        default:
          valueA = ''
          valueB = ''
      }

      let comparison = 0
      if (valueA > valueB) comparison = 1
      else if (valueA < valueB) comparison = -1

      return sortDirection.value === 'desc' ? comparison * -1 : comparison
    })
  }

  return result
})

// Computed per paginazione
const paginatedAttivita = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + Number(itemsPerPage.value)
  return sortedAndFilteredAttivita.value.slice(start, end)
})

// Computed per verificare se ci sono filtri attivi
const hasActiveFiltri = computed(() => {
  return filtri.prestazioneId ||
         filtri.specialistaId ||
         filtri.dataInizio ||
         filtri.dataFine
})

// Metodi per paginazione
const changePage = (pageNumber) => {
  if (pageNumber >= 1 && pageNumber <= totalPages.value) {
    currentPage.value = pageNumber
  }
}

// Metodi per ordinamento
const handleSort = (column) => {
  if (sortColumn.value === column) {
    // Cambia direzione se è la stessa colonna
    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc'
    } else {
      // Reset ordinamento se era già desc
      sortColumn.value = null
      sortDirection.value = 'asc'
    }
  } else {
    // Nuova colonna, imposta ascendente
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
  currentPage.value = 1 // Reset alla prima pagina
}

const getSortIcon = (column) => {
  if (sortColumn.value !== column) return 'cilSwapVertical'
  return sortDirection.value === 'asc' ? 'cilArrowTop' : 'cilArrowBottom'
}

const getSortClass = (column) => {
  return {
    'sortable-header': true,
    'sorted': sortColumn.value === column
  }
}

// Debounce per filtri (evita troppe chiamate durante la digitazione)
let filterTimeout = null
const applicaFiltriConDebounce = () => {
  if (filterTimeout) clearTimeout(filterTimeout)

  filterTimeout = setTimeout(() => {
    applicaFiltri(filtri)
    currentPage.value = 1 // Reset alla prima pagina quando si filtrano i dati
  }, 300)
}

// Utility per filtri attivi (per mostrare i badge)
const getPrestazioneLabel = (prestazioneId) => {
  const prestazione = prestazioni.value.find(p => p.id === parseInt(prestazioneId))
  return prestazione?.tipologia || 'Prestazione'
}

const getSpecialistaLabel = (specialistaId) => {
  const specialista = specialisti.value.find(s => s.id === parseInt(specialistaId))
  return specialista ? `${specialista.nome} ${specialista.cognome}`.trim() : 'Specialista'
}

const getDateRangeLabel = () => {
  if (filtri.dataInizio && filtri.dataFine) {
    return `${formatDate(filtri.dataInizio)} - ${formatDate(filtri.dataFine)}`
  } else if (filtri.dataInizio) {
    return `Da ${formatDate(filtri.dataInizio)}`
  } else if (filtri.dataFine) {
    return `Fino a ${formatDate(filtri.dataFine)}`
  }
  return 'Periodo'
}

// Metodi per pulire singoli filtri
const clearFiltro = (filtroName) => {
  filtri[filtroName] = null
  applicaFiltriConDebounce()
}

const clearDateFilters = () => {
  filtri.dataInizio = null
  filtri.dataFine = null
  applicaFiltriConDebounce()
}

// Utility per contrasto colori delle prestazioni
const getContrastColor = (backgroundColor) => {
  if (!backgroundColor) return '#000000'

  const hex = backgroundColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Calcolo luminanza per determinare il colore del testo
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

// Watchers per gestire cambi di stato
watch([searchTerm, () => filtri], () => {
  currentPage.value = 1 // Reset alla prima pagina quando cambiano i filtri
}, { deep: true })

// Lifecycle hooks
onMounted(() => {
  console.log('Pagina Attività montata - caricamento dati...')
  initializeData()
})

onUnmounted(() => {
  // Pulizia timeout se la pagina viene smontata
  if (filterTimeout) clearTimeout(filterTimeout)
})
</script>

<style scoped>
/**
 * Stili specifici per la pagina Attività
 * Compatibili con dark mode di CoreUI
 */

.attivita-page {
  padding: 0;
}

.page-title {
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* Statistiche rapide */
.stats-cards .card {
  transition: transform 0.2s ease-in-out;
}

.stats-cards .card:hover {
  transform: translateY(-2px);
}

.stats-cards h6 {
  font-size: 1.25rem;
  font-weight: bold;
}

.stats-cards small {
  font-size: 0.75rem;
}

/* Badge filtri attivi */
.active-filter-badge {
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
}

.active-filter-badge .btn {
  width: 16px;
  height: 16px;
  line-height: 1;
  border: none;
  background: transparent;
  color: inherit;
}

.active-filter-badge .btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

/* Tabella */
.table-row-hover {
  transition: background-color 0.15s ease-in-out;
}

.table-row-hover:hover {
  background-color: rgba(0, 123, 255, 0.05) !important;
}

.paziente-info,
.specialista-info,
.evento-info {
  line-height: 1.3;
}

.prestazione-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Ordinamento colonne */
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
}

.sortable-header:hover .sort-icon {
  opacity: 0.6;
}

.sortable-header.sorted .sort-icon {
  opacity: 1;
  color: #0056b3;
}

/* Responsive design */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .stats-cards .card h6 {
    font-size: 1rem;
  }

  .table-responsive {
    font-size: 0.875rem;
  }

  .paziente-info,
  .specialista-info,
  .evento-info {
    font-size: 0.875rem;
  }

  .prestazione-badge {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
  }
}

/* Dark mode compatibilità */
:deep(.dark-theme) .page-title {
  color: #ffffff;
}

:deep(.dark-theme) .sortable-header:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff;
}

:deep(.dark-theme) .sortable-header.sorted {
  background-color: rgba(255, 255, 255, 0.15) !important;
  color: #ffffff;
}
</style>
