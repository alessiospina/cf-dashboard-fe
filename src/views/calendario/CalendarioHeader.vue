<template>
  <!--
    Header dedicato del Calendario

    Contiene:
    - Titolo e descrizione del calendario
    - Controlli per cambiare vista (Timeline/Lista)
    - Bottone per nuovo appuntamento
    - Tutti i colori sono compatibili con dark mode
  -->
  <div class="calendario-header">
    <CRow class="align-items-center">
      <!-- Titolo e Descrizione -->
      <CCol>
        <div class="header-content">
          <h2 class="calendario-title">
            <CIcon icon="cil-calendar" class="me-2" />
            Calendario Appuntamenti
          </h2>
          <p class="calendario-subtitle">
            Gestisci gli appuntamenti e le terapie del centro medico
          </p>
        </div>
      </CCol>

      <!-- Controlli Vista -->
      <CCol md="auto">
        <div class="header-controls">
          <!-- Toggle Vista Timeline/Lista -->
          <CButtonGroup>
            <CButton
              :color="vistaAttiva === 'timeline' ? 'primary' : undefined"
              :variant="vistaAttiva === 'timeline' ? undefined : 'outline'"
              @click="$emit('cambiaVista', 'timeline')"
              size="sm"
              class="vista-button"
            >
              <CIcon icon="cil-grid" class="me-2" />
              Timeline
            </CButton>
            <CButton
              :color="vistaAttiva === 'lista' ? 'primary' : undefined"
              :variant="vistaAttiva === 'lista' ? undefined : 'outline'"
              @click="$emit('cambiaVista', 'lista')"
              size="sm"
              class="vista-button"
            >
              <CIcon icon="cil-list" class="me-2" />
              Lista
            </CButton>
          </CButtonGroup>
        </div>
      </CCol>
    </CRow>
  </div>
</template>

<script setup>
/**
 * CalendarioHeader - Header dedicato per la sezione calendario
 *
 * Props:
 * - vistaAttiva: Vista corrente attiva ('timeline' | 'lista')
 *
 * Eventi emessi:
 * - cambiaVista: Quando l'utente cambia vista
 * - nuovoAppuntamento: Quando l'utente clicca su nuovo appuntamento
 */

defineProps({
  vistaAttiva: {
    type: String,
    required: true,
    validator: (value) => ['timeline', 'lista'].includes(value)
  }
})

defineEmits(['cambiaVista'])
</script>

<style scoped>
/**
 * Stili per l'header del calendario
 * Tutti i colori sono compatibili con dark/light mode
 */

.calendario-header {
  padding: 1.5rem 0;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--cui-border-color);
}

/* Contenuto header */
.header-content {
  margin: 0;
}

.calendario-title {
  color: var(--cui-body-color);
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1.75rem;
  display: flex;
  align-items: center;
}

.calendario-subtitle {
  color: var(--cui-text-muted);
  margin-bottom: 0;
  font-size: 1rem;
  line-height: 1.4;
}

/* Controlli header */
.header-controls {
  display: flex;
  align-items: center;
}

/* Bottoni vista - compatibili con dark mode */
.vista-button {
  transition: all 0.2s ease;
  border-color: var(--cui-primary);
  color: var(--cui-primary);
}

.vista-button:not(.btn-primary) {
  background-color: transparent;
  border-color: var(--cui-primary);
  color: var(--cui-primary);
}

.vista-button:not(.btn-primary):hover {
  background-color: var(--cui-primary);
  border-color: var(--cui-primary);
  color: var(--cui-white);
}

.vista-button.btn-primary {
  background-color: var(--cui-primary);
  border-color: var(--cui-primary);
  color: var(--cui-white);
}

/* Responsive design */
@media (max-width: 768px) {
  .calendario-header {
    padding: 1rem 0;
  }

  .calendario-title {
    font-size: 1.5rem;
  }

  .calendario-subtitle {
    font-size: 0.9rem;
  }

  .header-controls {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
    width: 100%;
  }

  .vista-button {
    font-size: 0.875rem;
  }

  .nuovo-appuntamento-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .header-controls .btn-group {
    width: 100%;
  }

  .vista-button {
    flex: 1;
  }
}

/* Fix per icone che potrebbero non essere visibili in dark mode */
.calendario-header .icon {
  color: inherit;
}

/* Assicura che i border dei button group siano visibili in dark mode */
.btn-group .btn {
  border-color: var(--cui-border-color);
}

.btn-group .btn:not(:last-child) {
  border-right-color: var(--cui-border-color);
}

/* Miglioramenti accessibilità per dark mode */
.btn-outline-primary {
  color: var(--cui-primary) !important;
  border-color: var(--cui-primary) !important;
}

.btn-outline-primary:hover {
  color: var(--cui-white) !important;
  background-color: var(--cui-primary) !important;
  border-color: var(--cui-primary) !important;
}
</style>
