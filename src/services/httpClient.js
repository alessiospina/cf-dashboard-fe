/**
 * Client HTTP centralizzato per tutte le chiamate API.
 *
 * - Imposta withCredentials: true per inviare il cookie JWT httpOnly con ogni richiesta
 * - Gestisce automaticamente il redirect al login in caso di 401
 */

import axios from 'axios'
import { getApiBaseUrl } from '@/config/api'

const httpClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true, // invia il cookie JWT con ogni richiesta
})

// Redirect automatico al login se il token è scaduto o assente
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Evita loop se siamo già sulla pagina di login
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default httpClient
