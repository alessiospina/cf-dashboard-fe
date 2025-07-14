<template>
  <div class="debug-geo p-4">
    <h3>🔧 Debug Componenti Geografici</h3>

    <!-- Test API Direct -->
    <CCard class="mb-4">
      <CCardHeader>
        <h5>🌐 Test API Dirette</h5>
      </CCardHeader>
      <CCardBody>
        <div class="d-flex gap-2 mb-3">
          <CButton @click="testProvince" :disabled="loadingTest" color="primary" size="sm">
            <CSpinner v-if="loadingTestProvince" size="sm" class="me-2"/>
            Test Province API
          </CButton>
          <CButton @click="testComuni" :disabled="loadingTest" color="info" size="sm">
            <CSpinner v-if="loadingTestComuni" size="sm" class="me-2"/>
            Test Comuni API
          </CButton>
        </div>

        <div v-if="testResults.province.length > 0" class="mb-3">
          <strong>✅ Province API ({{ testResults.province.length }}):</strong>
          <div class="small text-muted">{{ testResults.province.slice(0, 3).map(p => p.nome).join(', ') }}...</div>
        </div>

        <div v-if="testResults.comuni.length > 0" class="mb-3">
          <strong>✅ Comuni API ({{ testResults.comuni.length }}):</strong>
          <div class="small text-muted">{{ testResults.comuni.slice(0, 3).map(c => c.nome).join(', ') }}...</div>
        </div>

        <div v-if="apiError" class="alert alert-danger">
          <strong>❌ Errore API:</strong> {{ apiError }}
        </div>
      </CCardBody>
    </CCard>

    <!-- Test Composable -->
    <CCard class="mb-4">
      <CCardHeader>
        <h5>🎛️ Test Composable useGeo</h5>
      </CCardHeader>
      <CCardBody>
        <CButton @click="forceInitialize" :disabled="loadingInit" color="success" size="sm" class="mb-3">
          <CSpinner v-if="loadingInit" size="sm" class="me-2"/>
          Forza Inizializzazione
        </CButton>

        <div class="row">
          <div class="col-md-6">
            <strong>Province dal Composable:</strong>
            <ul class="small">
              <li>Caricate: {{ province.length }}</li>
              <li>Loading: {{ loadingProvince }}</li>
              <li>Errore: {{ errorProvince || 'Nessuno' }}</li>
            </ul>
          </div>
          <div class="col-md-6">
            <strong>Comuni dal Composable:</strong>
            <ul class="small">
              <li>Caricati: {{ tuttiIComuni.length }}</li>
              <li>Loading: {{ loadingTuttiComuni }}</li>
              <li>Errore: {{ errorTuttiComuni || 'Nessuno' }}</li>
            </ul>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <!-- Test Input con Debug -->
    <CCard class="mb-4">
      <CCardHeader>
        <h5>📝 Test Input Debug</h5>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="6">
            <label>Input Province Debug:</label>
            <div style="position: relative;">
              <input
                v-model="debugProvinciaInput"
                @focus="onDebugProvinciaFocus"
                @input="onDebugProvinciaInput"
                @blur="onDebugProvinciaBlur"
                placeholder="Digita per testare..."
                class="form-control mb-2"
              />
              <!-- DROPDOWN SEMPRE VISIBILE per test -->
              <div
                style="
                  position: absolute;
                  top: 100%;
                  left: 0;
                  right: 0;
                  background: yellow;
                  border: 3px solid red;
                  z-index: 999999;
                  padding: 10px;
                  display: block;
                "
              >
                🔥 DROPDOWN TEST SEMPRE VISIBILE 🔥
                <div>Input: {{ debugProvinciaInput }}</div>
                <div>Filtrate: {{ filteredProvince.length }}</div>
              </div>
            </div>
            <div class="small">
              <div>Focus: {{ debugEvents.provinciaFocus }}</div>
              <div>Input: {{ debugEvents.provinciaInput }}</div>
              <div>Blur: {{ debugEvents.provinciaBlur }}</div>
              <div>Filtrate: {{ filteredProvince.length }}</div>
            </div>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <!-- Console Log Real Time -->
    <CCard>
      <CCardHeader>
        <h5>📊 Console Log</h5>
        <CButton @click="clearLogs" size="sm" color="outline-secondary">Pulisci</CButton>
      </CCardHeader>
      <CCardBody style="max-height: 300px; overflow-y: auto;">
        <div v-for="(log, index) in logs" :key="index" class="small mb-1">
          <span class="text-muted">{{ log.time }}</span> - {{ log.message }}
        </div>
      </CCardBody>
    </CCard>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useGeo } from '@/composables/useGeo'
