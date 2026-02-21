<template>
  <div class="admin-messages-page">

    <!-- Page Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="mb-1">Report</h2>
        <p class="text-medium-emphasis mb-0">Gestisci problemi, feedback e segnalazioni del portale</p>
      </div>
      <CButton color="primary" @click="openCreateModal">
        <CIcon icon="cil-plus" class="me-2" />
        Nuovo report
      </CButton>
    </div>

    <!-- Notification -->
    <Transition name="fade">
      <CAlert
        v-if="notification"
        :color="notification.type"
        class="mb-4"
        dismissible
        @close="notification = null"
      >
        {{ notification.message }}
      </CAlert>
    </Transition>

    <!-- KPI Stats -->
    <CRow :xs="{ cols: 2 }" :lg="{ cols: 4 }" class="g-3 mb-4">
      <CCol>
        <CCard class="kpi-card h-100">
          <CCardBody class="p-3 d-flex align-items-center gap-3">
            <div class="kpi-icon-wrap kpi-icon-neutral">
              <CIcon icon="cil-list" size="lg" />
            </div>
            <div>
              <div class="kpi-number">{{ stats.total }}</div>
              <div class="kpi-label text-medium-emphasis">Totale</div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol>
        <CCard class="kpi-card h-100">
          <CCardBody class="p-3 d-flex align-items-center gap-3">
            <div class="kpi-icon-wrap kpi-icon-primary">
              <CIcon icon="cil-info" size="lg" />
            </div>
            <div>
              <div class="kpi-number text-primary">{{ stats.open }}</div>
              <div class="kpi-label text-medium-emphasis">Aperti</div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol>
        <CCard class="kpi-card h-100">
          <CCardBody class="p-3 d-flex align-items-center gap-3">
            <div class="kpi-icon-wrap kpi-icon-warning">
              <CIcon icon="cil-clock" size="lg" />
            </div>
            <div>
              <div class="kpi-number text-warning">{{ stats.inProgress }}</div>
              <div class="kpi-label text-medium-emphasis">In lavorazione</div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol>
        <CCard class="kpi-card h-100">
          <CCardBody class="p-3 d-flex align-items-center gap-3">
            <div class="kpi-icon-wrap kpi-icon-secondary">
              <CIcon icon="cil-check-circle" size="lg" />
            </div>
            <div>
              <div class="kpi-number text-secondary">{{ stats.closed }}</div>
              <div class="kpi-label text-medium-emphasis">Chiusi</div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <!-- Last 4 Closed -->
    <div v-if="lastClosed.length > 0" class="mb-4">
      <p class="text-medium-emphasis small fw-semibold mb-2 text-uppercase letter-spacing-1">
        Ultime segnalazioni chiuse
      </p>
      <CRow :xs="{ cols: 1 }" :sm="{ cols: 2 }" :lg="{ cols: 4 }" class="g-3">
        <CCol v-for="msg in lastClosed" :key="msg.id">
          <CCard class="h-100 closed-card">
            <CCardBody class="p-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <CBadge :color="typeColor(msg.type)" shape="rounded-pill" class="small">
                  {{ typeLabel(msg.type) }}
                </CBadge>
                <span class="text-medium-emphasis" style="font-size: 0.72rem">
                  {{ formatRelativeDate(msg.closedAt) }}
                </span>
              </div>
              <p class="fw-semibold mb-1 small lh-sm">{{ msg.title }}</p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>

    <!-- Table Card -->
    <CCard>
      <CCardHeader class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div class="d-flex align-items-center gap-2">
          <strong>Report</strong>
          <!-- Filtri attivi badge + reset -->
          <span v-if="activeFiltersCount > 0" class="d-flex align-items-center gap-1">
            <CBadge color="primary" shape="rounded-pill">{{ activeFiltersCount }}</CBadge>
            <CButton
              color="link"
              size="sm"
              class="p-0 text-decoration-none text-medium-emphasis"
              style="font-size: 0.78rem"
              @click="resetFilters"
            >
              Azzera filtri
            </CButton>
          </span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <CButton
            v-if="filteredMessages.length > 0"
            color="light"
            size="sm"
            :title="allExpanded ? 'Comprimi tutto' : 'Espandi tutto'"
            @click="toggleExpandAll"
          >
            <CIcon :icon="allExpanded ? 'cil-chevron-bottom' : 'cil-arrow-right'" class="me-1" />
            {{ allExpanded ? 'Comprimi tutto' : 'Espandi tutto' }}
          </CButton>
          <CInputGroup size="sm" style="width: 240px">
            <CInputGroupText>
              <CIcon icon="cil-magnifying-glass" />
            </CInputGroupText>
            <CFormInput
              v-model="searchTerm"
              placeholder="Cerca report..."
            />
          </CInputGroup>
        </div>
      </CCardHeader>

      <CCardBody class="p-0">
        <!-- Loading -->
        <div v-if="loading" class="text-center py-5">
          <CSpinner color="primary" />
          <p class="mt-2 text-medium-emphasis">Caricamento in corso...</p>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!loading && filteredMessages.length === 0"
          class="text-center py-5 text-medium-emphasis"
        >
          <CIcon icon="cil-speech" size="3xl" class="mb-3 opacity-50" />
          <p class="mb-0">
            {{ searchTerm || activeFiltersCount > 0
              ? 'Nessun report corrisponde ai filtri applicati.'
              : 'Nessun report presente. Crea il primo!' }}
          </p>
          <CButton
            v-if="activeFiltersCount > 0 || searchTerm"
            color="link"
            size="sm"
            class="mt-2"
            @click="resetFilters"
          >
            Azzera i filtri
          </CButton>
        </div>

        <!-- Table -->
        <CTable v-else responsive class="mb-0 report-table">
          <CTableHead color="light">
            <!-- Intestazioni colonne -->
            <CTableRow>
              <CTableHeaderCell class="expand-col" />
              <CTableHeaderCell>Titolo</CTableHeaderCell>
              <CTableHeaderCell>Tipo</CTableHeaderCell>
              <CTableHeaderCell>Priorità</CTableHeaderCell>
              <CTableHeaderCell>Stato</CTableHeaderCell>
              <CTableHeaderCell>Creato</CTableHeaderCell>
              <CTableHeaderCell class="text-end actions-col">Azioni</CTableHeaderCell>
            </CTableRow>
            <!-- Filtri colonne -->
            <CTableRow class="filter-row">
              <CTableHeaderCell />
              <CTableHeaderCell />
              <CTableHeaderCell>
                <CFormSelect v-model="filters.type" size="sm">
                  <option value="">Tutti</option>
                  <option value="PROBLEM">Problema</option>
                  <option value="FEEDBACK">Feedback</option>
                  <option value="REPORT">Segnalazione</option>
                </CFormSelect>
              </CTableHeaderCell>
              <CTableHeaderCell>
                <CFormSelect v-model="filters.priority" size="sm">
                  <option value="">Tutti</option>
                  <option value="LOW">Bassa</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                </CFormSelect>
              </CTableHeaderCell>
              <CTableHeaderCell>
                <CFormSelect v-model="filters.status" size="sm">
                  <option value="">Tutti</option>
                  <option value="OPEN">Aperto</option>
                  <option value="IN_PROGRESS">In lavorazione</option>
                  <option value="RESOLVED">Risolto</option>
                  <option value="CLOSED">Chiuso</option>
                </CFormSelect>
              </CTableHeaderCell>
              <CTableHeaderCell />
              <CTableHeaderCell />
            </CTableRow>
          </CTableHead>

          <CTableBody>
            <template v-for="message in filteredMessages" :key="message.id">
              <!-- Riga principale -->
              <CTableRow
                class="main-row"
                :class="[
                  { 'row-expanded': isExpanded(message.id) },
                  `priority-${message.priority.toLowerCase()}`
                ]"
                @click="toggleExpand(message.id)"
              >
                <CTableDataCell class="expand-col text-medium-emphasis">
                  <CIcon
                    :icon="isExpanded(message.id) ? 'cil-chevron-bottom' : 'cil-arrow-right'"
                    size="sm"
                    class="expand-icon"
                    :class="{ 'icon-rotated': isExpanded(message.id) }"
                  />
                </CTableDataCell>
                <CTableDataCell>
                  <span class="fw-semibold">{{ message.title }}</span>
                </CTableDataCell>
                <CTableDataCell>
                  <CBadge :color="typeColor(message.type)" shape="rounded-pill">
                    {{ typeLabel(message.type) }}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell>
                  <CBadge :color="priorityColor(message.priority)" shape="rounded-pill">
                    {{ priorityLabel(message.priority) }}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell>
                  <CBadge :color="statusColor(message.status)" shape="rounded-pill">
                    {{ statusLabel(message.status) }}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell class="text-medium-emphasis small" :title="formatDate(message.createdAt)">
                  {{ formatRelativeDate(message.createdAt) }}
                </CTableDataCell>

                <!-- Azioni: dropdown -->
                <CTableDataCell class="text-end actions-col" @click.stop>
                  <CDropdown alignment="end">
                    <CDropdownToggle color="light" variant="ghost" size="sm" :caret="false">
                      <CIcon icon="cil-options" />
                    </CDropdownToggle>
                    <CDropdownMenu>
                      <CDropdownItem @click="openEditModal(message)">
                        <CIcon icon="cil-pencil" class="me-2 text-medium-emphasis" />
                        Modifica
                      </CDropdownItem>
                      <CDropdownItem
                        v-if="message.status === 'CLOSED' || message.status === 'RESOLVED'"
                        @click="reopenMessage(message.id)"
                      >
                        <CIcon icon="cil-reload" class="me-2 text-warning" />
                        Riapri
                      </CDropdownItem>
                      <CDropdownDivider />
                      <CDropdownItem class="text-danger" @click="openDeleteModal(message)">
                        <CIcon icon="cil-trash" class="me-2" />
                        Elimina
                      </CDropdownItem>
                    </CDropdownMenu>
                  </CDropdown>
                </CTableDataCell>
              </CTableRow>

              <!-- Riga espansa con il testo completo -->
              <CTableRow v-if="isExpanded(message.id)" class="expand-row">
                <CTableDataCell colspan="7" class="px-4 py-3 expand-cell">
                  <p class="mb-0 text-body expand-body">{{ message.body }}</p>
                </CTableDataCell>
              </CTableRow>
            </template>
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>

    <!-- Modale creazione -->
    <CModal
      :visible="showCreateModal"
      size="lg"
      alignment="center"
      backdrop="static"
      @close="closeCreateModal"
    >
      <CModalHeader>
        <CModalTitle>Nuovo report</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <MessageForm ref="createFormRef" :initial-data="createInitialData" />
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" @click="closeCreateModal">Annulla</CButton>
        <CButton color="primary" :disabled="loading" @click="onCreateSubmit">
          <CSpinner v-if="loading" size="sm" class="me-2" />
          Crea report
        </CButton>
      </CModalFooter>
    </CModal>

    <!-- Modale modifica -->
    <CModal
      :visible="showEditModal"
      size="lg"
      alignment="center"
      backdrop="static"
      @close="closeEditModal"
    >
      <CModalHeader>
        <CModalTitle>Modifica report</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <MessageForm ref="editFormRef" :initial-data="selectedMessage" />
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" @click="closeEditModal">Annulla</CButton>
        <CButton color="primary" :disabled="loading" @click="onEditSubmit">
          <CSpinner v-if="loading" size="sm" class="me-2" />
          Salva modifiche
        </CButton>
      </CModalFooter>
    </CModal>

    <!-- Modale eliminazione -->
    <CModal
      :visible="showDeleteModal"
      alignment="center"
      @close="closeDeleteModal"
    >
      <CModalHeader>
        <CModalTitle>Elimina report</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div class="d-flex gap-2 mb-3">
          <CBadge :color="typeColor(messageToDelete?.type)" shape="rounded-pill">
            {{ typeLabel(messageToDelete?.type) }}
          </CBadge>
          <CBadge :color="priorityColor(messageToDelete?.priority)" shape="rounded-pill">
            {{ priorityLabel(messageToDelete?.priority) }}
          </CBadge>
          <CBadge :color="statusColor(messageToDelete?.status)" shape="rounded-pill">
            {{ statusLabel(messageToDelete?.status) }}
          </CBadge>
        </div>
        <p class="mb-1">
          Sei sicuro di voler eliminare
          <strong>{{ messageToDelete?.title }}</strong>?
        </p>
        <p class="text-danger small mb-0">
          <CIcon icon="cil-warning" size="sm" class="me-1" />
          L'operazione non può essere annullata.
        </p>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" @click="closeDeleteModal">Annulla</CButton>
        <CButton color="danger" :disabled="loading" @click="deleteMessage">
          <CSpinner v-if="loading" size="sm" class="me-2" />
          Elimina
        </CButton>
      </CModalFooter>
    </CModal>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminMessages } from '@/composables/useAdminMessages'
