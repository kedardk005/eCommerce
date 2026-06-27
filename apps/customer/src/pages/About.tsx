import React from 'react'
import PageContainer from '../components/PageContainer'

export const About: React.FC = () => {
  return (
    <PageContainer className="py-16 space-y-20 text-left animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/30 to-amber-100/50 border border-amber-100/40 p-8 sm:p-12 md:p-16 shadow-xs">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-amber-100/60 border border-amber-200/50 px-3 py-1 rounded-full text-xs font-heading font-bold text-amber-800 tracking-wider uppercase">
            Our Story
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-ink tracking-tight leading-tight">
            Handcrafted with love, built for generations.
          </h1>
          <p className="text-base sm:text-lg text-ink-muted leading-relaxed font-body">
            Welcome to Toy-n-Joy, where we bring back the magic of tactile play. Inspired by the simple joy of classic, natural toys, we craft premium wooden pieces designed to fire up young imaginations and stand the test of active childhood play.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/8">
          <svg width="350" height="350" viewBox="0 0 100 100" fill="currentColor" className="text-amber-600">
            <path d="M50 15 L85 45 L85 85 L15 85 L15 45 Z" />
          </svg>
        </div>
      </section>

      {/* Philosophy / Wooden Heritage Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-heading font-extrabold text-ink tracking-tight">
            Made from Sustainable, Organic Hardwoods
          </h2>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed font-body">
            Every toy at Toy-n-Joy starts its life in responsibly managed, certified forests. We work primarily with premium hardwoods like close-grained beechwood, smooth maple, and aromatic pine, selected for their natural antibacterial properties, gorgeous grain patterns, and exceptional durability.
          </p>
          <div className="space-y-4 pt-2">
            <div className="flex gap-4">
              <div className="flex-none w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-heading font-bold text-ink">Child-Safe Non-Toxic Finishes</h3>
                <p className="text-sm text-ink-muted font-body leading-relaxed">
                  We use only food-grade organic oils, natural beeswax, and water-based, solvent-free dyes. Rest easy knowing our toys are 100% safe to touch, hold, and explore.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-none w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v18" />
                  <path d="M3 12h18" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-heading font-bold text-ink">Zero Plastics Commitment</h3>
                <p className="text-sm text-ink-muted font-body leading-relaxed">
                  From toy components to our minimal packaging, we are dedicated to keeping plastics completely out of our products and out of our oceans.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="aspect-square bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col justify-end p-6 hover:bg-amber-500/20 transition-colors duration-200">
              <span className="text-3xl font-heading font-bold text-amber-700">100%</span>
              <span className="text-xs text-amber-900/70 uppercase tracking-widest font-heading font-semibold mt-1">Natural Wood</span>
            </div>
            <div className="aspect-[4/3] bg-primary/10 border border-primary/20 rounded-xl flex flex-col justify-end p-6 hover:bg-primary/20 transition-colors duration-200">
              <span className="text-3xl font-heading font-bold text-primary">Made in</span>
              <span className="text-xs text-primary/70 uppercase tracking-widest font-heading font-semibold mt-1">India</span>
            </div>
          </div>
          <div className="space-y-4 pt-8">
            <div className="aspect-[4/3] bg-secondary/10 border border-secondary/20 rounded-xl flex flex-col justify-end p-6 hover:bg-secondary/20 transition-colors duration-200">
              <span className="text-3xl font-heading font-bold text-secondary">Eco-Safe</span>
              <span className="text-xs text-secondary/70 uppercase tracking-widest font-heading font-semibold mt-1">Certified</span>
            </div>
            <div className="aspect-square bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col justify-end p-6 hover:bg-emerald-500/20 transition-colors duration-200">
              <span className="text-3xl font-heading font-bold text-emerald-700">Plastic-Free</span>
              <span className="text-xs text-emerald-900/70 uppercase tracking-widest font-heading font-semibold mt-1">Packaging</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-heading font-extrabold text-ink tracking-tight">Our Core Values</h2>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed font-body">
            At Toy-n-Joy, our mission goes beyond making beautiful products. We shape experiences that foster growth, connection, and appreciation for craftsmanship.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="card-workshop p-8 space-y-4 border-b-[4px] border-primary">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-heading font-bold text-ink">Absolute Safety</h3>
            <p className="text-sm text-ink-muted leading-relaxed font-body">
              Every edge is meticulously hand-sanded to buttery smoothness. Every batch undergoes strict drop, bite, and chemical safety testing.
            </p>
          </div>

          <div className="card-workshop p-8 space-y-4 border-b-[4px] border-secondary">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="text-lg font-heading font-bold text-ink">Honest Pricing</h3>
            <p className="text-sm text-ink-muted leading-relaxed font-body">
              By working directly with master artisans and shipping straight from our workshops, we bring premium wood toys without high retail markups.
            </p>
          </div>

          <div className="card-workshop p-8 space-y-4 border-b-[4px] border-emerald-500">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="text-lg font-heading font-bold text-ink">Open-Ended Play</h3>
            <p className="text-sm text-ink-muted leading-relaxed font-body">
              No batteries, screen times, or flashing lights. Our toys empower kids to dictate the rules, cultivating creative problem solving and active learning.
            </p>
          </div>
        </div>
      </section>

      {/* Safety & Care Section */}
      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-12 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-3">
          <h2 className="text-2xl font-heading font-bold text-ink">Wooden Toy Care</h2>
          <p className="text-xs text-ink-muted uppercase tracking-widest font-heading font-semibold">How to maintain the magic</p>
        </div>
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Simple Cleaning
            </h3>
            <p className="text-ink-muted font-body leading-relaxed text-xs sm:text-sm">
              Use a slightly damp cloth with mild soap to wipe surface dirt. Avoid soaking wood toys in water or running them through a dishwasher.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Disinfecting
            </h3>
            <p className="text-ink-muted font-body leading-relaxed text-xs sm:text-sm">
              Use a mixture of white vinegar and water for natural, safe sanitation. Spray lightly, wipe immediately, and let air-dry.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Rejuvenating Wood
            </h3>
            <p className="text-ink-muted font-body leading-relaxed text-xs sm:text-sm">
              Every few months, apply a tiny drop of olive oil, coconut oil, or food-grade beeswax to polish and refresh the natural grain.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Sunshine Rest
            </h3>
            <p className="text-ink-muted font-body leading-relaxed text-xs sm:text-sm">
              If toys get damp from active drooling, place them in dry, filtered sunlight for an hour. Direct heat should be avoided.
            </p>
          </div>
        </div>
      </section>
    </PageContainer>
  )
}

export default About
