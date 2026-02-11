/**
 * Medical Record PDF Generation
 *
 * Generates professional SOAP-format PDFs for medical records using @react-pdf/renderer.
 * PDFs include clinic branding, patient info, vital signs, diagnosis, medications, and follow-up.
 *
 * Created: 2026-02-10 - MV2-032 PDF Generation Service
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  renderToBuffer,
} from '@react-pdf/renderer'

import type { SoapSummary } from '@/lib/ai/appointment-summary'

/**
 * Clinic/tenant information for PDF header.
 */
interface ClinicInfo {
  name: string
  address?: string | null
  phone?: string | null
  email?: string | null
  logoUrl?: string | null
}

/**
 * Input for PDF generation.
 */
interface GenerateMedicalRecordPdfInput {
  soap: SoapSummary
  clinic: ClinicInfo
  recordId: string
  patientId: string
}

/**
 * PDF styles following professional medical document conventions.
 * Uses blue/navy color scheme with clear hierarchy.
 */
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  // Header section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a5f',
    paddingBottom: 15,
  },
  headerLeft: {
    flexDirection: 'column',
    flex: 1,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  clinicInfo: {
    fontSize: 9,
    color: '#4a5568',
    lineHeight: 1.4,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  // Document title
  documentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a5f',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Section container
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    textTransform: 'uppercase',
  },
  sectionContent: {
    paddingLeft: 8,
  },
  // Info rows
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4a5568',
    width: 100,
  },
  value: {
    fontSize: 9,
    color: '#2d3748',
    flex: 1,
  },
  // SOAP content
  soapLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 3,
  },
  soapContent: {
    fontSize: 9,
    color: '#2d3748',
    lineHeight: 1.5,
    marginBottom: 10,
    paddingLeft: 10,
  },
  // Medications list
  medicationItem: {
    fontSize: 9,
    color: '#2d3748',
    marginBottom: 2,
    paddingLeft: 15,
  },
  bullet: {
    fontSize: 9,
    color: '#1e3a5f',
  },
  // Vital signs grid
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  vitalItem: {
    width: '50%',
    flexDirection: 'row',
    marginBottom: 4,
  },
  vitalLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4a5568',
    width: 90,
  },
  vitalValue: {
    fontSize: 9,
    color: '#2d3748',
  },
  // Follow-up box
  followUpBox: {
    backgroundColor: '#f7fafc',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  followUpTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 5,
  },
  followUpText: {
    fontSize: 9,
    color: '#2d3748',
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#718096',
  },
  // Signature line
  signatureSection: {
    marginTop: 30,
    alignItems: 'flex-end',
  },
  signatureLine: {
    width: 200,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#4a5568',
    textAlign: 'right',
  },
})

/**
 * Medical Record PDF Document Component.
 */
