/**
 * Service per la gestione degli specialisti
 * Interagisce con l'API backend per ottenere i dati degli specialisti
 * Basato sul backend NestJS con TypeORM
 */

// Configurazione dell'API
const API_BASE_URL = 'http://localhost:8000/api'

/**
 * Interfaccia per il DTO dello specialista dal backend
 * @typedef {Object} SpecialistaDTO
 * @property {number} id - ID univoco dello specialista
 * @property {string} nome - Nome dello specialista
 * @property {string} cognome - Cognome dello specialista
 * @property {string} email - Email dello specialista
 * @property {string} telefono - Numero di telefono
 * @property {Date} createdAt - Data di creazione
 * @property {PrestazioneDTO} prestazione - Prestazione associata allo specialista
 */

/**
 * Interfaccia per il DTO della prestazione
 * @typedef {Object} PrestazioneDTO
 * @property {number} id - ID della prestazione
 * @property {string} tipologia - Tipologia della prestazione
 * @property {string} color - Colore associato alla prestazione
 * @property {Date} createdAt - Data di creazione
 */

/**
 * Interfaccia per la risposta del server
 * @typedef {Object} ServerResponseDto
 * @property {T} data - I dati della risposta
 * @property {string} message - Messaggio di risposta
 */

/**
 * Interfaccia per la creazione di uno specialista
 * @typedef {Object} CreateSpecialistaDTO
 * @property {string} nome - Nome dello specialista
 * @property {string} cognome - Cognome dello specialista
 * @property {string} email - Email dello specialista
 * @property {string} telefono - Numero di telefono
 * @property {number} prestazioneID - ID della prestazione associata
 */

/**
 * Interfaccia per l'aggiornamento di uno specialista
 * @typedef {Object} UpdateSpecialistaDTO
 * @property {string} nome - Nome dello specialista
 * @property {string} cognome - Cognome dello specialista
 * @property {string} email - Email dello specialista
 * @property {string} telefono - Numero di telefono
 * @property {number} prestazioneID - ID della prestazione associata
 */

