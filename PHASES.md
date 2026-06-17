# PHASES — Build Plan

Build in phases. Finish one, update `PROJECT_STATUS.md` and `SESSION.md`, then move to the next. Do not skip ahead.

## Phase 0 — Setup
- Repo structure: separate `customer` and `admin` frontend areas + `backend` (or monorepo).
- Tooling, linting, env file template (`.env.example` from backend MD).
- Color tokens as CSS variables (placeholder until owner provides scheme).

## Phase 1 — Customer Frontend (guest-first, no backend yet / mock data)
- Home/Catalog, search, filters, sorting.
- Product detail page.
- Cart + Wishlist UI (login gate at action points).
- Checkout UI, Orders UI, Profile UI, Reviews, Help/Support UI.
- Auth screens (signup/login/OTP/reset) — UI only for now.

## Phase 2 — Admin Frontend (mock data)
- Dashboard & analytics layout.
- Product/catalog, inventory, orders, returns, customers, support, marketing, accounts, CMS, settings.
- Role-based rendering: owner-only vs sub-admin.
- Activity log view.

## Phase 3 — Backend Foundation
- Postgres 16 (Neon) + Prisma schema (all core tables from backend MD).
- Auth (JWT access/refresh, bcrypt), role middleware.
- Activity-log middleware.
- R2 storage service (presigned uploads, organized bucket structure).

## Phase 4 — Core Commerce Backend
- Product/catalog, inventory, cart, wishlist APIs.
- Orders + order items (transactional stock decrement with row lock).
- Razorpay integration (create order, verify signature, webhook).
- Coupons.

## Phase 5 — Fulfilment & Support
- Returns/refunds.
- Shiprocket shipping integration.
- Tickets/support.
- Brevo notifications (transactional + campaigns), async/background.

## Phase 6 — Optimization & Hardening
- LRU + Redis caching with invalidation.
- Cursor/keyset pagination on all lists.
- Rate limiting/throttling (auth, OTP, payment, webhooks).
- Indexing, N+1 cleanup, compression, HTTP cache headers.
- Security pass (webhook signature verify, input validation, secret handling).

## Phase 7 — Integration & Deploy
- Connect frontend to real APIs (remove mocks).
- Deploy backend (always-on), Neon, R2 + CDN.
- End-to-end test of full order + payment + shipping flow.

---
*Phase Plan — June 2026.*