import MessageForm from './MessageForm.vue'

const {
  filteredMessages,
  lastClosed,
  stats,
  loading,
  notification,
  searchTerm,
  filters,
  activeFiltersCount,
  selectedMessage,
  showCreateModal,
  showEditModal,
  showDeleteModal,
  messageToDelete,
  fetchMessages,
  createMessage,
  updateMessage,
  reopenMessage,
  deleteMessage,
  resetFilters,
  openCreateModal,
  closeCreateModal,
  openEditModal,
  closeEditModal,
  openDeleteModal,
  closeDeleteModal,
  typeColor,
  priorityColor,
  statusColor,
  typeLabel,
  priorityLabel,
  statusLabel,
  formatDate,
  formatRelativeDate,
} = useAdminMessages()

// --- Collapsible rows ---
const expandedIds = ref([])

function toggleExpand(id) {
  const index = expandedIds.value.indexOf(id)
  if (index === -1) expandedIds.value.push(id)
  else expandedIds.value.splice(index, 1)
}

function isExpanded(id) {
  return expandedIds.value.includes(id)
}

const allExpanded = computed(() =>
  filteredMessages.value.length > 0 &&
  filteredMessages.value.every(m => isExpanded(m.id))
)

function toggleExpandAll() {
  if (allExpanded.value) {
    expandedIds.value = []
  } else {
    expandedIds.value = filteredMessages.value.map(m => m.id)
  }
}

