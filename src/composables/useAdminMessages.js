/**
 * Composable for AdminMessage UI logic
 */

import { ref, reactive, computed } from 'vue'
import { useAdminMessageStore } from '@/stores/modules/adminMessageStore'

export function useAdminMessages() {
  const store = useAdminMessageStore()

  // --- UI state ---
  const searchTerm = ref('')
  const showCreateModal = ref(false)
  const showEditModal = ref(false)
  const showDeleteModal = ref(false)
  const messageToDelete = ref(null)
  const notification = ref(null)

  // --- Column filters ---
  const filters = reactive({
    type: '',
    priority: '',
    status: '',
  })

  // --- Computed ---
  const messages = computed(() => store.messages)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)
  const selectedMessage = computed(() => store.selectedMessage)

  const filteredMessages = computed(() => {
    let result = store.searchMessages(searchTerm.value)
    if (filters.type)     result = result.filter(m => m.type     === filters.type)
    if (filters.priority) result = result.filter(m => m.priority === filters.priority)
    if (filters.status)   result = result.filter(m => m.status   === filters.status)
    return result
  })

  // Last 4 closed reports — shown as summary cards
  const lastClosed = computed(() =>
    store.messages
      .filter(m => m.status === 'CLOSED')
      .sort((a, b) => new Date(b.closedAt ?? b.updatedAt) - new Date(a.closedAt ?? a.updatedAt))
      .slice(0, 4),
  )

  // KPI stats
  const stats = computed(() => ({
    total:      store.messages.length,
    open:       store.messages.filter(m => m.status === 'OPEN').length,
    inProgress: store.messages.filter(m => m.status === 'IN_PROGRESS').length,
    resolved:   store.messages.filter(m => m.status === 'RESOLVED').length,
    closed:     store.messages.filter(m => m.status === 'CLOSED').length,
  }))

  // Number of active column filters (excludes searchTerm)
  const activeFiltersCount = computed(() =>
    Object.values(filters).filter(Boolean).length
  )

  function resetFilters() {
    filters.type     = ''
    filters.priority = ''
    filters.status   = ''
    searchTerm.value = ''
  }

  // --- Notification helpers ---
  function showNotification(message, type = 'success') {
    notification.value = { message, type }
    setTimeout(() => { notification.value = null }, 4000)
  }

  // --- Data fetching ---
  async function fetchMessages() {
    await store.fetchMessages()
  }

  // --- Create ---
  function openCreateModal() {
    store.clearSelectedMessage()
    showCreateModal.value = true
  }

  function closeCreateModal() {
    showCreateModal.value = false
  }

  async function createMessage(data) {
    try {
      await store.createMessage(data)
      closeCreateModal()
      showNotification('Report creato con successo')
    } catch {
      showNotification('Errore durante la creazione del report', 'danger')
    }
  }

  // --- Edit (title / body / type / priority only — no status) ---
  function openEditModal(message) {
    store.selectMessage(message)
    showEditModal.value = true
  }

  function closeEditModal() {
    showEditModal.value = false
    store.clearSelectedMessage()
  }

  async function updateMessage(data) {
    try {
      await store.updateMessage(data)
      closeEditModal()
      showNotification('Report aggiornato con successo')
    } catch {
      showNotification("Errore durante l'aggiornamento del report", 'danger')
    }
  }

  // --- Reopen (admin can only set status back to OPEN, then edit modal opens) ---
  async function reopenMessage(id) {
    try {
      await store.updateMessage({ id, status: 'OPEN' })
      showNotification('Report riaperto con successo')
      // Open edit modal so the user can add context notes
      const updatedMessage = store.messages.find(m => m.id === id)
      if (updatedMessage) openEditModal(updatedMessage)
    } catch {
      showNotification('Errore durante la riapertura del report', 'danger')
    }
  }

  // --- Delete ---
  function openDeleteModal(message) {
    messageToDelete.value = message
    showDeleteModal.value = true
  }

  function closeDeleteModal() {
    showDeleteModal.value = false
    messageToDelete.value = null
  }

  async function deleteMessage() {
    if (!messageToDelete.value) return
    try {
      await store.deleteMessage(messageToDelete.value.id)
      closeDeleteModal()
      showNotification('Report eliminato con successo')
    } catch {
      showNotification("Errore durante l'eliminazione del report", 'danger')
    }
  }

  // --- Badge helpers ---
  const TYPE_COLOR = {
    PROBLEM: 'danger',
    FEEDBACK: 'info',
    REPORT: 'warning',
  }

  const PRIORITY_COLOR = {
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'danger',
  }

  const STATUS_COLOR = {
    OPEN: 'primary',
    IN_PROGRESS: 'warning',
    RESOLVED: 'success',
    CLOSED: 'secondary',
  }

  const TYPE_LABEL = {
    PROBLEM: 'Problema',
    FEEDBACK: 'Feedback',
    REPORT: 'Segnalazione',
  }

  const PRIORITY_LABEL = {
    LOW: 'Bassa',
    MEDIUM: 'Media',
    HIGH: 'Alta',
  }

  const STATUS_LABEL = {
    OPEN: 'Aperto',
    IN_PROGRESS: 'In lavorazione',
    RESOLVED: 'Risolto',
    CLOSED: 'Chiuso',
  }

  function typeColor(type)         { return TYPE_COLOR[type]         ?? 'secondary' }
  function priorityColor(priority) { return PRIORITY_COLOR[priority] ?? 'secondary' }
  function statusColor(status)     { return STATUS_COLOR[status]     ?? 'secondary' }
  function typeLabel(type)         { return TYPE_LABEL[type]         ?? type }
  function priorityLabel(priority) { return PRIORITY_LABEL[priority] ?? priority }
  function statusLabel(status)     { return STATUS_LABEL[status]     ?? status }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  }

  /**
   * Restituisce una data relativa se < 7 giorni fa, altrimenti la data formattata.
   * Es.: "Oggi", "Ieri", "3 giorni fa", "15/02/2026"
   */
  function formatRelativeDate(dateStr) {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    const now   = new Date()
    const diffMs   = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Oggi'
    if (diffDays === 1) return 'Ieri'
    if (diffDays < 7)  return `${diffDays} giorni fa`
    return formatDate(dateStr)
  }

  return {
    // state
    messages,
    filteredMessages,
    lastClosed,
    stats,
    loading,
    error,
    selectedMessage,
    searchTerm,
    filters,
    activeFiltersCount,
    notification,
    showCreateModal,
    showEditModal,
    showDeleteModal,
    messageToDelete,
    // actions
    fetchMessages,
    createMessage,
    updateMessage,
    reopenMessage,
    deleteMessage,
    resetFilters,
    // modal controls
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    // helpers
    typeColor,
    priorityColor,
    statusColor,
    typeLabel,
    priorityLabel,
    statusLabel,
    formatDate,
    formatRelativeDate,
  }
}
