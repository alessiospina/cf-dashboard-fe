import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import CoreuiVue from '@coreui/vue'
import CIcon from '@coreui/icons-vue'
import { iconsSet as icons } from '@/assets/icons'

// FontAwesome Configuration
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faAngleLeft,
  faAngleRight,
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faSort,
  faSortUp,
  faSortDown,
  faSearch,
  faPlus,
  faEdit,
  faTrash,
  faCheck,
  faTimes,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'

// Aggiungi le icone che usi alla libreria
library.add(
  faAngleLeft,
  faAngleRight,
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faSort,
  faSortUp,
  faSortDown,
  faSearch,
  faPlus,
  faEdit,
  faTrash,
  faCheck,
  faTimes,
  faExclamationTriangle
)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(CoreuiVue)
app.provide('icons', icons)
app.component('CIcon', CIcon)
app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')
