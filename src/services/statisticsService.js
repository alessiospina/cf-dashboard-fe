/**
 * Servizio per l'elaborazione delle statistiche degli eventi
 * Gestisce il raggruppamento dinamico per prestazioni e calcoli dei totali
 */
export const statisticsService = {
  /**
   * Elabora i dati annuali raggruppando per prestazione
   * @param {Array} events - Array degli eventi dall'API
   * @returns {Array} Array di oggetti con prestazione, conteggio e totale
   */
  processAnnualData(events) {
    if (!events || !Array.isArray(events)) return [];

    // Raggruppiamo per tipologia di prestazione
    const groupedData = events.reduce((acc, event) => {
      // Estrai la tipologia della prestazione
      const prestazione = event.specialista?.prestazione?.tipologia || 'Non specificata';
      const prezzo = parseFloat(event.prezzo) || 0;

      // Se la prestazione non esiste ancora, la inizializziamo
      if (!acc[prestazione]) {
        acc[prestazione] = {
          prestazione,
          count: 0,
          total: 0,
          color: event.specialista?.prestazione?.color || '#6B7280'
        };
      }

      // Incrementiamo conteggio e sommiamo il prezzo
      acc[prestazione].count += 1;
      acc[prestazione].total += prezzo;

      return acc;
    }, {});

    // Convertiamo l'oggetto in array e ordiniamo per totale decrescente
    return Object.values(groupedData).sort((a, b) => b.total - a.total);
  },

  /**
   * Elabora i dati mensili (12 mesi) raggruppando per prestazione
   * @param {Array} events - Array degli eventi dall'API
   * @param {number} year - Anno di riferimento
   * @returns {Array} Array di 12 oggetti (uno per mese) con le prestazioni
   */
  processMonthlyData(events, year) {
    if (!events || !Array.isArray(events)) return [];

    // Inizializziamo la struttura per tutti i 12 mesi
    const monthsData = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      monthName: this.getMonthName(index + 1),
      prestazioni: {},
      totalEvents: 0,
      totalRevenue: 0
    }));

    // Processiamo ogni evento
    events.forEach(event => {
      const eventDate = new Date(event.date);
      const month = eventDate.getMonth(); // 0-based (0 = gennaio)
      const prestazione = event.specialista?.prestazione?.tipologia || 'Non specificata';
      const prezzo = parseFloat(event.prezzo) || 0;
      const color = event.specialista?.prestazione?.color || '#6B7280';

      // Se la prestazione non esiste per questo mese, la inizializziamo
      if (!monthsData[month].prestazioni[prestazione]) {
        monthsData[month].prestazioni[prestazione] = {
          prestazione,
          count: 0,
          total: 0,
          color
        };
      }

      // Aggiorniamo i dati della prestazione per questo mese
      monthsData[month].prestazioni[prestazione].count += 1;
      monthsData[month].prestazioni[prestazione].total += prezzo;

      // Aggiorniamo i totali del mese
      monthsData[month].totalEvents += 1;
      monthsData[month].totalRevenue += prezzo;
    });

    // Convertiamo l'oggetto prestazioni in array per ogni mese
    return monthsData.map(monthData => ({
      ...monthData,
      prestazioni: Object.values(monthData.prestazioni).sort((a, b) => b.total - a.total)
    }));
  },

  /**
   * Utility per calcolare date inizio/fine anno
   * @param {number} year - Anno selezionato
   * @returns {Object} Oggetto con startDate e endDate
   */
  getYearDateRange(year) {
    const startDate = new Date(year, 0, 1); // 1 gennaio
    const endDate = new Date(year, 11, 31); // 31 dicembre
    
    return {
      startDate: startDate.toISOString().split('T')[0], // Format YYYY-MM-DD
      endDate: endDate.toISOString().split('T')[0]
    };
  },

  /**
   * Utility per ottenere il nome del mese
   * @param {number} monthNumber - Numero del mese (1-12)
   * @returns {string} Nome del mese in italiano
   */
  getMonthName(monthNumber) {
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return months[monthNumber - 1];
  },

  /**
   * Calcola statistiche generali annuali
   * @param {Array} events - Array degli eventi dall'API
   * @returns {Object} Oggetto con statistiche generali
   */
  calculateAnnualSummary(events) {
    if (!events || !Array.isArray(events)) {
      return {
        totalEvents: 0,
        totalRevenue: 0,
        totalPrestazioni: 0,
        averageEventValue: 0
      };
    }

    const totalEvents = events.length;
    const totalRevenue = events.reduce((sum, event) => sum + (parseFloat(event.prezzo) || 0), 0);
    const uniquePrestazioni = new Set(
      events.map(event => event.specialista?.prestazione?.tipologia).filter(Boolean)
    );

    return {
      totalEvents,
      totalRevenue,
      totalPrestazioni: uniquePrestazioni.size,
      averageEventValue: totalEvents > 0 ? totalRevenue / totalEvents : 0
    };
  }
};
