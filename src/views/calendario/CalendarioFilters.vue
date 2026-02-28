<template>
  <CCard class="filtri-calendario mb-4">
    <CCardBody>
      <!-- Prima riga: Titolo + Vista + informazioni -->
      <CRow class="mb-3 align-items-center">
        <!-- Titolo pagina + selezione Vista -->
        <CCol md="6">
          <div class="d-flex align-items-center gap-3">
            <h5 class="page-title-inline mb-0">
              <CIcon icon="cil-calendar" class="me-2 text-primary" />
              Calendario
            </h5>
            <CButtonGroup>
              <CButton
                :color="vistaAttiva === 'timeline' ? 'primary' : undefined"
                :variant="vistaAttiva === 'timeline' ? undefined : 'outline'"
                @click="cambiaVista('timeline')"
                :disabled="loading"
                size="sm"
                class="px-3"
              >
                <CIcon icon="cil-grid" class="me-1" />
                Timeline
              </CButton>
              <CButton
                :color="vistaAttiva === 'lista' ? 'primary' : undefined"
                :variant="vistaAttiva === 'lista' ? undefined : 'outline'"
                @click="cambiaVista('lista')"
                :disabled="loading"
                size="sm"
                class="px-3"
              >
                <CIcon icon="cil-list" class="me-1" />
                Lista
              </CButton>
            </CButtonGroup>
          </div>
        </CCol>

        <!-- Info contestuale + reset filtri a destra -->
        <CCol md="6" class="text-md-end">
          <div class="d-flex align-items-center justify-content-md-end gap-2 flex-wrap">
            <div class="d-flex align-items-center text-muted small">
              <CIcon icon="cil-calendar" class="me-2" />
              <strong>{{ formatDataEstesa(dataSelezionata) }}</strong>
              <template v-if="specialistaSelezionato || tipoTerapiaSelezionato">
                <span class="mx-2 text-muted">|</span>
                <span v-if="specialistaSelezionato">{{ getNomeSpecialista(specialistaSelezionato) }}</span>
                <span v-if="specialistaSelezionato && tipoTerapiaSelezionato" class="mx-1">·</span>
                <span v-if="tipoTerapiaSelezionato">{{ getLabelPrestazione(tipoTerapiaSelezionato) }}</span>
              </template>
            </div>
            <!-- Bottone azzera filtri (visibile solo con filtri attivi) -->
            <Transition name="fade-filter">
              <CButton
                v-if="specialistaSelezionato || tipoTerapiaSelezionato"
                variant="outline"
                color="secondary"
                size="sm"
                class="px-2 py-1 azzera-btn"
                @click="azzeraFiltri"
                title="Azzera filtri"
              >
                <CIcon icon="cil-x" class="me-1" size="sm" />
                Azzera
              </CButton>
            </Transition>
          </div>
        </CCol>
      </CRow>

      <!-- Divider sottile -->
      <hr class="my-3 border-light">

      <!-- Seconda riga: Filtri e controlli principali -->
      <CRow class="g-3 align-items-end">
        <!-- Controlli data -->
        <CCol xl="4" lg="5" md="6">
          <CFormLabel class="fw-semibold mb-2">Data</CFormLabel>
          <div class="d-flex gap-2">
            <!-- Gruppo di navigazione data -->
            <CInputGroup class="flex-grow-1">
              <CButton
                variant="outline"
                color="secondary"
                @click="cambiaGiorno(-1)"
                :disabled="loading"
                title="Giorno precedente (←)"
                class="px-3"
              >
                <font-awesome-icon icon="angle-left" />
              </CButton>
              <CFormInput
                :model-value="dataSelezionata"
                @update:model-value="$emit('update:dataSelezionata', $event)"
                type="date"
                :disabled="loading"
                class="text-center"
              />
              <CButton
                variant="outline"
                color="secondary"
                @click="cambiaGiorno(1)"
                :disabled="loading"
                title="Giorno successivo (→)"
                class="px-3"
              >
                <font-awesome-icon icon="angle-right" />
              </CButton>
            </CInputGroup>

            <!-- Bottone Oggi -->
            <CButton
              variant="outline"
              color="primary"
              @click="impostaOggi"
              :disabled="loading"
              class="px-3"
              title="Vai a oggi (H)"
            >
              Oggi
            </CButton>
          </div>
        </CCol>

        <!-- Filtro Specialista -->
        <CCol xl="3" lg="3" md="6">
          <CFormLabel class="fw-semibold mb-2">Specialista</CFormLabel>
          <CFormSelect
            :model-value="specialistaSelezionato"
            @update:model-value="$emit('update:specialistaSelezionato', $event)"
            :disabled="loading"
            class="form-control-height"
          >
            <option value="">Tutti gli specialisti</option>
            <template v-for="gruppo in specialistiRaggruppati" :key="gruppo.chiave">
              <option
                v-if="gruppo.specialisti.length === 1"
                :value="gruppo.specialisti[0].id"
              >
                {{ gruppo.nomeCompleto }}
              </option>
              <template v-else>
                <option :value="`nome:${gruppo.nomeCompleto}`">
                  {{ gruppo.nomeCompleto }} (Tutti - {{ gruppo.specialisti.length }})
                </option>
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

        <!-- Filtro Prestazione -->
        <CCol xl="3" lg="4" md="6">
          <CFormLabel class="fw-semibold mb-2">Tipo Prestazione</CFormLabel>
          <CFormSelect
            :model-value="tipoTerapiaSelezionato"
            @update:model-value="$emit('update:tipoTerapiaSelezionato', $event)"
            :disabled="loading"
            class="form-control-height"
          >
            <option value="">Tutte le prestazioni</option>
            <option
              v-for="prestazione in prestazioni"
              :key="prestazione.id"
              :value="prestazione.tipologia"
            >
              {{ prestazione.tipologia }}
            </option>
          </CFormSelect>
        </CCol>

        <!-- Bottone Nuovo Appuntamento -->
        <CCol xl="2" lg="12" md="6" class="text-xl-end">
          <CButton
            color="primary"
            @click="$emit('nuovo-evento')"
            :disabled="loading"
            class="w-100 w-xl-auto px-4"
          >
            <CIcon icon="cil-plus" class="me-2" />
            Crea
          </CButton>
        </CCol>
      </CRow>

      <!-- Shortcuts helper (opzionale, nascosto su mobile) -->
      <div class="mt-3 d-none d-md-block">
        <small class="text-muted">
          <CIcon icon="cil-keyboard" class="me-1" />
          Shortcuts: <kbd>←</kbd> <kbd>→</kbd> per navigare, <kbd>H</kbd> per oggi
        </small>
      </div>
    </CCardBody>
  </CCard>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { PrestazioneService } from '@/services/prestazioneService'

