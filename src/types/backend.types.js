/**
 * Tipi TypeScript che riflettono le entità backend
 * Questi tipi sono allineati con le entità NestJS del backend
 */

// Enum per i tipi di terapia (dal backend TipoTerapia enum)
export const TipoTerapia = {
  LOGOPEDIA: 'LOGOPEDIA',
  NEUROPSICHIATRIA_INFANTILE: 'NEUROPSICHIATRIA_INFANTILE',
  NEUROPSICOMOTRICITÀ: 'NEUROPSICOMOTRICITÀ',
  TERAPIA_ABA: 'TERAPIA_ABA',
  PSICOLOGA: 'PSICOLOGA',
  COLLOQUIO_CONOSCITIVO: 'COLLOQUIO_CONOSCITIVO'
}

// Opzioni per la select dei tipi di terapia
export const TIPI_TERAPIA_OPTIONS = [
  {value: TipoTerapia.LOGOPEDIA, label: 'Logopedia'},
  {value: TipoTerapia.NEUROPSICHIATRIA_INFANTILE, label: 'Neuropsichiatria Infantile'},
  {value: TipoTerapia.NEUROPSICOMOTRICITÀ, label: 'Neuropsicomotricità'},
  {value: TipoTerapia.TERAPIA_ABA, label: 'Terapia ABA'},
  {value: TipoTerapia.PSICOLOGA, label: 'Psicologa'},
  {value: TipoTerapia.COLLOQUIO_CONOSCITIVO, label: 'Colloquio Conoscitivo'}
]

// Colori associati ai tipi di terapia per la UI
export const COLORI_TERAPIA = {
  [TipoTerapia.LOGOPEDIA]: '#0d6efd',
  [TipoTerapia.NEUROPSICHIATRIA_INFANTILE]: '#198754',
  [TipoTerapia.NEUROPSICOMOTRICITÀ]: '#17a2b8',
  [TipoTerapia.TERAPIA_ABA]: '#ffc107',
  [TipoTerapia.PSICOLOGA]: '#6f42c1',
  [TipoTerapia.COLLOQUIO_CONOSCITIVO]: '#6c757d'
}

// Enum per la frequenza degli eventi (dal backend)
export const FrequenzaEvento = {
  GIORNALIERA: 'GIORNALIERA',
  SETTIMANALE: 'SETTIMANALE',
  MENSILE: 'MENSILE',
  UNICA: 'UNICA'
}

// Opzioni per la select della frequenza
export const FREQUENZA_EVENTO_OPTIONS = [
  {value: FrequenzaEvento.UNICA, label: 'Evento Unico'},
  {value: FrequenzaEvento.GIORNALIERA, label: 'Ripetizione Giornaliera'},
  {value: FrequenzaEvento.SETTIMANALE, label: 'Ripetizione Settimanale'},
  {value: FrequenzaEvento.MENSILE, label: 'Ripetizione Mensile'}
]

// ⭐ NUOVO - Enum per i tipi di ricorrenza (frontend - valori italiani)
export const TipoRicorrenza = {
  GIORNALIERA: 'GIORNALIERA',
  SETTIMANALE: 'SETTIMANALE',
  MENSILE: 'MENSILE'
}

// ⭐ NUOVO - Enum per i tipi di ricorrenza backend (valori inglesi)
export const TipoRicorrenzaBackend = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY'
}

// ⭐ NUOVO - Mappatura tra frontend e backend per tipi ricorrenza
export const MAPPING_RICORRENZA_FRONTEND_TO_BACKEND = {
  [TipoRicorrenza.GIORNALIERA]: TipoRicorrenzaBackend.DAILY,
  [TipoRicorrenza.SETTIMANALE]: TipoRicorrenzaBackend.WEEKLY,
  [TipoRicorrenza.MENSILE]: TipoRicorrenzaBackend.MONTHLY
}

// ⭐ NUOVO - Mappatura inversa per convertire dal backend al frontend
export const MAPPING_RICORRENZA_BACKEND_TO_FRONTEND = {
  [TipoRicorrenzaBackend.DAILY]: TipoRicorrenza.GIORNALIERA,
  [TipoRicorrenzaBackend.WEEKLY]: TipoRicorrenza.SETTIMANALE,
  [TipoRicorrenzaBackend.MONTHLY]: TipoRicorrenza.MENSILE
}

