import { useEffect, useRef, useState, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Lenis from 'lenis'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ChevronUp } from 'lucide-react'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSkeleton from './components/LoadingSkeleton'

// Temporarily disable lazy loading to debug Link error
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import GroupDetailPage from './pages/GroupDetailPage'
import ProfilePage from './pages/ProfilePage'
import ViewProfilePage from './pages/ViewProfilePage'
import PollPage from './pages/PollPage'
import SuggestionsPage from './pages/SuggestionsPage'
import ChatPage from './pages/ChatPage'
import FinalPlanPage from './pages/FinalPlanPage'

// Export lenis instance globally for use in components
export const lenisInstance = {
  current: null
}

// Scroll to top button component
const ScrollToTopButton = () => {
  const [showButton, setShowButton] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 300)
    }

    // Check if lenis is available
    if (lenisInstance.current) {
      lenisInstance.current.on('scroll', ({ scroll, limit }) => {
        setShowButton(scroll > 300)
      })
    } else {
      window.addEventListener('scroll', handleScroll)
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [location])

  const scrollToTop = () => {
    if (lenisInstance.current) {
      lenisInstance.current.scrollTo(0, {
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
      })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (!showButton) return null

  return (
    <motion.button
      onClick={scrollToTop}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-8 left-8 z-50 w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center group"
      aria-label="Scroll to top"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <ChevronUp size={24} />
      </motion.div>
    </motion.button>
  )
}

function AppContent() {
  const location = useLocation()

  return (
    <main className="font-poppins bg-gray-50 text-gray-900 dark:bg-zinc-900 dark:text-white min-h-screen">
      <Suspense fallback={<div className="page-container"><LoadingSkeleton count={3} /></div>}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.3,
              ease: [0.4, 0.0, 0.2, 1]
            }}
          >
            <Routes location={location}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/group/:groupId" element={<GroupDetailPage />} />
              <Route path="/join/:code" element={<GroupDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:userId" element={<ViewProfilePage />} />
              <Route path="/poll/:groupId" element={<PollPage />} />
              <Route path="/suggestions" element={<SuggestionsPage />} />
              <Route path="/suggestions/:groupId" element={<SuggestionsPage />} />
              <Route path="/chat/:groupId" element={<ChatPage />} />
              <Route path="/plan/:groupId" element={<FinalPlanPage />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Suspense>
      <ScrollToTopButton />
    </main>
  )
}

function App() {
  const lenisRef = useRef(null)

  useEffect(() => {
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    // Initialize Lenis with mobile optimizations
    const lenis = new Lenis({
      duration: isMobile ? 1 : 1.2, // Faster on mobile
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: !isMobile, // Disable smooth scrolling on mobile for better performance
      direction: 'vertical',
      gestureDirection: 'vertical',
      smoothTouch: false, // Disable on touch devices
      touchMultiplier: isMobile ? 1.5 : 2, // Lower multiplier on mobile
      infinite: false,
      autoResize: true,
      preventDefault: false, // Prevent conflicts with native scroll
      // Exclude chat containers from Lenis
      wrapper: window,
      content: document.body,
    })

    lenisRef.current = lenis
    lenisInstance.current = lenis

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // Cleanup
    return () => {
      lenis.destroy()
      lenisInstance.current = null
    }
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AppContent />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                },
              }}
            />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
