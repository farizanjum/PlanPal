import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Star, Clock, Users, ThumbsUp, CheckCircle, Vote, Plus } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { apiService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSkeleton from '../components/LoadingSkeleton'

const PollPage = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [polls, setPolls] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [votes, setVotes] = useState({})
  const [hasVoted, setHasVoted] = useState({})
  const [isVoting, setIsVoting] = useState(false)
  const [events, setEvents] = useState([])

  // Fetch polls and events data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const eventsData = await apiService.getEventsByGroup(groupId)
        setEvents(eventsData)

        // Get polls for the first event
        let pollsData = []
        if (eventsData.length > 0) {
          pollsData = await apiService.getPollsByEvent(eventsData[0].id)
        }
        
        setPolls(pollsData)

        // Initialize vote tracking from backend data
        const voteMap = {}
        const hasVotedMap = {}
        pollsData.forEach(poll => {
          // Use vote_counts from backend
          const optionCounts = {}
          poll.options.forEach(option => {
            optionCounts[option.id] = { 
              count: poll.vote_counts?.[option.id] || 0, 
              label: option.label 
            }
          })

          voteMap[poll.id] = optionCounts
          // Check if user has already voted
          hasVotedMap[poll.id] = !!poll.user_vote
        })

        setVotes(voteMap)
        setHasVoted(hasVotedMap)
      } catch (error) {
        console.error('Failed to fetch poll data:', error)
        toast.error('Failed to load polls')
      } finally {
        setIsLoading(false)
      }
    }

    if (groupId && user) {
      fetchData()
    }
  }, [groupId, user])

  const handleVote = async (pollId, optionId) => {
    if (hasVoted[pollId] || isVoting) return

    setIsVoting(true)
    try {
      await apiService.castVote(pollId, { option_id: optionId })

      // Refresh poll data to get updated vote counts
      if (events.length > 0) {
        const updatedPolls = await apiService.getPollsByEvent(events[0].id)
        setPolls(updatedPolls)

        // Update vote tracking from refreshed data
        const voteMap = {}
        const hasVotedMap = {}
        updatedPolls.forEach(poll => {
          const optionCounts = {}
          poll.options.forEach(option => {
            optionCounts[option.id] = { 
              count: poll.vote_counts?.[option.id] || 0, 
              label: option.label 
            }
          })
          voteMap[poll.id] = optionCounts
          hasVotedMap[poll.id] = !!poll.user_vote
        })
        setVotes(voteMap)
        setHasVoted(hasVotedMap)
      }

      toast.success('Vote cast successfully!')
    } catch (error) {
      console.error('Failed to cast vote:', error)
      toast.error(error.message || 'Failed to cast vote')
    } finally {
      setIsVoting(false)
    }
  }

  const getTotalVotes = (pollId) => {
    return Object.values(votes[pollId] || {}).reduce((sum, option) => sum + option.count, 0)
  }

  const getVotePercentage = (pollId, optionId) => {
    const totalVotes = getTotalVotes(pollId)
    if (totalVotes === 0) return 0
    return Math.round((votes[pollId]?.[optionId]?.count || 0) / totalVotes * 100)
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <Navbar />

      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => groupId && navigate(`/group/${groupId}`)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Group</span>
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 font-poppins">
                  Group Polls
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Vote on activities and make group decisions together
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => groupId && navigate(`/group/${groupId}`)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                <span>Create Poll</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Polls Section */}
          {polls.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Vote size={64} className="mx-auto text-gray-300 dark:text-zinc-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No polls yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first poll to start gathering opinions!
              </p>
              <button
                onClick={() => groupId && navigate(`/group/${groupId}`)}
                className="btn-primary"
              >
                Create Poll
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {polls.map((poll, index) => (
                <motion.div
                  key={poll.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 dark:border-zinc-700"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 font-poppins">
                        {poll.question}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock size={16} className="mr-1" />
                        <span>{getTotalVotes(poll.id)} votes</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {poll.options.map((option) => {
                      const percentage = getVotePercentage(poll.id, option.id)
                      const isSelected = hasVoted[poll.id]

                      return (
                        <motion.button
                          key={option.id}
                          onClick={() => !hasVoted[poll.id] && handleVote(poll.id, option.id)}
                          disabled={hasVoted[poll.id] || isVoting}
                          whileHover={!hasVoted[poll.id] ? { scale: 1.02 } : {}}
                          whileTap={!hasVoted[poll.id] ? { scale: 0.98 } : {}}
                          className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                            hasVoted[poll.id]
                              ? 'border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700 cursor-not-allowed'
                              : 'border-gray-200 dark:border-zinc-600 hover:border-primary-500 dark:hover:border-primary-400 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                hasVoted[poll.id]
                                  ? 'border-gray-400 bg-gray-400'
                                  : 'border-primary-500'
                              }`} />
                              <span className={`font-medium ${
                                hasVoted[poll.id]
                                  ? 'text-gray-600 dark:text-gray-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {option.label}
                              </span>
                            </div>

                            {hasVoted[poll.id] && (
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 dark:bg-zinc-600 rounded-full h-2">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
                                  {percentage}%
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {hasVoted[poll.id] && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">Vote submitted!</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PollPage