<template>
  <!--
    Pagina integrata per la gestione del Team (Prestazioni e Specialisti)

    Questa pagina include:
    - Tab per gestire Prestazioni e Specialisti
    - CRUD completo per entrambe le entità
    - Interfaccia unificata e coerente
    - Notifiche integrate
  -->
  <div class="gestione-team-page">
    <!-- Header della pagina -->
    <CRow class="mb-4">
      <CCol>
        <h2 class="page-title">
          <CIcon icon="cil-people" class="me-2" />
          Gestione Team
        </h2>
        <p class="text-muted">
          Gestisci prestazioni e specialisti del centro
        </p>
      </CCol>
    </CRow>

    <!-- Notifica unificata con animazioni -->
    <Transition
      name="notification"
      enter-active-class="notification-enter-active"
      leave-active-class="notification-leave-active"
      enter-from-class="notification-enter-from"
      leave-to-class="notification-leave-to"
    >
      <CAlert
        v-if="currentNotification"
        :color="currentNotification.type === 'error' ? 'danger' : currentNotification.type"
        dismissible
        @close="clearCurrentNotification"
        class="mb-4 notification-alert"
      >
        {{ currentNotification.message }}
      </CAlert>
    </Transition>

    <!-- Card principale con Tab -->
    <CCard>
      <!-- Header con Tab Navigation -->
      <CCardHeader>
        <CNav variant="tabs" role="tablist">
          <CNavItem>
            <CNavLink
              :active="activeTab === 'prestazioni'"
              @click="switchTab('prestazioni')"
              style="cursor: pointer"
            >
              <CIcon icon="cil-medical-cross" class="me-2" />
              Prestazioni
              <CBadge v-if="prestazioni.length > 0" color="primary" class="ms-2">
                {{ prestazioni.length }}
              </CBadge>
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink
              :active="activeTab === 'specialisti'"
              @click="switchTab('specialisti')"
              style="cursor: pointer"
            >
              <CIcon icon="cil-user" class="me-2" />
              Specialisti
              <CBadge v-if="specialisti.length > 0" color="info" class="ms-2">
                {{ specialisti.length }}
              </CBadge>
            </CNavLink>
          </CNavItem>
        </CNav>
      </CCardHeader>

      <!-- Tab Content -->
      <CCardBody>
        <!-- Tab Prestazioni -->
        <div v-show="activeTab === 'prestazioni'" class="tab-content-prestazioni">
          <PrestazioniTab
            :prestazioni="prestazioni"
            :loading="prestazioniLoading"
            :error="prestazioniError"
            @create="handleCreatePrestazione"
            @edit="handleEditPrestazione"
            @delete="handleDeletePrestazione"
            @refresh="refreshPrestazioni"
          />
        </div>

        <!-- Tab Specialisti -->
        <div v-show="activeTab === 'specialisti'" class="tab-content-specialisti">
          <SpecialistiTab
            :specialisti="specialisti"
            :prestazioni="prestazioni"
            :loading="specialistiLoading"
            :error="specialistiError"
            @create="handleCreateSpecialista"
            @edit="handleEditSpecialista"
            @delete="handleDeleteSpecialista"
            @refresh="refreshSpecialisti"
          />
        </div>
      </CCardBody>
    </CCard>

    <!-- Modali per Prestazioni -->
    <PrestazioneModal
      :visible="showPrestazioneModal"
      :prestazione="selectedPrestazione"
      @close="handlePrestazioneModalClose"
      @created="handlePrestazioneCreated"
      @updated="handlePrestazioneUpdated"
    />

    <!-- Modali per Specialisti -->
    <SpecialistaModal
      :visible="showSpecialistaModal"
      :specialista="selectedSpecialista"
      :prestazioni="prestazioni"
      @close="handleSpecialistaModalClose"
      @created="handleSpecialistaCreated"
      @updated="handleSpecialistaUpdated"
    />
  </div>
</template>

<script setup>
/**
 * Pagina Gestione Team
 *
 * Questa pagina orchestrea la gestione di prestazioni e specialisti.
 * Utilizza:
 * - Composables per la logica di entrambe le entità
 * - Componenti tab per l'organizzazione
 * - Notifiche unificate
 * - State management condiviso
 */

import { ref, computed, onMounted } from 'vue'
import { usePrestazioni } from '@/composables/usePrestazioni'
import { useSpecialisti } from '@/composables/useSpecialisti'

// Import componenti tab
import PrestazioniTab from './components/PrestazioniTab.vue'
import SpecialistiTab from './components/SpecialistiTab.vue'
import PrestazioneModal from './components/PrestazioneModal.vue'
import SpecialistaModal from './components/SpecialistaModal.vue'

// Gestione tab attivo
const activeTab = ref('prestazioni')

