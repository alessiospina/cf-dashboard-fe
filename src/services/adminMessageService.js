/**
 * Service for AdminMessage API calls
 */

import httpClient from './httpClient'

export class AdminMessageService {
  /**
   * Get all admin messages (admin panel)
   * @returns {Promise<Array>}
   */
  static async getAll() {
    const response = await httpClient.get('/admin-message')
    return response.data?.data ?? []
  }

  /**
   * Get visible messages only (OPEN + IN_PROGRESS)
   * @returns {Promise<Array>}
   */
  static async getVisible() {
    const response = await httpClient.get('/admin-message/visible')
    return response.data?.data ?? []
  }

  /**
   * Get single message by id
   * @param {number} id
   * @returns {Promise<Object>}
   */
  static async getById(id) {
    const response = await httpClient.get(`/admin-message/${id}`)
    return response.data?.data
  }

  /**
   * Create a new admin message
   * @param {Object} data - { title, body, type, priority }
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const response = await httpClient.post('/admin-message', data)
    return response.data?.data
  }

  /**
   * Update an existing admin message
   * @param {Object} data - { id, title?, body?, type?, priority?, status? }
   * @returns {Promise<Object>}
   */
  static async update(data) {
    const response = await httpClient.patch('/admin-message', data)
    return response.data?.data
  }

  /**
   * Delete an admin message
   * @param {number} id
   * @returns {Promise<void>}
   */
  static async deleteById(id) {
    await httpClient.delete(`/admin-message/${id}`)
  }
}
