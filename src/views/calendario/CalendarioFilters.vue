<template>
  <CCard class="filtri-calendario mb-4">
    <CCardBody>
      <CRow class="align-items-end">
        <!-- Controlli data -->
        <CCol md="4">
          <CFormLabel class="fw-semibold">Data</CFormLabel>
          <CRow class="g-2">
            <CCol>
              <CInputGroup>
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

        <!-- Filtro Prestazione dinamico -->
        <CCol md="3">
          <CFormLabel class="fw-semibold">Tipo Prestazione</CFormLabel>
          <CFormSelect
            :model-value="tipoTerapiaSelezionato"
            @update:model-value="$emit('update:tipoTerapiaSelezionato', $event)"
            :disabled="loading"
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
      </CRow>

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
                - Prestazione: <strong>{{ getLabelPrestazione(tipoTerapiaSelezionato) }}</strong>
              </span>
            </span>
          </div>
        </CCol>
      </CRow>
    </CCardBody>
  </CCard>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { PrestazioneService } from '@/services/prestazioneService'

// Props
const props = defineProps({
  dataSelezionata: { type: String, required: true },
  specialistaSelezionato: { type: String, default: '' },
  tipoTerapiaSelezionato: { type: String, default: '' },
  specialisti: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

// Emits
const emit = defineEmits([
  'update:dataSelezionata',
  'update:specialistaSelezionato',
  'update:tipoTerapiaSelezionato',
  'aggiorna'
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
/* Stili esistenti invariati */
.filtri-calendario {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.filtri-calendario .card-body { padding: 1.5rem; }
.input-group .btn { border-color: #ced4da; transition: all 0.2s ease-in-out; }
.input-group .btn:hover { background-color: #e9ecef; border-color: #adb5bd; transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
kbd { padding: 0.2rem 0.4rem; font-size: 0.7rem; color: #495057; background-color: #f8f9fa; border-radius: 0.25rem; border: 1px solid #dee2e6; box-shadow: inset 0 -1px 0 rgba(0,0,0,0.25); font-family: monospace; }
@media (max-width: 768px) {
  .filtri-calendario .card-body { padding: 1rem; }
  .col-md-4, .col-md-3, .col-md-2 { margin-bottom: 1rem; }
}
[data-coreui-theme="dark"] .filtri-calendario { background: linear-gradient(135deg, #3b4252 0%, #434c5e 100%); }
[data-coreui-theme="dark"] .input-group .btn { border-color: #4c566a; background-color: #3b4252; color: #eceff4; }
[data-coreui-theme="dark"] .input-group .btn:hover { background-color: #434c5e; border-color: #5e81ac; }
[data-coreui-theme="dark"] kbd { color: #eceff4; background-color: #3b4252; border-color: #4c566a; box-shadow: inset 0 -1px 0 rgba(255,255,255,0.25); }
</style>
