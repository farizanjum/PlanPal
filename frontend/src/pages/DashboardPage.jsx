import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Users, Calendar, ArrowRight, Settings, X, CheckCircle, Clock, Sparkles, MapPin, Smile } from 'lucide-react'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'
import { useAuth } from '../context/AuthContext'

// Utility function for proper pluralization
const pluralize = (count, singular, plural) => {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`
}

// Utility function for formatting dates consistently
const formatDate = (dateString) => {
  if (!dateString) return 'No date set'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const DashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMoodModal, setShowMoodModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [selectedMood, setSelectedMood] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [groups, setGroups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [groupTypeFilter, setGroupTypeFilter] = useState('all') // 'all', 'personal', 'work'
  const [newGroupType, setNewGroupType] = useState('personal') // 'personal' or 'work'
  const [currentMood, setCurrentMood] = useState(() => localStorage.getItem('userMood'))

  // Function to handle mood change button click
  const handleChangeMood = () => {
    setShowMoodModal(true)
  }

  // Update current mood when it changes in localStorage
  useEffect(() => {
    const mood = localStorage.getItem('userMood')
    setCurrentMood(mood)
  }, [showMoodModal])

  // Fetch groups from API
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoading(true)
        const groupsData = await apiService.getUserGroups()
        setGroups(groupsData)
      } catch (error) {
        console.error('Failed to fetch groups:', error)
        toast.error(error.message || 'Failed to load groups')
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchGroups()
    } else {
      setIsLoading(false)
    }
  }, [user])

  // Mock groups data with status for fallback or demo
  const mockGroups = [
    {
      id: '1',
      name: 'Weekend Warriors',
      members: 5,
      upcomingDate: '2024-01-15',
      description: 'Adventure seekers group',
      color: 'from-blue-500 to-purple-500',
      status: 'active'
    },
    {
      id: '2',
      name: 'Movie Night Crew',
      members: 8,
      upcomingDate: '2024-01-12',
      description: 'Cinema enthusiasts',
      color: 'from-red-500 to-pink-500',
      status: 'active'
    },
    {
      id: '3',
      name: 'Foodie Friends',
      members: 6,
      upcomingDate: '2023-12-20',
      description: 'Restaurant explorers',
      color: 'from-green-500 to-teal-500',
      status: 'completed'
    },
    {
      id: '4',
      name: 'Tech Meetup',
      members: 12,
      upcomingDate: '2024-01-20',
      description: 'Tech enthusiasts gathering',
      color: 'from-indigo-500 to-violet-500',
      status: 'active'
    },
    {
      id: '5',
      name: 'Hiking Squad',
      members: 4,
      upcomingDate: '2024-01-10',
      description: 'Mountain adventures',
      color: 'from-emerald-500 to-teal-500',
      status: 'active'
    },
    {
      id: '6',
      name: 'Book Club',
      members: 7,
      upcomingDate: '2023-11-15',
      description: 'Monthly book discussions',
      color: 'from-amber-500 to-orange-500',
      status: 'completed'
    }
  ]

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name')
      return
    }

    if (!user) {
      toast.error('You must be logged in to create a group')
      return
    }

    setIsCreating(true)

    try {
      const groupData = {
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || null,
        group_type: newGroupType, // Add group type
        members: [user.id] // Include creator as first member
      }

      const newGroup = await apiService.createGroup(groupData)

      // Refresh groups list
      const updatedGroups = await apiService.getUserGroups()
      setGroups(updatedGroups)

      setNewGroupName('')
      setNewGroupDescription('')
      setNewGroupType('personal') // Reset to default
      setShowCreateModal(false)
      toast.success(`${newGroupType === 'work' ? 'Work' : 'Personal'} group created successfully!`)
    } catch (error) {
      console.error('Failed to create group:', error)
      toast.error(error.message || 'Failed to create group')
    } finally {
      setIsCreating(false)
    }
  }


  // Generate color based on group name
  const getGroupColor = (groupName) => {
    const colors = [
      'from-blue-500 to-purple-500',
      'from-red-500 to-pink-500',
      'from-green-500 to-teal-500',
      'from-indigo-500 to-violet-500',
      'from-orange-500 to-yellow-500',
      'from-emerald-500 to-teal-500',
      'from-amber-500 to-orange-500'
    ]
    const index = groupName.charCodeAt(0) % colors.length
    return colors[index]
  }

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span className="flex items-center space-x-1 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
          <Clock size={12} />
          <span>Active</span>
        </span>
      )
    }
    return (
      <span className="flex items-center space-x-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-semibold">
        <CheckCircle size={12} />
        <span>Completed</span>
      </span>
    )
  }

  // Show mood modal on first visit or when explicitly requested
  useEffect(() => {
    const hasSeenMoodModal = localStorage.getItem('hasSeenMoodModal')
    const userMood = localStorage.getItem('userMood')

    // Show mood modal only if user hasn't completed the flow
    if (!userMood || !hasSeenMoodModal) {
      setTimeout(() => setShowMoodModal(true), 500)
    }
  }, [])

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood.id)
    setCurrentMood(mood.id)
    localStorage.setItem('userMood', mood.id)
    setShowMoodModal(false)
    
    // If foodie is selected, redirect to suggestions page with places/restaurants
    if (mood.id === 'foodie') {
      localStorage.setItem('hasSeenMoodModal', 'true')
      localStorage.setItem('suggestionType', 'places')
      navigate('/suggestions')
      toast.success('Let\'s find some great restaurants for you!')
    } else {
      // For mood changes (not first time), just show success message
      const isFirstTime = !localStorage.getItem('hasSeenMoodModal')
      if (isFirstTime) {
        setShowLocationModal(true)
      } else {
        toast.success(`Mood updated to ${mood.label}! Check out suggestions for new ideas.`)
      }
    }
  }

  const handleLocationRequest = async () => {
    setIsGettingLocation(true)

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser')
      }

      // Check if we already have permission
      const permission = await navigator.permissions.query({ name: 'geolocation' })

      if (permission.state === 'denied') {
        throw new Error('Location permission denied')
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve(pos)
          },
          (err) => {
            console.error('Geolocation error:', err)
            reject(err)
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000 // 5 minutes
          }
        )
      })

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      }

      setUserLocation(location)
      localStorage.setItem('userLocation', JSON.stringify(location))
      localStorage.setItem('hasSeenMoodModal', 'true')

      toast.success(`Location saved! Getting your personalized recommendations...`)
      setTimeout(() => {
        setShowLocationModal(false)
        // Navigate to general suggestions page
        navigate('/suggestions')
        toast.success(`Here are some ${selectedMood} ideas near you!`)
      }, 1000)

    } catch (error) {
      console.error('Location error:', error)

      let errorMessage = 'Failed to get location.'

      if (error.code === 1 || error.message.includes('denied')) {
        errorMessage = 'Location access denied. Please enable location permissions in your browser settings.'
      } else if (error.code === 2 || error.message.includes('unavailable')) {
        errorMessage = 'Location unavailable. Please check your GPS and try again.'
      } else if (error.code === 3 || error.message.includes('timeout')) {
        errorMessage = 'Location request timed out. Please try again.'
      }

      toast.error(errorMessage)

      // Allow user to continue without location after showing error
      setTimeout(() => {
        localStorage.setItem('hasSeenMoodModal', 'true')
        setShowLocationModal(false)
        toast.info('You can still use the app without location services!')
      }, 3000)
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleSkipLocation = () => {
    localStorage.setItem('hasSeenMoodModal', 'true')
    setShowLocationModal(false)
    toast.success(`Mood saved! Create or join a group to see ${selectedMood} recommendations!`)
  }

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a group code')
      return
    }

    setIsJoining(true)

    try {
      const result = await apiService.joinGroup(joinCode.trim().toUpperCase())

      // Refresh groups list
      const groupsData = await apiService.getUserGroups()
      setGroups(groupsData)

      setJoinCode('')
      setShowJoinModal(false)
      toast.success(result.message || 'Successfully joined group!')
    } catch (error) {
      console.error('Failed to join group:', error)
      toast.error(error.message || 'Failed to join group')
    } finally {
      setIsJoining(false)
    }
  }

  // Filter groups based on type
  const filteredGroups = groups.filter(group => {
    if (groupTypeFilter === 'all') return true
    return group.group_type === groupTypeFilter
  })

  const moods = [
    { id: 'chill', label: 'Chill', emoji: '😌', color: 'from-blue-500 to-cyan-500', desc: 'Relaxed and laid-back' },
    { id: 'adventurous', label: 'Adventurous', emoji: '🏔️', color: 'from-green-500 to-emerald-500', desc: 'Exciting and thrilling' },
    { id: 'foodie', label: 'Foodie', emoji: '🍽️', color: 'from-orange-500 to-red-500', desc: 'Culinary delights' },
  ]

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please Log In
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to be logged in to access your dashboard.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-container">
        <Navbar />
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="section-container section-padding">
            {/* Header Section with improved spacing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                <div className="flex-1">
                  <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-3 font-poppins">
                    Your Groups
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                    Manage your planning groups and start new adventures with friends
                  </p>
                  
                  {/* Current Mood Display */}
                  {currentMood && (
                    <div className="mt-4 flex items-center space-x-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Current mood:</span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleChangeMood}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        <Smile size={18} />
                        <span className="font-medium capitalize">{currentMood}</span>
                        <span className="text-xs opacity-75">(Click to change)</span>
                      </motion.button>
                    </div>
                  )}
                </div>
                
                {/* Action buttons with consistent styling */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {!currentMood && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleChangeMood}
                      className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white rounded-xl transition-all duration-300 font-medium shadow-sm hover:shadow-md"
                      aria-label="Set your mood preference"
                    >
                      <Smile size={18} />
                      <span>Set Mood</span>
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/suggestions')}
                    className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-all duration-300 font-medium shadow-sm hover:shadow-md"
                    aria-label="Browse activity suggestions"
                  >
                    <Sparkles size={18} />
                    <span>Browse Ideas</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowJoinModal(true)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white rounded-xl transition-all duration-300 font-medium shadow-sm hover:shadow-md"
                    aria-label="Join an existing group"
                  >
                    <Users size={18} />
                    <span>Join Group</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                    aria-label="Create a new group"
                  >
                    <Plus size={20} />
                    <span>Create Group</span>
                  </motion.button>
                </div>
              </div>

              {/* Group Type Filter Tabs with improved accessibility */}
              <div className="flex space-x-1 bg-gray-100 dark:bg-zinc-800 rounded-xl p-1" role="tablist" aria-label="Group type filter">
                {[
                  { id: 'all', label: 'All Groups', icon: '📋' },
                  { id: 'personal', label: 'Personal', icon: '👥' },
                  { id: 'work', label: 'Work', icon: '💼' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setGroupTypeFilter(tab.id)}
                    role="tab"
                    aria-selected={groupTypeFilter === tab.id}
                    aria-controls={`${tab.id}-groups`}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      groupTypeFilter === tab.id
                        ? 'bg-white dark:bg-zinc-700 text-primary-500 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span aria-hidden="true">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Groups Grid Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, index) => (
                  <motion.div
                    key={`skeleton-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="card h-full animate-pulse"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-gray-300 dark:bg-zinc-600 rounded-2xl"></div>
                      <div className="w-16 h-6 bg-gray-300 dark:bg-zinc-600 rounded-full"></div>
                    </div>
                    <div className="h-6 bg-gray-300 dark:bg-zinc-600 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-zinc-600 rounded mb-4"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-300 dark:bg-zinc-600 rounded w-20"></div>
                      <div className="h-4 bg-gray-300 dark:bg-zinc-600 rounded w-16"></div>
                    </div>
                  </motion.div>
                ))
              ) : groups.length === 0 ? (
                // Enhanced empty state with better messaging
                <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mb-6 shadow-lg"
                  >
                    <Users size={32} className="text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 font-poppins">
                    No groups yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-8 max-w-md text-lg">
                    Create your first group to start planning amazing outings with friends and family!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                    aria-label="Create your first group"
                  >
                    <Plus size={20} />
                    <span>Create Your First Group</span>
                  </motion.button>
                </div>
              ) : (
                filteredGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="group"
                  >
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-zinc-700 p-6 h-full flex flex-col">
                      {/* Group Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className={`w-16 h-16 bg-gradient-to-r ${getGroupColor(group.name)} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                          <span className="text-white font-bold text-xl" aria-hidden="true">
                            {group.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <button 
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          aria-label={`Settings for ${group.name}`}
                        >
                          <Settings size={16} className="text-gray-500" />
                        </button>
                      </div>

                      {/* Group Info */}
                      <div className="flex-grow">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 font-poppins">
                          {group.name}
                        </h3>
                        
                        {group.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm line-clamp-2">
                            {group.description}
                          </p>
                        )}

                        {/* Group Stats */}
                        <div className="flex items-center justify-between mb-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Users size={16} className="mr-2" />
                            <span>{pluralize(group.members?.length || 0, 'member', 'members')}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar size={16} className="mr-2" />
                            <span>{formatDate(group.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => group.id && navigate(`/group/${group.id}`)}
                        className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg group/btn focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        aria-label={`View details for ${group.name} group`}
                      >
                        <span className="font-medium">View Group</span>
                        <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
              </div>
            </motion.div>

            {/* Floating Create Button (Mobile) */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="md:hidden fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 focus:outline-none focus:ring-4 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Create new group"
            >
              <Plus size={24} />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Mood Recommendation Modal with enhanced styling */}
      <AnimatePresence>
        {showMoodModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              localStorage.setItem('hasSeenMoodModal', 'true')
              setShowMoodModal(false)
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mood-modal-title"
            aria-describedby="mood-modal-description"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-zinc-800 rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <Sparkles className="text-white" size={36} />
                </motion.div>
                <h2 id="mood-modal-title" className="text-3xl font-bold text-gray-900 dark:text-white mb-3 font-poppins">
                  What's your vibe?
                </h2>
                <p id="mood-modal-description" className="text-gray-600 dark:text-gray-400 text-lg">
                  Tell us your preference and we'll personalize recommendations for you
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {moods.map((mood, index) => (
                  <motion.button
                    key={mood.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMoodSelect(mood)}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-500 focus:ring-offset-2 ${
                      selectedMood === mood.id
                        ? `border-primary-500 bg-gradient-to-br ${mood.color} shadow-lg shadow-primary-500/25`
                        : 'border-gray-200 dark:border-zinc-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md'
                    }`}
                    aria-pressed={selectedMood === mood.id}
                    aria-describedby={`mood-${mood.id}-desc`}
                  >
                    <div className={`text-5xl mb-4 ${selectedMood === mood.id ? 'transform scale-110' : ''}`} aria-hidden="true">
                      {mood.emoji}
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${selectedMood === mood.id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {mood.label}
                    </h3>
                    <p id={`mood-${mood.id}-desc`} className={`text-sm ${selectedMood === mood.id ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                      {mood.desc}
                    </p>
                  </motion.button>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    localStorage.setItem('hasSeenMoodModal', 'true')
                    setShowMoodModal(false)
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-lg px-4 py-2"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowLocationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <MapPin className="text-white" size={36} />
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-poppins">
                  Share Your Location
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  We'll recommend {selectedMood} places and activities near you
                </p>
              </div>

              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLocationRequest}
                  disabled={isGettingLocation}
                  className="w-full flex items-center justify-center space-x-3 py-4 px-6 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {isGettingLocation ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Getting location...</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={20} />
                      <span>Share My Location</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSkipLocation}
                  disabled={isGettingLocation}
                  className="w-full flex items-center justify-center space-x-3 py-4 px-6 border-2 border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Skip for now</span>
                </motion.button>
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your location helps us provide better recommendations
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
                  Create New Group
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-700 text-gray-900 dark:text-white transition-all"
                    placeholder="Enter group name"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-700 text-gray-900 dark:text-white transition-all resize-none"
                    placeholder="What's this group about?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Group Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setNewGroupType('personal')}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        newGroupType === 'personal'
                          ? 'border-primary-500 bg-gradient-to-br from-blue-500/10 to-purple-500/10 shadow-md'
                          : 'border-gray-200 dark:border-zinc-700 hover:border-primary-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">👥</div>
                      <div className={`font-semibold ${newGroupType === 'personal' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                        Personal
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Friends & Family
                      </div>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setNewGroupType('work')}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        newGroupType === 'work'
                          ? 'border-secondary-500 bg-gradient-to-br from-green-500/10 to-teal-500/10 shadow-md'
                          : 'border-gray-200 dark:border-zinc-700 hover:border-secondary-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">💼</div>
                      <div className={`font-semibold ${newGroupType === 'work' ? 'text-secondary-600 dark:text-secondary-400' : 'text-gray-900 dark:text-white'}`}>
                        Work
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Colleagues & Teams
                      </div>
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewGroupName('')
                    setNewGroupDescription('')
                    setNewGroupType('personal')
                  }}
                  className="flex-1 py-3 px-4 border-2 border-gray-300 dark:border-zinc-600 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={isCreating || !newGroupName.trim()}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Join Group Modal */}
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Users className="text-white" size={36} />
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-poppins">
                  Join Group
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter a group code to join an existing group
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Group Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code (e.g., ABC123)"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-center text-2xl font-mono tracking-wider"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinGroup}
                  disabled={isJoining || joinCode.length !== 6}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? 'Joining...' : 'Join Group'}
                </button>
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ask a group member for the code to join
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default DashboardPage
