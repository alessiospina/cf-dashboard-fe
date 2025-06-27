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
    </CRow>

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

        <!-- UNICO messaggio quando non ci sono eventi -->
        <div v-if="!loading && eventiFiltrati.length === 0" class="text-center p-5">
          <CIcon icon="cil-calendar" size="3xl" class="text-muted mb-3" />
          <h5 class="text-muted">Nessun evento trovato</h5>
          <p class="text-muted mb-3">
            Non ci sono appuntamenti per i filtri selezionati.
          </p>
          <p class="text-muted mb-4">
            <small>
              <span v-if="specialistaSelezionato || tipoTerapiaSelezionato">
                Prova a modificare i filtri per vedere più eventi.
              </span>
              <span v-else>
                Quando ci saranno eventi, i professionisti verranno automaticamente mostrati nella timeline e nella lista.
              </span>
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

/**
 * Composable per gestione vista mobile-responsive
 */
const useResponsiveView = () => {
  // Chiavi localStorage per persistenza preferenze
  const VISTA_PREFERENCE_KEY = 'calendario_vista_preference'
  const MOBILE_OVERRIDE_KEY = 'calendario_mobile_override'

  // Stato reattivo per il rilevamento mobile
  const isMobile = ref(false)
  const isTablet = ref(false)
  const userHasSetPreference = ref(false)

  /**
   * Rileva se il dispositivo è mobile basandosi su:
   * - User agent
   * - Dimensioni viewport
   * - Touch capabilities
   */
  const detectMobileDevice = () => {
    // User Agent detection per dispositivi mobili
    const userAgent = navigator.userAgent.toLowerCase()
    const mobileKeywords = [
      'mobile', 'android', 'iphone', 'ipod', 'blackberry',
      'windows phone', 'opera mini', 'iemobile'
    ]
    const isUserAgentMobile = mobileKeywords.some(keyword => userAgent.includes(keyword))

    // Dimensioni viewport (consideriamo mobile sotto 768px)
    const isViewportMobile = window.innerWidth < 768

    // Tablet detection (768px - 1024px)
    const isViewportTablet = window.innerWidth >= 768 && window.innerWidth <= 1024

    // Touch capability
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    // Combinazione di fattori per determinare se è mobile
    const mobileDetected = isUserAgentMobile || (isViewportMobile && hasTouchSupport)
    const tabletDetected = isViewportTablet && hasTouchSupport && !isUserAgentMobile

    console.log('📱 [Device Detection]', {
      userAgent: isUserAgentMobile,
      viewport: isViewportMobile,
      viewportTablet: isViewportTablet,
      touch: hasTouchSupport,
      mobile: mobileDetected,
      tablet: tabletDetected
    })

    return { mobile: mobileDetected, tablet: tabletDetected }
  }

  /**
   * Determina la vista di default basandosi sul dispositivo
   */
  const getDefaultView = () => {
    // Controlla se l'utente ha già impostato una preferenza manualmente
    const savedPreference = localStorage.getItem(VISTA_PREFERENCE_KEY)
    const hasMobileOverride = localStorage.getItem(MOBILE_OVERRIDE_KEY) === 'true'

    console.log('🎯 [Vista Default]', {
      savedPreference,
      hasMobileOverride,
      isMobile: isMobile.value,
      isTablet: isTablet.value
    })

    // Se l'utente ha già una preferenza salvata, rispettala
    if (savedPreference && hasMobileOverride) {
      console.log('✅ [Vista Default] Usando preferenza utente:', savedPreference)
      return savedPreference
    }

    // Altrimenti usa la logica mobile-first
    if (isMobile.value) {
      console.log('📱 [Vista Default] Mobile rilevato, usando vista lista')
      return 'lista'
    } else if (isTablet.value) {
      console.log('📟 [Vista Default] Tablet rilevato, usando vista lista')
      return 'lista'
    } else {
      console.log('💻 [Vista Default] Desktop rilevato, usando vista timeline')
      return 'timeline'
    }
  }

  /**
   * Salva la preferenza dell'utente quando cambia vista manualmente
   */
  const saveUserPreference = (vista) => {
    localStorage.setItem(VISTA_PREFERENCE_KEY, vista)
    localStorage.setItem(MOBILE_OVERRIDE_KEY, 'true')
    userHasSetPreference.value = true
    console.log('💾 [Preferenza] Salvata preferenza utente:', vista)
  }

  /**
   * Listener per resize window per aggiornare detection
   */
  const handleResize = () => {
    const detection = detectMobileDevice()
    isMobile.value = detection.mobile
    isTablet.value = detection.tablet

    // Se l'utente non ha impostato preferenze, aggiorna la vista automaticamente
    if (!userHasSetPreference.value) {
      const newDefaultView = getDefaultView()
      console.log('🔄 [Resize] Aggiornamento vista automatico:', newDefaultView)
      return newDefaultView
    }
    return null
  }

  return {
    isMobile,
    isTablet,
    userHasSetPreference,
    detectMobileDevice,
    getDefaultView,
    saveUserPreference,
    handleResize
  }
}

