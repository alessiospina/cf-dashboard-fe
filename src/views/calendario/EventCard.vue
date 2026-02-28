<template>
  <div class="event-card-container">
    <div
      class="event-card"
      :class="[
        `event-card--${evento.stato || 'default'}`,
        { 'event-card--small': isSmall }
      ]"
      :style="{
        backgroundColor: getEventBackgroundColor(),
        borderLeftColor: getEventBorderColor()
      }"
      @click="$emit('click', evento)"
      @contextmenu.prevent="showContextMenu = true"
    >
      <!-- Contenuto evento -->
      <div class="event-content">
        <!-- Header con stanza e stato -->
        <div class="event-header">
          <div class="event-tipo" :title="`Stanza: ${evento.stanza || 'Non specificata'}`">
            {{ evento.stanza || '---' }}
          </div>
          <div class="event-stato">
            <CIcon
              :icon="getStatoIcon(evento.stato)"
              size="sm"
              :class="getStatoClass(evento.stato)"
            />
          </div>
        </div>

        <!-- Body con paziente e orario -->
        <div class="event-body">
          <div class="event-paziente" :title="evento.paziente?.nomeCompleto || 'Paziente non specificato'">
            {{ evento.paziente?.nome || 'N/A' }} {{ evento.paziente?.cognome || '' }}
          </div>
          <div class="event-orario">
            {{ formatOrario(evento.dataInizio) }} - {{ formatOrario(evento.dataFine) }}
          </div>
        </div>

        <!-- Durata (mostrata solo se c'è spazio) -->
        <div v-if="!isSmall" class="event-durata">
          {{ formatDurata(evento.dataInizio, evento.dataFine) }}
        </div>
      </div>

      <!-- Indicatore stato laterale -->
      <div class="event-indicator" :class="`event-indicator--${evento.stato}`"></div>

      <!-- ⭐ NUOVO - Indicatore evento ricorrente -->
      <div v-if="isEventoRicorrente" class="recurring-indicator" title="Evento ricorrente">
        <CIcon icon="cil-reload" size="sm"/>
      </div>

      <!-- ⭐ NUOVO - Bottone menu 3 pallini -->
      <div class="event-menu-trigger" @click.stop="toggleDropdownMenu">
        <CIcon icon="cil-options" size="sm"/>
      </div>

      <!-- ⭐ NUOVO - Dropdown menu -->
      <div v-if="showDropdownMenu" class="event-dropdown-menu" @click.stop>
        <div class="dropdown-backdrop" @click="showDropdownMenu = false"></div>
        <div class="dropdown-content">
          <div class="dropdown-item" @click="handleModifica">
            <CIcon icon="cil-pencil" class="me-2"/>
            Modifica evento
          </div>
          <div class="dropdown-item dropdown-item--danger" @click="handleElimina">
            <CIcon icon="cil-trash" class="me-2"/>
            Elimina evento
          </div>
        </div>
      </div>
    </div>

    <!-- Modal per conferma eliminazione (gestisce singoli e ricorrenti) -->
    <ConfirmDeleteModal
      :visible="showDeleteModal"
      :evento="evento"
      @close="handleDeleteModalClosed"
      @deleted="handleDeleted"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDeleteRecurringEvent } from '@/composables/useDeleteRecurringEvent'
import ConfirmDeleteModal from './ConfirmDeleteModal.vue'
// CIcon è registrato globalmente in main.js, non serve importarlo

const props = defineProps({
  evento: { type: Object, required: true },
  small: { type: Boolean, default: false }
})

const emit = defineEmits(['click', 'deleted'])

// Composable per verifica ricorrenza
const { checkIsEventoRicorrente } = useDeleteRecurringEvent()

// ⭐ NUOVO - Stato per dropdown menu e modal
const showDropdownMenu = ref(false)
const showDeleteModal = ref(false)

const toggleDropdownMenu = () => {
  showDropdownMenu.value = !showDropdownMenu.value
}

// ⭐ NUOVO - Computed per verificare se è evento ricorrente
const isEventoRicorrente = computed(() => {
  return checkIsEventoRicorrente(props.evento)
})

// Funzione per ottenere il colore di sfondo dell'evento
const getEventBackgroundColor = () => {
  // L'evento ha uno specialista con prestazione che contiene il colore
  if (props.evento?.specialista?.prestazione?.color) {
    // Rendiamo il colore più trasparente per lo sfondo
    return addOpacityToColor(props.evento.specialista.prestazione.color, 0.15)
  }

  // Colore di default per eventi senza prestazione
  return '#f8f9fa'
}

