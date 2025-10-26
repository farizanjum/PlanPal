import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Star, MapPin, Clock, Filter, ChevronDown, Heart, Share2, Sparkles, Navigation } from 'lucide-react'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { apiService } from '../services/api'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const SuggestionsPage = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sortBy, setSortBy] = useState('rating')
  const [moodFilter, setMoodFilter] = useState('chill')
  const [favorites, setFavorites] = useState(new Set())
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [suggestionType, setSuggestionType] = useState('movies') // 'movies' or 'places'
  const [filteredSuggestions, setFilteredSuggestions] = useState([])
  const [locationPermission, setLocationPermission] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem('movieLanguage') || 'en')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
  }, [user, navigate])

  // Request location permission on mount
  useEffect(() => {
    const requestLocation = async () => {
      try {
        // Check if location is already stored
        const storedLocation = localStorage.getItem('userLocation')
        if (storedLocation) {
          setUserLocation(JSON.parse(storedLocation))
          setLocationPermission('granted')
          return
        }

        // Request location from browser
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
              localStorage.setItem('userLocation', JSON.stringify(location))
              setUserLocation(location)
              setLocationPermission('granted')
              toast.success('Location access granted!')
            },
            (error) => {
              console.error('Location error:', error)
              setLocationPermission('denied')
              toast.error('Location access denied. Place suggestions will not be available.')
            }
          )
        } else {
          setLocationPermission('unsupported')
          toast.error('Geolocation is not supported by your browser')
        }
      } catch (error) {
        console.error('Location permission error:', error)
        setLocationPermission('error')
      }
    }

    requestLocation()
  }, [])

  // Reset mood when switching suggestion types
  useEffect(() => {
    if (suggestionType === 'movies') {
      const validMovieMoods = ['chill', 'action', 'thriller', 'family', 'scifi', 'popular']
      if (!validMovieMoods.includes(moodFilter)) {
        setMoodFilter('chill')
      }
    } else {
      const validPlaceMoods = ['chill', 'foodie', 'adventurous']
      if (!validPlaceMoods.includes(moodFilter)) {
        setMoodFilter('chill')
      }
    }
  }, [suggestionType, moodFilter])

  // Fetch suggestions from API
  useEffect(() => {
    if (!user) return

    // Validate mood before fetching
    const validMovieMoods = ['chill', 'action', 'thriller', 'family', 'scifi', 'popular']
    const validPlaceMoods = ['chill', 'foodie', 'adventurous']

    if (suggestionType === 'movies' && !validMovieMoods.includes(moodFilter)) {
      return // Invalid mood, skip fetch
    }
    if (suggestionType === 'places' && !validPlaceMoods.includes(moodFilter)) {
      return // Invalid mood, skip fetch
    }

    const fetchSuggestions = async () => {
      try {
        setIsLoading(true)
        let data

        if (suggestionType === 'movies') {
          // Store mood and language in localStorage for persistence
          localStorage.setItem('userMood', moodFilter)
          localStorage.setItem('movieLanguage', selectedLanguage)
          
          data = await apiService.getMovieSuggestions({ 
            mood: moodFilter, 
            limit: 20,
            language: selectedLanguage
          })
          
          // Transform movie data to match expected format
          if (data && data.results) {
            data = data.results.map(movie => ({
              id: movie.id.toString(),
              title: movie.title,
              type: 'Movie',
              rating: movie.vote_average,
              year: movie.release_date?.split('-')[0] || 'N/A',
              genre: 'Movie',
              duration: 'N/A',
              description: movie.overview,
              image: movie.poster_path,
              distance: 'N/A',
              price: 'N/A',
              mood: moodFilter,
              emoji: '🎬'
            }))
          } else {
            data = []
          }
        } else {
          // Check if location is available for place suggestions
          const storedLocation = localStorage.getItem('userLocation')
          if (!storedLocation) {
            toast.error('Location access required for place suggestions. Please allow location access.')
            setSuggestions([])
            setIsLoading(false)
            return
          }

          const location = JSON.parse(storedLocation)
          
          // Map mood to place type
          let placeType = 'restaurant'
          switch (moodFilter) {
            case 'foodie':
              placeType = 'restaurant'
              break
            case 'chill':
              placeType = 'cafe'
              break
            case 'adventurous':
              placeType = 'tourist_attraction'
              break
            default:
              placeType = 'restaurant'
          }

          // Store mood in localStorage
          localStorage.setItem('userMood', moodFilter)

          data = await apiService.getPlaceSuggestions({
            lat: location.lat,
            lng: location.lng,
            type: placeType,
            radius: 5000,
            limit: 20
          })

          // Transform place data to match expected format
          if (data && data.results) {
            data = data.results.map(place => ({
              id: place.id,
              title: place.name,
              type: placeType === 'cafe' ? 'Cafe' : 'Restaurant',
              rating: place.rating || 0,
              cuisine: place.types?.join(', ') || 'Restaurant',
              price: place.price_level ? '$'.repeat(place.price_level) : '$$',
              distance: 'N/A',
              description: place.address || place.types?.join(', ') || 'Restaurant',
              image: place.photo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop',
              mood: moodFilter,
              emoji: placeType === 'cafe' ? '☕' : '🍽️'
            }))
          } else {
            data = []
          }
        }

        setSuggestions(data || [])
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
        toast.error(error.message || 'Failed to load suggestions')
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [moodFilter, suggestionType, user, selectedLanguage])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...suggestions]

    // Apply mood filter
    if (moodFilter && moodFilter !== 'all') {
      filtered = filtered.filter(item => item.mood === moodFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'price':
          // Simple price sorting (assuming $ = low, $$$$ = high)
          const priceA = (a.price || '').length
          const priceB = (b.price || '').length
          return priceB - priceA
        case 'distance':
          // Parse distance numbers
          const distA = parseFloat((a.distance || '').replace(/[^\d.]/g, '')) || 0
          const distB = parseFloat((b.distance || '').replace(/[^\d.]/g, '')) || 0
          return distA - distB
        default:
          return 0
      }
    })

    setFilteredSuggestions(filtered)
  }, [suggestions, sortBy, moodFilter])

  // Mock suggestions data for fallback
  const mockSuggestions = [
    {
      id: '1',
      title: 'The Grand Budapest Hotel',
      type: 'Movie',
      rating: 8.1,
      year: '2014',
      genre: 'Comedy',
      duration: '99 min',
      description: 'A quirky comedy about a legendary concierge and his protégé.',
      image: 'https://images.unsplash.com/photo-1489599809000-4b4a0b5b5b5b?w=300&h=450&fit=crop',
      distance: '0.5 mi',
      price: '$12',
      mood: 'chill',
      emoji: '🎬'
    },
    {
      id: '2',
      title: 'Blue Hill at Stone Barns',
      type: 'Restaurant',
      rating: 4.8,
      cuisine: 'Farm-to-Table',
      price: '$$$$',
      distance: '2.1 mi',
      description: 'Award-winning farm-to-table dining experience with fresh ingredients.',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop',
      mood: 'foodie',
      emoji: '🍽️'
    },
    {
      id: '3',
      title: 'Central Park Adventure',
      type: 'Activity',
      rating: 4.6,
      duration: '3 hours',
      distance: '1.2 mi',
      description: 'Explore the heart of Manhattan with guided tours and activities.',
      image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=300&h=200&fit=crop',
      price: '$25',
      mood: 'adventurous',
      emoji: '🏞️'
    },
    {
      id: '4',
      title: 'Dune (2021)',
      type: 'Movie',
      rating: 8.0,
      year: '2021',
      genre: 'Sci-Fi',
      duration: '155 min',
      description: 'Epic sci-fi adventure based on Frank Herbert\'s novel.',
      image: 'https://images.unsplash.com/photo-1489599809000-4b4a0b5b5b5b?w=300&h=450&fit=crop',
      distance: '0.8 mi',
      price: '$15',
      mood: 'adventurous',
      emoji: '🎬'
    },
    {
      id: '5',
      title: 'Le Bernardin',
      type: 'Restaurant',
      rating: 4.9,
      cuisine: 'French Seafood',
      price: '$$$$',
      distance: '3.4 mi',
      description: 'World-renowned seafood restaurant with Michelin stars and exquisite service.',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop',
      mood: 'foodie',
      emoji: '🍽️'
    },
    {
      id: '6',
      title: 'Brooklyn Bridge Walk',
      type: 'Activity',
      rating: 4.7,
      duration: '2 hours',
      distance: '2.8 mi',
      description: 'Scenic walk across the iconic Brooklyn Bridge with stunning views.',
      image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=300&h=200&fit=crop',
      price: 'Free',
      mood: 'chill',
      emoji: '🌉'
    }
  ]

  const handleFavorite = (id) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(id)) {
      newFavorites.delete(id)
      toast.success('Removed from favorites')
    } else {
      newFavorites.add(id)
      toast.success('Added to favorites')
    }
    setFavorites(newFavorites)
  }

  const handleShare = (item) => {
    toast.success(`Shared ${item.title} with the group!`)
  }

  // Create sorted version of filtered suggestions
  const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'distance':
        const distA = parseFloat((a.distance || '').replace(/[^\d.]/g, '')) || 0
        const distB = parseFloat((b.distance || '').replace(/[^\d.]/g, '')) || 0
        return distA - distB
      case 'price':
        const priceA = (a.price || '').length
        const priceB = (b.price || '').length
        return priceA - priceB
      default:
        return 0
    }
  })

  const suggestionTypes = [
    { id: 'movies', label: 'Movies', emoji: '🎬', color: 'from-blue-500 to-purple-500' },
    { id: 'places', label: 'Places', emoji: '🍽️', color: 'from-green-500 to-teal-500' }
  ]

  const moodFilters = suggestionType === 'movies' ? [
    { id: 'chill', label: 'Chill', emoji: '😌', color: 'from-blue-500 to-cyan-500' },
    { id: 'action', label: 'Action', emoji: '💥', color: 'from-red-500 to-pink-500' },
    { id: 'thriller', label: 'Thriller', emoji: '😱', color: 'from-purple-500 to-indigo-500' },
    { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦', color: 'from-green-500 to-emerald-500' },
    { id: 'scifi', label: 'Sci-Fi', emoji: '🚀', color: 'from-indigo-500 to-purple-500' },
    { id: 'popular', label: 'Popular', emoji: '⭐', color: 'from-yellow-500 to-orange-500' }
  ] : [
    { id: 'chill', label: 'Cafes', emoji: '☕', color: 'from-amber-500 to-orange-500' },
    { id: 'foodie', label: 'Restaurants', emoji: '🍽️', color: 'from-red-500 to-pink-500' },
    { id: 'adventurous', label: 'Attractions', emoji: '🏞️', color: 'from-green-500 to-teal-500' }
  ]

  const sortOptions = [
    { id: 'rating', label: 'Rating' },
    { id: 'distance', label: 'Distance' },
    { id: 'price', label: 'Price' }
  ]

  return (
    <div className="page-container">
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
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="text-white" size={24} />
                </div>
                <h1 className="page-title">
                  {groupId ? 'Group Suggestions' : 'Smart Suggestions'}
                </h1>
              </div>
            </div>
            <p className="page-subtitle">
              AI-powered recommendations based on your group's preferences
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="card p-6 mb-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-200 dark:border-purple-800"
          >
            <div className="flex flex-col space-y-6">
              {/* Type Switcher */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  What are you looking for?
                </label>
                <div className="flex flex-wrap gap-2">
                  {suggestionTypes.map((type) => (
                    <motion.button
                      key={type.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSuggestionType(type.id)
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center space-x-2 ${
                        suggestionType === type.id
                          ? `bg-gradient-to-r ${type.color} text-white shadow-lg`
                          : 'bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-600 border-2 border-gray-200 dark:border-zinc-600'
                      }`}
                    >
                      <span className="text-lg">{type.emoji}</span>
                      <span>{type.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Mood Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Filter by Mood:
                </label>
                <div className="flex flex-wrap gap-2">
                  {moodFilters.map((filter) => (
                    <motion.button
                      key={filter.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setMoodFilter(filter.id)
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center space-x-2 ${
                        moodFilter === filter.id
                          ? `bg-gradient-to-r ${filter.color} text-white shadow-lg`
                          : 'bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-600 border-2 border-gray-200 dark:border-zinc-600'
                      }`}
                    >
                      <span className="text-lg">{filter.emoji}</span>
                      <span>{filter.label}</span>
                    </motion.button>
                  ))}
                </div>
                
                {/* Language Filter (Movies Only) */}
                {suggestionType === 'movies' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language:
                    </label>
                    <div className="flex gap-2">
                      {[
                        { id: 'en', label: 'English', flag: '🇺🇸' },
                        { id: 'hi', label: 'Hindi', flag: '🇮🇳' }
                      ].map((lang) => (
                        <motion.button
                          key={lang.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSelectedLanguage(lang.id)
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center space-x-2 ${
                            selectedLanguage === lang.id
                              ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg'
                              : 'bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-600 border-2 border-gray-200 dark:border-zinc-600'
                          }`}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span>{lang.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Location Permission Status */}
                {suggestionType === 'places' && locationPermission !== 'granted' && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Navigation size={20} className="text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm text-yellow-800 dark:text-yellow-200">
                          Location access required for place suggestions
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if ('geolocation' in navigator) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                const location = {
                                  lat: position.coords.latitude,
                                  lng: position.coords.longitude
                                }
                                localStorage.setItem('userLocation', JSON.stringify(location))
                                setUserLocation(location)
                                setLocationPermission('granted')
                                toast.success('Location access granted!')
                              },
                              (error) => {
                                console.error('Location error:', error)
                                toast.error('Failed to get location. Please check your browser settings.')
                              }
                            )
                          }
                        }}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Enable Location
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Sort by:
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-700 text-gray-900 dark:text-white hover:border-primary-500 transition-colors w-full lg:w-auto"
                  >
                    <span>{sortOptions.find(opt => opt.id === sortBy)?.label}</span>
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {showSortDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 w-full lg:w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-zinc-700 overflow-hidden z-10"
                      >
                        {sortOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => {
                              setSortBy(option.id)
                              setShowSortDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors ${
                              sortBy === option.id
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Suggestions Grid */}
          <AnimatePresence mode="wait">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 6 }).map((_, index) => (
                    <motion.div
                      key={`skeleton-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="card animate-pulse"
                    >
                      <div className="relative mb-4">
                        <div className="w-full h-48 bg-gray-300 dark:bg-zinc-600 rounded-xl"></div>
                      </div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-6 bg-gray-300 dark:bg-zinc-600 rounded w-3/4"></div>
                      <div className="h-6 bg-gray-300 dark:bg-zinc-600 rounded w-12"></div>
                    </div>
                    <div className="h-4 bg-gray-300 dark:bg-zinc-600 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-zinc-600 rounded mb-4 w-1/2"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-8 bg-gray-300 dark:bg-zinc-600 rounded w-16"></div>
                      <div className="h-8 bg-gray-300 dark:bg-zinc-600 rounded w-16"></div>
                    </div>
                  </motion.div>
                ))
              ) : sortedSuggestions.length === 0 ? (
                // Empty state
                <div className="col-span-full flex flex-col items-center justify-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mb-4">
                    <Sparkles size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No suggestions found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                    Try adjusting your filters or check back later for more recommendations.
                  </p>
                </div>
              ) : (
                sortedSuggestions.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="card group overflow-hidden relative"
                >
                  <div className="relative mb-4">
                    <img
                      src={suggestionType === 'movies' && item.image ? `https://image.tmdb.org/t/p/w500${item.image}` : item.image}
                      alt={item.title}
                      className="w-full h-48 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Type Badge */}
                    <div className="absolute top-3 left-3 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm rounded-xl px-3 py-1.5 border-2 border-gray-200 dark:border-zinc-700">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-lg">{item.emoji}</span>
                        <span className="text-xs font-semibold capitalize">{item.type}</span>
                      </div>
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl px-2.5 py-1.5 shadow-lg">
                      <div className="flex items-center space-x-1">
                        <Star size={14} className="text-white fill-white" />
                        <span className="text-sm font-bold text-white">{item.rating}</span>
                      </div>
                    </div>

                    {/* Mood Tag */}
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-block px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs font-semibold text-white capitalize">
                        {item.mood}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 font-poppins">
                    {item.title}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm line-clamp-2">
                    {item.description}
                  </p>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {item.distance && (
                      <div className="flex items-center space-x-1">
                        <MapPin size={14} />
                        <span>{item.distance}</span>
                      </div>
                    )}
                    {item.duration && (
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{item.duration}</span>
                      </div>
                    )}
                    {item.genre && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-700 rounded text-xs font-medium">
                        {item.genre}
                      </span>
                    )}
                    {item.cuisine && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-700 rounded text-xs font-medium">
                        {item.cuisine}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-lg font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                      {item.price}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-700">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleFavorite(item.id)}
                      className={`p-3 rounded-xl transition-all duration-300 ${
                        favorites.has(item.id)
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <Heart size={20} className={favorites.has(item.id) ? 'fill-current' : ''} />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleShare(item)}
                      className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center space-x-2 font-semibold"
                    >
                      <Share2 size={18} />
                      <span>Share</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))
              )}
              </div>
            </AnimatePresence>


          {/* Continue Button */}
          {sortedSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-12 text-center"
            >
              <button
                onClick={() => groupId ? navigate(`/chat/${groupId}`) : navigate('/dashboard')}
                className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2 group"
              >
                <span>{groupId ? 'Continue to Group Chat' : 'Create a Group'}</span>
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform rotate-180" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
  )
}

export default SuggestionsPage