// Import componenti CoreUI aggiuntivi
import { CButtonGroup } from '@coreui/vue'

// Props
const props = defineProps({
  dataSelezionata: { type: String, required: true },
  specialistaSelezionato: { type: String, default: '' },
  tipoTerapiaSelezionato: { type: String, default: '' },
  vistaAttiva: { type: String, default: 'timeline' }, // Nuovo prop per la vista attiva
  specialisti: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

// Emits
const emit = defineEmits([
  'update:dataSelezionata',
  'update:specialistaSelezionato',
  'update:tipoTerapiaSelezionato',
  'update:vistaAttiva', // Nuovo emit per la vista attiva
  'aggiorna',
  'nuovo-evento'
])

const prestazioni = ref([])

const loadPrestazioni = async () => {
  try {
    prestazioni.value = await PrestazioneService.getAllPrestazioni()
  } catch (error) {
    console.error('Errore nel caricamento delle prestazioni:', error)
  }
}

// Azzera i filtri specialista e prestazione
const azzeraFiltri = () => {
  emit('update:specialistaSelezionato', '')
  emit('update:tipoTerapiaSelezionato', '')
}

// Navigazione data
const cambiaGiorno = (giorni) => {
  const dataCorrente = new Date(props.dataSelezionata)
  dataCorrente.setDate(dataCorrente.getDate() + giorni)
  emit('update:dataSelezionata', dataCorrente.toISOString().split('T')[0])
}

const impostaOggi = () => {
  const oggi = new Date().toISOString().split('T')[0]
  emit('update:dataSelezionata', oggi)
}

// Metodo per cambiare vista (Timeline/Lista)
const cambiaVista = (nuovaVista) => {
  emit('update:vistaAttiva', nuovaVista)
}

// Raggruppamento specialisti
const specialistiRaggruppati = computed(() => {
  const gruppi = new Map()
  props.specialisti.forEach(specialista => {
    const nomeCompleto = `${specialista.nome} ${specialista.cognome}`.trim()
    if (!gruppi.has(nomeCompleto)) {
      gruppi.set(nomeCompleto, { chiave: nomeCompleto, nomeCompleto, specialisti: [] })
    }
    gruppi.get(nomeCompleto).specialisti.push(specialista)
  })
  return Array.from(gruppi.values()).sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, 'it'))
})

