/**
 * Service per la gestione dei professionisti
 * Interagisce con l'API backend per ottenere i dati dei professionisti
 * Include fallback ai dati mock se il backend non è disponibile
 */

// Configurazione dell'API
const API_BASE_URL = 'http://localhost:8000/api'

/**
 * Interfaccia per il DTO del professionista dal backend
 * @typedef {Object} ProfessionistaDto
 * @property {string} nominativo - Il nominativo completo del professionista
 */

/**
 * Interfaccia per la risposta del server
 * @typedef {Object} ServerResponse
 * @property {T} data - I dati della risposta
 * @property {boolean} success - Indica se l'operazione è andata a buon fine
 * @property {string|null} error - Messaggio di errore se presente
 */

export const ProfessionistaService = {
    /**
     * Ottiene tutti i professionisti dal backend
     * @returns {Promise<ProfessionistaDto[]>} Lista dei professionisti
     */
    async getAllProfessionisti() {
        try {
            // Chiamata all'API backend per ottenere i professionisti
            const response = await fetch(`${API_BASE_URL}/evento/professionisti`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status} - ${response.statusText}`)
            }

            /** @type {ServerResponse<ProfessionistaDto[]>} */
            const data = await response.json()

            // Mappa i dati del backend al formato utilizzato dal frontend
            return data.data

        } catch (error) {
            console.error('Errore nel caricamento dei professionisti:', error)

            // Rilancia l'errore per permettere al chiamante di gestirlo
            throw new Error(
                error.message || 'Errore di comunicazione con il server durante il caricamento dei professionisti'
            )
        }
    },

    /**
     * Cerca professionisti in base al nominativo
     * @param {string} query - Stringa di ricerca per filtrare i professionisti (opzionale)
     * @returns {Promise<ProfessionistaDto[]>} Lista dei professionisti filtrati
     */
    async cercaProfessionisti(query = '') {
        try {
            // Prima ottiene tutti i professionisti
            const tuttiProfessionisti = await this.getAllProfessionisti()

            // Se non c'è query o è vuota, restituisce tutti
            if (!query || query.trim() === '') {
                return tuttiProfessionisti
            }

            // Filtra i professionisti localmente in base alla query
            const queryLower = query.toLowerCase()
            return tuttiProfessionisti.filter(professionista =>
                professionista.nominativo.toLowerCase().includes(queryLower) ||
                (professionista.nome && professionista.nome.toLowerCase().includes(queryLower)) ||
                (professionista.cognome && professionista.cognome.toLowerCase().includes(queryLower))
            )

        } catch (error) {
            console.error('Errore nella ricerca dei professionisti:', error)
            throw error
        }
    },

    /**
     * Valida se un nominativo di professionista esiste
     * @param {string} nominativo - Il nominativo da validare
     * @returns {Promise<boolean>} True se il professionista esiste
     */
    async validaProfessionista(nominativo) {
        try {
            if (!nominativo || nominativo.trim() === '') {
                return false
            }

            const professionisti = await this.getAllProfessionisti()
            return professionisti.some(p =>
                p.nominativo.toLowerCase() === nominativo.toLowerCase()
            )

        } catch (error) {
            console.error('Errore nella validazione del professionista:', error)
            return false // In caso di errore, considera come non valido
        }
    }
}

export default ProfessionistaService