// Utilizzo del composable responsive
const {
  isMobile,
  isTablet,
  userHasSetPreference,
  detectMobileDevice,
  getDefaultView,
  saveUserPreference,
  handleResize
} = useResponsiveView()

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
  const filtri = {
    data: dataSelezionata.value,
    specialista: specialistaSelezionato.value,
    tipoTerapia: tipoTerapiaSelezionato.value
  }

  console.log(`🎯 [CalendarioView] Applicazione filtri:`, filtri)
  console.log(`📋 [CalendarioView] Eventi da filtrare: ${eventi.value?.length || 0}`)

  const risultato = filtraEventi(eventi.value, filtri)

  console.log(`✅ [CalendarioView] Eventi filtrati: ${risultato?.length || 0}`)

  return risultato
})

// Computed per specialisti filtrati (basato sugli eventi filtrati)
const specialistiFiltrati = computed(() => {
  console.log(`👨‍⚕️ [CalendarioView] Generazione specialisti da ${eventiFiltrati.value?.length || 0} eventi filtrati`)

  const risultato = estraiSpecialistiDaEventi(eventiFiltrati.value)

  console.log(`✅ [CalendarioView] Specialisti filtrati: ${risultato?.length || 0}`)

  return risultato
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

const handleCancellaEvento = async (eventoId) => {
  console.log('🗑️ [CalendarioView] Evento cancellato:', eventoId)

  // Chiude la modal di azione
  showEventActionModal.value = false
  eventoSelezionato.value = null

  // Ricarica gli eventi per aggiornare la vista
  await caricaEventi(dataSelezionata.value)
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

const handleEventoEliminato = async (risultatoEliminazione) => {
  console.log('🗑️ [CalendarioView] Evento eliminato:', risultatoEliminazione)

  // Se è un risultato di cancellazione eventi ricorrenti, gestisci diversamente
  if (risultatoEliminazione && typeof risultatoEliminazione === 'object' && risultatoEliminazione.deletedIds) {
    console.log(`✅ [CalendarioView] Cancellazione eventi ricorrenti completata: ${risultatoEliminazione.deletedIds.length} eventi eliminati`)
  } else {
    console.log('✅ [CalendarioView] Evento singolo eliminato:', risultatoEliminazione)
  }

  // Ricarica eventi per la data corrente in entrambi i casi
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
  console.log('🚀 [Inizializzazione] Avvio calendario con rilevamento mobile...')

  try {
    // 1. Rileva il tipo di dispositivo
    const detection = detectMobileDevice()
    isMobile.value = detection.mobile
    isTablet.value = detection.tablet

    // 2. Imposta la vista di default basata sul dispositivo
    const defaultView = getDefaultView()
    vistaAttiva.value = defaultView

    console.log('📱 [Inizializzazione] Configurazione:', {
      mobile: isMobile.value,
      tablet: isTablet.value,
      vistaDefault: defaultView
    })

    // 3. Inizializza il calendario con la data selezionata inizialmente
    await inizializzaCalendario(dataSelezionata.value)

    // 4. Aggiungi listener per resize
    window.addEventListener('resize', onWindowResize)

    console.log('✅ [Inizializzazione] Calendario pronto con vista:', vistaAttiva.value)
  } catch (err) {
    console.error('❌ [Inizializzazione] Errore:', err)
  }
})

// Cleanup e listener per resize
onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
})

// Handler per resize window
const onWindowResize = () => {
  const newView = handleResize()
  if (newView && newView !== vistaAttiva.value) {
    vistaAttiva.value = newView
    console.log('🔄 [Resize] Vista aggiornata automaticamente:', newView)
  }
}

// Watcher per cambiamenti di vista - salva preferenza se cambiata manualmente
watch(vistaAttiva, (nuovaVista, vecchiaVista) => {
  if (vecchiaVista && nuovaVista !== vecchiaVista) {
    // Salva la preferenza solo se il cambiamento non è dovuto all'inizializzazione
    if (vecchiaVista !== 'timeline' || nuovaVista !== getDefaultView()) {
      saveUserPreference(nuovaVista)
      console.log('👤 [Preferenza] Vista cambiata manualmente:', nuovaVista)
    }
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
