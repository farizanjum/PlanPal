import { supabase } from '../utils/supabase'

const API_BASE_URL = '/api/v1'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async getAuthHeaders() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        return {}
      }

      if (!session) {
        return {}
      }

      if (!session.access_token) {
        return {}
      }

      return {
        Authorization: `Bearer ${session.access_token}`
      }
    } catch (error) {
      return {}
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = await this.getAuthHeaders()

    // Check if we have auth headers for protected endpoints
    const isAuthEndpoint = !['/suggestions', '/health'].some(path => endpoint.startsWith(path))
    if (isAuthEndpoint && Object.keys(headers).length === 0) {
      throw new Error('Authentication required. Please log in first.')
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        error.status = response.status
        error.statusText = response.statusText
        throw error
      }

      const data = await response.json()
      return data
    } catch (error) {
      // Re-throw with additional context
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Please check your internet connection')
      }

      throw error
    }
  }

  // Profile API
  async getUserProfile() {
    return this.request('/profiles')
  }

  async updateUserProfile(profileData) {
    return this.request('/profiles', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  }

  async getGroupMembers(groupId) {
    return this.request(`/profiles/group/${groupId}`)
  }

  async getSmartSuggestions(groupId) {
    const userLocation = JSON.parse(localStorage.getItem('userLocation') || 'null')
    const userMood = localStorage.getItem('userMood') || 'popular'

    if (!userLocation) {
      throw new Error('Location required for smart suggestions. Please share your location first.')
    }

    // Get both movies and places
    const [movies, places] = await Promise.all([
      this.getMovieSuggestions({ limit: 5 }),
      this.getPlaceSuggestions({ limit: 5 })
    ])

    return {
      movies: movies.results || [],
      places: places.results || [],
      location: userLocation,
      mood: userMood,
      generated_at: new Date().toISOString()
    }
  }

  // Chat API
  async getGroupMessages(groupId, limit = 50, offset = 0) {
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    })
    return this.request(`/chat/${groupId}/messages?${queryParams}`)
  }

  async getRecentMessages(groupId) {
    return this.request(`/chat/${groupId}/recent`)
  }

  async sendMessage(groupId, message, messageType = 'text') {
    return this.request(`/chat/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        message_type: messageType
      })
    })
  }

  // Groups API
  async getUserGroups() {
    return this.request('/groups')
  }

  async getGroup(groupId) {
    return this.request(`/groups/${groupId}`)
  }

  async createGroup(groupData) {
    return this.request('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData)
    })
  }

  async joinGroup(groupCode) {
    return this.request('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ group_code: (groupCode || '').trim().toUpperCase() })
    })
  }

  async deleteGroup(groupId) {
    return this.request(`/groups/${groupId}`, {
      method: 'DELETE'
    })
  }

  async removeMemberFromGroup(groupId, memberId) {
    return this.request(`/groups/${groupId}/members/${memberId}`, {
      method: 'DELETE'
    })
  }

  async getGroupMajorityLocation(groupId) {
    return this.request(`/groups/${groupId}/location`)
  }

  // Events API
  async getEventsByGroup(groupId) {
    return this.request(`/events/${groupId}`)
  }

  async createEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    })
  }

  async rsvpToEvent(eventId, status) {
    return this.request(`/events/${eventId}/rsvp`, {
      method: 'POST',
      body: JSON.stringify({ status })
    })
  }

  async getEventRSVPs(eventId) {
    return this.request(`/events/${eventId}/rsvps`)
  }

  async reactToEvent(eventId, reactionType) {
    return this.request(`/events/${eventId}/react`, {
      method: 'POST',
      body: JSON.stringify({ reaction_type: reactionType })
    })
  }

  async getEventReactions(eventId) {
    return this.request(`/events/${eventId}/reactions`)
  }

  async deleteEvent(eventId) {
    return this.request(`/events/${eventId}`, {
      method: 'DELETE'
    })
  }

  // Polls API
  async getPollsByEvent(eventId) {
    return this.request(`/polls/${eventId}`)
  }

  async createPoll(pollData) {
    return this.request('/polls', {
      method: 'POST',
      body: JSON.stringify(pollData)
    })
  }

  async castVote(pollId, voteData) {
    return this.request(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify(voteData)
    })
  }

  async deletePoll(pollId) {
    return this.request(`/polls/${pollId}`, {
      method: 'DELETE'
    })
  }

  // Suggestions API
  async getMovieSuggestions(params = {}) {
    // Get user location and mood from localStorage
    const userLocation = JSON.parse(localStorage.getItem('userLocation') || 'null')
    const userMood = localStorage.getItem('userMood') || 'popular'

    const queryParams = {
      mood: params.mood || userMood,
      limit: params.limit || 10,
      region: 'IN',
      ...params
    }

    const queryString = new URLSearchParams(queryParams).toString()
    const response = await this.request(`/suggestions/movies?${queryString}`)
    return response
  }

  async getPlaceSuggestions(params = {}) {
    // Get user location from localStorage
    const userLocation = JSON.parse(localStorage.getItem('userLocation') || 'null')
    const userMood = localStorage.getItem('userMood') || 'restaurant'

    if (!userLocation) {
      throw new Error('User location is required for place suggestions')
    }

    // Map mood to place type
    let placeType = 'restaurant'
    switch (userMood) {
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

    const queryParams = {
      lat: userLocation.lat,
      lng: userLocation.lng,
      type: params.type || placeType,
      radius: params.radius || 5000,
      limit: params.limit || 10,
      ...params
    }

    const queryString = new URLSearchParams(queryParams).toString()
    const response = await this.request(`/suggestions/places?${queryString}`)
    return response
  }

  async getCafeSuggestions(params = {}) {
    const userLocation = JSON.parse(localStorage.getItem('userLocation') || 'null')

    if (!userLocation) {
      throw new Error('User location is required for cafe suggestions')
    }

    const queryParams = {
      lat: userLocation.lat,
      lng: userLocation.lng,
      radius: params.radius || 3000,
      limit: params.limit || 10,
      ...params
    }

    const queryString = new URLSearchParams(queryParams).toString()
    return this.request(`/suggestions/cafes?${queryString}`)
  }

  async getRestaurantSuggestions(params = {}) {
    const userLocation = JSON.parse(localStorage.getItem('userLocation') || 'null')

    if (!userLocation) {
      throw new Error('User location is required for restaurant suggestions')
    }

    const queryParams = {
      lat: userLocation.lat,
      lng: userLocation.lng,
      radius: params.radius || 5000,
      limit: params.limit || 10,
      ...params
    }

    const queryString = new URLSearchParams(queryParams).toString()
    return this.request(`/suggestions/restaurants?${queryString}`)
  }

  // Chatbot API
  async queryChatbot(groupId, message) {
    return this.request('/chatbot/query', {
      method: 'POST',
      body: JSON.stringify({ groupId, message })
    })
  }
}

// Error handling utilities
export const handleApiError = (error, context = '') => {
  // Handle specific error types
  if (error.status === 401) {
    // Token expired or invalid - redirect to login
    // You could trigger a logout here or redirect to login
  } else if (error.status === 403) {
    // Permission denied
  } else if (error.status >= 500) {
    // Server error
  }

  return error
}

// Retry utility for failed requests
export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry for authentication or permission errors
      if (error.status === 401 || error.status === 403) {
        throw error
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  throw lastError
}

export const apiService = new ApiService()
export default apiService
