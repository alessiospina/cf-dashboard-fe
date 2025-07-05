/**
 * Composable per la gestione delle statistiche degli eventi
 * Gestisce lo stato, le chiamate API e l'elaborazione dei dati
 */
import { ref, computed, watch } from 'vue';
import { statisticsService } from '@/services/statisticsService';
import { EventoService } from '@/services/calendarioService';

export const useStatistics = () => {
  // Stato reattivo
  const selectedYear = ref(new Date().getFullYear()); // Anno corrente come default
  const events = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Opzioni disponibili per la selezione dell'anno
  const yearOptions = [
    { value: 2025, label: '2025' },
    { value: 2026, label: '2026' },
    { value: 2027, label: '2027' }
  ];

  // Dati elaborati (computed)
  const annualData = computed(() => {
    return statisticsService.processAnnualData(events.value);
  });

  const monthlyData = computed(() => {
    return statisticsService.processMonthlyData(events.value, selectedYear.value);
  });

  const annualSummary = computed(() => {
    return statisticsService.calculateAnnualSummary(events.value);
  });

  /**
   * Funzione per caricare gli eventi dell'anno selezionato
   * Utilizza EventoService.getEventiBetween con le date di inizio e fine anno
   * @param {number} year - Anno selezionato
   */
  const loadYearEvents = async (year) => {
    try {
      loading.value = true;
      error.value = null;

      console.log(`📊 [useStatistics] Caricamento eventi per l'anno: ${year}`);

      // Calcola le date di inizio e fine anno
      const { startDate, endDate } = statisticsService.getYearDateRange(year);

      console.log(`📅 [useStatistics] Range date: ${startDate} - ${endDate}`);

      // Chiama l'API per ottenere gli eventi tra le date specificate
      const eventsData = await EventoService.getEventiBetween(startDate, endDate);

      console.log(`📈 [useStatistics] Caricati ${eventsData.length} eventi`);

      // Aggiorna gli eventi - i dati sono già mappati dal servizio
      events.value = eventsData;
      
    } catch (err) {
      console.error('❌ [useStatistics] Errore nel caricamento eventi:', err);
      error.value = 'Errore nel caricamento degli eventi: ' + err.message;
      events.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Watcher per ricaricare i dati quando cambia l'anno
  watch(selectedYear, (newYear) => {
    if (newYear) {
      console.log(`🔄 [useStatistics] Anno selezionato cambiato: ${newYear}`);
      loadYearEvents(newYear);
    }
  }, { immediate: true });

  // Funzioni di utilità per la formattazione
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('it-IT').format(value);
  };

  const formatPercentage = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  /**
   * Funzione per refresh manuale dei dati
   */
  const refreshData = () => {
    console.log('🔄 [useStatistics] Refresh manuale dati');
    loadYearEvents(selectedYear.value);
  };

  /**
   * Funzione per ottenere i dati per i grafici (formattati per Chart.js)
   */
  const getChartData = computed(() => {
    const annual = annualData.value;
    
    return {
      // Dati per il grafico a torta delle prestazioni
      pieChart: {
        labels: annual.map(item => item.prestazione),
        datasets: [{
          data: annual.map(item => item.total),
          backgroundColor: annual.map(item => item.color),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      
      // Dati per il grafico a barre mensile
      barChart: {
        labels: monthlyData.value.map(month => month.monthName),
        datasets: [{
          label: 'Fatturato Mensile',
          data: monthlyData.value.map(month => month.totalRevenue),
          backgroundColor: '#3B82F6',
          borderColor: '#1D4ED8',
          borderWidth: 1
        }]
      }
    };
  });

  /**
   * Funzione per calcolare la prestazione più performante
   */
  const getTopPerformance = computed(() => {
    const annual = annualData.value;
    if (annual.length === 0) return null;
    
    return annual[0]; // Il primo elemento è già ordinato per totale decrescente
  });

  return {
    // Stato
    selectedYear,
    events,
    loading,
    error,
    yearOptions,
    
    // Dati elaborati
    annualData,
    monthlyData,
    annualSummary,
    getChartData,
    getTopPerformance,
    
    // Funzioni
    loadYearEvents,
    refreshData,
    formatCurrency,
    formatNumber,
    formatPercentage
  };
};
