// Navigazione semplificata - Dashboard e Pazienti
export default [
  {
    component: 'CNavItem',
    name: 'Dashboard',
    to: '/dashboard',
    icon: 'cil-speedometer',
    badge: {
      color: 'primary',
      text: 'NEW',
    },
  },
  {
    component: 'CNavTitle',
    name: 'Gestione',
  },
  {
    component: 'CNavItem',
    name: 'Pazienti',
    to: '/pazienti',
    icon: 'cil-people',
    badge: {
      color: 'info',
      text: 'NEW',
    },
  },
  {
    component: 'CNavItem',
    name: 'Calendario',
    to: '/calendario',
    icon: 'cil-calendar',
    badge: {
      color: 'success',
      text: 'NEW',
    },
  },
  {
    component: 'CNavItem',
    name: 'Team',
    to: '/gestione-team',
    icon: 'cil-people',
    badge: {
      color: 'warning',
      text: 'NEW',
    },
  },
]
