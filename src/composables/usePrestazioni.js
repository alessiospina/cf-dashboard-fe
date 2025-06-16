/**
 * Composable per la gestione delle Prestazioni
 *
 * Questo composable gestisce tutto lo stato e la logica delle prestazioni.
 * Include: CRUD operations, state management, validazioni, notifiche
 */

import { ref, computed, onMounted } from 'vue'
import { PrestazioneService } from '@/services/prestazioneService'

export function usePrestazioni() {
  // Stato reattivo
  const prestazioni = ref([])
  const loading = ref(false)
  const error = ref(null)
  const searchTerm = ref('')
  const notification = ref(null)

  // Stato per le modali
  const showCreateModal = ref(false)
  const showEditModal = ref(false)
  const selectedPrestazione = ref(null)

  // Computed properties
  const filteredPrestazioni = computed(() => {
    if (!searchTerm.value) return prestazioni.value

    const search = searchTerm.value.toLowerCase()
    return prestazioni.value.filter(prestazione => 
      prestazione.tipologia?.toLowerCase().includes(search) ||
      prestazione.color?.toLowerCase().includes(search)
    )
  })

  // Metodi CRUD
  const loadPrestazioni = async () => {
    try {
      loading.value = true
      error.value = null
      
      const data = await PrestazioneService.getAllPrestazioni()
      prestazioni.value = data || []
      
      console.log('Prestazioni caricate:', prestazioni.value.length)
    } catch (err) {
      console.error('Errore nel caricamento prestazioni:', err)
      error.value = 'Errore nel caricamento delle prestazioni. Riprova più tardi.'
      
      // Notifica di errore
      setNotification('Errore nel caricamento delle prestazioni', 'error')
    } finally {
      loading.value = false
    }
  }

  const createPrestazione = async (prestazioneData) => {
    try {
      loading.value = true
      
      const newPrestazione = await PrestazioneService.createPrestazione(prestazioneData)
      
      // Aggiungi alla lista locale
      prestazioni.value.push(newPrestazione)
      
      setNotification(
        `Prestazione "${newPrestazione.tipologia}" creata con successo`, 
        'success'
      )
      
      console.log('Prestazione creata:', newPrestazione)
      return newPrestazione
      
    } catch (err) {
      console.error('Errore nella creazione prestazione:', err)
      
      // Gestione errori specifici dal backend
      let errorMessage = 'Errore nella creazione della prestazione'
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      setNotification(errorMessage, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePrestazione = async (id, prestazioneData) => {
    try {
      loading.value = true
      
      const updatedPrestazione = await PrestazioneService.updatePrestazione(id, prestazioneData)
      
      // Aggiorna nella lista locale
      const index = prestazioni.value.findIndex(p => p.id === id)
      if (index !== -1) {
        prestazioni.value[index] = updatedPrestazione
      }
      
      setNotification(
        `Prestazione "${updatedPrestazione.tipologia}" aggiornata con successo`, 
        'success'
      )
      
      console.log('Prestazione aggiornata:', updatedPrestazione)
      return updatedPrestazione
      
    } catch (err) {
      console.error('Errore nell\'aggiornamento prestazione:', err)
      
      let errorMessage = 'Errore nell\'aggiornamento della prestazione'
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      setNotification(errorMessage, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const deletePrestazione = async (id) => {
    try {
      loading.value = true
      
      await PrestazioneService.deletePrestazione(id)
      
      // Rimuovi dalla lista locale
      const index = prestazioni.value.findIndex(p => p.id === id)
      if (index !== -1) {
        const deleted = prestazioni.value.splice(index, 1)[0]
        setNotification(
          `Prestazione "${deleted.tipologia}" eliminata con successo`, 
          'success'
        )
      }
      
      console.log('Prestazione eliminata:', id)
      
    } catch (err) {
      console.error('Errore nell\'eliminazione prestazione:', err)
      
      let errorMessage = 'Errore nell\'eliminazione della prestazione'
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      setNotification(errorMessage, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Gestione modali
  const openCreateModal = () => {
    selectedPrestazione.value = null
    showCreateModal.value = true
  }

  const openEditModal = (prestazione) => {
    selectedPrestazione.value = { ...prestazione }
    showEditModal.value = true
  }

  const closeCreateModal = () => {
    showCreateModal.value = false
    selectedPrestazione.value = null
  }

  const closeEditModal = () => {
    showEditModal.value = false
    selectedPrestazione.value = null
  }

  // Gestione notifiche
  const setNotification = (message, type = 'info') => {
    notification.value = { message, type }
  }

  const clearNotification = () => {
    notification.value = null
  }

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch (error) {
      return dateString
    }
  }

  const getContrastColor = (hexColor) => {
    // Rimuove il # se presente
    const color = hexColor.replace('#', '')
    
    // Converte in RGB
    const r = parseInt(color.substr(0, 2), 16)
    const g = parseInt(color.substr(2, 2), 16)
    const b = parseInt(color.substr(4, 2), 16)
    
    // Calcola la luminosità
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    
    // Ritorna bianco per colori scuri, nero per colori chiari
    return brightness > 128 ? '#000000' : '#ffffff'
  }

  // Auto-load all'avvio
  onMounted(() => {
    loadPrestazioni()
  })

  // API pubblica del composable
  return {
    // Stato
    prestazioni,
    filteredPrestazioni,
    loading,
    error,
    searchTerm,
    notification,
    selectedPrestazione,
    showCreateModal,
    showEditModal,

    // Metodi CRUD
    loadPrestazioni,
    createPrestazione,
    updatePrestazione,
    deletePrestazione,

    // Gestione modali
    openCreateModal,
    openEditModal,
    closeCreateModal,
    closeEditModal,

    // Gestione notifiche
    setNotification,
    clearNotification,

    // Utility
    formatDate,
    getContrastColor
  }
}
