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
        v-for="(evento, index) in eventiRaggruppati"
        :key="evento.id ?? `evento-${index}`"
        class="evento-lista-item"
        @click="evento && $emit('eventoClick', evento)"
      >
        <CCard
          v-if="evento"
          class="evento-card"
          :style="{ '--evento-color': getEventColor(evento) }"
        >
          <CCardBody>
            <!-- Layout Desktop -->
            <CRow class="align-items-center d-none d-md-flex">
              <!-- Orario + durata -->
              <CCol md="2">
                <div class="evento-orario">
                  <div class="ora-inizio">{{ formatTime(evento.dataInizio) }}</div>
                  <div class="ora-fine text-muted">{{ formatTime(evento.dataFine) }}</div>
                  <div class="durata mt-1">{{ formatDuration(evento.dataInizio, evento.dataFine) }}</div>
                </div>
              </CCol>

              <!-- Informazioni principali -->
              <CCol md="6">
                <div class="evento-info">
                  <div class="d-flex align-items-center flex-wrap gap-1 mb-1">
                    <h6 class="evento-titolo mb-0 me-1">{{ evento.titolo || 'Evento senza titolo' }}</h6>
                    <!-- Badge tipo prestazione -->
                    <CBadge
                      v-if="getTipoTerapia(evento)"
                      :style="{
                        backgroundColor: getEventColor(evento),
                        color: getContrastColor(getEventColor(evento)),
                        border: 'none'
                      }"
                      size="sm"
                    >
                      {{ formatTipoTerapia(getTipoTerapia(evento)) }}
                    </CBadge>
                    <!-- Badge stato -->
                    <CBadge
                      :color="getStatoBadgeColor(evento.stato)"
                      size="sm"
                      class="stato-badge"
                    >
                      {{ formatStato(evento.stato) }}
                    </CBadge>
                  </div>
                  <div class="evento-paziente">
                    <CIcon icon="cil-user" class="me-1" />
                    <span>{{ getNomePaziente(evento) || '—' }}</span>
                  </div>
                  <div class="evento-professionista">
                    <CIcon icon="cil-medical-cross" class="me-1" />
                    <span>{{ getNomeSpecialista(evento) || '—' }}</span>
                  </div>
                </div>
              </CCol>

              <!-- Sala -->
              <CCol md="4" class="text-end">
                <div v-if="evento.stanza" class="evento-sala">
                  <CIcon icon="cil-location-pin" class="me-1" />
                  {{ evento.stanza }}
                </div>
                <div v-else class="text-muted fst-italic">
                  <small>—</small>
                </div>
                <div v-if="evento.prezzo" class="evento-prezzo mt-1">
                  <CIcon icon="cil-euro" class="me-1" size="sm"/>
                  <small>{{ formatPrezzo(evento.prezzo) }}</small>
                </div>
              </CCol>
            </CRow>

            <!-- Layout Mobile -->
            <div class="d-block d-md-none mobile-layout">
              <!-- Riga superiore: Orario + Stato -->
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="evento-orario-mobile">
                  <div class="ora-range">
                    {{ formatTime(evento.dataInizio) }} – {{ formatTime(evento.dataFine) }}
                  </div>
                  <div class="durata-mobile">
                    {{ formatDuration(evento.dataInizio, evento.dataFine) }}
                  </div>
                </div>
                <div class="d-flex gap-1 flex-wrap justify-content-end">
                  <CBadge
                    v-if="getTipoTerapia(evento)"
                    :style="{
                      backgroundColor: getEventColor(evento),
                      color: getContrastColor(getEventColor(evento)),
                      border: 'none'
                    }"
                    size="sm"
                  >
                    {{ formatTipoTerapia(getTipoTerapia(evento)) }}
                  </CBadge>
                  <CBadge
                    :color="getStatoBadgeColor(evento.stato)"
                    size="sm"
                    class="stato-badge"
                  >
                    {{ formatStato(evento.stato) }}
                  </CBadge>
                </div>
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
                    {{ getNomePaziente(evento) || '—' }}
                  </span>
                </div>
                <div class="d-flex align-items-center mb-1">
                  <CIcon icon="cil-medical-cross" class="me-2 text-muted icon-mobile" />
                  <span class="evento-professionista-mobile">
                    {{ getNomeSpecialista(evento) || '—' }}
                  </span>
                </div>
                <div class="d-flex align-items-center justify-content-between mt-1">
                  <div v-if="evento.stanza" class="d-flex align-items-center">
                    <CIcon icon="cil-location-pin" class="me-2 text-muted icon-mobile" />
                    <span class="evento-sala-mobile">{{ evento.stanza }}</span>
                  </div>
                  <div v-if="evento.prezzo" class="evento-prezzo-mobile ms-auto">
                    <CIcon icon="cil-euro" class="me-1" size="sm"/>
                    {{ formatPrezzo(evento.prezzo) }}
                  </div>
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
      <p class="text-muted mb-0">
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
  professionisti: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['eventoClick'])
