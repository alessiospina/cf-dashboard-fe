<template>
  <CModal :visible="visible" @close="handleClose" size="xl" class="event-modal">
    <CModalHeader class="bg-primary text-white">
      <CModalTitle class="d-flex align-items-center">
        <CIcon :icon="isEdit ? 'cil-pencil' : 'cil-plus'" class="me-2"/>
        {{ isEdit ? 'Modifica Appuntamento' : 'Nuovo Appuntamento' }}
      </CModalTitle>
    </CModalHeader>

    <CModalBody>
      <CForm @submit.prevent="handleSubmit">
        <!-- Informazioni Evento (Backend) -->
        <CCard class="mb-3">
          <CCardHeader>
            <h6 class="mb-0">
              <CIcon icon="cil-calendar" class="me-2"/>
              Informazioni Evento
            </h6>
          </CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Titolo Evento</CFormLabel>
                  <CFormInput
                    v-model="form.titolo"
                    :invalid="!!errors.titolo"
                    placeholder="Es: Sessione di Logopedia"
                    maxlength="50"
                    required
                  />
                  <CFormFeedback v-if="errors.titolo" invalid>{{ errors.titolo }}</CFormFeedback>
                </div>
              </CCol>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Stanza</CFormLabel>
                  <CFormInput
                    v-model="form.stanza"
                    :invalid="!!errors.stanza"
                    placeholder="Es: Sala 1"
                    maxlength="50"
                    required
                  />
                  <CFormFeedback v-if="errors.stanza" invalid>{{ errors.stanza }}</CFormFeedback>
                </div>
              </CCol>
            </CRow>

            <!-- Professionista e Tipo Terapia -->
            <CRow>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Professionista</CFormLabel>
                  <div class="position-relative">
                    <CFormInput
                      v-model="form.professionistaInput"
                      :invalid="!!errors.professionista"
                      placeholder="Clicca per selezionare un professionista..."
                      maxlength="50"
                      required
                      @input="filtraProfessionisti"
                      @focus="onFocusProfessionisti"
                      @blur="nascondiProfessionistiDropdown"
                    />
                    <CFormFeedback v-if="errors.professionista" invalid>{{ errors.professionista }}</CFormFeedback>
                    <CFormText class="text-muted">
                      Clicca sul campo per visualizzare tutti i professionisti disponibili
                    </CFormText>

                    <!-- Dropdown suggerimenti professionisti -->
                    <div
                      v-if="showProfessionistiDropdown && professionistiFiltrati.length > 0"
                      class="suggestions-dropdown"
                    >
                      <div
                        v-for="prof in professionistiFiltrati"
                        :key="prof.id"
                        class="suggestion-item"
                        @mousedown="selezionaProfessionista(prof)"
                      >
                        <div class="d-flex justify-content-between align-items-center">
                          <span class="fw-semibold">{{ prof.nominativo }}</span>
                          <CBadge :color="getBadgeColorTerapia(prof.tipoTerapia)" size="sm" v-if="prof.tipoTerapia">
                            {{ formatTipoTerapia(prof.tipoTerapia) }}
                          </CBadge>
                        </div>
                      </div>
                    </div>

                    <!-- Debug info (rimuovi dopo il test) -->
                    <div v-if="showProfessionistiDropdown" class="small text-muted mt-1">
                      Debug: Dropdown visibile: {{ showProfessionistiDropdown }},
                      Professionisti trovati: {{ professionistiFiltrati.length }}
                    </div>
                  </div>
                </div>
              </CCol>
              <CCol md="6">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Tipo Terapia</CFormLabel>
                  <CFormSelect v-model="form.tipoTerapia" :invalid="!!errors.tipoTerapia" required>
                    <option value="">Seleziona tipo terapia</option>
                    <option v-for="terapia in TIPI_TERAPIA_OPTIONS" :key="terapia.value" :value="terapia.value">
                      {{ terapia.label }}
                    </option>
                  </CFormSelect>
                  <CFormFeedback v-if="errors.tipoTerapia" invalid>{{ errors.tipoTerapia }}</CFormFeedback>
                </div>
              </CCol>
            </CRow>

            <!-- Data e Orari -->
            <CRow>
              <CCol md="4">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Data</CFormLabel>
                  <CFormInput v-model="form.data" type="date" :invalid="!!errors.data" required/>
                  <CFormFeedback v-if="errors.data" invalid>{{ errors.data }}</CFormFeedback>
                </div>
              </CCol>
              <CCol md="4">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Ora Inizio</CFormLabel>
                  <CFormInput v-model="form.oraInizio" type="time" :invalid="!!errors.oraInizio" required/>
                  <CFormFeedback v-if="errors.oraInizio" invalid>{{ errors.oraInizio }}</CFormFeedback>
                </div>
              </CCol>
              <CCol md="4">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Ora Fine</CFormLabel>
                  <CFormInput v-model="form.oraFine" type="time" :invalid="!!errors.oraFine" required/>
                  <CFormFeedback v-if="errors.oraFine" invalid>{{ errors.oraFine }}</CFormFeedback>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <!-- Informazioni Paziente -->
        <CCard class="mb-3">
          <CCardHeader>
            <h6 class="mb-0">
              <CIcon icon="cil-user" class="me-2"/>
              Paziente Associato (opzionale)
            </h6>
          </CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md="12">
                <div class="mb-3">
                  <CFormLabel class="fw-semibold">Seleziona Paziente</CFormLabel>
                  <div class="position-relative">
                    <CFormInput
                      v-model="form.pazienteInput"
                      :invalid="!!errors.pazienteId"
                      :disabled="props.loadingPazienti"
                      placeholder="Clicca per selezionare un paziente..."
                      @input="filtraPazienti"
                      @focus="onFocusPazienti"
                      @blur="nascondiPazientiDropdown"
                    />
                    <CFormFeedback v-if="errors.pazienteId" invalid>{{ errors.pazienteId }}</CFormFeedback>
                    <CFormText class="text-muted">
                      Clicca sul campo per visualizzare tutti i pazienti o digita per filtrarli
                    </CFormText>

                    <!-- Dropdown suggerimenti pazienti -->
                    <div
                      v-if="showPazientiDropdown && pazientiFiltrati.length > 0"
                      class="suggestions-dropdown"
                    >
                      <div
                        v-for="paziente in pazientiFiltrati"
                        :key="paziente.id"
                        class="suggestion-item"
                        @mousedown="selezionaPaziente(paziente)"
                      >
                        <div class="d-flex justify-content-between align-items-center">
                          <span class="fw-semibold">{{ paziente.nome }} {{ paziente.cognome }}</span>
                          <CBadge :color="getBadgeColorTerapia(paziente.tipoTerapia)" size="sm">
                            {{ formatTipoTerapia(paziente.tipoTerapia) }}
                          </CBadge>
                        </div>
                        <small class="text-muted d-block">{{ paziente.email }}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </CCol>
            </CRow>

            <!-- Dettagli paziente selezionato -->
            <div v-if="pazienteSelezionato" class="patient-details mt-3 p-3 bg-light rounded">
              <h6 class="mb-2">
                <CIcon icon="cil-info" class="me-2"/>
                Dettagli Paziente
              </h6>
              <CRow>
                <CCol md="6">
                  <strong>Nome Completo:</strong> {{ pazienteSelezionato.nome }} {{ pazienteSelezionato.cognome }}
                </CCol>
                <CCol md="6">
                  <strong>Tipo Terapia:</strong>
                  <CBadge
                    :color="getBadgeColorTerapia(pazienteSelezionato.tipoTerapia)"
                    class="ms-2"
                  >
                    {{ formatTipoTerapia(pazienteSelezionato.tipoTerapia) }}
                  </CBadge>
                </CCol>
              </CRow>
              <CRow class="mt-2">
                <CCol md="6">
                  <strong>Email:</strong> {{ pazienteSelezionato.email }}
                </CCol>
                <CCol md="6" v-if="pazienteSelezionato.telefono">
                  <strong>Telefono:</strong> {{ pazienteSelezionato.telefono }}
                </CCol>
              </CRow>
            </div>
          </CCardBody>
        </CCard>

        <!-- Errore generale -->
        <CAlert v-if="submitError" color="danger" class="mt-3">
          <CIcon icon="cil-warning" class="me-2"/>
          {{ submitError }}
        </CAlert>
      </CForm>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" @click="handleClose" :disabled="submitting">
        <CIcon icon="cil-x" class="me-2"/>
        Annulla
      </CButton>

      <CButton v-if="isEdit" color="danger" @click="handleDelete" :disabled="submitting" class="me-2">
        <CSpinner v-if="deleting" size="sm" class="me-2"/>
        <CIcon v-else icon="cil-trash" class="me-2"/>
        Elimina
      </CButton>

      <CButton color="primary" @click="handleSubmit" :disabled="submitting">
        <CSpinner v-if="submitting" size="sm" class="me-2"/>
        <CIcon v-else :icon="isEdit ? 'cil-save' : 'cil-plus'" class="me-2"/>
        {{ isEdit ? 'Salva' : 'Crea' }}
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<script setup>
import {ref, reactive, computed, watch} from 'vue'
import {useCalendario} from '@/composables/useCalendario'

