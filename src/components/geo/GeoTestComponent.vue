<template>
  <div class="geo-test-component p-4">
    <h3>Test Componenti Geografici</h3>
    <p class="text-muted mb-4">
      Questo componente serve per testare i dropdown geografici e assicurarsi che si aprano correttamente.
    </p>

    <CRow class="g-4">
      <CCol md="6">
        <CCard>
          <CCardHeader>
            <h5>Test Province</h5>
          </CCardHeader>
          <CCardBody>
            <ProvinceAutocomplete
              v-model="selectedProvinciaId"
              label="Provincia di test"
              placeholder="Cerca una provincia..."
              @provincia-changed="handleProvinciaChanged"
            />

            <div v-if="selectedProvincia" class="mt-3 p-3 bg-light rounded">
              <strong>Provincia selezionata:</strong><br>
              {{ selectedProvincia.nome }} ({{ selectedProvincia.siglaAutomobilistica }})
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md="6">
        <CCard>
          <CCardHeader>
            <h5>Test Comuni</h5>
          </CCardHeader>
          <CCardBody>
            <ComuniAutocomplete
              v-model="selectedComuneId"
              :provincia-id="selectedProvinciaId"
              label="Comune di test"
              placeholder="Cerca un comune..."
              @comune-changed="handleComuneChanged"
            />

            <div v-if="selectedComune" class="mt-3 p-3 bg-light rounded">
              <strong>Comune selezionato:</strong><br>
              {{ selectedComune.nome }}
              <span v-if="selectedComune.provincia">
                ({{ selectedComune.provincia.siglaAutomobilistica }})
              </span>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <!-- Debug Info -->
    <CCard class="mt-4">
      <CCardHeader>
        <h5>Debug Info</h5>
      </CCardHeader>
      <CCardBody>
        <pre>{{ debugInfo }}</pre>
      </CCardBody>
    </CCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGeo } from '@/composables/useGeo'
import ProvinceAutocomplete from './ProvinceAutocomplete.vue'
import ComuniAutocomplete from './ComuniAutocomplete.vue'

// Stato del componente
const selectedProvinciaId = ref(null)
const selectedComuneId = ref(null)

// Composable geografico
const {
  getProvinciaById,
  findComuneById,
  province,
  tuttiIComuni, // ✅ AGGIUNTO: per evitare errori
  loadingProvince,
  loadingTuttiComuni,
  errorProvince,
  errorTuttiComuni,
  initialize // ✅ AGGIUNTO: per inizializzazione forzata
} = useGeo()

// Computed per mostrare i dati selezionati
const selectedProvincia = computed(() => {
  return selectedProvinciaId.value ? getProvinciaById(selectedProvinciaId.value) : null
})

const selectedComune = computed(() => {
  return selectedComuneId.value ? findComuneById(selectedComuneId.value) : null
})

  // ✅ Debug info con più dettagli
  const debugInfo = computed(() => {
    return {
      selectedProvinciaId: selectedProvinciaId.value,
      selectedComuneId: selectedComuneId.value,
      provinceLoaded: province.value.length,
      comuniLoaded: tuttiIComuni.value.length,
      loadingProvince: loadingProvince.value,
      loadingTuttiComuni: loadingTuttiComuni.value,
      errorProvince: errorProvince.value,
      errorTuttiComuni: errorTuttiComuni.value,
      // ✅ AGGIUNTO: Informazioni più dettagliate
      sampleProvince: province.value.slice(0, 3).map(p => ({ id: p.id, nome: p.nome })),
      sampleComuni: tuttiIComuni.value.slice(0, 3).map(c => ({ id: c.id, nome: c.nome }))
    }
  })

// Event handlers
const handleProvinciaChanged = (provincia) => {
  console.log('🏛️ Provincia cambiata:', provincia)
  // Reset del comune quando cambia la provincia
  selectedComuneId.value = null
}

const handleComuneChanged = (comune) => {
  console.log('🏙️ Comune cambiato:', comune)
}

// ✅ AGGIUNTO: Forza inizializzazione al mount del componente
onMounted(async () => {
  console.log('🚀 Inizializzazione forzata del test geografico...')
  try {
    await initialize()
    console.log('✅ Inizializzazione completata')
  } catch (error) {
    console.error('❌ Errore inizializzazione:', error)
  }
})
</script>

<style scoped>
.geo-test-component {
  max-width: 1200px;
  margin: 0 auto;
}

pre {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  overflow-x: auto;
}
</style>
