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

## Installazione e avvio locale

```bash
# 1. Installa le dipendenze
npm install

# 2. Configura il file di ambiente
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

> ⚠️ Le variabili `VITE_API_*` vengono **baked** nell'immagine Docker al momento della build. Se cambia l'indirizzo del backend, aggiorna i secret su GitHub e rilascia una nuova versione.

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

---

## Struttura del progetto

```
src/
├── assets/
│   ├── brand/          # Loghi Centro Felicemente
│   └── icons/
├── components/         # Componenti condivisi (AppHeader, Sidebar, ecc.)
├── config/
│   └── api.js          # URL base API da variabili d'ambiente
├── composables/        # Hook Vue riutilizzabili
├── layouts/
│   └── DefaultLayout.vue
├── router/
│   └── index.js        # Rotte + navigation guard
├── services/
│   ├── httpClient.js
│   ├── authService.js
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
│   │   ├── authStore.js
│   │   ├── pazientiStore.js
│   │   └── adminMessageStore.js
│   ├── sidebar.js
│   └── theme.js
├── types/
│   └── backend.types.js
└── views/
    ├── pages/Login.vue
    ├── statistics/
    ├── pazienti/
    ├── calendario/
    ├── gestione-team/
    ├── attivita/
    ├── email/
    └── admin-messages/
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

## Script disponibili

```bash
npm run dev      # Server di sviluppo (porta 3000)
npm run build    # Build di produzione in /dist
npm run preview  # Preview della build
npm run lint     # Linting ESLint
```

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

---

## CI/CD e Deploy

Il progetto usa **GitHub Actions** per la build e il push automatico dell'immagine Docker sul registry privato.

Il workflow si attiva alla creazione di un tag `v*`:

```bash
git tag v1.x.x
git push origin main v1.x.x
```

In produzione il frontend gira sulla porta **8080**.

Per i dettagli completi sul deploy del container sul server, consulta:

➡️ **[DEPLOY.md](./DEPLOY.md)**

---

## Changelog

### v0.0.1 — Febbraio 2026
- CI/CD: workflow GitHub Actions con tag versioning
- Deploy: registry privato Docker su `centro.w3ddns.it:6000`
- Porta produzione: 8080

---

**Sviluppato da Team Manovalanza**
