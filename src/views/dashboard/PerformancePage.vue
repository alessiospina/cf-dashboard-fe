<template>
  <div>
    <!-- Header della pagina -->
    <CRow class="mb-4">
      <CCol>
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h1 class="h3 mb-1">Dashboard Performance</h1>
            <p class="text-muted">Analisi dei guadagni e statistiche del centro</p>
          </div>

          <!-- Selector Anno -->
          <div class="d-flex align-items-center gap-3">
            <CFormLabel for="anno-selector" class="mb-0 text-muted">Anno:</CFormLabel>
            <CFormSelect
              id="anno-selector"
              :value="annoSelezionato"
              @change="cambiaAnno(parseInt($event.target.value))"
              style="width: 120px"
              :disabled="isLoading"
            >
              <option
                v-for="opzione in opzioniAnno"
                :key="opzione.value"
                :value="opzione.value"
              >
                {{ opzione.label }}
              </option>
            </CFormSelect>

            <!-- Bottone ricarica -->
            <CButton
              color="primary"
              variant="outline"
              size="sm"
              @click="ricaricaDati"
              :disabled="isLoading"
            >
              <CIcon :icon="cilReload" class="me-1" />
              Aggiorna
            </CButton>
          </div>
        </div>
      </CCol>
    </CRow>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <CSpinner color="primary" size="lg" />
      <p class="text-muted mt-3">Caricamento dati performance...</p>
    </div>

    <!-- Error State -->
    <CAlert
      v-else-if="error"
      color="danger"
      :visible="true"
      dismissible
      @close="error = null"
    >
      <strong>Errore!</strong> {{ error }}
    </CAlert>

    <!-- Content principale -->
    <div v-else-if="metricsCards">
      <!-- Cards Metrics -->
      <CRow class="mb-4">
        <CCol
          v-for="(card, key) in metricsCards"
          :key="key"
          cols="12"
          sm="6"
          lg="3"
          class="mb-3"
        >
          <CCard class="h-100">
            <CCardBody class="d-flex align-items-center">
              <div class="flex-grow-1">
                <div class="fs-6 fw-semibold text-primary">
                  {{ card.valore }}
                </div>
                <div class="text-muted text-uppercase fw-semibold small">
                  {{ card.label }}
                </div>
              </div>
              <div class="ms-3">
                <CIcon
                  :icon="getIcon(card.icona)"
                  size="xl"
                  :class="`text-${card.colore}`"
                />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <!-- Grafici -->
      <CRow>
        <!-- Grafico Guadagni per Mese -->
        <CCol cols="12" lg="6" class="mb-4">
          <CCard class="h-100">
            <CCardHeader>
              <h5 class="mb-0">Andamento Mensile</h5>
            </CCardHeader>
            <CCardBody class="p-0">
              <div class="chart-wrapper">
                <CChartLine
                  v-if="datiGraficoMesi"
                  :data="datiGraficoMesi"
                  :options="opzioniGraficoLinea"
                  style="height: 300px; width: 100%;"
                />
                <div v-else class="d-flex align-items-center justify-content-center" style="height: 300px;">
                  <span class="text-muted">Nessun dato disponibile</span>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <!-- Grafico Guadagni per Specialista -->
        <CCol cols="12" lg="6" class="mb-4">
          <CCard class="h-100">
            <CCardHeader>
              <h5 class="mb-0">Top Specialisti</h5>
            </CCardHeader>
            <CCardBody class="p-0">
              <div class="chart-wrapper">
                <CChartBar
                  v-if="datiGraficoSpecialisti"
                  :data="datiGraficoSpecialisti"
                  :options="opzioniGraficoBarre"
                  style="height: 300px; width: 100%;"
                />
                <div v-else class="d-flex align-items-center justify-content-center" style="height: 300px;">
                  <span class="text-muted">Nessun dato disponibile</span>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <!-- Statistiche Aggiuntive -->
      <CRow>
        <CCol cols="12">
          <CCard>
            <CCardHeader>
              <h5 class="mb-0">Riepilogo {{ annoSelezionato }}</h5>
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol cols="12" md="4" class="mb-3">
                  <div class="border-start border-primary border-3 ps-3">
                    <div class="text-muted small">Mese più produttivo</div>
                    <div class="fw-semibold">{{ mesePiuProduttivo }}</div>
                  </div>
                </CCol>
                <CCol cols="12" md="4" class="mb-3">
                  <div class="border-start border-success border-3 ps-3">
                    <div class="text-muted small">Specialista top performer</div>
                    <div class="fw-semibold">{{ specialistaTop }}</div>
                  </div>
                </CCol>
                <CCol cols="12" md="4" class="mb-3">
                  <div class="border-start border-warning border-3 ps-3">
                    <div class="text-muted small">Guadagno medio mensile</div>
                    <div class="fw-semibold">{{ guadagnoMedioMensile }}</div>
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-5">
      <CIcon :icon="cilChart" size="3xl" class="text-muted mb-3" />
      <h4 class="text-muted">Nessun dato disponibile</h4>
      <p class="text-muted">Non ci sono dati performance per l'anno selezionato.</p>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import {
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CFormSelect,
  CFormLabel,
  CSpinner,
  CAlert
} from '@coreui/vue'
import { CIcon } from '@coreui/icons-vue'
import { CChartLine, CChartBar } from '@coreui/vue-chartjs'
import {
  cilPeople,
  cilCalendar,
  cilEuro,
  cilChart,
  cilReload
} from '@coreui/icons'
import { usePerformance } from '@/composables/usePerformance.js'
import { PerformanceService } from '@/services/performanceService.js'

