/**
 * Servizio per la gestione delle API del Calendario
 *
 * Questo file contiene tutte le chiamate HTTP per gestire eventi e slot.
 * Utilizza axios per le chiamate HTTP e organizziamo tutto in una classe.
 */

import axios from 'axios'
import { getApiBaseUrl } from '@/config/api'
import {
  CreateEventoDto,
  EventoMapper,
  EventoValidator,
  TipoRicorrenza,
  Direction
} from '@/types/backend.types'

// Configurazione base per le chiamate API - URL letto dal file .env
const API_BASE_URL = getApiBaseUrl()

// Creiamo un'istanza di axios con configurazione di base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // timeout di 10 secondi
})

// Interceptor per gestire errori globalmente
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Errore API Calendario:', error)
    return Promise.reject(error)
  }
)

/**
 * Servizio per la gestione degli Eventi
 */
export class EventoService {

  /**
   * Ottiene tutti gli eventi
   * @returns {Promise<Array>} Lista di tutti gli eventi
   */
  static async getAllEventi() {
    try {
      const response = await apiClient.get('/evento')
      return response.data.data?.map(evento => EventoMapper.backendToFrontend(evento)) || []
    } catch (error) {
      console.error('Errore nel recupero eventi:', error)
      throw error
    }
  }

  /**
   * Ottiene un evento per ID
   * @param {number} eventoId - ID dell'evento
   * @returns {Promise<Object>} Evento
   */
  static async getEventoById(eventoId) {
    try {
      const response = await apiClient.get(`/evento/${eventoId}`)
      return EventoMapper.backendToFrontend(response.data.data)
    } catch (error) {
      console.error('Errore nel recupero evento:', error)
      throw error
    }
  }

  /**
   * Crea un nuovo evento utilizzando la nuova struttura separata data/orario
   * @param {Object} eventoData - Dati evento con struttura separata (date, timeStart, timeEnd)
   * @returns {Promise<Object>} Nuovo evento creato
   */
  static async createEvento(eventoData) {
    try {
      console.log('🔄 [EventoService] Creazione nuovo evento con struttura separata:', eventoData)

      // ⭐ VALIDAZIONE - Assicurati che i campi necessari siano presenti
      if (!eventoData.date) {
        throw new Error('Data evento obbligatoria')
      }
      if (!eventoData.timeStart || !eventoData.timeEnd) {
        throw new Error('Orari inizio e fine obbligatori')
      }

      // ⭐ MAPPATURA - Prepara i dati per il backend con la nuova struttura
      const eventoPerBackend = EventoMapper.frontendToBackend(eventoData)

      // Validazione dati
      const validation = EventoValidator.validateCreateEvento(eventoPerBackend)

      if (!validation.isValid) {
        throw new Error(`Dati non validi: ${Object.values(validation.errors).join(', ')}`)
      }

      console.log('📤 [EventoService] Invio dati al backend:', eventoPerBackend)

      const response = await apiClient.post('/evento', eventoPerBackend)
      return EventoMapper.backendToFrontend(response.data.data)
    } catch (error) {
      console.error('❌ [EventoService] Errore nella creazione evento:', error)
      throw error
    }
  }

  /**
   * Aggiorna un evento esistente utilizzando la nuova struttura separata data/orario
   * @param {Object} eventoData - Dati evento da aggiornare (deve includere id, date, timeStart, timeEnd)
   * @returns {Promise<Object>} Evento aggiornato
   */
  static async updateEvento(eventoData) {
    try {
      console.log('🔄 [EventoService] Aggiornamento evento con struttura separata:', eventoData)

      // Validazione che l'ID sia presente per l'update
      if (!eventoData.id) {
        throw new Error('ID evento richiesto per l\'aggiornamento')
      }

      // ⭐ VALIDAZIONE - Assicurati che i campi necessari siano presenti
      if (!eventoData.date) {
        throw new Error('Data evento obbligatoria')
      }
      if (!eventoData.timeStart || !eventoData.timeEnd) {
        throw new Error('Orari inizio e fine obbligatori')
      }

      // ⭐ MAPPATURA - Prepara i dati per il backend con la nuova struttura
      const eventoPerBackend = EventoMapper.frontendToBackend(eventoData)

      // ⭐ CORREZIONE - Aggiungi esplicitamente l'ID che non viene mappato dal CreateEventoDto
      eventoPerBackend.id = eventoData.id

      console.log('🔧 [EventoService] Dati con ID preservato per backend:', eventoPerBackend)

      // Validazione dati
      const validation = EventoValidator.validateCreateEvento(eventoPerBackend)

      if (!validation.isValid) {
        throw new Error(`Dati non validi: ${Object.values(validation.errors).join(', ')}`)
      }

      console.log('📤 [EventoService] Invio dati aggiornati al backend:', eventoPerBackend)

      // Usa PUT con l'ID nell'URL come si aspetta il backend
      const response = await apiClient.put(`/evento/${eventoData.id}`, eventoPerBackend)
      return EventoMapper.backendToFrontend(response.data.data)
    } catch (error) {
      console.error('❌ [EventoService] Errore nell\'aggiornamento evento:', error)
      throw error
    }
  }

