/**
 * Service per l'autenticazione.
 * Usa httpClient per inviare automaticamente il cookie JWT.
 */

import httpClient from './httpClient'

export class AuthService {
  /**
   * Esegue il login e riceve il cookie JWT httpOnly dal server.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ user: UserDto }>}
   */
  static async login(username, password) {
    const response = await httpClient.post('/auth/login', { username, password })
    return response.data?.data
  }

  /**
   * Esegue il logout e cancella il cookie lato server.
   */
  static async logout() {
    await httpClient.post('/auth/logout')
  }

  /**
   * Recupera i dati dell'utente autenticato corrente.
   * Usato per verificare se il cookie è ancora valido al caricamento dell'app.
   * @returns {Promise<UserDto>}
   */
  static async me() {
    const response = await httpClient.get('/auth/me')
    return response.data?.data
  }
}
