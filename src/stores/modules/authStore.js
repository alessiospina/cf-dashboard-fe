import { defineStore } from 'pinia'
import { AuthService } from '@/services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,        // UserDto { id, username, role, createdAt }
    loading: false,
    error: null,
    initialized: false, // true dopo la prima chiamata a initAuth()
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    currentUser:     (state) => state.user,
  },

  actions: {
    /**
     * Verifica se il cookie JWT è ancora valido chiamando GET /auth/me.
     * Va invocato una sola volta al caricamento dell'app (nel router guard).
     */
    async initAuth() {
      if (this.initialized) return
      this.loading = true
      try {
        this.user = await AuthService.me()
      } catch {
        this.user = null
      } finally {
        this.loading = false
        this.initialized = true
      }
    },

    /**
     * Esegue il login e popola lo stato utente.
     * @param {string} username
     * @param {string} password
     */
    async login(username, password) {
      this.loading = true
      this.error = null
      try {
        const data = await AuthService.login(username, password)
        this.user = data?.user ?? null
        this.initialized = true
      } catch (err) {
        const msg = err.response?.data?.message
        this.error = typeof msg === 'string' ? msg : 'Credenziali non valide'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Esegue il logout, cancella il cookie e resetta lo stato.
     */
    async logout() {
      try {
        await AuthService.logout()
      } catch {
        // ignora errori di rete durante il logout
      } finally {
        this.user = null
        this.initialized = false
      }
    },

    clearError() {
      this.error = null
    },
  },
})