// Composables per la gestione dei dati
const {
  prestazioni,
  loading: prestazioniLoading,
  error: prestazioniError,
  notification: prestazioniNotification,
  selectedPrestazione,
  showCreateModal: showCreatePrestazioneModal,
  showEditModal: showEditPrestazioneModal,
  loadPrestazioni,
  createPrestazione,
  updatePrestazione,
  deletePrestazione,
  openCreateModal: openCreatePrestazioneModal,
  openEditModal: openEditPrestazioneModal,
  closeCreateModal: closeCreatePrestazioneModal,
  closeEditModal: closeEditPrestazioneModal,
  clearNotification: clearPrestazioniNotification
} = usePrestazioni()

const {
  specialisti,
  loading: specialistiLoading,
  error: specialistiError,
  notification: specialistiNotification,
  selectedSpecialista,
  showCreateModal: showCreateSpecialistaModal,
  showEditModal: showEditSpecialistaModal,
  loadSpecialisti,
  createSpecialista,
  updateSpecialista,
  deleteSpecialista,
  openCreateModal: openCreateSpecialistaModal,
  openEditModal: openEditSpecialistaModal,
  closeCreateModal: closeCreateSpecialistaModal,
  closeEditModal: closeEditSpecialistaModal,
  clearNotification: clearSpecialistiNotification
} = useSpecialisti()

// Gestione modali unificate
const showPrestazioneModal = computed(() =>
  showCreatePrestazioneModal.value || showEditPrestazioneModal.value
)

const showSpecialistaModal = computed(() =>
  showCreateSpecialistaModal.value || showEditSpecialistaModal.value
)

// Gestione notifiche unificate
const currentNotification = computed(() => {
  // Priorità: errori prima, poi messaggi di successo
  if (prestazioniNotification.value?.type === 'error') {
    return prestazioniNotification.value
  }
  if (specialistiNotification.value?.type === 'error') {
    return specialistiNotification.value
  }

  // Se non ci sono errori, mostra l'ultima notifica disponibile
  return prestazioniNotification.value || specialistiNotification.value
})

// Metodi per gestione tab
const switchTab = (tab) => {
  activeTab.value = tab
}

// Metodi per prestazioni
const handleCreatePrestazione = () => {
  openCreatePrestazioneModal()
}

const handleEditPrestazione = (prestazione) => {
  openEditPrestazioneModal(prestazione)
}

const handleDeletePrestazione = async (prestazione) => {
  if (confirm(`Sei sicuro di voler eliminare la prestazione "${prestazione.tipologia}"?`)) {
    try {
      await deletePrestazione(prestazione.id)

      // Ricarica gli specialisti per aggiornare le relazioni
      loadSpecialisti()
    } catch (error) {
      console.error('Errore eliminazione prestazione:', error)
    }
  }
}

const refreshPrestazioni = () => {
  loadPrestazioni()
}

const handlePrestazioneModalClose = () => {
  if (showCreatePrestazioneModal.value) {
    closeCreatePrestazioneModal()
  } else if (showEditPrestazioneModal.value) {
    closeEditPrestazioneModal()
  }
}

const handlePrestazioneCreated = async (newPrestazioneData) => {
  try {
    // Chiamiamo la funzione del composable per creare la prestazione
    const createdPrestazione = await createPrestazione(newPrestazioneData)
    console.log('Prestazione creata:', createdPrestazione)

    // Non è necessario ricaricare gli specialisti per la creazione
    // Le nuove prestazioni non hanno ancora specialisti associati

    // Chiudiamo la modale solo dopo il successo
    closeCreatePrestazioneModal()
  } catch (error) {
    console.error('Errore nella creazione prestazione:', error)
    // Il composable gestisce già la notifica di errore
    // Non chiudiamo la modale in caso di errore
  }
}

const handlePrestazioneUpdated = async (updatedPrestazioneData) => {
  try {
    // Chiamiamo la funzione del composable per aggiornare la prestazione
    const updatedPrestazione = await updatePrestazione(updatedPrestazioneData.id, updatedPrestazioneData)
    console.log('Prestazione aggiornata:', updatedPrestazione)

    // Ricarica gli specialisti per aggiornare le relazioni
    loadSpecialisti()

    // Chiudiamo la modale solo dopo il successo
    closeEditPrestazioneModal()
  } catch (error) {
    console.error('Errore nell\'aggiornamento prestazione:', error)
    // Il composable gestisce già la notifica di errore
    // Non chiudiamo la modale in caso di errore
  }
}

// Metodi per specialisti
const handleCreateSpecialista = () => {
  openCreateSpecialistaModal()
}

const handleEditSpecialista = (specialista) => {
  openEditSpecialistaModal(specialista)
}

