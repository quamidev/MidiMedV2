/**
 * Invoice Table Component
 *
 * Displays invoice history with status badges, amounts, and payment links.
 * Features responsive design with card layout on mobile.
 *
 * Created: 2026-02-10 - MV2-047 Settings Billing Tab
 * Updated: 2026-02-10 - QA-011 Fixed price formatting (cents to display amount)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Receipt,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { getInvoices } from '@/actions/billing'
import type { Invoice } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

interface InvoiceTableProps {
  limit?: number
}

type InvoiceStatus = Invoice['status']

// =============================================================================
// Status Configuration
// =============================================================================

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  paid: {
    label: 'Pagado',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  },
  pending: {
    label: 'Pendiente',
    icon: Clock,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  },
  failed: {
    label: 'Fallido',
    icon: AlertCircle,
    className: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    className: 'bg-muted text-muted-foreground',
  },
}

// =============================================================================
// Component
// =============================================================================

export function InvoiceTable({ limit = 10 }: InvoiceTableProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  // Fetch invoices
  const loadInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getInvoices(50) // Fetch more, páginate in UI
      if (result.success) {
        setInvoices(result.data)
      } else {
        toast.error('Error al cargar facturas')
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
      toast.error('Error al cargar facturas')
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Data fetching on mount
  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  // Filter invoices based on show all state
  const displayedInvoices = showAll ? invoices : invoices.slice(0, limit)

  // Format currency (amount stored in centavos)
  const formatAmount = useCallback((amount: number, currency: 'GTQ' | 'USD'): string => {
    const symbol = currency === 'GTQ' ? 'Q' : '$'
    const displayAmount = amount / 100
    return `${symbol}${displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [])

  // Loading skeleton
  if (loading) {
    return <InvoiceTableSkeleton />
  }

  // Empty state
  if (invoices.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-8 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Receipt className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-semibold text-foreground">Sin facturas</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Aún no tienes facturas. Aparecerán aquí cuando realices tu primer pago.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Historial de facturas</h3>
            <p className="text-xs text-muted-foreground">
              {invoices.length} factura{invoices.length !== 1 && 's'}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Descripción</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {displayedInvoices.map((invoice, index) => {
                const statusConfig = STATUS_CONFIG[invoice.status]
                const StatusIcon = statusConfig.icon

                return (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {invoice.description || `Plan ${invoice.product}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(invoice.period_start), 'MMM yyyy', { locale: es })} -{' '}
                          {format(parseISO(invoice.period_end), 'MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(invoice.created_at), "d MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {formatAmount(invoice.amount, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                          statusConfig.className
                        )}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusConfig.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.provider_link_url && invoice.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-primary hover:text-primary/80"
                        >
                          <a
                            href={invoice.provider_link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Pagar
                            <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-border">
        <AnimatePresence>
          {displayedInvoices.map((invoice, index) => {
            const statusConfig = STATUS_CONFIG[invoice.status]
            const StatusIcon = statusConfig.icon

            return (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {invoice.description || `Plan ${invoice.product}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(invoice.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                      statusConfig.className
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-foreground">
                    {formatAmount(invoice.amount, invoice.currency)}
                  </span>
                  {invoice.provider_link_url && invoice.status === 'pending' && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={invoice.provider_link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Pagar ahora
                        <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Show More Button */}
      {invoices.length > limit && (
        <div className="border-t border-border p-4">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Ver todas ({invoices.length - limit} más)
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// =============================================================================
// Skeleton
// =============================================================================

function InvoiceTableSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
