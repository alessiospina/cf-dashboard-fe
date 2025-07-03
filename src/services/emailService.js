/**
 * Service per la gestione dell'invio email
 * Interagisce con l'API backend per inviare email reminder
 * Basato sul backend NestJS con TypeORM
 */

// Configurazione dell'API
const API_BASE_URL = 'http://localhost:8000/api'

/**
 * Enum per i tipi di richiesta email
 * @readonly
 * @enum {string}
 */
export const EmailRequestType = {
    REMINDER_SPECIALISTI_APPUNTAMENTI: 'REMINDER_SPECIALISTI_APPUNTAMENTI',
    REMINDER_PAZIENTE_APPUNTAMENTO: 'REMINDER_PAZIENTE_APPUNTAMENTO'
}

/**
 * Interfaccia per il DTO della richiesta email generica
 * @typedef {Object} EmailRequestDTO
 * @property {string} request - Tipo di email da inviare (EmailRequestType)
 * @property {Object} data - Dati specifici per il tipo di email
 */

/**
 * Interfaccia per il DTO specifico del reminder specialisti
 * @typedef {Object} SpecialistiReminderDTO
 * @property {number[]} specialistiIDs - Array di ID degli specialisti
 * @property {string} date - Data in formato YYYY-MM-DD
 */

/**
 * Interfaccia per i dati di risposta di ogni email inviata
 * @typedef {Object} EmailDataDTO
 * @property {string} to - Destinatario dell'email
 * @property {string[]} cc - Lista indirizzi in copia carbone
 * @property {boolean} success - True se l'invio è riuscito
 * @property {Date} timestamp - Timestamp dell'invio
 */

/**
 * Interfaccia per la risposta dell'API email
 * @typedef {Object} EmailResponseDTO
 * @property {EmailDataDTO[]} data - Array con l'esito di ogni email inviata
 */

/**
 * Interfaccia per la risposta del server
 * @typedef {Object} ServerResponseDto
 * @property {T} data - I dati della risposta
 * @property {string} message - Messaggio di risposta
 */

