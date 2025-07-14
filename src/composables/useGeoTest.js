/**
 * Test script per verificare la mappa province O(1)
 * Questo file può essere rimosso dopo i test
 */

import { useGeo } from './useGeo'

// Funzione di test per verificare performance O(1)
export function testProvinciaMaps() {
  const {
    getProvinciaById,
    getProvinciaByComune,
    findProvinciaByComune,
    findComuneById,
    loadComuniByProvincia,
    province
  } = useGeo()

  console.log('🧪 Test performance mappa province')

  // Attendi che le province siano caricate
  setTimeout(async () => {
    if (province.value.length === 0) {
      console.log('⏳ Province non ancora caricate, riprova tra poco...')
      return
    }

    console.log(`📊 Totale province caricate: ${province.value.length}`)

    // Test accesso diretto alla mappa province
    const primaProvinciaDaArray = province.value[0]
    const start1 = performance.now()
    const provinciaDaMappa = getProvinciaById(primaProvinciaDaArray.id)
    const end1 = performance.now()

    console.log(`✅ Test accesso O(1) mappa province:`)
    console.log(`   → Provincia da array: ${primaProvinciaDaArray.nome}`)
    console.log(`   → Provincia da mappa: ${provinciaDaMappa ? provinciaDaMappa.nome : 'Non trovata'}`)
    console.log(`   → Tempo accesso: ${(end1 - start1).toFixed(4)}ms`)
    console.log(`   → Corretto: ${provinciaDaMappa?.id === primaProvinciaDaArray.id ? '✅' : '❌'}`)

    // Carica alcuni comuni di test per le prime 2 province
    const testProvince = province.value.slice(0, 2)

    for (const provincia of testProvince) {
      console.log(`🔄 Caricamento comuni per ${provincia.nome}...`)

      try {
        const comuni = await loadComuniByProvincia(provincia.id)
        console.log(`✅ Caricati ${comuni.length} comuni per ${provincia.nome}`)

        // Test sui primi 2 comuni di questa provincia
        const testComuni = comuni.slice(0, 2)

        testComuni.forEach(comune => {
          const start = performance.now()

          // Test findProvinciaByComune (cerca comune + accesso mappa)
          const provinciaByComune = findProvinciaByComune(comune.id)

          const end = performance.now()

          console.log(`   → Comune: ${comune.nome}`)
          console.log(`     Provincia trovata: ${provinciaByComune ? provinciaByComune.nome : 'Non trovata'}`)
          console.log(`     Tempo accesso: ${(end - start).toFixed(4)}ms`)
          console.log(`     Corretto: ${provinciaByComune?.id === provincia.id ? '✅' : '❌'}`)

          // Test con oggetto comune diretto (se ha dati provincia)
          if (comune.provincia) {
            const start2 = performance.now()
            const provinciaDirecta = getProvinciaByComune(comune)
            const end2 = performance.now()

            console.log(`     Test O(1) diretto: ${provinciaDirecta ? provinciaDirecta.nome : 'Non trovata'}`)
            console.log(`     Tempo O(1): ${(end2 - start2).toFixed(4)}ms`)
          }
        })

      } catch (error) {
        console.error(`❌ Errore caricamento comuni per ${provincia.nome}:`, error)
      }
    }

    console.log('🎉 Test performance completato!')

  }, 2000) // Aspetta 2 secondi per il caricamento province
}

// Funzione per simulare la pre-selezione form
export function testFormPreSelection() {
  const {
    findProvinciaByComune,
    findComuneById,
    loadComuniByProvincia,
    province
  } = useGeo()

  console.log('🧪 Test pre-selezione form paziente')

  setTimeout(async () => {
    if (province.value.length === 0) {
      console.log('⏳ Province non ancora caricate, riprova tra poco...')
      return
    }

    // Carica comuni per la prima provincia disponibile
    const primaProvincia = province.value[0]
    console.log(`🔄 Caricamento comuni per ${primaProvincia.nome} per test...`)

    try {
      const comuni = await loadComuniByProvincia(primaProvincia.id)

      if (comuni.length === 0) {
        console.log('❌ Nessun comune trovato per il test')
        return
      }

      // Usa i primi due comuni per simulare nascita e residenza
      const comuneNascita = comuni[0]
      const comuneResidenza = comuni.length > 1 ? comuni[1] : comuni[0]

      // Simula un paziente esistente come arriva dal backend
      const pazienteSimulato = {
        id: 1,
        nome: 'Mario',
        cognome: 'Rossi',
        comuneNascita: {
          id: comuneNascita.id,
          nome: comuneNascita.nome,
          provincia: {
            id: primaProvincia.id,
            nome: primaProvincia.nome
          }
        },
        comuneResidenza: {
          id: comuneResidenza.id,
          nome: comuneResidenza.nome,
          provincia: {
            id: primaProvincia.id,
            nome: primaProvincia.nome
          }
        }
      }

      console.log('👤 Paziente simulato:', pazienteSimulato.nome, pazienteSimulato.cognome)

      // Test pre-selezione nascita (come nel PazienteModal)
      const start1 = performance.now()

      // Simula la logica del PazienteModal
      let provinciaIdNascita = null
      if (pazienteSimulato.comuneNascita?.provincia) {
        provinciaIdNascita = pazienteSimulato.comuneNascita.provincia.id
      }

      const end1 = performance.now()

      console.log('🏙️ Pre-selezione nascita:')
      console.log(`   → Comune: ${pazienteSimulato.comuneNascita.nome}`)
      console.log(`   → Provincia ID da oggetto: ${provinciaIdNascita}`)
      console.log(`   → Tempo: ${(end1 - start1).toFixed(4)}ms`)
      console.log(`   → Corretto: ${provinciaIdNascita === primaProvincia.id ? '✅' : '❌'}`)

      // Test pre-selezione residenza
      const start2 = performance.now()

      let provinciaIdResidenza = null
      if (pazienteSimulato.comuneResidenza?.provincia) {
        provinciaIdResidenza = pazienteSimulato.comuneResidenza.provincia.id
      }

      const end2 = performance.now()

      console.log('🏠 Pre-selezione residenza:')
      console.log(`   → Comune: ${pazienteSimulato.comuneResidenza.nome}`)
      console.log(`   → Provincia ID da oggetto: ${provinciaIdResidenza}`)
      console.log(`   → Tempo: ${(end2 - start2).toFixed(4)}ms`)
      console.log(`   → Corretto: ${provinciaIdResidenza === primaProvincia.id ? '✅' : '❌'}`)

      // Test della funzione di utilità findProvinciaByComune
      const start3 = performance.now()
      const provinciaByUtility = findProvinciaByComune(comuneNascita.id)
      const end3 = performance.now()

      console.log('🔍 Test findProvinciaByComune utility:')
      console.log(`   → Provincia trovata: ${provinciaByUtility ? provinciaByUtility.nome : 'Non trovata'}`)
      console.log(`   → Tempo: ${(end3 - start3).toFixed(4)}ms`)
      console.log(`   → Corretto: ${provinciaByUtility?.id === primaProvincia.id ? '✅' : '❌'}`)

      console.log('🎯 Test pre-selezione completato!')

    } catch (error) {
      console.error('❌ Errore nel test pre-selezione:', error)
    }

  }, 3000) // Aspetta 3 secondi per il caricamento
}
