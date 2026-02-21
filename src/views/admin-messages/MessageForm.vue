<template>
  <CForm>
    <!-- Title -->
    <div class="mb-3">
      <CFormLabel>Titolo <span class="text-danger">*</span></CFormLabel>
      <CFormInput
        v-model="form.title"
        placeholder="Inserisci il titolo del report..."
        maxlength="120"
        :invalid="!!errors.title"
      />
      <CFormFeedback invalid>{{ errors.title }}</CFormFeedback>
      <div class="text-medium-emphasis small mt-1 text-end">
        {{ form.title?.length ?? 0 }} / 120
      </div>
    </div>

    <!-- Body -->
    <div class="mb-3">
      <CFormLabel>Descrizione <span class="text-danger">*</span></CFormLabel>
      <CFormTextarea
        v-model="form.body"
        placeholder="Descrivi il problema, il feedback o la segnalazione..."
        rows="4"
        :invalid="!!errors.body"
      />
      <CFormFeedback invalid>{{ errors.body }}</CFormFeedback>
    </div>

    <CRow>
      <!-- Type -->
      <CCol :md="showStatus ? 4 : 6">
        <div class="mb-3">
          <CFormLabel>Tipo <span class="text-danger">*</span></CFormLabel>
          <CFormSelect v-model="form.type">
            <option value="PROBLEM">Problema</option>
            <option value="FEEDBACK">Feedback</option>
            <option value="REPORT">Segnalazione</option>
          </CFormSelect>
        </div>
      </CCol>

      <!-- Priority -->
      <CCol :md="showStatus ? 4 : 6">
        <div class="mb-3">
          <CFormLabel>Priorità</CFormLabel>
          <CFormSelect v-model="form.priority">
            <option value="LOW">Bassa</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
          </CFormSelect>
        </div>
      </CCol>

      <!-- Status (edit only) -->
      <CCol v-if="showStatus" :md="4">
        <div class="mb-3">
          <CFormLabel>Stato</CFormLabel>
          <CFormSelect v-model="form.status">
            <option value="OPEN">Aperto</option>
            <option value="IN_PROGRESS">In lavorazione</option>
            <option value="RESOLVED">Risolto</option>
            <option value="CLOSED">Chiuso</option>
          </CFormSelect>
        </div>
      </CCol>
    </CRow>
  </CForm>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({}),
  },
  showStatus: {
    type: Boolean,
    default: false,
  },
})

// Local form copy — no prop mutation
const form = reactive({
  title: '',
  body: '',
  type: 'PROBLEM',
  priority: 'MEDIUM',
  status: 'OPEN',
})

const errors = reactive({
  title: '',
  body: '',
})

// Sync local form when initialData changes (e.g. when edit modal opens)
watch(
  () => props.initialData,
  (data) => {
    form.title    = data.title    ?? ''
    form.body     = data.body     ?? ''
    form.type     = data.type     ?? 'PROBLEM'
    form.priority = data.priority ?? 'MEDIUM'
    form.status   = data.status   ?? 'OPEN'
    errors.title  = ''
    errors.body   = ''
  },
  { immediate: true },
)

// Clear errors on input
watch(() => form.title, () => { errors.title = '' })
watch(() => form.body,  () => { errors.body  = '' })

function validate() {
  let valid = true
  errors.title = ''
  errors.body  = ''

  if (!form.title?.trim()) {
    errors.title = 'Il titolo è obbligatorio'
    valid = false
  }
  if (!form.body?.trim()) {
    errors.body = 'La descrizione è obbligatoria'
    valid = false
  }

  return valid
}

function getData() {
  return { ...form }
}

defineExpose({ validate, getData })
</script>
