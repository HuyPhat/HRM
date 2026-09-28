# Meridian ERP

A small but real ERP suite built as a portfolio project for a Frontend Developer (ERP focus) role. It's not a static mockup — it's a working full-stack app: a NestJS/PostgreSQL backend with real REST and GraphQL APIs, JWT auth, and a role-gated multi-step approval workflow, behind a React + TanStack Router/Query frontend.

**Live demo:** [hrm-web-navy.vercel.app](https://hrm-web-navy.vercel.app) — see [Demo accounts](#demo-accounts-password-demo1234) below for login credentials.

**Design reference:** the UI was designed first as an interactive prototype ([Meridian ERP — Design](https://claude.ai/artifact/DkRGH56KaqyRu9NHWcHMKe)) and then implemented pixel-faithfully here.

## Why this project

It's a deliberate, small-scope simulation of three connected ERP modules rather than one isolated CRUD screen, because that's closer to what real ERP frontend work looks like — screens that share a data model and a workflow, not silos.

| Job requirement | Where it lives here |
|---|---|
| Implement UI/UX designs (Figma/Sketch), consistent & smooth UX | Every screen was designed first (see the linked design canvas), then implemented to match: shared design tokens (`apps/web/src/styles/index.css` + `tailwind.config.js`), one component language across all four screens. |
| Data-heavy ERP screens: multi-step forms, approval flows, financial dashboards, real-time reporting tables | `POWizardPage` (3-step PO form with live totals), `ApprovalsPage` (list + detail + role-gated decide), `DashboardPage` (KPIs, AP aging, live-polling transactions table), `InventoryPage` (filterable/sortable reporting table). |
| Integrate APIs (RESTful/gRPC, GraphQL) with ERP backend systems | Inventory, Purchase Orders, Approvals and Auth are REST (`apps/api/src/*`); the Dashboard is served over **GraphQL** (`apps/api/src/dashboard`) via `@nestjs/graphql` — both consumed from the same TanStack Query layer (`apps/web/src/api/queries.ts`). |
| Experience building/customizing ERP frontend modules (Odoo/ERPNext/Fiori or custom) | A custom ERP frontend module set (P2P + Inventory + Financial Dashboard) built against a real backend and real Postgres data model — the same shape of work as customizing an existing ERP's frontend, without requiring a live Odoo/ERPNext instance to demo. |
| ERP domain knowledge: GL/AR/AP, P2P, O2C, inventory, approval flows | Purchase-to-Pay is modeled end-to-end (PO → multi-level approval → implied goods receipt → AP), with an AP aging report and inventory reorder-point logic. Order-to-Cash and GL are intentionally left as "Coming soon" in the nav rather than faked. |

## Stack

- **Frontend** (`apps/web`): Vite, React 18, TypeScript, **TanStack Router** (code-based routing), **TanStack Query**, Tailwind CSS.
- **Backend** (`apps/api`): NestJS, **PostgreSQL** via Prisma, REST controllers + a code-first **GraphQL** resolver, JWT auth (`passport-jwt`), role-based authorization enforced in the approval-decision service.

Vite + TanStack Router (rather than Next.js) is a deliberate choice: this is an internal, authenticated back-office app with no SEO/SSR requirement, which is exactly the profile most real ERP frontends have.

## Data model & business logic

`apps/api/prisma/schema.prisma` models `User`, `Vendor`, `Warehouse`, `Item`/`StockLevel`, `PurchaseOrder`/`PurchaseOrderLine`, `ApprovalStep`, and `Transaction`. The interesting logic is the approval chain in `apps/api/src/approvals/approvals.service.ts`:

- Every PO is created with a two-step chain: **Manager → Finance**.
- `POST /approvals/:id/decide` only lets a user act on the step matching their own role (`403` otherwise — this is enforced server-side, not just hidden in the UI).
- Approving advances the PO to the next step's status; rejecting ends the chain immediately.
- The Dashboard's KPIs, AP aging buckets, and "waiting" times are **computed from this real data** on every request/poll — nothing on the dashboard is hardcoded.

## Running it locally

Prerequisites: Node 20+, a local PostgreSQL instance.

```bash
# 1. Install everything (npm workspaces)
npm install

# 2. Configure the API
cp apps/api/.env.example apps/api/.env
# edit DATABASE_URL if your Postgres isn't on localhost:5432 with postgres/postgres

# 3. Create the schema and seed demo data
npm run --workspace apps/api prisma:migrate
npm run seed

# 4. Run both apps (in separate terminals)
npm run dev:api    # http://localhost:4000  (REST + /graphql)
npm run dev:web    # http://localhost:5173
```

### Demo accounts (password: `demo1234`)

| Email | Name | Role |
|---|---|---|
| requester@meridian.dev | D. Alvarez | Requester · Procurement |
| manager@meridian.dev | R. Osei | Manager · Operations |
| finance@meridian.dev | Jordan Lee | Finance |
| warehouse@meridian.dev | S. Kim | Requester · Warehouse |
| logistics@meridian.dev | M. Tran | Admin · Logistics |

Log in as **Manager** or **Finance** to actually approve/reject the seeded purchase orders — the Approvals page enforces who can act on which step, same as the backend does.

## Deploying (Railway + Vercel)

The backend and frontend deploy as two separate services from this one repo.

### Backend → Railway

1. New Railway project → **Deploy from GitHub repo** → select this repo.
2. In the service's **Settings → Root Directory**, set it to `apps/api`.
3. **Add a plugin → PostgreSQL** to the project. Railway injects `DATABASE_URL` into the service automatically.
4. Add one more environment variable on the service: `JWT_SECRET` (any random string).
5. Deploy. Railway runs `npm install`, then `npm run build` (`prisma generate && nest build`), then `npm run start` (`prisma migrate deploy && node dist/main`) — migrations apply automatically on every deploy.
6. Seed demo data once, after the first successful deploy: open a shell on the service (Railway dashboard → the service → **Shell**, or `railway run` locally with the Railway CLI linked to the project) and run `npm run prisma:seed`.
7. Note the public URL Railway gives the service (Settings → Networking → Generate Domain) — you'll need it for the frontend.

### Frontend → Vercel

1. New Vercel project → import this repo.
2. **Root Directory**: `apps/web`. Vercel auto-detects the Vite framework preset (build command `npm run build`, output `dist`) — `apps/web/vercel.json` adds the SPA rewrite so client-side routes don't 404 on refresh.
3. Add environment variable `VITE_API_URL` = the Railway backend's public URL from above (no trailing slash).
4. Deploy.

### Wiring them together

Once the frontend has a public URL, set `CORS_ORIGIN` on the Railway service to that URL (comma-separate if you add a custom domain later) and redeploy the backend — otherwise CORS defaults to allowing any origin, which is fine for a demo but worth tightening once the frontend URL is known.

## Known simplifications

Built to a focused 1–2 week scope, so a few things are intentionally simplified rather than half-built:

- Tax is calculated client-side for the PO wizard's review step (a UX nicety) but isn't a modeled field on the backend — a real system would model tax as its own line/rule.
- Approver assignment is fixed (one Manager, one Finance persona) rather than a configurable approval-matrix — enough to demonstrate the workflow mechanics without building a rules engine.
- Order-to-Cash and General Ledger are shown as "Coming soon" in the nav rather than stubbed with fake data.