// ⭐ NUOVO - Opzioni per la select del tipo ricorrenza
export const TIPO_RICORRENZA_OPTIONS = [
  {value: TipoRicorrenza.SETTIMANALE, label: 'Ripeti Settimanalmente'},
  {value: TipoRicorrenza.MENSILE, label: 'Ripeti Mensilmente'},
  {value: TipoRicorrenza.GIORNALIERA, label: 'Ripeti Giornalmente'}
]

// ⭐ NUOVO - Enum per la direzione delle modifiche eventi ricorrenti (ALLINEATO AL BACKEND)
export const Direction = {
  ALL: 'ALL',           // Tutti gli eventi ricorrenti
  BACKWARD: 'BACKWARD', // Evento corrente e precedenti
  FORWARD: 'FORWARD'    // Evento corrente e successivi
}

// ⭐ NUOVO - Opzioni per la select della direzione (AGGIORNATO)
export const DIRECTION_OPTIONS = [
  {value: Direction.ALL, label: 'Tutti gli eventi ricorrenti'},
  {value: Direction.BACKWARD, label: 'Questo evento e i precedenti'},
  {value: Direction.FORWARD, label: 'Questo evento e i successivi'}
]

/**
 * Interfaccia per l'entità Evento (backend) - AGGIORNATA
 * Corrisponde a evento.entity.ts e evento.dto.ts con nuova struttura
 */
export class EventoBackend {
  constructor(data = {}) {
    this.id = data.id || null
    this.titolo = data.titolo || ''
    this.stanza = data.stanza || ''
    // ⭐ NUOVA STRUTTURA - Data e orari separati dal backend
    this.date = data.date || null           // Data dell'evento (DATE)
    this.timeStart = data.timeStart || null // Orario inizio (TIME)
    this.timeEnd = data.timeEnd || null     // Orario fine (TIME)
    this.prezzo = data.prezzo || null
    this.master = data.master || null // Campo master per eventi ricorrenti
    this.createdAt = data.createdAt || null
    this.paziente = data.paziente || null
    this.specialista = data.specialista || null
  }
}

// ⭐ NUOVO - Utility functions per la gestione della ricorrenza
export class RicorrenzaUtils {
  /**
   * Calcola la data massima consentita per la fine ricorrenza
   * (31 dicembre dell'anno corrente come richiesto)
   * @returns {Date} - Data massima come oggetto Date
   */
  static getDataMassimaFineRicorrenza() {
    const oggi = new Date()
    const annoCorrente = oggi.getFullYear()
    // Usa il costruttore locale per evitare problemi di timezone
    return new Date(annoCorrente, 11, 31) // 31 dicembre dell'anno corrente
  }

  /**
   * Calcola la data massima consentita per la fine ricorrenza (formato stringa)
   * @returns {string} - Data massima in formato YYYY-MM-DD
   */
  static getDataMassimaFineRicorrenzaString() {
    return this.getDataMassimaFineRicorrenza().toISOString().split('T')[0]
  }

