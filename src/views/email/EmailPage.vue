<template>
  <!--
    Pagina principale per i Specialisti Reminder

    Questa pagina include:
    - Form per selezione data e specialisti
    - Validazione in tempo reale
    - Invio reminder con feedback
    - Modal con risultati dettagliati
  -->
  <div class="email-page">
    <!-- Header della pagina -->
    <CRow class="mb-4">
      <CCol>
        <h2 class="page-title">
          <CIcon icon="cil-envelope-closed" class="me-2" />
          Specialisti Reminder
        </h2>
        <p class="text-muted">
          Invia promemoria via email agli specialisti per appuntamenti di una data specifica
        </p>
      </CCol>
    </CRow>

    <!-- Notifica con animazioni -->
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

    <!-- Card principale del form -->
    <CCard class="mb-4">
      <CCardHeader class="bg-primary text-white">
        <h5 class="mb-0">
          <CIcon icon="cil-calendar" class="me-2" />
          Configura Specialisti Reminder
        </h5>
      </CCardHeader>

      <CCardBody>
        <!-- Stato di caricamento specialisti -->
        <div v-if="specialistiLoading" class="text-center py-4">
          <CSpinner color="primary" />
          <p class="mt-2 text-muted">Caricamento specialisti...</p>
        </div>

        <!-- Messaggio di errore -->
        <CAlert v-else-if="error" color="danger">
          {{ error }}
          <CButton
            color="link"
            size="sm"
            @click="loadSpecialisti"
            class="ms-2"
          >
            Riprova
          </CButton>
        </CAlert>

        <!-- Form principale -->
        <div v-else>
          <CRow>
            <!-- Sezione selezione data -->
            <CCol md="6" class="mb-4">
              <h6 class="form-section-title">
                <CIcon icon="cil-calendar" class="me-2" />
                Seleziona Data
              </h6>

              <div class="date-selection-container">
                <!-- Date picker -->
                <CFormLabel for="selectedDate" class="form-label">
                  Data per i reminder <span class="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  id="selectedDate"
                  type="date"
                  v-model="selectedDate"
                  :min="getTodayFormatted()"
                  class="mb-3"
                />

                <!-- Pulsanti data rapida -->
                <div class="quick-date-buttons">
                  <CButtonGroup size="sm">
                    <CButton
                      variant="outline"
                      color="secondary"
                      @click="setToday"
                      :disabled="emailLoading"
                    >
                      <CIcon icon="cil-clock" class="me-1" />
                      Oggi
                    </CButton>
                    <CButton
                      variant="outline"
                      color="secondary"
                      @click="setTomorrow"
                      :disabled="emailLoading"
                    >
                      <CIcon icon="cil-arrow-right" class="me-1" />
                      Domani
                    </CButton>
                  </CButtonGroup>
                </div>

                <!-- Info data selezionata -->
                <div v-if="selectedDate" class="selected-date-info mt-3">
                  <CAlert color="info" class="mb-0">
                    <CIcon icon="cil-info" class="me-2" />
                    <strong>Data selezionata:</strong> {{ formattedSelectedDate }}
                  </CAlert>
                </div>
              </div>
            </CCol>

            <!-- Sezione selezione specialisti -->
            <CCol md="6" class="mb-4">
              <h6 class="form-section-title">
                <CIcon icon="cil-people" class="me-2" />
                Seleziona Specialisti
              </h6>

              <!-- Controlli selezione -->
              <div class="specialisti-controls mb-3">
                <CRow class="align-items-center">
                  <CCol md="8">
                    <!-- Barra ricerca specialisti -->
                    <CInputGroup size="sm">
                      <CFormInput
                        v-model="searchTerm"
                        placeholder="Cerca specialisti..."
                        :disabled="emailLoading"
                      />
                      <CInputGroupText>
                        <CIcon icon="cil-magnifying-glass" />
                      </CInputGroupText>
                    </CInputGroup>
                  </CCol>
                  <CCol md="4">
                    <!-- Pulsanti selezione -->
                    <CButtonGroup size="sm" class="w-100">
                      <CButton
                        variant="outline"
                        color="primary"
                        @click="selectAllSpecialisti"
                        :disabled="emailLoading || filteredSpecialisti.length === 0"
                        title="Seleziona tutti"
                      >
                        <CIcon icon="cil-check-circle" />
                      </CButton>
                      <CButton
                        variant="outline"
                        color="secondary"
                        @click="clearSelection"
                        :disabled="emailLoading || selectedSpecialistiIDs.length === 0"
                        title="Deseleziona tutti"
                      >
                        <CIcon icon="cil-x-circle" />
                      </CButton>
                    </CButtonGroup>
                  </CCol>
                </CRow>
              </div>

              <!-- Lista specialisti -->
              <div class="specialisti-list-container">
                <div
                  v-if="filteredSpecialisti.length === 0"
                  class="text-center py-4 text-muted"
                >
                  <CIcon icon="cil-user" size="2xl" class="mb-2" />
                  <p class="mb-0">
                    {{ searchTerm ? 'Nessuno specialista trovato' : 'Nessuno specialista disponibile' }}
                  </p>
                </div>

                <div v-else class="specialisti-list">
                  <div
                    v-for="specialista in filteredSpecialisti"
                    :key="specialista.id"
                    class="specialista-item"
                    @click="toggleSpecialista(specialista.id)"
                    :class="{ 'selected': isSelected(specialista.id) }"
                  >
                    <CFormCheck
                      :id="`specialista-${specialista.id}`"
                      :checked="isSelected(specialista.id)"
                      :disabled="emailLoading"
                      class="specialista-checkbox"
                      @click.stop
                    />
                    <div class="specialista-info">
                      <div class="specialista-name">
                        {{ getSpecialistaFullName(specialista) }}
                      </div>
                      <div class="specialista-details">
                        <small class="text-muted">
                          {{ specialista.email }}
                          <span v-if="specialista.prestazione" class="ms-2">
                            • {{ specialista.prestazione.tipologia }}
                          </span>
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Info selezione -->
                <div v-if="selectedSpecialistiIDs.length > 0" class="selection-info mt-3">
                  <CAlert color="success" class="mb-0">
                    <CIcon icon="cil-check" class="me-2" />
                    <strong>{{ selectedSpecialistiIDs.length }}</strong>
                    specialist{{ selectedSpecialistiIDs.length === 1 ? 'a' : 'i' }} selezionat{{ selectedSpecialistiIDs.length === 1 ? 'o' : 'i' }}
                  </CAlert>
                </div>
              </div>
            </CCol>
          </CRow>

          <!-- Sezione validazione e invio -->
          <CRow class="mt-4">
            <CCol>
              <div class="send-section">
                <!-- Validazione form -->
                <div v-if="!isFormValid" class="mb-3">
                  <CAlert color="warning">
                    <CIcon icon="cil-warning" class="me-2" />
                    <strong>Completare il form:</strong>
                    <ul class="mb-0 mt-2">
                      <li v-if="!selectedDate">Selezionare una data</li>
                      <li v-if="selectedSpecialistiIDs.length === 0">Selezionare almeno uno specialista</li>
                    </ul>
                  </CAlert>
                </div>

                <!-- Pulsante invio -->
                <div class="text-center">
                  <CButton
                    color="primary"
                    size="lg"
                    @click="handleSendEmail"
                    :disabled="!canSendEmail"
                    class="send-email-btn"
                  >
                    <CSpinner v-if="emailLoading" size="sm" class="me-2" />
                    <CIcon v-else icon="cil-envelope-closed" class="me-2" />
                    {{ emailLoading ? 'Invio in corso...' : 'Invia Reminder' }}
                  </CButton>

                  <!-- Info invio -->
                  <div v-if="isFormValid && !emailLoading" class="send-info mt-2">
                    <small class="text-muted">
                      Verranno inviate {{ selectedSpecialistiIDs.length }} email per {{ formattedSelectedDate }}
                    </small>
                  </div>
                </div>
              </div>
            </CCol>
          </CRow>
        </div>
      </CCardBody>
    </CCard>

    <!-- Card statistiche veloci (se ci sono risultati precedenti) -->
    <CCard v-if="emailStats" class="mb-4">
      <CCardHeader>
        <h6 class="mb-0">
          <CIcon icon="cil-chart-pie" class="me-2" />
          Ultimo Invio
        </h6>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="3" class="text-center">
            <div class="stats-item">
              <div class="stats-number text-primary">{{ emailStats.total }}</div>
              <div class="stats-label">Totali</div>
            </div>
          </CCol>
          <CCol md="3" class="text-center">
            <div class="stats-item">
              <div class="stats-number text-success">{{ emailStats.success }}</div>
              <div class="stats-label">Inviate</div>
            </div>
          </CCol>
          <CCol md="3" class="text-center">
            <div class="stats-item">
              <div class="stats-number text-danger">{{ emailStats.failed }}</div>
              <div class="stats-label">Fallite</div>
            </div>
          </CCol>
          <CCol md="3" class="text-center">
            <div class="stats-item">
              <div class="stats-number text-info">{{ emailStats.successRate }}%</div>
              <div class="stats-label">Successo</div>
            </div>
          </CCol>
        </CRow>

        <div class="text-center mt-3">
          <CButton
            variant="outline"
            color="primary"
            size="sm"
            @click="openResultsModal"
          >
            <CIcon icon="cil-list" class="me-1" />
            Vedi Dettagli
          </CButton>
        </div>
      </CCardBody>
    </CCard>

    <!-- Modal risultati dettagliati -->
    <CModal
      :visible="showResultsModal"
      @close="closeResultsModal"
      size="lg"
      class="results-modal"
    >
      <CModalHeader>
        <CModalTitle class="d-flex align-items-center">
          <CIcon icon="cil-chart-line" class="me-2" />
          Risultati Invio Reminder
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div v-if="emailResults && emailStats">
          <!-- Riepilogo statistiche -->
          <div class="results-summary mb-4">
            <CRow>
              <CCol md="6">
                <CAlert :color="emailStats.successRate === 100 ? 'success' : emailStats.successRate > 50 ? 'warning' : 'danger'">
                  <h6 class="mb-2">
                    <CIcon icon="cil-check-circle" class="me-2" />
                    Riepilogo Invio
                  </h6>
                  <div><strong>Totale email:</strong> {{ emailStats.total }}</div>
                  <div><strong>Inviate con successo:</strong> {{ emailStats.success }}</div>
                  <div><strong>Fallite:</strong> {{ emailStats.failed }}</div>
                  <div><strong>Tasso di successo:</strong> {{ emailStats.successRate }}%</div>
                </CAlert>
              </CCol>
              <CCol md="6">
                <div class="results-chart">
                  <!-- Progress bar circolare -->
                  <div class="text-center">
                    <div class="progress-circle mb-2">
                      <CProgress
                        :value="emailStats.successRate"
                        :color="emailStats.successRate === 100 ? 'success' : emailStats.successRate > 50 ? 'warning' : 'danger'"
                        height="8"
                      />
                    </div>
                    <h4 :class="`text-${emailStats.successRate === 100 ? 'success' : emailStats.successRate > 50 ? 'warning' : 'danger'}`">
                      {{ emailStats.successRate }}%
                    </h4>
                    <small class="text-muted">Tasso di successo</small>
                  </div>
                </div>
              </CCol>
            </CRow>
          </div>

          <!-- Lista dettagliata risultati -->
          <div class="results-list">
            <h6>Dettaglio per destinatario:</h6>
            <div class="table-responsive">
              <CTable hover striped>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Destinatario</CTableHeaderCell>
                    <CTableHeaderCell>Stato</CTableHeaderCell>
                    <CTableHeaderCell>Timestamp</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow v-for="(result, index) in emailResults.data" :key="index">
                    <CTableDataCell>
                      {{ result.to }}
                      <div v-if="result.cc && result.cc.length > 0">
                        <small class="text-muted">CC: {{ result.cc.join(', ') }}</small>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge :color="result.success ? 'success' : 'danger'">
                        <CIcon :icon="result.success ? 'cil-check' : 'cil-x'" class="me-1" />
                        {{ result.success ? 'Inviata' : 'Fallita' }}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <small>{{ formatTimestamp(result.timestamp) }}</small>
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>
          </div>

          <!-- Email fallite (se ce ne sono) -->
          <div v-if="emailStats.failedEmails.length > 0" class="failed-emails mt-4">
            <CAlert color="danger">
              <h6>
                <CIcon icon="cil-warning" class="me-2" />
                Email fallite ({{ emailStats.failedEmails.length }})
              </h6>
              <ul class="mb-0">
                <li v-for="email in emailStats.failedEmails" :key="email">
                  {{ email }}
                </li>
              </ul>
            </CAlert>
          </div>
        </div>

        <div v-else class="text-center py-4">
          <CIcon icon="cil-inbox" size="3xl" class="text-muted mb-3" />
          <p class="text-muted">Nessun risultato disponibile</p>
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" @click="closeResultsModal">
          <CIcon icon="cil-x" class="me-2" />
          Chiudi
        </CButton>
        <CButton v-if="emailResults" color="primary" @click="resetFormAndClose">
          <CIcon icon="cil-reload" class="me-2" />
          Nuovo Invio
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>

