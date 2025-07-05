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
        // Nuova dashboard principale - ex pagina Performance
        // Contiene metriche, grafici e statistiche del centro
        component: () =>
          import(
            /* webpackChunkName: "dashboard" */ '@/views/dashboard/PerformancePage.vue'
          ),
      },
      {
        path: '/pazienti',
        name: 'Pazienti',
        // Pagina di gestione pazienti con lazy loading
        component: () =>
          import(
            /* webpackChunkName: "pazienti" */ '@/views/pazienti/PazientiPage.vue'
          ),
      },
      {
        path: '/calendario',
        name: 'Calendario',
        // Pagina di gestione calendario con lazy loading
        component: () =>
          import(
            /* webpackChunkName: "calendario" */ '@/views/calendario/CalendarioView.vue'
          ),
      },
      {
        path: '/gestione-team',
        name: 'GestioneTeam',
        // Pagina di gestione team (prestazioni e specialisti) con lazy loading
        component: () =>
          import(
            /* webpackChunkName: "gestione-team" */ '@/views/gestione-team/GestioneTeamPage.vue'
          ),
      },
      {
        path: '/attivita',
        name: 'Attivita',
        // Pagina di gestione attività con lazy loading
        component: () =>
          import(
            /* webpackChunkName: "attivita" */ '@/views/attivita/AttivitaPage.vue'
          ),
      },
      {
        path: '/email',
        name: 'Email',
        // Pagina di gestione notifiche email con lazy loading
        component: () =>
          import(
            /* webpackChunkName: "email" */ '@/views/email/EmailPage.vue'
          ),
      },
    ],
  },
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
      },
      {
        path: '500',
        name: 'Page500',
        component: () => import('@/views/pages/Page500'),
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/pages/Login'),
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/pages/Register'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    // always scroll to top
    return { top: 0 }
  },
})

export default router
