/**
 * Service for AdminMessage API calls
 */

import axios from 'axios'
import { getApiBaseUrl } from '@/config/api'

const API_BASE_URL = getApiBaseUrl()

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

apiClient.interceptors.request.use(
  (config) => {
    console.log('🚀 Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
    })
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  },
)

apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    })
    return response
  },
  (error) => {
    console.error('❌ Response Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    })
    return Promise.reject(error)
  },
)

export class AdminMessageService {
  /**
   * Get all admin messages (admin panel)
   * @returns {Promise<Array>}
   */
  static async getAll() {
    const response = await apiClient.get('/admin-message')
    return response.data?.data ?? []
  }

  /**
   * Get visible messages only (OPEN + IN_PROGRESS)
   * @returns {Promise<Array>}
   */
  static async getVisible() {
    const response = await apiClient.get('/admin-message/visible')
    return response.data?.data ?? []
  }

  /**
   * Get single message by id
   * @param {number} id
   * @returns {Promise<Object>}
   */
  static async getById(id) {
    const response = await apiClient.get(`/admin-message/${id}`)
    return response.data?.data
  }

  /**
   * Create a new admin message
   * @param {Object} data - { title, body, type, priority }
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const response = await apiClient.post('/admin-message', data)
    return response.data?.data
  }

  /**
   * Update an existing admin message
   * @param {Object} data - { id, title?, body?, type?, priority?, status? }
   * @returns {Promise<Object>}
   */
  static async update(data) {
    const response = await apiClient.patch('/admin-message', data)
    return response.data?.data
  }

  /**
   * Delete an admin message
   * @param {number} id
   * @returns {Promise<void>}
   */
  static async deleteById(id) {
    await apiClient.delete(`/admin-message/${id}`)
  }
}
