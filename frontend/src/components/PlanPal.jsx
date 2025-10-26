import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User } from 'lucide-react'

const PlanPal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: -24, y: 24 }) // Position relative to bottom-right
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hey! I'm PlanPal, your event planning assistant. I can help you coordinate plans, suggest ideas, and keep everyone in sync. What would you like to do?",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  // Load saved position from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPosition = localStorage.getItem('planpal_position')
      if (savedPosition) {
        try {
          setPosition(JSON.parse(savedPosition))
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [])
  
  // Save position to localStorage
  const savePosition = (newPosition) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('planpal_position', JSON.stringify(newPosition))
    }
  }

  // Get drag constraints
  const [mounted, setMounted] = useState(typeof window !== 'undefined')
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const getDragConstraints = (width, height) => {
    if (!mounted || typeof window === 'undefined') return { left: 0, right: 0, top: 0, bottom: 0 }
    return {
      left: -window.innerWidth + width,
      right: 0,
      top: -window.innerHeight + height,
      bottom: 0
    }
  }

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(inputValue)
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1000)
  }

  const generateBotResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase()

    // Quick action responses
    if (lowerInput.includes('create') || lowerInput.includes('new')) {
      return {
        id: Date.now(),
        text: "Great! I can help you create a new group. Here are some quick actions:\n\n🎯 Click 'Create Group' button at the top\n📝 Or tell me more details about your event and I can guide you through it!\n\nWhat type of event are you planning?",
        sender: 'bot',
        timestamp: new Date()
      }
    }

    if (lowerInput.includes('suggest') || lowerInput.includes('ideas')) {
      return {
        id: Date.now(),
        text: "Looking for event ideas? I can suggest:\n\n🎬 Movies & Entertainment\n🍽️ Restaurants & Dining\n✈️ Travel & Trips\n🎉 Parties & Celebrations\n🎨 Workshops & Activities\n\nOr tell me your mood - I can recommend things! 😊",
        sender: 'bot',
        timestamp: new Date()
      }
    }

    if (lowerInput.includes('help') || lowerInput.includes('what can')) {
      return {
        id: Date.now(),
        text: "I'm here to help you with event planning! Here's what I can do:\n\n✅ Create and manage groups\n📊 Help with polls and voting\n💡 Suggest activities based on your mood\n📅 Coordinate dates and schedules\n💬 Keep everyone in sync\n\nJust tell me what you need!",
        sender: 'bot',
        timestamp: new Date()
      }
    }

    if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
      return {
        id: Date.now(),
        text: "Hello! 👋 Ready to plan something amazing? I'm here to help you create, coordinate, and execute the perfect event. What would you like to start with?",
        sender: 'bot',
        timestamp: new Date()
      }
    }

    if (lowerInput.includes('date') || lowerInput.includes('when')) {
      return {
        id: Date.now(),
        text: "Planning when to schedule? I can help!\n\n📅 Use the poll feature to let everyone vote on preferred dates\n🗓️ Check everyone's availability\n⏰ Set reminders for important deadlines\n\nTell me more about your timing needs!",
        sender: 'bot',
        timestamp: new Date()
      }
    }

    // Default responses
    return {
      id: Date.now(),
      text: "That's interesting! I can help you with that. You can:\n\n1️⃣ Create a new event group\n2️⃣ Start a poll to decide on activities\n3️⃣ Get personalized suggestions\n4️⃣ Coordinate with your friends\n\nWhat would you like to do next?",
      sender: 'bot',
      timestamp: new Date()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickActions = [
    { text: "Create event", emoji: "➕" },
    { text: "Get suggestions", emoji: "💡" },
    { text: "Start a poll", emoji: "📊" },
    { text: "Help", emoji: "❓" }
  ]

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
                     <motion.button
             initial={{ scale: 0, opacity: 0 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ scale: 0, opacity: 0 }}
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={() => setIsOpen(true)}
             className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center"
          >
            <MessageCircle size={24} />
            <motion.div
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              🤖
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, x: position.x, y: -position.y }}
            exit={{ opacity: 0, scale: 0.8 }}
                         drag
             dragMomentum={false}
             dragConstraints={getDragConstraints(400, 100)}
             onDragStart={() => setIsDragging(true)}
             onDragEnd={(event, info) => {
               setIsDragging(false)
               if (typeof window !== 'undefined') {
                 const newPosition = { x: info.point.x - (window.innerWidth - 400), y: window.innerHeight - info.point.y - 100 }
                 setPosition(newPosition)
                 savePosition(newPosition)
               }
             }}
            className={`fixed bottom-24 right-6 w-96 h-[600px] bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Header - Drag Handle */}
            <div 
              className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-4 flex items-center justify-between cursor-move"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">PlanPal</h3>
                  <p className="text-xs text-white/90">Your AI Event Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                        : 'bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="whitespace-pre-line text-sm">{message.text}</div>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 dark:bg-zinc-700 rounded-2xl p-3 flex space-x-1">
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                    />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setInputValue(action.text)}
                      className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-full transition-colors"
                    >
                      {action.emoji} {action.text}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    rows={1}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default PlanPal
