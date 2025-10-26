import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Calendar, Clock, Users, Check, X, Star, Heart } from 'lucide-react'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'

const FinalPlanPage = () => {
  const [rsvpStatus, setRsvpStatus] = useState('pending')
  const [showConfetti, setShowConfetti] = useState(false)
  const [isFinalized, setIsFinalized] = useState(false)

  const attendeesList = [
    { name: 'Alice Johnson', status: 'confirmed', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
    { name: 'Bob Smith', status: 'confirmed', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
    { name: 'Carol Davis', status: 'maybe', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
    { name: 'David Wilson', status: 'pending', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
    { name: 'You', status: rsvpStatus, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }
  ]

  const planDetails = {
    movie: {
      title: 'Inception',
      rating: 8.8,
      year: '2010',
      genre: 'Sci-Fi',
      duration: '148 min',
      image: 'https://images.unsplash.com/photo-1489599809000-4b4a0b5b5b5b?w=300&h=450&fit=crop',
      theater: 'AMC Times Square',
      address: '234 W 42nd St, New York, NY 10036'
    },
    restaurant: {
      title: 'Blue Hill at Stone Barns',
      rating: 4.8,
      cuisine: 'Farm-to-Table',
      price: '$$$$',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop',
      address: '630 Bedford Rd, Pocantico Hills, NY 10591',
      phone: '(914) 366-9600'
    },
    date: 'Saturday, January 15, 2024',
    time: '7:00 PM',
    attendees: attendeesList
  }

  const handleRsvp = (status) => {
    setRsvpStatus(status)
    
    // Trigger confetti for confirmed RSVP
    if (status === 'confirmed') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      toast.success('RSVP confirmed! 🎉')
    } else if (status === 'maybe') {
      toast.success('RSVP: Maybe')
    } else {
      toast.error('RSVP: Can\'t make it')
    }
  }


  const handleFinalize = () => {
    setIsFinalized(true)
    
    // Multiple confetti bursts
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
    
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      })
    }, 250)
    
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      })
    }, 400)

    toast.success('Plan finalized! 🎉')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100 dark:bg-green-900/30'
      case 'maybe': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      case 'pending': return 'text-gray-600 bg-gray-100 dark:bg-gray-700'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <Check size={16} />
      case 'maybe': return <Clock size={16} />
      case 'pending': return <Clock size={16} />
      default: return <Clock size={16} />
    }
  }


  return (
    <div className="page-container relative overflow-hidden">
      <Navbar />
      
      <div className="section-container section-padding">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="page-header"
        >
          <div className="flex items-center space-x-4 mb-4">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h1 className="page-title">
                Final Plan
              </h1>
            </div>
          </div>
          <p className="page-subtitle">
            Your group's adventure is ready to go!
          </p>
        </motion.div>

        {/* Plan Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card p-8 mb-8 bg-gradient-to-r from-primary-500/10 via-white to-secondary-500/10 dark:from-primary-500/10 dark:via-zinc-800 dark:to-secondary-500/10 border-2 border-primary-200 dark:border-primary-800"
        >
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-poppins">
              Adventure Ready! 🚀
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {planDetails.date} at {planDetails.time}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700">
              <div className="text-center">
                <p className="text-2xl mb-2">🎬</p>
                <p className="font-semibold text-gray-900 dark:text-white">{planDetails.movie.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Movie</p>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700">
              <div className="text-center">
                <p className="text-2xl mb-2">🍽️</p>
                <p className="font-semibold text-gray-900 dark:text-white">{planDetails.restaurant.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Restaurant</p>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700">
              <div className="text-center">
                <p className="text-2xl mb-2">👥</p>
                <p className="font-semibold text-gray-900 dark:text-white">{planDetails.attendees.length} People</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Attending</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Movie Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card p-6 mb-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎬</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">Movie Night</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <img
              src={planDetails.movie.image}
              alt={planDetails.movie.title}
              className="w-full md:w-48 h-64 object-cover rounded-xl"
            />
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{planDetails.movie.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Star size={16} className="text-yellow-500" />
                    <span>{planDetails.movie.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{planDetails.movie.year}</span>
                  <span>•</span>
                  <span>{planDetails.movie.genre}</span>
                  <span>•</span>
                  <span>{planDetails.movie.duration}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <MapPin size={18} className="text-primary-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{planDetails.movie.theater}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{planDetails.movie.address}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Calendar size={18} className="text-primary-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{planDetails.date}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{planDetails.time}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Restaurant Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card p-6 mb-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">Dinner Reservation</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <img
              src={planDetails.restaurant.image}
              alt={planDetails.restaurant.title}
              className="w-full md:w-64 h-48 object-cover rounded-xl"
            />
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{planDetails.restaurant.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Star size={16} className="text-yellow-500" />
                    <span>{planDetails.restaurant.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{planDetails.restaurant.cuisine}</span>
                  <span>•</span>
                  <span>{planDetails.restaurant.price}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <MapPin size={18} className="text-primary-500 mt-0.5" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">{planDetails.restaurant.address}</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock size={18} className="text-primary-500 mt-0.5" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">{planDetails.restaurant.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Attendees Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="card p-6 mb-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Users size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">Who's Coming</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {planDetails.attendees.map((attendee, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:shadow-md transition-shadow"
              >
                <img
                  src={attendee.avatar}
                  alt={attendee.name}
                  className="w-12 h-12 rounded-full border-2 border-white dark:border-zinc-700"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{attendee.name}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center space-x-1 ${getStatusColor(attendee.status)}`}>
                  {getStatusIcon(attendee.status)}
                  <span className="capitalize">{attendee.status}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* RSVP Buttons */}
          <div className="border-t border-gray-200 dark:border-zinc-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-poppins">Your RSVP</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRsvp('confirmed')}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                  rsvpStatus === 'confirmed'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
                }`}
              >
                <Check size={20} />
                <span>Yes, I'm in!</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRsvp('maybe')}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                  rsvpStatus === 'maybe'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
                }`}
              >
                <Clock size={20} />
                <span>Maybe</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRsvp('declined')}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                  rsvpStatus === 'declined'
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
                }`}
              >
                <X size={20} />
                <span>Can't make it</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFinalize}
            className={`flex-1 btn-primary flex items-center justify-center space-x-2 text-lg py-4 ${
              isFinalized ? 'animate-glow' : ''
            }`}
          >
            <motion.div
              animate={isFinalized ? { rotate: [0, 360] } : {}}
              transition={{ duration: 0.8 }}
            >
              <Heart size={20} />
            </motion.div>
            <span>{isFinalized ? 'Plan Finalized!' : 'Finalize Plan'}</span>
          </motion.button>
        </motion.div>
      </div>

    </div>
  )
}

export default FinalPlanPage