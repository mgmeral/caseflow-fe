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

### Mock mode (no backend)
```env
VITE_USE_MOCKS=true
```
All services will use in-memory fixtures from `src/mock/`. This is useful for local UI development. Login works with any email from the mock users list (e.g. `ali.yilmaz@csm.com`).

### Real API mode
```env
VITE_USE_MOCKS=false
VITE_API_URL=http://localhost:8080/api
```
All services will call the real backend. The dev server proxies `/api` requests to `VITE_API_URL`.

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

## API contract assumptions

The frontend expects a REST backend at `VITE_API_URL` with:

- `POST /auth/login` — `{ email, password }` → `{ token, user: User }`
- `GET  /tickets?{filters}` → `{ data: Ticket[], total: number, page, pageSize }`
- `GET  /tickets/:id` → `Ticket`
- `GET  /tickets/:id/messages` → `TicketMessage[]`
- `POST /tickets/:id/assign` — `{ userId, userName, note? }` → `Ticket`
- `POST /tickets/:id/status` — `{ status, reason? }` → `Ticket`
- `POST /tickets/:id/transfer` — transfer payload → `Ticket`
- `POST /tickets/:id/close` — `{ sendNotification }` → `Ticket`
- `GET  /customers?{filters}` → `{ data: Customer[], total }`
- `GET  /customers/:id` → `Customer`
- `GET  /customers/:id/tickets` → `Ticket[]`
- `GET  /users` → `User[]`
- `GET  /groups` → `Group[]`
- `GET  /templates` → `TicketTemplate[]`

Auth token is sent as `Authorization: Bearer <token>` on all requests.
Token is stored in `localStorage` via Zustand `persist`.

## Authentication

Login calls `POST /auth/login`. On success, the returned user + token are stored in `localStorage` under the key `csm-auth`. All subsequent API requests automatically include the Bearer token.

A 401 response from any query/mutation automatically clears auth state and redirects to `/login`.

## Role-based access

| Role | Access |
|------|--------|
| `admin` | All routes including `/admin/*` |
| `supervisor` | All routes except `/admin/*` |
| `trade_agent` / `operation_agent` | Tickets, customers, reports |
| `viewer` | Tickets, customers, dashboard (read-only) |

Route protection is enforced in `src/router/index.tsx` via `ProtectedRoute`.