export const SpecialistaService = {
    /**
     * Ottiene tutti gli specialisti dal backend
     * Endpoint: GET /api/specialista
     * @returns {Promise<SpecialistaDTO[]>} Lista degli specialisti
     */
    async getAllSpecialisti() {
        try {
            console.log('🌐 [SpecialistaService] Chiamata GET /api/specialista')

            const response = await fetch(`${API_BASE_URL}/specialista`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status} - ${response.statusText}`)
            }

            /** @type {ServerResponseDto<SpecialistaDTO[]>} */
            const serverResponse = await response.json()

            console.log('✅ [SpecialistaService] Specialisti ricevuti:', serverResponse.data?.length || 0)

            // Restituisce direttamente i dati dal campo data della risposta del server
            return serverResponse.data || []

        } catch (error) {
            console.error('❌ [SpecialistaService] Errore nel caricamento specialisti:', error)
            throw new Error(
                error.message || 'Errore di comunicazione con il server durante il caricamento degli specialisti'
            )
        }
    },

    /**
     * Ottiene uno specialista specifico per ID
     * Endpoint: GET /api/specialista/:id
     * @param {number} id - ID dello specialista
     * @returns {Promise<SpecialistaDTO>} Dati dello specialista
     */
    async getSpecialistaById(id) {
        try {
            console.log(`🌐 [SpecialistaService] Chiamata GET /api/specialista/${id}`)

            const response = await fetch(`${API_BASE_URL}/specialista/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status} - ${response.statusText}`)
            }

            /** @type {ServerResponseDto<SpecialistaDTO>} */
            const serverResponse = await response.json()

            console.log('✅ [SpecialistaService] Specialista ricevuto:', serverResponse.data)

            return serverResponse.data

        } catch (error) {
            console.error(`❌ [SpecialistaService] Errore nel caricamento specialista ${id}:`, error)
            throw new Error(
                error.message || 'Errore di comunicazione con il server durante il caricamento dello specialista'
            )
        }
    },

    /**
     * Crea un nuovo specialista
     * Endpoint: POST /api/specialista
     * @param {CreateSpecialistaDTO} specialistaData - Dati per la creazione dello specialista
     * @returns {Promise<SpecialistaDTO>} Specialista creato
     */
    async createSpecialista(specialistaData) {
        try {
            console.log('🌐 [SpecialistaService] Chiamata POST /api/specialista')
            console.log('📝 [SpecialistaService] Dati inviati:', specialistaData)

            const response = await fetch(`${API_BASE_URL}/specialista`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(specialistaData)
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

            /** @type {ServerResponseDto<SpecialistaDTO>} */
            const serverResponse = await response.json()

            console.log('✅ [SpecialistaService] Specialista creato:', serverResponse.data)

            return serverResponse.data

        } catch (error) {
            console.error('❌ [SpecialistaService] Errore nella creazione specialista:', error)
            throw error // Rilanciamo l'errore per permettere al composable di gestirlo
        }
    },

    /**
     * Aggiorna uno specialista esistente
     * Endpoint: PUT /api/specialista/:id
     * @param {number} id - ID dello specialista da aggiornare
     * @param {UpdateSpecialistaDTO} specialistaData - Dati per l'aggiornamento
     * @returns {Promise<SpecialistaDTO>} Specialista aggiornato
     */
    async updateSpecialista(id, specialistaData) {
        try {
            console.log(`🌐 [SpecialistaService] Chiamata PUT /api/specialista/${id}`)
            console.log('📝 [SpecialistaService] Dati inviati:', specialistaData)

            const response = await fetch(`${API_BASE_URL}/specialista/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(specialistaData)
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

            /** @type {ServerResponseDto<SpecialistaDTO>} */
            const serverResponse = await response.json()

            console.log('✅ [SpecialistaService] Specialista aggiornato:', serverResponse.data)

            return serverResponse.data

        } catch (error) {
            console.error(`❌ [SpecialistaService] Errore nell'aggiornamento specialista ${id}:`, error)
            throw error // Rilanciamo l'errore per permettere al composable di gestirlo
        }
    },

    /**
     * Elimina uno specialista
     * Endpoint: DELETE /api/specialista/:id
     * @param {number} id - ID dello specialista da eliminare
     * @returns {Promise<void>}
     */
    async deleteSpecialista(id) {
        try {
            console.log(`🌐 [SpecialistaService] Chiamata DELETE /api/specialista/${id}`)

            const response = await fetch(`${API_BASE_URL}/specialista/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
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

            console.log('✅ [SpecialistaService] Specialista eliminato con successo')

        } catch (error) {
            console.error(`❌ [SpecialistaService] Errore nell'eliminazione specialista ${id}:`, error)
            throw error // Rilanciamo l'errore per permettere al composable di gestirlo
        }
    },

    /**
     * Ottiene gli specialisti che hanno eventi in una data specifica
     * Endpoint: GET /api/specialista/by/evento?date=YYYY-MM-DD
     * @param {string} date - Data in formato YYYY-MM-DD
     * @returns {Promise<SpecialistaDTO[]>} Lista degli specialisti con eventi nella data
     */
    async getSpecialistiByEvento(date) {
        try {
            console.log(`🌐 [SpecialistaService] Chiamata GET /api/specialista/by/evento?date=${date}`)

            // Validazione formato data
            if (!date || !this.isValidDateFormat(date)) {
                throw new Error('Formato data non valido. Usare YYYY-MM-DD')
            }

            const response = await fetch(`${API_BASE_URL}/specialista/by/evento?date=${date}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status} - ${response.statusText}`)
            }

            /** @type {ServerResponseDto<SpecialistaDTO[]>} */
            const serverResponse = await response.json()

            console.log('🔍 [SpecialistaService] Risposta completa dal server:', serverResponse)
            console.log('✅ [SpecialistaService] Specialisti con eventi ricevuti:', serverResponse.data?.length || 0)
            console.log('🔍 [SpecialistaService] Dati degli specialisti:', serverResponse.data)

            // Restituisce direttamente i dati dal campo data della risposta del server
            return serverResponse.data || []

        } catch (error) {
            console.error('❌ [SpecialistaService] Errore nel caricamento specialisti per evento:', error)
            throw new Error(
                error.message || 'Errore di comunicazione con il server durante il caricamento degli specialisti per evento'
            )
        }
    },

    /**
     * Test di connettività con il backend
     * @returns {Promise<boolean>} True se il backend è raggiungibile
     */
    async testConnection() {
        try {
            console.log('🧪 [SpecialistaService] Test di connettività al backend')

            const response = await fetch(`${API_BASE_URL}/specialista`, {
                method: 'HEAD',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const isConnected = response.ok
            console.log(`${isConnected ? '✅' : '❌'} [SpecialistaService] Backend ${isConnected ? 'raggiungibile' : 'non raggiungibile'}`)

            return isConnected

        } catch (error) {
            console.warn('⚠️ [SpecialistaService] Backend non raggiungibile:', error.message)
            return false
        }
    },

    /**
     * Cerca specialisti in base a nome, cognome o prestazione
     * Filtro lato frontend per ottimizzare le performance
     * @param {SpecialistaDTO[]} specialisti - Lista degli specialisti già caricati
     * @param {string} query - Stringa di ricerca
     * @returns {SpecialistaDTO[]} Lista degli specialisti filtrati
     */
    filterSpecialisti(specialisti, query = '') {
        if (!query || query.trim() === '') {
            return specialisti
        }

        const queryLower = query.toLowerCase()
        return specialisti.filter(specialista => {
            // Controlli di sicurezza per evitare errori con valori undefined/null
            const nome = specialista.nome || ''
            const cognome = specialista.cognome || ''
            const email = specialista.email || ''
            const nomeCompleto = `${nome} ${cognome}`.trim()
            const prestazioneTipologia = specialista.prestazione?.tipologia || ''

            return nomeCompleto.toLowerCase().includes(queryLower) ||
                   email.toLowerCase().includes(queryLower) ||
                   prestazioneTipologia.toLowerCase().includes(queryLower)
        })
    },

    /**
     * Ottiene il nome completo dello specialista
     * @param {SpecialistaDTO} specialista - Oggetto specialista
     * @returns {string} Nome completo formattato
     */
    getFullName(specialista) {
        if (!specialista) return ''
        const nome = specialista.nome || ''
        const cognome = specialista.cognome || ''
        return `${nome} ${cognome}`.trim()
    },

    /**
     * Valida se un email è in formato corretto
     * @param {string} email - Email da validare
     * @returns {boolean} True se l'email è valida
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    },

    /**
     * Valida se una data è nel formato YYYY-MM-DD
     * @param {string} date - Data da validare
     * @returns {boolean} True se la data è nel formato corretto
     */
    isValidDateFormat(date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        return dateRegex.test(date)
    },

    /**
     * Formatta la data di creazione in formato italiano
     * @param {string|Date} dateString - Data da formattare
     * @returns {string} Data formattata
     */
    formatDate(dateString) {
        if (!dateString) return '-'

        try {
            const date = new Date(dateString)
            return date.toLocaleDateString('it-IT', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })
        } catch (error) {
            console.warn('⚠️ [SpecialistaService] Errore nel formato data:', error)
            return dateString
        }
    }
}

export default SpecialistaService
