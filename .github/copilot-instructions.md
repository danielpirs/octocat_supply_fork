# OctoCAT Supply - AI Agent Instructions

## Architecture Overview

This is a full-stack TypeScript monorepo with Express + SQLite backend and React + Vite frontend for a supply chain management demo.

**Key Components:**
- **Backend** (`api/`): Express.js REST API with SQLite persistence via repository pattern
- **Frontend** (`frontend/`): React 18 + Vite + Tailwind CSS SPA
- **Database**: SQLite file (`api/data/app.db`) with declarative migrations and deterministic seeds

**Data Flow:** React components → REST API → Repository layer → SQLite → camelCase/snake_case mapping

See [docs/architecture.md](../docs/architecture.md) for ERD and component diagrams.

## Critical Developer Workflows

### Starting Development
```bash
make install      # Install all dependencies (run once or after package.json changes)
make dev          # Start API (port 3000) + Frontend (port 5137) concurrently
make db-seed      # Reset database with fresh migrations + seed data
```

**API only:** `make dev-api` | **Frontend only:** `make dev-frontend`

### Database Management
- **Migrations** are immutable SQL files in `api/database/migrations/XXX_*.sql`, applied in order
- **Seed data** in `api/database/seed/XXX_*.sql` uses explicit IDs for deterministic foreign key relationships
- On startup, API auto-runs migrations and seeds if empty. Force fresh seed: `cd api && npm run db:seed:dev`
- Tests use **in-memory DB** (`:memory:`) for speed and isolation

**Never edit existing migration files—create a new sequential file instead.**

### Building & Testing
```bash
make build        # Build both API and frontend for production
make test         # Run all tests (Vitest for API, E2E Playwright for frontend)
```

**VS Code tasks:** Use `Cmd+Shift+P` → `Run Task` → `Build All` or debug launch configs.

## Project-Specific Conventions

### Backend Patterns

#### Repository Pattern with Case Mapping
All data access goes through repository classes (e.g., `SuppliersRepository`). **Critical pattern:**
- TypeScript models use **camelCase** (`supplierId`, `contactPerson`)
- SQLite columns use **snake_case** (`supplier_id`, `contact_person`)
- Utilities in `api/src/utils/sql.ts` handle bidirectional mapping: `objectToCamelCase()`, `buildInsertSQL()`, `buildUpdateSQL()`

**Example:**
```ts
// In repository
const { sql, values } = buildInsertSQL('suppliers', supplier); // auto-converts to snake_case
const row = await this.db.get('SELECT * FROM suppliers WHERE supplier_id = ?', [id]);
return objectToCamelCase<Supplier>(row); // converts to camelCase
```

#### Error Handling
All repositories use custom error classes from `api/src/utils/errors.ts`:
- `NotFoundError(entity, id)` → 404
- `ValidationError(message)` → 400
- `ConflictError(message)` → 409 (e.g., UNIQUE violations)
- `DatabaseError` → 500 (generic fallback)

Express middleware `errorHandler()` maps these to JSON responses. **Always throw these instead of generic Error.**

#### API Route Structure
Each route file (e.g., `api/src/routes/supplier.ts`) starts with **Swagger/OpenAPI JSDoc annotations** that auto-generate docs at `/api-docs`:
```ts
/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: Returns all suppliers
 *     tags: [Suppliers]
 */
```
**Update Swagger comments when adding/modifying endpoints.** Swagger options configured in `api/src/index.ts`.

#### CORS Configuration
API allows these origins by default (see `api/src/index.ts`):
- `localhost:5137`, `localhost:3001` (local dev)
- `*.app.github.dev` (Codespaces regex)
- `*.azurecontainerapps.io` (Azure deployments regex)

Override via `API_CORS_ORIGINS` environment variable (comma-separated list).

### Frontend Patterns

#### State Management
- **Server state:** React Query (v3) for API data fetching (see `frontend/src/api/config.ts`)
- **UI state:** React Context for global concerns (Auth, Theme)—avoid prop drilling
- **Local state:** `useState` in components; keep it colocated

**Do NOT use ad-hoc `useEffect` + `axios` for data fetching—use React Query hooks.**

#### Styling
- **Tailwind CSS** utilities preferred (configured in `tailwind.config.js`)
- Dark mode via `ThemeContext` applies `bg-dark` class conditionally
- Avoid custom CSS files—extract repeated class groups into small components or `clsx` helpers

#### Routing
React Router v7 with standard routes (see `frontend/src/App.tsx`). No data loaders yet.

### Testing Conventions

#### API Tests (Vitest)
- Repository tests use in-memory DB with mocked connections (see `api/src/repositories/suppliersRepo.test.ts`)
- Run with `cd api && npm test`
- Mock `getDatabase()` from `../db/sqlite` to inject test DB

#### Frontend Tests
- E2E tests with Playwright in `frontend/tests/e2e/*.spec.ts`
- Run with `cd frontend && npm run test:e2e`
- BDD feature files in `frontend/tests/features/*.feature` (Cucumber-style)

## Data Integrity Rules

1. **Foreign keys enabled:** SQLite pragma enforced in `api/src/db/sqlite.ts`
2. **Indexes on FKs:** All foreign key columns have indexes (check migrations)
3. **Parameterized queries only:** Use `?` placeholders—never concatenate user input into SQL strings
4. **Transactions:** Multi-table writes wrapped in explicit transactions where consistency required
5. **Seed determinism:** Use explicit `INSERT` IDs so references are stable across reseeds

## Common Pitfalls

- **N+1 queries:** Avoid loops with per-row SELECTs. Use JOINs or batching (see `api.instructions.md` review checklist).
- **Migration edits:** Never modify existing migration files—they're immutable. Add a new sequential file.
- **Seed dependencies:** Seeds execute in alphabetical order. Ensure FK dependencies respect order (headquarters before branches).
- **Boolean conversion:** SQLite stores booleans as 0/1 integers. Repositories convert to JS boolean via `Boolean(value)` (see `SuppliersRepository.convertBooleanFields()`).
- **Testing isolation:** Repository tests must use mocked DB connection—never hit real `app.db` file.

## Key Files Reference

- **API entry:** [api/src/index.ts](../api/src/index.ts) – Express setup, CORS, Swagger, route mounting
- **DB init:** [api/src/init-db.ts](../api/src/init-db.ts) – Migration runner and seeding logic
- **SQL utilities:** [api/src/utils/sql.ts](../api/src/utils/sql.ts) – Case mapping, query builders
- **Error handling:** [api/src/utils/errors.ts](../api/src/utils/errors.ts) – Custom error classes and middleware
- **Frontend entry:** [frontend/src/App.tsx](../frontend/src/App.tsx) – Router and context providers

## Documentation

- Architecture deep dive: [docs/architecture.md](../docs/architecture.md)
- SQLite integration guide: [docs/sqlite-integration.md](../docs/sqlite-integration.md)
- Build system: [docs/build.md](../docs/build.md)

## Specialized Guidance

For component-specific review checklists, see:
- `.github/instructions/api.instructions.md` – Backend review checklist
- `.github/instructions/database.instructions.md` – Schema change checklist
- `.github/instructions/frontend.instructions.md` – React/Tailwind review checklist
