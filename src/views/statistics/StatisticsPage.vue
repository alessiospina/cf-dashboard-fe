<template>
  <div class="statistics-container">
    <!-- Header con selettore anno -->
    <div class="statistics-header">
      <h1 class="page-title">
        <font-awesome-icon :icon="['fas', 'chart-pie']" class="title-icon me-2" />
        Dashboard
      </h1>
      <div class="year-selector">
        <label for="year-select">Anno:</label>
        <select
          id="year-select"
          v-model="selectedYear"
          :disabled="loading"
          class="year-dropdown"
        >
          <option
            v-for="option in yearOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Caricamento statistiche...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="refreshData" class="retry-button">
        <font-awesome-icon :icon="['fas', 'sync-alt']" class="me-2" />
        Riprova
      </button>
    </div>

    <!-- Content -->
    <div v-else class="statistics-content">
      <!-- Dashboard Cards -->
      <div class="dashboard-cards">
        <div class="stat-card">
          <div class="stat-icon">
            <font-awesome-icon :icon="['fas', 'calendar-alt']" />
          </div>
          <div class="stat-content">
            <h3>{{ formatNumber(annualSummary.totalEvents) }}</h3>
            <p>Eventi Totali</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <font-awesome-icon :icon="['fas', 'euro-sign']" />
          </div>
          <div class="stat-content">
            <h3>{{ formatCurrency(annualSummary.totalRevenue) }}</h3>
            <p>Fatturato Totale</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <font-awesome-icon :icon="['fas', 'bullseye']" />
          </div>
          <div class="stat-content">
            <h3>{{ formatNumber(annualSummary.totalPrestazioni) }}</h3>
            <p>Prestazioni Diverse</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <font-awesome-icon :icon="['fas', 'chart-line']" />
          </div>
          <div class="stat-content">
            <h3>{{ formatCurrency(annualSummary.averageEventValue) }}</h3>
            <p>Valore Medio Evento</p>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-container">
          <h2>
            <font-awesome-icon :icon="['fas', 'chart-pie']" class="me-2" />
            Distribuzione per Prestazione
          </h2>
          <div class="chart-wrapper">
            <canvas ref="pieChartCanvas" class="chart-canvas"></canvas>
          </div>
        </div>

        <div class="chart-container">
          <h2>
            <font-awesome-icon :icon="['fas', 'chart-bar']" class="me-2" />
            Andamento Mensile
          </h2>
          <div class="chart-wrapper">
            <canvas ref="barChartCanvas" class="chart-canvas"></canvas>
          </div>
        </div>
      </div>

      <!-- Tables Section -->
      <div class="tables-section">
        <!-- Annual Table -->
        <div class="table-container">
          <h2>
            <font-awesome-icon :icon="['fas', 'table']" class="me-2" />
            Statistiche Annuali per Prestazione
          </h2>
          <div class="table-responsive">
            <table class="statistics-table">
              <thead>
                <tr>
                  <th>Prestazione</th>
                  <th>N° Eventi</th>
                  <th>Fatturato</th>
                  <th>Valore Medio</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in annualData" :key="item.prestazione">
                  <td>
                    <div class="prestazione-cell">
                      <span
                        class="prestazione-color"
                        :style="{ backgroundColor: item.color }"
                      ></span>
                      {{ item.prestazione }}
                    </div>
                  </td>
                  <td>{{ formatNumber(item.count) }}</td>
                  <td>{{ formatCurrency(item.total) }}</td>
                  <td>{{ formatCurrency(item.total / item.count) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Monthly Table -->
        <div class="table-container">
          <h2>
            <font-awesome-icon :icon="['fas', 'calendar-check']" class="me-2" />
            Statistiche Mensili
          </h2>
          <div class="monthly-accordion">
            <div
              v-for="month in monthlyData"
              :key="month.month"
              class="month-item"
            >
              <div
                class="month-header"
                @click="toggleMonth(month.month)"
                :class="{ active: expandedMonths.includes(month.month) }"
              >
                <span class="month-name">{{ month.monthName }}</span>
                <div class="month-stats">
                  <span class="month-events">{{ formatNumber(month.totalEvents) }} eventi</span>
                  <span class="month-revenue">{{ formatCurrency(month.totalRevenue) }}</span>
                </div>
                <span class="expand-icon">
                  <font-awesome-icon :icon="['fas', expandedMonths.includes(month.month) ? 'chevron-down' : 'chevron-right']" />
                </span>
              </div>

              <div
                v-show="expandedMonths.includes(month.month)"
                class="month-content"
              >
                <div v-if="month.prestazioni.length === 0" class="no-data">
                  <font-awesome-icon :icon="['fas', 'info-circle']" class="me-2" />
                  Nessun evento per questo mese
                </div>
                <div v-else class="prestazioni-grid">
                  <div
                    v-for="prestazione in month.prestazioni"
                    :key="prestazione.prestazione"
                    class="prestazione-item"
                  >
                    <div class="prestazione-header">
                      <span
                        class="prestazione-color"
                        :style="{ backgroundColor: prestazione.color }"
                      ></span>
                      <span class="prestazione-name">{{ prestazione.prestazione }}</span>
                    </div>
                    <div class="prestazione-stats">
                      <span class="stat">{{ formatNumber(prestazione.count) }} eventi</span>
                      <span class="stat">{{ formatCurrency(prestazione.total) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useStatistics } from '@/composables/useStatistics';
import Chart from 'chart.js/auto';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Composable per la gestione delle statistiche
const {
  selectedYear,
  loading,
  error,
  yearOptions,
  annualData,
  monthlyData,
  annualSummary,
  getChartData,
  refreshData,
  formatCurrency,
  formatNumber
} = useStatistics();

// Refs per i canvas dei grafici
const pieChartCanvas = ref(null);
const barChartCanvas = ref(null);

// Istanze dei grafici
let pieChart = null;
let barChart = null;

// Stato per l'accordion dei mesi
const expandedMonths = ref([]);

/**
 * Funzione per toggle mesi nell'accordion
 * @param {number} monthNumber - Numero del mese da espandere/comprimere
 */
const toggleMonth = (monthNumber) => {
  const index = expandedMonths.value.indexOf(monthNumber);
  if (index > -1) {
    expandedMonths.value.splice(index, 1);
  } else {
    expandedMonths.value.push(monthNumber);
  }
};

/**
 * Funzione per creare il grafico a torta
 * Mostra la distribuzione delle prestazioni per fatturato
 */
const createPieChart = () => {
  if (!pieChartCanvas.value) return;

  const ctx = pieChartCanvas.value.getContext('2d');
  const chartData = getChartData.value.pieChart;

  // Distruggi il grafico precedente se esiste
  if (pieChart) {
    pieChart.destroy();
  }

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = formatCurrency(context.parsed);
              return `${label}: ${value}`;
            }
          }
        }
      }
    }
  });
};

