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
}

/**
 * Servizio per la gestione degli Slot
 */
export class SlotService {

  /**
   * Ottiene tutti gli slot
   * @returns {Promise<Array>} Lista di tutti gli slot
   */
  static async getAllSlot() {
    try {
      const response = await apiClient.get('/slot')
      return response.data.data?.map(slot => EventoMapper.slotBackendToFrontend(slot)) || []
    } catch (error) {
      console.error('Errore nel recupero slot:', error)
      throw error
    }
  }

  /**
   * Ottiene slot per evento
   * @param {number} eventoId - ID dell'evento
   * @returns {Promise<Array>} Lista slot dell'evento
   */
  static async getSlotPerEvento(eventoId) {
    try {
      const response = await apiClient.get(`/slot/evento/${eventoId}`)
      return response.data.data?.map(slot => EventoMapper.slotBackendToFrontend(slot)) || []
    } catch (error) {
      console.error('Errore nel recupero slot per evento:', error)
      throw error
    }
  }

  /**
   * Crea un nuovo slot
   * @param {Object} slotData - Dati dello slot da creare
   * @returns {Promise<Object>} Slot creato
   */
  static async createSlot(slotData) {
    try {
      // Validazione dati
      const validation = EventoValidator.validateCreateSlot(slotData)
      
      if (!validation.isValid) {
        throw new Error(`Dati slot non validi: ${Object.values(validation.errors).join(', ')}`)
      }

      const response = await apiClient.post('/slot', slotData)
      return EventoMapper.slotBackendToFrontend(response.data.data)
    } catch (error) {
      console.error('Errore nella creazione slot:', error)
      throw error
    }
  }

  /**
   * Aggiorna uno slot esistente
   * @param {Object} slotData - Dati dello slot da aggiornare (deve includere id)
   * @returns {Promise<Object>} Slot aggiornato
   */
  static async updateSlot(slotData) {
    try {
      const response = await apiClient.patch('/slot', slotData)
      return EventoMapper.slotBackendToFrontend(response.data.data)
    } catch (error) {
      console.error('Errore nell\'aggiornamento slot:', error)
      throw error
    }
  }

  /**
   * Elimina uno slot
   * @param {number} slotId - ID dello slot da eliminare
   * @returns {Promise<void>}
   */
  static async deleteSlot(slotId) {
    try {
      await apiClient.delete(`/slot/${slotId}`)
    } catch (error) {
      console.error('Errore nell\'eliminazione slot:', error)
      throw error
    }
  }

  /**
   * Prenota uno slot per un paziente
   * @param {number} slotId - ID dello slot
   * @param {number} pazienteId - ID del paziente
   * @returns {Promise<Object>} Slot prenotato
   */
  static async prenotaSlot(slotId, pazienteId) {
    try {
      const response = await apiClient.patch(`/slot/${slotId}/prenota`, {
        pazienteId
      })
      return EventoMapper.slotBackendToFrontend(response.data.data)
    } catch (error) {
      console.error('Errore nella prenotazione slot:', error)
      throw error
    }
  }

  /**
   * Libera uno slot (rimuove prenotazione)
   * @param {number} slotId - ID dello slot
   * @returns {Promise<Object>} Slot liberato
   */
  static async liberaSlot(slotId) {
    try {
      const response = await apiClient.patch(`/slot/${slotId}/libera`)
      return EventoMapper.slotBackendToFrontend(response.data.data)
    } catch (error) {
      console.error('Errore nella liberazione slot:', error)
      throw error
    }
  }
}

/**
 * Servizio combinato per operazioni complesse
 */
export class CalendarioService {