  /**
   * Calcola la data minima consentita per la fine ricorrenza
   * (domani)
   * @returns {Date} - Data minima come oggetto Date
   */
  static getDataMinimaFineRicorrenza() {
    const oggi = new Date()
    // Crea domani usando il costruttore locale
    return new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() + 1)
  }

  /**
   * Calcola la data minima consentita per la fine ricorrenza (formato stringa)
   * @returns {string} - Data minima in formato YYYY-MM-DD
   */
  static getDataMinimaFineRicorrenzaString() {
    return this.getDataMinimaFineRicorrenza().toISOString().split('T')[0]
  }

  /**
   * Valida se una data è nel range consentito per la fine ricorrenza
   * @param {string|Date} data - Data da validare
   * @returns {boolean} - True se la data è valida
   */
  static isDataFineRicorrenzaValida(data) {
    // Parsing sicuro della data da validare
    const dataTest = this.parseDataItaliana(data)
    // Usa le date dirette senza doppio parsing
    const dataMinima = this.getDataMinimaFineRicorrenza()
    const dataMassima = this.getDataMassimaFineRicorrenza()

    console.log('🐛 [Debug] Validazione date ricorrenza:', {
      dataTest: dataTest.toDateString(),
      dataMinima: dataMinima.toDateString(),
      dataMassima: dataMassima.toDateString(),
      isValid: dataTest >= dataMinima && dataTest <= dataMassima
    })

    return dataTest >= dataMinima && dataTest <= dataMassima
  }

  /**
   * Parse sicuro di una data considerando il locale italiano
   * @param {string|Date} data - Data da parsare (formato YYYY-MM-DD o oggetto Date)
   * @returns {Date} - Data parsata correttamente per il timezone italiano
   */
  static parseDataItaliana(data) {
    if (data instanceof Date) {
      return data
    }

    // Se è una stringa in formato YYYY-MM-DD, la parsiamo come data locale italiana
    if (typeof data === 'string') {
      // Rimuovi il timezone se presente e forza interpretazione locale
      const dataString = data.split('T')[0] // Prende solo la parte della data
      const [anno, mese, giorno] = dataString.split('-').map(Number)

      // Crea la data in locale italiano (mese è 0-based in JavaScript)
      return new Date(anno, mese - 1, giorno)
    }

    // Fallback: prova a creare una data normale
    return new Date(data)
  }

  /**
   * Formatta il label per il tipo ricorrenza
   * @param {string} tipo - Tipo ricorrenza (frontend o backend)
   * @returns {string} - Label formattato
   */
  static formatTipoRicorrenza(tipo) {
    const labels = {
      // Valori frontend
      [TipoRicorrenza.GIORNALIERA]: 'ogni giorno',
      [TipoRicorrenza.SETTIMANALE]: 'ogni settimana',
      [TipoRicorrenza.MENSILE]: 'ogni mese',
      // Valori backend
      [TipoRicorrenzaBackend.DAILY]: 'ogni giorno',
      [TipoRicorrenzaBackend.WEEKLY]: 'ogni settimana',
      [TipoRicorrenzaBackend.MONTHLY]: 'ogni mese'
    }
    return labels[tipo] || tipo
  }

  /**
   * Verifica se un valore è un tipo ricorrenza valido (frontend o backend)
   * @param {string} tipo - Tipo da verificare
   * @returns {boolean} - True se il tipo è valido
   */
  static isValidTipoRicorrenza(tipo) {
    const valoriValidi = [
      ...Object.values(TipoRicorrenza), // Frontend: GIORNALIERA, SETTIMANALE, MENSILE
      ...Object.values(TipoRicorrenzaBackend) // Backend: DAILY, WEEKLY, MONTHLY
    ]
    return valoriValidi.includes(tipo)
  }

  /**
   * Calcola il numero approssimativo di eventi che verranno creati (AGGIORNATO - Nuova struttura)
   * @param {Date|string} dataEvento - Data del primo evento (supporta sia 'date' che 'dataInizio')
   * @param {Date} dataFineRicorrenza - Data fine ricorrenza
   * @param {string} tipoRicorrenza - Tipo di ricorrenza (frontend o backend)
   * @returns {number} - Numero approssimativo di eventi
   */
  static calcolaNumeroEventiRicorrenti(dataEvento, dataFineRicorrenza, tipoRicorrenza) {
    // ⭐ COMPATIBILITÀ - Accetta sia la nuova struttura che quella vecchia
    let dataInizio = dataEvento

    // Se è un oggetto, estrai il campo 'date' (nuova struttura) o 'dataInizio' (vecchia)
    if (typeof dataEvento === 'object' && dataEvento !== null && !(dataEvento instanceof Date)) {
      dataInizio = dataEvento.date || dataEvento.dataInizio
    }

    // Usa il parsing italiano per entrambe le date
    const inizio = this.parseDataItaliana(dataInizio)
    const fine = this.parseDataItaliana(dataFineRicorrenza)

    if (inizio >= fine) return 1

    const diffMs = fine - inizio
    const diffGiorni = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // Accetta sia valori frontend che backend
    switch (tipoRicorrenza) {
      case TipoRicorrenza.GIORNALIERA:
      case TipoRicorrenzaBackend.DAILY:
        return Math.floor(diffGiorni) + 1
      case TipoRicorrenza.SETTIMANALE:
      case TipoRicorrenzaBackend.WEEKLY:
        return Math.floor(diffGiorni / 7) + 1
      case TipoRicorrenza.MENSILE:
      case TipoRicorrenzaBackend.MONTHLY:
        // Calcolo approssimativo basato su 30 giorni per mese
        return Math.floor(diffGiorni / 30) + 1
      default:
        return 1
    }
  }

  /**
   * Genera un preview descrittivo della ricorrenza (AGGIORNATO - Nuova struttura)
   * @param {Object} ricorrenzaData - Dati ricorrenza {tipo, dataFineRicorrenza} + dati evento
   * @param {Date|string} dataEvento - Data del primo evento (opzionale, può essere incluso in ricorrenzaData)
   * @returns {string} - Descrizione leggibile della ricorrenza
   */
  static getDescrizioneRicorrenza(tipoRicorrenza, dataFineRicorrenza, numeroEventi) {
    const tipoFormattato = this.formatTipoRicorrenza(tipoRicorrenza)
    // Usa il parsing italiano per la formattazione
    const dataFormattata = this.parseDataItaliana(dataFineRicorrenza).toLocaleDateString('it-IT')

    return `Ripetuto ${tipoFormattato} fino al ${dataFormattata} (circa ${numeroEventi} eventi)`
  }

  // ⭐ NUOVA UTILITY - Conversione tra vecchia e nuova struttura
  /**
   * Converte da dataInizio/dataFine (vecchia struttura) a date/timeStart/timeEnd (nuova)
   * @param {Object} eventoVecchiaStruttura - Evento con dataInizio/dataFine
   * @returns {Object} - Evento con date/timeStart/timeEnd
   */
  static convertiVecchiaANuovaStruttura(eventoVecchiaStruttura) {
    if (!eventoVecchiaStruttura.dataInizio || !eventoVecchiaStruttura.dataFine) {
      return eventoVecchiaStruttura
    }

    try {
      const dataInizio = new Date(eventoVecchiaStruttura.dataInizio)
      const dataFine = new Date(eventoVecchiaStruttura.dataFine)

      // Estrai la data (assumendo che gli eventi siano nello stesso giorno)
      const date = dataInizio.toISOString().split('T')[0] // YYYY-MM-DD

      // Estrai gli orari
      const timeStart = dataInizio.toTimeString().substring(0, 5) // HH:MM
      const timeEnd = dataFine.toTimeString().substring(0, 5) // HH:MM

      return {
        ...eventoVecchiaStruttura,
        date,
        timeStart,
        timeEnd,
        // Mantieni anche i campi originali per compatibilità
        dataInizio: eventoVecchiaStruttura.dataInizio,
        dataFine: eventoVecchiaStruttura.dataFine
      }
    } catch (error) {
      console.warn('Errore nella conversione struttura evento:', error)
      return eventoVecchiaStruttura
    }
  }

  /**
   * Converte da date/timeStart/timeEnd (nuova struttura) a dataInizio/dataFine (vecchia)
   * @param {Object} eventoNuovaStruttura - Evento con date/timeStart/timeEnd
   * @returns {Object} - Evento con dataInizio/dataFine
   */
  static convertiNuovaAVecchiaStruttura(eventoNuovaStruttura) {
    if (!eventoNuovaStruttura.date || !eventoNuovaStruttura.timeStart || !eventoNuovaStruttura.timeEnd) {
      return eventoNuovaStruttura
    }

    try {
      // Combina data e orari per creare le date complete
      const dataInizio = new Date(`${eventoNuovaStruttura.date}T${eventoNuovaStruttura.timeStart}:00`)
      const dataFine = new Date(`${eventoNuovaStruttura.date}T${eventoNuovaStruttura.timeEnd}:00`)

      return {
        ...eventoNuovaStruttura,
        dataInizio: dataInizio.toISOString(),
        dataFine: dataFine.toISOString(),
        // Mantieni anche i campi nuovi per compatibilità
        date: eventoNuovaStruttura.date,
        timeStart: eventoNuovaStruttura.timeStart,
        timeEnd: eventoNuovaStruttura.timeEnd
      }
    } catch (error) {
      console.warn('Errore nella conversione struttura evento:', error)
      return eventoNuovaStruttura
    }
  }

  /**
   * Utility per estrarre data/orari da qualsiasi struttura evento
   * @param {Object} evento - Evento in qualsiasi formato
   * @returns {Object} - {date, timeStart, timeEnd, dataInizio, dataFine}
   */
  static estraiCampiTemporali(evento) {
    const risultato = {}

    // Se ha la nuova struttura
    if (evento.date && evento.timeStart && evento.timeEnd) {
      risultato.date = evento.date
      risultato.timeStart = evento.timeStart
      risultato.timeEnd = evento.timeEnd

      // Genera anche i campi vecchi
      const conversione = this.convertiNuovaAVecchiaStruttura(evento)
      risultato.dataInizio = conversione.dataInizio
      risultato.dataFine = conversione.dataFine
    }
    // Se ha la vecchia struttura
    else if (evento.dataInizio && evento.dataFine) {
      risultato.dataInizio = evento.dataInizio
      risultato.dataFine = evento.dataFine

      // Genera anche i campi nuovi
      const conversione = this.convertiVecchiaANuovaStruttura(evento)
      risultato.date = conversione.date
      risultato.timeStart = conversione.timeStart
      risultato.timeEnd = conversione.timeEnd
    }

    return risultato
  }
}


