/**
 * Composable per la gestione del Calendario
 *
 * Fornisce:
 * - Gestione eventi e specialisti
 * - Dati mock di esempio
 * - Logica di filtring e validazione
 * - Utilità per la timeline
 * - Mapping tra entità frontend e backend
 */

import {ref, computed} from 'vue'
import {
  EventoBackend,
  SlotBackend,
  EventoMapper,
  EventoValidator,
  FrequenzaEvento,
  FREQUENZA_EVENTO_OPTIONS
} from '@/types/backend.types'

// Import dei service per professionisti e pazienti
import {ProfessionistaService} from '@/services/professionistaService'
import {PazienteService} from '@/services/pazienteService'

// Tipi di terapia dal sistema esistente
export const TIPI_TERAPIA_OPTIONS = [
  {value: 'LOGOPEDIA', label: 'Logopedia'},
  {value: 'NEUROPSICHIATRIA_INFANTILE', label: 'Neuropsichiatria Infantile'},
  {value: 'NEUROPSICOMOTRICITÀ', label: 'Neuropsicomotricità'},
  {value: 'TERAPIA_ABA', label: 'Terapia ABA'},
  {value: 'PSICOLOGA', label: 'Psicologa'},
  {value: 'COLLOQUIO_CONOSCITIVO', label: 'Colloquio Conoscitivo'}
]

// Colori per i tipi di terapia
export const COLORI_TERAPIA = {
  'LOGOPEDIA': '#0d6efd', // primary
  'NEUROPSICHIATRIA_INFANTILE': '#198754', // success
  'NEUROPSICOMOTRICITÀ': '#0dcaf0', // info
  'TERAPIA_ABA': '#ffc107', // warning
  'PSICOLOGA': '#6c757d', // secondary
  'COLLOQUIO_CONOSCITIVO': '#212529' // dark
}

// Dati mock specialisti
const SPECIALISTI_MOCK = [
  {id: '1', nome: 'Anna', cognome: 'Rossi', specializzazione: 'LOGOPEDIA'},
  {id: '2', nome: 'Marco', cognome: 'Bianchi', specializzazione: 'NEUROPSICHIATRIA_INFANTILE'},
  {id: '3', nome: 'Laura', cognome: 'Verdi', specializzazione: 'NEUROPSICOMOTRICITÀ'},
  {id: '4', nome: 'Giuseppe', cognome: 'Neri', specializzazione: 'TERAPIA_ABA'},
  {id: '5', nome: 'Sofia', cognome: 'Gialli', specializzazione: 'PSICOLOGA'},
  {id: '6', nome: 'Roberto', cognome: 'Blu', specializzazione: 'LOGOPEDIA'},
  {id: '7', nome: 'Francesca', cognome: 'Viola', specializzazione: 'NEUROPSICOMOTRICITÀ'},
  {id: '8', nome: 'Alessandro', cognome: 'Rosa', specializzazione: 'TERAPIA_ABA'},
  {id: '9', nome: 'Elena', cognome: 'Grigi', specializzazione: 'PSICOLOGA'},
  {id: '10', nome: 'Davide', cognome: 'Marroni', specializzazione: 'COLLOQUIO_CONOSCITIVO'},
  {id: '11', nome: 'Chiara', cognome: 'Celesti', specializzazione: 'LOGOPEDIA'},
  {id: '12', nome: 'Matteo', cognome: 'Arancioni', specializzazione: 'NEUROPSICHIATRIA_INFANTILE'},
  {id: '13', nome: 'Valentina', cognome: 'Indaco', specializzazione: 'NEUROPSICOMOTRICITÀ'},
  {id: '14', nome: 'Luca', cognome: 'Beige', specializzazione: 'TERAPIA_ABA'},
  {id: '15', nome: 'Simona', cognome: 'Turchesi', specializzazione: 'PSICOLOGA'},
  {id: '16', nome: 'Andrea', cognome: 'Corallo', specializzazione: 'LOGOPEDIA'},
  {id: '17', nome: 'Paola', cognome: 'Magenta', specializzazione: 'NEUROPSICHIATRIA_INFANTILE'},
  {id: '18', nome: 'Fabio', cognome: 'Ciano', specializzazione: 'NEUROPSICOMOTRICITÀ'},
  {id: '19', nome: 'Giorgia', cognome: 'Senape', specializzazione: 'TERAPIA_ABA'},
  {id: '20', nome: 'Nicola', cognome: 'Vinaccia', specializzazione: 'COLLOQUIO_CONOSCITIVO'}
]

