import React, { useState } from 'react'
import PageContainer from '../components/PageContainer'

interface FaqItem {
  question: string
  answer: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What types of wood are used for the toys?',
    answer: 'All our toys are handcrafted using sustainably sourced premium woods, including beechwood, maple, pine, walnut, and cherrywood. We choose specific wood types based on durability and weight parameters suited for childhood play.'
  },
  {
    question: 'Are the paints and varnishes child-safe?',
    answer: 'Absolutely. We use certified non-toxic, organic, water-based food-safe dyes and natural linseed oils. Your little ones can play, chew, and teething safely without contact with chemical solvents or heavy metals.'
  },
  {
    question: 'Do you offer free shipping?',
    answer: 'Yes! We offer free standard delivery on all orders above ₹500. For orders below ₹500, we charge a flat estimated delivery fee of ₹50.'
  },
  {
    question: 'What is your return and exchange policy?',
    answer: 'We offer a 30-day return window. If you are not completely satisfied with your purchase, you can raise a return request through your profile settings for unused items in their original packaging.'
  },
  {
    question: 'How should I clean and maintain wooden toys?',
    answer: 'Wipe them gently with a damp organic cloth and mild soapy water, then air dry. Never soak or submerge wooden toys in water, as this causes the natural fibers to swell and warp.'
  },
  {
    question: 'Can I cancel or modify my order?',
    answer: 'Orders can be cancelled directly from the "My Orders" panel as long as the status is "placed" or "confirmed". Once packed or shipped, cancellation is not possible.'
  },
  {
    question: 'Do you support custom engraving or personalization?',
    answer: 'Yes! Selected collections offer engraving options. Please raise a support ticket or contact our help desk via WhatsApp to submit custom order requests.'
  }
]

export const Help: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <PageContainer className="space-y-8 pb-16 max-w-3xl">
      <div className="text-left space-y-1">
        <span className="text-xs uppercase font-heading tracking-widest text-ink-muted font-bold block">Cabin Support</span>
        <h1 className="text-3xl sm:text-4xl font-heading mb-1 text-ink select-none font-bold">Help & FAQ</h1>
        <p className="text-ink-muted font-body text-sm sm:text-base">Find quick answers to common questions about our handcrafted toys.</p>
      </div>

      {/* Accordion FAQ Block */}
      <div className="space-y-4 text-left">
        {FAQ_ITEMS.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div key={index} className="card-workshop overflow-hidden shadow-xs border-b-[2px] border-border/60">
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full p-5 flex justify-between items-center text-left hover:bg-bg/10 transition duration-150 focus:outline-none"
              >
                <span className="font-heading font-bold text-sm sm:text-base text-ink select-none">
                  {faq.question}
                </span>
                <span className="text-xl text-ink-muted font-bold select-none">{isOpen ? '−' : '+'}</span>
              </button>
              
              {isOpen && (
                <div className="p-5 bg-bg/25 border-t border-border/60 text-xs sm:text-sm font-body text-ink leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Contact information widgets */}
      <section className="card-workshop p-6 bg-surface border-b-[3px] border-primary shadow-xs space-y-4 text-left">
        <h3 className="text-lg sm:text-xl font-heading text-ink font-bold border-b border-border/40 pb-2">Still have questions?</h3>
        <p className="text-sm font-body text-ink">
          Our customer service team is here to assist you. Chat with us directly or send an email.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 select-none">
          <a
            href="https://wa.me/917041777659?text=Hello%20Toy%20n%20Joy,%20I%20have%20an%20inquiry%20regarding%20wooden%20toys."
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-border rounded-xl bg-accent-teal/5 hover:bg-accent-teal/10 border-b-[2px] border-b-accent-teal/30 transition flex items-center space-x-3 active:translate-y-[1px]"
          >
            <span className="text-2xl">💬</span>
            <div>
              <span className="font-heading font-bold text-ink block text-sm sm:text-base">WhatsApp Chat</span>
              <span className="text-xs text-ink-muted font-body mt-0.5 block">Instant message with support team.</span>
            </div>
          </a>

          <a
            href="mailto:toynjoy.online@gmail.com"
            className="p-4 border border-border rounded-xl bg-accent-blue/5 hover:bg-accent-blue/10 border-b-[2px] border-b-accent-blue/30 transition flex items-center space-x-3 active:translate-y-[1px] group"
          >
            <span className="text-2xl">✉️</span>
            <div>
              <span className="font-heading font-bold text-ink block text-sm sm:text-base group-hover:text-primary transition-colors">Email Support</span>
              <span className="text-xs text-ink-muted font-body mt-0.5 block">toynjoy.online@gmail.com (response in 24h).</span>
            </div>
          </a>
        </div>
      </section>
    </PageContainer>
  )
}

export default Help
