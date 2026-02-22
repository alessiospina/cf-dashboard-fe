# CF Dashboard — Frontend

Dashboard di gestione per **Centro Felicemente**, costruita con Vue 3 + CoreUI 5.

---

## Stack tecnico

| Categoria | Tecnologia |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| UI Kit | CoreUI Vue 5 |
| State management | Pinia |
| Routing | Vue Router 4 |
| HTTP client | Axios (`withCredentials: true`) |
| Build tool | Vite 6 |
| Stili | SCSS + CoreUI design tokens |
| Icone | @coreui/icons + Font Awesome |

---

## Prerequisiti

- Node.js ≥ 18
- Backend `cf-dashboard-be` in esecuzione

---

## Installazione e avvio

```bash
# 1. Installa le dipendenze
npm install

# 2. Copia il file di configurazione e adattalo
cp .env.example .env

# 3. Avvia il server di sviluppo
npm run dev
```

Il dev server si avvia su **http://localhost:3000**.

---

## Variabili d'ambiente (`.env`)

```env
VITE_API_PROTOCOL=http
VITE_API_HOST=localhost
VITE_API_PORT=8000
```

L'URL delle API viene composto come `PROTOCOL://HOST:PORT/api`.

---

## Autenticazione

Il sistema usa **JWT in cookie httpOnly** (nessun token nel `localStorage`).

| Flusso | Descrizione |
|---|---|
| Login | `POST /api/auth/login` → il BE imposta il cookie `access_token` |
| Verifica sessione | `GET /api/auth/me` — chiamato all'avvio dell'app dal navigation guard |
| Logout | `POST /api/auth/logout` → il BE cancella il cookie |
| Protezione rotte | `router.beforeEach` verifica `authStore.isAuthenticated` |
| Rotte pubbliche | Marcate con `meta: { public: true }` (es. `/login`) |
| Scadenza token | Interceptor Axios redirige a `/login` in caso di risposta `401` |

Per accedere alla dashboard serve un account creato dal backend (vedi `ADMIN_USERNAME` e `ADMIN_PASSWORD` nel `.env` del BE).

---

## Struttura del progetto

```
src/
├── assets/
│   ├── brand/          # Loghi Centro Felicemente (light/dark mode)
│   ├── icons/          # Registro icone CoreUI
│   └── images/
├── components/         # Componenti condivisi (AppHeader, Sidebar, ecc.)
├── config/
│   └── api.js          # URL base API da variabili d'ambiente
├── composables/        # Hook Vue riutilizzabili (useAdminMessages, ecc.)
├── layouts/
│   └── DefaultLayout.vue  # Layout con sidebar per le pagine autenticate
├── router/
│   └── index.js        # Rotte + navigation guard autenticazione
├── services/
│   ├── httpClient.js       # Istanza Axios centralizzata (withCredentials)
│   ├── authService.js      # Login / logout / me
│   ├── pazienteService.js
│   ├── specialistaService.js
│   ├── prestazioneService.js
│   ├── calendarioService.js
│   ├── attivitaService.js
│   ├── geoService.js
│   ├── emailService.js
│   └── adminMessageService.js
├── stores/
│   ├── modules/
│   │   ├── authStore.js        # Stato utente autenticato
│   │   ├── pazientiStore.js
│   │   └── adminMessageStore.js
│   ├── sidebar.js
│   └── theme.js
├── types/
│   └── backend.types.js    # DTO, mapper, validator
└── views/
    ├── pages/
    │   └── Login.vue       # Pagina di login (pubblica)
    ├── statistics/         # Dashboard principale
    ├── pazienti/           # Gestione pazienti
    ├── calendario/         # Calendario appuntamenti
    ├── gestione-team/      # Specialisti e prestazioni
    ├── attivita/           # Attività del centro
    ├── email/              # Invio email reminder
    └── admin-messages/     # Segnalazioni / feedback (RBAC: solo admin)
```

---

## Rotte principali

| Rotta | Vista | Protezione |
|---|---|---|
| `/login` | `Login.vue` | Pubblica |
| `/dashboard` | `StatisticsPage.vue` | Autenticata |
| `/pazienti` | `PazientiPage.vue` | Autenticata |
| `/pazienti/import` | `PazientiImportPage.vue` | Autenticata |
| `/calendario` | `CalendarioView.vue` | Autenticata |
| `/gestione-team` | `GestioneTeamPage.vue` | Autenticata |
| `/attivita` | `AttivitaPage.vue` | Autenticata |
| `/email` | `EmailPage.vue` | Autenticata |
| `/admin-messages` | `AdminMessagesPage.vue` | Autenticata |

---

## Aggiungere un nuovo servizio API

1. Crea `src/services/nomeService.js`
2. Importa `httpClient` (non creare una nuova istanza Axios):

```js
import httpClient from './httpClient'

export class NomeService {
  static async getAll() {
    const response = await httpClient.get('/nome-endpoint')
    return response.data?.data ?? []
  }
}
```

Il `httpClient` invia automaticamente il cookie JWT e gestisce i redirect `401`.

---

## Script disponibili

```bash
npm run dev      # Server di sviluppo (porta 3000)
npm run build    # Build di produzione in /dist
npm run preview  # Preview della build di produzione
npm run lint     # Linting ESLint
```

---

## Build di produzione

```bash
npm run build
```

I file vengono generati nella cartella `dist/`. Essendo un'SPA con Vue Router in history mode, il server web deve servire `index.html` per tutti i path.

Esempio configurazione **Nginx**:

```nginx
location / {
  root /var/www/cf-dashboard-fe/dist;
  try_files $uri $uri/ /index.html;
}
```
