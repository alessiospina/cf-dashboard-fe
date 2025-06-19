// Navigazione semplificata - Dashboard e Pazienti
export default [
  {
    component: 'CNavItem',
    name: 'Dashboard',
    to: '/dashboard',
    icon: 'cil-speedometer',
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
  },
  {
    component: 'CNavItem',
    name: 'Calendario',
    to: '/calendario',
    icon: 'cil-calendar',
  },
  {
    component: 'CNavItem',
    name: 'Team',
    to: '/gestione-team',
    icon: 'cil-people',
  },
  {
    component: 'CNavItem',
    name: 'Attività',
    to: '/attivita',
    icon: 'cil-task',
  },
]
