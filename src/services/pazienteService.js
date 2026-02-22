/**
 * Servizio per la gestione delle API dei Pazienti
 */

import httpClient from './httpClient'

export class PazienteService {

  /**
   * Ottiene tutti i pazienti
   * @returns {Promise<Array>} Lista di tutti i pazienti
   */
  static async getAllPazienti() {
    const response = await httpClient.get('/paziente')
    const result = response.data.data || response.data
    return Array.isArray(result) ? result : []
  }

  /**
   * Ottiene i pazienti con paginazione per DataTables
   * @param {Object} params - Parametri di paginazione
   * @returns {Promise<Object>} Risposta paginata
   */
  static async getPazientiPaginated(params) {
    const response = await httpClient.get('/paziente/dt', { params })
    return response.data
  }

  /**
   * Crea un nuovo paziente
   * @param {Object} pazienteData - Dati del paziente da creare
   * @returns {Promise<Object>} Paziente creato
   */
  static async createPaziente(pazienteData) {
    const response = await httpClient.post('/paziente', pazienteData)
    return response.data.data
  }

  /**
   * Aggiorna un paziente esistente
   * @param {Object} pazienteData - Dati del paziente da aggiornare (deve includere id)
   * @returns {Promise<Object>} Paziente aggiornato
   */
  static async updatePaziente(pazienteData) {
    const response = await httpClient.patch('/paziente', pazienteData)
    return response.data.data
  }

  /**
   * Elimina un paziente
   * @param {number} pazienteId - ID del paziente da eliminare
   * @returns {Promise<void>}
   */
  static async deletePaziente(pazienteId) {
    await httpClient.delete(`/paziente/${pazienteId}`)
  }

  /**
   * Importa pazienti da file Excel
   * @param {File} file - File Excel da importare
   * @returns {Promise<Object>} Oggetto con pazienti validi e invalidi
   */
  static async importFromExcel(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await httpClient.post('/paziente/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    })

    return response.data.data
  }
}
