/**
 * Servizio per la gestione delle API degli Specialisti
 *
 * Questo file contiene tutte le chiamate HTTP per gestire gli specialisti.
 * Utilizziamo axios per le chiamate HTTP e organizziamo tutto in una classe.
 */

import axios from 'axios'

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
apiClient.interceptors.request.use(
  (config) => {
    console.log('📤 [SpecialistaService] Richiesta in uscita:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      data: config.data,
      headers: config.headers
    })
    return config
  },
  (error) => {
    console.error('❌ [SpecialistaService] Errore nella richiesta:', error)
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => {
    console.log('📥 [SpecialistaService] Risposta ricevuta:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    })
    return response
  },
  (error) => {
    console.error('❌ [SpecialistaService] Errore nella risposta:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    })
    return Promise.reject(error)
  }
)

export class SpecialistaService {
  /**
   * Test di connettività al backend
   * @returns {Promise<boolean>} True se il backend è raggiungibile
   */
  static async testConnection() {
    console.log('🔍 [SpecialistaService] Test connessione backend...')
    try {
      const response = await apiClient.get('/specialista')
      console.log('✅ [SpecialistaService] Backend raggiungibile, status:', response.status)
      return true
    } catch (error) {
      console.error('❌ [SpecialistaService] Backend non raggiungibile:', error.message)
      return false
    }
  }
  /**
   * Ottiene tutti gli specialisti
   * @returns {Promise<Array>} Lista di tutti gli specialisti
   */
  static async getAllSpecialisti() {
    try {
      const response = await apiClient.get('/specialista')
      return response.data.data // Il backend restituisce { data: [...] }
    } catch (error) {
      console.error('Errore nel recupero specialisti:', error)
      throw error
    }
  }

  /**
   * Ottiene uno specialista per ID
   * @param {number} id - ID dello specialista
   * @returns {Promise<Object>} Specialista trovato
   */
  static async getSpecialistaById(id) {
    try {
      const response = await apiClient.get(`/specialista/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Errore nel recupero specialista:', error)
      throw error
    }
  }

  /**
   * Crea un nuovo specialista
   * @param {Object} specialistaData - Dati dello specialista da creare
   * @returns {Promise<Object>} Specialista creato
   */
  static async createSpecialista(specialistaData) {
    try {
      const response = await apiClient.post('/specialista', specialistaData)
      return response.data.data
    } catch (error) {
      console.error('Errore nella creazione specialista:', error)
      throw error
    }
  }

  /**
   * Aggiorna uno specialista esistente
   * @param {number} id - ID dello specialista da aggiornare
   * @param {Object} specialistaData - Dati dello specialista da aggiornare
   * @returns {Promise<Object>} Specialista aggiornato
   */
  static async updateSpecialista(id, specialistaData) {
    console.log('🔄 [SpecialistaService] Inizio updateSpecialista')
    console.log('🆔 [SpecialistaService] ID ricevuto:', id, 'Tipo:', typeof id)
    console.log('📝 [SpecialistaService] Dati ricevuti:', specialistaData)

    try {
      // Validazione base dei parametri
      if (!id) {
        console.error('❌ [SpecialistaService] ID mancante o non valido')
        throw new Error('ID specialista mancante')
      }

      if (!specialistaData) {
        console.error('❌ [SpecialistaService] Dati specialista mancanti')
        throw new Error('Dati specialista mancanti')
      }

      const url = `/specialista/${id}`
      console.log('🌐 [SpecialistaService] URL chiamata:', `${API_BASE_URL}${url}`)
      console.log('📤 [SpecialistaService] Payload inviato:', JSON.stringify(specialistaData, null, 2))

      console.log('🚀 [SpecialistaService] Eseguendo chiamata PUT...')
      const response = await apiClient.put(url, specialistaData)

      console.log('📥 [SpecialistaService] Risposta ricevuta:')
      console.log('📊 [SpecialistaService] Status:', response.status)
      console.log('📋 [SpecialistaService] Headers:', response.headers)
      console.log('📄 [SpecialistaService] Data completa:', response.data)
      console.log('👤 [SpecialistaService] Specialista aggiornato:', response.data.data)

      return response.data.data
    } catch (error) {
      console.error('❌ [SpecialistaService] Errore nell\'aggiornamento specialista:')
      console.error('🔍 [SpecialistaService] Tipo errore:', error.constructor.name)
      console.error('💬 [SpecialistaService] Messaggio:', error.message)

      if (error.response) {
        console.error('📡 [SpecialistaService] Errore HTTP:')
        console.error('📊 [SpecialistaService] Status:', error.response.status)
        console.error('📋 [SpecialistaService] Headers risposta:', error.response.headers)
        console.error('📄 [SpecialistaService] Body risposta:', error.response.data)
      } else if (error.request) {
        console.error('🌐 [SpecialistaService] Nessuna risposta ricevuta:')
        console.error('📤 [SpecialistaService] Request:', error.request)
      } else {
        console.error('⚙️ [SpecialistaService] Errore di configurazione:', error.message)
      }

      console.error('📚 [SpecialistaService] Stack trace:', error.stack)
      throw error
    }
  }

  /**
   * Elimina uno specialista
   * @param {number} id - ID dello specialista da eliminare
   * @returns {Promise<void>}
   */
  static async deleteSpecialista(id) {
    try {
      await apiClient.delete(`/specialista/${id}`)
    } catch (error) {
      console.error('Errore nell\'eliminazione specialista:', error)
      throw error
    }
  }
}
