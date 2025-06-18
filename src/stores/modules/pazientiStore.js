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
     * Filtra i pazienti per nome e cognome
     * @param {string} nomeCompleto - Nome e cognome da cercare
     */
    pazientiPerNome: (state) => (nomeCompleto) => {
      const termine = nomeCompleto.toLowerCase()
      return state.pazienti.filter(paziente =>
        `${paziente.nome} ${paziente.cognome}`.toLowerCase().includes(termine)
      )
    },

    /**
     * Cerca pazienti in TUTTI i campi disponibili
     * Supporta ricerca per "nome cognome", date, terapie, telefoni, indirizzi, etc.
     * @param {string} searchTerm - Termine di ricerca
     */
    searchPazienti: (state) => (searchTerm) => {
      if (!searchTerm) return state.pazienti

      const term = searchTerm.toLowerCase().trim()

      return state.pazienti.filter(paziente => {
        // Campi individuali per la ricerca (con fallback per valori null/undefined)
        const nome = paziente.nome?.toLowerCase() || ''
        const cognome = paziente.cognome?.toLowerCase() || ''
        const email = paziente.email?.toLowerCase() || ''
        const telefono = paziente.telefono?.toLowerCase() || ''
        const codiceFiscale = paziente.codiceFiscale?.toLowerCase() || ''
        const indirizzo = paziente.indirizzo?.toLowerCase() || ''

        // Data di nascita - ricerca sia formato originale che formattato
        const dataNascita = paziente.dataDiNascita ?
          new Date(paziente.dataDiNascita).toLocaleDateString('it-IT').toLowerCase() : ''
        const dataNascitaISO = paziente.dataDiNascita?.toLowerCase() || ''

        // Nome completo per ricerca combinata
        const nomeCompleto = `${nome} ${cognome}`.trim()
        const cognomeNome = `${cognome} ${nome}`.trim()

        // Ricerca nei singoli campi di base
        const matchCampiBase =
          nome.includes(term) ||
          cognome.includes(term) ||
          email.includes(term) ||
          codiceFiscale.includes(term)

        // Ricerca nei campi aggiuntivi
        const matchCampiAggiuntivi =
          telefono.includes(term) ||
          indirizzo.includes(term) ||
          dataNascita.includes(term) ||
          dataNascitaISO.includes(term)

        // Ricerca nelle combinazioni nome-cognome
        const matchCombinazioni =
          nomeCompleto.includes(term) ||
          cognomeNome.includes(term)

        // Ricerca per parole multiple separate (es: "mario 123" deve trovare tutti i termini)
        const parole = term.split(/\s+/).filter(parola => parola.length > 0)
        const matchParoleMultiple = parole.length > 1
          ? parole.every(parola =>
              nome.includes(parola) ||
              cognome.includes(parola) ||
              email.includes(parola) ||
              telefono.includes(parola) ||
              codiceFiscale.includes(parola) ||
              indirizzo.includes(parola) ||
              dataNascita.includes(parola)
            )
          : false

        // Ricerca per date in vari formati (es: "1990", "12/1990", "12/03/1990")
        const matchData = term.match(/^\d{1,4}/) ? (
          dataNascita.includes(term) ||
          dataNascitaISO.includes(term) ||
          paziente.dataDiNascita?.includes(term)
        ) : false

        return matchCampiBase ||
               matchCampiAggiuntivi ||
               matchCombinazioni ||
               matchParoleMultiple ||
               matchData
      })
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
     * Elimina un paziente
     * @param {number} pazienteId - ID del paziente da eliminare
     */
    async deletePaziente(pazienteId) {
      this.loading = true
      this.error = null

      try {
        await PazienteService.deletePaziente(pazienteId)

        // Rimuoviamo il paziente dalla lista locale
        const index = this.pazienti.findIndex(p => p.id === pazienteId)
        if (index !== -1) {
          this.pazienti.splice(index, 1)
        }

        // Se il paziente eliminato era selezionato, deselezionalo
        if (this.selectedPaziente?.id === pazienteId) {
          this.selectedPaziente = null
        }

        console.log('Paziente eliminato:', pazienteId)
      } catch (error) {
        this.error = 'Errore nell\'eliminazione del paziente'
        console.error('Errore eliminazione paziente:', error)
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
