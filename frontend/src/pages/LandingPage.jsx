import { motion } from 'framer-motion'
import { useRef, useEffect, useCallback } from 'react'
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
  const heroEmojis = [
    { emoji: '🎉', left: '12%', top: '18%' },
    { emoji: '🎬', left: '70%', top: '22%' },
    { emoji: '🍕', left: '20%', top: '65%' },
    { emoji: '🎯', left: '82%', top: '55%' },
    { emoji: '🌟', left: '42%', top: '12%' },
    { emoji: '🎵', left: '58%', top: '72%' }
  ]

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

  const handleExploreHowItWorks = useCallback(() => {
    smoothScrollTo('#how-it-works', { offset: -80, duration: 1.1 })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <Navbar />
      
      {/* Hero Section */}
      <section 
        ref={heroSectionRef}
        className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white py-24 md:py-28"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_65%)]" />
          <div className="absolute -top-32 -left-24 w-72 h-72 bg-primary-500/35 blur-3xl rounded-full" />
          <div className="absolute -bottom-32 -right-28 w-80 h-80 bg-secondary-500/35 blur-3xl rounded-full" />
        </div>

        <div className="absolute inset-0 pointer-events-none">
          {heroEmojis.map((item, index) => (
            <motion.div
              key={item.emoji + index}
              className="absolute text-4xl md:text-5xl text-white/15"
              style={{ left: item.left, top: item.top }}
              animate={{ y: [0, -12, 0], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: index * 0.8 }}
            >
              {item.emoji}
            </motion.div>
          ))}
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid items-center gap-12 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              <span className="inline-flex items-center px-4 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium tracking-[0.25em] uppercase text-white/70">
                AI + Group Planning
              </span>
              <h1 className="mt-6 text-4xl md:text-6xl lg:text-[4.5rem] font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary-300 via-secondary-200 to-primary-300 bg-clip-text text-transparent">
                  Plan smarter.
                </span>
                <br />
                <span className="text-white">Chill together.</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-white/80 max-w-xl">
                Coordinate outings with AI-powered suggestions, instant polls, and live group collaboration. Make decisions together, discover new places, and keep every detail in sync.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to={user ? "/dashboard" : "/register"}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-8 py-4 text-lg font-semibold shadow-lg shadow-primary-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <span>{user ? "Open Dashboard" : "Start Planning"}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleExploreHowItWorks}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-8 py-4 text-lg font-semibold text-white/80 transition-all duration-300 hover:border-white/60 hover:text-white/100"
                >
                  <span>See how it works</span>
                  <ArrowRight size={20} />
                </button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-4">
                  <p className="text-sm uppercase tracking-[0.25em] text-white/60">This week</p>
                  <p className="mt-2 text-3xl font-semibold text-white">128+</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-emerald-200">
                    <Sparkles size={16} />
                    New groups planning get-togethers
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-4">
                  <p className="text-sm uppercase tracking-[0.25em] text-white/60">Decision speed</p>
                  <p className="mt-2 text-3xl font-semibold text-white">6× faster</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-white/75">
                    <CheckCircle size={16} className="text-secondary-200" />
                    Polls and RSVPs settled in minutes
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-6 bg-gradient-to-br from-white/20 via-transparent to-white/5 blur-3xl opacity-40" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-2xl p-8 shadow-2xl space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-[0.3em] text-white/60">Live plan</span>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Friday Night Hangout</h3>
                    <p className="text-sm text-white/60">Downtown · 7:30 PM</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                    On track
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      title: 'Poll locked in',
                      detail: 'Rooftop vibes won with 62% of the votes.',
                      done: true
                    },
                    {
                      title: 'Smart suggestions',
                      detail: 'Top 3 spots ready for your mood.',
                      done: true
                    },
                    {
                      title: 'Next up',
                      detail: 'Share final plan with the group chat.',
                      done: false
                    }
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.done ? 'bg-emerald-400/20 text-emerald-100' : 'bg-white/10 text-white/70'}`}>
                        {item.done ? <CheckCircle size={20} /> : <Sparkles size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="text-xs text-white/65">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex -space-x-3">
                    {['FA', 'JR', 'LS', 'MK'].map((initials) => (
                      <div
                        key={initials}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-sm font-semibold text-white/85"
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-white/70">
                    12 friends collaborating in real time
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex h-12 w-6 items-center justify-center rounded-full border-2 border-white/30"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-2 h-3 w-1 rounded-full bg-white/50"
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
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 font-bold shadow-xl shadow-primary-500/20">
                    {step.id}
                  </div>
                  <div className="absolute -top-3 left-1/2 h-12 w-32 -translate-x-1/2 rounded-full bg-white/20 blur-3xl opacity-60" />
                  <div className="relative h-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-8 pt-14 pb-10 transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/10">
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
