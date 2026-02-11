'use client'

import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface RotatingWordsProps {
  words: string[]
  interval?: number
  className?: string
}

export function RotatingWords({ words, interval = 3000, className }: RotatingWordsProps) {
  const [index, setIndex] = useState(0)

  const longest = useMemo(
    () => words.reduce((a, b) => (a.length >= b.length ? a : b), ''),
    [words]
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
    }, interval)
    return () => clearInterval(timer)
  }, [words.length, interval])

  return (
    <span className={`inline-block relative ${className ?? ''}`}>
      {/* Invisible longest word to reserve width */}
      <span className="invisible">{longest}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: 20, opacity: 0, filter: 'blur(4px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -20, opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 top-0"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
