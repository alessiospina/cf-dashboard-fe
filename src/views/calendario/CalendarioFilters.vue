<template>
  <CCard class="filtri-calendario mb-4">
    <CCardBody>
      <!-- Prima riga: Vista e informazioni -->
      <CRow class="mb-3 align-items-center">
        <!-- Selezione Vista a sinistra -->
        <CCol md="6">
          <div class="d-flex align-items-center gap-3">
            <span class="fw-semibold text-muted">Vista:</span>
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

        <!-- Info contestuale a destra -->
        <CCol md="6" class="text-md-end">
          <div class="d-flex align-items-center justify-content-md-end text-muted small">
            <CIcon icon="cil-calendar" class="me-2" />
            <span>
              <strong>{{ formatDataEstesa(dataSelezionata) }}</strong>
              <span v-if="specialistaSelezionato || tipoTerapiaSelezionato" class="ms-2">
                <span class="text-muted">|</span>
                <span v-if="specialistaSelezionato" class="ms-2">
                  {{ getNomeSpecialista(specialistaSelezionato) }}
                </span>
                <span v-if="tipoTerapiaSelezionato" class="ms-2">
                  {{ getLabelPrestazione(tipoTerapiaSelezionato) }}
                </span>
              </span>
            </span>
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
/* Card principale con design migliorato */
.filtri-calendario {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.filtri-calendario:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.filtri-calendario .card-body {
  padding: 1.25rem;
}

/* Divider personalizzato */
hr.border-light {
  border-color: rgba(0, 0, 0, 0.08);
  margin: 1rem 0;
}

/* Uniformazione altezza controlli */
.form-control-height,
.input-group .form-control,
.input-group .btn,
.btn-group .btn {
  height: 38px;
  display: flex;
  align-items: center;
}

/* Bottoni vista più piccoli nella prima riga */
.btn-group .btn-sm {
  height: 32px;
  font-size: 0.875rem;
}

/* Stili per i bottoni */
.input-group .btn,
.btn-group .btn {
  border-color: #dee2e6;
  transition: all 0.2s ease-in-out;
  background-color: #ffffff;
}

.input-group .btn:hover,
.btn-group .btn:hover:not(.btn-primary) {
  background-color: #f8f9fa;
  border-color: #adb5bd;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Bottone primario con stile più moderno */
.btn-primary {
  background: linear-gradient(135deg, #5856d6 0%, #4c49c7 100%);
  border: none;
  box-shadow: 0 2px 4px rgba(88, 86, 214, 0.25);
  transition: all 0.2s ease;
  font-weight: 500;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #4c49c7 0%, #3c39b5 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(88, 86, 214, 0.35);
}

.btn-primary:disabled {
  background: #6c757d;
  opacity: 0.65;
}

/* Migliore spaziatura per gap */
.gap-2 {
  gap: 0.5rem!important;
}

.gap-3 {
  gap: 1rem!important;
}

/* Label con stile uniforme */
.form-label {
  color: #495057;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

/* Input date con stile migliorato */
input[type="date"] {
  cursor: pointer;
}

/* Keyboard shortcuts style */
kbd {
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
  color: #495057;
  background-color: #f8f9fa;
  border-radius: 0.25rem;
  border: 1px solid #dee2e6;
  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.15);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

/* Stili responsive migliorati */
@media (max-width: 1199px) {
  /* Su schermi large, il bottone crea occupa tutta la larghezza */
  .w-xl-auto {
    width: 100%!important;
  }
}

@media (max-width: 991px) {
  .filtri-calendario .card-body {
    padding: 1rem;
  }

  /* Centra le info su tablet */
  .text-md-end {
    text-align: center!important;
  }

  .justify-content-md-end {
    justify-content: center!important;
  }
}

@media (max-width: 767px) {
  /* Su mobile, rimuovi il divider e riduci spaziature */
  hr.border-light {
    display: none;
  }

  .mb-3 {
    margin-bottom: 0.5rem!important;
  }

  /* Stack completo su mobile */
  .col-md-6 {
    margin-bottom: 0.5rem;
  }

  /* Testo più piccolo su mobile */
  .small {
    font-size: 0.8rem;
  }
}

/* Dark mode styles */
[data-coreui-theme="dark"] .filtri-calendario {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-coreui-theme="dark"] hr.border-light {
  border-color: rgba(255, 255, 255, 0.1);
}

[data-coreui-theme="dark"] .input-group .btn,
[data-coreui-theme="dark"] .btn-group .btn {
  border-color: #4a5568;
  background-color: #2d3748;
  color: #e2e8f0;
}

[data-coreui-theme="dark"] .input-group .btn:hover,
[data-coreui-theme="dark"] .btn-group .btn:hover:not(.btn-primary) {
  background-color: #4a5568;
  border-color: #718096;
}

[data-coreui-theme="dark"] .form-label {
  color: #cbd5e0;
}

[data-coreui-theme="dark"] .text-muted {
  color: #a0aec0!important;
}

[data-coreui-theme="dark"] .btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #5a67d8 100%);
}

[data-coreui-theme="dark"] .btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a67d8 0%, #4c51bf 100%);
}

[data-coreui-theme="dark"] kbd {
  color: #e2e8f0;
  background-color: #2d3748;
  border-color: #4a5568;
  box-shadow: inset 0 -1px 0 rgba(255,255,255,0.15);
}

/* Animazioni sottili */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.filtri-calendario {
  animation: fadeIn 0.3s ease-out;
}

/* Focus states */
.btn:focus,
.form-control:focus,
.form-select:focus {
  box-shadow: 0 0 0 0.25rem rgba(88, 86, 214, 0.25);
}

/* Loading state */
.btn:disabled {
  cursor: not-allowed;
}

/* Transitions fluide per tutti gli elementi interattivi */
.btn,
.form-control,
.form-select {
  transition: all 0.2s ease;
}
</style>
