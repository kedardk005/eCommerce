# Toy E-Commerce — Module Specification

Single-seller toy store. Three role contexts: **Super Owner (Admin)**, **Sub Admin**, **Customer (guest-first)**.
This document defines all modules and their fields/actions only. No styling, no page flow.

---

## ROLES OVERVIEW

| Role | Access |
|---|---|
| **Super Owner (Admin)** | Everything: all analytics, revenue, activity logs, manage sub-admin account, financial & system settings. Can do all Sub Admin actions too. |
| **Sub Admin** | All operational work: catalog, inventory, orders, dispatch, support, returns, marketing, accounts. Blocked from: managing admin accounts, payment keys, system settings. |
| **Customer** | Guest-first. Browse/search/view without login. Login required only at action points (buy, cart, checkout, wishlist, orders, reviews). |

Permission model: simple role flag (`super_admin` / `sub_admin`). No granular staff permissions in v1.

---

# CUSTOMER SIDE MODULES

## 1. Authentication
- Signup (name, email, phone, password)
- Login (email/phone + password, OTP option)
- Email/phone verification (OTP)
- Forgot/reset password
- Logout
- Guest browsing allowed; login triggered only on: Add to Cart, Buy Now, Wishlist, Checkout, Orders, Reviews

## 2. Home / Catalog (no login)
- Banners / featured sections
- Category listing (e.g. Action Figures, Educational, Soft Toys, Outdoor)
- Product grid with pagination
- Search bar (by name, category, brand)
- Filters: category, age group, brand, price range, rating, in-stock
- Sort: price (low/high), newest, popularity, rating

## 3. Product Detail (no login)
- Multiple images
- Title, description, price, discount price
- Variants (e.g. color, size, age group) — each with own stock
- Stock status (in stock / out of stock)
- Age group / brand / category tags
- Average rating + review list
- Add to Cart / Buy Now / Add to Wishlist (login triggered here)
- Related/similar products

## 4. Cart (login required)
- Add/remove items, change quantity
- Show price, quantity, subtotal per item
- Cart total, discount, delivery estimate
- Apply coupon
- Proceed to checkout

## 5. Wishlist (login required)
- Add/remove products
- Move item from wishlist to cart

## 6. Checkout (login required)
- Address book (add/edit/select delivery address)
- Order summary (items, quantity, price, coupon, total)
- Payment method selection (online / COD)
- Place order

## 7. Orders (login required)
- Order list with status (placed, confirmed, packed, shipped, out for delivery, delivered, cancelled)
- Order detail (items, address, payment, tracking)
- Cancel order (if allowed by status)
- Download invoice
- Reorder

## 8. Returns / Refunds (login required)
- Request return/replacement for delivered item (reason, quantity)
- Return status tracking
- Refund status

## 9. Reviews & Ratings (login required)
- Add rating (1–5) + text review on purchased product
- Edit/delete own review
- View all reviews on a product

## 10. Help / Support (login required for raising)
- FAQ (public)
- Raise support ticket (subject, message, optional order reference)
- View ticket status + replies
- Contact info / WhatsApp link

## 11. Customer Profile (login required)
- View/edit personal info
- Manage addresses
- Change password
- Notification preferences

## 12. Notifications (customer)
- In-app + email/SMS/WhatsApp for: order placed, confirmed, shipped, delivered, return update, refund update

---

# ADMIN PANEL MODULES
(Shared by Super Owner + Sub Admin unless marked **Owner-only**)

## 13. Dashboard & Analytics
- Sales summary (today, week, month, total)
- Revenue, order count, average order value
- Top-selling products
- Low-stock alerts
- Recent orders
- Pending returns / open tickets count
- **Owner-only:** full revenue breakdown, profit, staff (sub-admin) activity overview

## 14. Activity / Audit Log
- Every admin action logged: who, what action, which entity, old value → new value, timestamp
- Filter by user, action type, date
- **Owner primarily views this** to monitor sub-admin work

## 15. Account & Role Management — **Owner-only**
- Create/edit/disable Sub Admin account
- View admin accounts list
- Reset sub-admin password

## 16. Product / Catalog Management
- Product list (search, filter, pagination)
- Add product: title, description, price, discount, images, category, brand, age group, variants, stock per variant, tags, status (active/inactive)
- Edit / delete product
- Bulk upload (CSV) — optional
- Category management (add/edit/delete categories)
- Brand management

## 17. Inventory Management
- Stock view per product/variant
- Update stock
- Low-stock threshold + alerts

## 18. Order Management
- Order list (filter by status, date, customer)
- Order detail (items, customer, address, payment status)
- Update order status (confirm → pack → ship → deliver)
- Cancel order (with reason)
- Generate/print invoice
- Generate shipping label / dispatch info

## 19. Returns / Refunds Management
- List of return requests
- Approve/reject return (reason)
- Update return status
- Process refund (mark refunded, amount)

## 20. Customer Management
- Customer list (search by name/email/phone)
- Customer detail (profile, order history, addresses)
- Block/unblock customer

## 21. Support / Ticket Management
- Ticket list (open, in progress, resolved)
- View ticket + customer message
- Reply to ticket
- Change ticket status

## 22. Marketing
- Coupons: create/edit/delete (code, type — flat/percent, value, min order, expiry, usage limit, active toggle)
- Banners: add/edit/delete homepage banners (image, link, position, active)
- Campaigns: send email/push/WhatsApp promo (title, message, target audience)

## 23. Accounts / Finance
- Payment reports (orders paid, method-wise)
- Settlement report
- Refund processing list
- Sales / GST report (export)
- **Owner-only:** payment gateway keys, bank/settlement settings

## 24. CMS / Content
- Static pages: About, Contact, Terms, Privacy, Return Policy, FAQ
- Edit page content

## 25. Settings
- Store info (name, logo, contact)
- Shipping config (charges, free-ship threshold)
- Tax config
- Notification templates
- **Owner-only:** payment gateway, system-level settings

---

# SYSTEM / BACKEND SERVICE MODULES
(Not UI pages — supporting services the frontend connects to)

## 26. Payment Service
- Online payment (Razorpay) + COD
- Payment status webhook handling
- Refund API

## 27. Shipping Service
- Shipping integration (Shiprocket/Delhivery) — optional v2
- Tracking number generation

## 28. Notification Service
- Email (Brevo), SMS, WhatsApp — order & account events

## 29. Media Storage
- Product/banner image upload & serve (S3 / Cloudinary)

## 30. Search Service
- Product search + filter engine (DB-based v1)

---

# KEY RULES FOR FRONTEND AGENT
1. Customer can browse/search/view products fully **without login**. Login modal/redirect triggers only on action (cart, buy, wishlist, checkout, orders, reviews, support).
2. Admin panel has **two role levels** — render Owner-only modules (15, parts of 13/23/25) only when role is `super_admin`. Sub Admin sees all operational modules.
3. Every admin write-action should call the activity-log endpoint.
4. Build admin panel and customer site as separate sections/apps sharing the same backend.