/**
 * DTO per la creazione di un evento (AGGIORNATO - Nuova struttura backend)
 * Corrisponde a CreateEventoDto del backend con campi separati data/orario
 */
export class CreateEventoDto {
  constructor(data = {}) {
    this.titolo = data.titolo || ''
    this.stanza = data.stanza || ''
    // ⭐ NUOVA STRUTTURA - Data e orari separati
    this.date = data.date || null           // Data dell'evento (YYYY-MM-DD)
    this.timeStart = data.timeStart || null // Orario inizio (HH:MM)
    this.timeEnd = data.timeEnd || null     // Orario fine (HH:MM)
    this.prezzo = data.prezzo || null
    this.pazienteID = data.pazienteID || null
    this.specialistaID = data.specialistaID || null
  }
}

// ⭐ NUOVO - DTO per la creazione della ricorrenza (corrisponde a CreateRicorrenzaDTO del backend)
export class CreateRicorrenzaDto {
  constructor(data = {}) {
    this.tipo = data.tipo || null // TipoRicorrenza (GIORNALIERA, SETTIMANALE, MENSILE)
    this.dataFineRicorrenza = data.dataFineRicorrenza || null // Data fine ripetizione
  }
}

// ⭐ NUOVO - DTO per la creazione di eventi con ricorrenza (AGGIORNATO - Nuova struttura)
export class CreateEventoWithRicorrenzaDto extends CreateEventoDto {
  constructor(data = {}) {
    super(data)
    this.ricorrenza = data.ricorrenza ? new CreateRicorrenzaDto(data.ricorrenza) : null
  }
}

