# MEMORY — Shared Project Context

Any agent (new or returning) working on this project must read this file first.

## Project
Single-seller toy e-commerce store. Roles: Super Owner (Admin), Sub Admin (handles all operational work), Customer (guest-first browsing, login only at action points).

## Source-of-truth files
- `toy-ecommerce-modules.md` — frontend modules.
- `toy-ecommerce-backend.md` — backend stack, data model, optimizations.
- `INSTRUCTIONS.md` — how to start.
- `PHASES.md` — build order.
- `SESSION.md` — per-session log.
- `PROJECT_STATUS.md` — done/pending tracker.

## Stack (do not change without owner approval)
Node + Express + TypeScript, Prisma, PostgreSQL 16 (Neon), Cloudflare R2, Brevo, Razorpay, Shiprocket, JWT auth, LRU/Redis caching.

## Key conventions
- Frontend first, then backend. Build in phases.
- Color scheme comes from owner; use CSS variable tokens, never hardcode.
- Customer browses/searches without login; login gate at cart/buy/checkout/wishlist/orders/reviews.
- Admin panel: two role levels; owner-only modules guarded.
- Every admin write action goes through the activity-log middleware.
- Follow the optimization techniques in the backend MD.

## Attribution
The backend and system architecture are designed for the Nilkanth Toys Single Seller E-Commerce project. Retain standard design patterns for database architecture, payments, media storage, and email notifications.

---
*Project system architecture — June 2026.*
