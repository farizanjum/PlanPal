import { motion } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Vote, MapPin, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { smoothScrollTo, addScrollAnimation } from '../utils/lenis.js'

const LandingPage = () => {
  const heroSectionRef = useRef(null)
  const featuresSectionRef = useRef(null)
  const { user } = useAuth()

  useEffect(() => {
    // Add scroll-triggered animations to sections
    const sections = [heroSectionRef, featuresSectionRef]
    sections.forEach((ref) => {
      if (ref.current) {
        addScrollAnimation(
          ref.current,
          (element) => {
            element.classList.add('animate-fade-in-up')
          },
          { threshold: 0.2 }
        )
      }
    })
  }, [])

  const handleGetStarted = () => {
    smoothScrollTo(0, { duration: 1 })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <Navbar />
      
      {/* Hero Section */}
      <section 
        ref={heroSectionRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900"
      >
        {/* Floating Emojis Background */}
        <div className="absolute inset-0 pointer-events-none">
          {['🎉', '🎬', '🍕', '🎯', '🌟', '🎪', '🎨', '🎵'].map((emoji, index) => (
            <motion.div
              key={index}
              className="absolute text-4xl opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 15, -15, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Plan Smarter.
              </span>
              <br />
              <span className="text-gray-800 dark:text-white">Chill Together.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Coordinate outings with ease using AI and group votes. 
              Make decisions together, discover new places, and create unforgettable memories.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link to={user ? "/dashboard" : "/register"} className="btn-primary text-lg px-8 py-4">
                {user ? "Dashboard" : "Get Started"}
              </Link>
              <button 
                onClick={() => smoothScrollTo('#how-it-works', { offset: -80, duration: 1.5 })}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-500 transition-colors text-lg"
              >
                <span>Learn More</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-gray-400 dark:bg-gray-600 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section 
        id="how-it-works"
        ref={featuresSectionRef}
        className="section-container section-padding bg-white dark:bg-zinc-800"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            How It <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Planning your next adventure is as easy as one, two, three
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="card p-8 text-center relative"
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Create Group</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start a group and invite friends to plan your next adventure together.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="card p-8 text-center relative"
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-secondary-500 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Vote className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Vote & Decide</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Let everyone vote on options and make democratic decisions effortlessly.
            </p>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="card p-8 text-center relative"
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Go Out</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get smart suggestions and finalize your perfect plan with all the details.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-container section-padding bg-gradient-to-r from-primary-500 to-secondary-500">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to plan your next adventure?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Join thousands of groups already planning amazing experiences together
          </p>
          <Link to="/register" className="inline-flex items-center space-x-2 bg-white text-primary-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <span>Get Started Free</span>
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage
