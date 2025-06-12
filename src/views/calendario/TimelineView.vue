<template>
  <div class="timeline-view">
    <!-- Loading state -->
    <div v-if="loading" class="timeline-loading">
      <CSpinner color="primary" />
      <p class="mt-2 text-muted">Caricamento timeline...</p>
    </div>

    <!-- Timeline container con struttura ottimizzata -->
    <div v-else-if="professionisti.length > 0" class="timeline-container">
      <!-- Header fisso superiore -->
      <div class="timeline-header-container">
        <!-- Header professionisti fisso -->
        <div class="header-professionisti">
          <div class="professionisti-title">Professionista</div>
        </div>

        <!-- Header orari scrollabile -->
        <div class="header-orari-wrapper">
          <div
            class="header-orari-scrollabile"
            ref="headerOrariRef"
            @scroll="sincronizzaScrollOrizzontale"
          >
            <div class="orari-content">
              <div
                v-for="slot in slotsOrari"
                :key="slot.ora"
                class="slot-orario"
                :class="{ 'ora-corrente': isOraCorrente(slot.ora) }"
              >
                {{ slot.label }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Corpo principale con scroll sincronizzato -->
      <div class="timeline-body-container">
        <!-- Sidebar professionisti con scroll verticale -->
        <div
          class="sidebar-professionisti"
          ref="sidebarRef"
          @scroll="sincronizzaScrollVerticale"
        >
          <div
            v-for="professionista in professionisti"
            :key="`sidebar-${professionista.id}`"
            class="specialista-row"
          >
            <div class="specialista-info">
              <div class="specialista-nome">
                {{ professionista.nome }} {{ professionista.cognome }}
              </div>
              <div class="specialista-specializzazione">
                <CBadge
                  :color="getBadgeColorTerapia(professionista.specializzazione)"
                  shape="rounded-pill"
                  size="sm"
                >
                  {{ formatTipoTerapia(professionista.specializzazione) }}
                </CBadge>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenuto appuntamenti con scroll bi-direzionale -->
        <div
          class="contenuto-appuntamenti"
          ref="contenutoRef"
          @scroll="sincronizzaScrollBidirezionale"
        >
          <div class="griglia-appuntamenti">
            <!-- Riga per ogni professionista -->
            <div
              v-for="professionista in professionisti"
              :key="`content-${professionista.id}`"
              class="appuntamento-row"
            >
              <div class="time-slots-container">
                <!-- Slot orari -->
                <div
                  v-for="slot in slotsOrari"
                  :key="`${professionista.id}-${slot.ora}`"
                  class="time-slot"
                  :class="{
                    'ora-corrente-slot': isOraCorrente(slot.ora)
                  }"
                  @click="creaEventoInSlot(professionista, slot.ora)"
                >
                  <!-- Indicatore ora corrente -->
                  <div
                    v-if="isOraCorrente(slot.ora)"
                    class="indicatore-ora-corrente"
                  ></div>
                </div>

                <!-- Eventi sovrapposti -->
                <div class="eventi-layer">
                  <EventCard
                    v-for="evento in getEventiProfessionista(professionista)"
                    :key="`evento-${evento.id}-${professionista.id}`"
                    :evento="evento"
                    :style="getEventoStyle(evento)"
                    class="evento-timeline"
                    @click="$emit('eventoClick', evento)"
                  />
                </div>
              </div>
            </div>

            <!-- Indicatore ora corrente verticale -->
            <div
              v-if="mostraIndicatoreOra"
              class="indicatore-ora-verticale"
              :style="{ left: getPosizioneOraCorrente() }"
            >
              <div class="linea-ora"></div>
              <div class="ora-label">{{ getOraCorrente() }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Messaggio quando non ci sono professionisti (e quindi eventi) -->
    <div v-else class="text-center p-5">
      <CIcon icon="cil-calendar" size="3xl" class="text-muted mb-3" />
      <h5 class="text-muted">Nessun professionista disponibile</h5>
      <p class="text-muted mb-3">
        I professionisti verranno automaticamente mostrati quando ci saranno eventi programmati.
      </p>
      <p class="text-muted">
        <small>
          Crea il primo appuntamento per iniziare a vedere la timeline dei professionisti.
        </small>
      </p>
    </div>

    <!-- Legenda -->
    <div class="timeline-legenda mt-3">
      <CCard>
        <CCardBody class="py-2">
          <CRow class="align-items-center">
            <CCol md="auto">
              <strong>Legenda:</strong>
            </CCol>
            <CCol>
              <div class="d-flex flex-wrap gap-3">
                <div
                  v-for="(colore, tipo) in COLORI_TERAPIA"
                  :key="tipo"
                  class="legenda-item"
                >
                  <div
                    class="legenda-colore"
                    :style="{ backgroundColor: colore }"
                  ></div>
                  <span class="legenda-testo">{{ formatTipoTerapia(tipo) }}</span>
                </div>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>
    </div>
  </div>
</template>

<script setup>
/**
 * Vista Timeline - Visualizzazione calendario con professionisti estratti dagli eventi
 *
 * Caratteristiche:
 * - Estrae automaticamente i professionisti unici dagli eventi del backend
 * - Visualizza una riga per ogni professionista con i relativi eventi
 * - Scroll sincronizzato tra header, sidebar e contenuto
 * - Indicatori per l'ora corrente
 * - Click sui slot per creare nuovi eventi
 * - Gestione responsive
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCalendario } from '@/composables/useCalendario'
import EventCard from './EventCard.vue'

// Import componenti CoreUI mancanti
import {
  CSpinner,
  CBadge,
  CCard,
  CCardBody,
  CRow,
  CCol
} from '@coreui/vue'

const props = defineProps({
  eventi: { type: Array, default: () => [] },
  professionisti: { type: Array, default: () => [] }, // Professionisti estratti dagli eventi (computed)
  dataSelezionata: { type: String, required: true },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['eventoClick', 'creaEvento'])
const { formatTime, COLORI_TERAPIA } = useCalendario()

// Costanti per la timeline
const ORARIO_INIZIO = 0
const ORARIO_FINE = 24
const INTERVALLO_MINUTI = 30
const LARGHEZZA_SLOT = 80

const oraCorrente = ref(new Date())
const intervalloOra = ref(null)

// Refs per sincronizzare lo scroll
const headerOrariRef = ref(null)
const sidebarRef = ref(null)
const contenutoRef = ref(null)

// Flag per controllare la sincronizzazione e evitare loop
const isSyncingVertical = ref(false)
const isSyncingHorizontal = ref(false)

// Computed per generare gli slot orari
const slotsOrari = computed(() => {
  const slots = []
  for (let ora = ORARIO_INIZIO; ora < ORARIO_FINE; ora++) {
    for (let minuti = 0; minuti < 60; minuti += INTERVALLO_MINUTI) {
      const orario = `${ora.toString().padStart(2, '0')}:${minuti.toString().padStart(2, '0')}`
      slots.push({
        ora: orario,
        label: minuti === 0 ? `${ora}:00` : orario,
        timestamp: ora * 60 + minuti
      })
    }
  }
  return slots
})

// Computed per mostrare indicatore ora corrente
const mostraIndicatoreOra = computed(() => {
  const oggi = new Date().toISOString().split('T')[0]
  return props.dataSelezionata === oggi
})

// Sincronizzazione scroll orizzontale (header orari <-> contenuto)
const sincronizzaScrollOrizzontale = () => {
  if (isSyncingHorizontal.value || !contenutoRef.value) return

  isSyncingHorizontal.value = true
  contenutoRef.value.scrollLeft = headerOrariRef.value.scrollLeft

  requestAnimationFrame(() => {
    isSyncingHorizontal.value = false
  })
}

// Sincronizzazione scroll verticale (sidebar <-> contenuto)
const sincronizzaScrollVerticale = () => {
  if (isSyncingVertical.value || !contenutoRef.value) return

  isSyncingVertical.value = true
  contenutoRef.value.scrollTop = sidebarRef.value.scrollTop

  requestAnimationFrame(() => {
    isSyncingVertical.value = false
  })
}

// Sincronizzazione bidirezionale dal contenuto
const sincronizzaScrollBidirezionale = () => {
  if (!headerOrariRef.value || !sidebarRef.value) return

  // Sincronizza scroll orizzontale con header
  if (!isSyncingHorizontal.value) {
    isSyncingHorizontal.value = true
    headerOrariRef.value.scrollLeft = contenutoRef.value.scrollLeft
    requestAnimationFrame(() => {
      isSyncingHorizontal.value = false
    })
  }

  // Sincronizza scroll verticale con sidebar
  if (!isSyncingVertical.value) {
    isSyncingVertical.value = true
    sidebarRef.value.scrollTop = contenutoRef.value.scrollTop
    requestAnimationFrame(() => {
      isSyncingVertical.value = false
    })
  }
}

// Metodo per aggiornare l'ora corrente
const aggiornaOraCorrente = () => {
  oraCorrente.value = new Date()
}

// Verifica se è l'ora corrente
const isOraCorrente = (oraSlot) => {
  if (!mostraIndicatoreOra.value) return false
  const ora = oraCorrente.value.getHours()
  const minuti = oraCorrente.value.getMinutes()
  const oraCorrenteString = `${ora.toString().padStart(2, '0')}:${Math.floor(minuti / INTERVALLO_MINUTI) * INTERVALLO_MINUTI.toString().padStart(2, '0')}`
  return oraSlot === oraCorrenteString
}

// Ottiene l'ora corrente formattata
const getOraCorrente = () => {
  return oraCorrente.value.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

// Calcola la posizione dell'indicatore ora corrente
const getPosizioneOraCorrente = () => {
  if (!mostraIndicatoreOra.value) return '0px'
  const ora = oraCorrente.value.getHours()
  const minuti = oraCorrente.value.getMinutes()
  const orePassate = ora - ORARIO_INIZIO
  const minutiTotali = (orePassate * 60) + minuti
  const slotsPassati = minutiTotali / INTERVALLO_MINUTI
  const posizione = slotsPassati * LARGHEZZA_SLOT
  return `${posizione}px`
}

// Filtra gli eventi per professionista
const getEventiProfessionista = (professionista) => {
  // Controlli di sicurezza per evitare errori con dati null/undefined
  if (!professionista || !professionista.nomeCompleto || !props.eventi) {
    return []
  }

  // I professionisti ora arrivano dalla computed property che estrae i dati dagli eventi
  // Il backend restituisce il campo "professionista" come stringa (nome completo)
  // Confronta direttamente con il nomeCompleto del professionista estratto dagli eventi
  return props.eventi.filter(evento => {
    // Controlli di sicurezza per l'evento
    if (!evento || !evento.professionista) {
      return false
    }
    return evento.professionista === professionista.nomeCompleto
  })
}

// Calcola lo stile di posizionamento per un evento
const getEventoStyle = (evento) => {
  // Controlli di sicurezza per evitare errori con dati null/undefined
  if (!evento || !evento.dataInizio || !evento.dataFine) {
    return {
      position: 'absolute',
      left: '0px',
      width: '80px',
      top: '4px',
      bottom: '4px',
      zIndex: 10,
      display: 'none' // Nascondi eventi non validi
    }
  }

  const inizio = new Date(evento.dataInizio)
  const fine = new Date(evento.dataFine)

  // Verifica che le date siano valide
  if (isNaN(inizio.getTime()) || isNaN(fine.getTime())) {
    return {
      position: 'absolute',
      left: '0px',
      width: '80px',
      top: '4px',
      bottom: '4px',
      zIndex: 10,
      display: 'none' // Nascondi eventi con date non valide
    }
  }

  const oraInizio = inizio.getHours()
  const minutiInizio = inizio.getMinutes()

  // Calcolo della posizione left basata sui minuti dall'inizio giornata
  const minutiTotaliInizio = ((oraInizio - ORARIO_INIZIO) * 60) + minutiInizio
  const slotsInizio = minutiTotaliInizio / INTERVALLO_MINUTI
  const left = slotsInizio * LARGHEZZA_SLOT

  // Calcolo larghezza basata sulla durata
  const durataMinuti = (fine - inizio) / (1000 * 60)
  const slots = durataMinuti / INTERVALLO_MINUTI
  const width = Math.max((slots * LARGHEZZA_SLOT) - 4, 20) // Larghezza minima di 20px

  return {
    position: 'absolute',
    left: `${left}px`,
    width: `${width}px`,
    top: '4px',
    bottom: '4px',
    zIndex: 10
  }
}

// Crea un nuovo evento in uno slot
const creaEventoInSlot = (professionista, oraSlot) => {
  // Controlli di sicurezza
  if (!professionista || !professionista.nomeCompleto || !oraSlot) {
    console.warn('Dati non validi per la creazione evento:', { professionista, oraSlot })
    return
  }

  console.log('🖱️ Click su slot:', { professionista: professionista.nomeCompleto, oraSlot })
  console.log('✅ Creazione evento in corso...')

  try {
    const [ora, minuti] = oraSlot.split(':').map(Number)

    // Verifica che ora e minuti siano numeri validi
    if (isNaN(ora) || isNaN(minuti)) {
      console.warn('Orario non valido:', oraSlot)
      return
    }

    const dataInizio = new Date(props.dataSelezionata)
    dataInizio.setHours(ora, minuti, 0, 0)
    const dataFine = new Date(dataInizio)
    dataFine.setHours(dataInizio.getHours() + 1) // Durata default 1 ora

    emit('creaEvento', {
      professionista: professionista, // Passa l'oggetto professionista completo
      professionistaNome: professionista.nomeCompleto, // Nome completo per backend
      dataInizio: dataInizio.toISOString(),
      dataFine: dataFine.toISOString()
    })
  } catch (error) {
    console.error('Errore nella creazione evento:', error)
  }
}

// Formatta il tipo di terapia per la visualizzazione
const formatTipoTerapia = (tipoTerapia) => {
  const labels = {
    'LOGOPEDIA': 'Logopedia',
    'NEUROPSICHIATRIA_INFANTILE': 'Neuropsichiatria',
    'NEUROPSICOMOTRICITÀ': 'Neuropsicomotricità',
    'TERAPIA_ABA': 'Terapia ABA',
    'PSICOLOGA': 'Psicologa',
    'COLLOQUIO_CONOSCITIVO': 'Colloquio'
  }
  return labels[tipoTerapia] || tipoTerapia
}

// Ottiene il colore del badge per tipo terapia
const getBadgeColorTerapia = (tipoTerapia) => {
  const colors = {
    'LOGOPEDIA': 'primary',
    'NEUROPSICHIATRIA_INFANTILE': 'success',
    'NEUROPSICOMOTRICITÀ': 'info',
    'TERAPIA_ABA': 'warning',
    'PSICOLOGA': 'secondary',
    'COLLOQUIO_CONOSCITIVO': 'dark'
  }
  return colors[tipoTerapia] || 'light'
}

// Lifecycle hooks
onMounted(() => {
  intervalloOra.value = setInterval(aggiornaOraCorrente, 60000)
})

onUnmounted(() => {
  if (intervalloOra.value) clearInterval(intervalloOra.value)
})
</script>

<style scoped>
/**
 * Stili per Timeline con sincronizzazione perfetta
 */

.timeline-view {
  height: 100%;
  overflow: hidden;
}

.timeline-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
}

