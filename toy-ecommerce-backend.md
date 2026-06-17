# Toy E-Commerce — Backend Specification

Backend architecture, services, and optimization techniques. Pairs with the module spec file.

---

## TECH STACK

| Layer | Choice |
|---|---|
| Runtime | Node.js + Express (TypeScript) |
| Database | PostgreSQL 16 (Neon — serverless Postgres) |
| ORM | Prisma |
| Media Storage | Cloudflare R2 (S3-compatible) |
| Email / Notification | Brevo (transactional mail + SMS) |
| Payment Gateway | Razorpay |
| Shipping | Shiprocket |
| Auth | JWT (access + refresh) + OTP |
| Caching | In-memory LRU (v1) → Redis (v2 / Upstash) |

---

## 1. DATABASE — PostgreSQL 16 (Neon)

### Why Neon
- Serverless, autoscaling, scale-to-zero — good for low/variable traffic.
- Branching for dev/staging.
- Built-in connection pooling (use the **pooled connection string** for serverless/Express to avoid exhausting connections).

### Connection rules
- Use Neon **pooled** endpoint (`-pooler`) for the app.
- Use **direct** endpoint only for Prisma migrations.
- Set sensible pool size; never open a new client per request.

### Core Tables (high level)
- **users** — id, name, email, phone, password_hash, role (`customer` / `super_admin` / `sub_admin`), is_blocked, email_verified, created_at
- **addresses** — id, user_id, line1, line2, city, state, pincode, phone, is_default
- **categories** — id, name, slug, parent_id (nullable), is_active
- **brands** — id, name, slug
- **products** — id, title, slug, description, brand_id, category_id, age_group, base_price, discount_price, status, created_by, created_at
- **product_variants** — id, product_id, attributes (jsonb: color/size), sku, stock, price_override
- **product_images** — id, product_id, r2_key, url, position
- **carts / cart_items** — user_id; product_variant_id, quantity
- **wishlists** — user_id, product_id
- **orders** — id, user_id, address snapshot (jsonb), subtotal, discount, shipping, total, payment_status, order_status, coupon_id, created_at
- **order_items** — order_id, product_variant_id, title snapshot, price snapshot, quantity
- **payments** — id, order_id, razorpay_order_id, razorpay_payment_id, status, amount, method
- **shipments** — id, order_id, shiprocket_order_id, awb, courier, tracking_url, status
- **returns** — id, order_item_id, reason, status, refund_amount, refund_status
- **reviews** — id, user_id, product_id, rating, text, created_at
- **coupons** — id, code, type (flat/percent), value, min_order, expiry, usage_limit, used_count, is_active
- **banners** — id, r2_key, url, link, position, is_active
- **tickets / ticket_messages** — user_id, subject, status; ticket_id, sender, message
- **notifications** — id, user_id, type, payload, is_read
- **activity_logs** — id, actor_id, action, entity, entity_id, old_value (jsonb), new_value (jsonb), created_at

### Indexing
- Index every foreign key (user_id, product_id, order_id, etc.).
- Index search/filter columns: products(category_id, brand_id, status, base_price), orders(user_id, order_status, created_at).
- Use `slug` unique index for products/categories.
- Composite index where filtered together, e.g. products(category_id, status).
- Use `jsonb` GIN index only if querying inside variant attributes.

---

## 2. MEDIA STORAGE — Cloudflare R2

### Why R2
- S3-compatible API, **zero egress fees**, cheap, fast via Cloudflare CDN.

### Bucket structure (organized)
```
toystore-media/
├── products/
│   └── {productId}/{variantId or 'main'}/{uuid}.webp
├── banners/
│   └── {bannerId}/{uuid}.webp
├── categories/
│   └── {categoryId}/{uuid}.webp
├── invoices/
│   └── {orderId}.pdf
└── tickets/
    └── {ticketId}/{uuid}.{ext}
```

### Rules
- Store only the **R2 object key** in DB, build public URL at read time (or serve via CDN domain).
- Upload via **presigned URLs** — frontend uploads directly to R2, backend only signs. Reduces server load.
- Convert images to **WebP** + resize on upload (sharp) to cut size.
- Never expose R2 credentials to frontend.

---

## 3. NOTIFICATION — Brevo

