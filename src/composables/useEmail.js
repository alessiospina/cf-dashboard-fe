/**
 * Composable per la gestione dell'invio Email
 *
 * Questo composable gestisce tutto lo stato e la logica per l'invio di email reminder.
 * Include: invio email, gestione stato, validazioni, feedback utente, selezione specialisti
 */

import { ref, computed, onMounted, watch } from 'vue'
import { EmailService } from '@/services/emailService'
import { SpecialistaService } from '@/services/specialistaService'

export function useEmail() {
    // Stato reattivo principale
    const loading = ref(false)
    const error = ref(null)
    const notification = ref(null)

    // Stato specifico per l'invio email
    const emailLoading = ref(false)
    const emailResults = ref(null)
    const emailStats = ref(null)

    // Stato per la selezione
    const selectedDate = ref(null)
    const selectedSpecialistiIDs = ref([])
    const availableSpecialisti = ref([])
    const specialistiLoading = ref(false)

    // Stato per la UI
    const showResultsModal = ref(false)
    const searchTerm = ref('')

    // Funzione per ottenere la data corrente in formato YYYY-MM-DD
    const getTodayFormatted = () => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    }

    // Inizializzazione con data corrente
    selectedDate.value = getTodayFormatted()

    // Computed properties
    const isFormValid = computed(() => {
        return selectedDate.value &&
               selectedSpecialistiIDs.value.length > 0 &&
               EmailService.isValidDate(selectedDate.value)
    })

    const selectedSpecialisti = computed(() => {
        return availableSpecialisti.value.filter(specialista =>
            selectedSpecialistiIDs.value.includes(specialista.id)
        )
    })

    const filteredSpecialisti = computed(() => {
        if (!searchTerm.value) return availableSpecialisti.value

        const search = searchTerm.value.toLowerCase()
        return availableSpecialisti.value.filter(specialista =>
            specialista.nome?.toLowerCase().includes(search) ||
            specialista.cognome?.toLowerCase().includes(search) ||
            specialista.email?.toLowerCase().includes(search) ||
            specialista.prestazione?.tipologia?.toLowerCase().includes(search)
        )
    })

    const formattedSelectedDate = computed(() => {
        if (!selectedDate.value) return null
        return EmailService.formatDateForDisplay(selectedDate.value)
    })

    const canSendEmail = computed(() => {
        return isFormValid.value &&
               !emailLoading.value &&
               !specialistiLoading.value
    })

    // Metodi principali
    const loadSpecialisti = async (date = null) => {
        // Usa la data fornita o quella selezionata
        const targetDate = date || selectedDate.value

        if (!targetDate) {
            console.warn('⚠️ [useEmail] Nessuna data specificata per il caricamento specialisti')
            return
        }

        try {
            specialistiLoading.value = true
            error.value = null

            console.log(`🔄 [useEmail] Caricamento specialisti per data: ${targetDate}`)

            // Chiamata all'API per ottenere specialisti con eventi nella data specifica
            const data = await SpecialistaService.getSpecialistiByEvento(targetDate)

            console.log('🔍 [useEmail] Dati ricevuti dall\'API:', data)

            // Filtra solo specialisti con email valida
            const specialistiValidi = (data || []).filter(specialista => {
                const hasValidEmail = specialista.email && SpecialistaService.isValidEmail(specialista.email)
                console.log(`🔍 [useEmail] Specialista ${specialista.nome} ${specialista.cognome} - Email valida: ${hasValidEmail}`)
                return hasValidEmail
            })

            availableSpecialisti.value = specialistiValidi

            console.log('✅ [useEmail] Specialisti caricati:', availableSpecialisti.value.length)
            console.log('🔍 [useEmail] Lista specialisti:', availableSpecialisti.value)

            // Reset selezione quando cambia la data
            selectedSpecialistiIDs.value = []

            if (availableSpecialisti.value.length === 0) {
                setNotification(`Nessuno specialista con eventi trovato per il ${EmailService.formatDateForDisplay(targetDate)}`, 'info')
            } else {
                setNotification(`Trovati ${availableSpecialisti.value.length} specialisti con eventi per il ${EmailService.formatDateForDisplay(targetDate)}`, 'success')
            }

        } catch (err) {
            console.error('❌ [useEmail] Errore nel caricamento specialisti:', err)
            error.value = 'Errore nel caricamento degli specialisti per la data selezionata'
            setNotification('Errore nel caricamento degli specialisti', 'error')
            availableSpecialisti.value = []
        } finally {
            specialistiLoading.value = false
        }
    }

    const sendEmailReminder = async () => {
        try {
            emailLoading.value = true
            error.value = null
            emailResults.value = null
            emailStats.value = null

            console.log('🔄 [useEmail] Inizio invio email reminder')
            console.log('📅 [useEmail] Data selezionata:', selectedDate.value)
            console.log('👥 [useEmail] Specialisti selezionati:', selectedSpecialistiIDs.value)

            // Validazione finale
            if (!isFormValid.value) {
                throw new Error('Dati del form non validi')
            }

            // Invio email tramite service
            const results = await EmailService.sendReminderSpecialisti(
                selectedSpecialistiIDs.value,
                selectedDate.value
            )

            emailResults.value = results
            emailStats.value = EmailService.analyzeEmailResults(results)

            console.log('✅ [useEmail] Email inviate con successo')
            console.log('📊 [useEmail] Statistiche invio:', emailStats.value)

            // Genera feedback per l'utente
            const feedback = EmailService.generateFeedbackMessage(emailStats.value)
            setNotification(feedback.message, feedback.type)

            // Mostra i risultati dettagliati
            showResultsModal.value = true

            return results

        } catch (err) {
            console.error('❌ [useEmail] Errore nell\'invio email:', err)

            let errorMessage = 'Errore nell\'invio delle email'
            if (err.message) {
                errorMessage = err.message
            }

            error.value = errorMessage
            setNotification(errorMessage, 'error')
            throw err
        } finally {
            emailLoading.value = false
        }
    }

    // Gestione selezione specialisti
    const toggleSpecialista = (specialistaId) => {
        const index = selectedSpecialistiIDs.value.indexOf(specialistaId)
        if (index > -1) {
            selectedSpecialistiIDs.value.splice(index, 1)
        } else {
            selectedSpecialistiIDs.value.push(specialistaId)
        }
        console.log('🔄 [useEmail] Specialisti selezionati aggiornati:', selectedSpecialistiIDs.value)
    }

    const selectAllSpecialisti = () => {
        selectedSpecialistiIDs.value = filteredSpecialisti.value.map(s => s.id)
        console.log('👥 [useEmail] Selezionati tutti gli specialisti')
    }

    const clearSelection = () => {
        selectedSpecialistiIDs.value = []
        console.log('🧹 [useEmail] Selezione specialisti azzerata')
    }

    const isSelected = (specialistaId) => {
        return selectedSpecialistiIDs.value.includes(specialistaId)
    }

    // Gestione data
    const setSelectedDate = (date) => {
        let formattedDate = null

        if (date instanceof Date) {
            formattedDate = date.toISOString().split('T')[0]
        } else if (typeof date === 'string' && SpecialistaService.isValidDateFormat(date)) {
            formattedDate = date
        } else {
            console.warn('⚠️ [useEmail] Data non valida fornita:', date)
            return
        }

        selectedDate.value = formattedDate
        console.log('📅 [useEmail] Data selezionata aggiornata:', selectedDate.value)
    }

    const setToday = () => {
        selectedDate.value = getTodayFormatted()
    }

    const setTomorrow = () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        selectedDate.value = tomorrow.toISOString().split('T')[0]
    }

    // Gestione modali e UI
    const openResultsModal = () => {
        showResultsModal.value = true
    }

    const closeResultsModal = () => {
        showResultsModal.value = false
    }

    // Gestione notifiche
    const setNotification = (message, type = 'info') => {
        notification.value = { message, type }
        console.log(`📢 [useEmail] Notifica ${type}:`, message)
    }

    const clearNotification = () => {
        notification.value = null
    }

    // Reset del form
    const resetForm = () => {
        selectedDate.value = null
        selectedSpecialistiIDs.value = []
        emailResults.value = null
        emailStats.value = null
        error.value = null
        clearNotification()
        console.log('🧹 [useEmail] Form resettato')
    }

    // Utility functions
    const getSpecialistaFullName = (specialista) => {
        if (!specialista) return ''
        return `${specialista.nome || ''} ${specialista.cognome || ''}`.trim()
    }

    const formatDateForDisplay = (dateString) => {
        return EmailService.formatDateForDisplay(dateString)
    }

    const getSelectedSpecialistiNames = () => {
        return selectedSpecialisti.value.map(s => getSpecialistaFullName(s))
    }

    const validateForm = () => {
        const errors = []

        if (!selectedDate.value) {
            errors.push('È necessario selezionare una data')
        } else if (!EmailService.isValidDate(selectedDate.value)) {
            errors.push('La data selezionata non è valida')
        } else if (!EmailService.isFutureDate(selectedDate.value)) {
            errors.push('È consigliabile selezionare una data futura')
        }

        if (selectedSpecialistiIDs.value.length === 0) {
            errors.push('È necessario selezionare almeno uno specialista')
        }

        if (!EmailService.validateSpecialistiIDs(selectedSpecialistiIDs.value)) {
            errors.push('Gli ID degli specialisti selezionati non sono validi')
        }

        return errors
    }

    const getFormValidationMessage = () => {
        const errors = validateForm()
        return errors.length > 0 ? errors.join(', ') : null
    }

    // Auto-inizializzazione
    onMounted(async () => {
        console.log('🚀 [useEmail] Inizializzazione composable email')
        console.log('📅 [useEmail] Data iniziale impostata:', selectedDate.value)

        // Carica gli specialisti per la data corrente
        await loadSpecialisti()
    })

    // Watch per ricaricare specialisti quando cambia la data
    watch(selectedDate, async (newDate, oldDate) => {
        if (newDate && newDate !== oldDate) {
            console.log('🔄 [useEmail] Data cambiata, ricaricamento specialisti:', newDate)
            await loadSpecialisti(newDate)
        }
    })

    // API pubblica del composable
    return {
        // Stato principale
        loading,
        error,
        notification,

        // Stato email
        emailLoading,
        emailResults,
        emailStats,

        // Stato selezione
        selectedDate,
        selectedSpecialistiIDs,
        availableSpecialisti,
        specialistiLoading,
        searchTerm,

        // Stato UI
        showResultsModal,

        // Computed
        isFormValid,
        selectedSpecialisti,
        filteredSpecialisti,
        formattedSelectedDate,
        canSendEmail,

        // Metodi principali
        loadSpecialisti,
        sendEmailReminder,

        // Gestione selezione
        toggleSpecialista,
        selectAllSpecialisti,
        clearSelection,
        isSelected,

        // Gestione data
        setSelectedDate,
        setToday,
        setTomorrow,

        // Gestione modali
        openResultsModal,
        closeResultsModal,

        // Gestione notifiche
        setNotification,
        clearNotification,

        // Utility
        resetForm,
        getSpecialistaFullName,
        formatDateForDisplay,
        getSelectedSpecialistiNames,
        validateForm,
        getFormValidationMessage,
        getTodayFormatted
    }
}
