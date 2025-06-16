/**
 * Composable per la gestione del Calendario
 *
 * Fornisce:
 * - Gestione eventi dal backend
 * - Gestione specialisti e specialisti
 * - Logica di filtring e validazione
 * - Utilità per la timeline
 * - Mapping tra entità frontend e backend
 */

import {ref, computed} from 'vue'
import {
  EventoBackend,
  EventoMapper,
  EventoValidator,
  FrequenzaEvento,
  FREQUENZA_EVENTO_OPTIONS,
  TipoTerapia,
  TIPI_TERAPIA_OPTIONS,
  COLORI_TERAPIA
} from '@/types/backend.types'

// Import dei service per specialisti, pazienti ed eventi
import {SpecialistaService} from '@/services/specialistaService'
import {PazienteService} from '@/services/pazienteService'
import {EventoService} from '@/services/calendarioService'


/**
 * Formatta una data nel formato YYYY-MM-DD per le API
 * @param {Date|string} data - Data da formattare
 * @returns {string} Data formattata
 */
const formatDateForAPI = (data) => {
  const date = new Date(data)
  return date.toISOString().split('T')[0]
}

export function useCalendario() {
  // Stato reattivo
  const eventi = ref([])
  const specialisti = ref([]) // Lista specialisti dal backend
  const pazienti = ref([]) // Lista pazienti dal backend
  const loading = ref(false)
  const loadingSpecialisti = ref(false) // Loading specifico per specialisti
  const loadingPazienti = ref(false) // Loading specifico per pazienti
  const error = ref('')

  // Funzione per resettare gli errori
  const clearError = () => {
    error.value = ''
  }


  // Funzione per caricare specialisti dal backend (una sola volta)
  const caricaSpecialisti = async () => {
    // Se già caricati, non rifare la chiamata
    if (specialisti.value.length > 0) {
      console.log('✅ [useCalendario] Specialisti già caricati, utilizzo cache')
      return specialisti.value
    }

    loadingSpecialisti.value = true
    try {
      console.log('🔄 [useCalendario] Caricamento specialisti dal backend...')
      specialisti.value = await SpecialistaService.getAllSpecialisti()
      console.log(`✅ [useCalendario] Caricati ${specialisti.value.length} specialisti`)
      return specialisti.value
    } catch (err) {
      error.value = 'Errore nel caricamento dei specialisti dal backend'
      console.error('❌ [useCalendario] Errore caricamento specialisti:', err)
      specialisti.value = [] // Array vuoto in caso di errore
      return []
    } finally {
      loadingSpecialisti.value = false
    }
  }

  // Funzione per caricare pazienti dal backend (una sola volta)
  const caricaPazienti = async () => {
    // Se già caricati, non rifare la chiamata
    if (pazienti.value.length > 0) {
      console.log('Pazienti già caricati, utilizzo cache')
      return pazienti.value
    }

    loadingPazienti.value = true
    try {
      console.log('Caricamento pazienti dal backend...')
      pazienti.value = await PazienteService.getAllPazienti()
      console.log(`Caricati ${pazienti.value.length} pazienti`)
      return pazienti.value
    } catch (err) {
      error.value = 'Errore nel caricamento dei pazienti dal backend'
      console.error(err)
      pazienti.value = [] // Array vuoto in caso di errore
      return []
    } finally {
      loadingPazienti.value = false
    }
  }

  // Funzione per cercare specialisti (utilizzo cache locale)
  const cercaSpecialisti = async (query = '') => {
    try {
      // Assicurati che gli specialisti siano caricati
      if (specialisti.value.length === 0) {
        await caricaSpecialisti()
      }

      // Usa il filtro del service per mantenere coerenza
      return SpecialistaService.filterSpecialisti(specialisti.value, query)
    } catch (err) {
      console.error('❌ [useCalendario] Errore nella ricerca specialisti:', err)
      return []
    }
  }

  // Funzione per cercare pazienti (utilizzo cache locale)
  const cercaPazienti = (query = '') => {
    // Filtra localmente senza chiamate API
    if (!query || query.trim() === '') {
      return pazienti.value
    }

    const queryLower = query.toLowerCase()
    return pazienti.value.filter(paziente => {
      // Controlli di sicurezza per evitare errori con valori undefined/null
      const nome = paziente.nome || ''
      const cognome = paziente.cognome || ''
      const email = paziente.email || ''
      const nomeCompleto = `${nome} ${cognome}`.trim()

      // Filtra solo se i campi sono validi
      return nomeCompleto.toLowerCase().includes(queryLower) ||
             email.toLowerCase().includes(queryLower)
    })
  }

  // Funzione per inizializzare tutti i dati (da chiamare all'apertura del calendario)
  const inizializzaCalendario = async (dataIniziale = new Date()) => {
    console.log('Inizializzazione calendario per data:', formatDateForAPI(dataIniziale))
    try {
      await Promise.all([
        caricaEventi(dataIniziale), // Carica eventi per la data specificata
        caricaSpecialisti(), // Corretto: non duplicato
        caricaPazienti()
      ])
      console.log('Calendario inizializzato con successo')
    } catch (err) {
      console.error('Errore nell\'inizializzazione calendario:', err)
      error.value = 'Errore nell\'inizializzazione del calendario'
    }
  }

  /**
   * Carica eventi dal backend per una data specifica
   * @param {Date|string} data - Data per cui caricare gli eventi (default: oggi)
   * @returns {Promise<Array>} Lista eventi caricati
   */
  const caricaEventi = async (data = new Date()) => {
    loading.value = true
    error.value = ''

    try {
      // Formatta la data per l'API (YYYY-MM-DD)
      const dataFormattata = formatDateForAPI(data)

      console.log(`Caricamento eventi per il ${dataFormattata}...`)

      // Chiama l'API backend per gli eventi del giorno specificato
      // Usiamo la stessa data per from e to per ottenere eventi di un singolo giorno
      const eventiBackend = await EventoService.getEventiBetween(dataFormattata, dataFormattata)

      console.log(`Caricati ${eventiBackend.length} eventi dal backend`)

      // Aggiorna lo stato reattivo
      eventi.value = eventiBackend

      return eventiBackend

    } catch (err) {
      const errorMessage = 'Errore nel caricamento degli eventi dal backend'
      error.value = errorMessage
      console.error(errorMessage, err)

      // In caso di errore, mantieni gli eventi esistenti invece di svuotare
      console.warn('Mantengo gli eventi esistenti a causa dell\'errore')

      // Rilancia l'errore per permettere al chiamante di gestirlo
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Carica eventi per un intervallo di date
   * @param {Date|string} dataInizio - Data inizio intervallo
   * @param {Date|string} dataFine - Data fine intervallo
   * @returns {Promise<Array>} Lista eventi nell'intervallo
   */
  const caricaEventiIntervallo = async (dataInizio, dataFine) => {
    loading.value = true
    error.value = ''

    try {
      const dataInizioFormattata = formatDateForAPI(dataInizio)
      const dataFineFormattata = formatDateForAPI(dataFine)

      console.log(`Caricamento eventi dall'${dataInizioFormattata} al ${dataFineFormattata}...`)

      const eventiBackend = await EventoService.getEventiBetween(dataInizioFormattata, dataFineFormattata)

      console.log(`Caricati ${eventiBackend.length} eventi dal backend per l'intervallo`)

      return eventiBackend

    } catch (err) {
      const errorMessage = 'Errore nel caricamento degli eventi per l\'intervallo'
      error.value = errorMessage
      console.error(errorMessage, err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Funzioni CRUD eventi
  const creaEvento = async (eventoData) => {
    try {
      console.log('Creazione nuovo evento:', eventoData)

      // Usa il service del backend per creare l'evento
      const nuovoEvento = await EventoService.createEvento(eventoData)

      // Aggiorna la lista locale degli eventi
      eventi.value.push(nuovoEvento)

      console.log('Evento creato con successo:', nuovoEvento)
      return nuovoEvento
    } catch (err) {
      error.value = 'Errore nella creazione dell\'evento'
      console.error('Errore creazione evento:', err)
      throw err
    }
  }

  const aggiornaEvento = async (eventoAggiornato) => {
    try {
      console.log('Aggiornamento evento:', eventoAggiornato)

      // Usa il service del backend per aggiornare l'evento
      const eventoAggiornato_result = await EventoService.updateEvento(eventoAggiornato)

      // Aggiorna la lista locale degli eventi
      const index = eventi.value.findIndex(e => e.id === eventoAggiornato.id)
      if (index !== -1) {
        eventi.value[index] = eventoAggiornato_result
      }

      console.log('Evento aggiornato con successo:', eventoAggiornato_result)
      return eventoAggiornato_result
    } catch (err) {
      error.value = 'Errore nell\'aggiornamento dell\'evento'
      console.error('Errore aggiornamento evento:', err)
      throw err
    }
  }

  const eliminaEvento = async (eventoId) => {
    try {
      console.log('Eliminazione evento ID:', eventoId)

      // Usa il service del backend per eliminare l'evento
      await EventoService.deleteEvento(eventoId)

      // Rimuovi dalla lista locale
      eventi.value = eventi.value.filter(e => e.id !== eventoId)

      console.log('Evento eliminato con successo')
    } catch (err) {
      error.value = 'Errore nell\'eliminazione dell\'evento'
      console.error('Errore eliminazione evento:', err)
      throw err
    }
  }

  /**
   * Estrae i specialisti unici dalla lista degli eventi
   * Crea oggetti specialista con id, nome, cognome e specializzazione
   * @param {Array} listaEventi - Lista degli eventi dal backend
   * @returns {Array} Lista di specialisti unici ordinati alfabeticamente
   */
  const estraiSpecialistiDaEventi = (listaEventi) => {
    try {
      if (!listaEventi || !Array.isArray(listaEventi) || listaEventi.length === 0) {
        console.log('Lista eventi vuota per estrazione specialisti')
        return []
      }

      const specialistiUnici = new Map()

      listaEventi.forEach((evento, index) => {
        try {
          // ✅ USA: evento.specialista invece di evento.professionista
          if (!evento || !evento.specialista) {
            console.warn(`Evento ${index} senza specialista:`, evento)
            return
          }

          const specialista = evento.specialista
          const chiave = `${specialista.id}-${specialista.nome}-${specialista.cognome}`

          if (!specialistiUnici.has(chiave)) {
            specialistiUnici.set(chiave, {
              id: specialista.id,
              nome: specialista.nome,
              cognome: specialista.cognome,
              nomeCompleto: specialista.nomeCompleto,
              email: specialista.email,
              telefono: specialista.telefono,
              prestazione: specialista.prestazione
            })
          }
        } catch (eventoError) {
          console.error(`Errore nell'elaborazione evento ${index}:`, eventoError)
        }
      })

      const risultato = Array.from(specialistiUnici.values())
        .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, 'it'))

      console.log(`✅ Estratti ${risultato.length} specialisti unici da ${listaEventi.length} eventi`)
      return risultato

    } catch (error) {
      console.error('❌ Errore generale nell\'estrazione specialisti:', error)
      return []
    }
  }
  // Computed property per i specialisti derivati dagli eventi
  const specialistiDaEventi = computed(() => {
    try {
      // Controllo di sicurezza per evitare errori durante l'inizializzazione
      if (!eventi.value || !Array.isArray(eventi.value)) {
        console.warn('Array eventi non valido o non inizializzato')
        return []
      }

      return estraiSpecialistiDaEventi(eventi.value)
    } catch (error) {
      console.error('Errore nel calcolo specialisti da eventi:', error)
      return []
    }
  })

  // Utilità per filtri
  const filtraEventi = (listaEventi, filtri) => {
    try {
      // Controlli di sicurezza
      if (!listaEventi || !Array.isArray(listaEventi)) {
        console.warn('Lista eventi non valida per il filtraggio')
        return []
      }

      if (!filtri || typeof filtri !== 'object') {
        console.warn('Filtri non validi, restituisco tutti gli eventi')
        return [...listaEventi]
      }

      let eventiFiltrati = [...listaEventi]

      // Filtro per data
      if (filtri.data) {
        try {
          const dataFiltro = new Date(filtri.data)
          if (!isNaN(dataFiltro.getTime())) {
            eventiFiltrati = eventiFiltrati.filter(evento => {
              if (!evento || !evento.dataInizio) return false

              try {
                const dataEvento = new Date(evento.dataInizio)
                return !isNaN(dataEvento.getTime()) &&
                       dataEvento.toDateString() === dataFiltro.toDateString()
              } catch (dateError) {
                console.warn('Errore nella data evento:', evento, dateError)
                return false
              }
            })
          }
        } catch (dateError) {
          console.warn('Errore nel filtro data:', dateError)
        }
      }

      // Filtro per specialista (ora usa il nome completo del specialista)
      if (filtri.specialista) {
        eventiFiltrati = eventiFiltrati.filter(evento => {
          if (!evento || !evento.specialista) return false
          return evento.specialista === filtri.specialista ||
                 evento.specialista.includes(filtri.specialista)
        })
      }

      // Filtro per tipo terapia
      if (filtri.tipoTerapia) {
        eventiFiltrati = eventiFiltrati.filter(evento => {
          if (!evento) return false
          return evento.tipoTerapia === filtri.tipoTerapia
        })
      }

      return eventiFiltrati

    } catch (error) {
      console.error('Errore generale nel filtraggio eventi:', error)
      return listaEventi || []
    }
  }

  // Utilità per la timeline
  const getEventoInOrario = (specialistaId, dataOra) => {
    try {
      if (!eventi.value || !Array.isArray(eventi.value)) return null
      if (!specialistaId || !dataOra) return null

      return eventi.value.find(evento => {
        if (!evento || !evento.dataInizio || !evento.dataFine) return false
        if (!evento.specialista || !evento.specialista.id) return false

        try {
          const inizio = new Date(evento.dataInizio)
          const fine = new Date(evento.dataFine)
          const ora = new Date(dataOra)

          if (isNaN(inizio.getTime()) || isNaN(fine.getTime()) || isNaN(ora.getTime())) {
            return false
          }

          return evento.specialista.id === specialistaId &&
                 ora >= inizio && ora < fine
        } catch (error) {
          return false
        }
      })
    } catch (error) {
      console.error('Errore in getEventoInOrario:', error)
      return null
    }
  }

  const isSlotLibero = (specialistaId, dataInizio, dataFine) => {
    try {
      if (!eventi.value || !Array.isArray(eventi.value)) return true
      if (!specialistaId || !dataInizio || !dataFine) return true

      const inizio = new Date(dataInizio)
      const fine = new Date(dataFine)

      if (isNaN(inizio.getTime()) || isNaN(fine.getTime())) return true

      return !eventi.value.some(evento => {
        if (!evento || !evento.specialista || !evento.specialista.id) return false
        if (evento.specialista.id !== specialistaId) return false
        if (!evento.dataInizio || !evento.dataFine) return false

        try {
          const eventoInizio = new Date(evento.dataInizio)
          const eventoFine = new Date(evento.dataFine)

          if (isNaN(eventoInizio.getTime()) || isNaN(eventoFine.getTime())) {
            return false
          }

          // Controlla sovrapposizioni
          return (inizio < eventoFine) && (fine > eventoInizio)
        } catch (error) {
          return false
        }
      })
    } catch (error) {
      console.error('Errore in isSlotLibero:', error)
      return true
    }
  }

  // Utilità per formattazione
  const formatTime = (dateString) => {
    try {
      if (!dateString) return '--:--'
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '--:--'

      return date.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.warn('Errore nel formato time:', error)
      return '--:--'
    }
  }

  const formatDate = (dateString) => {
    try {
      if (!dateString) return '--/--/----'
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '--/--/----'

      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      console.warn('Errore nel formato date:', error)
      return '--/--/----'
    }
  }

  const formatDuration = (dataInizio, dataFine) => {
    try {
      if (!dataInizio || !dataFine) return '--'

      const inizio = new Date(dataInizio)
      const fine = new Date(dataFine)

      if (isNaN(inizio.getTime()) || isNaN(fine.getTime())) return '--'

      const durataMs = fine - inizio
      if (durataMs < 0) return '--'

      const durataOre = Math.floor(durataMs / (1000 * 60 * 60))
      const durataMinuti = Math.floor((durataMs % (1000 * 60 * 60)) / (1000 * 60))

      if (durataMinuti === 0) {
        return `${durataOre}h`
      }
      return `${durataOre}h ${durataMinuti}m`
    } catch (error) {
      console.warn('Errore nel formato duration:', error)
      return '--'
    }
  }

  return {
    // Stato
    eventi,
    specialisti, // Lista specialisti dal backend
    specialistiDaEventi, // Lista specialisti estratti dagli eventi (computed)
    pazienti, // Lista pazienti dal backend
    loading,
    loadingSpecialisti, // Loading specifico per specialisti
    loadingPazienti, // Loading specifico per pazienti
    error,

    // Metodi principali
    caricaEventi, // Carica eventi per una data specifica
    caricaEventiIntervallo, // Carica eventi per un intervallo di date
    caricaSpecialisti, // Carica specialisti una sola volta
    caricaPazienti, // Carica pazienti una sola volta
    cercaSpecialisti, // Cerca specialisti in cache
    cercaPazienti, // Cerca pazienti in cache
    inizializzaCalendario, // Inizializza tutto il calendario con data specifica
    creaEvento,
    aggiornaEvento,
    eliminaEvento,

    // Utilità
    filtraEventi,
    estraiSpecialistiDaEventi, // Funzione per estrarre specialisti da eventi
    getEventoInOrario,
    isSlotLibero,
    formatTime,
    formatDate,
    formatDuration,
    formatDateForAPI, // Utility per formattare date per API
    clearError, // Utility per pulire errori

    // Costanti
    TipoTerapia,
    TIPI_TERAPIA_OPTIONS,
    COLORI_TERAPIA,
    FrequenzaEvento,
    FREQUENZA_EVENTO_OPTIONS,
    EventoMapper,
    EventoValidator
  }
}