const { formatTime, formatDuration } = useCalendario()

// --- Helper data extraction ---

const getNomePaziente = (evento) => {
  if (!evento?.paziente) return null
  if (evento.paziente.nomeCompleto) return evento.paziente.nomeCompleto
  return `${evento.paziente.nome || ''} ${evento.paziente.cognome || ''}`.trim() || null
}

const getNomeSpecialista = (evento) => {
  if (!evento?.specialista) return null
  if (evento.specialista.nomeCompleto) return evento.specialista.nomeCompleto
  return `${evento.specialista.nome || ''} ${evento.specialista.cognome || ''}`.trim() || null
}

const getTipoTerapia = (evento) => {
  return evento?.specialista?.prestazione?.tipologia || null
}

const formatTipoTerapia = (tipologia) => tipologia || ''

// --- Colors ---

const getEventColor = (evento) => {
  return evento?.specialista?.prestazione?.color || '#6c757d'
}

const getContrastColor = (hexColor) => {
  if (!hexColor) return '#000000'
  try {
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
  } catch {
    return '#000000'
  }
}

// --- Stato badge ---

const getStatoBadgeColor = (stato) => {
  const colors = {
    confermato: 'success',
    in_attesa: 'warning',
    completato: 'info',
    cancellato: 'danger'
  }
  return colors[stato] || 'secondary'
}

const formatStato = (stato) => {
  const labels = {
    confermato: 'Confermato',
    in_attesa: 'In attesa',
    completato: 'Completato',
    cancellato: 'Cancellato'
  }
  return labels[stato] || (stato ? stato : 'N/D')
}

// --- Prezzo ---

const formatPrezzo = (prezzo) => {
  if (prezzo == null) return ''
  return `€ ${parseFloat(prezzo).toFixed(2)}`
}

// --- Computed sorted list ---

const eventiRaggruppati = computed(() => {
  if (!Array.isArray(props.eventi)) return []
  return [...props.eventi]
    .filter(e => e?.dataInizio)
    .sort((a, b) => new Date(a.dataInizio) - new Date(b.dataInizio))
})
</script>

<style scoped>
.lista-view {
  padding: 1rem;
}

.eventi-lista {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.evento-lista-item {
  cursor: pointer;
}

/* Card con bordo sinistro dinamico via CSS custom property */
.evento-card {
  border-left: 4px solid var(--evento-color, var(--cui-primary));
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}

.evento-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

/* Layout Desktop */
.evento-orario {
  text-align: center;
}

.ora-inizio {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--cui-body-color);
  line-height: 1.2;
}

.ora-fine {
  font-size: 0.875rem;
  line-height: 1.2;
}

.durata {
  font-size: 0.75rem;
  color: var(--cui-body-color-muted);
  padding: 0.1rem 0.4rem;
  background-color: var(--cui-tertiary-bg);
  border-radius: 4px;
  display: inline-block;
}

.evento-titolo {
  color: var(--cui-body-color);
  font-weight: 600;
  font-size: 0.95rem;
}

.evento-paziente,
.evento-professionista {
  font-size: 0.85rem;
  color: var(--cui-body-color-muted);
  margin-bottom: 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.evento-sala {
  font-size: 0.875rem;
  color: var(--cui-body-color-muted);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
}

.evento-prezzo {
  font-size: 0.8rem;
  color: var(--cui-success);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* Badge stato */
.stato-badge {
  font-size: 0.7rem;
  font-weight: 500;
}

/* Layout Mobile */
.mobile-layout {
  padding: 0.25rem 0;
}

.evento-orario-mobile {
  flex-shrink: 0;
}

.ora-range {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--cui-body-color);
  line-height: 1.2;
}

.durata-mobile {
  font-size: 0.7rem;
  color: var(--cui-body-color-muted);
  margin-top: 0.1rem;
  padding: 0.1rem 0.35rem;
  background-color: var(--cui-tertiary-bg);
  border-radius: 3px;
  display: inline-block;
}

.evento-titolo-mobile {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--cui-body-color);
  line-height: 1.3;
}

.evento-info-mobile {
  font-size: 0.82rem;
}

.icon-mobile {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.evento-paziente-mobile,
.evento-professionista-mobile,
.evento-sala-mobile {
  color: var(--cui-body-color-muted);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.evento-prezzo-mobile {
  font-size: 0.78rem;
  color: var(--cui-success);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

/* Responsive */
@media (max-width: 767px) {
  .lista-view {
    padding: 0.5rem;
  }

  .eventi-lista {
    gap: 0.5rem;
  }

  .evento-card :deep(.card-body) {
    padding: 0.75rem;
  }
}

/* Loading / empty state */
.text-center.py-4 {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
