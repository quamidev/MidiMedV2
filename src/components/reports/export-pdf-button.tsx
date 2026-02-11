/**
 * Export PDF Button Component
 *
 * Button that triggers PDF export of the reports dashboard.
 * Includes loading state with smooth animation during generation.
 *
 * Created: 2026-02-10 - MV2-056 Reports PDF Export
 */

'use client'

import { useState } from 'react'
import { FileDown, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { exportReportsToPdf } from '@/lib/pdf/reports-export'
import { useUser } from '@/hooks/use-user'

interface ExportPdfButtonProps {
  /** ID of the element to capture for PDF */
  contentId?: string
  /** Additional CSS classes */
  className?: string
  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

type ExportState = 'idle' | 'generating' | 'success'

/**
 * Export PDF Button with loading and success states.
 * Captures the reports content and generates a branded PDF.
 */
export function ExportPdfButton({
  contentId = 'reports-content',
  className,
  variant = 'outline',
  size = 'default',
}: ExportPdfButtonProps) {
  const [exportState, setExportState] = useState<ExportState>('idle')
  const { tenant } = useUser()

  const handleExport = async () => {
    if (exportState !== 'idle') return

    setExportState('generating')

    try {
      await exportReportsToPdf(contentId, {
        clinicName: tenant?.name,
        reportDate: new Date(),
      })

      setExportState('success')
      toast.success('Reporte descargado', {
        description: 'El PDF se ha generado correctamente.',
      })

      // Reset to idle after showing success
      setTimeout(() => {
        setExportState('idle')
      }, 2000)
    } catch (error) {
      console.error('PDF export error:', error)
      setExportState('idle')
      toast.error('Error al generar PDF', {
        description: 'No se pudo generar el reporte. Intenta de nuevo.',
      })
    }
  }

  const isGenerating = exportState === 'generating'
  const isSuccess = exportState === 'success'

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isGenerating}
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        isSuccess && 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500',
        className
      )}
    >
      {/* Icon container with smooth transitions */}
      <span
        className={cn(
          'relative flex items-center justify-center transition-transform duration-300',
          isGenerating && 'scale-110'
        )}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSuccess ? (
          <Check className="h-4 w-4" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
      </span>

      {/* Label with state-based text */}
      <span className="ml-2">
        {isGenerating
          ? 'Generando...'
          : isSuccess
            ? 'Descargado'
            : 'Descargar Reporte PDF'}
      </span>

      {/* Animated background pulse for generating state */}
      {isGenerating && (
        <span
          className="absolute inset-0 -z-10 animate-pulse bg-primary/10"
          aria-hidden="true"
        />
      )}
    </Button>
  )
}
