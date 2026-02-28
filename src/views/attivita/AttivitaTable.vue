<template>
  <!-- Tabella per visualizzare le attività del centro -->
  <div class="attivita-table-container">
    <!-- Header della tabella con controlli integrati -->
    <div class="table-header">
      <div class="header-content">
        <!-- Sezione sinistra: Titolo e info -->
        <div class="header-left">
          <h5 class="table-title">
            Lista Attività
            <span class="badge bg-primary ms-2">{{ paginationInfo.totalItems }}</span>
          </h5>
          <small v-if="!loading && paginationInfo.totalItems > 0" class="text-muted">
            Visualizzati {{ paginationInfo.start }}-{{ paginationInfo.end }} di {{ paginationInfo.totalItems }} attività
          </small>
        </div>

        <!-- Sezione destra: Controlli paginazione -->
        <div class="header-right" v-if="!loading && paginationInfo.totalPages > 1">
          <!-- Controllo elementi per pagina -->
          <div class="items-per-page-control">
            <label for="itemsPerPageHeader" class="form-label">Righe:</label>
            <select
              id="itemsPerPageHeader"
              :value="paginationInfo.itemsPerPage"
              @change="$emit('change-items-per-page', parseInt($event.target.value))"
              class="form-select form-select-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <!-- Controlli navigazione -->
          <div class="navigation-controls">
            <div class="btn-group" role="group">
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm"
                @click="$emit('go-to-page', 1)"
                :disabled="!paginationInfo.hasPrev"
                title="Prima pagina"
              >
                <font-awesome-icon icon="angle-double-left" />
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm"
                @click="$emit('prev-page')"
                :disabled="!paginationInfo.hasPrev"
                title="Pagina precedente"
              >
                <font-awesome-icon icon="angle-left" />
              </button>

              <!-- Display pagina corrente -->
              <button
                type="button"
                class="btn btn-outline-primary btn-sm page-indicator"
                disabled
              >
                {{ paginationInfo.currentPage }}/{{ paginationInfo.totalPages }}
              </button>

              <button
                type="button"
                class="btn btn-outline-secondary btn-sm"
                @click="$emit('next-page')"
                :disabled="!paginationInfo.hasNext"
                title="Pagina successiva"
              >
                <font-awesome-icon icon="angle-right" />
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm"
                @click="$emit('go-to-page', paginationInfo.totalPages)"
                :disabled="!paginationInfo.hasNext"
                title="Ultima pagina"
              >
                <font-awesome-icon icon="angle-double-right" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabella responsive -->
    <div class="table-responsive">
      <table class="table table-hover table-striped">
        <thead class="table-dark">
          <tr>
            <!-- Colonne della tabella - Data come prima colonna -->
            <th scope="col">Data</th>
            <th scope="col">Paziente</th>
            <th scope="col">Specialista</th>
            <th scope="col">Prestazione</th>
            <th scope="col">Stanza</th>
          </tr>
        </thead>
        <tbody>
          <!-- Riga per ogni attività -->
          <tr v-for="attivita in attivita" :key="attivita.id" class="table-row">
            <!-- Colonna Data - Prima colonna -->
            <td class="date-cell">
              <div class="date-info">
                <div class="date-display">
                  {{ formatDate(attivita.evento.dataInizio || attivita.evento.date) }}
                </div>
              </div>
            </td>

            <!-- Colonna Paziente con telefono -->
            <td class="patient-cell">
              <div v-if="attivita.paziente" class="patient-info">
                <div class="patient-name">{{ attivita.paziente.nomeCompleto }}</div>
                <small class="text-muted d-block">{{ attivita.paziente.codiceFiscale }}</small>
                <small v-if="attivita.paziente.telefono" class="text-primary d-block">
                  <i class="fas fa-phone me-1"></i>{{ attivita.paziente.telefono }}
                </small>
              </div>
              <span v-else class="text-muted">-</span>
            </td>

            <!-- Colonna Specialista -->
            <td class="specialist-cell">
              <div v-if="attivita.specialista" class="specialist-info">
                <div class="specialist-name">{{ attivita.specialista.nomeCompleto }}</div>
                <small class="text-muted">{{ attivita.specialista.email }}</small>
              </div>
              <span v-else class="text-muted">-</span>
            </td>

            <!-- Colonna Prestazione -->
            <td class="service-cell">
              <div v-if="attivita.prestazione" class="service-info">
                <span
                  class="badge service-badge"
                  :style="{ backgroundColor: attivita.prestazione.color }"
                >
                  {{ attivita.prestazione.tipologia }}
                </span>
              </div>
              <span v-else class="text-muted">-</span>
            </td>

            <!-- Colonna Stanza -->
            <td class="room-cell">
              <div class="room-info">
                <span class="badge bg-secondary">{{ attivita.evento.stanza }}</span>
              </div>
            </td>
          </tr>

          <!-- Messaggio quando non ci sono attività -->
          <tr v-if="attivita.length === 0">
            <td colspan="5" class="text-center text-muted py-4">
              <i class="fas fa-calendar-times me-2"></i>
              Nessuna attività trovata
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Messaggio di caricamento -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Caricamento...</span>
      </div>
      <p class="mt-2 text-muted">Caricamento attività...</p>
    </div>

    <!-- Debug info per capire il problema della data -->
    <div v-if="attivita.length > 0 && showDebug" class="debug-info mt-3">
      <details class="border p-2 rounded">
        <summary class="text-muted small">Debug prima attività</summary>
        <pre class="small mt-2">{{ JSON.stringify(attivita[0], null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<script>
/**
 * Componente per visualizzare la tabella delle attività
 * Riceve le attività come props e le visualizza in formato tabellare
 * Data come prima colonna, con telefono paziente incluso
 */
export default {
  name: 'AttivitaTable',

  // Props ricevute dal componente parent
  props: {
    // Array delle attività da visualizzare
    attivita: {
      type: Array,
      required: true,
      default: () => []
    },
    // Stato di caricamento
    loading: {
      type: Boolean,
      default: false
    },
    // Informazioni paginazione
    paginationInfo: {
      type: Object,
      required: true,
      default: () => ({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
        start: 0,
        end: 0,
        hasNext: false,
        hasPrev: false
      })
    }
  },

  // Eventi emessi verso il parent
  emits: [
    'go-to-page',
    'next-page',
    'prev-page',
    'change-items-per-page'
  ],

  // Metodi del componente
  methods: {
    /**
     * Formatta una data per la visualizzazione (solo giorno/mese/anno)
     * @param {string|Date} data - Data da formattare
     * @returns {string} - Data formattata
     */
    formatDate(data) {
      if (!data) return '-'

      try {
        const date = new Date(data)

        // Verifica che la data sia valida
        if (isNaN(date.getTime())) {
          console.warn('Data non valida:', data)
          return '-'
        }

        return date.toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      } catch (err) {
        console.error('Errore formato data:', err, 'Data ricevuta:', data)
        return '-'
      }
    }
  },

  // Hook per debug - mostra il formato dei dati ricevuti
  mounted() {
    if (this.attivita.length > 0) {
      console.log('AttivitaTable - Prima attività ricevuta:', this.attivita[0])
      console.log('AttivitaTable - Struttura evento:', this.attivita[0].evento)
      console.log('AttivitaTable - dataInizio:', this.attivita[0].evento?.dataInizio)
      console.log('AttivitaTable - date:', this.attivita[0].evento?.date)
      console.log('AttivitaTable - Tutte le proprietà evento:', Object.keys(this.attivita[0].evento || {}))
    }
  }
}
</script>

<style scoped>
/* Stili specifici per la tabella delle attività */

.attivita-table-container {
  /* Container principale della tabella */
  background: var(--cui-card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  /* Header della tabella con controlli integrati */
  padding: 20px 24px;
  border-bottom: 1px solid var(--cui-border-color);
  background-color: var(--cui-secondary-bg);
}

.header-content {
  /* Container flessibile per header */
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.header-left {
  /* Sezione sinistra con titolo e info */
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-title {
  /* Titolo della tabella */
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--cui-body-color);
  display: flex;
  align-items: center;
}

.header-right {
  /* Sezione destra con controlli */
  display: flex;
  align-items: center;
  gap: 16px;
}

.items-per-page-control {
  /* Controllo elementi per pagina */
  display: flex;
  align-items: center;
  gap: 8px;
}

.items-per-page-control .form-label {
  /* Label per il controllo */
  margin: 0;
  font-size: 0.875rem;
  color: #6c757d;
  white-space: nowrap;
}

.items-per-page-control .form-select {
  /* Select per elementi per pagina */
  width: auto;
  min-width: 70px;
  font-size: 0.875rem;
}

.navigation-controls {
  /* Controlli di navigazione */
  display: flex;
  align-items: center;
}

.navigation-controls .btn {
  /* Pulsanti navigazione */
  font-size: 0.875rem;
  padding: 6px 10px;
  border-radius: 4px;
}

.navigation-controls .page-indicator {
  /* Indicatore pagina corrente */
  min-width: 70px;
  font-weight: 600;
  cursor: default;
}

.navigation-controls .btn:disabled {
  /* Pulsanti disabilitati */
  opacity: 0.4;
}

.navigation-controls svg {
  /* Icone FontAwesome */
  width: 0.875rem;
  height: 0.875rem;
}

.table-responsive {
  /* Container responsive per la tabella */
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid var(--cui-border-color);
  border-radius: 8px;
}

.table {
  /* Stili base della tabella */
  margin: 0;
  font-size: 0.9rem;
}

.table thead th {
  /* Header delle colonne */
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #495057;
  padding: 12px 16px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.table tbody td {
  /* Celle della tabella */
  padding: 16px;
  vertical-align: middle;
  border-bottom: 1px solid var(--cui-border-color);
  color: var(--cui-body-color);
  background-color: var(--cui-card-bg);
}

.table-row:hover td {
  /* Effetto hover sulle righe */
  background-color: var(--cui-tertiary-bg) !important;
  cursor: default;
}

/* Stili specifici per le celle */

.date-cell {
  /* Colonna data - prima colonna */
  min-width: 120px;
}

.date-display {
  /* Data principale */
  font-weight: 600;
  color: var(--cui-body-color);
  font-size: 0.9rem;
}

.patient-cell .patient-info {
  /* Informazioni paziente */
  line-height: 1.4;
}

.patient-name {
  /* Nome paziente */
  font-weight: 600;
  color: var(--cui-body-color);
  margin-bottom: 4px;
}

.patient-cell .text-primary {
  /* Telefono paziente */
  font-size: 0.8rem;
  margin-top: 2px;
}

.patient-cell .text-primary i {
  /* Icona telefono */
  font-size: 0.75rem;
}

.specialist-cell .specialist-info {
  /* Informazioni specialista */
  line-height: 1.4;
}

.specialist-name {
  /* Nome specialista */
  font-weight: 600;
  color: var(--cui-body-color);
  margin-bottom: 2px;
}

.service-cell .service-badge {
  /* Badge per la prestazione */
  font-size: 0.75rem;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 6px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.room-cell .room-info .badge {
  /* Badge per la stanza */
  font-size: 0.75rem;
  padding: 6px 10px;
  border-radius: 6px;
}

/* Responsive design per dispositivi mobili */
@media (max-width: 768px) {
  .table-header {
    padding: 16px 20px;
  }

  .table thead th,
  .table tbody td {
    padding: 12px 8px;
    font-size: 0.8rem;
  }

  .table-title {
    font-size: 1.1rem;
  }

  /* Su mobile nascondiamo il telefono del paziente per risparmiare spazio */
  .patient-cell .text-primary {
    display: none;
  }

  /* Su mobile nascondiamo la colonna stanza */
  .table th:nth-child(5),
  .table td:nth-child(5) {
    display: none;
  }
}

@media (max-width: 576px) {
  /* Su schermi molto piccoli nascondiamo anche l'email dello specialista */
  .specialist-cell small {
    display: none;
  }

  .patient-cell small {
    font-size: 0.75rem;
  }

  .header-content {
    gap: 12px;
  }

  .header-right {
    gap: 8px;
  }

  .navigation-controls .btn {
    padding: 3px 6px;
  }

  .items-per-page-control .form-label {
    font-size: 0.75rem;
  }
}
</style>
