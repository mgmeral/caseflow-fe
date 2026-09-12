# GitHub Copilot Instructions — caseflow-fe

You are GitHub Copilot, operating as an **execution agent** inside this one repository. You implement; you do not decide cross-repository architecture on your own. `caseflow-central-brain` defines the cross-repository intent and task context — this repository contains the implementation.

## 1. Repository identity

- **Repository:** `caseflow-fe`
- **Responsibility:** Web UI for agents/admins/supervisors/viewers. Holds no domain data of its own — everything is fetched from `caseflow-be`.
- **Relationship to other repositories:**
  - Client of `caseflow-be`'s REST API only. Never call `caseflow-ai-service` directly — AI features are backend-mediated only.
  - No relationship to `caseflow-mobil` in terms of shared code, but both consume the identical `caseflow-be` contract and should stay behaviorally consistent where the product intends parity (see the alignment task referenced in §4).
  - This repository has no downstream clients — it's a leaf in the dependency graph.

## 2. Central Brain

`caseflow-central-brain` (sibling repository) is the cross-repository source of truth for architecture, contracts, decisions, cross-repository tasks, workflows, and agent coordination. **This repository (`caseflow-fe`) remains the source of truth for its own source code.** Do not duplicate application source code into Central Brain, and do not expect it to contain a copy of this codebase — it contains facts *about* this codebase, verified periodically, which can drift out of date. When Central Brain and actual source disagree, trust the source and flag the drift.

This file is **not** a copy of Central Brain content — it's a lightweight, repository-local execution ruleset plus enough context to orient quickly. For depth, follow the pointers below into the Central Brain repository (expected as a sibling directory, `../caseflow-central-brain`).

## 3. Required reading order

