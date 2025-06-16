/**
 * Composable per la gestione degli Specialisti
 *
 * Questo composable gestisce tutto lo stato e la logica degli specialisti.
 * Include: CRUD operations, state management, validazioni, notifiche
 */

import { ref, computed, onMounted } from 'vue'
import { SpecialistaService } from '@/services/specialistaService'

export function useSpecialisti() {
  // Stato reattivo
  const specialisti = ref([])
  const loading = ref(false)
  const error = ref(null)
  const searchTerm = ref('')
  const notification = ref(null)

  // Stato per le modali
  const showCreateModal = ref(false)
  const showEditModal = ref(false)
  const selectedSpecialista = ref(null)

  // Computed properties
  const filteredSpecialisti = computed(() => {
    if (!searchTerm.value) return specialisti.value

    const search = searchTerm.value.toLowerCase()
    return specialisti.value.filter(specialista =>
      specialista.nome?.toLowerCase().includes(search) ||
      specialista.cognome?.toLowerCase().includes(search) ||
      specialista.email?.toLowerCase().includes(search) ||
      specialista.telefono?.toLowerCase().includes(search) ||
      specialista.prestazione?.tipologia?.toLowerCase().includes(search)
    )
  })

  // Metodi CRUD
  const loadSpecialisti = async () => {
    try {
      loading.value = true
      error.value = null

      const data = await SpecialistaService.getAllSpecialisti()
      specialisti.value = data || []

      console.log('Specialisti caricati:', specialisti.value.length)
    } catch (err) {
      console.error('Errore nel caricamento specialisti:', err)
      error.value = 'Errore nel caricamento degli specialisti. Riprova più tardi.'

      // Notifica di errore
      setNotification('Errore nel caricamento degli specialisti', 'error')
    } finally {
      loading.value = false
    }
  }

  const createSpecialista = async (specialistaData) => {
    try {
      loading.value = true

      const newSpecialista = await SpecialistaService.createSpecialista(specialistaData)

      // Aggiungi alla lista locale
      specialisti.value.push(newSpecialista)

      setNotification(
        `Specialista "${newSpecialista.nome} ${newSpecialista.cognome}" creato con successo`,
        'success'
      )

      console.log('Specialista creato:', newSpecialista)
      return newSpecialista

    } catch (err) {
      console.error('Errore nella creazione specialista:', err)

      // Gestione errori specifici dal backend
      let errorMessage = 'Errore nella creazione dello specialista'
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }

      setNotification(errorMessage, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateSpecialista = async (id, specialistaData) => {
    console.log('🔄 [useSpecialisti] Inizio updateSpecialista')
    console.log('🆔 [useSpecialisti] ID specialista:', id)
    console.log('📝 [useSpecialisti] Dati specialista ricevuti:', specialistaData)

    try {
      loading.value = true
      console.log('⏳ [useSpecialisti] Loading impostato a true')

      console.log('🌐 [useSpecialisti] Chiamando SpecialistaService.updateSpecialista...')
      const updatedSpecialista = await SpecialistaService.updateSpecialista(id, specialistaData)

      console.log('✅ [useSpecialisti] Risposta ricevuta dal service:', updatedSpecialista)

      // Aggiorna nella lista locale
      const index = specialisti.value.findIndex(s => s.id === id)
      console.log('🔍 [useSpecialisti] Indice specialista nella lista:', index)

      if (index !== -1) {
        console.log('🔄 [useSpecialisti] Specialista prima dell\'aggiornamento:', specialisti.value[index])
        specialisti.value[index] = updatedSpecialista
        console.log('✅ [useSpecialisti] Specialista aggiornato nella lista locale:', specialisti.value[index])
      } else {
        console.warn('⚠️ [useSpecialisti] Specialista non trovato nella lista locale per l\'aggiornamento')
      }

      const successMessage = `Specialista "${updatedSpecialista.nome} ${updatedSpecialista.cognome}" aggiornato con successo`
      console.log('🎉 [useSpecialisti] Impostando notifica di successo:', successMessage)

      setNotification(successMessage, 'success')

      console.log('✅ [useSpecialisti] updateSpecialista completato con successo')
      return updatedSpecialista

    } catch (err) {
      console.error('❌ [useSpecialisti] Errore nell\'aggiornamento specialista:', err)
      console.error('📋 [useSpecialisti] Dettagli errore completi:', {
        message: err.message,
        stack: err.stack,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers
      })

      let errorMessage = 'Errore nell\'aggiornamento dello specialista'
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
        console.log('💬 [useSpecialisti] Messaggio errore dal backend:', errorMessage)
      }

      console.log('🚨 [useSpecialisti] Impostando notifica di errore:', errorMessage)
      setNotification(errorMessage, 'error')
      throw err
    } finally {
      loading.value = false
      console.log('🏁 [useSpecialisti] Loading impostato a false - Fine updateSpecialista')
    }
  }

  const deleteSpecialista = async (id) => {
    try {
      loading.value = true

      await SpecialistaService.deleteSpecialista(id)

      // Rimuovi dalla lista locale
      const index = specialisti.value.findIndex(s => s.id === id)
      if (index !== -1) {
        const deleted = specialisti.value.splice(index, 1)[0]
        setNotification(
          `Specialista "${deleted.nome} ${deleted.cognome}" eliminato con successo`,
          'success'
        )
      }

      console.log('Specialista eliminato:', id)

    } catch (err) {
      console.error('Errore nell\'eliminazione specialista:', err)

      let errorMessage = 'Errore nell\'eliminazione dello specialista'
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
    selectedSpecialista.value = null
    showCreateModal.value = true
  }

  const openEditModal = (specialista) => {
    selectedSpecialista.value = { ...specialista }
    showEditModal.value = true
  }

  const closeCreateModal = () => {
    showCreateModal.value = false
    selectedSpecialista.value = null
  }

  const closeEditModal = () => {
    showEditModal.value = false
    selectedSpecialista.value = null
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

  const getFullName = (specialista) => {
    if (!specialista) return ''
    return `${specialista.nome || ''} ${specialista.cognome || ''}`.trim()
  }

  // Validazioni email semplici
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Auto-load all'avvio
  onMounted(async () => {
    console.log('🚀 [useSpecialisti] Inizializzazione composable')

    // Test di connettività
    const isConnected = await SpecialistaService.testConnection()
    if (!isConnected) {
      console.warn('⚠️ [useSpecialisti] Backend non raggiungibile')
      setNotification('Impossibile connettersi al server. Verifica la connessione.', 'error')
    }

    loadSpecialisti()
  })

  // API pubblica del composable
  return {
    // Stato
    specialisti,
    filteredSpecialisti,
    loading,
    error,
    searchTerm,
    notification,
    selectedSpecialista,
    showCreateModal,
    showEditModal,

    // Metodi CRUD
    loadSpecialisti,
    createSpecialista,
    updateSpecialista,
    deleteSpecialista,

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
    getFullName,
    isValidEmail
  }
}
