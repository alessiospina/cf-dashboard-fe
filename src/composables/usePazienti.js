/**
 * Composable per la gestione dei Pazienti
 *
 * Questo composable fornisce funzionalità riutilizzabili per:
 * - Gestire la lista dei pazienti
 * - Validare i form
 * - Formattare i dati
 * - Gestire notifiche
 */

import { ref, computed, onMounted } from 'vue'
import { usePazientiStore } from '@/stores/modules/pazientiStore'
// TIPI_TERAPIA_OPTIONS rimosso - non più necessario per i pazienti

export function usePazienti() {
  // Accesso allo store Pinia
  const pazientiStore = usePazientiStore()

  // Stato reattivo locale
  const searchTerm = ref('')
  const showCreateModal = ref(false)
  const showEditModal = ref(false)
  const notification = ref(null)

  // Computed properties (valori calcolati automaticamente)
  const pazienti = computed(() => pazientiStore.pazienti)
  const loading = computed(() => pazientiStore.loading)
  const error = computed(() => pazientiStore.error)
  const selectedPaziente = computed(() => pazientiStore.selectedPaziente)

  // Pazienti filtrati in base alla ricerca
  const filteredPazienti = computed(() => {
    // Assicuriamoci che pazienti.value sia sempre un array
    if (!Array.isArray(pazienti.value)) {
      console.warn('pazienti.value non è un array:', pazienti.value)
      return []
    }

    if (!searchTerm.value) {
      return pazienti.value
    }
    return pazientiStore.searchPazienti(searchTerm.value)
  })

  // Metodi per la gestione dei pazienti
  const loadPazienti = async () => {
    try {
      await pazientiStore.fetchPazienti()
    } catch (error) {
      showNotification('Errore nel caricamento dei pazienti', 'error')
    }
  }

  const loadPazientiPaginated = async (params) => {
    try {
      await pazientiStore.fetchPazientiPaginated(params)
    } catch (error) {
      showNotification('Errore nel caricamento dei pazienti', 'error')
    }
  }

  const createPaziente = async (pazienteData) => {
    try {
      const result = await pazientiStore.createPaziente(pazienteData)
      showNotification('Paziente creato con successo', 'success')
      return result
    } catch (error) {
      showNotification('Errore nella creazione del paziente', 'error')
      throw error
    }
  }

  const updatePaziente = async (pazienteData) => {
    try {
      const result = await pazientiStore.updatePaziente(pazienteData)
      showNotification('Paziente aggiornato con successo', 'success')
      return result
    } catch (error) {
      showNotification('Errore nell\'aggiornamento del paziente', 'error')
      throw error
    }
  }

  const deletePaziente = async (pazienteId) => {
    try {
      await pazientiStore.deletePaziente(pazienteId)
      showNotification('Paziente eliminato con successo', 'success')
    } catch (error) {
      showNotification('Errore nell\'eliminazione del paziente', 'error')
      throw error
    }
  }

  const selectPazienteForEdit = (paziente) => {
    pazientiStore.selectPaziente(paziente)
    showEditModal.value = true
  }

  // Gestione delle modali
  const openCreateModal = () => {
    showCreateModal.value = true
  }

  const closeCreateModal = () => {
    showCreateModal.value = false
  }

  const closeEditModal = () => {
    showEditModal.value = false
    pazientiStore.clearSelectedPaziente()
  }

  // Gestione notifiche
  const showNotification = (message, type = 'info') => {
    notification.value = { message, type }
    // Auto-hide dopo 3 secondi
    setTimeout(() => {
      notification.value = null
    }, 3000)
  }

  const clearNotification = () => {
    notification.value = null
  }

  // Utility per formattazione
  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('it-IT')
  }

  const formatTipoTerapia = (tipo) => {
    // Questa funzione non è più utilizzata nel contesto pazienti
    // Il tipo terapia è ora determinato dalla prestazione dello specialista
    return tipo || 'Non specificato'
  }

  const calculateAge = (dataNascita) => {
    if (!dataNascita) return ''
    const today = new Date()
    const birthDate = new Date(dataNascita)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return `${age} anni`
  }

  // Validazione form
  const validatePazienteForm = (formData) => {
    const errors = {}

    // Validazione formato codice fiscale (solo se fornito)
    if (formData.codiceFiscale?.trim() && !/^[A-Z0-9]{16}$/.test(formData.codiceFiscale.toUpperCase())) {
      errors.codiceFiscale = 'Il codice fiscale deve essere di 16 caratteri alfanumerici'
    }

    // Validazione formato email (solo se fornita)
    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'L\'email non è valida'
    }

    // Validazione coerenza campi geografici nascita
    if (formData.provinciaNascitaId && !formData.comuneNascitaId) {
      errors.comuneNascitaId = 'Seleziona un comune di nascita'
    }

    // Validazione coerenza campi geografici residenza
    if (formData.provinciaResidenzaId && !formData.comuneResidenzaId) {
      errors.comuneResidenzaId = 'Seleziona un comune di residenza'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  // Lifecycle hook - carica i dati quando il composable viene utilizzato
  onMounted(() => {
    if (pazienti.value.length === 0) {
      loadPazienti()
    }
  })

  // Restituiamo tutto ciò che vogliamo rendere disponibile ai componenti
  return {
    // Stato
    pazienti,
    filteredPazienti,
    loading,
    error,
    selectedPaziente,
    searchTerm,
    showCreateModal,
    showEditModal,
    notification,

    // Metodi
    loadPazienti,
    loadPazientiPaginated,
    createPaziente,
    updatePaziente,
    deletePaziente,
    selectPazienteForEdit,
    openCreateModal,
    closeCreateModal,
    closeEditModal,
    showNotification,
    clearNotification,

    // Utility
    formatDate,
    formatTipoTerapia,
    calculateAge,
    validatePazienteForm

    // TIPI_TERAPIA_OPTIONS rimosso - non più necessario per i pazienti
    // Il tipo terapia è ora gestito dalle prestazioni degli specialisti
  }
}