// Funzione per generare eventi mock realistici
const generaEventiMock = () => {
  const eventi = []
  const oggi = new Date()

  // Genera eventi per oggi e i prossimi 7 giorni
  for (let giorno = 0; giorno < 7; giorno++) {
    const dataCorrente = new Date(oggi)
    dataCorrente.setDate(oggi.getDate() + giorno)

    // Per ogni giorno, genera 10-12 eventi distribuiti tra gli specialisti
    const numEventi = 10 + Math.floor(Math.random() * 3) // 10-12 eventi

    for (let i = 0; i < numEventi; i++) {
      const specialista = SPECIALISTI_MOCK[Math.floor(Math.random() * SPECIALISTI_MOCK.length)]
      const tipoTerapia = specialista.specializzazione

      // Orario casuale tra 8:00 e 15:00 (per permettere slot di 4-5 ore)
      const oraInizio = 8 + Math.floor(Math.random() * 7) // 8-14
      const minutoInizio = Math.floor(Math.random() * 4) * 15 // 0, 15, 30, 45

      // Durata casuale tra 4-5 ore (in base alle tue specifiche)
      const durataOre = 4 + Math.random() // 4.0 - 5.0 ore

      const dataInizio = new Date(dataCorrente)
      dataInizio.setHours(oraInizio, minutoInizio, 0, 0)

      const dataFine = new Date(dataInizio)
      dataFine.setMilliseconds(dataFine.getMilliseconds() + (durataOre * 60 * 60 * 1000))

      // Genera nomi pazienti casuali
      const nomiPazienti = ['Mario', 'Giulia', 'Luca', 'Sara', 'Paolo', 'Anna', 'Marco', 'Elena', 'Davide', 'Chiara']
      const cognomiPazienti = ['Rossi', 'Bianchi', 'Verdi', 'Neri', 'Gialli', 'Blu', 'Viola', 'Rosa', 'Grigi', 'Marroni']

      const nomePaziente = nomiPazienti[Math.floor(Math.random() * nomiPazienti.length)]
      const cognomePaziente = cognomiPazienti[Math.floor(Math.random() * cognomiPazienti.length)]

      const stati = ['confermato', 'in_attesa', 'completato']
      const stato = dataCorrente < oggi ? 'completato' : stati[Math.floor(Math.random() * 2)] // Solo confermato/in_attesa per eventi futuri

      eventi.push({
        id: `${giorno}-${i}`,
        titolo: `TERAPIA ${tipoTerapia.replace('_', ' ')}`,
        specialista: {
          id: specialista.id,
          nome: specialista.nome,
          cognome: specialista.cognome,
          nomeCompleto: `${specialista.nome} ${specialista.cognome}`
        },
        paziente: {
          id: `paziente-${Math.floor(Math.random() * 1000)}`,
          nome: nomePaziente,
          cognome: cognomePaziente,
          nomeCompleto: `${nomePaziente} ${cognomePaziente}`
        },
        dataInizio: dataInizio.toISOString(),
        dataFine: dataFine.toISOString(),
        tipoTerapia,
        stato,
        note: Math.random() > 0.7 ? 'Note aggiuntive per la terapia' : '',
        sala: `Sala ${Math.floor(Math.random() * 5) + 1}`,
        colore: COLORI_TERAPIA[tipoTerapia]
      })
    }
  }

  return eventi.sort((a, b) => new Date(a.dataInizio) - new Date(b.dataInizio))
}