/**
 * Funzione per creare il grafico a barre
 * Mostra l'andamento mensile del fatturato
 */
const createBarChart = () => {
  if (!barChartCanvas.value) return;

  const ctx = barChartCanvas.value.getContext('2d');
  const chartData = getChartData.value.barChart;

  // Distruggi il grafico precedente se esiste
  if (barChart) {
    barChart.destroy();
  }

  barChart = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
};

/**
 * Funzione per aggiornare i grafici
 * Viene chiamata quando cambiano i dati
 */
const updateCharts = async () => {
  await nextTick();
  if (annualData.value.length > 0) {
    createPieChart();
    createBarChart();
  }
};

// Watcher per aggiornare i grafici quando cambiano i dati
watch([annualData, monthlyData], updateCharts, { deep: true });

// Inizializzazione dei grafici al mount del componente
onMounted(async () => {
  await nextTick();
  updateCharts();
});
</script>

<style scoped>
/* ===== CONTAINER PRINCIPALE ===== */
.statistics-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background: var(--cui-body-bg);
  min-height: 100vh;
  color: var(--cui-body-color);
}

/* ===== HEADER ===== */
.statistics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: var(--cui-card-bg);
  border-radius: var(--cui-border-radius-lg);
  box-shadow: var(--cui-box-shadow);
  border: var(--cui-border-width) solid var(--cui-border-color);
}