// ⭐ NUOVO - DTO per l'aggiornamento di eventi ricorrenti (AGGIORNATO - Nuova struttura)
export class UpdateEventoWithRicorrenzaDto extends CreateEventoDto {
  constructor(data = {}) {
    super(data)
    this.id = data.id || null // ID dell'evento da modificare
    this.direction = data.direction || Direction.ALL // Direzione della modifica (DEFAULT: ALL)
  }
}

// ⭐ NUOVO - DTO per la cancellazione di eventi ricorrenti (corrisponde a CancellaEventiRicorrentiDTO del backend)
export class CancellaEventiRicorrentiDto {
  constructor(data = {}) {
    this.direction = data.direction || Direction.ALL // Direzione della cancellazione (DEFAULT: ALL)
  }
}

/**
 * Interfaccia per il mapping tra frontend e backend
 * Definisce come convertire i dati tra le due strutture
 */
export class EventoMapper {
  /**
   * Converte un evento dal formato frontend al formato backend (AGGIORNATO - Nuova struttura)
   * @param {Object} eventoFrontend - Evento nel formato frontend attuale
   * @returns {CreateEventoDto} - Evento nel formato backend allineato a NestJS
   */
  static frontendToBackend(eventoFrontend) {
    return new CreateEventoDto({
      titolo: eventoFrontend.titolo.toUpperCase(),
      stanza: eventoFrontend.stanza.toUpperCase(),
      // ⭐ NUOVA STRUTTURA - Data e orari separati
      date: eventoFrontend.date,           // Data separata (YYYY-MM-DD)
      timeStart: eventoFrontend.timeStart, // Orario inizio (HH:MM)
      timeEnd: eventoFrontend.timeEnd,     // Orario fine (HH:MM)
      prezzo: eventoFrontend.prezzo ?? null,
      pazienteID: eventoFrontend.pazienteID ?? null,
      specialistaID: eventoFrontend.specialistaID ?? null,
    })
  }

