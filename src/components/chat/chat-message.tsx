/**
 * Chat Message Component
 *
 * Renders a single chat message bubble with role-based styling.
 * User messages are right-aligned with primary color; assistant messages
 * are left-aligned with muted background and a bot icon. Assistant content
 * is rendered with lightweight markdown support (bold, code, lists, headers).
 *
 * Created: 2026-03-13 - CHAT-008 Chat message display components
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'

import { cn } from '@/lib/utils'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  createdAt?: string
}

/**
 * Lightweight markdown renderer for assistant messages.
 * Handles: headers (##), bold (**), inline code (`), code blocks (```),
 * unordered lists (- or *), ordered lists (1.), and paragraphs.
 * Does NOT install react-markdown; uses regex-based parsing instead.
 */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeBlockLines: string[] = []
  let key = 0

  const renderInline = (line: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    // Match bold (**text**), inline code (`text`), or plain text
    const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(line)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index))
      }

      if (match[2]) {
        // Bold text
        parts.push(
          <strong key={`b-${match.index}`} className="font-semibold">
            {match[2]}
          </strong>
        )
      } else if (match[3]) {
        // Inline code
        parts.push(
          <code
            key={`c-${match.index}`}
            className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono"
          >
            {match[3]}
          </code>
        )
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex))
    }

    return parts.length > 0 ? parts : [line]
  }

  for (const line of lines) {

    // Code block toggle
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={key++}
            className="my-2 overflow-x-auto rounded-lg bg-muted/80 p-3 text-xs font-mono dark:bg-muted"
          >
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        )
        codeBlockLines = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(line)
      continue
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />)
      continue
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={key++} className="mt-3 mb-1 text-sm font-semibold">
          {renderInline(line.slice(4))}
        </h4>
      )
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={key++} className="mt-3 mb-1 text-base font-semibold">
          {renderInline(line.slice(3))}
        </h3>
      )
      continue
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={key++} className="mt-3 mb-1 text-lg font-bold">
          {renderInline(line.slice(2))}
        </h2>
      )
      continue
    }

    // Unordered list items (- or *)
    const ulMatch = line.match(/^[\s]*[-*]\s+(.+)/)
    if (ulMatch && ulMatch[1]) {
      elements.push(
        <li key={key++} className="ml-4 list-disc text-sm">
          {renderInline(ulMatch[1])}
        </li>
      )
      continue
    }

    // Ordered list items (1. 2. etc.)
    const olMatch = line.match(/^[\s]*\d+\.\s+(.+)/)
    if (olMatch && olMatch[1]) {
      elements.push(
        <li key={key++} className="ml-4 list-decimal text-sm">
          {renderInline(olMatch[1])}
        </li>
      )
      continue
    }

    // Regular paragraph line
    elements.push(
      <p key={key++} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>
    )
  }

  // Handle unclosed code block (e.g. still streaming)
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre
        key={key++}
        className="my-2 overflow-x-auto rounded-lg bg-muted/80 p-3 text-xs font-mono dark:bg-muted"
      >
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    )
  }

  return elements
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ChatMessageComponent({ role, content, isStreaming, createdAt }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-2',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Assistant icon */}
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{content}</p>
        ) : (
          <div className="space-y-0.5">
            {renderMarkdown(content)}
          </div>
        )}

        {/* Streaming cursor indicator */}
        {isStreaming && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
            className="ml-0.5 inline-block h-4 w-0.5 bg-current align-text-bottom"
          />
        )}
      </div>

      {/* User icon */}
      {isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </motion.div>
  )
}

export const ChatMessage = React.memo(ChatMessageComponent)
