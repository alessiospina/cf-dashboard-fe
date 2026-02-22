/**
 * Servizio per la gestione delle API delle Prestazioni
 *
 * Questo file contiene tutte le chiamate HTTP per gestire le prestazioni.
 * Utilizziamo axios per le chiamate HTTP e organizziamo tutto in una classe.
 */

import httpClient from './httpClient'

export class PrestazioneService {
  /**
   * Ottiene tutte le prestazioni
   * @returns {Promise<Array>} Lista di tutte le prestazioni
   */
  static async getAllPrestazioni() {
    try {
      const response = await httpClient.get('/prestazione')
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
      const response = await httpClient.get(`/prestazione/${id}`)
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
      const response = await httpClient.post('/prestazione', prestazioneData)
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
      const response = await httpClient.put(`/prestazione/${id}`, prestazioneData)
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
      await httpClient.delete(`/prestazione/${id}`)
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