/* Container principale */
.timeline-container {
  display: flex;
  flex-direction: column;
  height: 70vh;
  min-height: 600px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

/* HEADER CONTAINER - Layout flexbox per allineamento perfetto */
.timeline-header-container {
  display: flex;
  height: 60px;
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 30;
}

.header-professionisti {
  width: 280px;
  min-width: 280px;
  background: #e9ecef;
  border-right: 2px solid #dee2e6;
  display: flex;
  align-items: center;
  padding: 1rem;
}

.professionisti-title {
  font-weight: 600;
  font-size: 1rem;
  color: #2c3e50;
  margin: 0;
}

.header-orari-wrapper {
  flex: 1;
  overflow: hidden;
}

.header-orari-scrollabile {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.orari-content {
  display: flex;
  min-width: max-content;
}

.slot-orario {
  min-width: 80px;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  border-right: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  height: 60px;
}

.slot-orario.ora-corrente {
  background-color: #ffc107;
  color: #000;
  font-weight: 600;
}

/* CORPO PRINCIPALE - Layout flexbox sincronizzato */
.timeline-body-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar professionisti con scroll verticale */
.sidebar-professionisti {
  width: 280px;
  min-width: 280px;
  background: #f8f9fa;
  border-right: 2px solid #dee2e6;
  overflow-y: auto;
  overflow-x: hidden;
}

.specialista-row {
  height: 80px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
}

.specialista-info {
  padding: 1rem;
  width: 100%;
}

.specialista-nome {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
  color: #2c3e50;
}

.specialista-specializzazione {
  font-size: 0.8rem;
}

/* Contenuto appuntamenti con scroll bidirezionale */
.contenuto-appuntamenti {
  flex: 1;
  overflow: auto;
}

.griglia-appuntamenti {
  position: relative;
  min-width: max-content;
}

.appuntamento-row {
  height: 80px;
  border-bottom: 1px solid #dee2e6;
  position: relative;
}

.time-slots-container {
  position: relative;
  height: 100%;
  display: flex;
}

.time-slot {
  min-width: 80px;
  border-right: 1px solid #f0f0f0;
  cursor: pointer !important;
  transition: background-color 0.2s ease;
  position: relative;
  height: 100%;
  background-color: transparent;
}

.time-slot:hover {
  background-color: rgba(0, 123, 255, 0.1) !important;
  border-color: rgba(0, 123, 255, 0.2);
  cursor: pointer !important;
}

.time-slot.ora-corrente-slot {
  background-color: rgba(255, 193, 7, 0.2);
  cursor: pointer !important;
}

.time-slot.ora-corrente-slot:hover {
  background-color: rgba(255, 193, 7, 0.3) !important;
  cursor: pointer !important;
}

.indicatore-ora-corrente {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 2px;
  background-color: #ffc107;
}

/* Layer degli eventi sovrapposto */
.eventi-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.evento-timeline {
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  pointer-events: auto;
  z-index: 15;
}

.evento-timeline:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  z-index: 20 !important;
}

/* Indicatore ora corrente verticale */
.indicatore-ora-verticale {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 25;
  pointer-events: none;
}

.linea-ora {
  width: 2px;
  height: 100%;
  background-color: #dc3545;
}

.ora-label {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #dc3545;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

/* Legenda */
.legenda-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legenda-colore {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #dee2e6;
}

.legenda-testo {
  font-size: 0.875rem;
  color: #6c757d;
}

/* Personalizzazione scrollbar */
.header-orari-scrollabile::-webkit-scrollbar,
.sidebar-professionisti::-webkit-scrollbar,
.contenuto-appuntamenti::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.header-orari-scrollabile::-webkit-scrollbar-track,
.sidebar-professionisti::-webkit-scrollbar-track,
.contenuto-appuntamenti::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.header-orari-scrollabile::-webkit-scrollbar-thumb,
.sidebar-professionisti::-webkit-scrollbar-thumb,
.contenuto-appuntamenti::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.header-orari-scrollabile::-webkit-scrollbar-thumb:hover,
.sidebar-professionisti::-webkit-scrollbar-thumb:hover,
.contenuto-appuntamenti::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Stili responsive */
@media (max-width: 768px) {
  .header-professionisti,
  .sidebar-professionisti {
    width: 200px;
    min-width: 200px;
  }

  .specialista-nome {
    font-size: 0.85rem;
  }

  .slot-orario {
    min-width: 60px;
    font-size: 0.8rem;
  }
}
</style>
