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

  const handleExploreHowItWorks = () => {
    if (featuresSectionRef.current) {
      featuresSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
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
        className="relative overflow-hidden py-24"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-zinc-900 to-slate-950 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900" />
        <div className="absolute inset-x-0 -top-24 h-64 bg-gradient-to-b from-primary-500/30 via-secondary-500/20 to-transparent blur-3xl" />
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[120%] md:w-3/4 bg-white/5 dark:bg-white/5 blur-3xl opacity-40" />

        <div className="relative max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center px-4 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-white/80 uppercase tracking-[0.2em] mb-6">
              PlanPal in Action
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It <span className="bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Planning your next adventure is as easy as one, two, three. Follow the journey below to see PlanPal in motion.
            </p>
          </motion.div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-y-1/2" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
              {[{
                id: 1,
                title: 'Create Group',
                description: 'Start a group, drop in your ideas, and invite friends to dream up the perfect outing together.',
                icon: <Users className="text-white" size={36} />,
                accent: 'from-primary-500 to-primary-600'
              }, {
                id: 2,
                title: 'Vote & Decide',
                description: 'Share polls, collect RSVPs, and make democratic decisions without endless chat threads.',
                icon: <Vote className="text-white" size={36} />,
                accent: 'from-secondary-500 to-secondary-600'
              }, {
                id: 3,
                title: 'Go Out',
                description: 'Get AI-powered suggestions, finalize the plan, and have everything your group needs in one place.',
                icon: <MapPin className="text-white" size={36} />,
                accent: 'from-emerald-500 via-teal-500 to-cyan-500'
              }].map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.03 }}
                  className="relative group"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white text-slate-900 dark:text-slate-900 rounded-full flex items-center justify-center font-bold shadow-xl shadow-primary-500/10">
                    {step.id}
                  </div>
                  <div className="relative h-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/10">
                    <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${step.accent} flex items-center justify-center mb-5 shadow-lg shadow-primary-900/20`}> 
                      {step.icon}
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-white/70 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative max-w-5xl mx-auto overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 text-white shadow-2xl"
        >
          <div className="absolute inset-0 opacity-40">
            <div className="absolute -inset-24 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)]" />
          </div>

          <div className="relative px-8 py-16 md:px-12 md:py-20 text-center space-y-6">
            <span className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-white/20 text-sm font-medium uppercase tracking-[0.25em]">
              You bring the people, we plan the fun
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to plan your next adventure?
            </h2>
            <p className="text-lg text-white/85 max-w-3xl mx-auto">
              Join thousands of planners already using PlanPal to choose the perfect spot, lock in decisions, and keep everyone excited from invite to outing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="inline-flex items-center space-x-2 bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <span>{user ? "Go to Dashboard" : "Get Started Free"}</span>
                <ArrowRight size={20} />
              </Link>
              <button
                type="button"
                onClick={handleExploreHowItWorks}
                className="inline-flex items-center space-x-2 border border-white/40 text-white hover:bg-white/10 font-semibold py-3.5 px-8 rounded-xl transition-all duration-300"
              >
                <span>See how it works</span>
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage
