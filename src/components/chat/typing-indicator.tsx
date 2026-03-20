/**
 * Typing Indicator Component
 *
 * Animated 3-dot typing indicator displayed while the AI assistant
 * is generating a response. Styled to match the assistant message bubble
 * with a muted background and bot icon.
 *
 * Created: 2026-03-13 - CHAT-008 Chat message display components
 */

'use client'

import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

const dotVariants = {
  initial: { y: 0 },
  animate: { y: -4 },
}

const dotTransition = (delay: number) => ({
  duration: 0.4,
  repeat: Infinity,
  repeatType: 'reverse' as const,
  ease: 'easeInOut' as const,
  delay,
})

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-2"
    >
      {/* Bot icon */}
      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-4 w-4 text-primary" />
      </div>

      {/* Dots bubble */}
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={dotTransition(i * 0.15)}
            className="block h-2 w-2 rounded-full bg-muted-foreground/60"
          />
        ))}
      </div>
    </motion.div>
  )
}