<script setup>
/**
 * Pagina Specialisti Reminder
 *
 * Componente principale per la gestione dell'invio di reminder via email agli specialisti.
 * Utilizza il composable useEmail per tutta la logica di stato e business.
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { useEmail } from '@/composables/useEmail'

const {
  // Stato principale
  loading,
  error,
  notification,

  // Stato email
  emailLoading,
  emailResults,
  emailStats,

  // Stato selezione
  selectedDate,
  selectedSpecialistiIDs,
  availableSpecialisti,
  specialistiLoading,
  searchTerm,

  // Stato UI
  showResultsModal,

  // Computed
  isFormValid,
  selectedSpecialisti,
  filteredSpecialisti,
  formattedSelectedDate,
  canSendEmail,

  // Metodi principali
  loadSpecialisti,
  sendEmailReminder,

  // Gestione selezione
  toggleSpecialista,
  selectAllSpecialisti,
  clearSelection,
  isSelected,

  // Gestione data
  setSelectedDate,
  setToday,
  setTomorrow,

  // Gestione modali
  openResultsModal,
  closeResultsModal,

  // Gestione notifiche
  setNotification,
  clearNotification,

  // Utility
  resetForm,
  getSpecialistaFullName,
  formatDateForDisplay,
  getSelectedSpecialistiNames,
  validateForm,
  getFormValidationMessage,
  getTodayFormatted
} = useEmail()

// Stato locale per gestione notifiche con timer
const notificationTimer = ref(null)

// Metodi locali della pagina
const handleSendEmail = async () => {
  try {
    await sendEmailReminder()
    // Il composable gestisce già il feedback e l'apertura del modal risultati
  } catch (error) {
    console.error('Errore nell\'invio email:', error)
    // L'errore è già gestito dal composable con le notifiche
  }
}

const resetFormAndClose = () => {
  resetForm()
  closeResultsModal()
}

// Utility per formattazione timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '-'

  try {
    const date = new Date(timestamp)
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.warn('Errore nel formato timestamp:', error)
    return String(timestamp)
  }
}

// Gestione notifiche con auto-dismiss
const showNotificationWithAutoHide = (message, type, duration = 4000) => {
  // Cancella il timer precedente se esiste
  if (notificationTimer.value) {
    clearTimeout(notificationTimer.value)
  }

  // Imposta la notifica
  setNotification(message, type)

  // Auto-hide solo per notifiche di successo e warning
  if (type === 'success' || type === 'warning') {
    notificationTimer.value = setTimeout(() => {
      clearNotification()
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

// Lifecycle hooks
onMounted(() => {
  console.log('🚀 [SpecialistiReminderPage] Pagina Specialisti Reminder caricata')
})

onUnmounted(() => {
  // Cleanup timer per evitare memory leaks
  if (notificationTimer.value) {
    clearTimeout(notificationTimer.value)
  }
})
</script>

<style scoped>
/**
 * Stili specifici per la pagina Email
 */