  /**
   * Converte un evento dal formato backend al formato frontend (AGGIORNATO - Nuova struttura)
   * @param {EventoBackend} eventoBackend - Evento nel formato backend
   * @returns {Object} - Evento nel formato frontend
   */
  static backendToFrontend(eventoBackend) {
    // ⭐ UTILITY - Combina data e orario per creare dataInizio e dataFine per compatibilità frontend
    const combineDateTime = (date, time) => {
      if (!date || !time) return null
      try {
        // ⭐ FIX - Gestisce sia formato HH:MM che HH:MM:SS
        let timeFormatted = time

        // Se il time include i secondi (HH:MM:SS), rimuovili
        if (time.includes(':') && time.split(':').length === 3) {
          timeFormatted = time.substring(0, 5) // Prende solo HH:MM
        }

        // Crea la data combinata in formato ISO per il frontend
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]

        console.log('🐛 [Debug] combineDateTime:', {
          originalDate: date,
          originalTime: time,
          formattedTime: timeFormatted,
          dateStr: dateStr
        })

        return new Date(`${dateStr}T${timeFormatted}:00`).toISOString()
      } catch (error) {
        console.warn('❌ [EventoMapper] Errore nella combinazione data/orario:', { date, time, error })
        return null
      }
    }

    return {
      id: eventoBackend.id?.toString(),
      titolo: eventoBackend.titolo,
      stanza: eventoBackend.stanza,
      // ⭐ NUOVA STRUTTURA - Mantieni i campi separati E quelli combinati per compatibilità
      date: eventoBackend.date,           // Data separata dal backend
      timeStart: eventoBackend.timeStart, // Orario inizio dal backend
      timeEnd: eventoBackend.timeEnd,     // Orario fine dal backend
      // ⭐ COMPATIBILITÀ - Mantieni anche i campi combinati per il frontend esistente
      dataInizio: combineDateTime(eventoBackend.date, eventoBackend.timeStart),
      dataFine: combineDateTime(eventoBackend.date, eventoBackend.timeEnd),
      prezzo: eventoBackend.prezzo !== null ? eventoBackend.prezzo : null,
      master: eventoBackend.master,
      specialista: eventoBackend.specialista ? {
        id: eventoBackend.specialista.id,
        nome: eventoBackend.specialista.nome,
        cognome: eventoBackend.specialista.cognome,
        nomeCompleto: `${eventoBackend.specialista.nome} ${eventoBackend.specialista.cognome}`.trim(),
        prestazione: eventoBackend.specialista.prestazione
      } : null,
      paziente: eventoBackend.paziente ? {
        id: eventoBackend.paziente.id?.toString(),
        nome: eventoBackend.paziente.nome,
        cognome: eventoBackend.paziente.cognome,
        nomeCompleto: `${eventoBackend.paziente.nome} ${eventoBackend.paziente.cognome}`.trim()
      } : null,
      createdAt: eventoBackend.createdAt,
      colore: eventoBackend.specialista?.prestazione?.color || '#6c757d',
      isPartOfSeries: eventoBackend.master !== null
    }
  }

  /**
   * Converte uno slot dal formato backend al formato frontend
   * @param {SlotBackend} slotBackend - Slot nel formato backend
   * @returns {Object} - Slot nel formato frontend
   */
  static slotBackendToFrontend(slotBackend) {
    return {
      id: slotBackend.id?.toString(),
      dataInizio: slotBackend.dataInizio,
      dataFine: slotBackend.dataFine,
      evento: slotBackend.evento ? this.backendToFrontend(slotBackend.evento) : null,
      paziente: slotBackend.paziente ? {
        id: slotBackend.paziente.id?.toString(),
        nome: slotBackend.paziente.nome,
        cognome: slotBackend.paziente.cognome,
        nomeCompleto: `${slotBackend.paziente.nome} ${slotBackend.paziente.cognome}`
      } : null
    }
  }

  // ⭐ NUOVO - Mapper per eventi con ricorrenza (AGGIORNATO - Nuova struttura)
  /**
   * Converte dati frontend con ricorrenza al formato backend con nuova struttura
   * @param {Object} eventoFrontend - Evento con dati ricorrenza dal frontend (date, timeStart, timeEnd)
   * @returns {CreateEventoWithRicorrenzaDto} - DTO per backend con ricorrenza
   */
  static frontendToBackendWithRicorrenza(eventoFrontend) {
    const eventoBase = this.frontendToBackend(eventoFrontend)

    return new CreateEventoWithRicorrenzaDto({
      ...eventoBase,
      ricorrenza: eventoFrontend.ricorrenza ? {
        // ⭐ MAPPATURA: Converte tipo ricorrenza dal formato frontend (italiano) al backend (inglese)
        tipo: MAPPING_RICORRENZA_FRONTEND_TO_BACKEND[eventoFrontend.ricorrenza.tipo] || eventoFrontend.ricorrenza.tipo,
        dataFineRicorrenza: eventoFrontend.ricorrenza.dataFineRicorrenza
      } : null
    })
  }

  /**
   * Converte dati frontend per aggiornamento eventi ricorrenti al formato backend (AGGIORNATO - Nuova struttura)
   * @param {Object} eventoFrontend - Evento con direction per aggiornamento (date, timeStart, timeEnd)
   * @returns {UpdateEventoWithRicorrenzaDto} - DTO per aggiornamento backend
   */
  static frontendToBackendUpdateRicorrenza(eventoFrontend) {
    const eventoBase = this.frontendToBackend(eventoFrontend)

    return new UpdateEventoWithRicorrenzaDto({
      ...eventoBase,
      id: eventoFrontend.id,
      direction: eventoFrontend.direction || Direction.ALL // ⭐ CORRETTO - Default ALL invece di THIS
    })
  }



  /**
   * Converte dati frontend per cancellazione eventi ricorrenti al formato backend
   * @param {string} direction - Direzione della cancellazione (THIS o THIS_AND_FOLLOWING)
   * @returns {CancellaEventiRicorrentiDto} - DTO per cancellazione backend
   */
  static frontendToBackendDeleteRicorrenza(direction) {
    return new CancellaEventiRicorrentiDto({
      direction: direction || Direction.ALL // ⭐ CORRETTO - Default ALL invece di THIS
    })
  }


}