.page-title {
  font-size: 2rem;
  color: var(--cui-heading-color);
  margin: 0;
  font-weight: 700;
  display: flex;
  align-items: center;
}

.title-icon {
  opacity: 0.7;
  font-size: 1.5rem;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.year-selector label {
  font-weight: 600;
  color: var(--cui-body-color);
  font-size: 1rem;
}

.year-dropdown {
  padding: 8px 16px;
  border: var(--cui-border-width) solid var(--cui-border-color);
  border-radius: var(--cui-border-radius);
  background: var(--cui-input-bg);
  color: var(--cui-input-color);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.year-dropdown:hover {
  border-color: var(--cui-primary);
}

.year-dropdown:focus {
  outline: none;
  border-color: var(--cui-primary);
  box-shadow: 0 0 0 var(--cui-focus-ring-width) var(--cui-focus-ring-color);
}

.year-dropdown:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== STATI DI LOADING E ERRORE ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: var(--cui-card-bg);
  border-radius: var(--cui-border-radius-lg);
  box-shadow: var(--cui-box-shadow);
  border: var(--cui-border-width) solid var(--cui-border-color);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--cui-border-color);
  border-top: 4px solid var(--cui-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: var(--cui-card-bg);
  border-radius: var(--cui-border-radius-lg);
  box-shadow: var(--cui-box-shadow);
  border: var(--cui-border-width) solid var(--cui-border-color);
  color: var(--cui-danger);
}

.retry-button {
  margin-top: 20px;
  padding: 8px 16px;
  background: transparent;
  color: var(--cui-text-muted);
  border: 1px solid var(--cui-border-color);
  border-radius: var(--cui-border-radius);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.retry-button:hover {
  background: var(--cui-secondary-bg);
  color: var(--cui-body-color);
}

.retry-button svg {
  font-size: 0.8rem;
}

/* ===== DASHBOARD CARDS ===== */
.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: var(--cui-card-bg);
  border-radius: var(--cui-border-radius-lg);
  padding: 24px;
  box-shadow: var(--cui-box-shadow);
  border: var(--cui-border-width) solid var(--cui-border-color);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--cui-box-shadow-lg);
}

.stat-icon {
  font-size: 1.8rem;
  line-height: 1;
  opacity: 0.6;
  color: var(--cui-text-muted);
}

.stat-content h3 {
  margin: 0 0 8px 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--cui-heading-color);
}

.stat-content p {
  margin: 0;
  color: var(--cui-text-muted);
  font-size: 0.9rem;
  font-weight: 500;
}

/* ===== CHARTS SECTION ===== */
.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.chart-container {
  background: var(--cui-card-bg);
  border-radius: var(--cui-border-radius-lg);
  padding: 24px;
  box-shadow: var(--cui-box-shadow);
  border: var(--cui-border-width) solid var(--cui-border-color);
}

.chart-container h2 {
  margin: 0 0 20px 0;
  font-size: 1.2rem;
  color: var(--cui-heading-color);
  font-weight: 500;
  display: flex;
  align-items: center;
}

.chart-container h2 svg {
  opacity: 0.5;
  font-size: 1rem;
}

.chart-wrapper {
  position: relative;
  height: 300px;
  width: 100%;
}

.chart-canvas {
  max-width: 100%;
  height: 100%;
}

/* ===== TABLES SECTION ===== */
.tables-section {
  display: grid;
  gap: 30px;
}

.table-container {
  background: var(--cui-card-bg);
  border-radius: var(--cui-border-radius-lg);
  padding: 24px;
  box-shadow: var(--cui-box-shadow);
  border: var(--cui-border-width) solid var(--cui-border-color);
}

.table-container h2 {
  margin: 0 0 20px 0;
  font-size: 1.2rem;
  color: var(--cui-heading-color);
  font-weight: 500;
  display: flex;
  align-items: center;
}

.table-container h2 svg {
  opacity: 0.5;
  font-size: 1rem;
}

.table-responsive {
  overflow-x: auto;
}

.statistics-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.statistics-table th,
.statistics-table td {
  padding: 12px;
  text-align: left;
  border-bottom: var(--cui-border-width) solid var(--cui-border-color);
}

