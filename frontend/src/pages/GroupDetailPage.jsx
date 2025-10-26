import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Calendar, MapPin, Users, Clock, Star, Vote, Settings, X, User, Sparkles, Share2, Copy, Check, Heart, Flame, MessageCircle, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

import LoadingSkeleton from '../components/LoadingSkeleton'

const GroupDetailPage = () => {
  const navigate = useNavigate()
  const { groupId, code } = useParams()
  const { user } = useAuth()

  const [group, setGroup] = useState(null)
  const [events, setEvents] = useState([])
  const [polls, setPolls] = useState([])
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [showCreatePollModal, setShowCreatePollModal] = useState(false)
  const [topMovies, setTopMovies] = useState([])
  const [topPlaces, setTopPlaces] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [eventRSVPs, setEventRSVPs] = useState({})
  const [eventReactions, setEventReactions] = useState({})

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date_time: '',
    location_name: '',
    location_lat: '',
    location_lng: '',
    location_address: ''
  })

  // Poll form state
  const [pollForm, setPollForm] = useState({
    question: '',
    options: [{ id: '1', label: '' }, { id: '2', label: '' }]
  })

  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [isCreatingPoll, setIsCreatingPoll] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showEventInfoModal, setShowEventInfoModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  // Handle join code from URL
  useEffect(() => {
    if (code && !groupId) {
      // User came via join link, show join modal with code pre-filled
      setJoinCode(code)
      setShowJoinModal(true)
    }
  }, [code, groupId])

  // Fetch group, events, and members data
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setIsLoading(true)
        console.log('GroupDetailPage: Fetching data for groupId:', groupId, 'user:', user?.id)
        const [groupData, eventsData, membersData] = await Promise.all([
          apiService.getGroup(groupId),
          apiService.getEventsByGroup(groupId),
          apiService.getGroupMembers(groupId)
        ])
        console.log('GroupDetailPage: Received group data:', groupData)
        console.log('GroupDetailPage: Received events data:', eventsData)
        console.log('GroupDetailPage: Received members data:', membersData)
        setGroup(groupData)
        setEvents(eventsData)
        setMembers(membersData)
        
        // Fetch polls for the first event if exists
        if (eventsData && eventsData.length > 0) {
          try {
            const pollsData = await apiService.getPollsByEvent(eventsData[0].id)
            console.log('GroupDetailPage: Received polls data:', pollsData)
            setPolls(pollsData || [])
          } catch (pollError) {
            console.error('Failed to fetch polls:', pollError)
            setPolls([])
          }
        }
      } catch (error) {
        console.error('GroupDetailPage: Failed to fetch group data:', error)
        toast.error(error.message || 'Failed to load group data')
        navigate('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    if (groupId && user) {
      console.log('GroupDetailPage: Starting to fetch group data')
      fetchGroupData()
    } else {
      console.log('GroupDetailPage: Skipping fetch - groupId:', groupId, 'user:', !!user)
    }
  }, [groupId, user, navigate])

  // Fetch top suggestions for the group
  useEffect(() => {
    const fetchTopSuggestions = async () => {
      if (!group || !user) return
      
      try {
        setLoadingSuggestions(true)
        
        // Get user location or use stored location
        let userLocation = JSON.parse(localStorage.getItem('userLocation') || 'null')
        // One-time fallback: try to prompt for location if not stored
        if (!userLocation && navigator?.geolocation) {
          await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                localStorage.setItem('userLocation', JSON.stringify(userLocation))
                resolve()
              },
              () => resolve(),
              { enableHighAccuracy: true, timeout: 8000 }
            )
          })
        }
        const userMood = localStorage.getItem('userMood') || 'popular'
        
        // Fetch top 5 movies
        const moviesResponse = await apiService.getMovieSuggestions({ 
          mood: userMood, 
          limit: 5 
        })
        
        if (moviesResponse && moviesResponse.results) {
          setTopMovies(moviesResponse.results.slice(0, 5))
        }
        
        // Fetch top 5 places (if location available)
        if (userLocation) {
          const placesResponse = await apiService.getPlaceSuggestions({
            lat: userLocation.lat,
            lng: userLocation.lng,
            type: 'restaurant',
            limit: 5
          })
          
          if (placesResponse && placesResponse.results) {
            setTopPlaces(placesResponse.results.slice(0, 5))
          }
        }
      } catch (error) {
        console.error('Failed to fetch top suggestions:', error)
        // Don't show error toast - this is optional feature
      } finally {
        setLoadingSuggestions(false)
      }
    }

    fetchTopSuggestions()
  }, [group, user])

  // Fetch RSVP and reaction data for events
  useEffect(() => {
    const fetchEventData = async () => {
      if (!events.length || !user) return

      try {
        const rsvpData = {}
        const reactionData = {}

        for (const event of events) {
          // Fetch RSVPs
          try {
            const rsvpResponse = await apiService.getEventRSVPs(event.id)
            rsvpData[event.id] = rsvpResponse
          } catch (error) {
            console.error('Failed to fetch RSVPs for event:', event.id, error)
            rsvpData[event.id] = { counts: { going: 0, maybe: 0, not_going: 0 }, rsvps: [] }
          }

          // Fetch reactions
          try {
            const reactionResponse = await apiService.getEventReactions(event.id)
            reactionData[event.id] = reactionResponse
          } catch (error) {
            console.error('Failed to fetch reactions for event:', event.id, error)
            reactionData[event.id] = { counts: { like: 0, love: 0, fire: 0, sad: 0, thinking: 0 }, reactions: [] }
          }
        }

        setEventRSVPs(rsvpData)
        setEventReactions(reactionData)
      } catch (error) {
        console.error('Failed to fetch event data:', error)
      }
    }

    fetchEventData()
  }, [events, user])

  const handleRSVP = async (eventId, status) => {
    try {
      await apiService.rsvpToEvent(eventId, status)

      // Refetch RSVPs to get accurate counts
      const rsvpData = await apiService.getEventRSVPs(eventId)
      setEventRSVPs(prev => ({
        ...prev,
        [eventId]: rsvpData
      }))

      toast.success(`RSVP: ${status.replace('_', ' ')}`)
    } catch (error) {
      console.error('Failed to RSVP:', error)
      toast.error('Failed to update RSVP')
    }
  }

  const handleReaction = async (eventId, reactionType) => {
    try {
      await apiService.reactToEvent(eventId, reactionType)

      // Refetch reactions to get accurate counts
      const reactionData = await apiService.getEventReactions(eventId)
      setEventReactions(prev => ({
        ...prev,
        [eventId]: reactionData
      }))

      toast.success('Reaction added!')
    } catch (error) {
      console.error('Failed to react:', error)
      toast.error('Failed to add reaction')
    }
  }

  const handleCreateEvent = async () => {
    if (!eventForm.title.trim()) {
      toast.error('Please enter an event title')
      return
    }

    setIsCreatingEvent(true)

    try {
      const eventData = {
        group_id: groupId,
        title: eventForm.title.trim(),
        description: eventForm.description.trim() || '',
        date_time: eventForm.date_time || null,
        location: eventForm.location_name ? {
          name: eventForm.location_name,
          lat: parseFloat(eventForm.location_lat) || null,
          lng: parseFloat(eventForm.location_lng) || null,
          address: eventForm.location_address || ''
        } : null
      }

      const newEvent = await apiService.createEvent(eventData)

      // Refresh events list
      const updatedEvents = await apiService.getEventsByGroup(groupId)
      setEvents(updatedEvents)

      // Reset form
      setEventForm({
        title: '',
        description: '',
        date_time: '',
        location_name: '',
        location_lat: '',
        location_lng: '',
        location_address: ''
      })

      setShowCreateEventModal(false)
      toast.success('Event created successfully!')
    } catch (error) {
      console.error('Failed to create event:', error)
      toast.error(error.message || 'Failed to create event')
    } finally {
      setIsCreatingEvent(false)
    }
  }

  const handleCreatePoll = async () => {
    if (!pollForm.question.trim()) {
      toast.error('Please enter a poll question')
      return
    }

    // Validate options
    const validOptions = pollForm.options.filter(option => option.label.trim())
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 options')
      return
    }

    setIsCreatingPoll(true)

    try {
      // Find the first event or create one if none exists
      let eventId
      if (events.length > 0) {
        eventId = events[0].id
      } else {
        // Create a default event first
        const defaultEvent = await apiService.createEvent({
          group_id: groupId,
          title: 'Group Activity',
          description: 'General group activity'
        })
        eventId = defaultEvent.id
        setEvents([defaultEvent])
      }

      const pollData = {
        event_id: eventId,
        question: pollForm.question.trim(),
        options: validOptions.map((option, index) => ({
          id: (index + 1).toString(),
          label: option.label.trim()
        }))
      }

      await apiService.createPoll(pollData)

      // Reset form
      setPollForm({
        question: '',
        options: [{ id: '1', label: '' }, { id: '2', label: '' }]
      })

      setShowCreatePollModal(false)
      toast.success('Poll created successfully!')

      // Navigate to poll page
      if (groupId) navigate(`/poll/${groupId}`)
    } catch (error) {
      console.error('Failed to create poll:', error)
      toast.error(error.message || 'Failed to create poll')
    } finally {
      setIsCreatingPoll(false)
    }
  }

  const addPollOption = () => {
    if (pollForm.options.length < 10) {
      const newId = (pollForm.options.length + 1).toString()
      setPollForm(prev => ({
        ...prev,
        options: [...prev.options, { id: newId, label: '' }]
      }))
    }
  }

  const removePollOption = (index) => {
    if (pollForm.options.length > 2) {
      setPollForm(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }))
    }
  }

  const updatePollOption = (index, label) => {
    setPollForm(prev => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, label } : option
      )
    }))
  }

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a group code')
      return
    }

    setIsJoining(true)

    try {
      const result = await apiService.joinGroup(joinCode.trim().toUpperCase())

      // Refresh groups list (you might want to navigate to dashboard or refresh current page)
      toast.success(result.message || 'Successfully joined group!')
      setJoinCode('')
      setShowJoinModal(false)

      // Optionally navigate to the joined group
      if (result.id !== groupId) {
        navigate(`/group/${result.id}`)
      }
    } catch (error) {
      console.error('Failed to join group:', error)
      toast.error(error.message || 'Failed to join group')
    } finally {
      setIsJoining(false)
    }
  }

  const copyGroupCode = () => {
    if (group?.group_code) {
      navigator.clipboard.writeText(group.group_code)
      toast.success('Group code copied to clipboard!')
    }
  }


  if (isLoading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="pt-20">
          <LoadingSkeleton count={5} />
        </div>
      </div>
    )
  }

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
              You need to be logged in to view groups.
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

  if (!group) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Group not found
            </h2>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <Navbar />

      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section with improved spacing and accessibility */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-2 py-1"
              aria-label="Go back to dashboard"
            >
              <ArrowLeft size={20} />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white font-poppins">
                    {group.name}
                  </h1>
                  {group.created_by === user?.id && (
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                          try {
                            await apiService.deleteGroup(groupId)
                            toast.success('Group deleted successfully')
                            navigate('/dashboard')
                          } catch (error) {
                            toast.error('Failed to delete group')
                          }
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      aria-label={`Delete ${group.name} group`}
                      title="Delete group"
                    >
                      <Trash2 size={24} />
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-8 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Users size={20} className="text-gray-500 dark:text-gray-400" />
                    <span className="font-medium">{pluralize(group.members?.length || 0, 'member', 'members')}</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar size={20} className="text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</span>
                    </div>
                    <div className="ml-7 text-sm font-medium">
                      {formatDate(group.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Section with consistent styling */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Group Code Display */}
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Group Code:</span>
                    <span className="ml-2 font-mono font-bold text-gray-900 dark:text-white">
                      {group.group_code}
                    </span>
                  </div>
                  <button
                    onClick={copyGroupCode}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    aria-label="Copy group code"
                    title="Copy group code"
                  >
                    <Copy size={16} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateEventModal(true)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Create a new event"
                  >
                    <Plus size={20} />
                    <span>Create Event</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreatePollModal(true)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    aria-label="Create a new poll"
                  >
                    <Vote size={20} />
                    <span>Create Poll</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/chat/${groupId}`)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    aria-label="Open group chat"
                  >
                    <MessageCircle size={20} />
                    <span>Group Chat</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white rounded-xl transition-all duration-300 font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    aria-label="Share group with others"
                  >
                    <Share2 size={20} />
                    <span>Share Group</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Polls Section with enhanced empty state */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins">
                Active Polls
              </h2>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreatePollModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                aria-label="Create a new poll"
              >
                <Plus size={20} />
                <span>Create Poll</span>
              </motion.button>
            </div>

            {polls.length === 0 ? (
              <div className="text-center py-16 px-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <Vote size={32} className="text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 font-poppins">
                  No polls yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg max-w-md mx-auto">
                  Create a poll to gather group opinions and make decisions together!
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreatePollModal(true)}
                  className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl mx-auto"
                  aria-label="Create your first poll"
                >
                  <Plus size={20} />
                  <span>Create First Poll</span>
                </motion.button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {polls.map((poll, index) => (
                  <motion.div
                    key={poll.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 dark:border-zinc-700"
                  >
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                          {poll.question}
                        </h3>
                        {poll.created_by === user?.id && (
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this poll?')) {
                                try {
                                  await apiService.deletePoll(poll.id)
                                  setPolls(polls.filter(p => p.id !== poll.id))
                                  toast.success('Poll deleted successfully')
                                } catch (error) {
                                  toast.error('Failed to delete poll')
                                }
                              }
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete poll"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock size={14} className="mr-1" />
                        <span>Created {new Date(poll.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {poll.poll_options?.map((option) => (
                        <div
                          key={option.id}
                          className="relative p-3 rounded-lg bg-gray-50 dark:bg-zinc-700/50 border border-gray-200 dark:border-zinc-600"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {option.option_text}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {option.votes || 0} votes
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
                      <button
                        onClick={() => navigate(`/poll/${groupId}`)}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
                      >
                        Vote Now →
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Members Section with improved styling */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins">
                  Group Members
                </h2>
                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-zinc-700 rounded-full">
                  <Users size={16} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {pluralize(members.length, 'member', 'members')}
                  </span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Edit your profile"
              >
                <User size={18} />
                <span>Edit Profile</span>
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.full_name || 'Member'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {(member.full_name || member.email || 'U')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {member.full_name || 'Anonymous User'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {member.email || 'No email'}
                      </p>
                      {member.phone_number && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 truncate">
                          {member.phone_number}
                        </p>
                      )}
                    </div>
                  </div>
                  {member.id === user?.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                        You
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Top 5 Movies & Places Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins flex items-center space-x-3">
                <Sparkles className="text-purple-500" size={28} />
                <span>Top Recommendations</span>
              </h2>
              <button
                onClick={() => navigate(`/suggestions/${groupId}`)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <span>View All</span>
                <Sparkles size={18} />
              </button>
            </div>

            {/* Top 5 Movies */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🎬</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top 5 Movies</h3>
              </div>
              
              {loadingSuggestions ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-300 dark:bg-zinc-700 h-48 rounded-xl mb-2"></div>
                      <div className="bg-gray-300 dark:bg-zinc-700 h-4 rounded mb-2"></div>
                      <div className="bg-gray-300 dark:bg-zinc-700 h-4 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : topMovies.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {topMovies.map((movie) => (
                    <motion.div
                      key={movie.id}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white dark:bg-zinc-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer"
                      onClick={() => navigate(`/suggestions/${groupId}`)}
                    >
                      <img
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image'}
                        alt={movie.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-3">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                          {movie.title}
                        </h4>
                        <div className="flex items-center space-x-1">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {movie.vote_average?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-gray-600 dark:text-gray-400">
                    No movie recommendations yet. Click "View All" to explore!
                  </p>
                </div>
              )}
            </div>

            {/* Top 5 Places */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">📍</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top 5 Places</h3>
              </div>
              
              {loadingSuggestions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-300 dark:bg-zinc-700 h-32 rounded-xl mb-2"></div>
                      <div className="bg-gray-300 dark:bg-zinc-700 h-4 rounded mb-2"></div>
                      <div className="bg-gray-300 dark:bg-zinc-700 h-4 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : topPlaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {topPlaces.map((place) => (
                    <motion.div
                      key={place.id}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white dark:bg-zinc-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer"
                      onClick={() => navigate(`/suggestions/${groupId}`)}
                    >
                      <img
                        src={place.photo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop'}
                        alt={place.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                          {place.name}
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {place.rating?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                          {place.price_level && (
                            <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                              {'$'.repeat(place.price_level)}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-gray-600 dark:text-gray-400">
                    No place recommendations yet. Enable location and click "View All"!
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Sparkles className="text-purple-600 dark:text-purple-400" size={24} />
                  <p className="text-sm text-purple-900 dark:text-purple-100 font-medium">
                    AI-powered recommendations based on your group's preferences and location
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/suggestions/${groupId}`)}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-semibold text-sm"
                >
                  Explore More
                </button>
              </div>
            </div>
          </motion.div>

          {/* Events Section with enhanced empty state */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins">
                Upcoming Events
              </h2>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateEventModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Create a new event"
              >
                <Plus size={20} />
                <span>Create Event</span>
              </motion.button>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-16 px-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <Calendar size={32} className="text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 font-poppins">
                  No events yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg max-w-md mx-auto">
                  Create your first event to start planning amazing group activities!
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateEventModal(true)}
                  className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl mx-auto"
                  aria-label="Create your first event"
                >
                  <Plus size={20} />
                  <span>Create First Event</span>
                </motion.button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 dark:border-zinc-700"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 font-poppins">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                            {event.description}
                          </p>
                        )}
                      </div>
                      {event.created_by === user?.id && (
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this event?')) {
                              try {
                                await apiService.deleteEvent(event.id)
                                setEvents(events.filter(e => e.id !== event.id))
                                toast.success('Event deleted successfully')
                              } catch (error) {
                                toast.error('Failed to delete event')
                              }
                            }
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete event"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 mb-4">
                      {event.date_time && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Clock size={16} className="mr-2" />
                          <span>{formatDate(event.date_time)}</span>
                        </div>
                      )}

                      {event.location && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin size={16} className="mr-2" />
                          <span>{event.location.name}</span>
                        </div>
                      )}
                    </div>

                    {/* RSVP Section */}
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-700/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">RSVP</span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                          <Users size={12} />
                          <span>{(eventRSVPs[event.id]?.counts?.going || 0) + (eventRSVPs[event.id]?.counts?.maybe || 0)} going</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRSVP(event.id, 'going')}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                            eventRSVPs[event.id]?.rsvps?.find(r => r.user_id === user?.id)?.status === 'going'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 dark:bg-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-500'
                          }`}
                        >
                          ✅ Going ({eventRSVPs[event.id]?.counts?.going || 0})
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRSVP(event.id, 'maybe')}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                            eventRSVPs[event.id]?.rsvps?.find(r => r.user_id === user?.id)?.status === 'maybe'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-200 dark:bg-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-500'
                          }`}
                        >
                          🤔 Maybe ({eventRSVPs[event.id]?.counts?.maybe || 0})
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRSVP(event.id, 'not_going')}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                            eventRSVPs[event.id]?.rsvps?.find(r => r.user_id === user?.id)?.status === 'not_going'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-200 dark:bg-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-500'
                          }`}
                        >
                          ❌ Can't ({eventRSVPs[event.id]?.counts?.not_going || 0})
                        </motion.button>
                      </div>
                    </div>

                    {/* Reactions Section */}
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-700/50 rounded-xl">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">React</span>
                      <div className="flex gap-1">
                        {[
                          { type: 'like', icon: Heart, label: 'Like', color: 'text-red-500' },
                          { type: 'love', icon: Heart, label: 'Love', color: 'text-pink-500' },
                          { type: 'fire', icon: Flame, label: 'Fire', color: 'text-orange-500' },
                          { type: 'sad', icon: Users, label: 'Sad', color: 'text-blue-500' },
                          { type: 'thinking', icon: Users, label: 'Think', color: 'text-purple-500' }
                        ].map(({ type, icon: Icon, label, color }) => (
                          <motion.button
                            key={type}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleReaction(event.id, type)}
                            className={`flex-1 py-2 px-2 rounded-lg text-xs transition-colors ${
                              eventReactions[event.id]?.reactions?.find(r => r.user_id === user?.id)?.reaction_type === type
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                : 'bg-gray-200 dark:bg-zinc-600 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-zinc-500'
                            }`}
                            title={label}
                          >
                            <div className="text-center">
                              <Icon size={14} className={`mx-auto mb-1 ${color}`} />
                              <div className="text-xs font-medium">{eventReactions[event.id]?.counts?.[type] || 0}</div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowEventInfoModal(true)
                      }}
                      className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg group"
                    >
                      <span className="font-medium">More Info</span>
                      <Sparkles size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateEventModal(false)}
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
                  Create Event
                </h2>
                <button
                  onClick={() => setShowCreateEventModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter event title"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter event description"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.date_time}
                    onChange={(e) => setEventForm(prev => ({ ...prev, date_time: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={eventForm.location_name}
                    onChange={(e) => setEventForm(prev => ({ ...prev, location_name: e.target.value }))}
                    placeholder="e.g., Central Park"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={() => setShowCreateEventModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={isCreatingEvent}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingEvent ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Poll Modal */}
      <AnimatePresence>
        {showCreatePollModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreatePollModal(false)}
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
                  Create Poll
                </h2>
                <button
                  onClick={() => setShowCreatePollModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question *
                  </label>
                  <input
                    type="text"
                    value={pollForm.question}
                    onChange={(e) => setPollForm(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="What should we do?"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    {pollForm.options.map((option, index) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                        />
                        {pollForm.options.length > 2 && (
                          <button
                            onClick={() => removePollOption(index)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {pollForm.options.length < 10 && (
                    <button
                      onClick={addPollOption}
                      className="w-full mt-2 py-2 px-4 border-2 border-dashed border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-gray-400 rounded-lg hover:border-primary-500 hover:text-primary-500 transition-colors"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={() => setShowCreatePollModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePoll}
                  disabled={isCreatingPoll}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingPoll ? 'Creating...' : 'Create Poll'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Group Modal */}
      <AnimatePresence>
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
                  className="w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4"
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowShareModal(false)}
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
                    <Share2 className="text-white" size={36} />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-poppins">
                    Share Group
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Share this link with friends to invite them to join your group
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-zinc-700 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Group Link:
                      </span>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/join/${group.group_code}`
                          navigator.clipboard.writeText(url)
                          toast.success('Link copied to clipboard!')
                        }}
                        className="flex items-center space-x-2 px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                      >
                        <Copy size={14} />
                        <span className="text-sm">Copy</span>
                      </button>
                    </div>
                    <p className="mt-2 text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                      {`${window.location.origin}/join/${group.group_code}`}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-zinc-700 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Group Code:
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(group.group_code)
                          toast.success('Code copied to clipboard!')
                        }}
                        className="flex items-center space-x-2 px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                      >
                        <Copy size={14} />
                        <span className="text-sm">Copy</span>
                      </button>
                    </div>
                    <p className="mt-2 text-center text-2xl font-mono font-bold text-gray-900 dark:text-white">
                      {group.group_code}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex space-x-3">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>

      {/* Event More Info Modal */}
      <AnimatePresence>
        {showEventInfoModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEventInfoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedEvent.title}</h2>
                <button
                  onClick={() => setShowEventInfoModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Event Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Event Details</h3>
                  <div className="space-y-3">
                    {selectedEvent.description && (
                      <div className="flex items-start space-x-3">
                        <Calendar className="text-primary-500 mt-1" size={20} />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEvent.description}</p>
                        </div>
                      </div>
                    )}
                    {selectedEvent.date_time && (
                      <div className="flex items-start space-x-3">
                        <Clock className="text-primary-500 mt-1" size={20} />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Date & Time</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(selectedEvent.date_time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedEvent.location && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="text-primary-500 mt-1" size={20} />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEvent.location.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate(`/chat/${groupId}`)}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                  >
                    <MessageCircle size={18} />
                    <span>Discuss in Chat</span>
                  </button>
                  <button
                    onClick={() => navigate(`/poll/${groupId}`)}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                  >
                    <Vote size={18} />
                    <span>View Polls</span>
                  </button>
                </div>

                {/* AI Suggestion Hint */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                    <Sparkles className="text-purple-500" size={16} />
                    <span>💡 <strong>Tip:</strong> Use Group Chat and type <code className="px-2 py-1 bg-white dark:bg-zinc-800 rounded">@bot suggest activities</code> for AI-powered recommendations!</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GroupDetailPage
