<template>
  <div class="login-page">

    <!-- Pannello brand (solo desktop) -->
    <div class="brand-panel d-none d-lg-flex">
      <div class="brand-content">
        <div class="brand-decoration brand-dec-1" />
        <div class="brand-decoration brand-dec-2" />
        <img
          src="@/assets/brand/cf-logo-dark-mode.png"
          alt="Centro Felicemente"
          class="brand-logo"
        />
        <h2 class="brand-name">Centro Felicemente</h2>
        <p class="brand-subtitle">Piattaforma di gestione dashboard</p>
      </div>
    </div>

    <!-- Pannello form -->
    <div class="form-panel">
      <div class="login-card">

        <!-- Logo (solo mobile) -->
        <div class="d-flex d-lg-none justify-content-center mb-4">
          <img
            src="@/assets/brand/cf-logo.png"
            alt="Centro Felicemente"
            class="mobile-logo"
          />
        </div>

        <!-- Intestazione -->
        <div class="card-header-text">
          <h4 class="login-title">Accesso Dashboard</h4>
          <p class="login-subtitle">Inserisci le tue credenziali per accedere</p>
        </div>

        <!-- Alert errore -->
        <Transition name="shake">
          <CAlert
            v-if="error"
            color="danger"
            class="mb-4 d-flex align-items-center gap-2"
          >
            <CIcon icon="cil-warning" class="flex-shrink-0" />
            {{ error }}
          </CAlert>
        </Transition>

        <!-- Form -->
        <form @submit.prevent="onSubmit" novalidate>

          <!-- Username -->
          <div class="mb-3">
            <label class="form-label fw-medium">Username</label>
            <CInputGroup>
              <CInputGroupText class="input-icon">
                <CIcon icon="cil-user" />
              </CInputGroupText>
              <CFormInput
                v-model="form.username"
                ref="usernameRef"
                placeholder="Inserisci username"
                autocomplete="username"
                :disabled="loading"
                :invalid="submitted && !form.username"
                @input="clearError"
              />
            </CInputGroup>
            <div v-if="submitted && !form.username" class="invalid-feedback d-block mt-1">
              Il campo username è obbligatorio.
            </div>
          </div>

          <!-- Password -->
          <div class="mb-4">
            <label class="form-label fw-medium">Password</label>
            <CInputGroup>
              <CInputGroupText class="input-icon">
                <CIcon icon="cil-lock-locked" />
              </CInputGroupText>
              <CFormInput
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Inserisci password"
                autocomplete="current-password"
                :disabled="loading"
                :invalid="submitted && !form.password"
                @input="clearError"
              />
              <CButton
                type="button"
                color="light"
                class="toggle-password"
                :disabled="loading"
                :title="showPassword ? 'Nascondi password' : 'Mostra password'"
                @click="showPassword = !showPassword"
              >
                <CIcon :icon="showPassword ? 'cil-low-vision' : 'cil-lock-unlocked'" />
              </CButton>
            </CInputGroup>
            <div v-if="submitted && !form.password" class="invalid-feedback d-block mt-1">
              Il campo password è obbligatorio.
            </div>
          </div>

          <!-- Bottone accedi -->
          <CButton
            type="submit"
            color="primary"
            class="w-100 login-btn"
            :disabled="loading"
          >
            <CSpinner v-if="loading" size="sm" class="me-2" />
            {{ loading ? 'Accesso in corso...' : 'Accedi' }}
          </CButton>

        </form>
      </div>

      <!-- Footer -->
      <p class="form-footer">
        © {{ currentYear }} Centro Felicemente
      </p>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/authStore'

const router    = useRouter()
const authStore = useAuthStore()

// --- State ---
const form = reactive({ username: '', password: '' })
const showPassword = ref(false)
const submitted    = ref(false)
const loading      = ref(false)
const error        = ref(null)
const usernameRef  = ref(null)
const currentYear  = new Date().getFullYear()

// --- Focus automatico sull'input username al mount ---
onMounted(() => {
  setTimeout(() => usernameRef.value?.$el?.focus(), 100)
})

function clearError() {
  error.value = null
  authStore.clearError()
}

