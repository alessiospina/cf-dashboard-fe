/**
 * Tipi TypeScript che riflettono le entità backend
 * Questi tipi sono allineati con le entità NestJS del backend
 */

// Enum per la frequenza degli eventi (dal backend)
export const FrequenzaEvento = {
  GIORNALIERA: 'GIORNALIERA',
  SETTIMANALE: 'SETTIMANALE',
  MENSILE: 'MENSILE',
  UNICA: 'UNICA'
}

// Opzioni per la select della frequenza
export const FREQUENZA_EVENTO_OPTIONS = [
  { value: FrequenzaEvento.UNICA, label: 'Evento Unico' },
  { value: FrequenzaEvento.GIORNALIERA, label: 'Ripetizione Giornaliera' },
  { value: FrequenzaEvento.SETTIMANALE, label: 'Ripetizione Settimanale' },
  { value: FrequenzaEvento.MENSILE, label: 'Ripetizione Mensile' }
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
    this.professionista = data.professionista || ''
    this.dataInizio = data.dataInizio || null
    this.dataFine = data.dataFine || null
    this.postiDisponibili = data.postiDisponibili || 1
    this.frequenza = data.frequenza || FrequenzaEvento.UNICA
    this.dataFineRipetizione = data.dataFineRipetizione || null
    this.eventoNextId = data.eventoNextId || null
    this.createdAt = data.createdAt || null
    this.slots = data.slots || []
  }
}

/**
 * Interfaccia per l'entità Slot (backend)
 * Corrisponde a slot.entity.ts e slot.dto.ts
 */
export class SlotBackend {
  constructor(data = {}) {
    this.id = data.id || null
    this.dataInizio = data.dataInizio || null
    this.dataFine = data.dataFine || null
    this.evento = data.evento || null
    this.paziente = data.paziente || null
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
    // Campi rimossi: postiDisponibili, frequenza, dataFineRipetizione, eventoNextId
    // Campo aggiunto per associare direttamente un paziente
    this.pazienteId = data.pazienteId || null
  }
}

/**
 * DTO per la creazione di uno slot
 * Corrisponde a CreateSlotDto
 */
export class CreateSlotDto {
  constructor(data = {}) {
    this.dataInizio = data.dataInizio || ''
    this.dataFine = data.dataFine || ''
    this.eventoId = data.eventoId || null
    this.pazienteId = data.pazienteId || null
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
      titolo: eventoFrontend.titolo || `EVENTO ${eventoFrontend.specialista?.prestazione?.tipologia?.replace('_', ' ') || ''}`,
      stanza: eventoFrontend.sala || eventoFrontend.stanza || '',
      professionista: eventoFrontend.specialista?.nomeCompleto ||
                     `${eventoFrontend.specialista?.nome || ''} ${eventoFrontend.specialista?.cognome || ''}`.trim() ||
                     eventoFrontend.professionista || '',
      dataInizio: eventoFrontend.dataInizio,
      dataFine: eventoFrontend.dataFine,
      // Supporto per l'associazione diretta del paziente
      pazienteId: eventoFrontend.pazienteId || eventoFrontend.paziente?.id || null
    })
  }

  /**
   * Converte un evento dal formato backend al formato frontend
   * @param {EventoBackend} eventoBackend - Evento nel formato backend
   * @returns {Object} - Evento nel formato frontend
   */
  static backendToFrontend(eventoBackend) {
    const nomeCompleto = eventoBackend.professionista || ''
    const [nome = '', ...cognomeParts] = nomeCompleto.split(' ')
    const cognome = cognomeParts.join(' ')

    return {
      id: eventoBackend.id?.toString(),
      titolo: eventoBackend.titolo,
      specialista: {
        id: `specialista-${eventoBackend.id}`,
        nome: nome,
        cognome: cognome,
        nomeCompleto: nomeCompleto,
        specializzazione: eventoBackend.specialista?.prestazione?.tipologia || 'LOGOPEDIA' // Ottiene il tipo dalla prestazione dello specialista
      },
      // Paziente direttamente dalla relazione dell'evento o dai slot
      paziente: eventoBackend.paziente ? {
        id: eventoBackend.paziente.id?.toString(),
        nome: eventoBackend.paziente.nome,
        cognome: eventoBackend.paziente.cognome,
        nomeCompleto: `${eventoBackend.paziente.nome} ${eventoBackend.paziente.cognome}`
      } : (eventoBackend.slots?.[0]?.paziente ? {
        id: eventoBackend.slots[0].paziente.id?.toString(),
        nome: eventoBackend.slots[0].paziente.nome,
        cognome: eventoBackend.slots[0].paziente.cognome,
        nomeCompleto: `${eventoBackend.slots[0].paziente.nome} ${eventoBackend.slots[0].paziente.cognome}`
      } : null),
      dataInizio: eventoBackend.dataInizio,
      dataFine: eventoBackend.dataFine,
      // Il tipo terapia ora viene determinato dalla prestazione dello specialista
      // Non è più un campo diretto del paziente
      stato: 'confermato', // Default
      note: '',
      sala: eventoBackend.stanza,
      colore: '#0d6efd', // Default

      // Nuovi campi dal backend
      postiDisponibili: eventoBackend.postiDisponibili,
      frequenza: eventoBackend.frequenza,
      dataFineRipetizione: eventoBackend.dataFineRipetizione,
      eventoNextId: eventoBackend.eventoNextId,
      createdAt: eventoBackend.createdAt,
      slots: eventoBackend.slots || []
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

    if (!data.professionista || data.professionista.length > 50) {
      errors.professionista = 'Professionista obbligatorio (max 50 caratteri)'
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

    // pazienteId è opzionale
    if (data.pazienteId && isNaN(Number(data.pazienteId))) {
      errors.pazienteId = 'ID paziente deve essere un numero valido'
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
