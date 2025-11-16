/**
 * Servizio per la gestione delle API geografiche (Province, Comuni, Stati)
 *
 * Questo file contiene tutte le chiamate HTTP per gestire i dati geografici
 * necessari per i form di pazienti e specialisti.
 */

import axios from 'axios'
import { getApiBaseUrl } from '@/config/api'

// Configurazione base per le chiamate API
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
    console.error('Errore API Geo:', error)
    return Promise.reject(error)
  }
)

export class GeoService {

  /**
   * Ottiene tutte le province italiane ordinate per nome
   * @returns {Promise<Array>} Lista delle province
   */
  static async getProvince() {
    try {
      const response = await apiClient.get('/geo/province')
      return response.data.data // Il backend restituisce { data: [...] }
    } catch (error) {
      console.error('Errore nel recupero province:', error)
      throw error
    }
  }

  /**
   * Ottiene tutti gli stati ordinati per nome
   * @returns {Promise<Array>} Lista degli stati
   */
  static async getStati() {
    try {
      const response = await apiClient.get('/geo/stati')
      return response.data.data
    } catch (error) {
      console.error('Errore nel recupero stati:', error)
      throw error
    }
  }

  /**
   * Ottiene i comuni di una specifica provincia
   * @param {number} provinciaId - ID della provincia
   * @returns {Promise<Array>} Lista dei comuni della provincia
   */
  static async getComuniByProvincia(provinciaId) {
    try {
      const response = await apiClient.get(`/geo/province/${provinciaId}/comuni`)
      return response.data.data
    } catch (error) {
      console.error(`Errore nel recupero comuni per provincia ${provinciaId}:`, error)
      throw error
    }
  }

  /**
   * Ottiene tutti i comuni italiani (per autocomplete)
   * @returns {Promise<Array>} Lista completa di tutti i comuni
   */
  static async getAllComuni() {
    try {
      const response = await apiClient.get('/geo/comuni')
      return response.data.data
    } catch (error) {
      console.error('Errore nel recupero di tutti i comuni:', error)
      throw error
    }
  }

  /**
   * Ottiene tutte le regioni italiane ordinate per nome
   * @returns {Promise<Array>} Lista delle regioni
   */
  static async getRegioni() {
    try {
      const response = await apiClient.get('/geo/regioni')
      return response.data.data // Backend restituisce { data: [...] }
    } catch (error) {
      console.error('Errore nel recupero regioni:', error)
      throw error
    }
  }
}
