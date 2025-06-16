/**
 * Servizio per la gestione delle API delle Prestazioni
 *
 * Questo file contiene tutte le chiamate HTTP per gestire le prestazioni.
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
    console.error('Errore API Prestazioni:', error)
    return Promise.reject(error)
  }
)

export class PrestazioneService {
  /**
   * Ottiene tutte le prestazioni
   * @returns {Promise<Array>} Lista di tutte le prestazioni
   */
  static async getAllPrestazioni() {
    try {
      const response = await apiClient.get('/prestazione')
      return response.data.data // Il backend restituisce { data: [...] }
    } catch (error) {
      console.error('Errore nel recupero prestazioni:', error)
      throw error
    }
  }

  /**
   * Ottiene una prestazione per ID
   * @param {number} id - ID della prestazione
   * @returns {Promise<Object>} Prestazione trovata
   */
  static async getPrestazioneById(id) {
    try {
      const response = await apiClient.get(`/prestazione/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Errore nel recupero prestazione:', error)
      throw error
    }
  }

  /**
   * Crea una nuova prestazione
   * @param {Object} prestazioneData - Dati della prestazione da creare
   * @returns {Promise<Object>} Prestazione creata
   */
  static async createPrestazione(prestazioneData) {
    try {
      const response = await apiClient.post('/prestazione', prestazioneData)
      return response.data.data
    } catch (error) {
      console.error('Errore nella creazione prestazione:', error)
      throw error
    }
  }

  /**
   * Aggiorna una prestazione esistente
   * @param {number} id - ID della prestazione da aggiornare
   * @param {Object} prestazioneData - Dati della prestazione da aggiornare
   * @returns {Promise<Object>} Prestazione aggiornata
   */
  static async updatePrestazione(id, prestazioneData) {
    try {
      const response = await apiClient.put(`/prestazione/${id}`, prestazioneData)
      return response.data.data
    } catch (error) {
      console.error('Errore nell\'aggiornamento prestazione:', error)
      throw error
    }
  }

  /**
   * Elimina una prestazione
   * @param {number} id - ID della prestazione da eliminare
   * @returns {Promise<void>}
   */
  static async deletePrestazione(id) {
    try {
      await apiClient.delete(`/prestazione/${id}`)
    } catch (error) {
      console.error('Errore nell\'eliminazione prestazione:', error)
      throw error
    }
  }
}

// Colori predefiniti per le prestazioni
export const COLORI_PRESTAZIONE = [
  '#007bff', // Blu primario
  '#28a745', // Verde
  '#ffc107', // Giallo
  '#dc3545', // Rosso
  '#6f42c1', // Viola
  '#fd7e14', // Arancione
  '#20c997', // Teal
  '#e83e8c', // Rosa
  '#6c757d', // Grigio
  '#17a2b8'  // Ciano
]

// Opzioni per il color picker
export const COLORI_PRESTAZIONE_OPTIONS = COLORI_PRESTAZIONE.map((color, index) => ({
  value: color,
  label: `Colore ${index + 1}`,
  color: color
}))