.statistics-table th {
  background: var(--cui-tertiary-bg);
  font-weight: 600;
  color: var(--cui-body-color);
  font-size: 0.9rem;
}

.statistics-table td {
  font-size: 0.9rem;
  color: var(--cui-body-color);
}

.prestazione-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prestazione-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ===== MONTHLY ACCORDION ===== */
.monthly-accordion {
  border-radius: var(--cui-border-radius);
  overflow: hidden;
  border: var(--cui-border-width) solid var(--cui-border-color);
}

.month-item {
  border-bottom: var(--cui-border-width) solid var(--cui-border-color);
}

.month-item:last-child {
  border-bottom: none;
}

.month-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--cui-secondary-bg);
  cursor: pointer;
  transition: background 0.3s ease;
}

.month-header:hover {
  background: var(--cui-tertiary-bg);
}

.month-header.active {
  background: var(--cui-primary-bg-subtle);
}

.month-name {
  font-weight: 600;
  color: var(--cui-heading-color);
  font-size: 1.1rem;
}

.month-stats {
  display: flex;
  gap: 20px;
  align-items: center;
}

.month-events {
  color: var(--cui-text-muted);
  font-size: 0.9rem;
}

.month-revenue {
  color: var(--cui-success);
  font-weight: 600;
  font-size: 0.9rem;
}

.expand-icon {
  opacity: 0.4;
  font-size: 0.7rem;
  transition: opacity 0.3s ease;
}

.month-header:hover .expand-icon {
  opacity: 0.7;
}

.month-header.active .expand-icon {
  /* Rimuovo la rotazione perché ora l'icona cambia dinamicamente */
}

.month-content {
  padding: 20px;
  background: var(--cui-card-bg);
  border-top: var(--cui-border-width) solid var(--cui-border-color);
}

.no-data {
  text-align: center;
  color: var(--cui-text-muted);
  font-style: italic;
  padding: 20px;
  font-size: 0.9rem;
}

.no-data svg {
  opacity: 0.4;
  font-size: 0.8rem;
}

.prestazioni-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.prestazione-item {
  background: var(--cui-secondary-bg);
  border-radius: var(--cui-border-radius);
  padding: 16px;
  border: var(--cui-border-width) solid var(--cui-border-color);
}

.prestazione-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.prestazione-name {
  font-weight: 600;
  color: var(--cui-heading-color);
  font-size: 0.9rem;
}

.prestazione-stats {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.stat {
  font-size: 0.8rem;
  color: var(--cui-text-muted);
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 768px) {
  .statistics-container {
    padding: 15px;
  }

  .statistics-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
    padding: 20px;
  }

  .page-title {
    font-size: 1.6rem;
  }

  .dashboard-cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .stat-card {
    padding: 20px;
  }

  .stat-icon {
    font-size: 1.5rem;
  }

  .stat-content h3 {
    font-size: 1.4rem;
  }

  .charts-section {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .chart-container {
    padding: 20px;
  }

  .chart-wrapper {
    height: 250px;
  }

  .table-container {
    padding: 20px;
  }

  .month-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .month-stats {
    flex-direction: column;
    gap: 5px;
    align-items: flex-start;
  }

  .prestazioni-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .statistics-container {
    padding: 10px;
  }

  .statistics-header {
    padding: 15px;
  }

  .page-title {
    font-size: 1.4rem;
  }

  .stat-card {
    padding: 15px;
    gap: 15px;
  }

  .stat-icon {
    font-size: 1.3rem;
  }

  .stat-content h3 {
    font-size: 1.2rem;
  }

  .chart-container {
    padding: 15px;
  }

  .chart-wrapper {
    height: 200px;
  }

  .table-container {
    padding: 15px;
  }

  .statistics-table th,
  .statistics-table td {
    padding: 8px;
    font-size: 0.8rem;
  }

  .month-header {
    padding: 12px 15px;
  }

  .month-content {
    padding: 15px;
  }

  .prestazione-item {
    padding: 12px;
  }
}

/* ===== UTILITY CLASSES ===== */
.me-2 {
  margin-right: 0.4rem;
}
</style>
