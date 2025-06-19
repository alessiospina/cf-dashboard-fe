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
        borderColor: '#321fdb', // Colore CoreUI primary
        backgroundColor: 'rgba(50, 31, 219, 0.1)', // Trasparenza del colore primary
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#321fdb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
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

    // Generiamo colori dinamici basati sui colori CoreUI
    const colori = [
      '#321fdb', // primary
      '#39f', // info
      '#f9b115', // warning
      '#e55353', // danger
      '#2eb85c', // success
      '#6c757d', // secondary
      '#212529', // dark
      '#fd7e14', // orange
      '#6f42c1', // purple
      '#20c997'  // teal
    ]

    return {
      labels: topSpecialisti.map(item => {
        // Accorciamo i nomi troppo lunghi per una migliore visualizzazione
        const nomeCompleto = item.specialista
        return nomeCompleto.length > 15 ? nomeCompleto.substring(0, 12) + '...' : nomeCompleto
      }),
      datasets: [{
        label: 'Guadagni per Specialista',
        data: topSpecialisti.map(item => item.guadagno),
        backgroundColor: topSpecialisti.map((_, index) => colori[index % colori.length]),
        borderColor: topSpecialisti.map((_, index) => colori[index % colori.length]),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false
      }]
    }
  })

  /**
   * Configurazione opzioni per il grafico lineare (mesi)
   */
  const opzioniGraficoLinea = computed(() => ({
    responsive: true,
    maintainAspectRatio: false, // IMPORTANTE: permette al grafico di riempire il container
    layout: {
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      }
    },
    plugins: {
      title: {
        display: false // Rimuoviamo il titolo interno perché abbiamo l'header della card
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
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      },
      line: {
        tension: 0.4
      }
    }
  }))

  /**
   * Configurazione opzioni per il grafico a barre (specialisti)
   */
  const opzioniGraficoBarre = computed(() => ({
    responsive: true,
    maintainAspectRatio: false, // IMPORTANTE: permette al grafico di riempire il container
    layout: {
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      }
    },
    plugins: {
      title: {
        display: false // Rimuoviamo il titolo interno perché abbiamo l'header della card
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
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10
          }
        },
        grid: {
          display: false
        }
      }
    },
    elements: {
      bar: {
        borderWidth: 1,
        borderSkipped: false,
        borderRadius: 4
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
