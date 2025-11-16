# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 dashboard application for managing a medical/therapy center ("centro fisiatra"). Built with CoreUI Vue Admin Template, it manages patients, specialists, appointments, and activity tracking.

**Tech Stack:**
- Vue 3 (Composition API) with Vite
- CoreUI Vue components
- Pinia for state management
- Vue Router
- Axios for API calls
- FontAwesome icons

## Common Development Commands

**Development:**
```bash
npm run dev          # Start dev server on port 3000
```

**Build:**
```bash
npm run build        # Build for production (output: dist/)
npm run preview      # Preview production build
```

**Linting:**
```bash
npm run lint         # Run ESLint
```

**Docker:**
```bash
docker build --build-arg VITE_API_PROTOCOL=http --build-arg VITE_API_HOST=salernocruises.it --build-arg VITE_API_PORT=8001 -t cf-dashboard-fe .
docker run -p 8002:8002 cf-dashboard-fe
```

## Architecture

### Project Structure

```
src/
├── components/       # Reusable Vue components (AppHeader, AppSidebar, geo components)
├── composables/      # Vue Composition API composables (business logic layer)
├── services/         # API service layer (axios HTTP calls)
├── views/            # Page-level components organized by feature
├── stores/           # Pinia stores (sidebar, theme, pazienti)
├── router/           # Vue Router configuration
├── config/           # Configuration files (API config from .env)
├── types/            # Type definitions and mappers (backend.types.js)
├── layouts/          # Layout components (DefaultLayout)
└── assets/           # Static assets (icons, styles)
```

### Key Architectural Patterns

**1. Service Layer Pattern**

All backend API calls are centralized in `/src/services/`:
- `pazienteService.js` - Patient CRUD + Excel import
- `calendarioService.js` - Calendar events (with recurring events support)
- `specialistaService.js` - Specialists management
- `prestazioneService.js` - Services/treatments (prestazioni) with color coding
- `attivitaService.js` - Activity tracking and billing
- `geoService.js` - Italian provinces and municipalities data
- `emailService.js` - Email notifications management

Services use a class-based approach with static methods and axios interceptors for logging.

**2. Composables Pattern**

Business logic is extracted into composables in `/src/composables/`:
- `useCalendario.js` - Calendar events, filtering, recurring events logic
- `usePazienti.js` - Patient management with DataTables pagination
- `useSpecialisti.js` - Specialists and prestazioni management
- `useAttivita.js` - Activity tracking and financial calculations
- `useGeo.js` - Geographic data (provinces, municipalities)
- `useDeleteRecurringEvent.js` - Recurring event deletion logic

These composables consume services and provide reactive state + methods to components.

**3. Backend Type System**

`src/types/backend.types.js` contains:
- Type definitions matching backend DTOs
- Mapper classes (e.g., `EventoMapper`) to transform backend ↔ frontend
- Validator classes for data validation
- Enums and constants (FrequenzaEvento, TipoRicorrenza, etc.)
- Utility classes (e.g., `RicorrenzaUtils` for recurring event calculations)

### API Configuration

API connection configured via environment variables:

**.env file:**
```env
VITE_API_PROTOCOL=http
VITE_API_HOST=localhost
VITE_API_PORT=8000
```

**Usage in code:**
```javascript
import { getApiBaseUrl } from '@/config/api'
const API_BASE_URL = getApiBaseUrl() // Returns: http://localhost:8000/api
```

### Main Features

**1. Pazienti (Patients)** - `/views/pazienti/`
- CRUD operations via DataTables with server-side pagination
- Excel import functionality (`PazienteService.importPazientiFromExcel`)
- Fiscal code (codice fiscale) validation and auto-generation
- Geographic data integration (province/municipality autocomplete)

**2. Calendario (Calendar)** - `/views/calendario/`
- Multiple views: Timeline, List, Week grid
- Recurring events support (daily, weekly, biweekly, monthly)
- Event filtering by specialist, room (stanza), date range
- Event states: confermato, in_attesa, completato, cancellato
- Color-coded by prestazione (treatment type)
- Delete modal with "single/series/future" options for recurring events

**3. Gestione Team** - `/views/gestione-team/`
- Manage specialists (specialisti) and their available prestazioni
- Prestazioni with color coding for calendar visualization
- Associate prestazioni to specialists with pricing

**4. Attività (Activities)** - `/views/attivita/`
- Track completed appointments for billing
- Financial calculations and revenue tracking
- Export functionality

**5. Email Notifications** - `/views/email/`
- Manage email notification settings
- Send appointment confirmations/reminders

### Important Data Flow

**Creating an Event:**
1. User selects Paziente + Specialista + Prestazione + time/room
2. Frontend validates via `EventoValidator.validateEventoData()`
3. Data mapped via `EventoMapper.toBackend()`
4. Sent to backend via `EventoService.createEvento()`
5. Response mapped back via `EventoMapper.fromBackend()`

**Recurring Events:**
- Events have `ricorrenza` object with: `tipo` (single/daily/weekly/etc.), `pattern`, `dataFine`
- Calculated using `RicorrenzaUtils.calculateRecurringDates()`
- Deletion offers 3 modes: single occurrence, entire series, or "this and future"

### CoreUI Integration

The app uses CoreUI Vue components registered globally:
- `CIcon` - Icon component (registered globally in main.js)
- Layout components: `CContainer`, `CCard`, `CTable`, etc.
- Form components: `CFormInput`, `CFormSelect`, `CModal`, etc.

Icons come from:
- CoreUI Icons (`@coreui/icons-vue`) - referenced as `cil-*`
- FontAwesome (`font-awesome-icon` component)

### State Management

**Pinia Stores:**
- `stores/sidebar.js` - Sidebar visibility/state
- `stores/theme.js` - Dark/light theme toggle
- `stores/modules/pazientiStore.js` - Patient data cache (if needed)

Most state is local to composables rather than global stores.

### Geographic Data

Italy-specific province/municipality autocomplete components in `components/geo/`:
- Province and municipality data loaded via `geoService.js`
- Autocomplete components: `ProvinceAutocomplete.vue`, `ComuniAutocomplete.vue`
- Used in patient forms for addresses

### Styling

- CoreUI variables (`--cui-*`) for theming
- Dark mode support via `[data-coreui-theme="dark"]` selector
- SCSS with PostCSS + Autoprefixer
- Responsive design with mobile breakpoints

## Key Development Notes

### When Working with Services

- All services use axios with interceptors - check console for detailed request/response logs
- Backend responses typically in format: `{ data: {...} }` - services unwrap this
- Error handling is done in services - they throw errors up to composables/components

### When Working with Calendar

- Events are color-coded by `prestazione.color` (stored in backend)
- Event states affect visual indicators and actions available
- Recurring events store `ricorrenzaId` - deleting affects all events with same ID
- Always use `EventoMapper` for backend ↔ frontend transformations

### When Working with Forms

- Use CoreUI form components for consistency
- Patient codice fiscale can be auto-generated or manually entered
- Province/municipality selects use autocomplete for better UX
- Validation happens before API calls via Validator classes

### When Adding New Features

1. Create service method in appropriate `*Service.js` file
2. Add composable if complex logic needed (in `composables/`)
3. Update types in `backend.types.js` if new DTOs
4. Create/update view components
5. Add route in `router/index.js` if new page
6. Update navigation in `_nav.js` if needed

### Debugging

- Check browser console for axios interceptor logs (🚀 Request, ✅ Response, ❌ Error)
- Verify .env variables are loaded: `import.meta.env.VITE_API_*`
- Use Vue DevTools for component state and Pinia stores
