<template>
  <!--
    Componente Filtri per il Calendario

    Fornisce controlli per:
    - Selezione data
    - Filtro specialista
    - Filtro tipo terapia
    - Navigazione rapida date
    -->
  <CCard class="filtri-calendario mb-4">
    <CCardBody>
      <CRow class="align-items-end">
        <!-- Controlli data -->
        <CCol md="4">
          <CFormLabel class="fw-semibold">Data</CFormLabel>
          <CRow class="g-2">
            <!-- Input Group con navigazione -->
            <CCol>
              <CInputGroup>
                <!-- Navigazione con icone come nella pagina pazienti -->
                <CButton
                  variant="outline"
                  color="secondary"
                  @click="cambiaGiorno(-1)"
                  :disabled="loading"
                  title="Giorno precedente"
                >
                  <font-awesome-icon icon="angle-left" />
                </CButton>
                <CFormInput
                  :model-value="dataSelezionata"
                  @update:model-value="$emit('update:dataSelezionata', $event)"
                  type="date"
                  :disabled="loading"
                />
                <CButton
                  variant="outline"
                  color="secondary"
                  @click="cambiaGiorno(1)"
                  :disabled="loading"
                  title="Giorno successivo"
                >
                  <font-awesome-icon icon="angle-right" />
                </CButton>
              </CInputGroup>
            </CCol>

            <!-- Bottone oggi allineato -->
            <CCol md="auto">
              <CButton
                variant="outline"
                color="primary"
                @click="impostaOggi"
                :disabled="loading"
                class="h-100"
              >
                <CIcon v-if="loading" class="spinner-border spinner-border-sm me-2" />
                Oggi
              </CButton>
            </CCol>
          </CRow>
        </CCol>

        <!-- Filtro Specialista -->
        <CCol md="3">
          <CFormLabel class="fw-semibold">Specialista</CFormLabel>
          <CFormSelect
            :model-value="specialistaSelezionato"
            @update:model-value="$emit('update:specialistaSelezionato', $event)"
            :disabled="loading"
          >
            <option value="">Tutti gli specialisti</option>

            <!-- Opzioni raggruppate per gestire omonimi -->
            <template v-for="gruppo in specialistiRaggruppati" :key="gruppo.chiave">
              <!-- Se c'è un solo specialista con questo nome, mostra normalmente -->
              <option
                v-if="gruppo.specialisti.length === 1"
                :value="gruppo.specialisti[0].id"
              >
                {{ gruppo.nomeCompleto }}
              </option>

              <!-- Se ci sono omonimi, mostra opzione di gruppo + singole -->
              <template v-else>
                <!-- Opzione per selezionare tutti gli omonimi -->
                <option :value="`nome:${gruppo.nomeCompleto}`">
                  {{ gruppo.nomeCompleto }} (Tutti - {{ gruppo.specialisti.length }})
                </option>

                <!-- Opzioni singole per ogni specialista -->
                <option
                  v-for="specialista in gruppo.specialisti"
                  :key="specialista.id"
                  :value="specialista.id"
                  style="padding-left: 20px;"
                >
                  &nbsp;&nbsp;{{ gruppo.nomeCompleto }} ({{ formatPrestazione(specialista.prestazione?.tipologia) }})
                </option>
              </template>
            </template>
          </CFormSelect>
        </CCol>

        <!-- Filtro Tipo Terapia -->
        <CCol md="3">
          <CFormLabel class="fw-semibold">Tipo Terapia</CFormLabel>
          <CFormSelect
            :model-value="tipoTerapiaSelezionato"
            @update:model-value="$emit('update:tipoTerapiaSelezionato', $event)"
            :disabled="loading"
          >
            <option value="">Tutte le terapie</option>
            <option
              v-for="terapia in TIPI_TERAPIA_OPTIONS"
              :key="terapia.value"
              :value="terapia.value"
            >
              {{ terapia.label }}
            </option>
          </CFormSelect>
        </CCol>

        <!-- Azioni -->
        <CCol md="2">
          <div class="d-grid gap-2">
            <CButton
              color="primary"
              @click="$emit('aggiorna')"
              :disabled="loading"
              size="sm"
            >
              <CSpinner v-if="loading" size="sm" class="me-2" />
              <CIcon v-else icon="cil-reload" class="me-2" />
              {{ loading ? 'Caricamento...' : 'Aggiorna' }}
            </CButton>

            <CButton
              variant="outline"
              color="secondary"
              @click="resetFiltri"
              :disabled="loading"
              size="sm"
            >
              <CIcon icon="cil-x" class="me-2" />
              Reset
            </CButton>
          </div>
        </CCol>
      </CRow>

      <!-- Informazioni data selezionata e scorciatoie -->
      <CRow class="mt-3">
        <CCol md="8">
          <div class="d-flex align-items-center text-muted">
            <CIcon icon="cil-info" class="me-2" />
            <span>
              Visualizzando: <strong>{{ formatDataEstesa(dataSelezionata) }}</strong>
              <span v-if="specialistaSelezionato">
                - Specialista: <strong>{{ getNomeSpecialista(specialistaSelezionato) }}</strong>
              </span>
              <span v-if="tipoTerapiaSelezionato">
                - Terapia: <strong>{{ getLabelTerapia(tipoTerapiaSelezionato) }}</strong>
              </span>
            </span>
          </div>
        </CCol>
        <CCol md="4">
          <div class="d-flex align-items-center justify-content-end text-muted">
            <small>
              <CIcon icon="cil-keyboard" class="me-1" />
              <kbd>←→</kbd> giorni | <kbd>H</kbd> oggi
            </small>
          </div>
        </CCol>
      </CRow>
    </CCardBody>
  </CCard>
