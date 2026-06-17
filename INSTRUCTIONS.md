# INSTRUCTIONS — Toy E-Commerce Build

This file is the entry prompt for the build agent. Read it fully before starting.

## What this project is
A single-seller toy e-commerce store. Three role contexts: **Super Owner (Admin)**, **Sub Admin**, and **Customer (guest-first)**.

## Reference files (read these first, in order)
1. `toy-ecommerce-modules.md` — all frontend modules, fields, actions, and role rules.
2. `toy-ecommerce-backend.md` — backend stack, services, data model, API design, and optimization techniques.

Treat those two files as the source of truth. Do not invent modules or change the stack without being asked.

## Build order
1. **Frontend first.** Build the customer site and admin panel UI based on `toy-ecommerce-modules.md`.
2. Keep the frontend **organized** — clear folder structure, reusable components, separation between customer app and admin app.
3. **Color scheme:** the project owner will attach a color/style spec along with these files. Use that. If no color spec is attached yet, use neutral placeholder tokens (CSS variables) so colors can be swapped in one place later — do not hardcode colors throughout.
4. After frontend, move to backend per `toy-ecommerce-backend.md`.

## Phased approach (important)
Do NOT build everything at once. Follow `PHASES.md`. Complete one phase, update the tracking files, then continue.

## Session & tracking files (keep these updated)
- `SESSION.md` — at the start of each working session, read it for context; at the end, append what you did this session.
- `PROJECT_STATUS.md` — after finishing any task, update what is done and what is pending.
- `MEMORY.md` — shared long-term context. Any new agent joining the project must read this first. Keep it current.

## General rules
- Validate inputs, follow the optimization techniques in the backend MD (caching, pagination, rate limiting, etc.).
- Customer can browse/search without login; login triggers only at action points (cart, buy, checkout, wishlist, orders, reviews).
- Admin panel has two role levels — render owner-only modules only for `super_admin`.
- Ask the owner if anything in the reference files is unclear rather than guessing.

---
*Project instructions — June 2026.*
