/**
 * Reports PDF Export Utility
 *
 * Client-side PDF generation for the reports dashboard using html2pdf.js.
 * Captures the reports content and generates a branded A4 PDF document.
 *
 * Created: 2026-02-10 - MV2-056 Reports PDF Export
 */

import html2pdf from 'html2pdf.js'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Options for PDF export configuration.
 */
interface ExportPdfOptions {
  /** Name of the clinic/organization for branding */
  clinicName?: string
  /** Optional date to include in the report (defaults to today) */
  reportDate?: Date
}

/**
 * Generates the filename for the PDF export.
 * Format: reporte-midimed-YYYY-MM-DD.pdf
 */
function generateFilename(date: Date = new Date()): string {
  const formattedDate = format(date, 'yyyy-MM-dd')
  return `reporte-midimed-${formattedDate}.pdf`
}

/**
 * Creates a branded header element for the PDF.
 * Includes MidiMed logo/branding and report metadata.
 */
function createPdfHeader(options: ExportPdfOptions): HTMLElement {
  const header = document.createElement('div')
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px;
    margin-bottom: 20px;
    border-bottom: 2px solid #3abdd4;
    background: linear-gradient(135deg, #f8fdfe 0%, #ffffff 100%);
  `

  const leftSection = document.createElement('div')
  leftSection.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #3abdd4 0%, #208697 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div>
        <h1 style="
          font-size: 22px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0;
          letter-spacing: -0.5px;
        ">MidiMed</h1>
        <p style="
          font-size: 11px;
          color: #666;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        ">Sistema Medico</p>
      </div>
    </div>
    ${options.clinicName ? `
      <p style="
        font-size: 14px;
        color: #374151;
        margin: 4px 0 0 0;
        font-weight: 500;
      ">${options.clinicName}</p>
    ` : ''}
  `

  const rightSection = document.createElement('div')
  rightSection.style.cssText = 'text-align: right;'
  const reportDate = options.reportDate || new Date()
  rightSection.innerHTML = `
    <p style="
      font-size: 18px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 4px 0;
    ">Reporte de Actividad</p>
    <p style="
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    ">${format(reportDate, "d 'de' MMMM, yyyy", { locale: es })}</p>
    <p style="
      font-size: 11px;
      color: #9ca3af;
      margin: 8px 0 0 0;
    ">Generado: ${format(new Date(), "HH:mm 'hrs'", { locale: es })}</p>
  `

  header.appendChild(leftSection)
  header.appendChild(rightSection)

  return header
}

/**
 * Creates a footer element for the PDF.
 */
function createPdfFooter(): HTMLElement {
  const footer = document.createElement('div')
  footer.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    margin-top: 20px;
    border-top: 1px solid #e5e7eb;
    font-size: 10px;
    color: #9ca3af;
  `

  footer.innerHTML = `
    <span>MidiMed - Sistema de Gestion Medica</span>
    <span>www.midimed.app</span>
  `

  return footer
}

/**
 * Exports the reports dashboard content as a PDF file.
 *
 * @param elementId - The ID of the HTML element to capture (defaults to 'reports-content')
 * @param options - PDF export configuration options
 * @returns Promise that resolves when PDF is generated and download initiated
 */
export async function exportReportsToPdf(
  elementId: string = 'reports-content',
  options: ExportPdfOptions = {}
): Promise<void> {
  const element = document.getElementById(elementId)

  if (!element) {
    throw new Error(`Element with ID "${elementId}" not found`)
  }

  // Create a wrapper to add branding
  const wrapper = document.createElement('div')
  wrapper.style.cssText = `
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  `

  // Add header
  wrapper.appendChild(createPdfHeader(options))

  // Clone the content
  const contentClone = element.cloneNode(true) as HTMLElement
  contentClone.style.cssText = `
    padding: 0 24px;
  `

  // Remove any elements that shouldn't be in the PDF
  const noExportElements = contentClone.querySelectorAll('[data-no-pdf-export]')
  noExportElements.forEach((el) => el.remove())

  wrapper.appendChild(contentClone)

  // Add footer
  wrapper.appendChild(createPdfFooter())

  // Configure html2pdf options for A4 format
  const pdfOptions = {
    margin: [10, 10, 10, 10],
    filename: generateFilename(options.reportDate),
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const,
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  }

  // Generate and download PDF
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await html2pdf().set(pdfOptions as any).from(wrapper).save()
}

/**
 * Checks if html2pdf is available and PDF export is supported.
 */
export function isPdfExportSupported(): boolean {
  return typeof window !== 'undefined' && typeof html2pdf !== 'undefined'
}