</template>

<script setup>
/**
 * Componente Filtri Calendario
 *
 * Gestisce tutti i filtri e controlli di navigazione
 * per la visualizzazione del calendario
 *
 * Scorciatoie da tastiera:
 * - Freccia sinistra: giorno precedente
 * - Freccia destra: giorno successivo
 * - H (Home): vai a oggi
 */

import { computed, onMounted, onUnmounted } from 'vue'
import { TIPI_TERAPIA_OPTIONS } from '@/types/backend.types'

// Props
const props = defineProps({
  dataSelezionata: {
    type: String,
    required: true
  },
  specialistaSelezionato: {
    type: String,
    default: ''
  },
  tipoTerapiaSelezionato: {
    type: String,
    default: ''
  },
  specialisti: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'update:dataSelezionata',
  'update:specialistaSelezionato',
  'update:tipoTerapiaSelezionato',
  'aggiorna'
])

// Metodi per navigazione data
const cambiaGiorno = (giorni) => {
  const dataCorrente = new Date(props.dataSelezionata)
  dataCorrente.setDate(dataCorrente.getDate() + giorni)
  emit('update:dataSelezionata', dataCorrente.toISOString().split('T')[0])
}

const impostaOggi = () => {
  const oggi = new Date().toISOString().split('T')[0]
  emit('update:dataSelezionata', oggi)
}

const resetFiltri = () => {
  emit('update:dataSelezionata', new Date().toISOString().split('T')[0])
  emit('update:specialistaSelezionato', '')
  emit('update:tipoTerapiaSelezionato', '')
}

// Computed per raggruppare specialisti per nome
const specialistiRaggruppati = computed(() => {
  const gruppi = new Map()

  props.specialisti.forEach(specialista => {
    const nomeCompleto = `${specialista.nome} ${specialista.cognome}`.trim()

    if (!gruppi.has(nomeCompleto)) {
      gruppi.set(nomeCompleto, {
        chiave: nomeCompleto,
        nomeCompleto: nomeCompleto,
        specialisti: []
      })
    }

    gruppi.get(nomeCompleto).specialisti.push(specialista)
  })

  // Ordina per nome completo
  return Array.from(gruppi.values()).sort((a, b) =>
    a.nomeCompleto.localeCompare(b.nomeCompleto, 'it')
  )
})