async function onSubmit() {
  submitted.value = true
  if (!form.username || !form.password) return

  loading.value = true
  error.value   = null

  try {
    await authStore.login(form.username, form.password)
    await router.push({ name: 'Dashboard' })
  } catch {
    error.value = authStore.error || 'Credenziali non valide. Riprova.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── Layout principale ── */
.login-page {
  min-height: 100vh;
  display: flex;
  background: var(--cui-body-bg, #f0f4f8);
}

/* ── Pannello brand (sinistra) ── */
.brand-panel {
  width: 42%;
  background: linear-gradient(145deg, #1a2535 0%, #2c3e56 50%, #3c4f6e 100%);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  position: relative;
  overflow: hidden;
}

/* cerchi decorativi di sfondo */
.brand-decoration {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.brand-dec-1 {
  width: 440px;
  height: 440px;
  top: -130px;
  right: -110px;
  background: rgba(255, 255, 255, 0.05);
}
.brand-dec-2 {
  width: 300px;
  height: 300px;
  bottom: -90px;
  left: -90px;
  background: rgba(255, 255, 255, 0.03);
}

.brand-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.brand-logo {
  width: 190px;
  max-width: 100%;
  margin-bottom: 2rem;
  filter: drop-shadow(0 6px 24px rgba(0, 0, 0, 0.35));
}

.brand-name {
  color: #ffffff;
  font-size: 1.65rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.88rem;
  margin: 0;
}

/* ── Pannello form (destra) ── */
.form-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
}

/* ── Card login ── */
.login-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 20px;
  padding: 2.5rem 2.5rem 2rem;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.05),
    0 16px 48px rgba(0, 0, 0, 0.09);
}

/* ── Logo mobile ── */
.mobile-logo {
  width: 140px;
  max-width: 100%;
}

/* ── Intestazione card ── */
.card-header-text {
  margin-bottom: 1.75rem;
}

.login-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--cui-body-color, #212529);
  margin-bottom: 0.3rem;
  letter-spacing: -0.02em;
}

.login-subtitle {
  font-size: 0.85rem;
  color: var(--cui-secondary-color, #6c757d);
  margin: 0;
}

/* ── Icona input ── */
.input-icon {
  background: var(--cui-tertiary-bg, #f8f9fa);
  border-right: none;
  color: var(--cui-secondary-color, #6c757d);
}

/* ── Toggle password ── */
.toggle-password {
  border-left: none;
  border-color: var(--cui-border-color, #dee2e6);
  color: var(--cui-secondary-color, #6c757d);
  padding: 0.375rem 0.75rem;
  background: var(--cui-tertiary-bg, #f8f9fa);
}
.toggle-password:hover {
  color: var(--cui-primary, #0d6efd);
  background: var(--cui-tertiary-bg, #f8f9fa);
}

/* ── Bottone accedi ── */
.login-btn {
  height: 48px;
  font-weight: 600;
  font-size: 0.95rem;
  border-radius: 10px;
  letter-spacing: 0.01em;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.login-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 18px rgba(13, 110, 253, 0.35);
}
.login-btn:not(:disabled):active {
  transform: translateY(0);
}

/* ── Footer ── */
.form-footer {
  margin-top: 2rem;
  font-size: 0.78rem;
  color: var(--cui-secondary-color, #6c757d);
  text-align: center;
}

/* ── Animazione shake errore ── */
.shake-enter-active {
  animation: shake 0.4s ease;
}
.shake-leave-active {
  transition: opacity 0.2s ease;
}
.shake-leave-to {
  opacity: 0;
}

@keyframes shake {
  0%   { transform: translateX(0); }
  20%  { transform: translateX(-7px); }
  40%  { transform: translateX(7px); }
  60%  { transform: translateX(-4px); }
  80%  { transform: translateX(4px); }
  100% { transform: translateX(0); }
}

/* ── Mobile: sfondo bianco, no card shadow ── */
@media (max-width: 991.98px) {
  .login-page {
    background: #ffffff;
  }
  .form-panel {
    padding: 3rem 1.5rem;
  }
  .login-card {
    box-shadow: none;
    border-radius: 0;
    padding: 0;
    max-width: 440px;
  }
}
</style>
