import { motion } from 'framer-motion'

const SkeletonCard = () => {
  return (
    <div className="card">
      <div className="flex items-start space-x-3 mb-4">
        <div className="w-14 h-14 bg-gray-300 dark:bg-zinc-700 rounded-2xl animate-shimmer"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-3/4 mb-2 animate-shimmer"></div>
          <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-1/2 animate-shimmer"></div>
        </div>
        <div className="w-16 h-6 bg-gray-300 dark:bg-zinc-700 rounded-full animate-shimmer"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-full animate-shimmer"></div>
        <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-5/6 animate-shimmer"></div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-1/4 animate-shimmer"></div>
        <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-1/4 animate-shimmer"></div>
      </div>
      <div className="mt-4 h-10 bg-gray-300 dark:bg-zinc-700 rounded-xl w-full animate-shimmer"></div>
    </div>
  )
}

const SkeletonPollCard = () => {
  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gray-300 dark:bg-zinc-700 rounded-full animate-shimmer"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-300 dark:bg-zinc-700 rounded w-3/4 mb-2 animate-shimmer"></div>
          <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-1/2 animate-shimmer"></div>
        </div>
      </div>
      <div className="mb-4">
        <div className="h-2 bg-gray-300 dark:bg-zinc-700 rounded-full w-full mb-2 animate-shimmer"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-1/4 animate-shimmer"></div>
          <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-1/4 animate-shimmer"></div>
        </div>
      </div>
      <div className="h-10 bg-gray-300 dark:bg-zinc-700 rounded-xl w-full animate-shimmer"></div>
    </div>
  )
}

export const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
  const skeletons = Array.from({ length: count }, (_, index) => {
    const Component = type === 'poll' ? SkeletonPollCard : SkeletonCard
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Component />
      </motion.div>
    )
  })

  return (
    <div className={type === 'poll' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
      {skeletons}
    </div>
  )
}

export default LoadingSkeleton
