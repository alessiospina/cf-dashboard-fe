/**
 * Pinia store for AdminMessage state management
 */

import { defineStore } from 'pinia'
import { AdminMessageService } from '@/services/adminMessageService'

export const useAdminMessageStore = defineStore('adminMessage', {
  state: () => ({
    messages: [],
    loading: false,
    error: null,
    selectedMessage: null,
  }),

  getters: {
    hasMessages: (state) => Array.isArray(state.messages) && state.messages.length > 0,

    totalMessages: (state) => (Array.isArray(state.messages) ? state.messages.length : 0),

    searchMessages: (state) => (searchTerm) => {
      if (!Array.isArray(state.messages)) return []
      if (!searchTerm) return state.messages

      const term = searchTerm.toLowerCase().trim()

      return state.messages.filter((message) => {
        const title = message.title?.toLowerCase() || ''
        const body = message.body?.toLowerCase() || ''
        const type = message.type?.toLowerCase() || ''
        const priority = message.priority?.toLowerCase() || ''
        const status = message.status?.toLowerCase() || ''

        return (
          title.includes(term) ||
          body.includes(term) ||
          type.includes(term) ||
          priority.includes(term) ||
          status.includes(term)
        )
      })
    },
  },

  actions: {
    async fetchMessages() {
      this.loading = true
      this.error = null
      try {
        const messages = await AdminMessageService.getAll()
        this.messages = Array.isArray(messages) ? messages : []
        console.log('Admin messages loaded:', this.messages.length)
      } catch (error) {
        this.error = 'Error loading messages'
        this.messages = []
        console.error('Error fetching admin messages:', error)
      } finally {
        this.loading = false
      }
    },

    async createMessage(data) {
      this.loading = true
      this.error = null
      try {
        const newMessage = await AdminMessageService.create(data)
        this.messages.unshift(newMessage)
        console.log('Admin message created:', newMessage)
        return newMessage
      } catch (error) {
        this.error = 'Error creating message'
        console.error('Error creating admin message:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateMessage(data) {
      this.loading = true
      this.error = null
      try {
        const updated = await AdminMessageService.update(data)
        const index = this.messages.findIndex((m) => m.id === updated.id)
        if (index !== -1) this.messages[index] = updated
        console.log('Admin message updated:', updated)
        return updated
      } catch (error) {
        this.error = 'Error updating message'
        console.error('Error updating admin message:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteMessage(id) {
      this.loading = true
      this.error = null
      try {
        await AdminMessageService.deleteById(id)
        const index = this.messages.findIndex((m) => m.id === id)
        if (index !== -1) this.messages.splice(index, 1)
        if (this.selectedMessage?.id === id) this.selectedMessage = null
        console.log('Admin message deleted:', id)
      } catch (error) {
        this.error = 'Error deleting message'
        console.error('Error deleting admin message:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    selectMessage(message) {
      this.selectedMessage = { ...message }
    },

    clearSelectedMessage() {
      this.selectedMessage = null
    },

    clearError() {
      this.error = null
    },
  },
})
