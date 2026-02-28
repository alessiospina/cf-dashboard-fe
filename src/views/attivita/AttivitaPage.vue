<template>
  <!-- Pagina per la gestione delle attività -->
  <div class="attivita-page">
    <!-- Header della pagina -->
    <div class="page-header">
      <h1 class="page-title">Gestione Attività</h1>
      <p class="page-description">
        Visualizza e gestisci tutte le attività del centro
      </p>
    </div>

    <!-- Notifiche con transizioni -->
    <Transition
      name="notification"
      enter-active-class="notification-enter-active"
      leave-active-class="notification-leave-active"
      enter-from-class="notification-enter-from"
      leave-to-class="notification-leave-to"
    >
      <div v-if="notification" class="alert-container">
        <div
          :class="[
            'alert',
            'alert-dismissible',
            'fade',
            'show',
            `alert-${getAlertClass(notification.type)}`
          ]"
        >
          {{ notification.message }}
          <button
            type="button"
            class="btn-close"
            @click="clearNotification"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </Transition>

    <!-- Sezione filtri di ricerca -->
    <div class="filters-section">
      <div class="card">
        <div class="card-header">
          <h5 class="card-title mb-0">
            <i class="fas fa-filter me-2"></i>
            Filtri di Ricerca
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <!-- Campo di ricerca testuale -->
            <div class="col-md-6 col-lg-4 mb-3">
              <label for="searchTerm" class="form-label">Ricerca</label>
              <input
                id="searchTerm"
                v-model="searchTerm"
                type="text"
                class="form-control"
                placeholder="Cerca paziente, specialista..."
              >
            </div>

            <!-- Filtro per prestazione -->
            <div class="col-md-6 col-lg-4 mb-3">
              <label for="prestazione" class="form-label">Prestazione</label>
              <select
                id="prestazione"
                v-model="filtri.prestazioneId"
                class="form-select"
              >
                <option value="">Tutte le prestazioni</option>
                <option
                  v-for="prestazione in prestazioniOptions"
                  :key="prestazione.value"
                  :value="prestazione.value"
                >
                  {{ prestazione.label }}
                </option>
              </select>
            </div>

            <!-- Filtro per specialista -->
            <div class="col-md-6 col-lg-4 mb-3">
              <label for="specialista" class="form-label">Specialista</label>
              <select
                id="specialista"
                v-model="filtri.specialistaId"
                class="form-select"
              >
                <option value="">Tutti gli specialisti</option>
                <option
                  v-for="specialista in specialistiOptions"
                  :key="specialista.value"
                  :value="specialista.value"
                >
                  {{ specialista.label }}
                </option>
              </select>
            </div>

            <!-- Filtro data inizio -->
            <div class="col-md-6 col-lg-3 mb-3">
              <label for="dataInizio" class="form-label">Data Inizio</label>
              <input
                id="dataInizio"
                v-model="filtri.dataInizio"
                type="date"
                class="form-control"
              >
            </div>

            <!-- Filtro data fine -->
            <div class="col-md-6 col-lg-3 mb-3">
              <label for="dataFine" class="form-label">Data Fine</label>
              <input
                id="dataFine"
                v-model="filtri.dataFine"
                type="date"
                class="form-control"
              >
            </div>

            <!-- Pulsanti azioni -->
            <div class="col-lg-6 mb-3 d-flex align-items-end">
              <button
                type="button"
                class="btn btn-outline-secondary me-2"
                @click="resetFiltri"
              >
                <i class="fas fa-undo me-1"></i>
                Reset Filtri
              </button>
              <button
                type="button"
                class="btn btn-primary"
                @click="initializeData"
                :disabled="loading"
              >
                <i class="fas fa-sync-alt me-1" :class="{ 'fa-spin': loading }"></i>
                Aggiorna
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabella delle attività -->
    <div class="table-section">
      <AttivitaTable
        :attivita="paginatedAttivita"
        :loading="loading"
        :pagination-info="paginationInfo"
        @go-to-page="goToPage"
        @next-page="nextPage"
        @prev-page="prevPage"
        @change-items-per-page="changeItemsPerPage"
      />

      <!-- Controlli paginazione inferiori -->
      <AttivitaPagination
        :pagination-info="paginationInfo"
        @go-to-page="goToPage"
        @next-page="nextPage"
        @prev-page="prevPage"
        @change-items-per-page="changeItemsPerPage"
        class="bottom-pagination"
      />
    </div>

    <!-- Messaggio di errore -->
    <div v-if="error" class="error-section">
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
/**
 * Componente principale per la gestione delle attività del centro
 * Utilizza il composable useAttivita per la logica reattiva
 */
import { onMounted } from 'vue'
import { useAttivita } from '@/composables/useAttivita'
import AttivitaTable from './AttivitaTable.vue'
import AttivitaPagination from './AttivitaPagination.vue'

