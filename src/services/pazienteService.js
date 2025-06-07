/**
 * Servizio per la gestione delle API dei Pazienti
 *
 * Questo file contiene tutte le chiamate HTTP per gestire i pazienti.
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
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Errore API:', error)
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
      const response = await apiClient.get('/paziente')
      return response.data.data // Il backend restituisce { data: [...] }
    } catch (error) {
      console.error('Errore nel recupero pazienti:', error)
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
}

// Esportiamo anche le costanti per i tipi di terapia
export const TIPI_TERAPIA = {
  LOGOPEDIA: 'LOGOPEDIA',
  NEUROPSICHIATRIA_INFANTILE: 'NEUROPSICHIATRIA_INFANTILE',
  NEUROPSICOMOTRICITÀ: 'NEUROPSICOMOTRICITÀ',
  TERAPIA_ABA: 'TERAPIA_ABA',
  PSICOLOGA: 'PSICOLOGA',
  COLLOQUIO_CONOSCITIVO: 'COLLOQUIO_CONOSCITIVO'
}

// Esportiamo anche un array per i select
export const TIPI_TERAPIA_OPTIONS = [
  { value: TIPI_TERAPIA.LOGOPEDIA, label: 'Logopedia' },
  { value: TIPI_TERAPIA.NEUROPSICHIATRIA_INFANTILE, label: 'Neuropsichiatria Infantile' },
  { value: TIPI_TERAPIA.NEUROPSICOMOTRICITÀ, label: 'Neuropsicomotricità' },
  { value: TIPI_TERAPIA.TERAPIA_ABA, label: 'Terapia ABA' },
  { value: TIPI_TERAPIA.PSICOLOGA, label: 'Psicologa' },
  { value: TIPI_TERAPIA.COLLOQUIO_CONOSCITIVO, label: 'Colloquio Conoscitivo' }
]
