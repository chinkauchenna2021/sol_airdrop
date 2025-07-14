'use client'

import { motion } from 'framer-motion'

export function FloatingElements() {
  const elements = Array.from({ length: 6 }, (_, i) => i)

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {elements.map((i) => (
        <motion.div
          suppressHydrationWarning
          key={i}
          className="absolute w-64 h-64 rounded-full"
          style={{
            background: `radial-gradient(circle, ${
              i % 2 === 0 ? 'rgba(153, 69, 255, 0.1)' : 'rgba(20, 241, 149, 0.1)'
            } 0%, transparent 70%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, 100, -100, 0],
            y: [0, -100, 100, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 20 + Math.random() * 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 2,
          }}
        />
      ))}
    </div>
  )
}