import { GeoService } from '@/services/geoService'

// Test diretti API
const loadingTestProvince = ref(false)
const loadingTestComuni = ref(false)
const loadingInit = ref(false)
const apiError = ref('')

const testResults = reactive({
  province: [],
  comuni: []
})

// Composable useGeo
const {
  province,
  tuttiIComuni,
  loadingProvince,
  loadingTuttiComuni,
  errorProvince,
  errorTuttiComuni,
  initialize,
  filterProvince
} = useGeo()

// Computed per province filtrate nel debug
const filteredProvince = computed(() => {
  return filterProvince(debugProvinciaInput.value)
})

// Debug events
const debugProvinciaInput = ref('')
const debugEvents = reactive({
  provinciaFocus: 0,
  provinciaInput: 0,
  provinciaBlur: 0
})

// Logs real time
const logs = ref([])

const addLog = (message) => {
  logs.value.push({
    time: new Date().toLocaleTimeString(),
    message
  })
  console.log(`🔧 DEBUG: ${message}`)
}

// Test API dirette
const testProvince = async () => {
  loadingTestProvince.value = true
  apiError.value = ''

  try {
    addLog('🌐 Chiamata diretta API Province...')
    const result = await GeoService.getProvince()
    testResults.province = result
    addLog(`✅ Province caricate: ${result.length}`)
  } catch (error) {
    apiError.value = `Errore Province: ${error.message}`
    addLog(`❌ Errore API Province: ${error.message}`)
  } finally {
    loadingTestProvince.value = false
  }
}

const testComuni = async () => {
  loadingTestComuni.value = true
  apiError.value = ''

  try {
    addLog('🌐 Chiamata diretta API Comuni...')
    const result = await GeoService.getAllComuni()
    testResults.comuni = result
    addLog(`✅ Comuni caricati: ${result.length}`)
  } catch (error) {
    apiError.value = `Errore Comuni: ${error.message}`
    addLog(`❌ Errore API Comuni: ${error.message}`)
  } finally {
    loadingTestComuni.value = false
  }
}

const forceInitialize = async () => {
  loadingInit.value = true

  try {
    addLog('🚀 Forza inizializzazione composable...')
    await initialize()
    addLog('✅ Inizializzazione completata')
  } catch (error) {
    addLog(`❌ Errore inizializzazione: ${error.message}`)
  } finally {
    loadingInit.value = false
  }
}

// Debug input events
const onDebugProvinciaFocus = () => {
  debugEvents.provinciaFocus++
  addLog(`🎯 Focus su input provincia (${debugEvents.provinciaFocus})`)
}

const onDebugProvinciaInput = () => {
  debugEvents.provinciaInput++
  addLog(`⌨️ Input provincia: "${debugProvinciaInput.value}" (${debugEvents.provinciaInput})`)

  // Test filtro
  if (debugProvinciaInput.value.length > 1) {
    const filtered = filterProvince(debugProvinciaInput.value)
    addLog(`🔍 Province filtrate: ${filtered.length}`)
  }
}

const onDebugProvinciaBlur = () => {
  debugEvents.provinciaBlur++
  addLog(`🔄 Blur su input provincia (${debugEvents.provinciaBlur})`)
}

const clearLogs = () => {
  logs.value = []
}

// Auto test iniziale
onMounted(() => {
  addLog('🚀 DebugGeoComponent montato')
})
</script>

<style scoped>
.debug-geo {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
