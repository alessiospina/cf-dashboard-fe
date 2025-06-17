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
              <CCol md="5">
                <div class="evento-info">
                  <div class="d-flex align-items-center mb-2">
                    <h6 class="evento-titolo mb-0 me-2">{{ evento.titolo || 'Evento senza titolo' }}</h6>
                    <CBadge
                      v-if="getTipoTerapia(evento)"
                      :color="getBadgeColorTerapia(evento)"
                      :style="{
                        backgroundColor: evento?.specialista?.prestazione?.color || undefined,
                        color: getContrastColor(evento?.specialista?.prestazione?.color || '#6c757d'),
                        border: 'none'
                      }"
                      size="sm"
                    >
                      {{ formatTipoTerapia(getTipoTerapia(evento)) }}
                    </CBadge>
                  </div>
                  <div class="evento-paziente">
                    <CIcon icon="cil-user" class="me-1" />
                    {{ getNomePaziente(evento) || 'Paziente non specificato' }}
                  </div>
                  <div class="evento-professionista">
                    <CIcon icon="cil-medical-cross" class="me-1" />
                    {{ getNomeSpecialista(evento) || 'Professionista non specificato' }}
                  </div>
                </div>
              </CCol>

              <!-- Sala -->
              <CCol md="2">
                <div v-if="evento.stanza" class="evento-sala">
                  <CIcon icon="cil-location-pin" class="me-1" />
                  {{ evento.stanza }}
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

// Funzioni helper per mappare correttamente i dati degli eventi
const getNomePaziente = (evento) => {
  try {
    if (!evento || !evento.paziente) return null

    // Se esiste nomeCompleto, usalo
    if (evento.paziente.nomeCompleto) {
      return evento.paziente.nomeCompleto
    }

    // Altrimenti costruisci il nome completo
    const nome = evento.paziente.nome || ''
    const cognome = evento.paziente.cognome || ''
    const nomeCompleto = `${nome} ${cognome}`.trim()

    return nomeCompleto || null
  } catch (error) {
    console.warn('Errore nel recupero nome paziente:', error)
    return null
  }
}

const getNomeSpecialista = (evento) => {
  try {
    if (!evento || !evento.specialista) return null

    // Se esiste nomeCompleto, usalo
    if (evento.specialista.nomeCompleto) {
      return evento.specialista.nomeCompleto
    }

    // Altrimenti costruisci il nome completo
    const nome = evento.specialista.nome || ''
    const cognome = evento.specialista.cognome || ''
    const nomeCompleto = `${nome} ${cognome}`.trim()

    return nomeCompleto || null
  } catch (error) {
    console.warn('Errore nel recupero nome specialista:', error)
    return null
  }
}

const getTipoTerapia = (evento) => {
  try {
    // Il tipo terapia si trova nella prestazione dello specialista
    return evento?.specialista?.prestazione?.tipologia || null
  } catch (error) {
    console.warn('Errore nel recupero tipo terapia:', error)
    return null
  }
}

const formatTipoTerapia = (tipologia) => {
  if (!tipologia) return ''

  const labels = {
    'LOGOPEDIA': 'Logopedia',
    'NEUROPSICHIATRIA_INFANTILE': 'Neuropsichiatria',
    'NEUROPSICOMOTRICITÀ': 'Neuropsicomotricità',
    'TERAPIA_ABA': 'Terapia ABA',
    'PSICOLOGA': 'Psicologa',
    'COLLOQUIO_CONOSCITIVO': 'Colloquio'
  }
  return labels[tipologia] || tipologia
}

const getBadgeColorTerapia = (evento) => {
  try {
    // Usa il colore dalla prestazione nel database se disponibile
    if (evento?.specialista?.prestazione?.color) {
      return evento.specialista.prestazione.color
    }

    // Fallback ai colori predefiniti solo se non c'è colore nel DB
    if (!evento || !evento.specialista?.prestazione?.tipologia) return 'secondary'

    const tipologia = evento.specialista.prestazione.tipologia
    const colors = {
      'LOGOPEDIA': 'primary',
      'NEUROPSICHIATRIA_INFANTILE': 'success',
      'NEUROPSICOMOTRICITÀ': 'info',
      'TERAPIA_ABA': 'warning',
      'PSICOLOGA': 'secondary',
      'COLLOQUIO_CONOSCITIVO': 'dark'
    }
    return colors[tipologia] || 'light'
  } catch (error) {
    console.warn('Errore nel recupero colore terapia:', error)
    return 'secondary'
  }
}

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

const getContrastColor = (hexColor) => {
  if (!hexColor) return '#000000'

  try {
    // Rimuovi il # se presente
    const hex = hexColor.replace('#', '')

    // Converte hex in RGB
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // Calcola la luminanza
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    // Restituisce bianco per colori scuri, nero per colori chiari
    return luminance > 0.5 ? '#000000' : '#ffffff'
  } catch (error) {
    console.warn('Errore nel calcolo contrasto colore:', error)
    return '#000000'
  }
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
