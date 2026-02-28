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
    <!-- Filtri e Controlli -->
    <CalendarioFilters
      v-model:data-selezionata="dataSelezionata"
      v-model:specialista-selezionato="specialistaSelezionato"
      v-model:tipo-terapia-selezionato="tipoTerapiaSelezionato"
      v-model:vista-attiva="vistaAttiva"
      :specialisti="specialisti"
      :loading="loading"
      @aggiorna="aggiornaEventi"
      @nuovo-evento="apriModalNuovoEvento"
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

        <!-- Vista Timeline - SOLO se ci sono eventi -->
        <TimelineView
          v-if="!loading && vistaAttiva === 'timeline' && eventiFiltrati.length > 0"
          :eventi="eventiFiltrati"
          :professionisti="specialistiFiltrati"
          :data-selezionata="dataSelezionata"
          :loading="loading"
          @evento-click="apriModalModificaEvento"
          @crea-evento="apriModalNuovoEventoInSlot"
        />

        <!-- Vista Lista - SOLO se ci sono eventi -->
        <ListaView
          v-if="!loading && vistaAttiva === 'lista' && eventiFiltrati.length > 0"
          :eventi="eventiFiltrati"
          :professionisti="specialistiFiltrati"
          :loading="loading"
          @evento-click="apriModalModificaEvento"
        />

        <!-- Nessun evento -->
        <div v-if="!loading && eventiFiltrati.length === 0" class="text-center p-5">
          <CIcon icon="cil-calendar" size="3xl" class="text-muted mb-3" />
          <h5 class="text-muted">Nessun appuntamento</h5>
          <p class="text-muted mb-4">
            <span v-if="specialistaSelezionato || tipoTerapiaSelezionato">
              Nessun risultato per i filtri selezionati.
            </span>
            <span v-else>
              Non ci sono appuntamenti per questa data.
            </span>
          </p>
          <CButton color="primary" @click="apriModalNuovoEvento">
            <CIcon icon="cil-plus" class="me-2" />
            Nuovo appuntamento
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

    <!-- Modal Azione Evento -->
    <EventActionModal
      :visible="showEventActionModal"
      :evento="eventoSelezionato"
      @close="chiudiModalAzione"
      @modifica="handleModificaEvento"
      @cancella="handleCancellaEvento"
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

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useCalendario } from '@/composables/useCalendario'
import CalendarioFilters from './CalendarioFilters.vue'
import TimelineView from './TimelineView.vue'
import ListaView from './ListaView.vue'
import EventModal from './EventModal.vue'
import EventActionModal from './EventActionModal.vue'

// Composable per la logica del calendario
const {
  // Stato
  eventi,
  specialisti,
  specialistiDaEventi, // Lista specialisti estratti dagli eventi (computed)
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
  estraiSpecialistiDaEventi, // Aggiungiamo questa funzione
  clearError
} = useCalendario()

// Rilevamento responsivo semplificato
const VISTA_KEY = 'calendario_vista_preference'

const getDefaultView = () => {
  const saved = localStorage.getItem(VISTA_KEY)
  if (saved) return saved
  return window.innerWidth < 768 ? 'lista' : 'timeline'
}

const saveUserPreference = (vista) => {
  localStorage.setItem(VISTA_KEY, vista)
}

// Stato locale della vista
const vistaAttiva = ref('timeline') // Inizializziamo con default, verrà aggiornato in onMounted
const dataSelezionata = ref(new Date().toISOString().split('T')[0])
const specialistaSelezionato = ref('')
const tipoTerapiaSelezionato = ref('')

// Stato modal
const showEventModal = ref(false)
const showEventActionModal = ref(false) // Nuova modal per scegliere azione
const eventoSelezionato = ref(null)

// Computed per eventi filtrati
const eventiFiltrati = computed(() => {
  return filtraEventi(eventi.value, {
    data: dataSelezionata.value,
    specialista: specialistaSelezionato.value,
    tipoTerapia: tipoTerapiaSelezionato.value
  })
})

// Computed per specialisti filtrati (basato sugli eventi filtrati)
const specialistiFiltrati = computed(() => {
  return estraiSpecialistiDaEventi(eventiFiltrati.value)
})

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
  // Ora apre prima la modal di scelta azione anziché direttamente quella di modifica
  eventoSelezionato.value = evento
  showEventActionModal.value = true
}

const chiudiModalEvento = () => {
  showEventModal.value = false
  eventoSelezionato.value = null
}

// Nuove funzioni per gestire la modal di azione
const chiudiModalAzione = () => {
  showEventActionModal.value = false
  eventoSelezionato.value = null
}

const handleModificaEvento = (evento) => {
  // Chiude la modal di azione e apre quella di modifica
  showEventActionModal.value = false
  eventoSelezionato.value = evento
  showEventModal.value = true
}

const handleCancellaEvento = async () => {
  showEventActionModal.value = false
  eventoSelezionato.value = null
  await caricaEventi(dataSelezionata.value)
}

const handleEventoCreato = async () => {
  await caricaEventi(dataSelezionata.value)
  chiudiModalEvento()
}

const handleEventoAggiornato = async () => {
  await caricaEventi(dataSelezionata.value)
  chiudiModalEvento()
}

const handleEventoEliminato = async () => {
  await caricaEventi(dataSelezionata.value)
  chiudiModalEvento()
}

const aggiornaEventi = async () => {
  await caricaEventi(dataSelezionata.value)
}

// Ricarica eventi al cambio data
watch(dataSelezionata, async (nuovaData, vecchiaData) => {
  if (nuovaData !== vecchiaData) {
    await caricaEventi(nuovaData)
  }
})

// Salva la preferenza di vista quando l'utente la cambia
watch(vistaAttiva, (nuovaVista, vecchiaVista) => {
  if (vecchiaVista && nuovaVista !== vecchiaVista) {
    saveUserPreference(nuovaVista)
  }
})

// Aggiorna vista su resize (solo se non ha una preferenza salvata)
const onWindowResize = () => {
  if (!localStorage.getItem(VISTA_KEY)) {
    vistaAttiva.value = window.innerWidth < 768 ? 'lista' : 'timeline'
  }
}

onMounted(async () => {
  vistaAttiva.value = getDefaultView()
  await inizializzaCalendario(dataSelezionata.value)
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
})
</script>

<style scoped>
.calendario-page {
  padding: 0;
}
</style>
