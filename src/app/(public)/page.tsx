/**
 * Landing Page
 *
 * Main marketing landing page for MidiMed.
 * Composes all landing sections into a single scrollable page.
 *
 * Created: 2026-02-10 - MV2-050 Landing Page Hero
 */

import { LandingNav } from '@/components/landing/landing-nav'
import { HeroSection } from '@/components/landing/hero-section'
import { FeatureGrid } from '@/components/landing/feature-grid'
import { FeatureSections } from '@/components/landing/feature-sections'
import { BenefitsSection } from '@/components/landing/benefits-section'
import { ValueStripe } from '@/components/landing/value-stripe'
import { PricingSection } from '@/components/landing/pricing-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { FAQSection } from '@/components/landing/faq-section'
import { CTASection } from '@/components/landing/cta-section'
import { SupportSection } from '@/components/landing/support-section'
import { Footer } from '@/components/landing/footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <LandingNav />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Feature Grid - Quick Overview */}
        <FeatureGrid />

        {/* Detailed Feature Sections */}
        <FeatureSections />

        {/* Value Proposition Stripe */}
        <ValueStripe />

        {/* Benefits Section */}
        <BenefitsSection />

        {/* Pricing Section */}
        <PricingSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* FAQ */}
        <FAQSection />

        {/* Final CTA */}
        <CTASection />

        {/* Support / Contact */}
        <SupportSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
