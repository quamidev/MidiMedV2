'use server'

/**
 * Chat Server Actions
 *
 * Handles conversation CRUD operations and message retrieval for the AI chat
 * assistant feature. All operations are scoped to the authenticated user and
 * their tenant.
 *
 * Created: 2026-03-13 - CHAT-002 Chat server actions
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import type { ActionResult, ChatConversation, ChatMessage } from '@/types/app'

// =============================================================================
// Validation Schemas
// =============================================================================

const conversationIdSchema = z.string().uuid('ID de conversacion invalido')

const updateTitleSchema = z.object({
  conversationId: z.string().uuid('ID de conversacion invalido'),
  title: z.string().min(1, 'El titulo es requerido').max(255, 'El titulo es demasiado largo'),
})

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets the current user and their tenant_id from the authenticated session.
 * Throws an error if not authenticated.
 */
async function getCurrentUserContext() {
  const supabase = await createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error('No autenticado')
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, tenant_id')
    .eq('auth_id', authUser.id)
    .single()

  if (userError || !user) {
    throw new Error('Usuario no encontrado')
  }

  return { supabase, user, tenantId: user.tenant_id as string, userId: user.id as string }
}

// =============================================================================
// Read Actions
// =============================================================================

/**
 * Gets all chat conversations for the current user, ordered by most recently
 * updated first.
 */
export async function getChatConversations(): Promise<ActionResult<ChatConversation[]>> {
  try {
    const { supabase, userId, tenantId } = await getCurrentUserContext()

    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('getChatConversations error:', error)
      return { success: true, data: [] }
    }

    return {
      success: true,
      data: (conversations || []) as ChatConversation[],
    }
  } catch (error) {
    console.error('getChatConversations error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: true, data: [] }
  }
}

/**
 * Gets all messages for a specific conversation, ordered chronologically.
 */
export async function getChatMessages(
  conversationId: string
): Promise<ActionResult<ChatMessage[]>> {
  try {
    const validatedId = conversationIdSchema.parse(conversationId)
    const { supabase, userId, tenantId } = await getCurrentUserContext()

    // Verify the conversation belongs to this user and tenant
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('id', validatedId)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single()

    if (convError || !conversation) {
      console.error('getChatMessages conversation check error:', convError)
      return { success: false, error: 'Conversacion no encontrada' }
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', validatedId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('getChatMessages error:', error)
      return { success: true, data: [] }
    }

    return {
      success: true,
      data: (messages || []) as ChatMessage[],
    }
  } catch (error) {
    console.error('getChatMessages error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'ID de conversacion invalido' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: true, data: [] }
  }
}

// =============================================================================
// Mutation Actions
// =============================================================================

/**
 * Creates a new chat conversation with a default title.
 */
export async function createChatConversation(): Promise<ActionResult<ChatConversation>> {
  try {
    const { supabase, userId, tenantId } = await getCurrentUserContext()

    const now = new Date().toISOString()

    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        title: 'Nueva conversacion',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      console.error('createChatConversation error:', error)
      return { success: false, error: 'Error al crear conversacion' }
    }

    revalidatePath('/chat')

    return {
      success: true,
      data: conversation as ChatConversation,
    }
  } catch (error) {
    console.error('createChatConversation error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Deletes a chat conversation and its associated messages.
 * Only the owner can delete their conversations.
 */
export async function deleteChatConversation(
  conversationId: string
): Promise<ActionResult<void>> {
  try {
    const validatedId = conversationIdSchema.parse(conversationId)
    const { supabase, userId, tenantId } = await getCurrentUserContext()

    // Delete messages first (child records)
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('conversation_id', validatedId)

    if (messagesError) {
      console.error('deleteChatConversation messages error:', messagesError)
      return { success: false, error: 'Error al eliminar mensajes de la conversacion' }
    }

    // Delete the conversation, verifying ownership
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', validatedId)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('deleteChatConversation error:', error)
      return { success: false, error: 'Error al eliminar conversacion' }
    }

    revalidatePath('/chat')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('deleteChatConversation error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'ID de conversacion invalido' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Updates the title of a chat conversation.
 * Only the owner can update their conversation titles.
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<ActionResult<void>> {
  try {
    const validated = updateTitleSchema.parse({ conversationId, title })
    const { supabase, userId, tenantId } = await getCurrentUserContext()

    const { error } = await supabase
      .from('chat_conversations')
      .update({
        title: validated.title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.conversationId)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('updateConversationTitle error:', error)
      return { success: false, error: 'Error al actualizar titulo de conversacion' }
    }

    revalidatePath('/chat')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('updateConversationTitle error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos invalidos' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}
