/**
 * Composable SINGLETON per la gestione dei dati geografici
 *
 * Questo composable fornisce funzionalità riutilizzabili per:
 * - Gestire province, comuni e stati
 * - Caching dei dati geografici
 * - Select a cascata (provincia → comuni)
 * - Mappa O(1) delle province per ID
 * - Istanza unica condivisa (singleton)
 */

import { ref, computed, onMounted } from 'vue'
import { GeoService } from '@/services/geoService'

// Stato globale condiviso (singleton)
let geoInstance = null

export function useGeo() {
  // Se esiste già un'istanza, restituisci quella
  if (geoInstance) {
    return geoInstance
  }

  console.log('🚀 Inizializzazione useGeo - istanza unica')

  // Stato reattivo condiviso
  const province = ref([])
  const comuni = ref([])
  const stati = ref([])
  const tuttiIComuni = ref([]) // Lista completa di tutti i comuni per autocomplete
  const loadingProvince = ref(false)
  const loadingComuni = ref(false)
  const loadingStati = ref(false)
  const loadingTuttiComuni = ref(false) // Loading per tutti i comuni
  const errorProvince = ref(null)
  const errorComuni = ref(null)
  const errorStati = ref(null)
  const errorTuttiComuni = ref(null) // Errore per tutti i comuni
  const regioni = ref([])
  const loadingRegioni = ref(false)
  const errorRegioni = ref(null)

  // Cache per i comuni per provincia (per evitare chiamate ripetute)
  const comuniCache = ref(new Map())

  // Mappa delle province per accesso O(1): provinciaId -> provinciaObject
  const provinciaMap = ref(new Map())

  // Nuova mappa: provincia_id -> [lista_comuni] per autocomplete
  const comuniPerProvinciaMap = ref(new Map())

  const regioneMap = ref(new Map())


  // Flag per evitare caricamenti multipli
  const isInitialized = ref(false)

  // Computed properties
  const hasProvince = computed(() => province.value.length > 0)
  const hasStati = computed(() => stati.value.length > 0)
  const hasRegioni = computed(() => regioni.value.length > 0)

  // Opzioni formattate per le select
  const provincieOptions = computed(() => [
    { value: null, label: 'Seleziona una provincia' },
    ...province.value.map(provincia => ({
      value: provincia.id,
      label: `${provincia.nome} (${provincia.siglaAutomobilistica})`
    }))
  ])

  const statiOptions = computed(() => [
    { value: null, label: 'Seleziona uno stato' },
    ...stati.value.map(stato => ({
      value: stato.id,
      label: stato.nome
    }))
  ])

  const regioniOptions = computed(() => [
    { value: null, label: 'Seleziona una regione' },
    ...regioni.value.map(regione => ({
      value: regione.id,
      label: regione.nome
    }))
  ])

  /**
   * Costruisce la mappa delle province per accesso O(1)
   * @param {Array} province - Lista delle province
   */
  const buildProvinciaMap = (province) => {
    const newProvinciaMap = new Map()

    province.forEach(provincia => {
      newProvinciaMap.set(provincia.id, provincia)
    })

    provinciaMap.value = newProvinciaMap
    console.log(`✅ Mappa province costruita: ${newProvinciaMap.size} province`)
  }

  /**
   * Costruisce la mappa provincia_id -> [lista_comuni] per autocomplete
   * @param {Array} tuttiComuni - Lista completa di tutti i comuni
   */
  const buildComuniPerProvinciaMap = (tuttiComuni) => {
    const newComuniPerProvinciaMap = new Map()

    // Raggruppa i comuni per provincia
    tuttiComuni.forEach(comune => {
      if (comune.idProvincia) {
        const provinciaId = comune.idProvincia

        if (!newComuniPerProvinciaMap.has(provinciaId)) {
          newComuniPerProvinciaMap.set(provinciaId, [])
        }

        // Arricchisci il comune con l'oggetto provincia completo
        const provinciaCompleta = getProvinciaById(provinciaId)
        if (provinciaCompleta) {
          comune.provincia = provinciaCompleta
        }

        newComuniPerProvinciaMap.get(provinciaId).push(comune)
      }
    })

    comuniPerProvinciaMap.value = newComuniPerProvinciaMap

    // Ordina alfabeticamente i comuni per ogni provincia
    for (const [provinciaId, comuni] of newComuniPerProvinciaMap.entries()) {
      comuni.sort((a, b) => a.nome.localeCompare(b.nome))
    }

    console.log(`✅ Mappa comuni per provincia costruita: ${newComuniPerProvinciaMap.size} province`)
  }

  /**
   * Costruisce la mappa delle regioni per accesso O(1)
   * @param {Array} regioni - Lista delle regioni
   */
  const buildRegioneMap = (regioni) => {
    const newRegioneMap = new Map()

    regioni.forEach(regione => {
      newRegioneMap.set(regione.id, regione)
    })

    regioneMap.value = newRegioneMap
    console.log(`✅ Mappa regioni costruita: ${newRegioneMap.size} regioni`)
  }


  /**
   * Ottiene la provincia dato l'ID - O(1)
   * @param {number} provinciaId - ID della provincia
   * @returns {Object|undefined} Oggetto provincia completo
   */
  const getProvinciaById = (provinciaId) => {
    return provinciaMap.value.get(provinciaId)
  }

  /**
   * Trova la provincia di un comune utilizzando la mappa O(1)
   * @param {Object} comune - Oggetto comune con comune.provincia.id o comune.idProvincia
   * @returns {Object|null} Oggetto provincia completo
   */
  const getProvinciaByComune = (comune) => {
    if (!comune) return null

    // Prova 1: Se il comune ha già l'oggetto provincia
    if (comune.provincia?.id) {
      return getProvinciaById(comune.provincia.id)
    }

    // Prova 2: Se il comune ha idProvincia
    if (comune.idProvincia) {
      return getProvinciaById(comune.idProvincia)
    }

    return null
  }

  /**
   * Ottiene la regione dato l'ID - O(1)
   * @param {number} regioneId - ID della regione
   * @returns {Object|undefined} Oggetto regione completo
   */
  const getRegioneById = (regioneId) => {
    return regioneMap.value.get(regioneId)
  }


  /**
   * Trova la provincia dato l'ID del comune (cerca il comune prima)
   * @param {number} comuneId - ID del comune
   * @returns {Object|null} Oggetto provincia completo
   */
  const findProvinciaByComune = (comuneId) => {
    if (!comuneId) return null

    // Trova il comune nella cache
    const comune = findComuneById(comuneId)
    if (!comune) return null

    // Ottieni la provincia usando la mappa O(1)
    return getProvinciaByComune(comune)
  }

  // Metodi per il caricamento dei dati
  const loadProvince = async () => {
    if (loadingProvince.value || province.value.length > 0) {
      console.log('⏭️ Province già caricate, skip')
      return province.value
    }

    console.log('🔄 Caricamento province...')
    loadingProvince.value = true
    errorProvince.value = null

    try {
      const provinceData = await GeoService.getProvince()
      province.value = provinceData

      // Costruisce la mappa O(1) delle province
      buildProvinciaMap(provinceData)

      console.log('✅ Province caricate:', provinceData.length)
      return provinceData
    } catch (error) {
      errorProvince.value = 'Errore nel caricamento delle province'
      console.error('❌ Errore caricamento province:', error)
      throw error
    } finally {
      loadingProvince.value = false
    }
  }

  const loadStati = async () => {
    if (loadingStati.value || stati.value.length > 0) return

    loadingStati.value = true
    errorStati.value = null

    try {
      stati.value = await GeoService.getStati()
    } catch (error) {
      errorStati.value = 'Errore nel caricamento degli stati'
      console.error('Errore caricamento stati:', error)
    } finally {
      loadingStati.value = false
    }
  }

  /**
   * Carica tutti i comuni italiani per l'autocomplete
   * @returns {Promise<Array>} Lista completa di tutti i comuni
   */
  const loadAllComuni = async () => {
    if (loadingTuttiComuni.value || tuttiIComuni.value.length > 0) {
      console.log('⏭️ Tutti i comuni già caricati, skip')
      return tuttiIComuni.value
    }

    console.log('🔄 Caricamento di tutti i comuni...')
    loadingTuttiComuni.value = true
    errorTuttiComuni.value = null

    try {
      const comuniData = await GeoService.getAllComuni()
      tuttiIComuni.value = comuniData

      // Costruisce la mappa provincia_id -> [lista_comuni] per autocomplete
      buildComuniPerProvinciaMap(comuniData)

      console.log('✅ Tutti i comuni caricati:', comuniData.length)
      return comuniData
    } catch (error) {
      errorTuttiComuni.value = 'Errore nel caricamento di tutti i comuni'
      console.error('❌ Errore caricamento tutti i comuni:', error)
      throw error
    } finally {
      loadingTuttiComuni.value = false
    }
  }

  const loadComuniByProvincia = async (provinciaId) => {
    if (!provinciaId) {
      comuni.value = []
      return []
    }

    // Controlla la cache
    if (comuniCache.value.has(provinciaId)) {
      console.log(`📦 Comuni da cache per provincia ${provinciaId}`)
      comuni.value = comuniCache.value.get(provinciaId)
      return comuni.value
    }

    console.log(`🔄 Caricamento comuni per provincia ${provinciaId}...`)
    loadingComuni.value = true
    errorComuni.value = null

    try {
      const comuniData = await GeoService.getComuniByProvincia(provinciaId)

      // Salva in cache
      comuniCache.value.set(provinciaId, comuniData)
      comuni.value = comuniData

      console.log(`✅ Comuni caricati per provincia ${provinciaId}:`, comuniData.length)

      return comuniData
    } catch (error) {
      errorComuni.value = 'Errore nel caricamento dei comuni'
      console.error(`❌ Errore caricamento comuni per provincia ${provinciaId}:`, error)
      return []
    } finally {
      loadingComuni.value = false
    }
  }

  const loadRegioni = async () => {
    if (loadingRegioni.value || regioni.value.length > 0) {
      console.log('⏭️ Regioni già caricate, skip')
      return regioni.value
    }

    console.log('🔄 Caricamento regioni...')
    loadingRegioni.value = true
    errorRegioni.value = null

    try {
      const regioniData = await GeoService.getRegioni()
      regioni.value = regioniData

      // Costruisce la mappa O(1) delle regioni
      buildRegioneMap(regioniData)

      console.log('✅ Regioni caricate:', regioniData.length)
      return regioniData
    } catch (error) {
      errorRegioni.value = 'Errore nel caricamento delle regioni'
      console.error('❌ Errore caricamento regioni:', error)
      throw error
    } finally {
      loadingRegioni.value = false
    }
  }


  // Metodo per ottenere opzioni comuni per una provincia specifica
  const getComuniOptions = (provinciaId) => {
    if (!provinciaId) {
      return [{ value: null, label: 'Seleziona prima una provincia' }]
    }

    const comuniProvincia = comuniCache.value.get(provinciaId) || []

    if (comuniProvincia.length === 0) {
      return [{ value: null, label: 'Caricamento comuni...' }]
    }

    return [
      { value: null, label: 'Seleziona un comune' },
      ...comuniProvincia.map(comune => ({
        value: comune.id,
        label: comune.nome
      }))
    ]
  }

  // Metodi di utilità

  /**
   * Filtra le province per l'autocomplete (case-insensitive)
   * @param {string} searchText - Testo di ricerca
   * @param {number|null} regioneId - ID della regione per filtrare (opzionale)
   * @returns {Array} Province filtrate
   */
  const filterProvince = (searchText, regioneId = null) => {
    // Prima filtra per regione se specificata
    let provinceToFilter = province.value
    if (regioneId) {
      provinceToFilter = province.value.filter(p => p.idRegione === regioneId)
      console.log(`🔍 Filtro province per regione ${regioneId}: ${provinceToFilter.length} province trovate`)
    }

    if (!searchText || searchText.trim() === '') {
      return provinceToFilter.slice(0, 10) // Mostra solo le prime 10 se non c'è ricerca
    }

    const searchLower = searchText.toLowerCase().trim()

    return provinceToFilter.filter(provincia =>
      provincia.nome.toLowerCase().includes(searchLower) ||
      provincia.siglaAutomobilistica.toLowerCase().includes(searchLower)
    ).slice(0, 10) // Limita a 10 risultati
  }

  /**
   * Ottiene tutte le province di una specifica regione
   * @param {number} regioneId - ID della regione
   * @returns {Array} Province della regione
   */
  const getProvinceByRegione = (regioneId) => {
    if (!regioneId) return []
    return province.value.filter(p => p.idRegione === regioneId)
  }

  /**
   * Filtra le regioni per l'autocomplete (case-insensitive)
   * @param {string} searchText - Testo di ricerca
   * @returns {Array} Regioni filtrate
   */
  const filterRegioni = (searchText) => {
    if (!searchText || searchText.trim() === '') {
      return regioni.value.slice(0, 10) // Mostra solo le prime 10 se non c'è ricerca
    }

    const searchLower = searchText.toLowerCase().trim()

    return regioni.value.filter(regione =>
      regione.nome.toLowerCase().includes(searchLower)
    ).slice(0, 10) // Limita a 10 risultati
  }

  /**
   * Filtra gli stati per l'autocomplete (case-insensitive)
   * @param {string} searchText - Testo di ricerca
   * @returns {Array} Stati filtrati
   */
  const filterStati = (searchText) => {
    if (!searchText || searchText.trim() === '') {
      return stati.value.slice(0, 10) // Mostra solo i primi 10 se non c'è ricerca
    }

    const searchLower = searchText.toLowerCase().trim()

    return stati.value.filter(stato =>
      stato.nome.toLowerCase().includes(searchLower)
    ).slice(0, 10) // Limita a 10 risultati
  }


  /**
   * Filtra i comuni per provincia per l'autocomplete (case-insensitive)
   * @param {number} provinciaId - ID della provincia
   * @param {string} searchText - Testo di ricerca
   * @returns {Array} Comuni filtrati
   */
  const filterComuniByProvincia = (provinciaId, searchText) => {
    if (!provinciaId) {
      return []
    }

    const comuniProvincia = comuniPerProvinciaMap.value.get(provinciaId) || []

    if (!searchText || searchText.trim() === '') {
      return comuniProvincia.slice(0, 10) // Mostra solo i primi 10 se non c'è ricerca
    }

    const searchLower = searchText.toLowerCase().trim()

    return comuniProvincia.filter(comune =>
      comune.nome.toLowerCase().includes(searchLower)
    ).slice(0, 10) // Limita a 10 risultati
  }

  const findComuneById = (comuneId) => {
    if (!comuneId) return null

    // Cerca prima nella lista completa (più efficiente)
    const comune = tuttiIComuni.value.find(c => c.id === comuneId)
    if (comune) {
      // Arricchisci il comune con la provincia se non l'ha già
      if (!comune.provincia && comune.idProvincia) {
        const provinciaCompleta = getProvinciaById(comune.idProvincia)
        if (provinciaCompleta) {
          comune.provincia = provinciaCompleta
        }
      }
      return comune
    }

    // Fallback: cerca nella cache (per retrocompatibilità)
    for (const comuniList of comuniCache.value.values()) {
      const comune = comuniList.find(c => c.id === comuneId)
      if (comune) return comune
    }
    return null
  }

  const getStatoById = (statoId) => {
    return stati.value.find(s => s.id === statoId) || null
  }

  // Reset cache (utile per refresh forzato)
  const clearCache = () => {
    comuniCache.value.clear()
    comuni.value = []
    provinciaMap.value.clear()
    comuniPerProvinciaMap.value.clear() // Reset anche della nuova mappa
    tuttiIComuni.value = [] // Reset lista completa comuni
    console.log('🧹 Cache pulita')
  }

  // Inizializzazione automatica (una sola volta)
  const initialize = async () => {
    if (isInitialized.value) {
      console.log('⏭️ useGeo già inizializzato')
      return
    }

    console.log('🚀 Inizializzazione useGeo...')
    isInitialized.value = true

    try {
      // Carica province, comuni, regioni e stati in parallelo per l'autocomplete
      await Promise.all([
        loadProvince(),
        loadAllComuni(),
        loadRegioni(),
        loadStati()
      ])
    } catch (error) {
      console.error('❌ Errore inizializzazione useGeo:', error)
      isInitialized.value = false // Reset per retry
    }
  }

  // Caricamento automatico delle province all'avvio (solo prima volta)
  onMounted(() => {
    initialize()
  })

  // Crea l'istanza singleton
  geoInstance = {
    // Stato
    province,
    comuni,
    stati,
    tuttiIComuni, // Nuova lista completa comuni
    loadingProvince,
    loadingComuni,
    loadingStati,
    loadingTuttiComuni, // Nuovo loading per tutti i comuni
    errorProvince,
    errorComuni,
    errorStati,
    errorTuttiComuni, // Nuovo errore per tutti i comuni
    hasProvince,
    hasStati,

    // Opzioni per select
    provincieOptions,
    statiOptions,

    // Metodi
    loadProvince,
    loadStati,
    loadComuniByProvincia,
    loadAllComuni, // Nuovo metodo per caricare tutti i comuni
    getComuniOptions,
    initialize,

    // Utilities O(1)
    getProvinciaById,
    getProvinciaByComune,
    findProvinciaByComune,
    findComuneById,
    getStatoById,
    clearCache,

    // Nuovi metodi per autocomplete
    filterProvince,
    filterComuniByProvincia,
    getProvinceByRegione,
    filterStati,

    regioni,
    loadingRegioni,
    errorRegioni,
    hasRegioni,
    regioniOptions,

    // Metodi
    loadRegioni,
    getRegioneById,
    filterRegioni,

  }

  return geoInstance
}