const props = defineProps({
  visible: {type: Boolean, default: false},
  evento: {type: Object, default: null},
  specialisti: {type: Array, default: () => []},
  professionisti: {type: Array, default: () => []}, // Lista professionisti già caricata
  pazienti: {type: Array, default: () => []}, // Lista pazienti già caricata
  loadingProfessionisti: {type: Boolean, default: false},
  loadingPazienti: {type: Boolean, default: false}
})

const emit = defineEmits(['close', 'created', 'updated', 'deleted'])

const {
  creaEvento,
  aggiornaEvento,
  eliminaEvento,
  TIPI_TERAPIA_OPTIONS,
  FrequenzaEvento,
  FREQUENZA_EVENTO_OPTIONS,
  EventoMapper,
  EventoValidator,
  cercaProfessionisti, // Funzione di ricerca che utilizza la cache
  cercaPazienti // Funzione di ricerca che utilizza la cache
} = useCalendario()

const isEdit = computed(() => !!props.evento?.id)

// Stato per gestione dropdown suggerimenti
const professionistiFiltrati = ref([])
const showProfessionistiDropdown = ref(false)
const pazientiFiltrati = ref([])
const showPazientiDropdown = ref(false)

const form = reactive({
  // Campi dell'evento (backend)
  titolo: '',
  stanza: '',
  professionista: '',
  postiDisponibili: 1,
  frequenza: FrequenzaEvento.UNICA,
  dataFineRipetizione: '',

  // Campi per l'interfaccia utente
  specialistaId: '',
  data: '',
  oraInizio: '',
  oraFine: '',
  tipoTerapia: '',

  // Gestione paziente - nuovo
  pazienteId: '', // ID del paziente selezionato dalla lista
  aggiungiPazienteManuale: false, // Flag per aggiunta manuale
  nomePaziente: '', // Nome manuale (solo se paziente non in lista)
  cognomePaziente: '', // Cognome manuale (solo se paziente non in lista)

  // Gestione professionista - nuovi campi per il dropdown
  professionistaInput: '', // Input per la ricerca del professionista
  pazienteInput: '', // Input per la ricerca del paziente

  stato: 'confermato',
  note: ''
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

// Gestione ricerca e selezione professionisti (utilizzo cache da props)
const filtraProfessionisti = async (event) => {
  const query = event.target.value
  form.professionistaInput = query

  // Utilizza la funzione di ricerca che usa la cache
  try {
    professionistiFiltrati.value = await cercaProfessionisti(query)
  } catch (error) {
    console.error('Errore nella ricerca professionisti:', error)
    professionistiFiltrati.value = []
  }
}

const selezionaProfessionista = (professionista) => {
  form.professionistaInput = professionista.nominativo
  form.professionista = professionista.nominativo
  showProfessionistiDropdown.value = false
  professionistiFiltrati.value = []
}

// Gestione focus professionisti - mostra suggerimenti quando il campo viene evidenziato
const onFocusProfessionisti = async () => {
  showProfessionistiDropdown.value = true
  // Utilizza la cache già caricata
  try {
    professionistiFiltrati.value = await cercaProfessionisti(form.professionistaInput || '')
    console.log('Professionisti filtrati:', professionistiFiltrati.value)
  } catch (error) {
    console.error('Errore nel caricamento professionisti al focus:', error)
    professionistiFiltrati.value = []
  }
}

const nascondiProfessionistiDropdown = () => {
  // Usa un timeout per permettere il click sull'elemento
  setTimeout(() => {
    showProfessionistiDropdown.value = false
    professionistiFiltrati.value = []
  }, 150)
}

// Gestione ricerca e selezione pazienti (utilizzo cache da props)
const filtraPazienti = (event) => {
  const query = event.target.value
  form.pazienteInput = query

  // Utilizza i pazienti già caricati tramite props
  pazientiFiltrati.value = cercaPazienti(query)
}

const selezionaPaziente = (paziente) => {
  form.pazienteInput = `${paziente.nome} ${paziente.cognome}`
  form.pazienteId = paziente.id.toString()
  showPazientiDropdown.value = false
  pazientiFiltrati.value = []
}

// Gestione focus pazienti - mostra suggerimenti quando il campo viene evidenziato
const onFocusPazienti = () => {
  showPazientiDropdown.value = true
  // Utilizza i pazienti già caricati tramite props
  pazientiFiltrati.value = cercaPazienti(form.pazienteInput || '')
}

const nascondiPazientiDropdown = () => {
  // Usa un timeout per permettere il click sull'elemento
  setTimeout(() => {
    showPazientiDropdown.value = false
    pazientiFiltrati.value = []
  }, 150)
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

  // Reset campi professionista
  form.professionistaInput = ''
  form.pazienteInput = ''

  form.stato = 'confermato'
  form.note = ''

  // Reset stato dropdown
  professionistiFiltrati.value = []
  showProfessionistiDropdown.value = false
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

    // Popolamento campi input
    form.professionistaInput = form.professionista

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
  if (!form.professionista) newErrors.professionista = 'Professionista obbligatorio'
  if (!form.postiDisponibili || form.postiDisponibili < 1) {
    newErrors.postiDisponibili = 'Posti disponibili deve essere almeno 1'
  }

  // Validazione campi interfaccia
  if (!form.data) newErrors.data = 'Data obbligatoria'
  if (!form.oraInizio) newErrors.oraInizio = 'Ora inizio obbligatoria'
  if (!form.oraFine) newErrors.oraFine = 'Ora fine obbligatoria'

  // Validazione logica date/orari
  if (form.oraInizio && form.oraFine && form.oraInizio >= form.oraFine) {
    newErrors.oraFine = 'Ora fine deve essere successiva all\'ora inizio'
  }

  // Validazione data fine ripetizione
  if (form.frequenza !== FrequenzaEvento.UNICA && !form.dataFineRipetizione) {
    newErrors.dataFineRipetizione = 'Data fine ripetizione obbligatoria per eventi ricorrenti'
  }

  if (form.dataFineRipetizione && form.data && form.dataFineRipetizione <= form.data) {
    newErrors.dataFineRipetizione = 'Data fine ripetizione deve essere successiva alla data evento'
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

    // Preparazione dati evento con mapping backend
    const eventoData = {
      // Campi backend
      titolo: form.titolo,
      stanza: form.stanza,
      professionista: form.professionista,
      dataInizio: dataInizio.toISOString(),
      dataFine: dataFine.toISOString(),
      postiDisponibili: form.postiDisponibili,
      frequenza: form.frequenza,
      dataFineRipetizione: form.dataFineRipetizione ?
        new Date(`${form.dataFineRipetizione}T23:59:59`).toISOString() : null,

      // Gestione paziente - priorità al paziente selezionato dalla lista
      pazienteId: form.pazienteId || null,

      // Campi per compatibilità frontend
      specialista: form.specialistaId ? {
        id: form.specialistaId,
        ...props.specialisti.find(s => s.id === form.specialistaId)
      } : {
        id: `temp-${Date.now()}`,
        nome: form.professionista.split(' ')[0] || '',
        cognome: form.professionista.split(' ').slice(1).join(' ') || '',
        nomeCompleto: form.professionista
      },

      // Paziente per frontend (se non selezionato dalla lista ma aggiunto manualmente)
      paziente: form.pazienteId ? pazienteSelezionato.value : (
        (form.aggiungiPazienteManuale && form.nomePaziente && form.cognomePaziente) ? {
          id: `temp-${Date.now()}`,
          nome: form.nomePaziente,
          cognome: form.cognomePaziente,
          nomeCompleto: `${form.nomePaziente} ${form.cognomePaziente}`
        } : null
      ),

      tipoTerapia: form.tipoTerapia || 'LOGOPEDIA',
      stato: form.stato,
      sala: form.stanza, // Mapping per compatibilità
      note: form.note
    }

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

// Auto-popolamento del titolo quando si cambia tipo terapia
watch(() => form.tipoTerapia, (newTipoTerapia) => {
  if (newTipoTerapia && !form.titolo) {
    form.titolo = `Sessione di ${formatTipoTerapia(newTipoTerapia)}`
  }
})

// Watcher per reset paziente quando si cambia input manualmente
watch(() => form.pazienteInput, (newValue) => {
  if (!newValue) {
    form.pazienteId = ''
  }
})

// Watcher per reset professionista quando si cambia input manualmente
watch(() => form.professionistaInput, (newValue) => {
  if (!newValue) {
    form.professionista = ''
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
/* Stili per la modal migliorata */
.event-modal :deep(.modal-content) {
  border-radius: 12px;
  overflow: hidden;
}

.event-modal .modal-header {
  border-bottom: none;
}

.event-modal .card-header {
  background-color: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
  padding: 0.75rem 1rem;
}

.event-modal .card-header h6 {
  color: #495057;
  font-weight: 600;
}

.event-modal .form-label {
  color: #495057;
  font-weight: 500;
}

.event-modal .form-control:focus,
.event-modal .form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

/* Stili per i dropdown di suggerimenti */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ced4da;
  border-top: none;
  border-radius: 0 0 0.375rem 0.375rem;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1050;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.suggestion-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.15s ease-in-out;
}

.suggestion-item:hover {
  background-color: #f8f9fa;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item .fw-semibold {
  color: #212529;
}

.suggestion-item small {
  font-size: 0.875em;
}

/* Separazione visiva tra sezioni */
.event-modal .card + .card {
  margin-top: 1rem;
}

/* Evidenziazione campi obbligatori backend */
.event-modal .card:first-of-type .form-label::after {
  content: " *";
  color: #dc3545;
}

/* Stile per campi condizionali */
.event-modal .form-text {
  font-size: 0.875em;
  margin-top: 0.25rem;
}

/* Stili per i dettagli del paziente selezionato */
.patient-details {
  border: 1px solid #e9ecef;
  background-color: #f8f9fa !important;
  transition: all 0.3s ease;
}

.patient-details h6 {
  color: #495057;
  margin-bottom: 0.75rem;
}

.patient-details strong {
  color: #2c3e50;
}

/* Stili per il loading state del dropdown pazienti */
.event-modal .form-select:disabled {
  background-color: #e9ecef;
  opacity: 0.6;
}

/* Stili per il checkbox aggiunta manuale */
.event-modal .form-check {
  padding: 0.5rem 0;
  border-top: 1px solid #e9ecef;
  margin-top: 1rem;
  padding-top: 1rem;
}

.event-modal .form-check-label {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

/* Evidenziazione paziente selezionato */
.event-modal .form-select option:checked {
  background-color: #0d6efd;
  color: white;
}

/* Responsive per mobile */
@media (max-width: 768px) {
  .patient-details .col-md-6 {
    margin-bottom: 0.5rem;
  }

  .patient-details strong {
    display: inline-block;
    min-width: 100px;
  }

  .suggestions-dropdown {
    max-height: 150px;
  }

  .suggestion-item {
    padding: 0.5rem 0.75rem;
  }
}
</style>
