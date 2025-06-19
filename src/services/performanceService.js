/**
 * Servizio per la gestione delle Performance e Statistiche
 * 
 * Questo servizio elabora i dati degli eventi per generare
 * metriche e statistiche sui guadagni del centro.
 */

import { EventoService } from './calendarioService.js'

/**
 * Servizio per le Performance Analytics
 */
export class PerformanceService {

  /**
   * Ottiene tutti i dati performance per un anno specifico
   * @param {number} anno - Anno di riferimento (es: 2025)
   * @returns {Promise<Object>} Oggetto con tutte le metriche performance
   */
  static async getPerformanceAnnuale(anno) {
    try {
      // Recuperiamo tutti gli eventi dell'anno specificato
      const dataInizio = `${anno}-01-01`
      const dataFine = `${anno}-12-31`
      
      const eventi = await EventoService.getEventiBetween(dataInizio, dataFine)
      
      // Elaboriamo i dati per ottenere tutte le metriche
      return {
        cards: this.calcolaCardsMetrics(eventi),
        guadagniPerMese: this.calcolaGuadagniPerMese(eventi, anno),
        guadagniPerSpecialista: this.calcolaGuadagniPerSpecialista(eventi)
      }
    } catch (error) {
      console.error('Errore nel recupero performance annuale:', error)
      throw error
    }
  }

  /**
   * Calcola le metriche per le 4 cards della dashboard
   * @param {Array} eventi - Lista degli eventi
   * @returns {Object} Oggetto con le metriche delle cards
   */
  static calcolaCardsMetrics(eventi) {
    // Totale pazienti unici
    const pazientiUnici = new Set(
      eventi
        .filter(evento => evento.paziente && evento.paziente.id)
        .map(evento => evento.paziente.id)
    ).size

    // Totale eventi
    const totaleEventi = eventi.length

    // Totale guadagno (somma di tutti i prezzi)
    const totaleGuadagno = eventi.reduce((sum, evento) => {
      return sum + (evento.prezzo || 0)
    }, 0)

    // Media guadagno per evento
    const eventiConPrezzo = eventi.filter(evento => evento.prezzo && evento.prezzo > 0)
    const mediaGuadagnoEvento = eventiConPrezzo.length > 0 
      ? totaleGuadagno / eventiConPrezzo.length 
      : 0

    return {
      totalePatzienti: pazientiUnici,
      totaleEventi: totaleEventi,
      totaleGuadagno: totaleGuadagno,
      mediaGuadagnoEvento: mediaGuadagnoEvento
    }
  }

  /**
   * Calcola i guadagni raggrupppati per mese
   * @param {Array} eventi - Lista degli eventi
   * @param {number} anno - Anno di riferimento
   * @returns {Array} Array con guadagni per ogni mese
   */
  static calcolaGuadagniPerMese(eventi, anno) {
    // Array dei nomi dei mesi in italiano
    const nomiMesi = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ]

    // Inizializziamo tutti i mesi con guadagno 0
    const guadagniMensili = Array.from({ length: 12 }, (_, index) => ({
      mese: nomiMesi[index],
      meseNumero: index + 1,
      guadagno: 0
    }))

    // Raggruppiamo gli eventi per mese e sommiamo i guadagni
    eventi.forEach(evento => {
      if (evento.dataInizio && evento.prezzo) {
        const dataEvento = new Date(evento.dataInizio)
        const meseEvento = dataEvento.getMonth() // 0-based (0 = Gennaio)
        
        // Verifichiamo che sia dello stesso anno
        if (dataEvento.getFullYear() === anno) {
          guadagniMensili[meseEvento].guadagno += evento.prezzo
        }
      }
    })

    return guadagniMensili
  }

  /**
   * Calcola i guadagni raggruppati per specialista
   * @param {Array} eventi - Lista degli eventi
   * @returns {Array} Array con guadagni per specialista
   */
  static calcolaGuadagniPerSpecialista(eventi) {
    // Raggruppiamo per specialista
    const guadagniSpecialisti = {}

    eventi.forEach(evento => {
      if (evento.specialista && evento.prezzo) {
        const specialistaKey = `${evento.specialista.nome} ${evento.specialista.cognome}`
        
        if (!guadagniSpecialisti[specialistaKey]) {
          guadagniSpecialisti[specialistaKey] = {
            specialista: specialistaKey,
            specialistaId: evento.specialista.id,
            guadagno: 0,
            numeroEventi: 0,
            prestazione: evento.specialista.prestazione
          }
        }
        
        guadagniSpecialisti[specialistaKey].guadagno += evento.prezzo
        guadagniSpecialisti[specialistaKey].numeroEventi += 1
      }
    })

    // Convertiamo in array e ordiniamo per guadagno decrescente
    return Object.values(guadagniSpecialisti)
      .sort((a, b) => b.guadagno - a.guadagno)
  }

  /**
   * Formatta un importo in euro
   * @param {number} importo - Importo da formattare
   * @returns {string} Importo formattato (es: "€ 1.234,56")
   */
  static formatEuro(importo) {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(importo || 0)
  }

  /**
   * Formatta un numero per la visualizzazione
   * @param {number} numero - Numero da formattare
   * @returns {string} Numero formattato con separatori
   */
  static formatNumero(numero) {
    return new Intl.NumberFormat('it-IT').format(numero || 0)
  }
}
