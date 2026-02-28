<template>
  <!-- Componente per la paginazione delle attività -->
  <div class="pagination-container">
    <!-- Informazioni paginazione -->
    <div class="pagination-info">
      <div class="items-info">
        Visualizzati <strong>{{ paginationInfo.start }}-{{ paginationInfo.end }}</strong>
        di <strong>{{ paginationInfo.totalItems }}</strong> attività
      </div>

      <!-- Selezione elementi per pagina -->
      <div class="items-per-page">
        <label for="itemsPerPage" class="form-label">Elementi per pagina:</label>
        <select
          id="itemsPerPage"
          :value="paginationInfo.itemsPerPage"
          @change="$emit('change-items-per-page', parseInt($event.target.value))"
          class="form-select form-select-sm"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </div>

    <!-- Controlli paginazione -->
    <nav aria-label="Paginazione attività" v-if="paginationInfo.totalPages > 1">
      <ul class="pagination pagination-sm justify-content-center mb-0">
        <!-- Pulsante Prima Pagina -->
        <li class="page-item" :class="{ disabled: !paginationInfo.hasPrev }">
          <button
            class="page-link"
            @click="$emit('go-to-page', 1)"
            :disabled="!paginationInfo.hasPrev"
            aria-label="Prima pagina"
          >
            <font-awesome-icon icon="angle-double-left" />
          </button>
        </li>

        <!-- Pulsante Pagina Precedente -->
        <li class="page-item" :class="{ disabled: !paginationInfo.hasPrev }">
          <button
            class="page-link"
            @click="$emit('prev-page')"
            :disabled="!paginationInfo.hasPrev"
            aria-label="Pagina precedente"
          >
            <font-awesome-icon icon="angle-left" />
          </button>
        </li>

        <!-- Pagine numeriche -->
        <li
          v-for="page in visiblePages"
          :key="page"
          class="page-item"
          :class="{ active: page === paginationInfo.currentPage }"
        >
          <button
            class="page-link"
            @click="$emit('go-to-page', page)"
            :aria-label="`Pagina ${page}`"
            :aria-current="page === paginationInfo.currentPage ? 'page' : null"
          >
            {{ page }}
          </button>
        </li>

        <!-- Pulsante Pagina Successiva -->
        <li class="page-item" :class="{ disabled: !paginationInfo.hasNext }">
          <button
            class="page-link"
            @click="$emit('next-page')"
            :disabled="!paginationInfo.hasNext"
            aria-label="Pagina successiva"
          >
            <font-awesome-icon icon="angle-right" />
          </button>
        </li>

        <!-- Pulsante Ultima Pagina -->
        <li class="page-item" :class="{ disabled: !paginationInfo.hasNext }">
          <button
            class="page-link"
            @click="$emit('go-to-page', paginationInfo.totalPages)"
            :disabled="!paginationInfo.hasNext"
            aria-label="Ultima pagina"
          >
            <font-awesome-icon icon="angle-double-right" />
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
/**
 * Componente per la paginazione delle attività
 * Gestisce la navigazione tra le pagine e la selezione del numero di elementi per pagina
 */
export default {
  name: 'AttivitaPagination',

  // Props ricevute dal componente parent
  props: {
    // Informazioni sulla paginazione
    paginationInfo: {
      type: Object,
      required: true,
      default: () => ({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
        start: 0,
        end: 0,
        hasNext: false,
        hasPrev: false
      })
    }
  },

  // Eventi emessi verso il parent
  emits: [
    'go-to-page',
    'next-page',
    'prev-page',
    'change-items-per-page'
  ],

  // Computed properties
  computed: {
    /**
     * Calcola le pagine visibili nel controllo di paginazione
     * Mostra massimo 5 pagine alla volta
     */
    visiblePages() {
      const current = this.paginationInfo.currentPage
      const total = this.paginationInfo.totalPages
      const maxVisible = 5

      if (total <= maxVisible) {
        // Se ci sono poche pagine, mostra tutte
        return Array.from({ length: total }, (_, i) => i + 1)
      }

      let start = Math.max(1, current - 2)
      let end = Math.min(total, start + maxVisible - 1)

      // Aggiusta l'inizio se siamo vicini alla fine
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1)
      }

      return Array.from({ length: end - start + 1 }, (_, i) => start + i)
    }
  }
}
</script>

<style scoped>
/* Stili specifici per il componente paginazione */

.pagination-container {
  /* Container principale della paginazione */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--cui-card-bg);
  border-top: 1px solid var(--cui-border-color);
  color: var(--cui-body-color);
}

.pagination-info {
  /* Container per informazioni e controlli */
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
  gap: 16px;
}

.items-info {
  /* Informazioni sui record visualizzati */
  font-size: 0.9rem;
  color: var(--cui-secondary-color);
}

.items-per-page {
  /* Controllo per elementi per pagina */
  display: flex;
  align-items: center;
  gap: 8px;
}

.items-per-page .form-label {
  /* Label per il controllo */
  margin: 0;
  font-size: 0.9rem;
  color: var(--cui-secondary-color);
  white-space: nowrap;
}

.items-per-page .form-select {
  /* Select per elementi per pagina */
  width: auto;
  min-width: 80px;
}

.pagination {
  /* Controlli di paginazione */
  margin: 0;
}

.page-link {
  /* Stili per i link delle pagine */
  border-radius: 6px;
  margin: 0 2px;
  padding: 8px 12px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.page-link:hover {
  /* Effetto hover sui link */
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-item.active .page-link {
  /* Pagina attiva */
  background-color: #0d6efd;
  border-color: #0d6efd;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(13, 110, 253, 0.3);
}

.page-item.disabled .page-link {
  /* Link disabilitati */
  opacity: 0.5;
  cursor: not-allowed;
}

/* Icone FontAwesome */
.page-link svg {
  /* Icone FontAwesome nelle pagine */
  font-size: 0.8rem;
  width: 1em;
  height: 1em;
}

/* Responsive design per dispositivi mobili */
@media (max-width: 768px) {
  .pagination-container {
    padding: 16px;
    gap: 12px;
  }

  .pagination-info {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .items-per-page {
    justify-content: center;
  }

  .pagination {
    /* Su mobile usa controlli più compatti */
    justify-content: center;
  }

  .page-link {
    padding: 6px 10px;
    font-size: 0.8rem;
  }
}

@media (max-width: 576px) {
  /* Su schermi molto piccoli nascondi alcune pagine numeriche */
  .pagination .page-item:not(.disabled):not(.active):not(:first-child):not(:last-child):not(:nth-child(2)):not(:nth-last-child(2)) {
    display: none;
  }
}
</style>
