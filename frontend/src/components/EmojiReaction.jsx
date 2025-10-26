import { motion } from 'framer-motion'
import { memo } from 'react'

const EmojiReaction = memo(({ emoji, className = '', onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.2, rotate: 10 }}
      whileTap={{ scale: 0.9 }}
      className={`text-2xl cursor-pointer transition-all duration-200 ${className}`}
      aria-label={`React with ${emoji}`}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ 
          scale: 1, 
          rotate: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        className="inline-block"
      >
        {emoji}
      </motion.div>
    </motion.button>
  )
})

EmojiReaction.displayName = 'EmojiReaction'

export default EmojiReaction