// Funzione per ottenere il colore del bordo sinistro dell'evento
const getEventBorderColor = () => {
  // L'evento ha uno specialista con prestazione che contiene il colore
  if (props.evento?.specialista?.prestazione?.color) {
    return props.evento.specialista.prestazione.color
  }

  // Colore di default per eventi senza prestazione
  return '#6c757d'
}

// Funzione helper per aggiungere opacità a un colore esadecimale
const addOpacityToColor = (hexColor, opacity) => {
  // Rimuovi il # se presente
  const hex = hexColor.replace('#', '')

  // Converte hex in RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Restituisce in formato rgba
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

const isSmall = computed(() => {
  // Controlli di sicurezza per evitare errori con dati null/undefined
  if (!props.evento || !props.evento.dataInizio || !props.evento.dataFine) {
    return props.small
  }

  try {
    const inizio = new Date(props.evento.dataInizio)
    const fine = new Date(props.evento.dataFine)

    // Verifica che le date siano valide
    if (isNaN(inizio.getTime()) || isNaN(fine.getTime())) {
      return props.small
    }

    const durataOre = (fine - inizio) / (1000 * 60 * 60)
    return props.small || durataOre < 1
  } catch (error) {
    console.warn('Errore nel calcolo durata evento:', error)
    return props.small
  }
})

const formatOrario = (dateString) => {
  if (!dateString) return '--:--'

  try {
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit', minute: '2-digit'
    })
  } catch (error) {
    console.warn('Errore nel formato orario:', error)
    return '--:--'
  }
}

const formatDurata = (dataInizio, dataFine) => {
  if (!dataInizio || !dataFine) return '--'

  try {
    const inizio = new Date(dataInizio)
    const fine = new Date(dataFine)

    // Verifica che le date siano valide
    if (isNaN(inizio.getTime()) || isNaN(fine.getTime())) {
      return '--'
    }

    const durataMs = fine - inizio
    const durataOre = Math.floor(durataMs / (1000 * 60 * 60))
    const durataMinuti = Math.floor((durataMs % (1000 * 60 * 60)) / (1000 * 60))

    if (durataMinuti === 0) return `${durataOre}h`
    return `${durataOre}h ${durataMinuti}m`
  } catch (error) {
    console.warn('Errore nel calcolo durata:', error)
    return '--'
  }
}

const getStatoIcon = (stato) => {
  if (!stato) return 'cil-options'

  const icons = {
    'confermato': 'cil-check-circle',
    'in_attesa': 'cil-clock',
    'completato': 'cil-check',
    'cancellato': 'cil-x-circle'
  }
  return icons[stato] || 'cil-options'
}

const getStatoClass = (stato) => {
  if (!stato) return 'text-muted'

  const classes = {
    'confermato': 'text-success',
    'in_attesa': 'text-warning',
    'completato': 'text-primary',
    'cancellato': 'text-danger'
  }
  return classes[stato] || 'text-muted'
}

// ⭐ NUOVO - Gestione azioni menu contestuale
const handleModifica = () => {
  showDropdownMenu.value = false
  emit('click', props.evento)
}

const handleElimina = () => {
  showDropdownMenu.value = false
  showDeleteModal.value = true
}

// Handlers per la modal di eliminazione
const handleDeleteModalClosed = () => {
  showDeleteModal.value = false
}

const handleDeleted = (risultato) => {
  showDeleteModal.value = false
  emit('deleted', risultato)
}
</script>

<style scoped>
/**
 * Stili EventCard con supporto completo per dark mode
 * Utilizza le variabili CSS di CoreUI per compatibilità totale
 */

.event-card-container {
  position: relative;
  height: 100%;
}

.event-card {
  position: relative;
  background: var(--cui-body-bg);
  border: 1px solid var(--cui-border-color);
  border-left: 4px solid;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  height: 100%;
  min-height: 60px;
  display: flex;
  flex-direction: column;
}

.event-card:hover {
  background: var(--cui-tertiary-bg);
  transform: scale(1.02);
  box-shadow: var(--cui-box-shadow);
  z-index: 30;
}

.event-card--small {
  height: 76px;
  min-height: 76px;
  max-height: 76px;
  font-size: 0.8rem;
}

