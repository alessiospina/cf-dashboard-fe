// Navigazione semplificata - Dashboard principale e sezioni gestionali
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
  {
    component: 'CNavItem',
    name: 'Statistiche',
    to: '/statistics',
    icon: 'cil-chart-pie',
  },
  {
    component: 'CNavTitle',
    name: 'Notification',
  },
  {
    component: 'CNavItem',
    name: 'Email',
    to: '/email',
    icon: 'cil-envelope-closed',
  },
]
