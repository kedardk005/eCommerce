# E2E Manual Verification Checklist

This document serves as the single consolidated reference for verifying flows that cannot easily be automated locally (due to external sandbox dependencies, cryptographic webhooks, or UI verification needs).

---

## 1. Razorpay Gateway & Webhooks (Payments)

- [ ] **Modal Injection**: Add items to cart, proceed to Checkout, select **Online Payment**, and click **Place Order**. Confirm the Razorpay standard payment modal overlays the application without issues.
- [ ] **Successful Payment Flow**:
  - In the modal, use standard Razorpay test credentials (e.g., test card numbers, dummy UPI id).
  - Submit the payment and confirm that you are redirected to the order success screen.
  - Check the database to confirm that the `Payment` record status is updated to `paid` and the `Order` status transitions to `confirmed`.
- [ ] **Failed Payment Handling**:
  - Trigger a payment cancellation or failure in the Razorpay sandbox modal.
  - Verify that the modal closes gracefully, showing a clear inline error in the customer app (e.g., "Payment failed. Please retry"), and that the cart contents are preserved.
- [ ] **Webhook Idempotency & Delivery**:
  - Deliver a duplicate `payment.captured` webhook payload to `POST /api/payments/webhook`.
  - Verify that the server returns `200 { status: 'ignored' }` or ignores the duplicate capture transaction without duplicating the checkout total.

---

## 2. Shiprocket Shipping & Fulfillment

- [ ] **Automated Booking on Status Shift**:
  - Access an order in the administrative panel (`apps/admin`) with `placed` or `confirmed` status.
  - Transition the order status to `packed`.
  - Verify in the server logs that a Shiprocket shipment order is created and a mock/sandbox Air Waybill (AWB) is auto-assigned.
- [ ] **Manual Retry Booking**:
  - In `apps/admin` order details, click **Book Shipment** to manually retry booking for any failed status transfers.
  - Verify that a success alert is shown and shipment details are printed on-screen.
- [ ] **Live Courier Tracking updates**:
  - As a customer, view the order details timeline under `apps/customer/orders/:id`.
  - Confirm the timeline correctly displays mock tracker updates (e.g., "AWB Assigned", "Parcel Picked Up", "In Transit").
- [ ] **Webhook State Transition Priorities**:
  - Send custom Shiprocket webhook payloads to `POST /api/shiprocket/webhook` simulating transitions (`shipped` -> `delivered`).
  - Verify that status values update atomically and that backward status updates (e.g., receiving `shipped` after `delivered` was already written) are ignored.

---

## 3. Brevo Transactional Email Notifications

- [ ] **Account Security (Signup OTP)**:
  - Register a new account or request a password reset code.
  - Check the designated recipient inbox to verify that the email containing the 6-digit verification code is delivered using the correct HTML formatting.
- [ ] **Order Lifecycle Emails**:
  - Place a new order and verify receipt of the "Order Placed" transactional email.
  - Shift statuses in the admin dashboard and confirm emails are sent on transition stages: "Order Confirmed", "Order Shipped", "Order Delivered", and "Order Cancelled".
- [ ] **Support Ticket Activity**:
  - Send an admin reply to a ticket in `apps/admin/support`.
  - Check the customer's email inbox and verify the ticket update notification is received.
- [ ] **Notification Preference Gating**:
  - Access `apps/customer/profile`, disable Email notifications.
  - Trigger an order checkout or return status update.
  - Confirm that the email is skipped (logged as skipped in backend logs) and the database `NotificationPreference` settings are respected.

---

## 4. End-to-End User Flow Walkthroughs

### Customer App UI Flow (`apps/customer`)
- [ ] **Catalog & Filters**: Visit the catalog, search for a toy, filter by brand/price, and verify loader skeletons are shown before products load.
- [ ] **Cart & Coupon Validation**: Add products to cart, enter an invalid coupon code (confirm error warning is shown inline), enter a valid coupon code (confirm discount is subtracted from order total).
- [ ] **Checkout Validation**: Click place order, confirm CTA is disabled during request in-flight, and check redirections.
- [ ] **Support Tickets timeline**: Create a support query, type messages, check empty states, and verify buttons lock during submission.

### Admin App UI Flow (`apps/admin`)
- [ ] **Administrative Invite Flow**:
  - Log in as `super_owner` and invite a new staff member at `/accounts`.
  - Verify the setup link `/admin/set-password?token=...` email is received.
  - Complete the staff profile activation by setting a password and verifying role permissions.
- [ ] **Marketing Banners & Campaigns**:
  - Upload a slide image via the R2 direct presigned link flow and verify it renders instantly in the customer app's homepage slider.
  - In Campaigns tab, trigger a broadcast send and verify it logs simulation counts.
- [ ] **CMS Pages Updates**: Edit a static page's markdown and confirm changes are reflected in the customer app footer links immediately.