export function useCalendario() {
  // Stato reattivo
  const eventi = ref([])
  const specialisti = ref([])
  const professionisti = ref([]) // Lista professionisti dal backend
  const pazienti = ref([]) // Lista pazienti dal backend
  const loading = ref(false)
  const loadingProfessionisti = ref(false) // Loading specifico per professionisti
  const loadingPazienti = ref(false) // Loading specifico per pazienti
  const error = ref('')

  // Funzioni per caricare i dati (mock)
  const caricaSpecialisti = async () => {
    loading.value = true
    try {
      // Simula chiamata API
      await new Promise(resolve => setTimeout(resolve, 500))
      specialisti.value = SPECIALISTI_MOCK
    } catch (err) {
      error.value = 'Errore nel caricamento degli specialisti'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // Funzione per caricare professionisti dal backend (una sola volta)
  const caricaProfessionisti = async () => {
    // Se già caricati, non rifare la chiamata
    if (professionisti.value.length > 0) {
      console.log('Professionisti già caricati, utilizzo cache')
      return professionisti.value
    }

    loadingProfessionisti.value = true
    try {
      console.log('Caricamento professionisti dal backend...')
      professionisti.value = await ProfessionistaService.getAllProfessionisti()
      console.log(`Caricati ${professionisti.value.length} professionisti`)
      return professionisti.value
    } catch (err) {
      error.value = 'Errore nel caricamento dei professionisti dal backend'
      console.error(err)
      professionisti.value = [] // Array vuoto in caso di errore
      return []
    } finally {
      loadingProfessionisti.value = false
    }
  }

  // Funzione per caricare pazienti dal backend (una sola volta)
  const caricaPazienti = async () => {
    // Se già caricati, non rifare la chiamata
    if (pazienti.value.length > 0) {
      console.log('Pazienti già caricati, utilizzo cache')
      return pazienti.value
    }

    loadingPazienti.value = true
    try {
      console.log('Caricamento pazienti dal backend...')
      pazienti.value = await PazienteService.getAllPazienti()
      console.log(`Caricati ${pazienti.value.length} pazienti`)
      return pazienti.value
    } catch (err) {
      error.value = 'Errore nel caricamento dei pazienti dal backend'
      console.error(err)
      pazienti.value = [] // Array vuoto in caso di errore
      return []
    } finally {
      loadingPazienti.value = false
    }
  }

  // Funzione per cercare professionisti (utilizzo cache locale)
  const cercaProfessionisti = async (query = '') => {
    try {
      // Assicurati che i professionisti siano caricati
      if (professionisti.value.length === 0) {
        await caricaProfessionisti()
      }

      // Filtra localmente senza chiamate API
      if (!query || query.trim() === '') {
        return professionisti.value
      }

      const queryLower = query.toLowerCase()
      return professionisti.value.filter(professionista => {
        // Controlli di sicurezza per evitare errori con valori undefined/null
        const nominativo = professionista.nominativo || ''
        const nome = professionista.nome || ''
        const cognome = professionista.cognome || ''

        // Filtra solo se i campi sono validi
        return nominativo.toLowerCase().includes(queryLower) ||
               nome.toLowerCase().includes(queryLower) ||
               cognome.toLowerCase().includes(queryLower)
      })
    } catch (err) {
      console.error('Errore nella ricerca professionisti:', err)
      return []
    }
  }

  // Funzione per cercare pazienti (utilizzo cache locale)
  const cercaPazienti = (query = '') => {
    // Filtra localmente senza chiamate API
    if (!query || query.trim() === '') {
      return pazienti.value
    }

    const queryLower = query.toLowerCase()
    return pazienti.value.filter(paziente => {
      // Controlli di sicurezza per evitare errori con valori undefined/null
      const nome = paziente.nome || ''
      const cognome = paziente.cognome || ''
      const email = paziente.email || ''
      const nomeCompleto = `${nome} ${cognome}`.trim()

      // Filtra solo se i campi sono validi
      return nomeCompleto.toLowerCase().includes(queryLower) ||
             email.toLowerCase().includes(queryLower)
    })
  }

  // Funzione per inizializzare tutti i dati (da chiamare all'apertura del calendario)
  const inizializzaCalendario = async () => {
    console.log('Inizializzazione calendario...')
    try {
      await Promise.all([
        caricaEventi(),
        caricaSpecialisti(),
        caricaProfessionisti(),
        caricaPazienti()
      ])
      console.log('Calendario inizializzato con successo')
    } catch (err) {
      console.error('Errore nell\'inizializzazione calendario:', err)
      error.value = 'Errore nell\'inizializzazione del calendario'
    }
  }

  const caricaEventi = async () => {
    loading.value = true
    try {
      // Simula chiamata API
      await new Promise(resolve => setTimeout(resolve, 300))
      eventi.value = generaEventiMock()
    } catch (err) {
      error.value = 'Errore nel caricamento degli eventi'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // Funzioni CRUD eventi
  const creaEvento = async (eventoData) => {
    try {
      // Simula chiamata API
      await new Promise(resolve => setTimeout(resolve, 500))

      const nuovoEvento = {
        id: Date.now().toString(),
        ...eventoData,
        colore: COLORI_TERAPIA[eventoData.tipoTerapia]
      }

      eventi.value.push(nuovoEvento)
      return nuovoEvento
    } catch (err) {
      error.value = 'Errore nella creazione dell\'evento'
      throw err
    }
  }

  const aggiornaEvento = async (eventoAggiornato) => {
    try {
      // Simula chiamata API
      await new Promise(resolve => setTimeout(resolve, 500))

      const index = eventi.value.findIndex(e => e.id === eventoAggiornato.id)
      if (index !== -1) {
        eventi.value[index] = {
          ...eventoAggiornato,
          colore: COLORI_TERAPIA[eventoAggiornato.tipoTerapia]
        }
      }

      return eventi.value[index]
    } catch (err) {
      error.value = 'Errore nell\'aggiornamento dell\'evento'
      throw err
    }
  }

  const eliminaEvento = async (eventoId) => {
    try {
      // Simula chiamata API
      await new Promise(resolve => setTimeout(resolve, 500))

      eventi.value = eventi.value.filter(e => e.id !== eventoId)
    } catch (err) {
      error.value = 'Errore nell\'eliminazione dell\'evento'
      throw err
    }
  }

  // Utilità per filtri
  const filtraEventi = (listaEventi, filtri) => {
    let eventiFiltrati = [...listaEventi]

    // Filtro per data
    if (filtri.data) {
      const dataFiltro = new Date(filtri.data)
      eventiFiltrati = eventiFiltrati.filter(evento => {
        const dataEvento = new Date(evento.dataInizio)
        return dataEvento.toDateString() === dataFiltro.toDateString()
      })
    }

    // Filtro per specialista
    if (filtri.specialista) {
      eventiFiltrati = eventiFiltrati.filter(evento =>
        evento.specialista.id === filtri.specialista
      )
    }

    // Filtro per tipo terapia
    if (filtri.tipoTerapia) {
      eventiFiltrati = eventiFiltrati.filter(evento =>
        evento.tipoTerapia === filtri.tipoTerapia
      )
    }

    return eventiFiltrati
  }

  // Utilità per la timeline
  const getEventoInOrario = (specialistaId, dataOra) => {
    return eventi.value.find(evento => {
      const inizio = new Date(evento.dataInizio)
      const fine = new Date(evento.dataFine)
      const ora = new Date(dataOra)

      return evento.specialista.id === specialistaId &&
        ora >= inizio && ora < fine
    })
  }

  const isSlotLibero = (specialistaId, dataInizio, dataFine) => {
    const inizio = new Date(dataInizio)
    const fine = new Date(dataFine)

    return !eventi.value.some(evento => {
      if (evento.specialista.id !== specialistaId) return false

      const eventoInizio = new Date(evento.dataInizio)
      const eventoFine = new Date(evento.dataFine)

      // Controlla sovrapposizioni
      return (inizio < eventoFine) && (fine > eventoInizio)
    })
  }

  // Utilità per formattazione
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDuration = (dataInizio, dataFine) => {
    const inizio = new Date(dataInizio)
    const fine = new Date(dataFine)
    const durataMs = fine - inizio
    const durataOre = Math.floor(durataMs / (1000 * 60 * 60))
    const durataMinuti = Math.floor((durataMs % (1000 * 60 * 60)) / (1000 * 60))

    if (durataMinuti === 0) {
      return `${durataOre}h`
    }
    return `${durataOre}h ${durataMinuti}m`
  }

  return {
    // Stato
    eventi,
    specialisti,
    professionisti, // Lista professionisti dal backend
    pazienti, // Lista pazienti dal backend
    loading,
    loadingProfessionisti, // Loading specifico per professionisti
    loadingPazienti, // Loading specifico per pazienti
    error,

    // Metodi
    caricaEventi,
    caricaSpecialisti,
    caricaProfessionisti, // Carica professionisti una sola volta
    caricaPazienti, // Carica pazienti una sola volta
    cercaProfessionisti, // Cerca professionisti in cache
    cercaPazienti, // Cerca pazienti in cache
    inizializzaCalendario, // Inizializza tutto il calendario
    creaEvento,
    aggiornaEvento,
    eliminaEvento,

    // Utilità
    filtraEventi,
    getEventoInOrario,
    isSlotLibero,
    formatTime,
    formatDate,
    formatDuration,

    // Costanti
    TIPI_TERAPIA_OPTIONS,
    COLORI_TERAPIA,

    // Funzionalità backend
    FrequenzaEvento,
    FREQUENZA_EVENTO_OPTIONS,
    EventoMapper,
    EventoValidator
  }
}