// Formatta la prestazione per la visualizzazione
const formatPrestazione = (tipologia) => {
  if (!tipologia) return 'N/A'

  const labels = {
    'LOGOPEDIA': 'Logopedia',
    'NEUROPSICHIATRIA_INFANTILE': 'Neuropsichiatria',
    'NEUROPSICOMOTRICITÀ': 'Neuropsicomotricità',
    'TERAPIA_ABA': 'Terapia ABA',
    'PSICOLOGA': 'Psicologia',
    'COLLOQUIO_CONOSCITIVO': 'Colloquio'
  }

  return labels[tipologia] || tipologia.replace(/_/g, ' ')
}
const formatDataEstesa = (dateString) => {
  const data = new Date(dateString)
  return data.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const getNomeSpecialista = (filtroValore) => {
  if (!filtroValore) return ''

  // Se è un filtro per nome, estrai il nome
  if (filtroValore.toString().startsWith('nome:')) {
    return filtroValore.substring(5) // Rimuove "nome:"
  }

  // Altrimenti cerca per ID
  const specialista = props.specialisti.find(s => s.id.toString() === filtroValore.toString())
  return specialista ? `${specialista.nome} ${specialista.cognome}` : ''
}

const getLabelTerapia = (tipoTerapia) => {
  const terapia = TIPI_TERAPIA_OPTIONS.find(t => t.value === tipoTerapia)
  return terapia ? terapia.label : ''
}

// Gestione scorciatoie da tastiera
const handleKeyDown = (event) => {
  // Evita di interferire se l'utente sta digitando in un input
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
    return
  }

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      cambiaGiorno(-1) // Freccia sinistra = giorno precedente
      break

    case 'ArrowRight':
      event.preventDefault()
      cambiaGiorno(1) // Freccia destra = giorno successivo
      break

    case 'h':
    case 'H':
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        impostaOggi() // H = vai a oggi
      }
      break
  }
}

// Lifecycle hooks per le scorciatoie
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/**
 * Stili per i filtri del calendario
 */

.filtri-calendario {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filtri-calendario .card-body {
  padding: 1.5rem;
}

/* Stili per i controlli data */
.input-group .btn {
  border-color: #ced4da;
}

.input-group .btn:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

/* Stili per le scorciatoie */
.btn-group .btn {
  font-size: 0.875rem;
}

/* Stili per i tasti kbd */
kbd {
  padding: 0.2rem 0.4rem;
  font-size: 0.7rem;
  color: #495057;
  background-color: #f8f9fa;
  border-radius: 0.25rem;
  border: 1px solid #dee2e6;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

/* Icone FontAwesome consistency */
.fas,
.fa,
.fab {
  width: 1em;
  text-align: center;
  display: inline-block;
}

/* Hover effects per bottoni di navigazione */
.input-group .btn {
  transition: all 0.2s ease-in-out;
}

.input-group .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .filtri-calendario .card-body {
    padding: 1rem;
  }

  .col-md-4,
  .col-md-3,
  .col-md-2 {
    margin-bottom: 1rem;
  }
}

/* Tema dark support */
[data-coreui-theme="dark"] .filtri-calendario {
  background: linear-gradient(135deg, #3b4252 0%, #434c5e 100%);
}

[data-coreui-theme="dark"] .input-group .btn {
  border-color: #4c566a;
  background-color: #3b4252;
  color: #eceff4;
}

[data-coreui-theme="dark"] .input-group .btn:hover {
  background-color: #434c5e;
  border-color: #5e81ac;
}

/* Tema dark per kbd */
[data-coreui-theme="dark"] kbd {
  color: #eceff4;
  background-color: #3b4252;
  border-color: #4c566a;
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.25);
}

/* Miglioramenti hover tema dark */
[data-coreui-theme="dark"] .input-group .btn {
  transition: all 0.2s ease-in-out;
}

[data-coreui-theme="dark"] .input-group .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
</style>
