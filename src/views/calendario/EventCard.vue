<template>
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
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCalendario } from '@/composables/useCalendario'
// CIcon è registrato globalmente in main.js, non serve importarlo

const props = defineProps({
  evento: { type: Object, required: true },
  small: { type: Boolean, default: false }
})

const emit = defineEmits(['click'])
const { formatTime, formatDuration } = useCalendario()

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
</script>

<style scoped>
/**
 * Stili EventCard con supporto completo per dark mode
 * Utilizza le variabili CSS di CoreUI per compatibilità totale
 */

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
</style>