.email-page {
  padding: 0;
}

.page-title {
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* Sezioni del form */
.form-section-title {
  color: #495057;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

/* Container selezione data */
.date-selection-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
}

.quick-date-buttons {
  margin-top: 0.5rem;
}

.selected-date-info {
  animation: fadeIn 0.3s ease-in-out;
}

/* Container specialisti */
.specialisti-controls {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e9ecef;
}

.specialisti-list-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background-color: #fff;
}

.specialisti-list {
  padding: 1rem;
}

.specialista-item {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem;
  border-bottom: 1px solid #e9ecef;
  transition: background-color 0.15s ease-in-out;
  cursor: pointer;
}

.specialista-item:last-child {
  border-bottom: none;
}

.specialista-item:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

.specialista-item.selected {
  background-color: rgba(0, 123, 255, 0.1);
  border-left: 3px solid #007bff;
}

.specialista-checkbox {
  flex-shrink: 0;
  margin-right: 0.75rem;
  margin-top: 0.25rem;
}

.specialista-info {
  flex: 1;
}

.specialista-name {
  font-weight: 600;
  color: #2c3e50;
}

.specialista-details {
  margin-top: 0.25rem;
}

/* Sezione invio */
.send-section {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  border: 1px solid #e9ecef;
}

.send-email-btn {
  min-width: 200px;
  padding: 0.75rem 2rem;
  font-weight: 600;
  border-radius: 25px;
  transition: all 0.3s ease-in-out;
}

