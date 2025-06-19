/**
 * Composable per la gestione delle Performance
 *
 * Questo composable gestisce lo stato reattivo delle metriche di performance,
 * inclusi i dati per cards, grafici e filtri dell'anno.
 */

import { ref, computed, onMounted } from 'vue'
import { PerformanceService } from '@/services/performanceService.js'

/**
 * Composable per le performance e statistiche
 */
export function usePerformance() {

  // === STATO REATTIVO ===
  
  // Anno selezionato (solo 2025 per ora)
  const annoSelezionato = ref(2025)
  
  // Dati performance
  const datiPerformance = ref(null)
  
  // Stati di loading e errori
  const isLoading = ref(false)
  const error = ref(null)

  // === COMPUTED PROPERTIES ===

  /**
   * Opzioni disponibili per il selector anno
   */
  const opzioniAnno = computed(() => [
    { value: 2025, label: '2025' }
    // Aggiungeremo 2026, 2027 etc. in futuro
  ])

  /**
   * Metriche delle cards calcolate e formattate
   */
  const metricsCards = computed(() => {
    if (!datiPerformance.value?.cards) return null

    const cards = datiPerformance.value.cards
    
    return {
      totalePatzienti: {
        valore: PerformanceService.formatNumero(cards.totalePatzienti),
        valoreNumerico: cards.totalePatzienti,
        label: 'Totale Pazienti',
        icona: 'cil-people',
        colore: 'primary'
      },
      totaleEventi: {
        valore: PerformanceService.formatNumero(cards.totaleEventi),
        valoreNumerico: cards.totaleEventi,
        label: 'Totale Eventi',
        icona: 'cil-calendar',
        colore: 'info'
      },
      totaleGuadagno: {
        valore: PerformanceService.formatEuro(cards.totaleGuadagno),
        valoreNumerico: cards.totaleGuadagno,
        label: 'Totale Guadagno',
        icona: 'cil-euro',
        colore: 'success'
      },
      mediaGuadagnoEvento: {
        valore: PerformanceService.formatEuro(cards.mediaGuadagnoEvento),
        valoreNumerico: cards.mediaGuadagnoEvento,
        label: 'Media €/Evento',
        icona: 'cil-chart',
        colore: 'warning'
      }
    }
  })

  /**
   * Dati formattati per il grafico guadagni per mese
   */
  const datiGraficoMesi = computed(() => {
    if (!datiPerformance.value?.guadagniPerMese) return null

    return {
      labels: datiPerformance.value.guadagniPerMese.map(item => item.mese),
      datasets: [{
        label: 'Guadagni Mensili',
        data: datiPerformance.value.guadagniPerMese.map(item => item.guadagno),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    }
  })

  /**
   * Dati formattati per il grafico guadagni per specialista
   */
  const datiGraficoSpecialisti = computed(() => {
    if (!datiPerformance.value?.guadagniPerSpecialista) return null

    const specialisti = datiPerformance.value.guadagniPerSpecialista
    
    // Prendiamo i top 10 specialisti per non sovraffollare il grafico
    const topSpecialisti = specialisti.slice(0, 10)
    
    return {
      labels: topSpecialisti.map(item => item.specialista),
      datasets: [{
        label: 'Guadagni per Specialista',
        data: topSpecialisti.map(item => item.guadagno),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)',
          'rgba(255, 99, 255, 0.8)',
          'rgba(99, 255, 132, 0.8)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(255, 99, 255, 1)',
          'rgba(99, 255, 132, 1)'
        ],
        borderWidth: 1
      }]
    }
  })

  /**
   * Configurazione opzioni per il grafico lineare (mesi)
   */
  const opzioniGraficoLinea = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `Andamento Guadagni per Mese - ${annoSelezionato.value}`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return PerformanceService.formatEuro(value)
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }))

  /**
   * Configurazione opzioni per il grafico a barre (specialisti)
   */
  const opzioniGraficoBarre = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `Top 10 Specialisti per Guadagni - ${annoSelezionato.value}`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return PerformanceService.formatEuro(value)
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  }))

  // === METODI ===

  /**
   * Carica i dati performance per l'anno selezionato
   */
  const caricaDatiPerformance = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      // Chiamiamo il service per ottenere i dati
      const dati = await PerformanceService.getPerformanceAnnuale(annoSelezionato.value)
      datiPerformance.value = dati
      
    } catch (err) {
      error.value = 'Errore nel caricamento dei dati performance'
      console.error('Errore caricamento performance:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Cambia l'anno selezionato e ricarica i dati
   * @param {number} nuovoAnno - Nuovo anno da selezionare
   */
  const cambiaAnno = async (nuovoAnno) => {
    if (nuovoAnno !== annoSelezionato.value) {
      annoSelezionato.value = nuovoAnno
      await caricaDatiPerformance()
    }
  }

  /**
   * Ricarica forzatamente i dati
   */
  const ricaricaDati = async () => {
    await caricaDatiPerformance()
  }

  // === LIFECYCLE ===

  /**
   * Carichiamo i dati quando il composable viene montato
   */
  onMounted(() => {
    caricaDatiPerformance()
  })

  // === RETURN ===

  return {
    // Stato
    annoSelezionato,
    datiPerformance,
    isLoading,
    error,
    
    // Computed
    opzioniAnno,
    metricsCards,
    datiGraficoMesi,
    datiGraficoSpecialisti,
    opzioniGraficoLinea,
    opzioniGraficoBarre,
    
    // Metodi
    caricaDatiPerformance,
    cambiaAnno,
    ricaricaDati
  }
}