  /**
   * Aggiorna parzialmente un evento esistente (PATCH)
   * @param {Object} eventoData - Dati parziali dell'evento da aggiornare (deve includere id)
   * @returns {Promise<Object>} Evento aggiornato
   */
  static async patchEvento(eventoData) {
    try {
      // Validazione che l'ID sia presente per l'update
      if (!eventoData.id) {
        throw new Error('ID evento richiesto per l\'aggiornamento parziale')
      }

      // Per PATCH non mappiamo tutti i dati, solo quelli forniti
      const {id, ...datiParziali} = eventoData

      // Usa PATCH se il backend lo supportasse in futuro
      const response = await apiClient.patch(`/evento/${id}`, datiParziali)
      return EventoMapper.backendToFrontend(response.data.data)
    } catch (error) {
      console.error('Errore nell\'aggiornamento parziale evento:', error)
      throw error
    }
  }



  /**
   * Elimina un evento
   * @param {number|string} eventoId - ID dell'evento da eliminare
   * @returns {Promise<void>}
   */
  static async deleteEvento(eventoId) {
    try {
      // ⭐ DEBUG - Verifica che l'ID arrivi correttamente
      console.log('🗑️ [EventoService] Eliminazione evento ID:', eventoId, 'tipo:', typeof eventoId)

      // ⭐ CORREZIONE - Assicurati che l'ID sia un numero valido se necessario
      const idNumerico = parseInt(eventoId)
      if (isNaN(idNumerico)) {
        throw new Error(`ID evento non valido: ${eventoId}`)
      }

      console.log('📤 [EventoService] Chiamata DELETE per ID:', idNumerico)
      await apiClient.delete(`/evento/${idNumerico}`)
      console.log('✅ [EventoService] Evento eliminato con successo dal backend')
    } catch (error) {
      console.error('❌ [EventoService] Errore nell\'eliminazione evento:', error)
      throw error
    }
  }

  /**
   * Ottiene eventi filtrati per data
   * @param {string} data - Data in formato YYYY-MM-DD
   * @returns {Promise<Array>} Lista eventi filtrati
   */
  static async getEventiPerData(data) {
    try {
      const response = await apiClient.get('/evento', {
        params: {data}
      })
      return response.data.data?.map(evento => EventoMapper.backendToFrontend(evento)) || []
    } catch (error) {
      console.error('Errore nel recupero eventi per data:', error)
      throw error
    }
  }

  /**
   * Ottiene eventi filtrati per range di date
   * @param {string} dataInizio - Data inizio in formato YYYY-MM-DD
   * @param {string} dataFine - Data fine in formato YYYY-MM-DD
   * @returns {Promise<Array>} Lista eventi filtrati
   */
  static async getEventiPerRange(dataInizio, dataFine) {
    try {
      const response = await apiClient.get('/evento', {
        params: {
          dataInizio,
          dataFine
        }
      })
      return response.data.data?.map(evento => EventoMapper.backendToFrontend(evento)) || []
    } catch (error) {
      console.error('Errore nel recupero eventi per range:', error)
      throw error
    }
  }

  /**
   * Ottiene eventi per un intervallo di date usando l'endpoint /between
   * @param {string} dataInizio - Data inizio in formato YYYY-MM-DD
   * @param {string} dataFine - Data fine in formato YYYY-MM-DD (può essere uguale a dataInizio per un singolo giorno)
   * @returns {Promise<Array>} Lista eventi nell'intervallo specificato
   */
  static async getEventiBetween(dataInizio, dataFine) {
    try {
      const response = await apiClient.get('/evento/between', {
        params: {
          from: dataInizio,
          to: dataFine
        }
      })

      // ⭐ AGGIORNATO - Usa il mapper standard per includere il campo master e isPartOfSeries
      return response.data.data?.map(evento => EventoMapper.backendToFrontend(evento)) || []
    } catch (error) {
      console.error('Errore nel recupero eventi between:', error)
      throw error
    }
  }

  // ⭐ NUOVO - Metodi per la gestione degli eventi ricorrenti

