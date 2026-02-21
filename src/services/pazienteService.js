/**
 * Servizio per la gestione delle API dei Pazienti
 *
 * Questo file contiene tutte le chiamate HTTP per gestire i pazienti.
 * Utilizziamo axios per le chiamate HTTP e organizziamo tutto in una classe.
 */

import axios from 'axios'
import { getApiBaseUrl } from '@/config/api'

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

// Interceptor per il debug delle richieste
apiClient.interceptors.request.use(
  (config) => {
    console.log('🚀 Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers
    })
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// Interceptor per gestire errori globalmente
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    })
    return response
  },
  (error) => {
    console.error('❌ Response Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data
    })
    return Promise.reject(error)
  }
)

export class PazienteService {

  /**
   * Ottiene tutti i pazienti
   * @returns {Promise<Array>} Lista di tutti i pazienti
   */
  static async getAllPazienti() {
    try {
      const url = '/paziente'
      console.log('Service: URL chiamata:', `${API_BASE_URL}${url}`)
      console.log('Service: API_BASE_URL:', API_BASE_URL)
      console.log('Service: Chiamata a GET /paziente')

      const response = await apiClient.get(url)
      console.log('Service: Risposta completa:', response)
      console.log('Service: Status:', response.status)
      console.log('Service: Headers:', response.headers)
      console.log('Service: response.data:', response.data)

      // Il backend restituisce { data: [...] } o direttamente l'array?
      const result = response.data.data || response.data
      console.log('Service: Risultato finale:', result)

      // Verifica che sia un array
      if (Array.isArray(result)) {
        return result
      } else {
        console.error('Service: Il risultato non è un array:', result)
        return []
      }
    } catch (error) {
      console.error('Errore nel recupero pazienti:', error)
      console.error('Dettagli errore:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      throw error
    }
  }

  /**
   * Ottiene i pazienti con paginazione per DataTables
   * @param {Object} params - Parametri di paginazione
   * @returns {Promise<Object>} Risposta paginata
   */
  static async getPazientiPaginated(params) {
    try {
      const response = await apiClient.get('/paziente/dt', { params })
      return response.data
    } catch (error) {
      console.error('Errore nel recupero pazienti paginati:', error)
      throw error
    }
  }

  /**
   * Crea un nuovo paziente
   * @param {Object} pazienteData - Dati del paziente da creare
   * @returns {Promise<Object>} Paziente creato
   */
  static async createPaziente(pazienteData) {
    try {
      const response = await apiClient.post('/paziente', pazienteData)
      return response.data.data
    } catch (error) {
      console.error('Errore nella creazione paziente:', error)
      throw error
    }
  }

  /**
   * Aggiorna un paziente esistente
   * @param {Object} pazienteData - Dati del paziente da aggiornare (deve includere id)
   * @returns {Promise<Object>} Paziente aggiornato
   */
  static async updatePaziente(pazienteData) {
    try {
      const response = await apiClient.patch('/paziente', pazienteData)
      return response.data.data
    } catch (error) {
      console.error('Errore nell\'aggiornamento paziente:', error)
      throw error
    }
  }

  /**
   * Elimina un paziente
   * @param {number} pazienteId - ID del paziente da eliminare
   * @returns {Promise<void>}
   */
  static async deletePaziente(pazienteId) {
    try {
      await apiClient.delete(`/paziente/${pazienteId}`)
    } catch (error) {
      console.error('Errore nell\'eliminazione paziente:', error)
      throw error
    }
  }

  /**
   * Importa pazienti da file Excel
   * @param {File} file - File Excel da importare
   * @returns {Promise<Object>} Oggetto con pazienti validi e invalidi
   */
  static async importFromExcel(file) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(`${API_BASE_URL}/paziente/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // timeout di 30 secondi per upload
      })

      return response.data.data
    } catch (error) {
      console.error('Errore nell\'import da Excel:', error)
      throw error
    }
  }
}

// Le costanti per i tipi di terapia sono state rimosse
// perché il tipo terapia non è più associato direttamente al paziente.
// Ora il tipo di terapia è determinato dalla prestazione dello specialista
// quando viene creato un evento/appuntamento.
