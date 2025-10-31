import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Smile, Check, CheckCheck, Paperclip } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { apiService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { supabase } from '../utils/supabase'

const ChatPage = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [group, setGroup] = useState(null)

  const messagesEndRef = useRef(null)
  const messageInputRef = useRef(null)
  // Ensure scroll container ref exists
  const chatContainerRef = useRef(null)
  // Optional smooth scroll instance guard (may be undefined)
  const lenisInstance = useRef(null)
  // Hidden file input
  const fileInputRef = useRef(null)
  // Supabase realtime broadcast channel
  const channelRef = useRef(null)
  const [memberProfiles, setMemberProfiles] = useState({})
  const memberProfilesRef = useRef({})
  const PAGE_LIMIT = 50
  const [nextOffset, setNextOffset] = useState(0)

  // Typing/emoji UI state
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Pagination state
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Chat table name (default to chat_messages, legacy fallback handled dynamically)
  const [chatTable, setChatTable] = useState('chat_messages')

  const updateProfileCache = useCallback((profiles = []) => {
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return memberProfilesRef.current
    }

    const updatedProfiles = { ...memberProfilesRef.current }
    let changed = false

    profiles.forEach((profile) => {
      if (!profile?.id) {
        return
      }

      const current = updatedProfiles[profile.id]
      if (!current || current.full_name !== profile.full_name || current.avatar_url !== profile.avatar_url || current.username !== profile.username) {
        updatedProfiles[profile.id] = profile
        changed = true
      }
    })

    if (!changed) {
      return memberProfilesRef.current
    }

    memberProfilesRef.current = updatedProfiles
    setMemberProfiles(updatedProfiles)
    return updatedProfiles
  }, [])

  const normalizeMessageSync = (message, profileMap = memberProfilesRef.current) => {
    if (!message) return null

    const normalized = { ...message }
    normalized.content = message.content || message.message || message.text || ''

    if (normalized.message_type === 'system' || normalized.user_id === 'bot') {
      normalized.user_id = normalized.user_id || 'bot'
      normalized.profiles = {
        full_name: '🤖 PlanPal Bot',
        avatar_url: null
      }
      return normalized
    }

    if (normalized.user_id && !normalized.profiles && profileMap?.[normalized.user_id]) {
      normalized.profiles = profileMap[normalized.user_id]
    }

    return normalized
  }

  const normalizeMessagesSync = (list = [], profileMap = memberProfilesRef.current) => {
    if (!Array.isArray(list) || list.length === 0) {
      return []
    }

    return list
      .map((msg) => normalizeMessageSync(msg, profileMap))
      .filter(Boolean)
  }

  const ensureProfileForUser = useCallback(async (userId) => {
    if (!userId) {
      return null
    }

    if (userId === 'bot') {
      return {
        full_name: '🤖 PlanPal Bot',
        avatar_url: null
      }
    }

    const existing = memberProfilesRef.current[userId]
    if (existing) {
      return existing
    }

    try {
      const members = await apiService.getGroupMembers(groupId)
      const updated = updateProfileCache(members || [])
      return updated[userId] || null
    } catch (err) {
      console.error('Failed to fetch profile for user:', userId, err)
      return null
    }
  }, [groupId, updateProfileCache])

  const enrichMessage = useCallback(async (rawMessage) => {
    const normalized = normalizeMessageSync(rawMessage)
    if (!normalized) {
      return null
    }

    if ((normalized.message_type === 'system' || normalized.user_id === 'bot') && !normalized.profiles) {
      normalized.profiles = {
        full_name: '🤖 PlanPal Bot',
        avatar_url: null
      }
      normalized.user_id = normalized.user_id || 'bot'
      return normalized
    }

    if (normalized.user_id && !normalized.profiles) {
      const profile = await ensureProfileForUser(normalized.user_id)
      if (profile) {
        normalized.profiles = profile
      }
    }

    if (normalized.profiles?.id) {
      updateProfileCache([normalized.profiles])
    }

    return normalized
  }, [ensureProfileForUser, updateProfileCache])

  useEffect(() => {
    memberProfilesRef.current = memberProfiles
  }, [memberProfiles])

  // Load messages and group data
  useEffect(() => {
    const loadChatData = async () => {
      if (!groupId || !user) return

      try {
        setIsLoading(true)
        setHasMore(true)
        setNextOffset(0)

        const [groupData, memberProfilesData, messagesResponse] = await Promise.all([
          apiService.getGroup(groupId),
          apiService.getGroupMembers(groupId).catch((err) => {
            console.error('Failed to fetch group members:', err)
            return []
          }),
          apiService.getGroupMessages(groupId, PAGE_LIMIT, 0)
        ])

        setGroup(groupData)
  setChatTable('chat_messages')

        const profileMap = updateProfileCache(memberProfilesData || [])
        const messageProfiles = (messagesResponse?.messages || [])
          .map((msg) => msg?.profiles)
          .filter((profile) => profile && profile.id)
        const mergedProfileMap = messageProfiles.length > 0
          ? updateProfileCache(messageProfiles)
          : profileMap

        const fetchedMessages = normalizeMessagesSync(messagesResponse?.messages || [], mergedProfileMap)

        setMessages(fetchedMessages)

        const initialLimit = messagesResponse?.limit ?? PAGE_LIMIT
        const initialOffset = messagesResponse?.offset ?? 0
        const fetchedCount = messagesResponse?.messages?.length ?? 0

        setHasMore(fetchedCount === initialLimit)
        setNextOffset(initialOffset + fetchedCount)
      } catch (error) {
        console.error('Failed to load chat data:', error)
        toast.error('Failed to load chat')
        navigate('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    loadChatData()
  }, [groupId, user, navigate, PAGE_LIMIT, updateProfileCache])

  // Real-time message subscription
  useEffect(() => {
    if (!groupId || !chatTable) return // Wait until table is determined

    // Subscribe to new messages for this group
    const channel = supabase
      .channel(`chat:${groupId}:${chatTable}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: chatTable,
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          const newMessage = payload.new
          if (!newMessage) {
            return
          }
          
          if (newMessage.user_id === user?.id) {
            return
          }
          
          if (chatTable === 'chat_messages' && newMessage.message && !newMessage.content) {
            newMessage.content = newMessage.message
          }

          const enriched = await enrichMessage(newMessage)
          if (!enriched) {
            return
          }

          setMessages(prev => {
            const exists = prev.some(m => m.id === enriched.id)
            if (exists) {
              return prev
            }
            return [...prev, enriched]
          })
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user, chatTable, enrichMessage])

  // Supabase Realtime broadcast: subscribe to in-app chat events per group
  useEffect(() => {
    if (!groupId) return

    // Create a broadcast channel for this group
    const ch = supabase.channel(`chat-broadcast:${groupId}`, {
      config: { broadcast: { self: true } }
    })

    channelRef.current = ch

    ch.on('broadcast', { event: 'message' }, ({ payload }) => {
      const broadcasted = payload?.message
      if (!broadcasted) return
      if (String(broadcasted.group_id) !== String(groupId)) return

      if (chatTable === 'chat_messages' && broadcasted.message && !broadcasted.content) {
        broadcasted.content = broadcasted.message
      }

      enrichMessage(broadcasted)
        .then((enriched) => {
          if (!enriched) return
          setMessages(prev => {
            const exists = prev.some(m => m.id === enriched.id)
            if (exists) return prev
            return [...prev, enriched]
          })
        })
        .catch((err) => {
          console.error('Failed to process broadcast message:', err)
        })
    }).subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [groupId, chatTable, enrichMessage])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle scroll containment for chat
  useEffect(() => {
    const chatContainer = chatContainerRef.current
    if (!chatContainer) return

    const handleWheel = (e) => {
      const chatScrollArea = chatContainer.querySelector('.chat-scroll-container')
      if (!chatScrollArea) return

      const { scrollTop, scrollHeight, clientHeight } = chatScrollArea
      const isAtTop = scrollTop === 0
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

      // If scrolling up at top or down at bottom, allow page scroll
      if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
        return // Allow default behavior (page scroll)
      }

      // Otherwise, prevent page scroll and scroll chat only
      e.stopPropagation()
    }

    chatContainer.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      chatContainer.removeEventListener('wheel', handleWheel)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return

    const messageToSend = message.trim()
    setMessage('')
    setIsSending(true)

    try {
      const isBotCommand = messageToSend.toLowerCase().startsWith('@bot ') ||
        messageToSend.toLowerCase().startsWith('@bot,') ||
        messageToSend.toLowerCase().startsWith('@bot')

      const messageType = isBotCommand ? 'bot_query' : 'text'

      const response = await apiService.sendMessage(groupId, messageToSend, messageType)

      const pendingMessages = []

      if (response?.userMessage) {
        pendingMessages.push(response.userMessage)
      } else if (response) {
        pendingMessages.push(response)
      }

      if (response?.botMessage) {
        const botPayload = {
          ...response.botMessage,
          user_id: response.botMessage.user_id || 'bot',
          message_type: response.botMessage.message_type || 'system'
        }
        pendingMessages.push(botPayload)
      }

      const enrichedMessages = []
      for (const rawMsg of pendingMessages) {
        const enriched = await enrichMessage(rawMsg)
        if (enriched) {
          enrichedMessages.push(enriched)
        }
      }

      if (enrichedMessages.length > 0) {
        setMessages(prev => {
          const combined = [...prev]
          enrichedMessages.forEach((msg) => {
            const exists = combined.some(existing => existing.id === msg.id)
            if (!exists) {
              combined.push(msg)
            }
          })
          return combined
        })

        if (channelRef.current) {
          enrichedMessages.forEach((msg) => {
            channelRef.current.send({
              type: 'broadcast',
              event: 'message',
              payload: { message: msg }
            })
          })
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
      setMessage(messageToSend) // Restore message on failure
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // Format bot messages with better line breaks and styling
  const formatBotMessage = (text) => {
    if (!text) return []
    
    // Split by lines and process
    const lines = text.split('\n').map(line => line.trim()).filter(line => line)
    
    return lines.map((line, index) => {
      // Check if it's a bullet point
      if (line.startsWith('*') || line.startsWith('•')) {
        return {
          type: 'bullet',
          content: line.replace(/^[*•]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1'),
          key: `line-${index}`
        }
      }
      
      // Check if it's a numbered list
      if (/^\d+\./.test(line)) {
        return {
          type: 'numbered',
          content: line.replace(/\*\*(.*?)\*\*/g, '$1'),
          key: `line-${index}`
        }
      }
      
      // Regular text - remove markdown bold
      return {
        type: 'text',
        content: line.replace(/\*\*(.*?)\*\*/g, '$1'),
        key: `line-${index}`
      }
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Mock typing indicator
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(false)
      setTypingUsers([])
    }, 2000)
    return () => clearTimeout(timer)
  }, [messages])

  // Disable Lenis for chat scroll area (guarded)
  useEffect(() => {
    const chatContainer = chatContainerRef.current
    if (chatContainer && lenisInstance.current) {
      lenisInstance.current.options.wrapper = chatContainer
    }

    return () => {
      if (lenisInstance.current) {
        lenisInstance.current.options.wrapper = window
      }
    }
  }, [])


  const handleTyping = (e) => {
    setMessage(e.target.value)
    if (!isTyping) {
      setIsTyping(true)
      setTypingUsers(['Alice', 'Bob'])
    }
  }

  const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '🎉', '❤️', '🔥', '💯', '🎉', '😊', '😎', '🤗', '🥳']

  const handleEmojiClick = (emoji) => {
    setMessage(message + emoji)
    setShowEmojiPicker(false)
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id
      if (!userId) throw new Error('Not authenticated')

      const ext = file.name.split('.').pop()
      const path = `${groupId}/${userId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(path, file, { upsert: false })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(path)

      const publicUrl = urlData?.publicUrl
      if (!publicUrl) throw new Error('Failed to get public URL')

      let insertAttachment
      if (chatTable === 'chat_messages') {
        insertAttachment = { group_id: groupId, user_id: userId, message: publicUrl, message_type: 'attachment' }
      } else {
        insertAttachment = { group_id: groupId, user_id: userId, attachment_url: publicUrl }
      }

      const { data, error } = await supabase
        .from(chatTable)
        .insert([insertAttachment])
        .select(chatTable === 'chat_messages'
          ? 'id, group_id, user_id, content:message, message_type, created_at'
          : 'id, group_id, user_id, content, attachment_url, created_at'
        )
        .single()
      if (error) throw error

      const normalizedAttachment = await enrichMessage({
        ...data,
        message_type: data.message_type || 'attachment'
      })

      if (normalizedAttachment) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === normalizedAttachment.id)
          if (exists) return prev
          return [...prev, normalizedAttachment]
        })
        toast.success('Attachment sent')

        // Broadcast attachment message
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'message',
            payload: { message: normalizedAttachment }
          })
        }
      }
    } catch (err) {
      console.error('Attachment upload failed:', err)
      toast.error('Failed to upload attachment')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
              You need to be logged in to access the chat.
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

  if (isLoading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="pt-20">
          <LoadingSkeleton count={8} />
        </div>
      </div>
    )
  }

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
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
                <h1 className="page-title">
                  Group Chat
                </h1>
              </div>
            </div>
            <p className="page-subtitle">
              Discuss and finalize your group's plans
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto w-full">
            {/* Chat Messages */}
            <div>
              <motion.div
                ref={chatContainerRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="card h-[650px] flex flex-col overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-900"
              >
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 chat-scroll-container">
                  {hasMore && (
                    <div className="flex justify-center">
                      <button
                        onClick={async () => {
                          if (isLoadingMore || !hasMore) return
                          setIsLoadingMore(true)
                          try {
                            const response = await apiService.getGroupMessages(groupId, PAGE_LIMIT, nextOffset)
                            if (Array.isArray(response?.messages)) {
                              const chunkProfiles = response.messages
                                .map((msg) => msg?.profiles)
                                .filter((profile) => profile && profile.id)
                              if (chunkProfiles.length > 0) {
                                updateProfileCache(chunkProfiles)
                              }
                            }

                            const chunk = normalizeMessagesSync(response?.messages || [], memberProfilesRef.current)

                            if (chunk.length > 0) {
                              setMessages(prev => [...chunk, ...prev])
                              const fetchedCount = response?.messages?.length ?? 0
                              const responseOffset = response?.offset ?? nextOffset
                              setNextOffset(responseOffset + fetchedCount)
                              setHasMore(fetchedCount === (response?.limit ?? PAGE_LIMIT))
                            } else {
                              setHasMore(false)
                            }
                          } catch (err) {
                            console.error('Failed to load older messages:', err)
                            toast.error('Failed to load older messages')
                          } finally {
                            setIsLoadingMore(false)
                          }
                        }}
                        disabled={isLoadingMore}
                        className="px-3 py-1 text-xs rounded-lg border border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                      >
                        {isLoadingMore ? 'Loading…' : 'Load older messages'}
                      </button>
                    </div>
                  )}
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-start space-x-3 ${(msg.user_id === user?.id) ? 'flex-row-reverse space-x-reverse' : ''}`}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-zinc-700 flex-shrink-0"
                        >
                          {msg.profiles?.avatar_url ? (
                            <img
                              src={msg.profiles.avatar_url}
                              alt={msg.profiles.full_name || 'User'}
                              className="w-10 h-10 rounded-xl object-cover"
                            />
                          ) : msg.user_id === 'bot' ? (
                            <span className="text-2xl">🤖</span>
                          ) : (
                            <span className="text-white font-bold text-sm">
                              {((msg.profiles?.full_name || msg.sender || 'U')[0]).toUpperCase()}
                            </span>
                          )}
                        </motion.div>
                        <div className={`flex-1 ${(msg.user_id === user?.id) ? 'flex flex-col items-end' : ''}`}>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {msg.user_id === 'bot' ? '🤖 PlanPal Bot' : (msg.user_id === user?.id ? 'You' : (msg.profiles?.full_name || msg.sender || 'Unknown User'))}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {msg.created_at ? formatMessageTime(msg.created_at) : msg.timestamp}
                            </span>
                            {(msg.user_id === user?.id) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                <CheckCheck size={14} className="text-blue-500" />
                              </motion.div>
                            )}
                          </div>
                          {(chatTable === 'messages' && msg.attachment_url) || (chatTable === 'chat_messages' && msg.message_type === 'attachment') ? (
                            <a
                              href={chatTable === 'messages' ? msg.attachment_url : msg.content}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-block max-w-xs rounded-2xl overflow-hidden shadow-lg ${(msg.user_id === user?.id) ? 'ring-2 ring-primary-300' : ''}`}
                            >
                              {(() => {
                                const url = chatTable === 'messages' ? msg.attachment_url : msg.content
                                return (/\.(png|jpe?g|gif|webp)$/i.test(url))
                                  ? <img src={url} alt="attachment" className="w-full h-auto" />
                                  : (
                                    <div className={`px-4 py-3 ${ (msg.user_id === user?.id) ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-white' }`}>
                                      <span className="text-sm">Attachment</span>
                                    </div>
                                  )
                              })()}
                            </a>
                          ) : (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className={`
                                inline-block px-4 py-3 rounded-2xl shadow-lg max-w-2xl
                                ${(msg.user_id === user?.id)
                                  ? 'bg-primary-500 text-white'
                                  : msg.user_id === 'bot'
                                  ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 text-gray-900 dark:text-white border-2 border-purple-200 dark:border-purple-800'
                                  : 'bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-white'
                                }
                              `}
                            >
                              {msg.user_id === 'bot' ? (
                                <div className="text-sm leading-relaxed space-y-2">
                                  {formatBotMessage(msg.content || msg.text).map((line) => (
                                    <div key={line.key}>
                                      {line.type === 'bullet' && (
                                        <div className="flex items-start space-x-2 ml-2">
                                          <span className="text-purple-600 dark:text-purple-400 font-bold mt-0.5">•</span>
                                          <span className="flex-1">{line.content}</span>
                                        </div>
                                      )}
                                      {line.type === 'numbered' && (
                                        <div className="ml-2">
                                          <span className="font-medium text-purple-600 dark:text-purple-400">{line.content}</span>
                                        </div>
                                      )}
                                      {line.type === 'text' && (
                                        <p className="leading-relaxed">{line.content}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed">{msg.content || msg.text}</p>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Typing Indicator */}
                  <AnimatePresence>
                    {isTyping && typingUsers.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-start space-x-3"
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold">A</span>
                        </div>
                        <div className="bg-white dark:bg-zinc-700 px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-zinc-600 shadow-lg">
                          <div className="flex items-center space-x-2">
                            <motion.div
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                              className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                              className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                              className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 dark:border-zinc-700 p-4 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm">
                  {/* Emoji Picker */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        className="mb-3 p-3 bg-gray-100 dark:bg-zinc-700 rounded-2xl border-2 border-gray-200 dark:border-zinc-600"
                      >
                        <div className="grid grid-cols-5 gap-2">
                          {emojis.map((emoji, index) => (
                            <motion.button
                              key={index}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEmojiClick(emoji)}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-xl transition-colors text-2xl"
                            >
                              {emoji}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleFileUpload}
                      className="p-2.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                    >
                      <Paperclip size={20} className="text-gray-500" />
                    </motion.button>
                    
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={message}
                        onChange={handleTyping}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setShowEmojiPicker(false)}
                        placeholder="Type your message... (Use @bot to ask AI)"
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white transition-all"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        <Smile size={18} className="text-gray-500" />
                      </motion.button>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Send size={20} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,video/*,.pdf,.doc,.docx"
      />
    </div>
  )
}

export default ChatPage