export default {
  name: 'AttivitaPage',

  // Componenti utilizzati
  components: {
    AttivitaTable,
    AttivitaPagination
  },

  // Setup del composable
  setup() {
    // Utilizziamo il composable per la gestione delle attività
    const {
      // Stati reattivi
      attivita,
      prestazioni,
      specialisti,
      loading,
      error,
      notification,
      searchTerm,
      filtri,
      currentPage,
      itemsPerPage,

      // Computed properties
      filteredAttivita,
      paginatedAttivita,
      paginationInfo,
      prestazioniOptions,
      specialistiOptions,
      statistiche,

      // Metodi
      initializeData,
      applicaFiltri,
      resetFiltri,
      showNotification,
      clearNotification,
      // Metodi paginazione
      goToPage,
      nextPage,
      prevPage,
      changeItemsPerPage
    } = useAttivita()

    // Inizializzazione dei dati al mount del componente
    onMounted(async () => {
      await initializeData()
    })

    // Metodo per mappare il tipo di notifica alla classe Bootstrap
    const getAlertClass = (type) => {
      const typeMap = {
        success: 'success',
        error: 'danger',
        warning: 'warning',
        info: 'info'
      }
      return typeMap[type] || 'info'
    }

    // Restituiamo tutto quello che serve al template
    return {
      // Stati
      attivita,
      prestazioni,
      specialisti,
      loading,
      error,
      notification,
      searchTerm,
      filtri,
      currentPage,
      itemsPerPage,

      // Computed
      filteredAttivita,
      paginatedAttivita,
      paginationInfo,
      prestazioniOptions,
      specialistiOptions,
      statistiche,

      // Metodi
      initializeData,
      applicaFiltri,
      resetFiltri,
      showNotification,
      clearNotification,
      getAlertClass,
      // Metodi paginazione
      goToPage,
      nextPage,
      prevPage,
      changeItemsPerPage
    }
  }
}
</script>

<style scoped>
/* Stili specifici per la pagina attività */

.attivita-page {
  /* Container principale della pagina */
  padding: 24px;
  min-height: 100vh;
  background-color: var(--cui-body-bg);
}

.page-header {
  /* Header della pagina con titolo e descrizione */
  margin-bottom: 32px;
  text-align: center;
}

.page-title {
  /* Titolo principale della pagina */
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--cui-body-color);
  margin-bottom: 8px;
}

.page-description {
  /* Descrizione sotto il titolo */
  font-size: 1.1rem;
  color: var(--cui-secondary-color);
  margin: 0;
}

.alert-container {
  /* Container per le notifiche */
  margin-bottom: 24px;
}

/* Transizioni per le notifiche */
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

.filters-section {
  /* Sezione dei filtri */
  margin-bottom: 32px;
}

.filters-section .card {
  /* Card dei filtri */
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background-color: var(--cui-card-bg);
}

.filters-section .card-header {
  /* Header della card filtri */
  background-color: var(--cui-secondary-bg);
  border-bottom: 1px solid var(--cui-border-color);
  border-radius: 12px 12px 0 0;
  padding: 16px 24px;
}

.filters-section .card-title {
  /* Titolo della sezione filtri */
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--cui-body-color);
}

.filters-section .card-body {
  /* Body della card filtri */
  padding: 24px;
  background-color: var(--cui-card-bg);
}

.form-label {
  /* Label dei form */
  font-weight: 500;
  color: var(--cui-body-color);
  margin-bottom: 8px;
}

.form-control,
.form-select {
  /* Campi input e select */
  border: 1px solid var(--cui-border-color);
  border-radius: 8px;
  padding: 10px 12px;
  background-color: var(--cui-input-bg, var(--cui-body-bg));
  color: var(--cui-body-color);
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus,
.form-select:focus {
  /* Focus sui campi */
  border-color: var(--cui-primary);
  box-shadow: 0 0 0 0.2rem rgba(var(--cui-primary-rgb), 0.25);
}

.btn {
  /* Stili base per i bottoni */
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:hover {
  /* Effetto hover sui bottoni */
  transform: translateY(-1px);
}

.table-section {
  /* Sezione della tabella */
  margin-bottom: 32px;
}

.bottom-pagination .pagination-container {
  /* Container paginazione inferiore */
  border-radius: 0 0 8px 8px;
  border-top: 1px solid var(--cui-border-color);
}

.error-section {
  /* Sezione per gli errori */
  margin-bottom: 24px;
}

/* Responsive design per dispositivi mobili */
@media (max-width: 768px) {
  .attivita-page {
    padding: 16px;
  }

  .page-title {
    font-size: 2rem;
  }

  .filters-section .card-body {
    padding: 20px;
  }
}

@media (max-width: 576px) {
  .filters-section .card-header,
  .filters-section .card-body {
    padding: 16px;
  }
}
</style>
