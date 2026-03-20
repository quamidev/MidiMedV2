/**
 * API Route: AI Chat with Streaming
 *
 * Streaming chat endpoint for the medical assistant. Authenticates the user,
 * manages conversation persistence in Supabase, and streams AI responses
 * using the Vercel AI SDK streamText API.
 *
 * Created: 2026-03-13 - CHAT-003 Chat API Route with Streaming
 */

import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { z } from 'zod'

import { model } from '@/lib/ai/config'
import { CHAT_SYSTEM_PROMPT, MAX_HISTORY_MESSAGES } from '@/lib/ai/chat-assistant'
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Request body validation schema.
 */
const requestSchema = z.object({
  conversationId: z.string().uuid('ID de conversación inválido').optional(),
  message: z.string().min(1, 'El mensaje no puede estar vacío'),
})

/**
 * POST /api/ai/chat
 *
 * Streams an AI medical assistant response. Creates or continues a conversation,
 * persists messages to the database, and returns a streaming text response.
 *
 * Request body:
 *   - conversationId (optional): UUID of existing conversation
 *   - message: The user's message text
 *
 * Response:
 *   - 200: Streaming text/event-stream with x-conversation-id header
 *   - 400: Invalid request body
 *   - 401: Not authenticated
 *   - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Validate auth
    const supabase = await createServerClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('auth_id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = requestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { message } = validation.data
    let conversationId = validation.data.conversationId

    // If no conversationId, create a new conversation
    if (!conversationId) {
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message

      const { data: conversation, error: createError } = await supabaseAdmin
        .from('chat_conversations')
        .insert({
          tenant_id: user.tenant_id,
          user_id: user.id,
          title,
        })
        .select('id')
        .single()

      if (createError || !conversation) {
        console.error('Failed to create conversation:', createError)
        return NextResponse.json(
          { error: 'Error al crear conversación' },
          { status: 500 }
        )
      }

      conversationId = conversation.id
    }

    // Save user message to DB
    const { error: messageError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
      })

    if (messageError) {
      console.error('Failed to save user message:', messageError)
      return NextResponse.json(
        { error: 'Error al guardar mensaje' },
        { status: 500 }
      )
    }

    // Fetch conversation history for context
    const { data: history } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(MAX_HISTORY_MESSAGES)

    const historyMessages = (history || []).map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    // Stream AI response
    const result = streamText({
      model,
      system: CHAT_SYSTEM_PROMPT,
      messages: historyMessages,
      onFinish: async ({ text }) => {
        // Save assistant message after stream completes
        const { error: assistantError } = await supabaseAdmin
          .from('chat_messages')
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: text,
          })

        if (assistantError) {
          console.error('Failed to save assistant message:', assistantError)
        }

        // Update conversation updated_at
        const { error: updateError } = await supabaseAdmin
          .from('chat_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId)

        if (updateError) {
          console.error('Failed to update conversation timestamp:', updateError)
        }
      },
    })

    const response = result.toDataStreamResponse()
    response.headers.set('x-conversation-id', conversationId)
    return response
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
