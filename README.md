# CSM CRM — Frontend

React 18 + TypeScript + Vite frontend for the CSM CRM platform.

## Tech stack

| Tool | Purpose |
|------|---------|
| React 18 + Vite | UI + build |
| TypeScript 5 | Type safety |
| React Router v6 | Client-side routing |
| Zustand | Global state (auth, UI, filters) |
| TanStack Query v5 | Server state / data fetching |
| Tailwind CSS | Styling |
| Vitest | Unit tests |

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — set VITE_API_URL and VITE_USE_MOCKS

# 3. Start dev server
npm run dev
```

## Environment variables

See `.env.example` for all available values.

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8080/api` | Backend base URL (all API calls are prefixed with this) |
| `VITE_USE_MOCKS` | `false` | Set to `true` to run without a backend using in-memory mock data |

## Running modes

### Real API mode (default)
```env
VITE_USE_MOCKS=false
VITE_API_URL=http://localhost:8080/api
```
All services call the real backend. The dev server proxies `/api/*` requests to the origin in `VITE_API_URL`, stripping the `/api` prefix before forwarding.

**Auth note**: Login calls `POST /auth/login → { token, user }`. If that endpoint is not yet deployed on the backend, the login form will show a 404 error — switch to mock mode until the endpoint is available.

### Mock mode (no backend)
```env
VITE_USE_MOCKS=true
```
All services use in-memory fixtures from `src/mock/`. Useful for UI development without a running backend.

Login works with any active user from the mock list, e.g.:
- `ali.yilmaz@csm.com` (admin)
- any any password is accepted as long as `isActive: true`

**Mock-only features** (always empty / 501 in real mode):
- Template management (`/admin/templates`)
- Outbound email sending

## Project structure

```
src/
  services/        # API + mock service layer (one file per domain)
  hooks/           # React Query hooks wrapping services
  store/           # Zustand stores (auth, ui, filters)
  pages/           # Route-level page components
  components/      # Reusable UI components
  lib/             # Shared utilities (env, errors)
  mock/            # Mock data fixtures (only used when VITE_USE_MOCKS=true)
  router/          # Router config + ProtectedRoute
  types/           # TypeScript type definitions
  test/            # Vitest unit tests
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run typecheck` | Type-check only |
| `npm test` | Run all tests once |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report |

## API contract

The frontend expects a REST backend at `VITE_API_URL` with the following endpoints:

### Auth
- `POST /auth/login` — `{ email, password }` → `{ token, user: User }`

### Tickets
- `GET  /tickets?{filters}` → `Ticket[]` or `{ data: Ticket[], total, page, pageSize }`
- `GET  /tickets/{id}` → `Ticket`
- `GET  /tickets/by-ticketNo?ticketNo={n}` → `Ticket`
- `PUT  /tickets/{id}` — update ticket fields → `Ticket`
- `POST /tickets/status` — `{ ticketId, status, reason? }` → `Ticket`
- `POST /tickets/close` — `{ ticketId, sendNotification }` → `Ticket`
- `POST /tickets/reopen` — `{ ticketId }` → `Ticket`

### Notes
- `GET  /notes/by-ticket/{ticketId}` → `NoteResponse[]`
- `GET  /notes/{id}` → `NoteResponse`
- `POST /notes` — `{ ticketId, content, isInternal }` → `NoteResponse`

### Emails (read-only)
- `GET  /emails/by-ticket/{ticketId}` → `EmailDocumentResponse[]`
- `GET  /emails/{id}` → `EmailDocumentResponse`
- `GET  /emails/by-thread/{threadKey}` → `EmailDocumentResponse[]`

### Assignments
- `POST /assignments/assign` — `{ ticketId, userId }` → `AssignmentResponse`
- `POST /assignments/reassign` — `{ ticketId, userId }` → `AssignmentResponse`
- `POST /assignments/unassign` — `{ ticketId }` → void
- `GET  /assignments/by-ticket/{ticketId}` → `AssignmentResponse[]`

### Transfers
- `POST /transfers` — `{ ticketId, toGroupId, reason? }` → `TransferResponse`
- `GET  /transfers/by-ticket/{ticketId}` → `TransferResponse[]`

### Customers
- `GET  /customers?{filters}` → `Customer[]` or `{ data: Customer[], total }`
- `GET  /customers/{id}` → `Customer`
- `PATCH /customers/{id}/activate` → `Customer`
- `PATCH /customers/{id}/deactivate` → `Customer`

### Contacts
- `GET  /contacts?{filters}` → `ContactResponse[]`
- `GET  /contacts/{id}` → `ContactResponse`
- `GET  /contacts/by-customer/{customerId}` → `ContactResponse[]`
- `GET  /contacts/by-email?email={e}` → `ContactResponse`
- `POST /contacts` → `ContactResponse`
- `PUT  /contacts/{id}` → `ContactResponse`
- `DELETE /contacts/{id}` → void

### Users
- `GET  /users?{filters}` → `User[]` or `{ data: User[], total }`
- `GET  /users/{id}` → `User`
- `PATCH /users/{id}/activate` → `User`
- `PATCH /users/{id}/deactivate` → `User`

### Groups
- `GET  /groups` → `Group[]`
- `POST /groups` → `Group`
- `PUT  /groups/{id}` → `Group`
- `PATCH /groups/{id}/activate` → `Group`
- `PATCH /groups/{id}/deactivate` → `Group`


Auth token is sent as `Authorization: Bearer <token>` on all requests.
Token is stored in `localStorage` via Zustand `persist`.

## Authentication

Login calls `POST /auth/login`. On success, the returned user + token are stored in `localStorage` under the key `csm-auth`. All subsequent API requests automatically include the Bearer token.

A 401 response from any query/mutation automatically clears auth state and redirects to `/login`.

**Deferred (V2):** If the `/auth/login` endpoint is not yet implemented on the backend, login will fail with a visible error in the login form. Switch to mock mode (`VITE_USE_MOCKS=true`) until the endpoint is available.

## Role-based access

| Role | Access |
|------|--------|
| `admin` | All routes including `/admin/*` |
| `supervisor` | All routes except `/admin/*` |
| `trade_agent` / `operation_agent` | Tickets, customers, reports |
| `viewer` | Tickets, customers, dashboard (read-only) |

Route protection is enforced in `src/router/index.tsx` via `ProtectedRoute`.

## Known limitations (V2 deferred)

| Feature | Real-mode status | Notes |
|---------|-----------------|-------|
| Auth (`/auth/login`) | May not be deployed | Login form shows explicit error if endpoint missing. Use mock mode for development. |
| Template management | Not available | Route exists but shows "not available" screen. Requires `VITE_USE_MOCKS=true`. |
| Role management edits | Session-local only | Edits on `/admin/roles` are not persisted — they reset on reload. Role config is server-side. |
| Pagination | Degraded | If backend returns a flat array, all records appear on "page 1". Client-side pagination does not apply. |
| Ticket filter/sort | Best-effort | Filter params are sent. If backend ignores them, all records are returned. Sort is client-side only. |
| Outbound email replies | Not available | Sending email replies returns 501. Notes (`/notes`) work. |
| Customer ticket lookup | Best-effort | `GET /tickets?customerId=` may not be supported — backend determines response. |
