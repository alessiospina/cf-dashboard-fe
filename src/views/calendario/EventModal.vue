<template>
  <CModal :visible="visible" @close="handleClose" size="lg" class="event-modal-simple">
    <CModalHeader class="border-0 pb-0">
      <CModalTitle class="h5 fw-bold text-dark">
        <CIcon :icon="isEdit ? 'cil-pencil' : 'cil-plus'" class="me-2 text-primary"/>
        {{ isEdit ? 'Modifica Appuntamento' : 'Nuovo Appuntamento' }}
      </CModalTitle>
    </CModalHeader>

    <CModalBody class="pt-2">
      <CForm @submit.prevent="handleSubmit">

        <!-- Sezione Principale -->
        <div class="form-section mb-4">
          <CRow class="g-3">
            <!-- Titolo -->
            <CCol cols="12">
              <div class="input-group-with-icon">
                <div class="input-content">
                  <CFormLabel class="form-label-clean">Titolo appuntamento</CFormLabel>
                  <div class="d-flex">
                    <CIcon icon="cil-pencil" class="input-icon"/>
                    <CFormInput
                      v-model="form.titolo"
                      :invalid="!!errors.titolo"
                      placeholder="Inserisci il titolo dell'appuntamento"
                      class="form-control-clean"
                    />
                  </div>
                  <CFormFeedback v-if="errors.titolo" invalid>{{ errors.titolo }}</CFormFeedback>
                </div>
              </div>
            </CCol>

            <!-- Specialista -->
            <CCol cols="12">
              <div class="input-group-with-icon">
                <div class="input-content">
                  <CFormLabel class="form-label-clean">Specialista</CFormLabel>
                  <div class="position-relative">
                    <div class="d-flex">
                      <CIcon icon="cil-user" class="input-icon"/>
                      <CFormInput
                        v-model="form.specialistaInput"
                        :invalid="!!errors.specialista"
                        placeholder="Cerca uno specialista..."
                        class="form-control-clean"
                        @input="filtraSpecialisti"
                        @focus="onFocusSpecialisti"
                        @blur="nascondiSpecialistiDropdown"
                      />
                    </div>
                    <CFormFeedback v-if="errors.specialista" invalid>{{ errors.specialista }}</CFormFeedback>

                    <!-- Dropdown specialisti -->
                    <div
                      v-if="showSpecialistiDropdown && specialistiFiltrati.length > 0"
                      class="suggestions-dropdown-clean"
                    >
                      <div
                        v-for="specialista in specialistiFiltrati"
                        :key="specialista.id"
                        class="suggestion-item-clean"
                        @click="selezionaSpecialista(specialista)"
                      >
                        <div class="d-flex justify-content-between align-items-center">
                          <div>
                            <div class="fw-medium">{{ getFullNameSpecialista(specialista) }}</div>
                            <small class="text-muted">{{ specialista.email }}</small>
                          </div>
                          <CBadge
                            v-if="specialista.prestazione?.tipologia"
                            v-bind="getBadgeProps(specialista.prestazione)"
                            class="ms-2"
                          >
                            {{ formatPrestazione(specialista.prestazione.tipologia) }}
                          </CBadge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CCol>
          </CRow>

          <!-- Prestazione Selezionata - Riga separata -->
          <CRow v-if="form.specialistaSelezionato?.prestazione" class="g-3 mt-2">
            <CCol cols="12">
              <div class="input-group-with-icon">
                <CIcon icon="cil-medical-cross" class="input-icon text-primary"/>
                <div class="input-content">
                  <div class="prestazione-display">
                    <div class="d-flex align-items-center">
                      <span class="me-2">Prestazione:</span>
                      <CBadge
                        v-if="form.specialistaSelezionato?.prestazione"
                        v-bind="getBadgeProps(form.specialistaSelezionato.prestazione)"
                        size="sm"
                      >
                        {{ formatPrestazione(form.specialistaSelezionato.prestazione.tipologia) }}
                      </CBadge>
                    </div>
                  </div>
                </div>
              </div>
            </CCol>
          </CRow>
        </div>

        <!-- Sezione Data e Orari -->
        <div class="form-section mb-4">
          <h6 class="section-title">Data e Orari</h6>
          <CRow class="g-3">
            <CCol md="4">
              <div class="input-group-with-icon">
                <div class="input-content">
                  <CFormLabel class="form-label-clean">Data</CFormLabel>
                  <div class="d-flex">
                    <CIcon icon="cil-calendar" class="input-icon"/>
                    <CFormInput
                      v-model="form.data"
                      type="date"
                      :invalid="!!errors.data"
                      class="form-control-clean"
                    />
                  </div>
                  <CFormFeedback v-if="errors.data" invalid>{{ errors.data }}</CFormFeedback>
                </div>
              </div>
            </CCol>
            <CCol md="4">
              <div class="input-group-with-icon">
                <div class="input-content">
                  <CFormLabel class="form-label-clean">Ora inizio</CFormLabel>
                  <div class="d-flex">
                    <CIcon icon="cil-clock" class="input-icon"/>
                    <CFormInput
                      v-model="form.oraInizio"
                      type="time"
                      :invalid="!!errors.oraInizio"
                      class="form-control-clean"
                    />
                  </div>
                  <CFormFeedback v-if="errors.oraInizio" invalid>{{ errors.oraInizio }}</CFormFeedback>
                </div>
              </div>
            </CCol>
            <CCol md="4">
              <div class="input-group-with-icon">
                <div class="input-content">
                  <CFormLabel class="form-label-clean">Ora fine</CFormLabel>
                  <div class="d-flex">
                    <CIcon icon="cil-clock" class="input-icon"/>
                    <CFormInput
                      v-model="form.oraFine"
                      type="time"
                      :invalid="!!errors.oraFine"
                      class="form-control-clean"
                    />
                  </div>
                  <CFormFeedback v-if="errors.oraFine" invalid>{{ errors.oraFine }}</CFormFeedback>
                </div>
              </div>
            </CCol>
          </CRow>
        </div>

        <!-- Sezione Dettagli -->
        <div class="form-section mb-4">
          <h6 class="section-title">Dettagli</h6>
          <CRow class="g-3">
            <CCol md="6">
              <div class="input-group-with-icon">
                <div class="input-content">
                  <CFormLabel class="form-label-clean">Stanza</CFormLabel>
                  <div class="d-flex">
                    <CIcon icon="cil-room" class="input-icon"/>
                    <CFormInput
                      v-model="form.stanza"
                      :invalid="!!errors.stanza"
                      placeholder="Es: Sala 1"
                      class="form-control-clean"
                    />
                  </div>
                  <CFormFeedback v-if="errors.stanza" invalid>{{ errors.stanza }}</CFormFeedback>
                </div>
              </div>
            </CCol>
            <CCol md="6">
              <div class="input-group-with-icon">
                <div class="input-content">
                  <CFormLabel class="form-label-clean">Paziente (opzionale)</CFormLabel>
                  <div class="position-relative">
                    <div class="d-flex">
                      <CIcon icon="cil-people" class="input-icon"/>
                      <CFormInput
                        v-model="form.pazienteInput"
                        placeholder="Cerca un paziente..."
                        class="form-control-clean"
                        @input="filtraPazienti"
                        @focus="onFocusPazienti"
                        @blur="nascondiPazientiDropdown"
                      />
                    </div>
                    <!-- Dropdown pazienti -->
                    <div
                      v-if="showPazientiDropdown && pazientiFiltrati.length > 0"
                      class="suggestions-dropdown-clean"
                    >
                      <div
                        v-for="paziente in pazientiFiltrati"
                        :key="paziente.id"
                        class="suggestion-item-clean"
                        @click="selezionaPaziente(paziente)"
                      >
                        <div>
                          <div class="fw-medium">{{ paziente.nome }} {{ paziente.cognome }}</div>
                          <small class="text-muted">{{ paziente.email }}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CCol>
          </CRow>

          <!-- Paziente Selezionato -->
          <div v-if="pazienteSelezionato" class="input-group-with-icon mt-3">
            <CIcon icon="cil-user" class="input-icon text-success"/>
            <div class="input-content">
              <div class="paziente-display">
                <div class="d-flex align-items-center">
                  <span class="me-2">Paziente:</span>
                  <strong>{{ pazienteSelezionato.nome }} {{ pazienteSelezionato.cognome }}</strong>
                  <span class="text-muted ms-2">({{ pazienteSelezionato.email }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Errore generale -->
        <CAlert v-if="submitError" color="danger" class="mb-0">
          <CIcon icon="cil-warning" class="me-2"/>
          {{ submitError }}
        </CAlert>
      </CForm>
    </CModalBody>

    <CModalFooter class="border-0 pt-0">
      <div class="d-flex gap-2 w-100">
        <CButton
          color="light"
          variant="outline"
          @click="handleClose"
          :disabled="submitting"
          class="flex-grow-1"
        >
          Annulla
        </CButton>

        <CButton
          v-if="isEdit"
          color="danger"
          variant="outline"
          @click="handleDelete"
          :disabled="submitting"
        >
          <CSpinner v-if="deleting" size="sm" class="me-2"/>
          <CIcon v-else icon="cil-trash" class="me-2"/>
          Elimina
        </CButton>

        <CButton
          color="primary"
          @click="handleSubmit"
          :disabled="submitting"
          class="flex-grow-1"
        >
          <CSpinner v-if="submitting" size="sm" class="me-2"/>
          <CIcon v-else :icon="isEdit ? 'cil-save' : 'cil-plus'" class="me-2"/>
          {{ isEdit ? 'Salva' : 'Crea Appuntamento' }}
        </CButton>
      </div>
    </CModalFooter>
  </CModal>
</template>

<script setup>
import {ref, reactive, computed, watch} from 'vue'
import {useCalendario} from '@/composables/useCalendario'

const props = defineProps({
  visible: {type: Boolean, default: false},
  evento: {type: Object, default: null},
  specialisti: {type: Array, default: () => []}, // Specialisti dal backend
  pazienti: {type: Array, default: () => []}, // Lista pazienti già caricata
  loadingPazienti: {type: Boolean, default: false}
})

const emit = defineEmits(['close', 'created', 'updated', 'deleted'])

const {
  creaEvento,
  aggiornaEvento,
  eliminaEvento,
  FrequenzaEvento,
  cercaSpecialisti, // Funzione di ricerca specialisti dal backend
} = useCalendario()

const isEdit = computed(() => !!props.evento?.id)

// Stato per gestione dropdown suggerimenti
const specialistiFiltrati = ref([])
const showSpecialistiDropdown = ref(false)
const pazientiFiltrati = ref([])
const showPazientiDropdown = ref(false)

const form = reactive({
  // Campi dell'evento (backend)
  titolo: '',
  stanza: '',

  // Campi per l'interfaccia utente
  specialistaId: '',
  data: '',
  oraInizio: '',
  oraFine: '',

  // Gestione paziente - nuovo
  pazienteId: '', // ID del paziente selezionato dalla lista
  pazienteInput: '', // Input per la ricerca del paziente

  // Gestione specialista - nuovi campi per il dropdown
  specialistaInput: '', // Input per la ricerca dello specialista
  specialistaSelezionato: null, // Oggetto specialista selezionato dal backend
})

const errors = ref({})
const submitting = ref(false)
const deleting = ref(false)
const submitError = ref('')

// Computed per il paziente selezionato
const pazienteSelezionato = computed(() => {
  if (!form.pazienteId) return null
  return props.pazienti.find(p => p.id.toString() === form.pazienteId.toString())
})

// Gestione ricerca e selezione specialisti (min 2 caratteri)
const filtraSpecialisti = async (event) => {
  // Controllo sicuro dell'input event
  const query = event?.target?.value || ''
  form.specialistaInput = query

  console.log('🔍 [EventModal] Filtraggio specialisti con query:', query)
  console.log('📏 [EventModal] Lunghezza query:', query.length)

  // Mostra la dropdown solo se ci sono almeno 2 caratteri
  if (query.length < 2) {
    console.log('⚠️ [EventModal] Query troppo corta (< 2 caratteri), nascondo dropdown specialisti')
    specialistiFiltrati.value = []
    showSpecialistiDropdown.value = false
    return
  }

  // Utilizza la funzione di ricerca che usa la cache dal backend
  try {
    specialistiFiltrati.value = await cercaSpecialisti(query)
    showSpecialistiDropdown.value = specialistiFiltrati.value.length > 0
    console.log('✅ [EventModal] Trovati', specialistiFiltrati.value.length, 'specialisti')
  } catch (error) {
    console.error('❌ [EventModal] Errore nella ricerca specialisti:', error)
    specialistiFiltrati.value = []
    // Nascondi la dropdown in caso di errore
    showSpecialistiDropdown.value = false
  }
}

const selezionaSpecialista = (specialista) => {
  console.log('👤 [EventModal] Specialista selezionato:', specialista)

  // Aggiorna i campi del form con i dati dello specialista selezionato
  form.specialistaInput = getFullNameSpecialista(specialista)
  form.specialistaSelezionato = specialista

  // Auto-compila il tipo terapia se disponibile dalla prestazione
  if (specialista.prestazione?.tipologia) {
    form.tipoTerapia = specialista.prestazione.tipologia
    console.log('🎯 [EventModal] Auto-compilato tipo terapia:', form.tipoTerapia)

    // Auto-compila anche il titolo se non è già presente
    if (!form.titolo || form.titolo === '') {
      form.titolo = `Sessione di ${formatPrestazione(specialista.prestazione.tipologia)}`
      console.log('📝 [EventModal] Auto-compilato titolo:', form.titolo)
    }
  }

  // Chiudi immediatamente la dropdown e pulisci i suggerimenti
  showSpecialistiDropdown.value = false
  specialistiFiltrati.value = []

  // Rimuovi il focus dal campo input per evitare che si riapra subito la dropdown
  const input = document.querySelector('input[placeholder*="specialista"]')
  if (input) {
    input.blur()
  }
}

// Gestione focus specialisti - mostra suggerimenti solo dopo 2 caratteri
const onFocusSpecialisti = async () => {
  console.log('🎯 [EventModal] Focus su campo specialisti')

  // Non mostrare la dropdown al focus se non ci sono almeno 2 caratteri
  const inputValue = form.specialistaInput || ''
  if (inputValue.length < 2) {
    showSpecialistiDropdown.value = false
    specialistiFiltrati.value = []
    return
  }

  showSpecialistiDropdown.value = true

  try {
    // Utilizza la cache già caricata con controllo sicuro dell'input
    specialistiFiltrati.value = await cercaSpecialisti(inputValue)
    console.log('✅ [EventModal] Specialisti filtrati al focus:', specialistiFiltrati.value.length)
  } catch (error) {
    console.error('❌ [EventModal] Errore nel caricamento specialisti al focus:', error)
    specialistiFiltrati.value = []
    // Non mostrare la dropdown se c'è un errore
    showSpecialistiDropdown.value = false
  }
}

const nascondiSpecialistiDropdown = () => {
  // Usa un timeout leggermente più lungo per permettere il click sull'elemento
  setTimeout(() => {
    showSpecialistiDropdown.value = false
    specialistiFiltrati.value = []
  }, 200)
}

// Funzioni di utilità per gli specialisti
const getFullNameSpecialista = (specialista) => {
  if (!specialista) return ''
  const nome = specialista.nome || ''
  const cognome = specialista.cognome || ''
  return `${nome} ${cognome}`.trim()
}

const formatPrestazione = (tipologia) => {
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

// Computed per gestire i colori dei badge in modo pulito
const getBadgeProps = (prestazione) => {
  const colorData = getBadgeColorPrestazione(prestazione)

  if (colorData.isHex) {
    return {
      color: undefined,
      style: {
        backgroundColor: colorData.color,
        color: 'white',
        border: 'none'
      }
    }
  } else {
    return {
      color: colorData.color,
      style: undefined
    }
  }
}

const getBadgeColorPrestazione = (prestazione) => {
  console.log('🎨 [EventModal] getBadgeColorPrestazione chiamata con:', prestazione)

  // Se ricevo l'oggetto prestazione completo, usa il colore dal database
  if (prestazione && typeof prestazione === 'object' && prestazione.color) {
    console.log('✅ [EventModal] Colore dal database:', prestazione.color)

    // Se il colore inizia con #, è un hex - usiamo style
    if (prestazione.color.startsWith('#')) {
      return { isHex: true, color: prestazione.color }
    } else {
      // Se non è hex, è una classe CoreUI
      return { isHex: false, color: prestazione.color }
    }
  }

  // Se ricevo solo la tipologia (backward compatibility), usa la mappatura fallback
  const tipologia = typeof prestazione === 'string' ? prestazione : prestazione?.tipologia

  const colorsFallback = {
    'LOGOPEDIA': 'primary',
    'NEUROPSICHIATRIA_INFANTILE': 'success',
    'NEUROPSICOMOTRICITÀ': 'info',
    'TERAPIA_ABA': 'warning',
    'PSICOLOGA': 'secondary',
    'COLLOQUIO_CONOSCITIVO': 'dark'
  }

  const coloreFallback = colorsFallback[tipologia] || 'light'
  console.log('⚠️ [EventModal] Usando colore fallback per tipologia', tipologia, ':', coloreFallback)
  return { isHex: false, color: coloreFallback }
}

// Gestione ricerca e selezione pazienti (utilizzo diretto props - min 2 caratteri)
const filtraPazienti = (event) => {
  // Controllo sicuro dell'input event
  const query = event?.target?.value || ''
  form.pazienteInput = query

  console.log('Filtraggio pazienti con query:', query)
  console.log('Lunghezza query:', query.length)

  try {
    // Verifica che i pazienti siano disponibili dai props
    if (!props.pazienti || props.pazienti.length === 0) {
      console.log('Nessun paziente disponibile dai props per il filtro')
      pazientiFiltrati.value = []
      showPazientiDropdown.value = false
      return
    }

    // Mostra la dropdown solo se ci sono almeno 2 caratteri
    if (query.length < 2) {
      console.log('Query troppo corta (< 2 caratteri), nascondo dropdown')
      pazientiFiltrati.value = []
      showPazientiDropdown.value = false
      return
    }

    // Filtra localmente usando direttamente i props pazienti
    pazientiFiltrati.value = filtropazientiLocale(props.pazienti, query)
    console.log('Risultati filtro pazienti:', pazientiFiltrati.value.length)

    // Mostra la dropdown solo se ci sono risultati
    showPazientiDropdown.value = pazientiFiltrati.value.length > 0

  } catch (error) {
    console.error('Errore nel filtro pazienti:', error)
    pazientiFiltrati.value = []
    showPazientiDropdown.value = false
  }
}

// Funzione locale per filtrare i pazienti direttamente dai props
const filtropazientiLocale = (listaPazienti, query = '') => {
  // Richiede almeno 2 caratteri per performance migliori
  if (!query || query.trim().length < 2) {
    return []
  }

  const queryLower = query.toLowerCase()
  return listaPazienti.filter(paziente => {
    // Controlli di sicurezza per evitare errori con valori undefined/null
    const nome = paziente.nome || ''
    const cognome = paziente.cognome || ''
    const email = paziente.email || ''
    const nomeCompleto = `${nome} ${cognome}`.trim()

    // Filtra solo se i campi sono validi
    return nomeCompleto.toLowerCase().includes(queryLower) ||
           email.toLowerCase().includes(queryLower)
  })
}

const selezionaPaziente = (paziente) => {
  // Aggiorna i campi del form con i dati del paziente selezionato
  form.pazienteInput = `${paziente.nome} ${paziente.cognome}`
  form.pazienteId = paziente.id.toString()

  // Chiudi immediatamente la dropdown e pulisci i suggerimenti
  showPazientiDropdown.value = false
  pazientiFiltrati.value = []

  // Rimuovi il focus dal campo input per evitare che si riapra subito la dropdown
  const input = document.querySelector('input[placeholder*="paziente"]')
  if (input) {
    input.blur()
  }
}

// Gestione focus pazienti - mostra suggerimenti solo dopo 2 caratteri
const onFocusPazienti = async () => {
  console.log('Focus sui pazienti - props.pazienti:', props.pazienti.length)

  // Non mostrare la dropdown al focus se non ci sono almeno 2 caratteri
  const inputValue = form.pazienteInput || ''
  if (inputValue.length < 2) {
    showPazientiDropdown.value = false
    pazientiFiltrati.value = []
    return
  }

  showPazientiDropdown.value = true

  try {
    // Verifica che i pazienti siano caricati dai props
    if (!props.pazienti || props.pazienti.length === 0) {
      console.log('Nessun paziente caricato tramite props')
      showPazientiDropdown.value = false
      return
    }

    // Filtra solo se ci sono almeno 2 caratteri
    pazientiFiltrati.value = filtropazientiLocale(props.pazienti, inputValue)
    console.log('Pazienti filtrati al focus:', pazientiFiltrati.value.length)

  } catch (error) {
    console.error('Errore nel caricamento pazienti al focus:', error)
    pazientiFiltrati.value = []
    showPazientiDropdown.value = false
  }
}

const nascondiPazientiDropdown = () => {
  // Usa un timeout leggermente più lungo per permettere il click sull'elemento
  setTimeout(() => {
    showPazientiDropdown.value = false
    pazientiFiltrati.value = []
  }, 200)
}

const resetForm = () => {
  // Reset ai valori di default
  form.titolo = ''
  form.stanza = ''
  form.professionista = ''
  form.postiDisponibili = 1
  form.frequenza = FrequenzaEvento.UNICA
  form.dataFineRipetizione = ''

  form.specialistaId = ''
  form.data = ''
  form.oraInizio = ''
  form.oraFine = ''
  form.tipoTerapia = ''

  // Reset campi paziente
  form.pazienteId = ''
  form.aggiungiPazienteManuale = false
  form.nomePaziente = ''
  form.cognomePaziente = ''

  // Reset campi specialista
  form.specialistaInput = ''
  form.specialistaSelezionato = null
  form.pazienteInput = ''

  form.stato = 'confermato'
  form.note = ''

  // Reset stato dropdown
  specialistiFiltrati.value = []
  showSpecialistiDropdown.value = false
  pazientiFiltrati.value = []
  showPazientiDropdown.value = false

  errors.value = {}
  submitError.value = ''
}

const populateForm = (evento) => {
  if (evento) {
    const dataInizio = new Date(evento.dataInizio)
    const dataFine = new Date(evento.dataFine)

    // Campi backend
    form.titolo = evento.titolo || `TERAPIA ${evento.tipoTerapia?.replace('_', ' ') || ''}`
    form.stanza = evento.sala || evento.stanza || ''
    form.professionista = evento.specialista?.nomeCompleto ||
      `${evento.specialista?.nome || ''} ${evento.specialista?.cognome || ''}`.trim() ||
      evento.professionista || ''
    form.postiDisponibili = evento.postiDisponibili || 1
    form.frequenza = evento.frequenza || FrequenzaEvento.UNICA
    form.dataFineRipetizione = evento.dataFineRipetizione ?
      new Date(evento.dataFineRipetizione).toISOString().split('T')[0] : ''

    // Campi interfaccia
    form.specialistaId = evento.specialista?.id || ''
    form.data = dataInizio.toISOString().split('T')[0]
    form.oraInizio = dataInizio.toTimeString().slice(0, 5)
    form.oraFine = dataFine.toTimeString().slice(0, 5)
    form.tipoTerapia = evento.tipoTerapia || ''

    // Popolamento campi input e specialista selezionato
    form.specialistaInput = form.professionista

    // Cerca lo specialista corrispondente nei props per popolare specialistaSelezionato
    if (evento.specialista?.id) {
      const specialistaTrovato = props.specialisti.find(s => s.id.toString() === evento.specialista.id.toString())
      if (specialistaTrovato) {
        form.specialistaSelezionato = specialistaTrovato
        console.log('🔄 [EventModal] Specialista trovato e selezionato:', specialistaTrovato)
      }
    }

    // Gestione paziente - controllo se è un paziente esistente o manuale
    if (evento.paziente?.id && props.pazienti.some(p => p.id.toString() === evento.paziente.id.toString())) {
      // Paziente esistente nel database
      form.pazienteId = evento.paziente.id.toString()
      form.aggiungiPazienteManuale = false
      form.nomePaziente = ''
      form.cognomePaziente = ''
      form.pazienteInput = `${evento.paziente.nome} ${evento.paziente.cognome}`
    } else if (evento.paziente?.nome || evento.paziente?.cognome) {
      // Paziente aggiunto manualmente (non nel database)
      form.pazienteId = ''
      form.aggiungiPazienteManuale = true
      form.nomePaziente = evento.paziente?.nome || ''
      form.cognomePaziente = evento.paziente?.cognome || ''
      form.pazienteInput = `${evento.paziente?.nome || ''} ${evento.paziente?.cognome || ''}`.trim()
    } else {
      // Nessun paziente
      form.pazienteId = ''
      form.aggiungiPazienteManuale = false
      form.nomePaziente = ''
      form.cognomePaziente = ''
      form.pazienteInput = ''
    }

    form.stato = evento.stato || 'confermato'
    form.note = evento.note || ''
  }
}

const validateForm = () => {
  const newErrors = {}

  // Validazione campi backend obbligatori
  if (!form.titolo) newErrors.titolo = 'Titolo obbligatorio'
  if (!form.stanza) newErrors.stanza = 'Stanza obbligatoria'

  // Validazione campi interfaccia
  if (!form.data) newErrors.data = 'Data obbligatoria'
  if (!form.oraInizio) newErrors.oraInizio = 'Ora inizio obbligatoria'
  if (!form.oraFine) newErrors.oraFine = 'Ora fine obbligatoria'

  // Validazione logica date/orari
  if (form.oraInizio && form.oraFine && form.oraInizio >= form.oraFine) {
    newErrors.oraFine = 'Ora fine deve essere successiva all\'ora inizio'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  submitting.value = true
  submitError.value = ''

  try {
    const dataInizio = new Date(`${form.data}T${form.oraInizio}:00`)
    const dataFine = new Date(`${form.data}T${form.oraFine}:00`)

    // Debug - log dei dati del form prima dell'invio
    console.log('🐛 [EventModal] Debug - Form prima dell\'invio:', {
      pazienteId: form.pazienteId,
      pazienteSelezionato: pazienteSelezionato.value,
      specialistaSelezionato: form.specialistaSelezionato,
      specialistaId: form.specialistaSelezionato?.id
    })

    // Preparazione dati evento con mapping backend
    const eventoData = {
      // Campi backend
      titolo: form.titolo,
      stanza: form.stanza,
      dataInizio: dataInizio.toISOString(),
      dataFine: dataFine.toISOString(),

      // Conversione esplicita a number per coerenza con backend
      pazienteID: form.pazienteId ? Number(form.pazienteId) : null,
      specialistaID: form.specialistaSelezionato?.id ? Number(form.specialistaSelezionato.id) :
                     (form.specialistaId ? Number(form.specialistaId) : null),
    }

    // Debug - log dell'oggetto finale inviato al backend
    console.log('📤 [EventModal] Debug - Dati inviati al backend:', {
      eventoData,
      pazienteID: eventoData.pazienteID,
      specialistaID: eventoData.specialistaID,
      pazienteIDType: typeof eventoData.pazienteID,
      specialistaIDType: typeof eventoData.specialistaID
    })

    if (isEdit.value) {
      eventoData.id = props.evento.id
      const updated = await aggiornaEvento(eventoData)
      emit('updated', updated)
    } else {
      const created = await creaEvento(eventoData)
      emit('created', created)
    }

    handleClose()

  } catch (error) {
    console.error('Errore salvataggio evento:', error)
    submitError.value = 'Errore nel salvataggio dell\'evento'
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  if (!props.evento?.id) return

  deleting.value = true

  try {
    await eliminaEvento(props.evento.id)
    emit('deleted', props.evento.id)
    handleClose()
  } catch (error) {
    console.error('Errore eliminazione evento:', error)
    submitError.value = 'Errore nell\'eliminazione dell\'evento'
  } finally {
    deleting.value = false
  }
}

const handleClose = () => {
  if (submitting.value || deleting.value) return
  resetForm()
  emit('close')
}

const formatTipoTerapia = (tipoTerapia) => {
  const labels = {
    'LOGOPEDIA': 'Logopedia',
    'NEUROPSICHIATRIA_INFANTILE': 'Neuropsichiatria Infantile',
    'NEUROPSICOMOTRICITÀ': 'Neuropsicomotricità',
    'TERAPIA_ABA': 'Terapia ABA',
    'PSICOLOGA': 'Psicologa',
    'COLLOQUIO_CONOSCITIVO': 'Colloquio Conoscitivo'
  }
  return labels[tipoTerapia] || tipoTerapia
}

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

// Watcher per auto-popolamento quando si seleziona un paziente
watch(() => form.pazienteId, (newPazienteId) => {
  if (newPazienteId) {
    // Se viene selezionato un paziente, disabilita l'aggiunta manuale
    form.aggiungiPazienteManuale = false
    form.nomePaziente = ''
    form.cognomePaziente = ''

    // Se non c'è titolo, suggerisci in base al tipo terapia del paziente
    const paziente = props.pazienti.find(p => p.id.toString() === newPazienteId.toString())
    if (paziente && !form.titolo && !form.tipoTerapia) {
      form.tipoTerapia = paziente.tipoTerapia
      form.titolo = `Sessione di ${formatTipoTerapia(paziente.tipoTerapia)}`
    }
  }
})

// Watcher per controllare coerenza tra selezione paziente e aggiunta manuale
watch(() => form.aggiungiPazienteManuale, (nuovoValore) => {
  if (nuovoValore && form.pazienteId) {
    // Se viene attivata l'aggiunta manuale, deseleziona il paziente dalla lista
    form.pazienteId = ''
  }
})

// Auto-popolamento del professionista quando si seleziona uno specialista
watch(() => form.specialistaId, (newSpecialistaId) => {
  if (newSpecialistaId) {
    const specialista = props.specialisti.find(s => s.id === newSpecialistaId)
    if (specialista) {
      form.professionista = `${specialista.nome} ${specialista.cognome}`
      if (!form.tipoTerapia) {
        form.tipoTerapia = specialista.specializzazione
      }
      if (!form.titolo) {
        form.titolo = `Sessione di ${formatTipoTerapia(specialista.specializzazione)}`
      }
    }
  }
})

// Auto-popolamento del titolo quando si seleziona uno specialista o cambia prestazione
watch(() => form.specialistaSelezionato?.prestazione?.tipologia, (newTipologia) => {
  if (newTipologia && (!form.titolo || form.titolo === '')) {
    form.titolo = `Sessione di ${formatPrestazione(newTipologia)}`
    console.log('📝 [EventModal] Auto-compilato titolo da prestazione:', form.titolo)
  }
})

// Watcher per reset paziente quando si cambia input manualmente
watch(() => form.pazienteInput, (newValue) => {
  if (!newValue) {
    form.pazienteId = ''
  }
})

// Watcher per reset specialista quando si cambia input manualmente
watch(() => form.specialistaInput, (newValue) => {
  if (!newValue) {
    form.professionista = ''
    form.specialistaSelezionato = null
  } else {
    form.professionista = newValue
  }
})

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    if (isEdit.value) {
      populateForm(props.evento)
    } else {
      resetForm()
      if (props.evento?.dataInizio) {
        populateForm(props.evento)
      }
    }
  }
}, {immediate: true})
</script>

<style scoped>
/* Design semplificato per la modal */
.event-modal-simple :deep(.modal-content) {
  border: none;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.event-modal-simple :deep(.modal-header) {
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.event-modal-simple :deep(.modal-body) {
  padding: 1rem 1.5rem;
}

.event-modal-simple :deep(.modal-footer) {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

/* Sezioni del form */
.form-section {
  position: relative;
}

.section-title {
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f3f4f6;
}

/* Labels pulite */
.form-label-clean {
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

/* Input puliti - responsive e flessibili */
.form-control-clean {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background-color: #ffffff;
  min-height: 40px; /* Altezza minima per allineamento con le icone */
  flex: 1; /* Occupa tutto lo spazio disponibile */
}

.form-control-clean:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background-color: #ffffff;
}

.form-control-clean:invalid {
  border-color: #ef4444;
}

/* Dropdown semplificato */
.suggestions-dropdown-clean {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1050;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.suggestion-item-clean {
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.15s ease;
}

.suggestion-item-clean:hover {
  background-color: #f8fafc;
}

.suggestion-item-clean:last-child {
  border-bottom: none;
}

/* Input group con icone - allineamento flexbox responsive */
.input-group-with-icon {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0;
  align-items: stretch; /* Permette agli elementi di adattarsi in altezza */
}

/* Layout del contenuto input */
.input-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* Container per input con icona */
.input-content .d-flex {
  align-items: center; /* Allinea verticalmente icona e input */
  gap: 0.75rem;
  margin-top: auto; /* Spinge verso il basso per allinearsi con altre icone */
}

/* Icone all'interno del contenuto input */
.input-content .d-flex .input-icon {
  margin-top: 0 !important;
  flex-shrink: 0;
  align-self: center;
}

/* Icone standalone (fuori da input-content) */
.input-group-with-icon > .input-icon {
  align-self: flex-end; /* Allinea al fondo del container per essere al livello degli input */
  margin-bottom: 0.75rem; /* Spazio per compensare il padding degli input */
}

.input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #f3f4f6;
  color: #6b7280;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.input-icon.text-primary {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.input-icon.text-success {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}



/* Display per prestazione e paziente */
.prestazione-display,
.paziente-display {
  background-color: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.prestazione-display {
  border-left: 4px solid #3b82f6;
}

.paziente-display {
  border-left: 4px solid #10b981;
}

/* Icone specifiche per display elements - allineamento centrato */
.prestazione-display .input-icon,
.paziente-display .input-icon {
  margin-top: 0;
  margin-bottom: 0; /* Reset margin bottom per display elements */
  align-self: center; /* Centra verticalmente rispetto al contenuto */
  height: auto;
  min-height: 40px;
}

/* Correzione per le sezioni con input diretti dentro input-group-with-icon */
.input-group-with-icon .d-flex .input-icon {
  margin-top: 0;
  margin-bottom: 0; /* Reset margin bottom per icone in d-flex */
  align-self: center;
}

/* Allineamento specifico per i campi con dropdown di suggerimenti */
.input-group-with-icon .position-relative .d-flex .input-icon {
  margin-top: 0;
  margin-bottom: 0;
}

/* Specifico per il markup utilizzato nella modale - contenitori d-flex annidati */
.input-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.input-content .d-flex {
  align-items: center; /* Allinea verticalmente icona e input */
  gap: 0.75rem;
}

.input-content .d-flex .input-icon {
  margin-top: 0 !important; /* Override importante per icone dentro input-content */
  flex-shrink: 0;
}

/* Allineamento per contenitori con position-relative (dropdown) */
.input-content .position-relative {
  flex: 1;
}

.input-content .position-relative .d-flex {
  align-items: center;
  gap: 0.75rem;
}

/* Bottoni */
.event-modal-simple .btn {
  border-radius: 8px;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.event-modal-simple .btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
}

.event-modal-simple .btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 10px -1px rgba(59, 130, 246, 0.3);
}

.event-modal-simple .btn-outline-light {
  border: 2px solid #e5e7eb;
  color: #6b7280;
}

.event-modal-simple .btn-outline-light:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.event-modal-simple .btn-outline-danger {
  border: 2px solid #fecaca;
  color: #dc2626;
}

.event-modal-simple .btn-outline-danger:hover {
  background-color: #fef2f2;
  border-color: #fca5a5;
}

/* Responsive */
@media (max-width: 768px) {
  .event-modal-simple :deep(.modal-dialog) {
    margin: 0.5rem;
  }

  .event-modal-simple :deep(.modal-header),
  .event-modal-simple :deep(.modal-body),
  .event-modal-simple :deep(.modal-footer) {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .suggestions-dropdown-clean {
    max-height: 150px;
  }

  .suggestion-item-clean {
    padding: 0.5rem;
  }
}

/* Animazioni */
.event-modal-simple :deep(.modal-content) {
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Badge personalizzati */
.event-modal-simple .badge {
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
}

/* Alert semplificato */
.event-modal-simple .alert {
  border-radius: 8px;
  border: none;
  font-size: 0.875rem;
}

.event-modal-simple .alert-danger {
  background-color: #fef2f2;
  color: #dc2626;
  border-left: 4px solid #dc2626;
}

/* Responsive per le icone - layout flessibile e pulito */
@media (max-width: 768px) {
  .input-group-with-icon {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }

  .input-icon {
    align-self: flex-start;
    margin-top: 0;
    margin-bottom: 0;
    width: 36px;
    height: 36px;
  }

  /* Specifico per mobile: icone nei d-flex rimangono orizzontali */
  .input-group-with-icon .d-flex {
    flex-direction: row !important;
    align-items: center;
    margin-top: 0;
  }

  .input-group-with-icon .d-flex .input-icon {
    margin-top: 0;
    margin-bottom: 0;
    margin-right: 0.75rem;
  }

  /* Reset per icone standalone in mobile */
  .input-group-with-icon > .input-icon {
    align-self: flex-start;
    margin-bottom: 0;
  }
}
</style>
