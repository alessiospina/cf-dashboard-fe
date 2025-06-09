<template>
  <div
    class="event-card"
    :class="[
      `event-card--${evento.stato}`,
      { 'event-card--small': isSmall }
    ]"
    :style="{
      backgroundColor: evento.colore,
      borderLeftColor: evento.colore
    }"
    @click="$emit('click', evento)"
  >
    <!-- Contenuto evento -->
    <div class="event-content">
      <!-- Header con tipo terapia e stato -->
      <div class="event-header">
        <div class="event-tipo" :title="evento.titolo">
          {{ getTipoTerapiaShort(evento.tipoTerapia) }}
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
        <div class="event-paziente" :title="evento.paziente.nomeCompleto">
          {{ evento.paziente.nome }} {{ evento.paziente.cognome }}
        </div>
        <div class="event-orario">
          {{ formatOrario(evento.dataInizio) }} - {{ formatOrario(evento.dataFine) }}
        </div>
        <div v-if="evento.sala" class="event-sala">
          <CIcon icon="cil-location-pin" size="sm" class="me-1" />
          {{ evento.sala }}
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

const props = defineProps({
  evento: { type: Object, required: true },
  small: { type: Boolean, default: false }
})

const emit = defineEmits(['click'])
const { formatTime, formatDuration } = useCalendario()

const isSmall = computed(() => {
  const inizio = new Date(props.evento.dataInizio)
  const fine = new Date(props.evento.dataFine)
  const durataOre = (fine - inizio) / (1000 * 60 * 60)
  return props.small || durataOre < 1
})

const formatOrario = (dateString) => {
  return new Date(dateString).toLocaleTimeString('it-IT', {
    hour: '2-digit', minute: '2-digit'
  })
}

const formatDurata = (dataInizio, dataFine) => {
  const inizio = new Date(dataInizio)
  const fine = new Date(dataFine)
  const durataMs = fine - inizio
  const durataOre = Math.floor(durataMs / (1000 * 60 * 60))
  const durataMinuti = Math.floor((durataMs % (1000 * 60 * 60)) / (1000 * 60))

  if (durataMinuti === 0) return `${durataOre}h`
  return `${durataOre}h ${durataMinuti}m`
}

const getTipoTerapiaShort = (tipoTerapia) => {
  const shortcuts = {
    'LOGOPEDIA': 'LOG',
    'NEUROPSICHIATRIA_INFANTILE': 'NPI',
    'NEUROPSICOMOTRICITÀ': 'TNPEE',
    'TERAPIA_ABA': 'ABA',
    'PSICOLOGA': 'PSY',
    'COLLOQUIO_CONOSCITIVO': 'COLL'
  }
  return shortcuts[tipoTerapia] || tipoTerapia.slice(0, 3)
}

const getStatoIcon = (stato) => {
  const icons = {
    'confermato': 'cil-check-circle',
    'in_attesa': 'cil-clock',
    'completato': 'cil-check',
    'cancellato': 'cil-x-circle'
  }
  return icons[stato] || 'cil-info'
}

const getStatoClass = (stato) => {
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
.event-card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
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
  background: rgba(255, 255, 255, 1);
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 30;
}

.event-card--small {
  height: 76px; /* Mantiene la stessa altezza anche per eventi piccoli */
  min-height: 76px;
  max-height: 76px;
  font-size: 0.8rem;
}
.event-card--confermato { border-left-color: #198754; }
.event-card--in_attesa { border-left-color: #ffc107; background: rgba(255, 193, 7, 0.1); }
.event-card--completato { border-left-color: #0d6efd; opacity: 0.8; }
.event-card--cancellato { border-left-color: #dc3545; background: rgba(220, 53, 69, 0.1); opacity: 0.7; text-decoration: line-through; }

.event-content { padding: 0.5rem; flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
.event-card--small .event-content { padding: 0.375rem; gap: 0.125rem; }

.event-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }

.event-tipo {
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-stato { opacity: 0.9; }
.event-body { flex: 1; display: flex; flex-direction: column; gap: 0.125rem; }

.event-paziente {
  font-weight: 600;
  font-size: 0.85rem;
  color: #2c3e50;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.event-card--small .event-paziente { font-size: 0.75rem; }

.event-orario { font-size: 0.75rem; color: #6c757d; font-weight: 500; line-height: 1.1; }
.event-card--small .event-orario { font-size: 0.7rem; }

.event-sala {
  font-size: 0.7rem;
  color: #8a8a8a;
  display: flex;
  align-items: center;
  margin-top: auto;
}

.event-durata {
  font-size: 0.7rem;
  color: #fff;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  text-align: center;
  margin-top: auto;
  font-weight: 600;
}

.event-indicator { position: absolute; top: 0; right: 0; width: 4px; height: 100%; opacity: 0.8; }
.event-indicator--confermato { background: linear-gradient(to bottom, #198754, #20c997); }
.event-indicator--in_attesa { background: linear-gradient(to bottom, #ffc107, #ffcd39); }
.event-indicator--completato { background: linear-gradient(to bottom, #0d6efd, #4dabf7); }
.event-indicator--cancellato { background: linear-gradient(to bottom, #dc3545, #e74c3c); }

.event-card { animation: slideIn 0.3s ease-out; }
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
