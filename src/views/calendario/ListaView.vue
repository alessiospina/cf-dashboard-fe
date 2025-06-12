<template>
  <div class="lista-view">
    <!-- Loading state -->
    <div v-if="loading" class="text-center py-4">
      <CSpinner color="primary" />
      <p class="mt-2 text-muted">Caricamento eventi...</p>
    </div>

    <!-- Lista eventi -->
    <div v-else-if="eventi.length > 0" class="eventi-lista">
      <div
        v-for="evento in eventiRaggruppati"
        :key="evento.id || `evento-${Math.random()}`"
        class="evento-lista-item"
        @click="evento && $emit('eventoClick', evento)"
      >
        <CCard v-if="evento" class="evento-card">
          <CCardBody>
            <CRow class="align-items-center">
              <!-- Orario -->
              <CCol md="2">
                <div class="evento-orario">
                  <div class="ora-inizio">{{ formatTime(evento.dataInizio) }}</div>
                  <div class="ora-fine">{{ formatTime(evento.dataFine) }}</div>
                  <div class="durata">{{ formatDuration(evento.dataInizio, evento.dataFine) }}</div>
                </div>
              </CCol>

              <!-- Informazioni principali -->
              <CCol md="6">
                <div class="evento-info">
                  <h6 class="evento-titolo">{{ evento.titolo || 'Evento senza titolo' }}</h6>
                  <div class="evento-paziente">
                    <CIcon icon="cil-user" class="me-1" />
                    {{ evento.paziente?.nomeCompleto || 'Paziente non specificato' }}
                  </div>
                  <div class="evento-professionista">
                    <CIcon icon="cil-medical-cross" class="me-1" />
                    {{ evento.professionista || 'Professionista non specificato' }}
                  </div>
                </div>
              </CCol>

              <!-- Stato e azioni -->
              <CCol md="2">
                <CBadge
                  :color="getStatoBadgeColor(evento.stato)"
                  shape="rounded-pill"
                >
                  {{ formatStato(evento.stato) }}
                </CBadge>
              </CCol>

              <!-- Sala -->
              <CCol md="2">
                <div v-if="evento.sala" class="evento-sala">
                  <CIcon icon="cil-location-pin" class="me-1" />
                  {{ evento.sala }}
                </div>
                <div v-else class="evento-sala text-muted">
                  <small>Sala non specificata</small>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </div>
    </div>

    <!-- Stato vuoto -->
    <div v-else class="text-center py-5">
      <CIcon icon="cil-calendar" size="3xl" class="text-muted mb-3" />
      <h5 class="text-muted">Nessun evento trovato</h5>
      <p class="text-muted">
        Non ci sono appuntamenti per i filtri selezionati
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCalendario } from '@/composables/useCalendario'

const props = defineProps({
  eventi: { type: Array, default: () => [] },
  professionisti: { type: Array, default: () => [] }, // Aggiunto per coerenza con TimelineView
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['eventoClick'])
const { formatTime, formatDuration } = useCalendario()

const eventiRaggruppati = computed(() => {
  try {
    // Controlli di sicurezza per evitare errori con dati null/undefined
    if (!props.eventi || !Array.isArray(props.eventi)) {
      console.warn('Array eventi non valido in ListaView')
      return []
    }

    return [...props.eventi]
      .filter(evento => evento && evento.dataInizio) // Filtra eventi non validi
      .sort((a, b) => {
        try {
          const dateA = new Date(a.dataInizio)
          const dateB = new Date(b.dataInizio)

          // Verifica che le date siano valide
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return 0
          }

          return dateA - dateB
        } catch (error) {
          console.warn('Errore nell\'ordinamento eventi:', error)
          return 0
        }
      })
  } catch (error) {
    console.error('Errore nella computed eventiRaggruppati:', error)
    return []
  }
})

const getStatoBadgeColor = (stato) => {
  if (!stato) return 'secondary'

  const colors = {
    'confermato': 'success',
    'in_attesa': 'warning',
    'completato': 'primary',
    'cancellato': 'danger'
  }
  return colors[stato] || 'secondary'
}

const formatStato = (stato) => {
  if (!stato) return 'Non definito'

  const labels = {
    'confermato': 'Confermato',
    'in_attesa': 'In Attesa',
    'completato': 'Completato',
    'cancellato': 'Cancellato'
  }
  return labels[stato] || stato
}
</script>

<style scoped>
.lista-view { padding: 1rem; }
.eventi-lista { display: flex; flex-direction: column; gap: 1rem; }
.evento-lista-item { cursor: pointer; transition: transform 0.2s; }
.evento-lista-item:hover { transform: translateY(-2px); }
.evento-card { border-left: 4px solid #0d6efd; }
.evento-orario { text-align: center; }
.ora-inizio { font-weight: 600; font-size: 1.1rem; }
.ora-fine { color: #6c757d; font-size: 0.9rem; }
.durata { font-size: 0.8rem; color: #8a8a8a; margin-top: 0.25rem; }
.evento-titolo { color: #2c3e50; margin-bottom: 0.5rem; }
.evento-paziente, .evento-professionista { font-size: 0.9rem; color: #6c757d; margin-bottom: 0.25rem; }
.evento-sala { font-size: 0.9rem; color: #8a8a8a; }
</style>
