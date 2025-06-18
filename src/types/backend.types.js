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

/**
 * Interfaccia per l'entità Evento (backend)
 * Corrisponde a evento.entity.ts e evento.dto.ts
 */
export class EventoBackend {
  constructor(data = {}) {
    this.id = data.id || null
    this.titolo = data.titolo || ''
    this.stanza = data.stanza || ''
    this.dataInizio = data.dataInizio || null
    this.dataFine = data.dataFine || null
    this.prezzo = data.prezzo || null // Campo prezzo aggiunto
    this.createdAt = data.createdAt || null
    this.paziente = data.paziente || null
    this.specialista = data.specialista || null
  }
}


/**
 * DTO per la creazione di un evento
 * Corrisponde a CreateEventoDto del backend
 */
export class CreateEventoDto {
  constructor(data = {}) {
    this.titolo = data.titolo || ''
    this.stanza = data.stanza || ''
    this.professionista = data.professionista || ''
    this.dataInizio = data.dataInizio || null
    this.dataFine = data.dataFine || null
    this.prezzo = data.prezzo || null // Campo prezzo aggiunto
    this.pazienteID = data.pazienteID || null
    this.specialistaID = data.specialistaID || null
  }
}

/**
 * Interfaccia per il mapping tra frontend e backend
 * Definisce come convertire i dati tra le due strutture
 */
export class EventoMapper {
  /**
   * Converte un evento dal formato frontend al formato backend
   * @param {Object} eventoFrontend - Evento nel formato frontend attuale
   * @returns {CreateEventoDto} - Evento nel formato backend allineato a NestJS
   */
  static frontendToBackend(eventoFrontend) {
    return new CreateEventoDto({
      titolo: eventoFrontend.titolo.toUpperCase(),
      stanza: eventoFrontend.stanza.toUpperCase(),
      dataInizio: eventoFrontend.dataInizio,
      dataFine: eventoFrontend.dataFine,
      // Il prezzo rimane in formato decimale come ricevuto (es: 25.50)
      prezzo: eventoFrontend.prezzo ?? null,
      pazienteID: eventoFrontend.pazienteID ?? null,
      specialistaID: eventoFrontend.specialistaID ?? null,
    })
  }

  /**
   * Converte un evento dal formato backend al formato frontend
   * @param {EventoBackend} eventoBackend - Evento nel formato backend
   * @returns {Object} - Evento nel formato frontend
   */
  static backendToFrontend(eventoBackend) {
    return {
      id: eventoBackend.id?.toString(),
      titolo: eventoBackend.titolo,
      stanza: eventoBackend.stanza,
      // Il prezzo arriva già in formato decimale dal backend (es: "20.80")
      prezzo: eventoBackend.prezzo !== null ? eventoBackend.prezzo : null,
      specialista: eventoBackend.specialista ? {
        id: eventoBackend.specialista.id,
        nome: eventoBackend.specialista.nome,
        cognome: eventoBackend.specialista.cognome,
        nomeCompleto: `${eventoBackend.specialista.nome} ${eventoBackend.specialista.cognome}`.trim(),
        // Includiamo la prestazione con il colore per la colorazione dinamica
        prestazione: eventoBackend.specialista.prestazione
      } : null,
      // Paziente direttamente dalla relazione dell'evento
      paziente: eventoBackend.paziente ? {
        id: eventoBackend.paziente.id?.toString(),
        nome: eventoBackend.paziente.nome,
        cognome: eventoBackend.paziente.cognome,
        nomeCompleto: `${eventoBackend.paziente.nome} ${eventoBackend.paziente.cognome}`.trim()
      } : null,
      dataInizio: eventoBackend.dataInizio,
      dataFine: eventoBackend.dataFine,
      createdAt: eventoBackend.createdAt,
      // Aggiungiamo il colore direttamente dall'evento per facilità d'uso
      colore: eventoBackend.specialista?.prestazione?.color || '#6c757d' // Grigio di default per eventi senza prestazione
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
}

/**
 * Utility per validare i dati secondo le regole backend NestJS
 */
export class EventoValidator {
  static validateCreateEvento(data) {
    const errors = {}

    // Validazioni allineate ai DTO del backend NestJS
    if (!data.titolo || data.titolo.length > 50) {
      errors.titolo = 'Titolo obbligatorio (max 50 caratteri)'
    }

    if (!data.stanza || data.stanza.length > 50) {
      errors.stanza = 'Stanza obbligatoria (max 50 caratteri)'
    }

    if (!data.dataInizio) {
      errors.dataInizio = 'Data inizio obbligatoria'
    }

    if (!data.dataFine) {
      errors.dataFine = 'Data fine obbligatoria'
    }

    if (data.dataInizio && data.dataFine && new Date(data.dataInizio) >= new Date(data.dataFine)) {
      errors.dataFine = 'Data fine deve essere successiva a data inizio'
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
