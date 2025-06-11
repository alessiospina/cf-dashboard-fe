<template>
  <!--
    Pagina principale per la gestione del Calendario

    Questa pagina include:
    - Header con titolo e controlli vista
    - Toolbar con filtri e azioni
    - Vista Timeline o Lista (toggle)
    - Modal per gestione eventi
  -->
  <div class="calendario-page">
    <!-- Header della pagina -->
    <CRow class="mb-4">
      <CCol>
        <h2 class="page-title">
          <CIcon icon="cil-calendar" class="me-2" />
          Calendario Appuntamenti
        </h2>
        <p class="text-muted">
          Gestisci gli appuntamenti e le terapie del centro medico
        </p>
      </CCol>
      <CCol md="auto">
        <CButtonGroup>
          <CButton
            :color="vistaAttiva === 'timeline' ? 'primary' : 'outline-primary'"
            @click="cambiaVista('timeline')"
            size="sm"
          >
            <CIcon icon="cil-grid" class="me-2" />
            Timeline
          </CButton>
          <CButton
            :color="vistaAttiva === 'lista' ? 'primary' : 'outline-primary'"
            @click="cambiaVista('lista')"
            size="sm"
          >
            <CIcon icon="cil-list" class="me-2" />
            Lista
          </CButton>
        </CButtonGroup>
        <CButton
          color="success"
          @click="apriModalNuovoEvento"
          class="ms-2"
        >
          <CIcon icon="cil-plus" class="me-2" />
          Nuovo Appuntamento
        </CButton>
      </CCol>
    </CRow>

    <!-- Filtri e Controlli -->
    <CalendarioFilters
      v-model:data-selezionata="dataSelezionata"
      v-model:specialista-selezionato="specialistaSelezionato"
      v-model:tipo-terapia-selezionato="tipoTerapiaSelezionato"
      :specialisti="specialisti"
      :loading="loading"
      @aggiorna="caricaEventi"
    />

    <!-- Contenuto principale -->
    <CCard>
      <CCardBody class="p-0">
        <!-- Vista Timeline -->
        <TimelineView
          v-if="vistaAttiva === 'timeline'"
          :eventi="eventiFiltrati"
          :specialisti="specialisti"
          :data-selezionata="dataSelezionata"
          :loading="loading"
          @evento-click="apriModalModificaEvento"
          @crea-evento="apriModalNuovoEventoInSlot"
        />

        <!-- Vista Lista -->
        <ListaView
          v-else-if="vistaAttiva === 'lista'"
          :eventi="eventiFiltrati"
          :loading="loading"
          @evento-click="apriModalModificaEvento"
        />
      </CCardBody>
    </CCard>

    <!-- Modal Evento -->
    <EventModal
      :visible="showEventModal"
      :evento="eventoSelezionato"
      :specialisti="specialisti"
      :professionisti="professionisti"
      :pazienti="pazienti"
      :loading-professionisti="loadingProfessionisti"
      :loading-pazienti="loadingPazienti"
      @close="chiudiModalEvento"
      @created="handleEventoCreato"
      @updated="handleEventoAggiornato"
      @deleted="handleEventoEliminato"
    />
  </div>
</template>

<script setup>
/**
 * Pagina Calendario - Container principale
 *
 * Gestisce:
 * - Switch tra viste Timeline/Lista
 * - Filtri e stato globale
 * - Modal gestione eventi
 * - Coordinamento tra componenti
 */

import { ref, computed, onMounted } from 'vue'
import { useCalendario } from '@/composables/useCalendario'
import CalendarioFilters from './CalendarioFilters.vue'
import TimelineView from './TimelineView.vue'
import ListaView from './ListaView.vue'
import EventModal from './EventModal.vue'

// Composable per la logica del calendario
const {
  // Stato
  eventi,
  specialisti,
  professionisti, // Lista professionisti dal backend
  pazienti, // Lista pazienti dal backend
  loading,
  loadingProfessionisti,
  loadingPazienti,
  error,

  // Metodi
  caricaEventi,
  caricaSpecialisti,
  inizializzaCalendario, // Nuovo metodo per inizializzazione completa
  creaEvento,
  aggiornaEvento,
  eliminaEvento,

  // Utilità
  filtraEventi
} = useCalendario()

// Stato locale della vista
const vistaAttiva = ref('timeline')
const dataSelezionata = ref(new Date().toISOString().split('T')[0])
const specialistaSelezionato = ref('')
const tipoTerapiaSelezionato = ref('')

// Stato modal
const showEventModal = ref(false)
const eventoSelezionato = ref(null)

// Computed per eventi filtrati
const eventiFiltrati = computed(() => {
  return filtraEventi(eventi.value, {
    data: dataSelezionata.value,
    specialista: specialistaSelezionato.value,
    tipoTerapia: tipoTerapiaSelezionato.value
  })
})

// Metodi vista
const cambiaVista = (nuovaVista) => {
  vistaAttiva.value = nuovaVista
}

// Metodi modal
const apriModalNuovoEvento = () => {
  eventoSelezionato.value = null
  showEventModal.value = true
}

const apriModalNuovoEventoInSlot = (slotData) => {
  // Crea un evento parziale con i dati dello slot
  eventoSelezionato.value = {
    dataInizio: slotData.dataInizio,
    dataFine: slotData.dataFine,
    specialistaId: slotData.specialistaId
  }
  showEventModal.value = true
}

const apriModalModificaEvento = (evento) => {
  eventoSelezionato.value = evento
  showEventModal.value = true
}

const chiudiModalEvento = () => {
  showEventModal.value = false
  eventoSelezionato.value = null
}

// Gestione eventi modal
const handleEventoCreato = (nuovoEvento) => {
  console.log('Evento creato:', nuovoEvento)
  caricaEventi()
  chiudiModalEvento()
}

const handleEventoAggiornato = (eventoAggiornato) => {
  console.log('Evento aggiornato:', eventoAggiornato)
  caricaEventi()
  chiudiModalEvento()
}

const handleEventoEliminato = (eventoId) => {
  console.log('Evento eliminato:', eventoId)
  caricaEventi()
  chiudiModalEvento()
}

// Caricamento iniziale - Inizializza tutto il calendario una sola volta
onMounted(async () => {
  console.log('Inizializzazione pagina calendario...')
  await inizializzaCalendario()
  console.log('Pagina calendario pronta')
})
</script>

<style scoped>
/**
 * Stili per la pagina Calendario
 */

.calendario-page {
  padding: 0;
}

.page-title {
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* Stili responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }
}
</style>
