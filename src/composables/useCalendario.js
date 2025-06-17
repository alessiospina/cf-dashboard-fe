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
   * Estrae i specialisti unici dalla lista degli eventi + slot per eventi non assegnati
   * Crea oggetti specialista con id, nome, cognome e specializzazione
   * Aggiunge uno slot speciale per eventi senza specialista
   * @param {Array} listaEventi - Lista degli eventi dal backend
   * @returns {Array} Lista di specialisti unici + slot eventi non assegnati ordinati alfabeticamente
   */
  const estraiSpecialistiDaEventi = (listaEventi) => {
    try {
      if (!listaEventi || !Array.isArray(listaEventi) || listaEventi.length === 0) {
        console.log('📋 [estraiSpecialistiDaEventi] Lista eventi vuota per estrazione specialisti')
        return []
      }

      console.log(`📋 [estraiSpecialistiDaEventi] Analizzando ${listaEventi.length} eventi per estrarre specialisti...`)

      const specialistiUnici = new Map()
      let eventiSenzaSpecialista = 0

      listaEventi.forEach((evento, index) => {
        try {
          // Contiamo gli eventi senza specialista
          if (!evento || !evento.specialista) {
            eventiSenzaSpecialista++
            console.log(`⚠️ [estraiSpecialistiDaEventi] Evento ${index} senza specialista - sarà messo in slot separato:`, evento?.titolo || 'Senza titolo')
            return
          }

          const specialista = evento.specialista
          const chiave = specialista.id.toString() // Usa solo l'ID che è univoco

          if (!specialistiUnici.has(chiave)) {
            const specialistaEstratto = {
              id: specialista.id,
              nome: specialista.nome,
              cognome: specialista.cognome,
              nomeCompleto: specialista.nomeCompleto,
              email: specialista.email,
              telefono: specialista.telefono,
              prestazione: specialista.prestazione
            }

            specialistiUnici.set(chiave, specialistaEstratto)
            console.log(`➕ [estraiSpecialistiDaEventi] Aggiunto specialista ID ${specialista.id}: ${specialista.nomeCompleto}`)
          }
        } catch (eventoError) {
          console.error(`❌ [estraiSpecialistiDaEventi] Errore nell'elaborazione evento ${index}:`, eventoError)
        }
      })

      // Creiamo la lista dei risultati partendo dagli specialisti reali
      const risultato = Array.from(specialistiUnici.values())
        .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, 'it'))

      // Se ci sono eventi senza specialista, aggiungiamo uno slot speciale
      if (eventiSenzaSpecialista > 0) {
        const slotNonAssegnati = {
          id: 'non-assegnati', // ID speciale per identificarlo
          nome: 'Eventi',
          cognome: 'Non Assegnati',
          nomeCompleto: 'Eventi Non Assegnati',
          email: null,
          telefono: null,
          prestazione: {
            id: null,
            tipologia: 'NON_ASSEGNATO',
            color: '#6c757d' // Grigio per eventi non assegnati
          },
          isSlotSpeciale: true, // Flag per identificare questo slot
          countEventi: eventiSenzaSpecialista
        }

        // Aggiungiamo lo slot speciale alla fine della lista
        risultato.push(slotNonAssegnati)
        console.log(`📌 [estraiSpecialistiDaEventi] Aggiunto slot per ${eventiSenzaSpecialista} eventi non assegnati`)
      }

      console.log(`✅ [estraiSpecialistiDaEventi] Estratti ${risultato.length} slot (specialisti + non assegnati) da ${listaEventi.length} eventi:`, risultato.map(s => s.nomeCompleto))
      return risultato

    } catch (error) {
      console.error('❌ [estraiSpecialistiDaEventi] Errore generale nell\'estrazione specialisti:', error)
      return []
    }
  }
  // Computed property per i specialisti derivati dagli eventi
  const specialistiDaEventi = computed(() => {
    try {
      // Controllo di sicurezza per evitare errori durante l'inizializzazione
      if (!eventi.value || !Array.isArray(eventi.value)) {
        console.warn('⚠️ [specialistiDaEventi] Array eventi non valido o non inizializzato')
        return []
      }

      console.log(`🔄 [specialistiDaEventi] Ricalcolo specialisti da ${eventi.value.length} eventi...`)
      const risultato = estraiSpecialistiDaEventi(eventi.value)
      console.log(`✅ [specialistiDaEventi] Computed restituisce ${risultato.length} specialisti`)
      return risultato
    } catch (error) {
      console.error('❌ [specialistiDaEventi] Errore nel calcolo specialisti da eventi:', error)
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

      console.log(`🔄 [filtraEventi] Inizio filtraggio di ${listaEventi.length} eventi con filtri:`, filtri)
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
                const match = !isNaN(dataEvento.getTime()) &&
                       dataEvento.toDateString() === dataFiltro.toDateString()
                return match
              } catch (dateError) {
                console.warn('Errore nella data evento:', evento, dateError)
                return false
              }
            })

            console.log(`📊 [filtraEventi] Filtro data applicato: ${eventiFiltrati.length} eventi rimasti`)
          }
        } catch (dateError) {
          console.warn('Errore nel filtro data:', dateError)
        }
      }

      // Filtro per specialista - gestisce sia ID che nomi completi
      if (filtri.specialista) {
        eventiFiltrati = eventiFiltrati.filter(evento => {
          if (!evento || !evento.specialista) return false

          const filtroValore = filtri.specialista.toString()

          // Se il filtro inizia con "nome:", filtra per nome completo
          if (filtroValore.startsWith('nome:')) {
            const nomeRicercato = filtroValore.substring(5) // Rimuove "nome:"
            const nomeEventoSpecialista = `${evento.specialista.nome} ${evento.specialista.cognome}`.trim()

            console.log(`🔍 [filtraEventi] Filtro per nome: "${nomeRicercato}" vs evento "${nomeEventoSpecialista}"`)

            return nomeEventoSpecialista === nomeRicercato
          }

          // Altrimenti filtra per ID (comportamento normale)
          const specialistaIdEvento = evento.specialista.id?.toString()

          console.log(`🔍 [filtraEventi] Filtro per ID: evento.specialista.id="${specialistaIdEvento}" vs filtro="${filtroValore}"`)

          return specialistaIdEvento === filtroValore
        })

        console.log(`📊 [filtraEventi] Filtro specialista applicato: ${eventiFiltrati.length} eventi rimasti`)
      }

      // Filtro per tipo terapia
      if (filtri.tipoTerapia) {
        eventiFiltrati = eventiFiltrati.filter(evento => {
          if (!evento) return false

          // Il tipo terapia si trova nella prestazione dello specialista
          const tipoTerapiaEvento = evento.specialista?.prestazione?.tipologia

          console.log(`🔍 [filtraEventi] Confronto tipo terapia: evento="${tipoTerapiaEvento}" vs filtro="${filtri.tipoTerapia}"`)

          return tipoTerapiaEvento === filtri.tipoTerapia
        })

        console.log(`📊 [filtraEventi] Filtro tipo terapia applicato: ${eventiFiltrati.length} eventi rimasti`)
      }

      console.log(`✅ [filtraEventi] Filtraggio completato: ${eventiFiltrati.length} eventi finali`)
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
