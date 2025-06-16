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
          <CInputGroup>
            <CButton
              variant="outline"
              color="secondary"
              @click="cambiaGiorno(-1)"
              :disabled="loading"
              title="Giorno precedente"
            >
              <CIcon icon="cil-chevron-left" />
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
              <CIcon icon="cil-chevron-right" />
            </CButton>
          </CInputGroup>

          <!-- Scorciatoie data -->
          <div class="mt-2">
            <CButtonGroup size="sm">
              <CButton
                variant="outline"
                color="primary"
                @click="impostaOggi"
                :disabled="loading"
              >
                <CIcon v-if="loading" class="spinner-border spinner-border-sm me-2" />
                Oggi
              </CButton>
              <CButton
                variant="outline"
                color="primary"
                @click="impostaDomani"
                :disabled="loading"
              >
                <CIcon v-if="loading" class="spinner-border spinner-border-sm me-2" />
                Domani
              </CButton>
            </CButtonGroup>
          </div>
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
            <option
              v-for="specialista in specialisti"
              :key="specialista.id"
              :value="specialista.id"
            >
              {{ specialista.nome }} {{ specialista.cognome }}
            </option>
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

      <!-- Informazioni data selezionata -->
      <CRow class="mt-3">
        <CCol>
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
 */

import { computed } from 'vue'
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

const impostaDomani = () => {
  const domani = new Date()
  domani.setDate(domani.getDate() + 1)
  emit('update:dataSelezionata', domani.toISOString().split('T')[0])
}

const resetFiltri = () => {
  emit('update:dataSelezionata', new Date().toISOString().split('T')[0])
  emit('update:specialistaSelezionato', '')
  emit('update:tipoTerapiaSelezionato', '')
}

// Utilità per formattazione
const formatDataEstesa = (dateString) => {
  const data = new Date(dateString)
  return data.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const getNomeSpecialista = (specialistaId) => {
  const specialista = props.specialisti.find(s => s.id.toString() === specialistaId.toString())
  return specialista ? `${specialista.nome} ${specialista.cognome}` : ''
}

const getLabelTerapia = (tipoTerapia) => {
  const terapia = TIPI_TERAPIA_OPTIONS.find(t => t.value === tipoTerapia)
  return terapia ? terapia.label : ''
}
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
</style>
