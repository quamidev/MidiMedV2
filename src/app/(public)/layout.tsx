/**
 * Public Layout with SEO
 *
 * Layout wrapper for public routes with comprehensive SEO metadata,
 * OpenGraph tags, Twitter cards, and JSON-LD structured data.
 *
 * Created: 2026-02-10 - MV2-010 Login page UI
 * Updated: 2026-02-10 - MV2-053 Footer and SEO - Added comprehensive SEO metadata
 */

import type { Metadata } from 'next'
import Script from 'next/script'

// Force dynamic rendering for pages that use framer-motion
export const dynamic = 'force-dynamic'

// =============================================================================
// Metadata Configuration
// =============================================================================

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.midimed.com'

export const metadata: Metadata = {
  title: {
    default: 'MidiMed - Sistema de Gestion Medica para Clinicas',
    template: '%s | MidiMed',
  },
  description:
    'La plataforma todo-en-uno para gestion de consultorios medicos en Latinoamerica. Agenda citas, gestiona expedientes y genera resumenes con IA. 30 dias de prueba gratis.',
  keywords: [
    'sistema medico',
    'gestion clinica',
    'expediente electronico',
    'agenda medica',
    'software medico Guatemala',
    'historia clinica digital',
    'citas medicas',
    'consultorio medico',
    'SaaS medico',
    'IA medica',
  ],
  authors: [{ name: 'MidiMed' }],
  creator: 'MidiMed',
  publisher: 'MidiMed',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'es_GT',
    url: siteUrl,
    siteName: 'MidiMed',
    title: 'MidiMed - Sistema de Gestion Medica para Clinicas',
    description:
      'La plataforma todo-en-uno para gestion de consultorios medicos en Latinoamerica. Agenda citas, gestiona expedientes y genera resumenes con IA.',
    images: [
      {
        url: `${siteUrl}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'MidiMed - Sistema de Gestion Medica',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MidiMed - Sistema de Gestion Medica para Clinicas',
    description:
      'La plataforma todo-en-uno para gestion de consultorios medicos en Latinoamerica. 30 dias de prueba gratis.',
    images: [`${siteUrl}/images/og-image.png`],
    creator: '@midimed',
  },
  category: 'Healthcare Software',
}

// =============================================================================
// JSON-LD Structured Data
// =============================================================================

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MidiMed',
  description: 'Sistema de gestion medica para clinicas en Latinoamerica',
  url: siteUrl,
  logo: `${siteUrl}/images/logo.png`,
  sameAs: [
    'https://twitter.com/midimed',
    'https://www.linkedin.com/company/midimed',
    'https://www.facebook.com/midimed',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+502-2234-5678',
    contactType: 'customer service',
    availableLanguage: ['Spanish'],
    areaServed: ['GT', 'MX', 'CO', 'PE', 'CL', 'AR'],
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'GT',
    addressLocality: 'Ciudad de Guatemala',
  },
}

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'MidiMed',
  operatingSystem: 'Web',
  applicationCategory: 'HealthApplication',
  description:
    'Plataforma de gestion medica para clinicas. Incluye agenda de citas, expedientes electronicos, generacion de PDFs y resumenes con inteligencia artificial.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Prueba Gratuita',
      price: '0',
      priceCurrency: 'GTQ',
      description: '30 dias de prueba gratuita con acceso completo',
    },
    {
      '@type': 'Offer',
      name: 'Plan Basico',
      price: '799.99',
      priceCurrency: 'GTQ',
      priceValidUntil: '2027-12-31',
      description: 'Hasta 200 pacientes, 1 usuario',
    },
    {
      '@type': 'Offer',
      name: 'Plan Profesional',
      price: '1039.99',
      priceCurrency: 'GTQ',
      priceValidUntil: '2027-12-31',
      description: 'Pacientes ilimitados, hasta 5 usuarios, IA incluida',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '127',
    bestRating: '5',
    worstRating: '1',
  },
  featureList: [
    'Calendario de citas con arrastrar y soltar',
    'Expedientes medicos digitales',
    'Generacion de PDFs profesionales',
    'Resumenes con inteligencia artificial',
    'Gestion de equipo multiusuario',
    'Notificaciones en tiempo real',
    'Reportes y analiticas',
    'Soporte en espanol',
  ],
}

const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Que incluye la prueba gratuita?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La prueba gratuita de 30 dias incluye acceso completo a todas las funciones de MidiMed: calendario de citas, gestion de pacientes, expedientes medicos, generacion de PDFs, y resumenes con IA. No necesitas tarjeta de credito para comenzar.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Es seguro almacenar datos de pacientes?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutamente. MidiMed utiliza encriptacion de nivel bancario (AES-256) para todos los datos en reposo y en transito. Cumplimos con las normativas de proteccion de datos de salud.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuantos usuarios puedo agregar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Depende del plan: El plan Basico incluye 1 usuario, el plan Profesional permite hasta 5 usuarios, y el plan Empresarial ofrece usuarios ilimitados.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Ofrecen soporte tecnico?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Si, todos los planes incluyen soporte en espanol. El plan Profesional incluye soporte prioritario y el plan Empresarial cuenta con un gerente de cuenta dedicado.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Puedo migrar mis datos existentes?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Si, nuestro equipo de soporte puede ayudarte a migrar datos desde hojas de calculo (Excel, Google Sheets) o desde otros sistemas de forma gratuita.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Como funciona la facturacion?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La facturacion es mensual y se procesa automaticamente. Aceptamos tarjetas de credito y debito a traves de Recurrente, una pasarela de pago segura.',
      },
    },
  ],
}

// =============================================================================
// Layout Component
// =============================================================================

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script
        id="schema-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="schema-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <Script
        id="schema-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />

      {children}
    </>
  )
}
