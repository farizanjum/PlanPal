import { motion } from 'framer-motion'
import { Plus, Search, Calendar } from 'lucide-react'

const EmptyState = ({ 
  title = "No plans yet",
  description = "Get started by creating your first group planning session",
  icon = <Calendar size={48} />,
  actionLabel = "Create Plan",
  onAction,
  emoji = "📅"
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="mb-6">
        <div className="w-20 h-20 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">{emoji}</span>
        </div>
        <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto text-white">
          {icon}
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 font-poppins">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {description}
      </p>
      
      {onAction && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className="inline-flex items-center space-x-2 btn-primary"
        >
          <Plus size={20} />
          <span>{actionLabel}</span>
        </motion.button>
      )}
    </motion.div>
  )
}

export const EmptySearch = ({ query, onClear }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-20 h-20 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search size={48} className="text-primary-500" />
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 font-poppins">
        No results found
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        No plans match "{query}". Try a different search term.
      </p>
      
      {onClear && (
        <button
          onClick={onClear}
          className="text-primary-500 hover:text-primary-600 font-semibold"
        >
          Clear search
        </button>
      )}
    </motion.div>
  )
}

export default EmptyState