.send-email-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

.send-info {
  animation: fadeIn 0.3s ease-in-out;
}

/* Statistiche */
.stats-item {
  padding: 1rem;
}

.stats-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stats-label {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6c757d;
  margin-top: 0.25rem;
}

/* Modal risultati */
.results-modal :deep(.modal-content) {
  border: none;
  border-radius: 12px;
  overflow: hidden;
}

.results-summary {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
}

.progress-circle {
  max-width: 120px;
  margin: 0 auto;
}

.results-list {
  background-color: #fff;
  border-radius: 8px;
  padding: 1rem;
}

/* Notifiche con animazioni */
.notification-alert {
  position: relative;
  z-index: 1000;  /* Ridotto da 1050 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 8px;
  margin-bottom: 1rem;  /* Assicuriamo che sia nel flusso normale */
}

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

/* Animazioni generali */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scrollbar personalizzata per lista specialisti */
.specialisti-list-container::-webkit-scrollbar {
  width: 6px;
}

.specialisti-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.specialisti-list-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.specialisti-list-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .form-section-title {
    font-size: 1rem;
  }

  .date-selection-container,
  .specialisti-controls,
  .send-section {
    padding: 1rem;
  }

  .specialisti-list-container {
    max-height: 300px;
  }

  .send-email-btn {
    min-width: auto;
    width: 100%;
    padding: 0.875rem 1.5rem;
  }

  .stats-number {
    font-size: 1.5rem;
  }
}