// --- Form refs ---
const createInitialData = { title: '', body: '', type: 'PROBLEM', priority: 'MEDIUM' }
const createFormRef = ref(null)
const editFormRef   = ref(null)

async function onCreateSubmit() {
  if (!createFormRef.value?.validate()) return
  await createMessage(createFormRef.value.getData())
}

async function onEditSubmit() {
  if (!editFormRef.value?.validate()) return
  const data = editFormRef.value.getData()
  await updateMessage({ ...data, id: selectedMessage.value?.id })
}

onMounted(() => {
  fetchMessages()
})
</script>

<style scoped>
.admin-messages-page {
  padding: 0;
}

.letter-spacing-1 {
  letter-spacing: 0.05em;
}

/* ---- KPI cards ---- */
.kpi-card {
  border: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
}

.kpi-number {
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1;
}

.kpi-label {
  font-size: 0.78rem;
  margin-top: 2px;
}

.kpi-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon-neutral  { background: rgba(108, 117, 125, 0.12); color: #6c757d; }
.kpi-icon-primary  { background: rgba(var(--cui-primary-rgb), 0.12); color: var(--cui-primary); }
.kpi-icon-warning  { background: rgba(var(--cui-warning-rgb), 0.12); color: var(--cui-warning); }
.kpi-icon-secondary{ background: rgba(108, 117, 125, 0.12); color: #6c757d; }

/* ---- Closed cards ---- */
.closed-card {
  border-left: 3px solid var(--cui-secondary);
}

/* ---- Expand toggle column ---- */
.expand-col {
  width: 36px;
  min-width: 36px;
}

.actions-col {
  width: 60px;
  min-width: 60px;
}

/* ---- Expand icon animation ---- */
.expand-icon {
  transition: transform 0.18s ease;
}

/* ---- Main clickable row ---- */
.main-row {
  cursor: pointer;
}

.main-row:hover td {
  background-color: var(--cui-tertiary-bg);
}

.main-row.row-expanded td {
  border-bottom: none;
}

/* ---- Priority left border (box-shadow works on <tr>) ---- */
.priority-high   { box-shadow: inset 4px 0 0 var(--cui-danger); }
.priority-medium { box-shadow: inset 4px 0 0 var(--cui-warning); }
.priority-low    { box-shadow: inset 4px 0 0 var(--cui-success); }

/* ---- Filter row in header ---- */
.filter-row th {
  padding-top: 6px;
  padding-bottom: 8px;
  font-weight: normal;
}

/* ---- Expanded content row ---- */
.expand-row td {
  background-color: var(--cui-tertiary-bg);
  border-top: none;
}

/* Forza la cella colspan a non superare la larghezza della tabella */
.expand-cell {
  max-width: 0;
  overflow: hidden;
}

/* Il testo si adatta alla larghezza disponibile senza mai forzare scroll orizzontale */
.expand-body {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
}

/* ---- Transition ---- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
