import { lenisInstance } from '../App'

/**
 * Disable Lenis smooth scrolling for a specific element
 * Useful for modals, dropdowns, and chat areas
 */
export const disableLenisForElement = (element) => {
  if (!lenisInstance.current || !element) return

  // Store original overflow style
  element.dataset.originalOverflow = window.getComputedStyle(element).overflow

  // Disable Lenis
  lenisInstance.current.stop()
  
  // Add class to prevent Lenis from affecting this element
  element.classList.add('lenis-disabled')
}

/**
 * Re-enable Lenis smooth scrolling
 */
export const enableLenis = () => {
  if (!lenisInstance.current) return
  lenisInstance.current.start()
}

/**
 * Scroll to a specific position using Lenis
 */
export const smoothScrollTo = (target, options = {}) => {
  if (!lenisInstance.current) return

  const defaultOptions = {
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    offset: 0,
  }

  // Handle both string selectors and numeric positions
  if (typeof target === 'string') {
    const element = document.querySelector(target)
    if (element) {
      lenisInstance.current.scrollTo(element, { ...defaultOptions, ...options })
    }
  } else {
    lenisInstance.current.scrollTo(target, { ...defaultOptions, ...options })
  }
}

/**
 * Get current scroll position
 */
export const getScrollPosition = () => {
  if (!lenisInstance.current) return 0
  return lenisInstance.current.scroll
}

/**
 * Check if element is in viewport (with optional offset)
 */
export const isInViewport = (element, offset = 0) => {
  if (!element) return false

  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 + offset &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) - offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * Add scroll-triggered animation using Intersection Observer
 */
export const addScrollAnimation = (element, callback, options = {}) => {
  if (!element) return null

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px',
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry.target)
        observer.unobserve(entry.target)
      }
    })
  }, { ...defaultOptions, ...options })

  observer.observe(element)

  return observer
}
