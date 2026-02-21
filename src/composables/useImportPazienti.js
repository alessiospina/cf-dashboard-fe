/**
 * Composable per la gestione dell'import pazienti da Excel
 *
 * Questo composable fornisce funzionalità per:
 * - Upload file Excel
 * - Gestione pazienti validi e invalidi
 * - Modifica dei record
 * - Invio pazienti validi al backend
 */

import { ref, computed } from 'vue'
import { PazienteService } from '@/services/pazienteService'
import { usePazientiStore } from '@/stores/modules/pazientiStore'

export function useImportPazienti() {
  const pazientiStore = usePazientiStore()

  // Stato reattivo
  const file = ref(null)
  const loading = ref(false)
  const uploadComplete = ref(false)
  const validPazienti = ref([])
  const invalidPazienti = ref([])
  const notification = ref(null)
  const editingPaziente = ref(null)
  const editingType = ref(null) // 'valid' o 'invalid'
  const savingPazienti = ref(false)

  // Computed
  const hasData = computed(() => validPazienti.value.length > 0 || invalidPazienti.value.length > 0)
  const validCount = computed(() => validPazienti.value.length)
  const invalidCount = computed(() => invalidPazienti.value.length)

  /**
   * Gestisce la selezione del file
   */
  const handleFileSelect = (selectedFile) => {
    file.value = selectedFile
    // Reset stato precedente
    validPazienti.value = []
    invalidPazienti.value = []
    uploadComplete.value = false
  }

  /**
   * Effettua l'upload del file e processa i risultati
   */
  const uploadFile = async () => {
    if (!file.value) {
      showNotification('Seleziona un file Excel', 'warning')
      return
    }

    // Validazione estensione file
    const fileName = file.value.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      showNotification('Il file deve essere in formato Excel (.xlsx o .xls)', 'danger')
      return
    }

    loading.value = true
    try {
      const result = await PazienteService.importFromExcel(file.value)

      // Risultato ha struttura: { valids: [...], invalids: [...] }
      validPazienti.value = result.valids || []
      invalidPazienti.value = result.invalids || []

      uploadComplete.value = true

      if (validCount.value === 0 && invalidCount.value === 0) {
        showNotification('Il file non contiene dati validi', 'warning')
      } else {
        showNotification(
          `Import completato: ${validCount.value} record validi, ${invalidCount.value} record invalidi`,
          'success'
        )
      }
    } catch (error) {
      console.error('Errore durante l\'upload:', error)
      const errorMessage = error.response?.data?.message || 'Errore durante l\'import del file'
      showNotification(errorMessage, 'danger')
    } finally {
      loading.value = false
    }
  }

  /**
   * Apre il form di modifica per un paziente
   */
  const startEdit = (paziente, type) => {
    editingPaziente.value = { ...paziente }
    editingType.value = type
  }

  /**
   * Annulla la modifica
   */
  const cancelEdit = () => {
    editingPaziente.value = null
    editingType.value = null
  }

  /**
   * Salva le modifiche di un paziente
   */
  const saveEdit = () => {
    if (!editingPaziente.value || !editingType.value) return

    const index = editingType.value === 'valid'
      ? validPazienti.value.findIndex(p => p === editingPaziente.value ||
          (p.codiceFiscale && p.codiceFiscale === editingPaziente.value.codiceFiscale))
      : invalidPazienti.value.findIndex(p => p === editingPaziente.value ||
          (p.codiceFiscale && p.codiceFiscale === editingPaziente.value.codiceFiscale))

    if (index !== -1) {
      if (editingType.value === 'valid') {
        validPazienti.value[index] = { ...editingPaziente.value }
      } else {
        invalidPazienti.value[index] = { ...editingPaziente.value }
      }
      showNotification('Modifiche salvate', 'success')
    }

    cancelEdit()
  }

  /**
   * Rimuove un paziente dalla lista
   */
  const removePaziente = (paziente, type) => {
    if (type === 'valid') {
      const index = validPazienti.value.indexOf(paziente)
      if (index !== -1) {
        validPazienti.value.splice(index, 1)
        showNotification('Paziente rimosso dalla lista', 'info')
      }
    } else {
      const index = invalidPazienti.value.indexOf(paziente)
      if (index !== -1) {
        invalidPazienti.value.splice(index, 1)
        showNotification('Paziente rimosso dalla lista', 'info')
      }
    }
  }

  /**
   * Sposta un paziente invalido alla lista dei validi
   */
  const moveToValid = (paziente) => {
    const index = invalidPazienti.value.indexOf(paziente)
    if (index !== -1) {
      // Rimuovi l'errore prima di spostare
      const { error, ...cleanPaziente } = paziente
      invalidPazienti.value.splice(index, 1)
      validPazienti.value.push(cleanPaziente)
      showNotification('Paziente spostato nei record validi', 'success')
    }
  }

  /**
   * Invia tutti i pazienti validi al backend per salvarli
   */
  const savePazientiToBackend = async () => {
    if (validCount.value === 0) {
      showNotification('Nessun paziente da salvare', 'warning')
      return
    }

    savingPazienti.value = true
    let successCount = 0
    let errorCount = 0
    const errors = []

    try {
      // Salva i pazienti uno alla volta
      for (const paziente of validPazienti.value) {
        try {
          await pazientiStore.createPaziente(paziente)
          successCount++
        } catch (error) {
          errorCount++
          const errorMsg = error.response?.data?.message || error.message
          errors.push({
            paziente: `${paziente.nome} ${paziente.cognome}`,
            error: errorMsg
          })
        }
      }

      // Mostra risultato
      if (errorCount === 0) {
        showNotification(`Tutti i ${successCount} pazienti sono stati salvati con successo`, 'success')
        // Svuota la lista dei validi
        validPazienti.value = []
      } else {
        showNotification(
          `Salvati ${successCount} pazienti. ${errorCount} errori riscontrati`,
          'warning'
        )
        // Rimuovi solo i pazienti salvati con successo
        validPazienti.value = validPazienti.value.filter((p, index) => {
          const errorForThisPatient = errors.find(e =>
            e.paziente === `${p.nome} ${p.cognome}`
          )
          return errorForThisPatient !== undefined
        })
      }

      // Log errori per debugging
      if (errors.length > 0) {
        console.error('Errori durante il salvataggio:', errors)
      }

    } catch (error) {
      console.error('Errore generale durante il salvataggio:', error)
      showNotification('Errore durante il salvataggio dei pazienti', 'danger')
    } finally {
      savingPazienti.value = false
    }
  }

  /**
   * Reset completo dello stato
   */
  const reset = () => {
    file.value = null
    validPazienti.value = []
    invalidPazienti.value = []
    uploadComplete.value = false
    editingPaziente.value = null
    editingType.value = null
    notification.value = null
    loading.value = false
    savingPazienti.value = false
  }

  /**
   * Mostra una notifica
   */
  const showNotification = (message, type = 'info') => {
    notification.value = { message, type }
    // Auto-hide dopo 5 secondi
    setTimeout(() => {
      notification.value = null
    }, 5000)
  }

  /**
   * Chiude la notifica
   */
  const clearNotification = () => {
    notification.value = null
  }

  /**
   * Formatta la data per la visualizzazione
   */
  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('it-IT')
  }

  return {
    // Stato
    file,
    loading,
    uploadComplete,
    validPazienti,
    invalidPazienti,
    notification,
    editingPaziente,
    editingType,
    savingPazienti,

    // Computed
    hasData,
    validCount,
    invalidCount,

    // Metodi
    handleFileSelect,
    uploadFile,
    startEdit,
    cancelEdit,
    saveEdit,
    removePaziente,
    moveToValid,
    savePazientiToBackend,
    reset,
    showNotification,
    clearNotification,
    formatDate,
  }
}