- Use Brevo **transactional email API** (not SMTP blast) for: OTP, order placed/confirmed/shipped/delivered, return/refund updates, password reset.
- Use Brevo **templates** with variables (order id, name, items) — don't hardcode HTML in code.
- SMS/WhatsApp for OTP + order shipped/delivered.
- Send notifications **async** (queue/background job) so they never block the API response.
- Always log notification status in `notifications` table.

---

## 4. PAYMENT — Razorpay

### Flow
1. Customer places order → backend creates `razorpay_order` → returns order_id to frontend.
2. Frontend opens Razorpay checkout.
3. On success, frontend sends payment_id + signature → backend **verifies signature** (HMAC SHA256 with secret).
4. On verify success → mark order `paid`, trigger shipment + notification.
5. Also handle **webhook** (`payment.captured`, `payment.failed`) as source of truth — don't trust frontend alone.

### Rules
- Verify signature server-side, always.
- Keys in env vars, never in frontend.
- Support COD as a separate path (no Razorpay).
- Idempotency: ignore duplicate webhook events (check payment_id already processed).

---

## 5. SHIPPING — Shiprocket

- Authenticate to Shiprocket API → cache token (valid ~10 days, refresh before expiry).
- On order paid: create Shiprocket order → get AWB + courier → store in `shipments`.
- Poll/track via webhook or scheduled job → update `order_status`.
- Expose tracking_url to customer.
- Pincode serviceability check before checkout (optional v1).

---

## 6. AUTH

- JWT access token (short, ~15 min) + refresh token (long, httpOnly cookie).
- OTP via Brevo for signup/login verification — store hashed OTP with short expiry, rate-limit requests.
- Role checked via middleware: `super_admin` > `sub_admin` > `customer`.
- Owner-only routes guarded by extra middleware checking `role === 'super_admin'`.

---

# BACKEND OPTIMIZATION TECHNIQUES

## Caching
- **LRU in-memory cache** (e.g. `lru-cache`) for hot, rarely-changing data: categories, brands, banners, product detail, homepage.
- Set TTL (e.g. categories 1h, product 5–10 min).
- **Invalidate on write** — clear product cache when that product is edited.
- Move to Redis/Upstash in v2 for shared cache across instances.

## Pagination
- Never return full lists. Use **cursor-based pagination** (by created_at/id) for large/infinite-scroll lists (products, orders); offset/limit acceptable for admin tables.
- Default page size 20, cap at 100.
- Return `nextCursor` + `hasMore`.

## Debouncing (frontend → fewer API calls)
- Debounce **search** input (~300–400 ms) so each keystroke doesn't fire a request.
- Debounce filter changes before calling the API.

## Throttling / Rate Limiting
- Apply rate limiter (`express-rate-limit`) on: auth, OTP, search, payment endpoints.
- Throttle scroll-driven "load more" calls.
- Per-IP + per-user limits to prevent abuse.

## Query / DB Optimization
- **Select only needed columns** — avoid `SELECT *`.
- Avoid **N+1 queries** — use Prisma `include`/`select` or batched queries.
- Use **indexes** (see DB section).
- Use **transactions** for multi-step writes (order + items + payment + stock decrement).
- **Connection pooling** via Neon pooled endpoint.

## Async / Background Jobs
- Offload non-critical work (emails, invoice PDF gen, Shiprocket calls) to background jobs/queue so API responds fast.

## Response Optimization
- Enable **gzip/brotli compression**.
- Send only required fields to frontend (DTOs).
- Use **HTTP caching headers / ETag** for static-ish GET responses (categories, banners).

## Image Optimization
- WebP + resize on upload, serve via Cloudflare CDN, lazy-load on frontend.

## Stock Safety
- Decrement stock inside a **DB transaction with row lock** at order placement to avoid overselling on concurrent orders.

## Idempotency
- Idempotency keys on payment + order creation to avoid duplicate orders/charges.

## Logging & Monitoring
- Structured logs, error tracking (e.g. Sentry).
- Activity-log every admin write.

---

# ENV VARIABLES (reference)
```
DATABASE_URL (Neon pooled)
DIRECT_URL (Neon direct, migrations)
JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
R2_ACCOUNT_ID / R2_ACCESS_KEY / R2_SECRET_KEY / R2_BUCKET / R2_PUBLIC_URL
BREVO_API_KEY / BREVO_SENDER
RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET
SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD
```

---

*Backend Specification — June 2026.*
