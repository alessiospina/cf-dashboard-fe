/**
 * Service per la gestione degli specialisti
 */

import httpClient from './httpClient'

export const SpecialistaService = {

  async getAllSpecialisti() {
    const response = await httpClient.get('/specialista')
    return response.data?.data || []
  },

  async getSpecialistaById(id) {
    const response = await httpClient.get(`/specialista/${id}`)
    return response.data?.data
  },

  async createSpecialista(specialistaData) {
    const response = await httpClient.post('/specialista', specialistaData)
    return response.data?.data
  },

  async updateSpecialista(id, specialistaData) {
    const response = await httpClient.put(`/specialista/${id}`, specialistaData)
    return response.data?.data
  },

  async deleteSpecialista(id) {
    await httpClient.delete(`/specialista/${id}`)
  },

  async getSpecialistiByEvento(date) {
    if (!date || !this.isValidDateFormat(date)) {
      throw new Error('Formato data non valido. Usare YYYY-MM-DD')
    }
    const response = await httpClient.get(`/specialista/by/evento`, { params: { date } })
    return response.data?.data || []
  },

  async testConnection() {
    try {
      await httpClient.head('/specialista')
      return true
    } catch {
      return false
    }
  },

  // ── Utility (lato frontend) ──────────────────────────────────────────────

  filterSpecialisti(specialisti, query = '') {
    if (!query || query.trim() === '') return specialisti
    const q = query.toLowerCase()
    return specialisti.filter((s) => {
      const nome    = (s.nome    || '').toLowerCase()
      const cognome = (s.cognome || '').toLowerCase()
      const email   = (s.email   || '').toLowerCase()
      const tipo    = (s.prestazione?.tipologia || '').toLowerCase()
      return `${nome} ${cognome}`.includes(q) || email.includes(q) || tipo.includes(q)
    })
  },

  getFullName(specialista) {
    if (!specialista) return ''
    return `${specialista.nome || ''} ${specialista.cognome || ''}`.trim()
  },

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  },

  isValidDateFormat(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date)
  },

  formatDate(dateString) {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('it-IT', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      })
    } catch {
      return dateString
    }
  },
}

export default SpecialistaService
