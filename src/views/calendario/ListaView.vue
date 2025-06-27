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
            <!-- Layout Desktop -->
            <CRow class="align-items-center d-none d-md-flex">
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

              <!-- Azioni rapide (opzionale per desktop) -->
              <CCol md="3" class="text-end">
                <CButton
                  variant="ghost"
                  color="primary"
                  size="sm"
                  @click.stop="$emit('eventoClick', evento)"
                >
                  <CIcon icon="cil-pencil" />
                </CButton>
              </CCol>
            </CRow>

            <!-- Layout Mobile -->
            <div class="d-block d-md-none mobile-layout">
              <!-- Riga superiore: Orario e Badge -->
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="evento-orario-mobile">
                  <div class="ora-range">
                    {{ formatTime(evento.dataInizio) }} - {{ formatTime(evento.dataFine) }}
                  </div>
                  <div class="durata-mobile">
                    {{ formatDuration(evento.dataInizio, evento.dataFine) }}
                  </div>
                </div>
                <CBadge
                  v-if="getTipoTerapia(evento)"
                  :color="getBadgeColorTerapia(evento)"
                  :style="{
                    backgroundColor: evento?.specialista?.prestazione?.color || undefined,
                    color: getContrastColor(evento?.specialista?.prestazione?.color || '#6c757d'),
                    border: 'none'
                  }"
                  size="sm"
                  class="flex-shrink-0"
                >
                  {{ formatTipoTerapia(getTipoTerapia(evento)) }}
                </CBadge>
              </div>

              <!-- Titolo evento -->
              <h6 class="evento-titolo-mobile mb-2">
                {{ evento.titolo || 'Evento senza titolo' }}
              </h6>

              <!-- Informazioni principali compatte -->
              <div class="evento-info-mobile">
                <div class="d-flex align-items-center mb-1">
                  <CIcon icon="cil-user" class="me-2 text-muted icon-mobile" />
                  <span class="evento-paziente-mobile">
                    {{ getNomePaziente(evento) || 'Paziente non specificato' }}
                  </span>
                </div>
                <div class="d-flex align-items-center mb-1">
                  <CIcon icon="cil-medical-cross" class="me-2 text-muted icon-mobile" />
                  <span class="evento-professionista-mobile">
                    {{ getNomeSpecialista(evento) || 'Professionista non specificato' }}
                  </span>
                </div>
                <div v-if="evento.stanza" class="d-flex align-items-center">
                  <CIcon icon="cil-location-pin" class="me-2 text-muted icon-mobile" />
                  <span class="evento-sala-mobile">{{ evento.stanza }}</span>
                </div>
              </div>
            </div>
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

// ✅ AGGIORNATO - Formattazione semplificata per tipologie prestazioni dinamiche
const formatTipoTerapia = (tipologia) => {
  // Restituisce direttamente la tipologia dal backend (già formattata correttamente)
  return tipologia || ''
}

// ✅ AGGIORNATO - Ottiene colore dinamico dalle prestazioni del backend
const getBadgeColorTerapia = (evento) => {
  try {
    // ✅ PRIORITÀ 1: Usa il colore dalla prestazione nel database (dinamico)
    if (evento?.specialista?.prestazione?.color) {
      return evento.specialista.prestazione.color
    }

    // ✅ FALLBACK: Colore neutro se non definito dal backend
    return '#6c757d' // Grigio neutro
  } catch (error) {
    console.warn('Errore nel recupero colore prestazione:', error)
    return '#6c757d'
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
/**
 * Stili per ListaView - Responsive ottimizzato
 */

.lista-view {
  padding: 1rem;
}

.eventi-lista {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.evento-lista-item {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.evento-lista-item:hover {
  transform: translateY(-2px);
}

.evento-card {
  border-left: 4px solid #0d6efd;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}

.evento-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Stili Desktop */
.evento-orario {
  text-align: center;
}

.ora-inizio {
  font-weight: 600;
  font-size: 1.1rem;
  color: #495057;
}

.ora-fine {
  color: var(--cui-text-muted);
  font-size: 0.9rem;
}

.durata {
  font-size: 0.8rem;
  color: var(--cui-text-muted);
  margin-top: 0.25rem;
  padding: 0.1rem 0.5rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
  display: inline-block;
}

.evento-titolo {
  color: var(--cui-body-color);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.evento-paziente,
.evento-professionista {
  font-size: 0.9rem;
  color: var(--cui-text-muted);
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
}

.evento-sala {
  font-size: 0.9rem;
  color: var(--cui-text-muted);
  display: flex;
  align-items: center;
}

/* Stili Mobile */
.mobile-layout {
  padding: 0.5rem 0;
}

.evento-orario-mobile {
  flex-shrink: 0;
}

.ora-range {
  font-weight: 600;
  font-size: 0.95rem;
  color: #495057;
  line-height: 1.2;
}

.durata-mobile {
  font-size: 0.75rem;
  color: var(--cui-text-muted);
  margin-top: 0.15rem;
  padding: 0.1rem 0.4rem;
  background-color: #f8f9fa;
  border-radius: 0.25rem;
  display: inline-block;
}

.evento-titolo-mobile {
  font-size: 1rem;
  font-weight: 600;
  color: var(--cui-body-color);
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.evento-info-mobile {
  font-size: 0.85rem;
}

.icon-mobile {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.evento-paziente-mobile,
.evento-professionista-mobile,
.evento-sala-mobile {
  color: #6c757d;
  line-height: 1.4;
}

/* Responsive breakpoints specifici */
@media (max-width: 991px) {
  .lista-view {
    padding: 0.75rem;
  }

  .eventi-lista {
    gap: 0.75rem;
  }
}

@media (max-width: 767px) {
  .lista-view {
    padding: 0.5rem;
  }

  .eventi-lista {
    gap: 0.5rem;
  }

  .evento-card .card-body {
    padding: 0.75rem;
  }

  .mobile-layout {
    padding: 0;
  }

  /* Ottimizzazione per schermi molto piccoli */
  @media (max-width: 576px) {
    .ora-range {
      font-size: 0.9rem;
    }

    .evento-titolo-mobile {
      font-size: 0.95rem;
    }

    .evento-info-mobile {
      font-size: 0.8rem;
    }

    .durata-mobile {
      font-size: 0.7rem;
    }
  }
}

/* Miglioramenti per accessibilità e UX */
.evento-lista-item:focus {
  outline: 2px solid #5856d6;
  outline-offset: 2px;
  border-radius: 0.375rem;
}

.evento-card {
  transition: all 0.2s ease;
}

/* Stili per stato loading */
.text-center.py-4 {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* Stili per stato vuoto responsive */
@media (max-width: 767px) {
  .text-center.py-5 {
    padding: 2rem 1rem !important;
  }

  .text-center.py-5 h5 {
    font-size: 1.1rem;
  }

  .text-center.py-5 p {
    font-size: 0.9rem;
  }
}

/* Badge responsive */
.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

@media (max-width: 767px) {
  .badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
  }
}

/* Hover states per mobile */
@media (hover: hover) {
  .evento-lista-item:hover .evento-card {
    border-left-color: #5856d6;
  }
}

/* Dark mode support */
[data-coreui-theme="dark"] .durata,
[data-coreui-theme="dark"] .durata-mobile {
  background-color: #374151;
  color: #d1d5db;
}

[data-coreui-theme="dark"] .evento-card {
  background-color: #1f2937;
  border-color: rgba(255, 255, 255, 0.1);
}

[data-coreui-theme="dark"] .ora-inizio,
[data-coreui-theme="dark"] .ora-range {
  color: #f9fafb;
}
</style>
