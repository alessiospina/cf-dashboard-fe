/**
 * Service per la gestione dell'invio email
 */

import httpClient from './httpClient'

export const EmailRequestType = {
  REMINDER_SPECIALISTI_APPUNTAMENTI: 'REMINDER_SPECIALISTI_APPUNTAMENTI',
  REMINDER_PAZIENTE_APPUNTAMENTO:    'REMINDER_PAZIENTE_APPUNTAMENTO',
}

export const EmailService = {

  async sendReminderSpecialisti(specialistiIDs, date) {
    if (!specialistiIDs || !Array.isArray(specialistiIDs) || specialistiIDs.length === 0) {
      throw new Error('È necessario selezionare almeno uno specialista')
    }
    if (!date || !this.isValidDate(date)) {
      throw new Error('È necessario selezionare una data valida')
    }

    const response = await httpClient.post('/email', {
      request: EmailRequestType.REMINDER_SPECIALISTI_APPUNTAMENTI,
      data: { specialistiIDs, date },
    })
    return response.data?.data
  },

  // ── Utility ──────────────────────────────────────────────────────────────

  isValidDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return false
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false
    const d = new Date(dateString)
    return d instanceof Date && !isNaN(d.getTime())
  },

  formatDateForAPI(date) {
    if (!date || !(date instanceof Date)) throw new Error('Data non valida')
    return date.toISOString().split('T')[0]
  },

  parseAPIDate(dateString) {
    if (!this.isValidDate(dateString)) throw new Error('Formato data non valido')
    return new Date(dateString)
  },

  formatDateForDisplay(date) {
    try {
      const d = typeof date === 'string' ? this.parseAPIDate(date) : date
      return d.toLocaleDateString('it-IT', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    } catch {
      return String(date)
    }
  },

  validateSpecialistiIDs(ids) {
    return Array.isArray(ids) && ids.length > 0 &&
           ids.every((id) => Number.isInteger(id) && id > 0)
  },

  analyzeEmailResults(emailResponse) {
    if (!emailResponse?.data) return { total: 0, success: 0, failed: 0, successRate: 0, failedEmails: [] }
    const total        = emailResponse.data.length
    const success      = emailResponse.data.filter((i) => i.success).length
    const failed       = total - success
    const successRate  = total > 0 ? Math.round((success / total) * 100) : 0
    const failedEmails = emailResponse.data.filter((i) => !i.success).map((i) => i.to)
    return { total, success, failed, successRate, failedEmails }
  },

  generateFeedbackMessage({ total, success, failed, successRate }) {
    if (total === 0)        return { type: 'warning', message: 'Nessuna email elaborata' }
    if (success === total)  return { type: 'success', message: `Tutte le ${total} email inviate con successo!` }
    if (failed  === total)  return { type: 'danger',  message: `Tutte le ${total} email sono fallite.` }
    return { type: 'warning', message: `${success}/${total} email inviate (${successRate}%).` }
  },

  getTodayFormatted()    { return this.formatDateForAPI(new Date()) },
  getTomorrowFormatted() {
    const t = new Date()
    t.setDate(t.getDate() + 1)
    return this.formatDateForAPI(t)
  },
  isFutureDate(dateString) {
    if (!this.isValidDate(dateString)) return false
    const today = new Date(); today.setHours(0,0,0,0)
    return this.parseAPIDate(dateString) >= today
  },
}

export default EmailService
