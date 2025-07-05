/**
 * Configurazione centralizzata per le API
 * 
 * Questo file contiene tutte le configurazioni relative alle chiamate API,
 * leggendo i valori dalle variabili d'ambiente definite nel file .env
 */

/**
 * Configurazione base per le chiamate API
 * Le variabili vengono lette dal file .env nella root del progetto
 */
const API_CONFIG = {
  // Protocollo HTTP (http o https)
  protocol: import.meta.env.VITE_API_PROTOCOL || 'http',
  
  // Host del backend
  host: import.meta.env.VITE_API_HOST || 'localhost',
  
  // Porta del backend
  port: import.meta.env.VITE_API_PORT || '8000',
  
  // Percorso base delle API
  basePath: '/api'
}

/**
 * Costruisce l'URL completo per le chiamate API
 * @returns {string} URL completo nel formato: protocol://host:port/basePath
 */
export const getApiBaseUrl = () => {
  return `${API_CONFIG.protocol}://${API_CONFIG.host}:${API_CONFIG.port}${API_CONFIG.basePath}`
}

/**
 * Esporta la configurazione per uso diretto se necessario
 */
export { API_CONFIG }

/**
 * Funzione di utilità per costruire URL di specifici endpoint
 * @param {string} endpoint - Endpoint specifico (es: '/evento', '/specialista')
 * @returns {string} URL completo dell'endpoint
 */
export const getApiEndpointUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl()
  // Rimuove la barra iniziale dall'endpoint se presente per evitare doppie barre
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${baseUrl}/${cleanEndpoint}`
}
