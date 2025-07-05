/**
 * Servizio per la gestione delle API delle Attività
 *
 * Questo file contiene tutte le chiamate HTTP per gestire le attività del centro.
 * Le attività sono eventi con informazioni complete di paziente, specialista e prestazione.
 * Utilizza axios e si basa sull'endpoint esistente /api/evento/between.
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

// Interceptor per gestire errori globalmente
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Errore API Attività:', error)
    return Promise.reject(error)
  }
)

/**
 * Servizio per la gestione delle Attività
 * Le attività sono eventi con informazioni complete di paziente, specialista e prestazione
 */
export class AttivitaService {

  /**
   * Ottiene tutte le attività dell'anno corrente
   * @returns {Promise<Array>} Lista di tutte le attività dell'anno corrente
   */
  static async getAllAttivitaAnnoCorrente() {
    try {
      const annoCorrente = new Date().getFullYear()
      const dataInizio = `${annoCorrente}-01-01`
      const dataFine = `${annoCorrente}-12-31`

      return await this.getAttivitaBetween(dataInizio, dataFine)
    } catch (error) {
      console.error('Errore nel recupero attività anno corrente:', error)
      throw error
    }
  }

  /**
   * Ottiene attività per un intervallo di date usando l'endpoint /between
   * @param {string} dataInizio - Data inizio in formato YYYY-MM-DD
   * @param {string} dataFine - Data fine in formato YYYY-MM-DD
   * @returns {Promise<Array>} Lista attività nell'intervallo specificato
   */
  static async getAttivitaBetween(dataInizio, dataFine) {
    try {
      const response = await apiClient.get('/evento/between', {
        params: {
          from: dataInizio,
          to: dataFine
        }
      })

      // Mappa i dati del backend al formato frontend per le attività
      return response.data.data?.map(attivita => this.mapBackendToFrontend(attivita)) || []
    } catch (error) {
      console.error('Errore nel recupero attività between:', error)
      throw error
    }
  }

  /**
   * Ottiene lista di tutte le prestazioni per i filtri
   * @returns {Promise<Array>} Lista prestazioni
   */
  static async getPrestazioni() {
    try {
      const response = await apiClient.get('/prestazione')
      return response.data.data || []
    } catch (error) {
      console.error('Errore nel recupero prestazioni:', error)
      throw error
    }
  }

  /**
   * Ottiene lista di tutti gli specialisti per i filtri
   * @returns {Promise<Array>} Lista specialisti
   */
  static async getSpecialisti() {
    try {
      const response = await apiClient.get('/specialista')
      return response.data.data || []
    } catch (error) {
      console.error('Errore nel recupero specialisti:', error)
      throw error
    }
  }

  /**
   * Mappa un'attività dal formato backend al formato frontend
   * @param {Object} attivitaBackend - Attività nel formato backend
   * @returns {Object} - Attività nel formato frontend ottimizzato per la tabella
   */
  static mapBackendToFrontend(attivitaBackend) {
    // Debug per vedere la struttura del backend
    console.log('AttivitaService - Dati backend originali:', attivitaBackend)
    console.log('AttivitaService - Campo date:', attivitaBackend.date)
    console.log('AttivitaService - Campo dataInizio:', attivitaBackend.dataInizio)
    console.log('AttivitaService - Campo dataFine:', attivitaBackend.dataFine)

    return {
      // ID dell'evento
      id: attivitaBackend.id,

      // Informazioni del paziente
      paziente: attivitaBackend.paziente ? {
        id: attivitaBackend.paziente.id,
        nome: attivitaBackend.paziente.nome,
        cognome: attivitaBackend.paziente.cognome,
        nomeCompleto: `${attivitaBackend.paziente.nome} ${attivitaBackend.paziente.cognome}`.trim(),
        codiceFiscale: attivitaBackend.paziente.codiceFiscale,
        dataDiNascita: attivitaBackend.paziente.dataDiNascita,
        email: attivitaBackend.paziente.email,
        telefono: attivitaBackend.paziente.telefono
      } : null,

      // Informazioni dell'evento
      evento: {
        id: attivitaBackend.id,
        titolo: attivitaBackend.titolo,
        stanza: attivitaBackend.stanza,
        // Il backend potrebbe usare 'date' o 'dataInizio/dataFine'
        dataInizio: attivitaBackend.dataInizio || attivitaBackend.date,
        dataFine: attivitaBackend.dataFine || attivitaBackend.date,
        // Estrae solo la data (senza orario) dal campo disponibile
        dataEvento: (attivitaBackend.dataInizio || attivitaBackend.date) ?
          new Date(attivitaBackend.dataInizio || attivitaBackend.date).toISOString().split('T')[0] : null
      },

      // Informazioni dello specialista e prestazione
      specialista: attivitaBackend.specialista ? {
        id: attivitaBackend.specialista.id,
        nome: attivitaBackend.specialista.nome,
        cognome: attivitaBackend.specialista.cognome,
        nomeCompleto: `${attivitaBackend.specialista.nome} ${attivitaBackend.specialista.cognome}`.trim(),
        email: attivitaBackend.specialista.email,
        telefono: attivitaBackend.specialista.telefono,
        prestazione: attivitaBackend.specialista.prestazione
      } : null,

      // Informazioni della prestazione (estratte dallo specialista)
      prestazione: attivitaBackend.specialista?.prestazione ? {
        id: attivitaBackend.specialista.prestazione.id,
        tipologia: attivitaBackend.specialista.prestazione.tipologia,
        color: attivitaBackend.specialista.prestazione.color
      } : null,

      // Metadati
      createdAt: attivitaBackend.createdAt
    }
  }

  /**
   * Filtra le attività in base ai criteri forniti
   * @param {Array} attivita - Lista delle attività
   * @param {Object} filtri - Oggetto con i filtri da applicare
   * @param {number|null} filtri.prestazioneId - ID prestazione per filtrare
   * @param {number|null} filtri.specialistaId - ID specialista per filtrare
   * @param {string|null} filtri.dataInizio - Data inizio per filtrare (YYYY-MM-DD)
   * @param {string|null} filtri.dataFine - Data fine per filtrare (YYYY-MM-DD)
   * @returns {Array} - Attività filtrate
   */
  static filtraAttivita(attivita, filtri) {
    return attivita.filter(attivita => {
      // Esclude eventi che non hanno né paziente né specialista
      if (!attivita.paziente && !attivita.specialista) {
        return false
      }

      // Filtro per prestazione
      if (filtri.prestazioneId && filtri.prestazioneId !== '' &&
          attivita.prestazione?.id !== parseInt(filtri.prestazioneId)) {
        return false
      }

      // Filtro per specialista
      if (filtri.specialistaId && filtri.specialistaId !== '' &&
          attivita.specialista?.id !== parseInt(filtri.specialistaId)) {
        return false
      }

      // Filtro per range di date
      if (filtri.dataInizio || filtri.dataFine) {
        const dataAttivita = attivita.evento.dataEvento
        if (!dataAttivita) return false

        if (filtri.dataInizio && dataAttivita < filtri.dataInizio) {
          return false
        }

        if (filtri.dataFine && dataAttivita > filtri.dataFine) {
          return false
        }
      }

      return true
    })
  }
}

// Esportiamo anche utilities utili
export default AttivitaService
