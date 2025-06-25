/**
 * Composable per la gestione della cancellazione di eventi ricorrenti
 * 
 * Fornisce utilità per:
 * - Rilevare se un evento è ricorrente
 * - Aprire la modal di cancellazione appropriata
 * - Gestire i risultati della cancellazione
 */

import { ref } from 'vue'
import { useCalendario } from '@/composables/useCalendario'
import { isEventoRicorrente } from '@/types/ricorrenza.types.ts'

export function useDeleteRecurringEvent() {
  const {
    eliminaEvento,
    eliminaEventiRicorrenti
  } = useCalendario()

  // Stato per la modal di cancellazione eventi ricorrenti
  const showDeleteRecurringModal = ref(false)
  const eventoPerCancellazione = ref(null)

  /**
   * Gestisce la richiesta di cancellazione di un evento
   * Determina automaticamente se usare la modal per eventi ricorrenti o eliminare direttamente
   * 
   * @param {Object} evento - Evento da cancellare
   * @param {Function} onDeleted - Callback chiamata dopo la cancellazione
   * @returns {Promise} - Promise per eventi singoli, undefined per eventi ricorrenti (apre modal)
   */
  const handleDeleteEvent = async (evento, onDeleted = () => {}) => {
    if (!evento?.id) {
      console.error('❌ [useDeleteRecurringEvent] Evento non valido per cancellazione')
      return
    }

    console.log('🗑️ [useDeleteRecurringEvent] Richiesta cancellazione evento:', evento.id)

    // Controlla se è un evento ricorrente
    if (isEventoRicorrente(evento)) {
      console.log('🔄 [useDeleteRecurringEvent] Evento ricorrente rilevato - apertura modal scelta')
      
      // Salva l'evento e il callback per la modal
      eventoPerCancellazione.value = evento
      
      // Salva il callback in una proprietà globale per poterlo richiamare dalla modal
      window._deleteEventCallback = onDeleted
      
      // Apri la modal di scelta opzioni
      showDeleteRecurringModal.value = true
      
      return // Non restituire promise per eventi ricorrenti
    } else {
      console.log('🗑️ [useDeleteRecurringEvent] Evento singolo - cancellazione diretta')
      
      try {
        // Elimina direttamente l'evento singolo
        await eliminaEvento(evento.id)
        
        console.log('✅ [useDeleteRecurringEvent] Evento singolo cancellato con successo')
        
        // Chiama il callback con l'ID dell'evento
        onDeleted(evento.id)
        
        return evento.id
      } catch (error) {
        console.error('❌ [useDeleteRecurringEvent] Errore cancellazione evento singolo:', error)
        throw error
      }
    }
  }

  /**
   * Gestisce il completamento della cancellazione dalla modal eventi ricorrenti
   * @param {Object} risultato - Risultato della cancellazione dalla modal
   */
  const handleRecurringDeleted = (risultato) => {
    console.log('✅ [useDeleteRecurringEvent] Cancellazione eventi ricorrenti completata:', risultato)
    
    // Chiudi la modal
    showDeleteRecurringModal.value = false
    eventoPerCancellazione.value = null
    
    // Chiama il callback salvato se esiste
    if (window._deleteEventCallback) {
      window._deleteEventCallback(risultato)
      window._deleteEventCallback = null
    }
  }

  /**
   * Gestisce la chiusura della modal eventi ricorrenti senza cancellazione
   */
  const handleRecurringDeleteClosed = () => {
    console.log('🔄 [useDeleteRecurringEvent] Modal cancellazione eventi ricorrenti chiusa senza azione')
    
    // Chiudi la modal e pulisci lo stato
    showDeleteRecurringModal.value = false
    eventoPerCancellazione.value = null
    
    // Pulisci il callback
    if (window._deleteEventCallback) {
      window._deleteEventCallback = null
    }
  }

  /**
   * Verifica se un evento è ricorrente
   * @param {Object} evento - Evento da verificare
   * @returns {boolean} - true se ricorrente
   */
  const checkIsEventoRicorrente = (evento) => {
    return isEventoRicorrente(evento)
  }

  /**
   * Apre manualmente la modal di cancellazione eventi ricorrenti
   * @param {Object} evento - Evento ricorrente
   * @param {Function} onDeleted - Callback per gestire il risultato
   */
  const openDeleteRecurringModal = (evento, onDeleted = () => {}) => {
    eventoPerCancellazione.value = evento
    window._deleteEventCallback = onDeleted
    showDeleteRecurringModal.value = true
  }

  /**
   * Chiude manualmente la modal di cancellazione eventi ricorrenti
   */
  const closeDeleteRecurringModal = () => {
    showDeleteRecurringModal.value = false
    eventoPerCancellazione.value = null
    if (window._deleteEventCallback) {
      window._deleteEventCallback = null
    }
  }

  return {
    // Stato
    showDeleteRecurringModal,
    eventoPerCancellazione,
    
    // Metodi principali
    handleDeleteEvent,
    handleRecurringDeleted,
    handleRecurringDeleteClosed,
    
    // Metodi di utilità
    checkIsEventoRicorrente,
    openDeleteRecurringModal,
    closeDeleteRecurringModal,
    
    // Alias per compatibilità
    isEventoRicorrente: checkIsEventoRicorrente
  }
}