export const EmailService = {
    /**
     * Invia email reminder agli specialisti per la data specificata
     * Endpoint: POST /api/email
     * @param {number[]} specialistiIDs - Array degli ID degli specialisti
     * @param {string} date - Data in formato YYYY-MM-DD
     * @returns {Promise<EmailResponseDTO>} Risultato dell'invio email
     */
    async sendReminderSpecialisti(specialistiIDs, date) {
        try {
            console.log('🌐 [EmailService] Chiamata POST /api/email - Reminder Specialisti')
            console.log('📝 [EmailService] Specialisti IDs:', specialistiIDs)
            console.log('📅 [EmailService] Data:', date)

            // Validazione parametri di input
            if (!specialistiIDs || !Array.isArray(specialistiIDs) || specialistiIDs.length === 0) {
                throw new Error('È necessario selezionare almeno uno specialista')
            }

            if (!date || !this.isValidDate(date)) {
                throw new Error('È necessario selezionare una data valida')
            }

            // Costruzione del DTO della richiesta
            /** @type {EmailRequestDTO} */
            const requestData = {
                request: EmailRequestType.REMINDER_SPECIALISTI_APPUNTAMENTI,
                data: {
                    specialistiIDs: specialistiIDs,
                    date: date
                }
            }

            console.log('📦 [EmailService] Payload inviato:', requestData)

            const response = await fetch(`${API_BASE_URL}/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            })

            if (!response.ok) {
                // Gestione errori specifici dal backend
                let errorMessage = `Errore HTTP: ${response.status} - ${response.statusText}`

                try {
                    const errorData = await response.json()
                    if (errorData.message) {
                        errorMessage = errorData.message
                    }
                } catch (e) {
                    // Se non riusciamo a parsare l'errore, manteniamo quello generico
                }

                throw new Error(errorMessage)
            }

            /** @type {ServerResponseDto<EmailResponseDTO>} */
            const serverResponse = await response.json()

            console.log('✅ [EmailService] Email inviate:', serverResponse.data)

            // Restituisce direttamente i dati dal campo data della risposta del server
            return serverResponse.data

        } catch (error) {
            console.error('❌ [EmailService] Errore nell\'invio email reminder:', error)
            throw error // Rilanciamo l'errore per permettere al composable di gestirlo
        }
    },

    /**
     * Valida se una data è in formato YYYY-MM-DD e valida
     * @param {string} dateString - Data da validare
     * @returns {boolean} True se la data è valida
     */
    isValidDate(dateString) {
        if (!dateString || typeof dateString !== 'string') {
            return false
        }

        // Verifica formato YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(dateString)) {
            return false
        }

        // Verifica che sia una data reale
        const date = new Date(dateString)
        return date instanceof Date && !isNaN(date.getTime())
    },

    /**
     * Converte una data da Date object a formato YYYY-MM-DD
     * @param {Date} date - Data da formattare
     * @returns {string} Data in formato YYYY-MM-DD
     */
    formatDateForAPI(date) {
        if (!date || !(date instanceof Date)) {
            throw new Error('Data non valida fornita per la formattazione')
        }

        return date.toISOString().split('T')[0]
    },

    /**
     * Converte una stringa di data YYYY-MM-DD in Date object
     * @param {string} dateString - Data in formato YYYY-MM-DD
     * @returns {Date} Oggetto Date
     */
    parseAPIDate(dateString) {
        if (!this.isValidDate(dateString)) {
            throw new Error('Formato data non valido per il parsing')
        }

        return new Date(dateString)
    },

    /**
     * Formatta la data per la visualizzazione utente in formato italiano
     * @param {string|Date} date - Data da formattare
     * @returns {string} Data formattata in italiano
     */
    formatDateForDisplay(date) {
        try {
            let dateObj
            if (typeof date === 'string') {
                dateObj = this.parseAPIDate(date)
            } else if (date instanceof Date) {
                dateObj = date
            } else {
                return '-'
            }

            return dateObj.toLocaleDateString('it-IT', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        } catch (error) {
            console.warn('⚠️ [EmailService] Errore nel formato data per display:', error)
            return String(date)
        }
    },

    /**
     * Valida gli ID degli specialisti
     * @param {number[]} specialistiIDs - Array di ID da validare
     * @returns {boolean} True se tutti gli ID sono validi
     */
    validateSpecialistiIDs(specialistiIDs) {
        if (!Array.isArray(specialistiIDs) || specialistiIDs.length === 0) {
            return false
        }

        return specialistiIDs.every(id =>
            typeof id === 'number' &&
            Number.isInteger(id) &&
            id > 0
        )
    },

    /**
     * Analizza il risultato dell'invio email e restituisce statistiche
     * @param {EmailResponseDTO} emailResponse - Risposta dell'API email
     * @returns {Object} Statistiche sull'invio
     */
    analyzeEmailResults(emailResponse) {
        if (!emailResponse || !emailResponse.data) {
            return {
                total: 0,
                success: 0,
                failed: 0,
                successRate: 0,
                failedEmails: []
            }
        }

        const total = emailResponse.data.length
        const successCount = emailResponse.data.filter(item => item.success).length
        const failedCount = total - successCount
        const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0
        const failedEmails = emailResponse.data
            .filter(item => !item.success)
            .map(item => item.to)

        return {
            total,
            success: successCount,
            failed: failedCount,
            successRate,
            failedEmails
        }
    },

    /**
     * Genera un messaggio di feedback per l'utente basato sui risultati
     * @param {Object} stats - Statistiche da analyzeEmailResults()
     * @returns {Object} Oggetto con tipo e messaggio di feedback
     */
    generateFeedbackMessage(stats) {
        const { total, success, failed, successRate } = stats

        if (total === 0) {
            return {
                type: 'warning',
                message: 'Nessuna email elaborata'
            }
        }

        if (success === total) {
            return {
                type: 'success',
                message: `Tutte le ${total} email sono state inviate con successo! 🎉`
            }
        }

        if (failed === total) {
            return {
                type: 'danger',
                message: `Tutte le ${total} email sono fallite. Verifica la configurazione. ❌`
            }
        }

        // Invio parziale
        return {
            type: 'warning',
            message: `${success}/${total} email inviate (${successRate}%). ${failed} email fallite.`
        }
    },

    /**
     * Ottiene la data di oggi in formato YYYY-MM-DD
     * @returns {string} Data di oggi
     */
    getTodayFormatted() {
        return this.formatDateForAPI(new Date())
    },

    /**
     * Ottiene la data di domani in formato YYYY-MM-DD
     * @returns {string} Data di domani
     */
    getTomorrowFormatted() {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return this.formatDateForAPI(tomorrow)
    },

    /**
     * Verifica se una data è nel futuro
     * @param {string} dateString - Data in formato YYYY-MM-DD
     * @returns {boolean} True se la data è nel futuro
     */
    isFutureDate(dateString) {
        if (!this.isValidDate(dateString)) {
            return false
        }

        const inputDate = this.parseAPIDate(dateString)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset ore per confronto solo date

        return inputDate >= today
    }
}

export default EmailService