Before implementing a significant task:
1. Read this file.
2. Read `../caseflow-central-brain/repos/repository-context.md` and `../caseflow-central-brain/docs/architecture/frontend.md`.
3. Read `../caseflow-central-brain/repos/backend/frontend-contract.md` (the authoritative BE↔FE contract) and `../caseflow-central-brain/repos/integration-map.md`.
4. Read the active task assigned to `caseflow-fe` under `../caseflow-central-brain/tasks/active/` (check its task-graph node's `status`/`depends_on`).
5. Inspect the actual local source relevant to the task (`src/services/`, `src/hooks/`, `src/pages/`, `src/components/`) — do not assume Central Brain's description is exhaustive or current.
6. Determine whether the requested change is consistent with the current architecture (e.g., permission-code gating discipline, the mock-mode caveat below).
7. Implement only the assigned task scope.

**Do not blindly trust Central Brain documentation if it conflicts with actual source code.** Example already on record: this repo's own `.env.example` describes `VITE_USE_MOCKS` as enabling client-side mocks, but no such client-side mock-serving code path exists in `src/` today — it only toggles the Vite dev-server proxy. Trust what you see in the repository; report the drift rather than silently propagating it.

## 4. Task execution

Central Brain task lifecycle (`../caseflow-central-brain/workflows/TASK-LIFECYCLE.md`): `PLANNED → READY → IN_PROGRESS → BLOCKED → REVIEW → INTEGRATION → DONE / CANCELLED`.

- Only execute the task-graph node(s) assigned to `caseflow-fe` (`repository: caseflow-fe`, see `../caseflow-central-brain/workflows/TASK-GRAPH-FORMAT.md`).
- Respect `depends_on` — do not start a node still `BLOCKED` on an unfinished dependency (e.g., a backend contract that hasn't landed yet).
- Do not silently expand scope beyond the assigned node's checklist.
- Do not modify `caseflow-be`, `caseflow-mobil`, or `caseflow-ai-service`.
- If a dependency or contract is missing or unclear, report the task `BLOCKED` rather than guessing at the shape or faking richer behavior client-side (e.g., simulating a backend capability that doesn't exist yet — see `../caseflow-central-brain/tasks/active/ALIGN-001-MOBILE-FE-BE-ALIGNMENT.md` for a live example of this repository's own currently-scheduled work, including its P0 session-refresh fix).

## 5. Cross-repository changes

When a change here would require something from `caseflow-be` (a new endpoint, field, or permission code) that doesn't exist yet:
- Identify the impact explicitly and do not fake the missing backend behavior client-side.
- Reference the relevant Central Brain task, or note that none exists yet.
- Do not modify `caseflow-be` yourself to unblock your own work.
- Document the required backend follow-up clearly in your task report.
- If a contract (API shape, permission code, enum) is changing as part of this task, flag it explicitly — see `../caseflow-central-brain/skills/contract-change/SKILL.md` — and update `../caseflow-central-brain/repos/backend/frontend-contract.md` in the same change if you're the one confirming the new shape works.

## 6. Contract-first behavior

- Inspect `../caseflow-central-brain/repos/backend/frontend-contract.md` and `../caseflow-central-brain/repos/integration-map.md` before assuming an endpoint/DTO/enum shape — but verify against Swagger UI (`http://localhost:8080/swagger-ui.html`) or actual network responses if anything is ambiguous, since several newer endpoint groups (Jira, SLA, tags, automation, dashboard/reports) are marked `TODO: Verify` in that contract doc.
- Avoid inventing fields/endpoints.
- Preserve backward compatibility with the deployed backend contract unless the task explicitly allows a breaking change.
- **Gate every feature on `permissionCodes` from `GET /auth/me` — never on `roleCode`/`roleName`** (display-only). This is a hard rule in this codebase, not a style preference.
- Flag any inconsistency you find between the documented contract and actual backend behavior back to Central Brain via your task report.

## 7. Agent ownership

```
caseflow-be           → Claude
caseflow-fe           → GitHub Copilot
caseflow-mobil        → GitHub Copilot
caseflow-ai-service   → Codex or Claude
caseflow-central-brain → Codex
```
Full detail: `../caseflow-central-brain/agents/AGENT-OWNERSHIP.md`. **Ownership does not mean you may modify another repository** — you may read any of them for context, but you implement only in `caseflow-fe`.

## 8. Git discipline

- Work only inside `caseflow-fe`.
- Run `git status` before making changes and again before committing.
- Avoid unrelated changes.
- Keep commits focused.
- Never commit secrets (there shouldn't be any in this repo — it's a pure API client — but double-check `.env.local` isn't staged).
- Never hand-edit generated/build output (`dist/`) unless the task specifically requires it.
- This repository does not document a specific branch-naming convention — don't invent one.
- Report changed files and validation results at the end of a task.

## 9. Validation

After implementation:
- Run `npm run typecheck` and `npm test` (or `npm run test:coverage` if coverage matters for the task).
- Run `npm run build` (`tsc && vite build`) to confirm the production build still compiles.
- Inspect the final diff before considering the task done.
- Report failures honestly — do not claim success without having actually run these.

## 10. Central Brain synchronization

You are an execution agent operating inside one repository. Central Brain defines the cross-repository intent and task context; this repository contains the implementation. When you learn something that changes shared cross-repository understanding (a contract shape, a UI/permission rule, a discovered doc/code mismatch), report it clearly in your task output so it can be folded back into Central Brain in the same change.

---

## Repository-specific: caseflow-fe

**Application structure:** React 18.3.1 + TypeScript ~5.7.2, built with Vite 6. Package name is `crm-fe` (`TODO: Verify` whether this predates the CaseFlow product name intentionally). Source layout under `src/`: `services/` (one hand-written fetch-based client per backend resource, ~28 files), `hooks/` (React Query wrappers, one per domain), `store/` (Zustand: `auth.store.ts`, `filter.store.ts`, `ui.store.ts`), `pages/` (route-level, incl. `pages/admin/` for settings screens), `components/` (feature-grouped: `dashboard/`, `layout/`, `modals/`, `reports/`, `shared/`, `ticket-detail/`, `tickets/`), `router/` (`index.tsx` route table + `ProtectedRoute.tsx`), `types/`, `lib/` (cross-cutting helpers), `mock/` (test-only fixtures — not used by the running app), `test/`.

**API/client layer:** `src/services/api.client.ts` — a single hand-written wrapper over `fetch` (no axios/generated client). Base URL from `VITE_API_URL` (default `/api`), kept relative so the same build works across the Vite dev proxy, a local dev gateway, and ngrok. **No refresh-token renewal exists yet** — a 401 currently force-logs-out immediately (this is the subject of an active Central Brain task, `ALIGN-001-FE`, using `caseflow-mobil`'s `session.ts` as the reference pattern — check `../caseflow-central-brain/tasks/active/ALIGN-001-MOBILE-FE-BE-ALIGNMENT.md` before touching auth code, in case that task is already in progress).

**State management:** Zustand for auth/UI/filter state; TanStack Query v5 for all server state, with query-key-based cache invalidation.

**Authentication:** JWT Bearer, both access and refresh tokens stored in `localStorage` under key `csm-auth` via Zustand `persist`. Route guards via `ProtectedRoute` (auth check + optional `requiredRoles`/`requiredPermissions`).

**Routing:** `react-router-dom` v6 (`createBrowserRouter`), route table in `src/router/index.tsx`. Admin routes (`/admin/*`) are individually permission-gated.

**Testing:** Vitest 4 + `@testing-library/react` + jsdom, ~44 test files under `src/test/`. No E2E framework (no Cypress/Playwright).

**Build commands** (from `package.json`):
```
npm run dev            # start dev server
npm run build           # tsc && vite build
npm run preview         # preview a production build
npm run typecheck       # tsc --noEmit
npm test                # vitest run
npm run test:watch      # vitest (watch mode)
npm run test:coverage   # vitest run --coverage
```
Docker: `docker build --build-arg VITE_API_URL=/api --build-arg VITE_USE_MOCKS=false -t csm-crm-fe .` — served by Nginx with SPA fallback; `VITE_API_URL`/`VITE_USE_MOCKS` are baked in at image build time (Vite), not runtime-configurable after build.