/* Stati evento - rimossi i colori hardcoded per usare quelli dinamici */
.event-card--confermato {
  /* Il colore viene impostato dinamicamente dal JavaScript */
}

.event-card--in_attesa {
  /* Background viene impostato dinamicamente se necessario */
}

.event-card--completato {
  opacity: 0.8;
}

.event-card--cancellato {
  opacity: 0.7;
  text-decoration: line-through;
}

.event-card--default {
  /* Il colore viene impostato dinamicamente dal JavaScript */
}

.event-content {
  padding: 0.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.event-card--small .event-content {
  padding: 0.375rem;
  gap: 0.125rem;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.event-tipo {
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  color: var(--cui-body-color);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-stato {
  opacity: 0.9;
}

.event-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.event-paziente {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--cui-body-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.event-card--small .event-paziente {
  font-size: 0.75rem;
}

.event-orario {
  font-size: 0.75rem;
  color: var(--cui-body-color-muted);
  font-weight: 500;
  line-height: 1.1;
}

.event-card--small .event-orario {
  font-size: 0.7rem;
}

.event-durata {
  font-size: 0.7rem;
  color: var(--cui-body-bg);
  background: var(--cui-body-color-muted);
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  text-align: center;
  margin-top: auto;
  font-weight: 600;
  opacity: 0.8;
}

.event-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  opacity: 0.8;
}

/* ⭐ NUOVO - Indicatore eventi ricorrenti */
.recurring-indicator {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: var(--cui-warning);
  color: var(--cui-warning-text-emphasis);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  z-index: 10;
  opacity: 0.9;
}

.event-card--small .recurring-indicator {
  width: 16px;
  height: 16px;
  font-size: 0.6rem;
  top: 0.2rem;
  right: 0.2rem;
}

/* ⭐ NUOVO - Menu contestuale */
.context-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1050;
  pointer-events: auto;
}

.context-menu-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
}

.context-menu-content {
  position: absolute;
  background: var(--cui-body-bg);
  border: 1px solid var(--cui-border-color);
  border-radius: 8px;
  box-shadow: var(--cui-box-shadow-lg);
  padding: 0.5rem 0;
  min-width: 180px;
  z-index: 1051;

  /* Posizionamento dinamico tramite JavaScript se necessario */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.context-menu-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
  color: var(--cui-body-color);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
}

.context-menu-item:hover {
  background-color: var(--cui-gray-100);
}

.context-menu-item--danger {
  color: var(--cui-danger);
}

.context-menu-item--danger:hover {
  background-color: rgba(var(--cui-danger-rgb), 0.1);
}

/* Indicatori stato con gradienti che si adattano al tema */
.event-indicator--confermato {
  background: linear-gradient(to bottom, var(--cui-success), var(--cui-success-text-emphasis));
}

.event-indicator--in_attesa {
  background: linear-gradient(to bottom, var(--cui-warning), var(--cui-warning-text-emphasis));
}

.event-indicator--completato {
  background: linear-gradient(to bottom, var(--cui-info), var(--cui-info-text-emphasis));
}

.event-indicator--cancellato {
  background: linear-gradient(to bottom, var(--cui-danger), var(--cui-danger-text-emphasis));
}

/* Animazione di entrata */
.event-card {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Animazione menu contestuale */
.context-menu-content {
  animation: contextMenuSlideIn 0.2s ease-out;
}

@keyframes contextMenuSlideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

/**
 * Miglioramenti specifici per dark mode
 */
[data-coreui-theme="dark"] .event-card {
  /* Migliora il contrasto in dark mode */
  .event-durata {
    background: var(--cui-body-color);
    color: var(--cui-body-bg);
    opacity: 0.9;
  }

  /* Migliora l'hover in dark mode */
  &:hover {
    box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
  }

  /* Assicura che i colori siano sempre leggibili */
  .event-tipo,
  .event-paziente {
    color: var(--cui-body-color);
  }

  .event-orario {
    color: var(--cui-body-color-muted);
  }
}

[data-coreui-theme="dark"] .context-menu-content {
  background: var(--cui-dark);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

[data-coreui-theme="dark"] .context-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .context-menu-content {
    min-width: 160px;
    font-size: 0.8rem;
  }

  .context-menu-item {
    padding: 0.4rem 0.8rem;
  }

  .recurring-indicator {
    width: 18px;
    height: 18px;
    font-size: 0.65rem;
  }
}
</style>