  /**
   * Crea un evento con i suoi slot automaticamente
   * @param {Object} eventoData - Dati dell'evento
   * @param {Object} config - Configurazione per la creazione degli slot
   * @returns {Promise<Object>} Evento creato con slot
   */
  static async creaEventoConSlot(eventoData, config = {}) {
    try {
      // Prima crea l'evento
      const eventoCreato = await EventoService.createEvento(eventoData)
      
      // Poi crea gli slot se richiesti
      if (config.creaSlot && eventoCreato.postiDisponibili > 0) {
        const slots = []
        const durataSlotMinuti = config.durataSlotMinuti || 60 // Default 1 ora per slot
        
        const dataInizio = new Date(eventoCreato.dataInizio)
        const dataFine = new Date(eventoCreato.dataFine)
        const durataEventoMinuti = (dataFine - dataInizio) / (1000 * 60)
        
        // Calcola quanti slot creare
        const numeroSlot = Math.min(
          Math.floor(durataEventoMinuti / durataSlotMinuti),
          eventoCreato.postiDisponibili
        )
        
        // Crea gli slot
        for (let i = 0; i < numeroSlot; i++) {
          const slotInizio = new Date(dataInizio.getTime() + (i * durataSlotMinuti * 60 * 1000))
          const slotFine = new Date(slotInizio.getTime() + (durataSlotMinuti * 60 * 1000))
          
          const slotData = new CreateSlotDto({
            dataInizio: slotInizio.toISOString(),
            dataFine: slotFine.toISOString(),
            eventoId: eventoCreato.id
          })
          
          const slot = await SlotService.createSlot(slotData)
          slots.push(slot)
        }
        
        eventoCreato.slots = slots
      }
      
      return eventoCreato
    } catch (error) {
      console.error('Errore nella creazione evento con slot:', error)
      throw error
    }
  }

  /**
   * Ottiene la vista calendario completa per un range di date
   * @param {string} dataInizio - Data inizio
   * @param {string} dataFine - Data fine  
   * @returns {Promise<Object>} Dati completi calendario
   */
  static async getVistaCalendario(dataInizio, dataFine) {
    try {
      const [eventi, slots] = await Promise.all([
        EventoService.getEventiPerRange(dataInizio, dataFine),
        SlotService.getAllSlot()
      ])
      
      // Combina eventi e slot
      const eventiConSlot = eventi.map(evento => {
        const slotEvento = slots.filter(slot => slot.evento?.id === evento.id)
        return {
          ...evento,
          slots: slotEvento
        }
      })
      
      return {
        eventi: eventiConSlot,
        slots,
        statistiche: {
          totaleEventi: eventi.length,
          totaleSlot: slots.length,
          slotPrenotati: slots.filter(slot => slot.paziente).length,
          slotLiberi: slots.filter(slot => !slot.paziente).length
        }
      }
    } catch (error) {
      console.error('Errore nel recupero vista calendario:', error)
      throw error
    }
  }

  /**
   * Verifica disponibilità per un nuovo evento
   * @param {Object} eventoData - Dati dell'evento da verificare
   * @returns {Promise<Object>} Risultato verifica disponibilità
   */
  static async verificaDisponibilita(eventoData) {
    try {
      const dataInizio = new Date(eventoData.dataInizio).toISOString().split('T')[0]
      const dataFine = new Date(eventoData.dataFine).toISOString().split('T')[0]
      
      const eventiEsistenti = await EventoService.getEventiPerRange(dataInizio, dataFine)
      
      // Verifica sovrapposizioni
      const sovrapposizioni = eventiEsistenti.filter(evento => {
        const eventoInizio = new Date(evento.dataInizio)
        const eventoFine = new Date(evento.dataFine)
        const nuovoInizio = new Date(eventoData.dataInizio)
        const nuovoFine = new Date(eventoData.dataFine)
        
        // Verifica se il professionista è lo stesso
        const stessoProfessionista = evento.professionista === eventoData.professionista ||
                                   evento.specialista?.nomeCompleto === eventoData.specialista?.nomeCompleto
        
        // Verifica sovrapposizione temporale
        const sovrapposizioneTempo = (nuovoInizio < eventoFine) && (nuovoFine > eventoInizio)
        
        return stessoProfessionista && sovrapposizioneTempo
      })
      
      return {
        disponibile: sovrapposizioni.length === 0,
        sovrapposizioni,
        suggerimenti: sovrapposizioni.length > 0 ? [
          'Modifica l\'orario dell\'evento',
          'Scegli un altro professionista',
          'Verifica la disponibilità in altri giorni'
        ] : []
      }
    } catch (error) {
      console.error('Errore nella verifica disponibilità:', error)
      throw error
    }
  }
}

// Esportiamo anche le utility
export { EventoMapper, EventoValidator } from '@/types/backend.types'