const formatPrestazione = (tipologia) => {
  if (!tipologia) return 'N/A'
  return tipologia.replace(/_/g, ' ').toUpperCase()
}

const formatDataEstesa = (dateString) => {
  const data = new Date(dateString)
  return data.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const getNomeSpecialista = (valore) => {
  if (!valore) return ''
  if (valore.toString().startsWith('nome:')) return valore.substring(5)
  const s = props.specialisti.find(s => s.id.toString() === valore.toString())
  return s ? `${s.nome} ${s.cognome}` : ''
}

const getLabelPrestazione = (tipologia) => {
  // Ora riceviamo direttamente la tipologia, non più l'ID
  if (!tipologia) return ''
  // Troviamo la prestazione per tipologia per assicurarci che esista
  const p = prestazioni.value.find(p => p.tipologia === tipologia)
  return p ? p.tipologia : tipologia
}

// Shortcuts
const handleKeyDown = (event) => {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault(); cambiaGiorno(-1); break
    case 'ArrowRight':
      event.preventDefault(); cambiaGiorno(1); break
    case 'h':
    case 'H':
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault(); impostaOggi()
      }
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  loadPrestazioni()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* Card filtri con design pulito usando variabili CUI */
.filtri-calendario {
  background: var(--cui-body-bg);
  border: 1px solid var(--cui-border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease;
  animation: fadeIn 0.3s ease-out;
}

.filtri-calendario:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.09);
}

/* Titolo inline nella card filtri */
.page-title-inline {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--cui-body-color);
  white-space: nowrap;
}

/* Divider */
hr.border-light {
  border-color: var(--cui-border-color);
  margin: 1rem 0;
}

/* Altezza uniforme controlli */
.form-control-height,
.input-group .form-control,
.input-group .btn,
.btn-group .btn {
  height: 38px;
  display: flex;
  align-items: center;
}

.btn-group .btn-sm {
  height: 32px;
  font-size: 0.875rem;
}

/* Bottoni */
.input-group .btn,
.btn-group .btn {
  border-color: var(--cui-border-color);
  background-color: var(--cui-body-bg);
  color: var(--cui-body-color);
  transition: all 0.2s ease;
}

.input-group .btn:hover:not(:disabled),
.btn-group .btn:hover:not(.btn-primary):not(:disabled) {
  background-color: var(--cui-tertiary-bg);
  border-color: var(--cui-border-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

/* Label */
.form-label {
  color: var(--cui-body-color);
  font-size: 0.875rem;
}

input[type="date"] {
  cursor: pointer;
}

/* Keyboard shortcuts */
kbd {
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
  color: var(--cui-body-color);
  background-color: var(--cui-tertiary-bg);
  border-radius: 0.25rem;
  border: 1px solid var(--cui-border-color);
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

/* Bottone "Azzera filtri" */
.azzera-btn {
  font-size: 0.8rem;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Transizione per il bottone azzera */
.fade-filter-enter-active,
.fade-filter-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-filter-enter-from,
.fade-filter-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

/* Responsive */
@media (max-width: 1199px) {
  .w-xl-auto {
    width: 100% !important;
  }
}

@media (max-width: 991px) {
  .filtri-calendario :deep(.card-body) {
    padding: 1rem;
  }
}

@media (max-width: 767px) {
  hr.border-light {
    display: none;
  }

  .page-title-inline {
    font-size: 1rem;
  }
}

/* Animazione entrata */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Focus state coerente */
.btn:focus,
.form-control:focus,
.form-select:focus {
  box-shadow: 0 0 0 0.2rem rgba(var(--cui-primary-rgb), 0.25);
}

.btn:disabled {
  cursor: not-allowed;
}
</style>
