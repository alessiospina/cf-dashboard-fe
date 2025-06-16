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
            :color="vistaAttiva === 'timeline' ? 'primary' : undefined"
            :variant="vistaAttiva === 'timeline' ? undefined : 'outline'"
            @click="cambiaVista('timeline')"
            size="sm"
          >
            <CIcon icon="cil-grid" class="me-2" />
            Timeline
          </CButton>
          <CButton
            :color="vistaAttiva === 'lista' ? 'primary' : undefined"
            :variant="vistaAttiva === 'lista' ? undefined : 'outline'"
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
      @aggiorna="aggiornaEventi"
    />

    <!-- Contenuto principale -->
    <CCard>
      <CCardBody class="p-0">
        <!-- Gestione errori -->
        <CAlert
          v-if="error"
          color="danger"
          class="m-3"
          :dismissible="true"
          @close="clearError"
        >
          <CIcon icon="cil-warning" class="me-2" />
          {{ error }}
          <div class="mt-2">
            <CButton
              variant="outline"
              color="danger"
              size="sm"
              @click="aggiornaEventi"
            >
              <CIcon icon="cil-reload" class="me-2" />
              Riprova
            </CButton>
          </div>
        </CAlert>

        <!-- Loading overlay -->
        <div v-if="loading" class="text-center p-4">
          <CSpinner color="primary" class="me-2" />
          <span class="text-muted">Caricamento eventi...</span>
        </div>

        <!-- Vista Timeline -->
        <TimelineView
          v-else-if="vistaAttiva === 'timeline'"
          :eventi="eventiFiltrati"
          :professionisti="professionistiDaEventi"
          :data-selezionata="dataSelezionata"
          :loading="loading"
          @evento-click="apriModalModificaEvento"
          @crea-evento="apriModalNuovoEventoInSlot"
        />

        <!-- Vista Lista -->
        <ListaView
          v-else-if="vistaAttiva === 'lista'"
          :eventi="eventiFiltrati"
          :professionisti="professionistiDaEventi"
          :loading="loading"
          @evento-click="apriModalModificaEvento"
        />

        <!-- Messaggio quando non ci sono eventi -->
        <div v-if="!loading && eventiFiltrati.length === 0" class="text-center p-5">
          <CIcon icon="cil-calendar" size="3xl" class="text-muted mb-3" />
          <h5 class="text-muted">Nessun evento trovato</h5>
          <p class="text-muted mb-3">
            Non ci sono appuntamenti per i filtri selezionati.
          </p>
          <p class="text-muted mb-4">
            <small>
              Quando ci saranno eventi, i professionisti verranno automaticamente mostrati nella timeline e nella lista.
            </small>
          </p>
          <CButton
            color="primary"
            @click="apriModalNuovoEvento"
          >
            <CIcon icon="cil-plus" class="me-2" />
            Crea il primo appuntamento
          </CButton>
        </div>
      </CCardBody>
    </CCard>

    <!-- Modal Evento -->
    <EventModal
      :visible="showEventModal"
      :evento="eventoSelezionato"
      :specialisti="specialisti"
      :pazienti="pazienti"
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

import { ref, computed, onMounted, watch } from 'vue'
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
  professionistiDaEventi, // Lista specialisti estratti dagli eventi (computed)
  pazienti, // Lista pazienti dal backend
  loading,
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
  filtraEventi,
  clearError
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
const handleEventoCreato = async (nuovoEvento) => {
  console.log('Evento creato:', nuovoEvento)
  // Ricarica eventi per la data corrente
  await caricaEventi(dataSelezionata.value)
  chiudiModalEvento()
}

const handleEventoAggiornato = async (eventoAggiornato) => {
  console.log('Evento aggiornato:', eventoAggiornato)
  // Ricarica eventi per la data corrente
  await caricaEventi(dataSelezionata.value)
  chiudiModalEvento()
}

const handleEventoEliminato = async (eventoId) => {
  console.log('Evento eliminato:', eventoId)
  // Ricarica eventi per la data corrente
  await caricaEventi(dataSelezionata.value)
  chiudiModalEvento()
}

// Funzione per ricaricare eventi manualmente
const aggiornaEventi = async () => {
  console.log('Ricaricamento manuale eventi per:', dataSelezionata.value)
  await caricaEventi(dataSelezionata.value)
}

// Watcher per la data selezionata - ricarica eventi quando cambia la data
watch(dataSelezionata, async (nuovaData, vecchiaData) => {
  if (nuovaData !== vecchiaData) {
    console.log(`Data cambiata da ${vecchiaData} a ${nuovaData}, ricarico eventi...`)
    try {
      await caricaEventi(nuovaData)
      console.log('Eventi ricaricati con successo per la nuova data')
    } catch (err) {
      console.error('Errore nel ricaricamento eventi per la nuova data:', err)
    }
  }
})

// Caricamento iniziale - Inizializza tutto il calendario una sola volta
onMounted(async () => {
  console.log('Inizializzazione pagina calendario...')
  try {
    // Inizializza il calendario con la data selezionata inizialmente
    await inizializzaCalendario(dataSelezionata.value)
    console.log('Pagina calendario pronta')
  } catch (err) {
    console.error('Errore nell\'inizializzazione calendario:', err)
  }
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
