import { useState } from 'react'
import { motion } from 'framer-motion'

/**
 * ResponsiveImage Component
 * 
 * Mobile-optimized image component with:
 * - Lazy loading
 * - Responsive sizing
 * - Error handling
 * - Loading states
 * - Touch-friendly interactions
 */
const ResponsiveImage = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = '/placeholder-image.jpg',
  loading = 'lazy',
  sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-zinc-700 animate-pulse rounded-lg" />
      )}
      
      <motion.img
        src={hasError ? fallbackSrc : src}
        alt={alt}
        loading={loading}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        className={`
          w-full h-auto transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          ${hasError ? 'object-cover' : 'object-contain'}
          mobile-tap-highlight
        `}
        style={{
          minHeight: isLoading ? '200px' : 'auto'
        }}
        {...props}
      />
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded-lg">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResponsiveImage
