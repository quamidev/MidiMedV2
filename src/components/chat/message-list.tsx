/**
 * Message List Component
 *
 * Scrollable container for chat messages with auto-scroll behavior.
 * Renders a list of ChatMessage components, supports streaming content
 * display for in-progress assistant responses, and shows a TypingIndicator
 * when the assistant is generating a response before the first token arrives.
 *
 * Created: 2026-03-13 - CHAT-008 Chat message display components
 * Updated: 2026-03-13 - Added streamingContent and created_at support per ticket spec
 */

'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ChatMessage } from '@/components/chat/chat-message'
import { TypingIndicator } from '@/components/chat/typing-indicator'

interface MessageListProps {
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    created_at?: string
  }>
  streamingContent?: string
  isLoading?: boolean
}

export function MessageList({
  messages,
  streamingContent,
  isLoading = false,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change, streaming updates, or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, isLoading])

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {/* Empty state */}
      {messages.length === 0 && !isLoading && !streamingContent && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Envía un mensaje para iniciar la conversación.
          </p>
        </div>
      )}

      {/* Message list */}
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          role={message.role}
          content={message.content}
          createdAt={message.created_at}
        />
      ))}

      {/* Streaming message - shows the in-progress assistant response */}
      {streamingContent && (
        <ChatMessage
          role="assistant"
          content={streamingContent}
          isStreaming
        />
      )}

      {/* Typing indicator - shown before the first streaming token arrives */}
      <AnimatePresence>
        {isLoading && !streamingContent && <TypingIndicator />}
      </AnimatePresence>

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  )
}
