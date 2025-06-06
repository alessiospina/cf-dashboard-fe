/**
 * Store Pinia per la gestione dello stato dei Pazienti
 * 
 * Questo store mantiene lo stato globale relativo ai pazienti:
 * - Lista dei pazienti
 * - Stato di loading
 * - Errori
 * - Azioni per modificare i dati
 */

import { defineStore } from 'pinia'
import { PazienteService } from '@/services/pazienteService'

export const usePazientiStore = defineStore('pazienti', {
  // STATE: definisce i dati reattivi dello store
  state: () => ({
    // Lista di tutti i pazienti
    pazienti: [],
    
    // Stato di caricamento per le operazioni async
    loading: false,
    
    // Gestione errori
    error: null,
    
    // Stato per la paginazione
    pagination: {
      currentPage: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0
    },
    
    // Paziente selezionato per modifica
    selectedPaziente: null
  }),

  // GETTERS: funzioni computate che derivano dai dati dello state
  getters: {
    /**
     * Ritorna true se ci sono pazienti caricati
     */
    hasPazienti: (state) => state.pazienti.length > 0,
    
    /**
     * Ritorna il numero totale di pazienti
     */
    totalPazienti: (state) => state.pazienti.length,
    
    /**
     * Filtra i pazienti per tipo di terapia
     * @param {string} tipo - Tipo di terapia da filtrare
     */
    pazientiPerTerapia: (state) => (tipo) => {
      return state.pazienti.filter(paziente => paziente.tipoTerapia === tipo)
    },
    
    /**
     * Cerca pazienti per nome o cognome
     * @param {string} searchTerm - Termine di ricerca
     */
    searchPazienti: (state) => (searchTerm) => {
      if (!searchTerm) return state.pazienti
      
      const term = searchTerm.toLowerCase()
      return state.pazienti.filter(paziente => 
        paziente.nome.toLowerCase().includes(term) ||
        paziente.cognome.toLowerCase().includes(term) ||
        paziente.email.toLowerCase().includes(term)
      )
    }
  },

  // ACTIONS: metodi per modificare lo state
  actions: {
    /**
     * Carica tutti i pazienti dal backend
     */
    async fetchPazienti() {
      this.loading = true
      this.error = null
      
      try {
        const pazienti = await PazienteService.getAllPazienti()
        this.pazienti = pazienti
        console.log('Pazienti caricati:', pazienti.length)
      } catch (error) {
        this.error = 'Errore nel caricamento dei pazienti'
        console.error('Errore fetch pazienti:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Carica pazienti con paginazione
     * @param {Object} params - Parametri di paginazione
     */
    async fetchPazientiPaginated(params = {}) {
      this.loading = true
      this.error = null
      
      try {
        const response = await PazienteService.getPazientiPaginated(params)
        
        // Aggiorniamo i pazienti e la paginazione
        this.pazienti = response.data || []
        this.pagination = {
          currentPage: params.page || 1,
          pageSize: params.pageSize || 10,
          totalItems: response.recordsTotal || 0,
          totalPages: Math.ceil((response.recordsTotal || 0) / (params.pageSize || 10))
        }
        
        console.log('Pazienti paginati caricati:', this.pazienti.length)
      } catch (error) {
        this.error = 'Errore nel caricamento dei pazienti'
        console.error('Errore fetch pazienti paginati:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Crea un nuovo paziente
     * @param {Object} pazienteData - Dati del nuovo paziente
     */
    async createPaziente(pazienteData) {
      this.loading = true
      this.error = null
      
      try {
        const nuovoPaziente = await PazienteService.createPaziente(pazienteData)
        
        // Aggiungiamo il nuovo paziente alla lista
        this.pazienti.unshift(nuovoPaziente)
        
        console.log('Paziente creato:', nuovoPaziente)
        return nuovoPaziente
      } catch (error) {
        this.error = 'Errore nella creazione del paziente'
        console.error('Errore creazione paziente:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Aggiorna un paziente esistente
     * @param {Object} pazienteData - Dati del paziente da aggiornare
     */
    async updatePaziente(pazienteData) {
      this.loading = true
      this.error = null
      
      try {
        const pazienteAggiornato = await PazienteService.updatePaziente(pazienteData)
        
        // Troviamo l'indice del paziente da aggiornare
        const index = this.pazienti.findIndex(p => p.id === pazienteAggiornato.id)
        if (index !== -1) {
          // Sostituiamo il paziente nella lista
          this.pazienti[index] = pazienteAggiornato
        }
        
        console.log('Paziente aggiornato:', pazienteAggiornato)
        return pazienteAggiornato
      } catch (error) {
        this.error = 'Errore nell\'aggiornamento del paziente'
        console.error('Errore aggiornamento paziente:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Seleziona un paziente per la modifica
     * @param {Object} paziente - Paziente da selezionare
     */
    selectPaziente(paziente) {
      this.selectedPaziente = { ...paziente } // Cloniamo l'oggetto
    },

    /**
     * Deseleziona il paziente corrente
     */
    clearSelectedPaziente() {
      this.selectedPaziente = null
    },

    /**
     * Reset dell'errore
     */
    clearError() {
      this.error = null
    }
  }
})