function MedicalRecordDocument({
  soap,
  clinic,
}: {
  soap: SoapSummary
  clinic: ClinicInfo
}) {
  const hasVitals =
    soap.signosVitales.peso ||
    soap.signosVitales.talla ||
    soap.signosVitales.presionArterial ||
    soap.signosVitales.temperatura

  const hasMedications = soap.recetas && soap.recetas.length > 0

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'LETTER', style: styles.page },
      // Header with clinic info
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          { style: styles.headerLeft },
          React.createElement(Text, { style: styles.clinicName }, clinic.name),
          clinic.address &&
            React.createElement(
              Text,
              { style: styles.clinicInfo },
              clinic.address
            ),
          clinic.phone &&
            React.createElement(
              Text,
              { style: styles.clinicInfo },
              `Tel: ${clinic.phone}`
            ),
          clinic.email &&
            React.createElement(Text, { style: styles.clinicInfo }, clinic.email)
        ),
        clinic.logoUrl &&
          React.createElement(Image, { style: styles.logo, src: clinic.logoUrl })
      ),

      // Document title
      React.createElement(
        Text,
        { style: styles.documentTitle },
        'Resumen de Consulta Medica'
      ),

      // Patient Information
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          Text,
          { style: styles.sectionTitle },
          'Datos del Paciente'
        ),
        React.createElement(
          View,
          { style: styles.sectionContent },
          React.createElement(
            View,
            { style: styles.infoRow },
            React.createElement(Text, { style: styles.label }, 'Paciente:'),
            React.createElement(Text, { style: styles.value }, soap.paciente.nombre)
          ),
          React.createElement(
            View,
            { style: styles.infoRow },
            React.createElement(Text, { style: styles.label }, 'Sexo:'),
            React.createElement(Text, { style: styles.value }, soap.paciente.sexo)
          ),
          soap.paciente.edad &&
            React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(Text, { style: styles.label }, 'Edad:'),
              React.createElement(
                Text,
                { style: styles.value },
                `${soap.paciente.edad} años`
              )
            ),
          React.createElement(
            View,
            { style: styles.infoRow },
            React.createElement(Text, { style: styles.label }, 'Fecha:'),
            React.createElement(Text, { style: styles.value }, soap.visita.fecha)
          ),
          React.createElement(
            View,
            { style: styles.infoRow },
            React.createElement(Text, { style: styles.label }, 'Atendido por:'),
            React.createElement(Text, { style: styles.value }, soap.doctora)
          )
        )
      ),

      // Vital Signs (if present)
      hasVitals &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(
            Text,
            { style: styles.sectionTitle },
            'Signos Vitales'
          ),
          React.createElement(
            View,
            { style: styles.vitalsGrid },
            soap.signosVitales.peso &&
              React.createElement(
                View,
                { style: styles.vitalItem },
                React.createElement(Text, { style: styles.vitalLabel }, 'Peso:'),
                React.createElement(
                  Text,
                  { style: styles.vitalValue },
                  soap.signosVitales.peso
                )
              ),
            soap.signosVitales.talla &&
              React.createElement(
                View,
                { style: styles.vitalItem },
                React.createElement(Text, { style: styles.vitalLabel }, 'Talla:'),
                React.createElement(
                  Text,
                  { style: styles.vitalValue },
                  soap.signosVitales.talla
                )
              ),
            soap.signosVitales.presionArterial &&
              React.createElement(
                View,
                { style: styles.vitalItem },
                React.createElement(
                  Text,
                  { style: styles.vitalLabel },
                  'Presion Arterial:'
                ),
                React.createElement(
                  Text,
                  { style: styles.vitalValue },
                  soap.signosVitales.presionArterial
                )
              ),
            soap.signosVitales.temperatura &&
              React.createElement(
                View,
                { style: styles.vitalItem },
                React.createElement(
                  Text,
                  { style: styles.vitalLabel },
                  'Temperatura:'
                ),
                React.createElement(
                  Text,
                  { style: styles.vitalValue },
                  soap.signosVitales.temperatura
                )
              )
          )
        ),

      // SOAP Notes
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Notas SOAP'),
        React.createElement(
          View,
          { style: styles.sectionContent },
          // Motivo
          React.createElement(
            Text,
            { style: styles.soapLabel },
            'Motivo de Consulta'
          ),
          React.createElement(
            Text,
            { style: styles.soapContent },
            soap.visita.motivo
          ),
          // Subjetivo
          React.createElement(
            Text,
            { style: styles.soapLabel },
            'S - Subjetivo'
          ),
          React.createElement(
            Text,
            { style: styles.soapContent },
            soap.visita.subjetivo
          ),
          // Objetivo
          React.createElement(Text, { style: styles.soapLabel }, 'O - Objetivo'),
          React.createElement(
            Text,
            { style: styles.soapContent },
            soap.visita.objetivo
          ),
          // Evaluacion
          React.createElement(
            Text,
            { style: styles.soapLabel },
            'A - Evaluacion'
          ),
          React.createElement(
            Text,
            { style: styles.soapContent },
            soap.visita.evaluación
          ),
          // Plan
          React.createElement(Text, { style: styles.soapLabel }, 'P - Plan'),
          React.createElement(
            Text,
            { style: styles.soapContent },
            soap.visita.plan
          )
        )
      ),

      // Medications (if present)
      hasMedications &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(
            Text,
            { style: styles.sectionTitle },
            'Medicamentos Recetados'
          ),
          React.createElement(
            View,
            { style: styles.sectionContent },
            ...soap.recetas.map((med, index) =>
              React.createElement(
                Text,
                { key: index, style: styles.medicationItem },
                `• ${med}`
              )
            )
          )
        ),

      // Follow-up instructions
      soap.seguimiento &&
        React.createElement(
          View,
          { style: styles.followUpBox },
          React.createElement(
            Text,
            { style: styles.followUpTitle },
            'Instrucciones de Seguimiento'
          ),
          React.createElement(
            Text,
            { style: styles.followUpText },
            soap.seguimiento
          )
        ),

      // Signature section
      React.createElement(
        View,
        { style: styles.signatureSection },
        React.createElement(View, { style: styles.signatureLine }),
        React.createElement(Text, { style: styles.signatureLabel }, soap.doctora),
        React.createElement(
          Text,
          { style: styles.signatureLabel },
          'Medico Tratante'
        )
      ),

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, { style: styles.footerText }, clinic.name),
        React.createElement(
          Text,
          { style: styles.footerText },
          `Generado: ${new Date().toLocaleDateString('es-GT')}`
        )
      )
    )
  )
}

/**
 * Generates a PDF buffer for a medical record using SOAP summary data.
 *
 * @param input - PDF generation input with SOAP data and clinic info
 * @returns Promise resolving to PDF buffer
 */
export async function generateMedicalRecordPdf(
  input: GenerateMedicalRecordPdfInput
): Promise<Buffer> {
  const { soap, clinic } = input

  const document = MedicalRecordDocument({ soap, clinic })
  const buffer = await renderToBuffer(document)

  return Buffer.from(buffer)
}

/**
 * Generates the storage path for a medical record PDF.
 *
 * Path format: {tenant_id}/{patient_id}/recipes/{yyyy}/{MM}/{dd}/{record_id}-appointment-summary.pdf
 *
 * @param tenantId - Tenant/clinic ID
 * @param patientId - Patient ID
 * @param recordId - Medical record ID
 * @returns Storage path string
 */
export function generatePdfStoragePath(
  tenantId: string,
  patientId: string,
  recordId: string
): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${tenantId}/${patientId}/recipes/${year}/${month}/${day}/${recordId}-appointment-summary.pdf`
}