/**
 * Utility per validare i dati secondo le regole backend NestJS
 */
export class EventoValidator {
  static validateCreateEvento(data) {
    const errors = {}

    // Validazioni allineate ai DTO del backend NestJS con nuova struttura
    if (!data.titolo || data.titolo.length > 50) {
      errors.titolo = 'Titolo obbligatorio (max 50 caratteri)'
    }

    if (!data.stanza || data.stanza.length > 50) {
      errors.stanza = 'Stanza obbligatoria (max 50 caratteri)'
    }

    // ⭐ NUOVE VALIDAZIONI - Data e orari separati
    if (!data.date) {
      errors.date = 'Data evento obbligatoria'
    }

    if (!data.timeStart) {
      errors.timeStart = 'Orario inizio obbligatorio'
    } else {
      // Validazione formato orario HH:MM
      const timeStartRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeStartRegex.test(data.timeStart)) {
        errors.timeStart = 'Formato orario inizio non valido. Utilizzare HH:MM (es: 09:30)'
      }
    }

    if (!data.timeEnd) {
      errors.timeEnd = 'Orario fine obbligatorio'
    } else {
      // Validazione formato orario HH:MM
      const timeEndRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeEndRegex.test(data.timeEnd)) {
        errors.timeEnd = 'Formato orario fine non valido. Utilizzare HH:MM (es: 10:30)'
      }
    }

    // ⭐ VALIDAZIONE LOGICA - Orario fine deve essere dopo orario inizio
    if (data.timeStart && data.timeEnd) {
      const [startHour, startMin] = data.timeStart.split(':').map(Number)
      const [endHour, endMin] = data.timeEnd.split(':').map(Number)

      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin

      if (endMinutes <= startMinutes) {
        errors.timeEnd = 'Orario fine deve essere successivo all\'orario inizio'
      }
    }

    // Validazione campo prezzo (opzionale, ma se presente deve essere un numero positivo)
    if (data.prezzo !== null && data.prezzo !== undefined && data.prezzo !== '') {
      // Gestione sia virgola che punto come separatore decimale
      const prezzoString = data.prezzo?.toString().replace(',', '.') ?? ''
      const prezzoNum = parseFloat(prezzoString)
      if (isNaN(prezzoNum) || prezzoNum < 0) {
        errors.prezzo = 'Il prezzo deve essere un numero positivo'
      }
    }

    // pazienteID e specialistaID sono opzionali (entrambi number)
    if (data.pazienteID && isNaN(Number(data.pazienteID))) {
      errors.pazienteID = 'ID paziente deve essere un numero valido'
    }

    if (data.specialistaID && isNaN(Number(data.specialistaID))) {
      errors.specialistaID = 'ID specialista deve essere un numero valido'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  // ⭐ NUOVO - Validazione per eventi con ricorrenza
  static validateCreateEventoWithRicorrenza(data) {
    // Prima valida l'evento base
    const baseValidation = this.validateCreateEvento(data)
    const errors = { ...baseValidation.errors }

    // Se è presente la ricorrenza, validala
    if (data.ricorrenza) {
      const ricorrenzaErrors = this.validateRicorrenza(data.ricorrenza)
      Object.assign(errors, ricorrenzaErrors)
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  // ⭐ NUOVO - Validazione specifica per la ricorrenza
  static validateRicorrenza(ricorrenza) {
    const errors = {}

    // Tipo ricorrenza obbligatorio - accetta sia valori frontend che backend
    if (!ricorrenza.tipo || !RicorrenzaUtils.isValidTipoRicorrenza(ricorrenza.tipo)) {
      errors.tipoRicorrenza = 'Tipo ricorrenza obbligatorio e valido'
    }

    // Data fine ricorrenza obbligatoria
    if (!ricorrenza.dataFineRicorrenza) {
      errors.dataFineRicorrenza = 'Data fine ricorrenza obbligatoria'
    } else {
      // Usa il parsing italiano per la data da validare
      const dataFine = RicorrenzaUtils.parseDataItaliana(ricorrenza.dataFineRicorrenza)
      const oggi = new Date()
      // Usa le date dirette senza doppio parsing
      const fineAnno = RicorrenzaUtils.getDataMassimaFineRicorrenza()

      // La data fine deve essere nel futuro
      if (dataFine <= oggi) {
        errors.dataFineRicorrenza = 'La data fine ricorrenza deve essere nel futuro'
      }

      // La data fine deve essere massimo entro la fine dell'anno corrente (come richiesto)
      if (dataFine > fineAnno) {
        errors.dataFineRicorrenza = `La data fine ricorrenza non può superare il ${fineAnno.toLocaleDateString('it-IT')}`
      }
    }

    return errors
  }

  // ⭐ NUOVO - Validazione per aggiornamento eventi ricorrenti
  static validateUpdateEventoWithRicorrenza(data) {
    // Prima valida l'evento base
    const baseValidation = this.validateCreateEvento(data)
    const errors = { ...baseValidation.errors }

    // ID obbligatorio per update
    if (!data.id) {
      errors.id = 'ID evento obbligatorio per aggiornamento'
    }

    // Direction obbligatoria
    if (!data.direction || !Object.values(Direction).includes(data.direction)) {
      errors.direction = 'Direzione aggiornamento obbligatoria e valida'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  // ⭐ NUOVO - Validazione per cancellazione eventi ricorrenti
  static validateDeleteEventiRicorrenti(data) {
    const errors = {}

    // Direction obbligatoria
    if (!data.direction || !Object.values(Direction).includes(data.direction)) {
      errors.direction = 'Direzione cancellazione obbligatoria e valida'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }





  static validateCreateSlot(data) {
    const errors = {}

    if (!data.dataInizio) {
      errors.dataInizio = 'Data inizio obbligatoria'
    }

    if (!data.dataFine) {
      errors.dataFine = 'Data fine obbligatoria'
    }

    if (!data.eventoId || data.eventoId < 1) {
      errors.eventoId = 'ID evento obbligatorio'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
}
