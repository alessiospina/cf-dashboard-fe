import { h, resolveComponent } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import DefaultLayout from '@/layouts/DefaultLayout'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: DefaultLayout,
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () =>
          import(
            /* webpackChunkName: "dashboard" */ '@/views/statistics/StatisticsPage.vue'
          ),
      },
      {
        path: '/pazienti',
        name: 'Pazienti',
        component: () =>
          import(
            /* webpackChunkName: "pazienti" */ '@/views/pazienti/PazientiPage.vue'
          ),
      },
      {
        path: '/pazienti/import',
        name: 'PazientiImport',
        component: () =>
          import(
            /* webpackChunkName: "pazienti-import" */ '@/views/pazienti/PazientiImportPage.vue'
          ),
      },
      {
        path: '/calendario',
        name: 'Calendario',
        component: () =>
          import(
            /* webpackChunkName: "calendario" */ '@/views/calendario/CalendarioView.vue'
          ),
      },
      {
        path: '/gestione-team',
        name: 'GestioneTeam',
        component: () =>
          import(
            /* webpackChunkName: "gestione-team" */ '@/views/gestione-team/GestioneTeamPage.vue'
          ),
      },
      {
        path: '/attivita',
        name: 'Attivita',
        component: () =>
          import(
            /* webpackChunkName: "attivita" */ '@/views/attivita/AttivitaPage.vue'
          ),
      },
      {
        path: '/email',
        name: 'Email',
        component: () =>
          import(
            /* webpackChunkName: "email" */ '@/views/email/EmailPage.vue'
          ),
      },
      {
        path: '/admin-messages',
        name: 'AdminMessages',
        component: () =>
          import(
            /* webpackChunkName: "admin-messages" */ '@/views/admin-messages/AdminMessagesPage.vue'
          ),
      },
    ],
  },

  // ── Pagina di login (pubblica) ──────────────────────────────────────────────
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/pages/Login'),
    meta: { public: true },
  },

  // ── Pagine di errore ────────────────────────────────────────────────────────
  {
    path: '/pages',
    redirect: '/pages/404',
    name: 'Pages',
    component: {
      render() {
        return h(resolveComponent('router-view'))
      },
    },
    children: [
      {
        path: '404',
        name: 'Page404',
        component: () => import('@/views/pages/Page404'),
        meta: { public: true },
      },
      {
        path: '500',
        name: 'Page500',
        component: () => import('@/views/pages/Page500'),
        meta: { public: true },
      },
    ],
  },

  // ── Catch-all → 404 ─────────────────────────────────────────────────────────
  {
    path: '/:pathMatch(.*)*',
    redirect: '/pages/404',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// ── Navigation guard ──────────────────────────────────────────────────────────
router.beforeEach(async (to) => {
  try {
    // Importazione lazy per evitare dipendenze circolari con Pinia
    const { useAuthStore } = await import('@/stores/modules/authStore')
    const authStore = useAuthStore()

    // Prima navigazione: verifica il cookie JWT con GET /auth/me
    if (!authStore.initialized) {
      await authStore.initAuth()
    }

    const isPublic        = to.meta?.public === true
    const isAuthenticated = authStore.isAuthenticated

    // Già autenticato → non mostrare la pagina di login
    if (isPublic && isAuthenticated && to.name === 'Login') {
      return { name: 'Dashboard' }
    }

    // Rotta protetta senza autenticazione → redirect al login
    if (!isPublic && !isAuthenticated) {
      return { name: 'Login' }
    }
  } catch (err) {
    // In caso di errore critico nel guard, permetti sempre le rotte pubbliche
    console.error('[Router Guard] Errore:', err)
    if (to.meta?.public) return true
    return { name: 'Login' }
  }
})

export default router
