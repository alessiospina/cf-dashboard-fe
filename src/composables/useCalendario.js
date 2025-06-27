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
  COLORI_TERAPIA,
  // ⭐ NUOVO - Import per la ricorrenza
  TipoRicorrenza,
  TIPO_RICORRENZA_OPTIONS,
  Direction,
  DIRECTION_OPTIONS,
  RicorrenzaUtils
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

  // ⭐ NUOVO - Stato reattivo per la gestione della ricorrenza
  const loadingRicorrenza = ref(false) // Loading specifico per operazioni ricorrenza
  const ricorrenzaError = ref('') // Errori specifici per ricorrenza



  // Funzione per resettare gli errori
  const clearError = () => {
    error.value = ''
  }

  // ⭐ NUOVO - Funzione per resettare gli errori di ricorrenza
  const clearRicorrenzaError = () => {
    ricorrenzaError.value = ''
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
  /**
   * Crea un nuovo evento utilizzando la nuova struttura separata data/orario
   * @param {Object} eventoData - Dati evento con struttura separata
   * @returns {Promise<Object>} Nuovo evento creato
   */
  const creaEvento = async (eventoData) => {
    try {
      console.log('🔄 [creaEvento] Creazione nuovo evento con struttura separata:', eventoData)

      // ⭐ VALIDAZIONE - Assicurati che i campi necessari siano presenti
      if (!eventoData.date) {
        throw new Error('Data evento obbligatoria')
      }
      if (!eventoData.timeStart || !eventoData.timeEnd) {
        throw new Error('Orari inizio e fine obbligatori')
      }

      // ⭐ MAPPATURA - Prepara i dati per il backend con la nuova struttura
      const eventoPerBackend = {
        titolo: eventoData.titolo,
        stanza: eventoData.stanza,
        date: eventoData.date,           // ⭐ NUOVO - Data separata
        timeStart: eventoData.timeStart, // ⭐ NUOVO - Orario inizio
        timeEnd: eventoData.timeEnd,     // ⭐ NUOVO - Orario fine
        prezzo: eventoData.prezzo,
        pazienteID: eventoData.pazienteID,
        specialistaID: eventoData.specialistaID
      }

      console.log('📤 [creaEvento] Invio dati al backend:', eventoPerBackend)

      // Usa il service del backend per creare l'evento
      const nuovoEvento = await EventoService.createEvento(eventoPerBackend)

      // ⭐ AGGIORNAMENTO - Aggiorna la lista locale degli eventi
      eventi.value.push(nuovoEvento)

      console.log('✅ [creaEvento] Evento creato con successo:', nuovoEvento)
      return nuovoEvento

    } catch (err) {
      error.value = 'Errore nella creazione dell\'evento'
      console.error('❌ [creaEvento] Errore creazione evento:', err)
      throw err
    }
  }

  /**
   * Aggiorna un evento esistente utilizzando la nuova struttura separata
   * @param {Object} eventoAggiornato - Dati evento da aggiornare
   * @returns {Promise<Object>} Evento aggiornato
   */
  const aggiornaEvento = async (eventoAggiornato) => {
    try {
      console.log('🔄 [aggiornaEvento] Aggiornamento evento con struttura separata:', eventoAggiornato)

      // ⭐ VALIDAZIONI - Controlli sui nuovi campi
      if (!eventoAggiornato.id) {
        throw new Error('ID evento richiesto per aggiornamento')
      }
      if (!eventoAggiornato.date) {
        throw new Error('Data evento obbligatoria')
      }
      if (!eventoAggiornato.timeStart || !eventoAggiornato.timeEnd) {
        throw new Error('Orari inizio e fine obbligatori')
      }

      // ⭐ MAPPATURA - Prepara i dati per il backend (PRESERVANDO L'ID)
      const eventoPerBackend = {
        id: eventoAggiornato.id,               // ⭐ PRESERVA L'ID
        titolo: eventoAggiornato.titolo,
        stanza: eventoAggiornato.stanza,
        date: eventoAggiornato.date,           // ⭐ NUOVO - Data separata
        timeStart: eventoAggiornato.timeStart, // ⭐ NUOVO - Orario inizio
        timeEnd: eventoAggiornato.timeEnd,     // ⭐ NUOVO - Orario fine
        prezzo: eventoAggiornato.prezzo,
        pazienteID: eventoAggiornato.pazienteID,
        specialistaID: eventoAggiornato.specialistaID
      }

      console.log('📋 [aggiornaEvento] Dati preparati per il service (con ID):', eventoPerBackend)
      console.log('🕐 [aggiornaEvento] Verifica orari normalizzati:', {
        originale: { timeStart: eventoAggiornato.timeStart, timeEnd: eventoAggiornato.timeEnd },
        mappato: { timeStart: eventoPerBackend.timeStart, timeEnd: eventoPerBackend.timeEnd }
      })

      // Usa il service del backend per aggiornare l'evento
      const eventoAggiornato_result = await EventoService.updateEvento(eventoPerBackend)

      // Aggiorna la lista locale degli eventi
      const index = eventi.value.findIndex(e => e.id === eventoAggiornato.id)
      if (index !== -1) {
        eventi.value[index] = eventoAggiornato_result
        console.log('🔄 [aggiornaEvento] Lista locale aggiornata all\'indice:', index)
      }

      console.log('✅ [aggiornaEvento] Evento aggiornato con successo:', eventoAggiornato_result)
      return eventoAggiornato_result

    } catch (err) {
      error.value = 'Errore nell\'aggiornamento dell\'evento'
      console.error('❌ [aggiornaEvento] Errore aggiornamento evento:', err)
      throw err
    }
  }





  const eliminaEvento = async (eventoId) => {
    try {
      // ⭐ CORREZIONE - Assicurati che l'ID sia preservato come stringa/numero originale
      console.log('🗑️ [useCalendario] Eliminazione evento ID (tipo originale):', eventoId, typeof eventoId)

      // Usa il service del backend per eliminare l'evento
      await EventoService.deleteEvento(eventoId)

      // ⭐ CORREZIONE - Confronto sicuro degli ID per rimozione dalla lista locale
      eventi.value = eventi.value.filter(e => {
        // Confronta come stringhe per evitare problemi di tipo
        const eventoIdStr = e.id?.toString()
        const eliminatoIdStr = eventoId?.toString()
        console.log(`🔍 [useCalendario] Confronto ID per rimozione: evento.id="${eventoIdStr}" vs eliminato="${eliminatoIdStr}"`)
        return eventoIdStr !== eliminatoIdStr
      })

      console.log('✅ [useCalendario] Evento eliminato con successo')
    } catch (err) {
      error.value = 'Errore nell\'eliminazione dell\'evento'
      console.error('❌ [useCalendario] Errore eliminazione evento:', err)
      throw err
    }
  }

  // ⭐ NUOVO - Funzioni CRUD per eventi ricorrenti

  /**
   * Crea un nuovo evento con ricorrenza utilizzando la nuova struttura separata
   * @param {Object} eventoData - Dati dell'evento con ricorrenza (nuova struttura)
   * @returns {Promise<Array>} Lista degli eventi creati
   */
  const creaEventoConRicorrenza = async (eventoData) => {
    loadingRicorrenza.value = true
    ricorrenzaError.value = ''

    try {
      console.log('🔄 [creaEventoConRicorrenza] Creazione evento con ricorrenza (nuova struttura):', eventoData)

      // ⭐ VALIDAZIONI - Controlli sui nuovi campi
      if (!eventoData.date) {
        throw new Error('Data evento obbligatoria per ricorrenza')
      }
      if (!eventoData.timeStart || !eventoData.timeEnd) {
        throw new Error('Orari inizio e fine obbligatori per ricorrenza')
      }

      // Validazione preliminare dati ricorrenza
      if (eventoData.ricorrenza) {
        if (!RicorrenzaUtils.isDataFineRicorrenzaValida(eventoData.ricorrenza.dataFineRicorrenza)) {
          throw new Error('Data fine ricorrenza non valida. Deve essere tra domani e il 31 dicembre dell\'anno corrente.')
        }

        // ⭐ CALCOLO EVENTI - Usa la nuova struttura per il calcolo
        const numeroEventi = RicorrenzaUtils.calcolaNumeroEventiRicorrenti(
          eventoData.date,                     // ⭐ NUOVO - usa 'date' invece di 'dataInizio'
          eventoData.ricorrenza.dataFineRicorrenza,
          eventoData.ricorrenza.tipo
        )

        console.log(`📊 [creaEventoConRicorrenza] Verranno creati circa ${numeroEventi} eventi ricorrenti`)
      }

      // ⭐ MAPPATURA - Prepara i dati per il backend con nuova struttura
      const eventoPerBackend = {
        titolo: eventoData.titolo,
        stanza: eventoData.stanza,
        date: eventoData.date,           // ⭐ NUOVO - Data separata
        timeStart: eventoData.timeStart, // ⭐ NUOVO - Orario inizio
        timeEnd: eventoData.timeEnd,     // ⭐ NUOVO - Orario fine
        prezzo: eventoData.prezzo,
        pazienteID: eventoData.pazienteID,
        specialistaID: eventoData.specialistaID,
        ricorrenza: eventoData.ricorrenza // Mantieni i dati ricorrenza
      }

      console.log('📤 [creaEventoConRicorrenza] Invio dati al backend:', eventoPerBackend)

      // Usa il service del backend per creare l'evento con ricorrenza
      const eventiCreati = await EventoService.createEventoWithRicorrenza(eventoPerBackend)

      // Aggiorna la lista locale degli eventi aggiungendo tutti i nuovi eventi
      eventi.value.push(...eventiCreati)

      console.log(`✅ [creaEventoConRicorrenza] Creati ${eventiCreati.length} eventi ricorrenti con successo`)
      return eventiCreati

    } catch (err) {
      ricorrenzaError.value = 'Errore nella creazione dell\'evento ricorrente'
      console.error('❌ [creaEventoConRicorrenza] Errore creazione evento ricorrente:', err)
      throw err
    } finally {
      loadingRicorrenza.value = false
    }
  }

  /**
   * Aggiorna eventi ricorrenti con direzione specifica - nuova struttura
   * @param {Object} eventoData - Dati dell'evento da aggiornare con direction
   * @returns {Promise<Array>} Lista degli eventi aggiornati
   */
  const aggiornaEventiRicorrenti = async (eventoData) => {
    loadingRicorrenza.value = true
    ricorrenzaError.value = ''

    try {
      console.log('🔄 [aggiornaEventiRicorrenti] Aggiornamento eventi ricorrenti (nuova struttura):', eventoData)

      // ⭐ VALIDAZIONI - Controlli sui nuovi campi
      if (!eventoData.id) {
        throw new Error('ID evento richiesto per l\'aggiornamento di eventi ricorrenti')
      }
      if (!eventoData.date) {
        throw new Error('Data evento obbligatoria per aggiornamento ricorrenti')
      }
      if (!eventoData.timeStart || !eventoData.timeEnd) {
        throw new Error('Orari inizio e fine obbligatori per aggiornamento ricorrenti')
      }
      if (!eventoData.direction || !Object.values(Direction).includes(eventoData.direction)) {
        throw new Error('Direzione aggiornamento obbligatoria e valida')
      }

      // ⭐ MAPPATURA - Prepara i dati per il backend con nuova struttura
      const eventoPerBackend = {
        id: eventoData.id,
        titolo: eventoData.titolo,
        stanza: eventoData.stanza,
        date: eventoData.date,           // ⭐ NUOVO - Data separata
        timeStart: eventoData.timeStart, // ⭐ NUOVO - Orario inizio
        timeEnd: eventoData.timeEnd,     // ⭐ NUOVO - Orario fine
        prezzo: eventoData.prezzo,
        pazienteID: eventoData.pazienteID,
        specialistaID: eventoData.specialistaID,
        direction: eventoData.direction  // Direzione aggiornamento
      }

      console.log('📤 [aggiornaEventiRicorrenti] Invio dati al backend:', eventoPerBackend)

      // Usa il service del backend per aggiornare gli eventi ricorrenti
      const eventiAggiornati = await EventoService.updateEventiRicorrenti(eventoPerBackend)

      // Aggiorna la lista locale degli eventi sostituendo quelli modificati
      eventiAggiornati.forEach(eventoAggiornato => {
        const index = eventi.value.findIndex(e => e.id.toString() === eventoAggiornato.id.toString())
        if (index !== -1) {
          eventi.value[index] = eventoAggiornato
        }
      })

      console.log(`✅ [aggiornaEventiRicorrenti] Aggiornati ${eventiAggiornati.length} eventi ricorrenti con successo`)
      return eventiAggiornati

    } catch (err) {
      ricorrenzaError.value = 'Errore nell\'aggiornamento degli eventi ricorrenti'
      console.error('❌ [aggiornaEventiRicorrenti] Errore aggiornamento eventi ricorrenti:', err)
      throw err
    } finally {
      loadingRicorrenza.value = false
    }
  }

  /**
   * Elimina eventi ricorrenti con direzione specifica
   * @param {number} eventoId - ID dell'evento da eliminare
   * @param {string} direction - Direzione dell'eliminazione (THIS o THIS_AND_FOLLOWING)
   * @returns {Promise<Array>} Lista degli ID eventi eliminati
   */
  const eliminaEventiRicorrenti = async (eventoId, direction = Direction.THIS) => {
    loadingRicorrenza.value = true
    ricorrenzaError.value = ''

    try {
      console.log('🔄 [useCalendario] Eliminazione eventi ricorrenti:', { eventoId, direction })

      // Validazione parametri
      if (!eventoId) {
        throw new Error('ID evento richiesto per l\'eliminazione di eventi ricorrenti')
      }

      if (!Object.values(Direction).includes(direction)) {
        throw new Error('Direzione eliminazione non valida')
      }

      // Usa il service del backend per eliminare gli eventi ricorrenti
      const eventiEliminatiIds = await EventoService.deleteEventiRicorrenti(eventoId, direction)

      // Rimuovi dalla lista locale tutti gli eventi eliminati
      eventi.value = eventi.value.filter(evento =>
        !eventiEliminatiIds.includes(parseInt(evento.id))
      )

      console.log(`✅ [useCalendario] Eliminati ${eventiEliminatiIds.length} eventi ricorrenti con successo`)
      return eventiEliminatiIds

    } catch (err) {
      ricorrenzaError.value = 'Errore nell\'eliminazione degli eventi ricorrenti'
      console.error('❌ [useCalendario] Errore eliminazione eventi ricorrenti:', err)
      throw err
    } finally {
      loadingRicorrenza.value = false
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

  // ⭐ NUOVO - Utilità specifiche per la ricorrenza

  /**
   * Controlla se un evento fa parte di una serie ricorrente
   * @param {Object} evento - Evento da controllare
   * @returns {boolean} - True se l'evento fa parte di una serie ricorrente
   */
  const isEventoRicorrente = (evento) => {
    return evento && evento.isPartOfSeries === true
  }

  /**
   * Ottiene tutti gli eventi correlati in una serie ricorrente
   * @param {Object} eventoBase - Evento di cui trovare la serie
   * @returns {Array} - Lista degli eventi della stessa serie
   */
  const getEventiSerie = (eventoBase) => {
    if (!eventoBase || !isEventoRicorrente(eventoBase)) {
      return [eventoBase].filter(Boolean)
    }

    // Se l'evento ha un master, filtra per master
    // Se l'evento è master (master = null), filtra per eventi che hanno questo ID come master
    const masterId = eventoBase.master || eventoBase.id

    return eventi.value.filter(evento => {
      // Include l'evento master stesso (master = null e ID corrispondente)
      if (!evento.master && evento.id.toString() === masterId.toString()) {
        return true
      }
      // Include gli eventi che hanno questo master
      return evento.master && evento.master.toString() === masterId.toString()
    })
  }

  /**
   * Genera un preview descrittivo della ricorrenza (AGGIORNATO - Nuova struttura)
   * @param {Object} ricorrenzaData - Dati ricorrenza con evento incluso
   * @param {Date|string} dataEvento - Data del primo evento (opzionale, può essere in ricorrenzaData)
   * @returns {string} - Descrizione leggibile della ricorrenza
   */
  const getPreviewRicorrenza = (ricorrenzaData, dataEvento = null) => {
    if (!ricorrenzaData || !ricorrenzaData.tipo || !ricorrenzaData.dataFineRicorrenza) {
      return 'Evento singolo'
    }

    try {
      // ⭐ COMPATIBILITÀ - Estrai la data dall'evento in qualsiasi formato
      let dataInizio = dataEvento

      // Se dataEvento non è fornito, prova a estrarlo da ricorrenzaData
      if (!dataInizio) {
        dataInizio = ricorrenzaData.date || ricorrenzaData.dataInizio
      }

      // Se ancora non hai la data, usa oggi
      if (!dataInizio) {
        dataInizio = new Date()
      }

      // ⭐ CALCOLO EVENTI - Usa la utility aggiornata
      const numeroEventi = RicorrenzaUtils.calcolaNumeroEventiRicorrenti(
        dataInizio,
        ricorrenzaData.dataFineRicorrenza,
        ricorrenzaData.tipo
      )

      return RicorrenzaUtils.getDescrizioneRicorrenza(
        ricorrenzaData.tipo,
        ricorrenzaData.dataFineRicorrenza,
        numeroEventi
      )
    } catch (error) {
      console.warn('Errore nel calcolo preview ricorrenza:', error)
      return 'Ricorrenza non valida'
    }
  }

  /**
   * Valida i dati di ricorrenza prima dell'invio
   * @param {Object} ricorrenzaData - Dati ricorrenza da validare
   * @returns {Object} - {isValid: boolean, errors: Array}
   */
  const validaRicorrenza = (ricorrenzaData) => {
    const errors = []

    if (!ricorrenzaData) {
      return { isValid: true, errors: [] } // Ricorrenza opzionale
    }

    // Tipo ricorrenza obbligatorio se è presente la ricorrenza
    if (!ricorrenzaData.tipo || !Object.values(TipoRicorrenza).includes(ricorrenzaData.tipo)) {
      errors.push('Tipo ricorrenza obbligatorio e valido')
    }

    // Data fine ricorrenza obbligatoria
    if (!ricorrenzaData.dataFineRicorrenza) {
      errors.push('Data fine ricorrenza obbligatoria')
    } else {
      // Valida il range di date
      if (!RicorrenzaUtils.isDataFineRicorrenzaValida(ricorrenzaData.dataFineRicorrenza)) {
        const dataMaxima = RicorrenzaUtils.getDataMassimaFineRicorrenza()
        errors.push(`Data fine ricorrenza deve essere tra domani e il ${new Date(dataMaxima).toLocaleDateString('it-IT')}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
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
    // ⭐ NUOVO - Stato ricorrenza
    loadingRicorrenza, // Loading specifico per operazioni ricorrenza
    ricorrenzaError, // Errori specifici per ricorrenza

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

    // ⭐ NUOVO - Metodi ricorrenza
    creaEventoConRicorrenza, // Crea evento con ricorrenza
    aggiornaEventiRicorrenti, // Aggiorna eventi ricorrenti con direction
    eliminaEventiRicorrenti, // Elimina eventi ricorrenti con direction



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
    // ⭐ NUOVO - Utilità ricorrenza
    clearRicorrenzaError, // Utility per pulire errori ricorrenza
    isEventoRicorrente, // Controlla se evento fa parte di serie ricorrente
    getEventiSerie, // Ottiene tutti gli eventi di una serie ricorrente
    getPreviewRicorrenza, // Genera preview descrittivo ricorrenza
    validaRicorrenza, // Valida dati ricorrenza

    // Costanti
    TipoTerapia,
    TIPI_TERAPIA_OPTIONS,
    COLORI_TERAPIA,
    FrequenzaEvento,
    FREQUENZA_EVENTO_OPTIONS,
    EventoMapper,
    EventoValidator,
    // ⭐ NUOVO - Costanti ricorrenza
    TipoRicorrenza,
    TIPO_RICORRENZA_OPTIONS,
    Direction,
    DIRECTION_OPTIONS,
    RicorrenzaUtils
  }
}
