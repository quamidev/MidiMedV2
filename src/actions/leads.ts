'use server'

/**
 * Leads Server Actions
 *
 * Handles lead creation for the public contact form.
 * Uses supabaseAdmin since leads table has public insert permissions.
 *
 * Created: 2026-02-10 - MV2-054 Contact Page
 */

import { z } from 'zod'

import { supabaseAdmin } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types/app'

// =============================================================================
// Validation Schemas
// =============================================================================

const createLeadSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electronico invalido'),
  message: z.string().optional(),
})

// =============================================================================
// Types
// =============================================================================

export interface Lead {
  id: string
  name: string
  email: string
  message: string | null
  source: string
  created_at: string
}

export interface CreateLeadInput {
  name: string
  email: string
  message?: string
}

// =============================================================================
// Actions
// =============================================================================

/**
 * Creates a new lead record in the database.
 * This is a public action that does not require authentication.
 * Uses supabaseAdmin to bypass RLS since leads table allows public inserts.
 *
 * @param input - Lead creation data (name, email, optional message)
 * @returns ActionResult with created lead
 */
export async function createLead(
  input: CreateLeadInput
): Promise<ActionResult<Lead>> {
  try {
    const validated = createLeadSchema.parse(input)

    const now = new Date().toISOString()

    const leadData = {
      name: validated.name,
      email: validated.email,
      message: validated.message || null,
      source: 'contact_form',
      created_at: now,
    }

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert(leadData)
      .select()
      .single()

    if (error) {
      console.error('createLead error:', error)
      return { success: false, error: 'Error al enviar el mensaje. Por favor intenta de nuevo.' }
    }

    return {
      success: true,
      data: lead as Lead,
    }
  } catch (error) {
    console.error('createLead error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos invalidos' }
    }
    return { success: false, error: 'Error inesperado. Por favor intenta de nuevo.' }
  }
}