export default {
  name: 'PerformancePage',
  components: {
    CRow,
    CCol,
    CCard,
    CCardHeader,
    CCardBody,
    CButton,
    CFormSelect,
    CFormLabel,
    CSpinner,
    CAlert,
    CIcon,
    CChartLine,
    CChartBar
  },
  setup() {
    // === COMPOSABLES ===
    const {
      // Stato
      annoSelezionato,
      isLoading,
      error,

      // Computed
      opzioniAnno,
      metricsCards,
      datiGraficoMesi,
      datiGraficoSpecialisti,
      opzioniGraficoLinea,
      opzioniGraficoBarre,
      datiPerformance,

      // Metodi
      cambiaAnno,
      ricaricaDati
    } = usePerformance()

    // === COMPUTED AGGIUNTIVI ===

    /**
     * Calcola il mese più produttivo
     */
    const mesePiuProduttivo = computed(() => {
      if (!datiPerformance.value?.guadagniPerMese) return 'N/A'

      const mesiConGuadagni = datiPerformance.value.guadagniPerMese
        .filter(mese => mese.guadagno > 0)

      if (mesiConGuadagni.length === 0) return 'N/A'

      const meseTop = mesiConGuadagni.reduce((max, mese) =>
        mese.guadagno > max.guadagno ? mese : max
      )

      return `${meseTop.mese} (${PerformanceService.formatEuro(meseTop.guadagno)})`
    })

    /**
     * Restituisce lo specialista con maggiori guadagni
     */
    const specialistaTop = computed(() => {
      if (!datiPerformance.value?.guadagniPerSpecialista?.length) return 'N/A'

      const topSpecialista = datiPerformance.value.guadagniPerSpecialista[0]
      return `${topSpecialista.specialista} (${PerformanceService.formatEuro(topSpecialista.guadagno)})`
    })

    /**
     * Calcola il guadagno medio mensile
     */
    const guadagnoMedioMensile = computed(() => {
      if (!datiPerformance.value?.guadagniPerMese) return 'N/A'

      const mesiConGuadagni = datiPerformance.value.guadagniPerMese
        .filter(mese => mese.guadagno > 0)

      if (mesiConGuadagni.length === 0) return 'N/A'

      const totaleMesi = mesiConGuadagni.reduce((sum, mese) => sum + mese.guadagno, 0)
      const media = totaleMesi / mesiConGuadagni.length

      return PerformanceService.formatEuro(media)
    })

    // === UTILITY METHODS ===

    /**
     * Ottiene l'icona corretta dal nome
     * @param {string} iconName - Nome dell'icona
     * @returns {object} Icona CoreUI
     */
    const getIcon = (iconName) => {
      const iconMap = {
        'cil-people': cilPeople,
        'cil-calendar': cilCalendar,
        'cil-euro': cilEuro,
        'cil-chart': cilChart
      }
      return iconMap[iconName] || cilChart
    }

    // === RETURN ===
    return {
      // Stato e computed dal composable
      annoSelezionato,
      isLoading,
      error,
      opzioniAnno,
      metricsCards,
      datiGraficoMesi,
      datiGraficoSpecialisti,
      opzioniGraficoLinea,
      opzioniGraficoBarre,
      datiPerformance,

      // Computed locali
      mesePiuProduttivo,
      specialistaTop,
      guadagnoMedioMensile,

      // Metodi dal composable
      cambiaAnno,
      ricaricaDati,

      // Utility methods
      getIcon,

      // Icone
      cilChart,
      cilReload
    }
  }
}
</script>

<style scoped>
/* Stili specifici per la pagina performance */
.chart-wrapper {
  position: relative;
  height: 300px;
  width: 100%;
  padding: 1rem;
}

/* Forza il canvas a occupare tutto lo spazio disponibile */
.chart-wrapper canvas {
  height: 100% !important;
  width: 100% !important;
  max-height: none !important;
  max-width: none !important;
}

/* Fix per i tooltip Chart.js - evita che diventino troppo grandi */
:deep(.chartjs-tooltip) {
  max-width: 200px !important;
  font-size: 11px !important;
  padding: 8px !important;
}

/* Stili per CoreUI Chart components */
:deep(.chart-wrapper > div) {
  height: 100% !important;
  width: 100% !important;
}

:deep(.chart-wrapper .chartjs-render-monitor) {
  height: 100% !important;
  width: 100% !important;
}

.border-start {
  border-left-width: 3px !important;
}

/* Hover effects per le cards */
.card:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease-in-out;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .chart-wrapper {
    height: 250px;
    padding: 0.5rem;
  }

  .chart-wrapper canvas {
    height: 100% !important;
    width: 100% !important;
  }

  .d-flex.justify-content-between {
    flex-direction: column;
    gap: 1rem;
  }

  .d-flex.align-items-center.gap-3 {
    justify-content: start;
  }
}

/* Stili per il selector anno */
#anno-selector {
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

#anno-selector:focus {
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

/* Animazioni per il loading */
.spinner-border-lg {
  width: 3rem;
  height: 3rem;
}

/* Stili per le statistiche aggiuntive */
.border-primary {
  border-color: var(--cui-primary) !important;
}

.border-success {
  border-color: var(--cui-success) !important;
}

.border-warning {
  border-color: var(--cui-warning) !important;
}

/* Fix per i card body dei grafici */
.card-body.p-0 {
  padding: 0 !important;
}

/* Miglioramento padding cards metriche */
.card .card-body:not(.p-0) {
  padding: 1.5rem;
}
</style>
