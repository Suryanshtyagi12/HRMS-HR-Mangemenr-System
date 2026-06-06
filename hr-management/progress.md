# HRMS Pro — Progress Tracker
## Architecture: Decoupled Next.js 14 + FastAPI Backend

---

## Phase 1: Architecture Migration (Current)

- [x] P1-1 Update context.md and progress.md to new decoupled architecture
- [x] P1-2 Clean frontend — remove all Next.js API routes (`/app/api`), remove Prisma, NextAuth, and other server-side packages; keep UI components
- [x] P1-3 Set up FastAPI project structure (`/hrms-backend`) + Python virtual environment + install all dependencies
- [x] P1-4 Database models (SQLAlchemy async) + Alembic migrations (replaces Prisma schema)
- [x] P1-5 Auth system — JWT access + refresh tokens, password hashing (passlib + bcrypt), `/auth/login`, `/auth/refresh`, `/auth/logout` endpoints
- [x] P1-6 Employee module API — CRUD endpoints, Supabase Storage for photo/document upload, department management
- [x] P1-7 Attendance module API — clock in/out, logs, admin override, anomaly detection
- [x] P1-8 Payroll module API — gross/deductions/net engine (sync), Celery task for bulk payroll run, reportlab PDF payslip generation
- [x] P1-9 Leave management API — apply, approve/reject flow, balance tracker, leave calendar
- [x] P1-10 Connect frontend to FastAPI — set up Axios instance with interceptors, TanStack Query provider, base API hooks
- [x] P1-11 Auth flow frontend — JWT storage (memory + httpOnly cookie for refresh), login page wired to FastAPI, route guards
- [x] P1-12 Verify all core features work end-to-end with new FastAPI backend (employee CRUD, attendance, payroll, leave)

---

## Phase 2: Real Features + AI

- [x] P2-1 Real AI resume screening — PyPDF2 text extraction + Gemini scoring pipeline + proper ranking system
- [x] P2-2 AI voice interview bot & Isolated Architecture — secure interview page, tab tracking, transcript modal, HR portal
- [x] P2-3 HR document management — real CV upload to Supabase Storage, JD matching, document vault
- [x] P2-4 Advanced candidate ranking system — multi-factor scoring, side-by-side comparison, export
- [ ] P2-5 Performance module + 360-degree feedback — review cycles, OKRs, appraisals, Gemini narrative
- [x] P2-6 Real-time notifications — Supabase Realtime + WebSocket endpoint in FastAPI
- [x] P2-7 **Implement AI Insights Data Collector** — Created `app/ai/company_analyzer.py` which aggregates ALL data from Postgres DB for Gemini.
- [x] P2-8 **Implement AI Report Generator** — Created `app/ai/report_generator.py` which wraps Gemini to generate structured output from real DB numbers.
- [x] P2-9 **Update AI API Routes** — Added real `/insights` and `/insights/quick` to `routers/ai.py`
- [x] P2-10 **Update Admin Dashboards** — Replaced the mock AI Insights panel in Admin Dashboard to use real data; added the full `ai-insights` page.
- [x] P2-11 Mobile responsiveness pass — all pages tested and polished on mobile
- [x] P2-12 Onboarding flow — new hire checklist, document submission, welcome email
- [x] P2-13 Auto recruitment pipeline: Apply → AI Screen → Rank → Percentile shortlist automated

---

## Phase 3: Security Hardening & Deployment

### ✅ Security Fixes (Completed June 2026)
- [x] P3-S1 Created frontend `.gitignore` — `.env`, `.next/`, `node_modules/` excluded
- [x] P3-S2 Added `hrms.db` and `*.db` to backend `.gitignore`
- [x] P3-S3 Disabled `/docs`, `/redoc`, `/openapi.json` in production (`ENVIRONMENT=production`)
- [x] P3-S4 Tightened CORS — explicit method list, `VERCEL_FRONTEND_URL` env var support
- [x] P3-S5 Fixed refresh cookie `secure=True` auto-enabled in production
- [x] P3-S6 Added `ENVIRONMENT` and `VERCEL_FRONTEND_URL` to `.env.example`

### 🔲 Deployment Tasks
- [ ] P3-1 **Rotate JWT secrets** — Generate new 64-char random secrets before push
- [ ] P3-2 **Frontend: Vercel deploy** — Connect repo, set all env vars, verify build
- [ ] P3-3 **Backend: Render deploy** — Connect repo, set all env vars, set `ENVIRONMENT=production`
- [ ] P3-4 **Redis: Upstash** — Set up free Upstash Redis, update `REDIS_URL` in Render
- [ ] P3-5 **Update CORS** — Set `FRONTEND_URL` + `VERCEL_FRONTEND_URL` in Render to production Vercel URL
- [ ] P3-6 **Supabase RLS** — Enable Row Level Security on Realtime-subscribed tables
- [ ] P3-7 **Rate limiting** — Add `slowapi` rate limiter to `/auth/login` endpoint
- [ ] P3-8 **Demo seed data** — Run seed script against production Supabase DB (50+ employees)
- [ ] P3-9 **End-to-end testing** — All 4 roles (Admin, Manager, HR, Employee) on live URLs
- [ ] P3-10 **README** — Add setup guide, architecture diagram, live URLs

---

## Blockers

*(none)*

---

## Notes

- Previous architecture used Next.js API routes + Prisma + NextAuth — all replaced by FastAPI
- Supabase Postgres DB schema will be migrated from Prisma format → SQLAlchemy models
- NextAuth sessions → stateless JWT (FastAPI `python-jose`)
- Prisma ORM → SQLAlchemy async ORM
- Frontend keeps all UI components (shadcn/ui, Recharts, Zustand) — only backend coupling removed

---

## Live URLs

| Service | URL |
|---|---|
| Frontend | *(pending — Vercel)* |
| Backend API | *(pending — Railway)* |
| API Docs | *(pending — `/docs` on Railway URL)* |

---

## Audit Findings (June 2026)

**✅ FULLY WORKING:**
1. **JOB POSTINGS**: Frontend and Backend fully decoupled, AI generation via Gemini implemented.
2. **AI RESUME SCREENER**: PyPDF extraction, matching, scoring, and moving to pipeline.
3. **RECRUITMENT PIPELINE**: Kanban functionality with snake_case matching properties across cards.
4. **INTERVIEW BOT**: Link generation, token routing, and score capture fully wired.
5. **EMPLOYEE MANAGEMENT (HR view)**: Live API wired, caching working.
6. **LEAVE MANAGEMENT (HR view)**: Nested schemas fixed, manager dashboard displaying accurately.
7. **ONBOARDING**: Status calculation and UI fully resolved.
8. **ADMIN DASHBOARD & PAYROLL**: Correctly rendering charts, total logic uses accurate properties.

**⚠️ PARTIALLY WORKING:**
*(none)*

**❌ COMPLETELY BROKEN:**
*(none)*

**🔗 PIPELINE GAPS:**
*(Resolved: All decoupled endpoints verified and API responses normalized)*

**Fix: Verified Gemini models + Groq fallback added.
3-tier AI: gemini-flash ? gemini-pro ? groq-llama3**