/* Stati hover migliorati */
.btn-outline-secondary:hover,
.btn-outline-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Badge migliorati */
.badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
}

/* Tabella risultati */
.table td {
  vertical-align: middle;
}

/* Card header personalizzati */
.card-header.bg-primary {
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%) !important;
}

/* Alert migliorati */
.alert {
  border: none;
  border-radius: 8px;
}

/* Form validation states */
.form-control.is-invalid {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

/* Loading states */
.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

/* Tema dark support */
[data-coreui-theme="dark"] .page-title {
  color: #eceff4;
}

[data-coreui-theme="dark"] .form-section-title {
  color: #d8dee9;
  border-bottom-color: #4c566a;
}

[data-coreui-theme="dark"] .date-selection-container,
[data-coreui-theme="dark"] .specialisti-controls,
[data-coreui-theme="dark"] .send-section {
  background-color: #3b4252;
  border-color: #4c566a;
}

[data-coreui-theme="dark"] .specialisti-list-container {
  background-color: #2e3440;
  border-color: #4c566a;
}

[data-coreui-theme="dark"] .specialista-item {
  border-bottom-color: #4c566a;
}

[data-coreui-theme="dark"] .specialista-name {
  color: #eceff4;
}

[data-coreui-theme="dark"] .specialista-item:hover {
  background-color: rgba(136, 192, 208, 0.1);
}
</style>