const handleDeleteSpecialista = async (specialista) => {
  if (confirm(`Sei sicuro di voler eliminare lo specialista "${specialista.nome} ${specialista.cognome}"?`)) {
    try {
      await deleteSpecialista(specialista.id)
    } catch (error) {
      console.error('Errore eliminazione specialista:', error)
    }
  }
}

const refreshSpecialisti = () => {
  loadSpecialisti()
}

const handleSpecialistaModalClose = () => {
  if (showCreateSpecialistaModal.value) {
    closeCreateSpecialistaModal()
  } else if (showEditSpecialistaModal.value) {
    closeEditSpecialistaModal()
  }
}

const handleSpecialistaCreated = async (newSpecialistaData) => {
  try {
    // Chiamiamo la funzione del composable per creare lo specialista
    const createdSpecialista = await createSpecialista(newSpecialistaData)
    console.log('Specialista creato:', createdSpecialista)

    // Chiudiamo la modale solo dopo il successo
    closeCreateSpecialistaModal()
  } catch (error) {
    console.error('Errore nella creazione specialista:', error)
    // Il composable gestisce già la notifica di errore
    // Non chiudiamo la modale in caso di errore
  }
}

const handleSpecialistaUpdated = async (updatedSpecialistaData) => {
  console.log('🔄 [GestioneTeamPage] Inizio handleSpecialistaUpdated')
  console.log('📥 [GestioneTeamPage] Dati ricevuti dal modal:', updatedSpecialistaData)
  console.log('🆔 [GestioneTeamPage] ID specialista da aggiornare:', updatedSpecialistaData.id)

  try {
    console.log('🚀 [GestioneTeamPage] Chiamando updateSpecialista del composable...')

    // Chiamiamo la funzione del composable per aggiornare lo specialista
    const updatedSpecialista = await updateSpecialista(updatedSpecialistaData.id, updatedSpecialistaData)

    console.log('✅ [GestioneTeamPage] Specialista aggiornato dal composable:', updatedSpecialista)

    // Chiudiamo la modale solo dopo il successo
    console.log('🔒 [GestioneTeamPage] Chiudendo modal di edit...')
    closeEditSpecialistaModal()

    console.log('✅ [GestioneTeamPage] handleSpecialistaUpdated completato con successo')
  } catch (error) {
    console.error('❌ [GestioneTeamPage] Errore nell\'aggiornamento specialista:', error)
    console.error('📋 [GestioneTeamPage] Dettagli errore:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    // Il composable gestisce già la notifica di errore
    // Non chiudiamo la modale in caso di errore
  }
}

// Gestione notifiche unificate
const clearCurrentNotification = () => {
  clearPrestazioniNotification()
  clearSpecialistiNotification()
}

// Caricamento iniziale
onMounted(() => {
  console.log('Pagina Gestione Team caricata')
  // I composables si occupano del caricamento automatico
})
</script>

<style scoped>
/**
 * Stili specifici per la pagina Gestione Team
 */

.gestione-team-page {
  padding: 0;
}

.page-title {
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* Stili per le tab */
.nav-tabs {
  border-bottom: 2px solid #e9ecef;
}

.nav-tabs .nav-link {
  border: none;
  border-bottom: 3px solid transparent;
  color: #6c757d;
  font-weight: 500;
  padding: 1rem 1.5rem;
  transition: all 0.2s ease-in-out;
}

.nav-tabs .nav-link:hover {
  border-color: transparent;
  background-color: rgba(0, 123, 255, 0.1);
  color: #0056b3;
}

.nav-tabs .nav-link.active {
  color: #0056b3;
  background-color: transparent;
  border-bottom-color: #0056b3;
  font-weight: 600;
}

/* Contenuto tab */
.tab-content-prestazioni,
.tab-content-specialisti {
  min-height: 400px;
}

/* Badge nei tab */
.nav-tabs .badge {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
}

/* Notifiche con animazioni */
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

/* Card header personalizzato */
.card-header {
  background-color: #f8f9fa;
  border-bottom: none;
  padding: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .nav-tabs .nav-link {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }

  .nav-tabs .badge {
    font-size: 0.6rem;
    padding: 0.2rem 0.4rem;
  }
}

/* Supporto tema dark */
[data-coreui-theme="dark"] .nav-tabs {
  border-bottom-color: #4c566a;
}

[data-coreui-theme="dark"] .nav-tabs .nav-link {
  color: #81a1c1;
}

[data-coreui-theme="dark"] .nav-tabs .nav-link:hover {
  background-color: rgba(129, 161, 193, 0.1);
  color: #eceff4;
}

[data-coreui-theme="dark"] .nav-tabs .nav-link.active {
  color: #88c0d0;
  border-bottom-color: #88c0d0;
}

[data-coreui-theme="dark"] .card-header {
  background-color: #3b4252;
}

[data-coreui-theme="dark"] .page-title {
  color: #eceff4;
}
</style>
