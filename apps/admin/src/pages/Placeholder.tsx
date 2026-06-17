import React from 'react'
import { useLocation } from 'react-router-dom'

interface ModuleMeta {
  title: string
  icon: string
  description: string
  plannedFeatures: string[]
}

export const Placeholder: React.FC = () => {
  const location = useLocation()
  const path = location.pathname

  const getModuleMeta = (currentPath: string): ModuleMeta => {
    switch (currentPath) {
      case '/orders':
        return {
          title: 'Order Fulfillment Hub',
          icon: '🚚',
          description: 'Manage customer purchases, status state tracking, and invoice records.',
          plannedFeatures: [
            'Order list table with date, payment status, and order filters.',
            'Order progress lifecycle updates: confirm → pack → ship → deliver.',
            'Invoice PDF generation and printed copy downloading.',
            'Dispatch console: shipping label generation and Shiprocket AWB creation.'
          ]
        }
      case '/products':
        return {
          title: 'Toy Catalog Manager',
          icon: '🧸',
          description: 'Configure products, descriptions, age groups, pricing, and variants.',
          plannedFeatures: [
            'Catalog listings grid featuring filters, text search, and pagination.',
            'Interactive Product Builder: set variant models, images, and prices.',
            'CSV Bulk upload templates for mass catalog additions.',
            'Categories and Brands editing lists.'
          ]
        }
      case '/inventory':
        return {
          title: 'Inventory Control Console',
          icon: '📦',
          description: 'Replenish stock levels, track warnings, and handle low thresholds.',
          plannedFeatures: [
            'Stock counts table grouped by active products and variants.',
            'Threshold alerts panel triggering low-stock indicators.',
            'Pessimistic database transaction updates preventing double-selling.',
            'Bulk stock replenishment sheets.'
          ]
        }
      case '/returns':
        return {
          title: 'Returns & Refunds Manager',
          icon: '🔄',
          description: 'Process return requests, verify product issues, and initiate refunds.',
          plannedFeatures: [
            'Return requests list with customer upload notes and reason tags.',
            'Approve / Reject decision cards.',
            'Razorpay API direct refund initiation.',
            'Inventory restock toggles upon receiving return items.'
          ]
        }
      case '/customers':
        return {
          title: 'Customer Directory',
          icon: '👥',
          description: 'Inspect profiles, purchase counts, active order threads, and account status.',
          plannedFeatures: [
            'Customer details listing with search tools (name/email/phone).',
            'Order histories log with total spending indicators.',
            'Admin block / unblock toggles preventing malicious users.',
            'Saved address book reviews.'
          ]
        }
      case '/support':
        return {
          title: 'Support Desk Tickets',
          icon: '💬',
          description: 'Respond to customer support requests and resolve technical queries.',
          plannedFeatures: [
            'Help Ticket rows categorized by status (open, in progress, resolved).',
            'Detailed historical message bubbles with editor response box.',
            'Link tickets with orders database for fast order tracing.',
            'System email template integration.'
          ]
        }
      case '/marketing':
        return {
          title: 'Marketing & Promotions Console',
          icon: '📢',
          description: 'Configure coupons, construct campaigns, and edit banners.',
          plannedFeatures: [
            'Coupon builder: set flat/percentage discount, min order limit, and expiries.',
            'Home banner layouts manager supporting link target configurations.',
            'Newsletter and WhatsApp campaign broadcasts.',
            'Promotion analytics metrics.'
          ]
        }
      case '/finance':
        return {
          title: 'Finance & Accounts Center',
          icon: '💵',
          description: 'Download sales summaries, payment method reports, and GST logs.',
          plannedFeatures: [
            'Payment gateway settlements dashboard showing Razorpay captures.',
            'Sales GST reports exporter (CSV/Excel downloads).',
            'Refund tracking database.',
            'Owner-only: Payment credentials and bank account setup panels.'
          ]
        }
      case '/cms':
        return {
          title: 'CMS Page Content Editor',
          icon: '📝',
          description: 'Edit static information sheets, FAQs, and privacy documentation.',
          plannedFeatures: [
            'Rich text page editors for About Us, Contact Us, and Help Pages.',
            'FAQ accordion list editor.',
            'Preview panels to test mobile views before publishing.',
            'SEO meta description overrides.'
          ]
        }
      case '/accounts':
        return {
          title: 'Roles & Staff Accounts',
          icon: '🔑',
          description: 'Manage staff credentials, reset sub-admin passwords, and assign permissions.',
          plannedFeatures: [
            'Staff listing directory displaying login emails and roles.',
            'Sub-admin creation wizard (name, email, password fields).',
            'Staff session logs detailing active session times.',
            'Access suspension buttons.'
          ]
        }
      case '/settings':
        return {
          title: 'Global Settings Platform',
          icon: '⚙️',
          description: 'Manage store parameters, tax structures, shipping rules, and email targets.',
          plannedFeatures: [
            'Store metadata editor (name, logo image, physical contacts).',
            'Shipping config settings: set base rates and free-ship thresholds.',
            'GST/Tax percentage setups.',
            'Owner-only: API token management and third-party integrations.'
          ]
        }
      default:
        return {
          title: 'Module Under Construction',
          icon: '🛠️',
          description: 'This operational view is currently scheduled for subsequent phases.',
          plannedFeatures: [
            'Interactive client-side data representations.',
            'Wired endpoints linked to Express.js REST controllers.',
            'Database schemas integrated with PostgreSQL and Prisma ORM.'
          ]
        }
    }
  }

  const meta = getModuleMeta(path)

  return (
    <div className="bg-surface border border-border p-8 rounded shadow-sm max-w-2xl mx-auto my-6 text-left">
      <div className="flex items-center space-x-4 border-b border-border pb-5 mb-5">
        <span className="text-4xl select-none">{meta.icon}</span>
        <div>
          <span className="text-[10px] font-heading font-extrabold text-accent-yellow bg-secondary px-2 py-0.5 rounded uppercase tracking-wider">
            Phase 3 Planned Integration
          </span>
          <h2 className="text-xl font-heading font-extrabold text-ink mt-1">{meta.title}</h2>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs text-ink">{meta.description}</p>

        <div className="bg-bg border border-border p-4 rounded space-y-2">
          <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
            📋 What will be implemented:
          </h3>
          <ul className="space-y-1.5 text-xs text-ink-muted list-disc list-inside">
            {meta.plannedFeatures.map((feature, idx) => (
              <li key={idx} className="leading-relaxed">
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[10px] text-ink-muted italic">
          * Dynamic backend logic and write transactions for this module are gated until the backend APIs are initialized in Phase 3.
        </p>
      </div>
    </div>
  )
}

export default Placeholder
