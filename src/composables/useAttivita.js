/**
 * Composable per la gestione delle Attività
 *
 * Questo composable gestisce tutta la logica reattiva per la pagina delle attività,
 * inclusi il caricamento, filtraggi, ricerca e manipolazione dei dati.
 * Si basa su AttivitaService per le chiamate API.
 */

import { ref, computed, reactive } from 'vue'
import AttivitaService from '@/services/attivitaService'

export function useAttivita() {
  // Stati reattivi
  const attivita = ref([])           // Tutte le attività caricate
  const prestazioni = ref([])        // Lista prestazioni per i filtri
  const specialisti = ref([])        // Lista specialisti per i filtri
  const loading = ref(false)         // Stato di caricamento
  const error = ref(null)            // Eventuali errori
  const notification = ref(null)     // Notifiche all'utente
  const searchTerm = ref('')         // Termine di ricerca

  // Filtri reattivi
  const filtri = reactive({
    prestazioneId: null,
    specialistaId: null,
    dataInizio: null,
    dataFine: null
  })

  /**
   * Computed property per le attività filtrate
   * Applica filtri e ricerca ai dati caricati
   */
  const filteredAttivita = computed(() => {
    let result = [...attivita.value]

    // Applicazione filtri
    if (filtri.prestazioneId || filtri.specialistaId || filtri.dataInizio || filtri.dataFine) {
      result = AttivitaService.filtraAttivita(result, filtri)
    }

    // Applicazione ricerca testuale
    if (searchTerm.value) {
      const searchLower = searchTerm.value.toLowerCase()
      result = result.filter(attivita => {
        const pazienteMatch = attivita.paziente?.nomeCompleto?.toLowerCase().includes(searchLower) ||
                             attivita.paziente?.codiceFiscale?.toLowerCase().includes(searchLower)

        const specialistaMatch = attivita.specialista?.nomeCompleto?.toLowerCase().includes(searchLower) ||
                                attivita.specialista?.email?.toLowerCase().includes(searchLower)

        const prestazioneMatch = attivita.prestazione?.tipologia?.toLowerCase().includes(searchLower)

        const eventoMatch = attivita.evento?.titolo?.toLowerCase().includes(searchLower) ||
                           attivita.evento?.stanza?.toLowerCase().includes(searchLower)

        return pazienteMatch || specialistaMatch || prestazioneMatch || eventoMatch
      })
    }

    return result
  })

  /**
   * Computed property per le opzioni del dropdown prestazioni
   */
  const prestazioniOptions = computed(() => {
    return prestazioni.value.map(prestazione => ({
      value: prestazione.id,
      label: prestazione.tipologia,
      color: prestazione.color
    }))
  })

  /**
   * Computed property per le opzioni del dropdown specialisti
   */
  const specialistiOptions = computed(() => {
    return specialisti.value.map(specialista => ({
      value: specialista.id,
      label: `${specialista.nome} ${specialista.cognome}`.trim(),
      prestazione: specialista.prestazione?.tipologia || null
    }))
  })

  /**
   * Computed property per le statistiche generali
   */
  const statistiche = computed(() => {
    const totalAttivita = filteredAttivita.value.length

    // Conta pazienti unici
    const pazientiUnici = new Set(
      filteredAttivita.value
        .filter(a => a.paziente)
        .map(a => a.paziente.id)
    ).size

    // Conta specialisti unici
    const specialistiUnici = new Set(
      filteredAttivita.value
        .filter(a => a.specialista)
        .map(a => a.specialista.id)
    ).size

    return {
      totaleAttivita: totalAttivita,
      pazientiUnici,
      specialistiUnichi: specialistiUnici
    }
  })

  /**
   * Inizializza tutti i dati necessari per la pagina
   */
  const initializeData = async () => {
    loading.value = true
    error.value = null

    try {
      console.log('Caricamento dati attività...')

      // Caricamento parallelo di tutti i dati
      const [attivitaData, prestazioniData, specialistiData] = await Promise.all([
        AttivitaService.getAllAttivitaAnnoCorrente(),
        AttivitaService.getPrestazioni(),
        AttivitaService.getSpecialisti()
      ])

      // Assegna i dati
      attivita.value = attivitaData || []
      prestazioni.value = prestazioniData || []
      specialisti.value = specialistiData || []

      console.log(`Caricate ${attivita.value.length} attività`)
      console.log(`Caricate ${prestazioni.value.length} prestazioni`)
      console.log(`Caricati ${specialisti.value.length} specialisti`)

      // Notifica di successo se ci sono dati
      if (attivita.value.length > 0) {
        showNotification('success', `Caricate ${attivita.value.length} attività`)
      }

    } catch (err) {
      console.error('Errore nel caricamento dati attività:', err)
      error.value = 'Errore nel caricamento dei dati delle attività'
      showNotification('error', 'Errore nel caricamento dei dati')
    } finally {
      loading.value = false
    }
  }

  /**
   * Applica i filtri alle attività
   * @param {Object} nuoviFiltri - I filtri da applicare
   */
  const applicaFiltri = (nuoviFiltri) => {
    Object.assign(filtri, nuoviFiltri)
    console.log('Filtri applicati:', filtri)
  }

  /**
   * Reset di tutti i filtri
   */
  const resetFiltri = () => {
    filtri.prestazioneId = null
    filtri.specialistaId = null
    filtri.dataInizio = null
    filtri.dataFine = null
    searchTerm.value = ''

    showNotification('info', 'Filtri reimpostati')
  }

  /**
   * Mostra una notifica all'utente
   * @param {string} type - Tipo di notifica (success, error, warning, info)
   * @param {string} message - Messaggio da mostrare
   */
  const showNotification = (type, message) => {
    notification.value = { type, message }

    // Auto-hide dopo 5 secondi per i messaggi di successo
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        notification.value = null
      }, 5000)
    }
  }

  /**
   * Pulisce la notifica corrente
   */
  const clearNotification = () => {
    notification.value = null
  }

  /**
   * Formatta una data per la visualizzazione
   * @param {string|Date} data - Data da formattare
   * @returns {string} - Data formattata
   */
  const formatDate = (data) => {
    if (!data) return '-'

    try {
      const date = new Date(data)
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (err) {
      console.error('Errore nel formato data:', err)
      return '-'
    }
  }

  /**
   * Formatta data e ora per la visualizzazione
   * @param {string|Date} data - Data da formattare
   * @returns {string} - Data e ora formattate
   */
  const formatDateTime = (data) => {
    if (!data) return '-'

    try {
      const date = new Date(data)
      return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (err) {
      console.error('Errore nel formato data/ora:', err)
      return '-'
    }
  }

  /**
   * Carica attività per un range di date specifico
   * @param {string} dataInizio - Data inizio (YYYY-MM-DD)
   * @param {string} dataFine - Data fine (YYYY-MM-DD)
   */
  const caricaAttivitaRange = async (dataInizio, dataFine) => {
    loading.value = true
    error.value = null

    try {
      const attivitaData = await AttivitaService.getAttivitaBetween(dataInizio, dataFine)
      attivita.value = attivitaData || []

      showNotification('success', `Caricate ${attivita.value.length} attività per il periodo`)
    } catch (err) {
      console.error('Errore nel caricamento attività range:', err)
      error.value = 'Errore nel caricamento delle attività per il periodo specificato'
      showNotification('error', 'Errore nel caricamento dei dati')
    } finally {
      loading.value = false
    }
  }

  // Esportiamo tutto ciò che serve ai componenti
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

    // Computed
    filteredAttivita,
    prestazioniOptions,
    specialistiOptions,
    statistiche,

    // Metodi
    initializeData,
    applicaFiltri,
    resetFiltri,
    showNotification,
    clearNotification,
    formatDate,
    formatDateTime,
    caricaAttivitaRange
  }
}