  /**
   * Crea un nuovo evento con ricorrenza
   * @param {Object} eventoData - Dati dell'evento da creare con ricorrenza (formato frontend)
   * @returns {Promise<Array>} Lista degli eventi creati (evento master + eventi ricorrenti)
   */
  static async createEventoWithRicorrenza(eventoData) {
    try {
      console.log('🔄 [EventoService] Creazione evento con ricorrenza:', eventoData)

      // Validazione dati con ricorrenza usando il nuovo validator
      const backendData = EventoMapper.frontendToBackendWithRicorrenza(eventoData)
      const validation = EventoValidator.validateCreateEventoWithRicorrenza(backendData)

      if (!validation.isValid) {
        const errorMessage = `Dati non validi: ${Object.values(validation.errors).join(', ')}`
        console.error('❌ [EventoService] Validazione fallita:', validation.errors)
        throw new Error(errorMessage)
      }

      console.log('📤 [EventoService] Invio dati al backend:', backendData)

      // Chiamata API all'endpoint ricorrenza del backend
      const response = await apiClient.post('/ricorrenza', backendData)

      // Il backend restituisce un array di eventi creati
      const eventiCreati = response.data.data?.map(evento => EventoMapper.backendToFrontend(evento)) || []

      console.log(`✅ [EventoService] Creati ${eventiCreati.length} eventi ricorrenti`)
      return eventiCreati

    } catch (error) {
      console.error('❌ [EventoService] Errore nella creazione evento con ricorrenza:', error)
      throw error
    }
  }

  /**
   * Aggiorna eventi ricorrenti con direzione specifica
   * @param {Object} eventoData - Dati dell'evento da aggiornare con direzione (deve includere id e direction)
   * @returns {Promise<Array>} Lista degli eventi aggiornati
   */
  static async updateEventiRicorrenti(eventoData) {
    try {
      console.log('🔄 [EventoService] Aggiornamento eventi ricorrenti:', eventoData)

      // Validazione che l'ID sia presente per l'update
      if (!eventoData.id) {
        throw new Error('ID evento richiesto per l\'aggiornamento di eventi ricorrenti')
      }

      // Validazione con direction per eventi ricorrenti
      const backendData = EventoMapper.frontendToBackendUpdateRicorrenza(eventoData)
      const validation = EventoValidator.validateUpdateEventoWithRicorrenza(backendData)

      if (!validation.isValid) {
        const errorMessage = `Dati non validi: ${Object.values(validation.errors).join(', ')}`
        console.error('❌ [EventoService] Validazione update ricorrenza fallita:', validation.errors)
        throw new Error(errorMessage)
      }

      console.log('📤 [EventoService] Invio update ricorrenza al backend:', backendData)

      // Chiamata API all'endpoint ricorrenza per update
      const response = await apiClient.put(`/ricorrenza/${eventoData.id}`, backendData)

      // Il backend restituisce un array di eventi aggiornati
      const eventiAggiornati = response.data.data?.map(evento => EventoMapper.backendToFrontend(evento)) || []

      console.log(`✅ [EventoService] Aggiornati ${eventiAggiornati.length} eventi ricorrenti`)
      return eventiAggiornati

    } catch (error) {
      console.error('❌ [EventoService] Errore nell\'aggiornamento eventi ricorrenti:', error)
      throw error
    }
  }



  /**
   * Elimina eventi ricorrenti con direzione specifica
   * @param {number} eventoId - ID dell'evento da eliminare
   * @param {string} direction - Direzione dell'eliminazione (THIS o THIS_AND_FOLLOWING)
   * @returns {Promise<Array>} Lista degli ID eventi eliminati
   */
  static async deleteEventiRicorrenti(eventoId, direction = Direction.THIS) {
    try {
      console.log('🔄 [EventoService] Eliminazione eventi ricorrenti:', { eventoId, direction })

      // Validazione parametri
      if (!eventoId) {
        throw new Error('ID evento richiesto per l\'eliminazione di eventi ricorrenti')
      }

      // Validazione direction
      const deleteData = EventoMapper.frontendToBackendDeleteRicorrenza(direction)
      const validation = EventoValidator.validateDeleteEventiRicorrenti(deleteData)

      if (!validation.isValid) {
        const errorMessage = `Dati non validi: ${Object.values(validation.errors).join(', ')}`
        console.error('❌ [EventoService] Validazione delete ricorrenza fallita:', validation.errors)
        throw new Error(errorMessage)
      }

      console.log('📤 [EventoService] Invio delete ricorrenza al backend:', deleteData)

      // Chiamata API all'endpoint ricorrenza per eliminazione
      const response = await apiClient.delete(`/ricorrenza/${eventoId}`, {
        data: deleteData // DELETE con body data
      })

      // Il backend restituisce gli ID degli eventi eliminati
      const eventiEliminatiIds = response.data.data || []

      console.log(`✅ [EventoService] Eliminati ${eventiEliminatiIds.length} eventi ricorrenti:`, eventiEliminatiIds)
      return eventiEliminatiIds

    } catch (error) {
      console.error('❌ [EventoService] Errore nell\'eliminazione eventi ricorrenti:', error)
      throw error
    }
  }
}

// Esportiamo anche le utility per la ricorrenza
export {
  EventoMapper,
  EventoValidator,
  TipoRicorrenza,
  Direction,
  RicorrenzaUtils
} from '@/types/backend.types'
