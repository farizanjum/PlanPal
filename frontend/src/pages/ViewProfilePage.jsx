import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Calendar, Users, ArrowLeft, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'

export default function ViewProfilePage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        
        // Fetch user profile
        const profileData = await apiService.getProfile()
        setProfile(profileData)
        
        // Fetch user groups
        const groupsData = await apiService.getUserGroups()
        setGroups(groupsData || [])
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchProfile()
    }
  }, [userId, currentUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="bg-gray-300 dark:bg-zinc-700 h-48 rounded-2xl mb-6"></div>
              <div className="bg-gray-300 dark:bg-zinc-700 h-32 rounded-2xl mb-4"></div>
              <div className="bg-gray-300 dark:bg-zinc-700 h-64 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Profile not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mb-6 flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </motion.button>

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-800 rounded-2xl p-8 shadow-xl mb-6"
          >
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User size={48} className="text-white" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {profile.username || 'User'}
                </h1>
                <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Mail size={18} />
                    <span>{profile.email}</span>
                  </div>
                  {profile.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin size={18} />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar size={18} />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {profile.bio && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-xl">
                <p className="text-gray-700 dark:text-gray-300">{profile.bio}</p>
              </div>
            )}
          </motion.div>

          {/* Groups Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-800 rounded-2xl p-8 shadow-xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Users size={24} className="text-purple-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Groups ({groups.length})
              </h2>
            </div>

            {groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <motion.div
                    key={group.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    onClick={() => navigate(`/group/${group.id}`)}
                    className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {group.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        group.group_type === 'work'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      }`}>
                        {group.group_type === 'work' ? '💼 Work' : '👥 Personal'}
                      </span>
                    </div>
                    
                    {group.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Users size={16} />
                      <span>{group.member_count || group.members?.length || 0} members</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-zinc-700/50 rounded-xl">
                <Users size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <p className="text-gray-600 dark:text-gray-400">
                  Not a member of any groups yet
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

