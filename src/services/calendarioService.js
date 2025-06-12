/**
 * Servizio per la gestione delle API del Calendario
 *
 * Questo file contiene tutte le chiamate HTTP per gestire eventi e slot.
 * Utilizza axios per le chiamate HTTP e organizziamo tutto in una classe.
 */

import axios from 'axios'
import { CreateEventoDto, CreateSlotDto, EventoMapper, EventoValidator } from '@/types/backend.types'

// Configurazione base per le chiamate API
const API_BASE_URL = 'http://localhost:8000/api'

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
   * Crea un nuovo evento
   * @param {Object} eventoData - Dati dell'evento da creare (formato frontend)
   * @returns {Promise<Object>} Evento creato
   */
  static async createEvento(eventoData) {
    try {
      // Validazione dati
      const backendData = EventoMapper.frontendToBackend(eventoData)
      const validation = EventoValidator.validateCreateEvento(backendData)

      if (!validation.isValid) {
        throw new Error(`Dati non validi: ${Object.values(validation.errors).join(', ')}`)
      }

      const response = await apiClient.post('/evento', backendData)
      return EventoMapper.backendToFrontend(response.data.data)
    } catch (error) {
      console.error('Errore nella creazione evento:', error)
      throw error
    }
  }

  /**
   * Aggiorna un evento esistente
   * @param {Object} eventoData - Dati dell'evento da aggiornare (deve includere id)
   * @returns {Promise<Object>} Evento aggiornato
   */
  static async updateEvento(eventoData) {
    try {
      // Validazione dati
      const backendData = EventoMapper.frontendToBackend(eventoData)
      const validation = EventoValidator.validateCreateEvento(backendData)

      if (!validation.isValid) {
        throw new Error(`Dati non validi: ${Object.values(validation.errors).join(', ')}`)
      }

      const response = await apiClient.patch('/evento', {
        id: eventoData.id,
        ...backendData
      })
      return EventoMapper.backendToFrontend(response.data.data)
    } catch (error) {
      console.error('Errore nell\'aggiornamento evento:', error)
      throw error
    }
  }

  /**
   * Elimina un evento
   * @param {number} eventoId - ID dell'evento da eliminare
   * @returns {Promise<void>}
   */
  static async deleteEvento(eventoId) {
    try {
      await apiClient.delete(`/evento/${eventoId}`)
    } catch (error) {
      console.error('Errore nell\'eliminazione evento:', error)
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
        params: { data }
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

      // Mappa i dati del backend al formato frontend
      return response.data.data?.map(evento => ({
        id: evento.id,
        titolo: evento.titolo,
        stanza: evento.stanza,
        professionista: evento.professionista,
        dataInizio: evento.dataInizio,
        dataFine: evento.dataFine,
        createdAt: evento.createdAt,
        paziente: evento.paziente ? {
          id: evento.paziente.id,
          nome: evento.paziente.nome,
          cognome: evento.paziente.cognome,
          nomeCompleto: `${evento.paziente.nome} ${evento.paziente.cognome}`
        } : null,
      })) || []
    } catch (error) {
      console.error('Errore nel recupero eventi between:', error)
      throw error
    }
  }
}
// Esportiamo anche le utility
export { EventoMapper, EventoValidator } from '@/types/backend.types'
