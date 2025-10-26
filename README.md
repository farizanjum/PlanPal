# PlanPal - Group Planning Made Simple

A modern, mobile-first group planning application with real-time chat, event management, polls, and AI-powered trip assistance.

![PlanPal Logo](https://img.shields.io/badge/PlanPal-Group%20Planning-orange?style=for-the-badge&logo=calendar)

## Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Running the Application](#-running-the-application)
- [Mobile Optimization](#-mobile-optimization)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## Features

### **User Interface**
- **Modern Design**: Clean, intuitive interface with dark/light mode support
- **Mobile-First**: Fully responsive design optimized for all devices
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions

### **Group Management**
- **Create Groups**: Easy group creation with custom names and descriptions
- **Join Groups**: Join existing groups using unique group codes
- **Member Management**: View member lists with proper pluralization
- **Group Settings**: Manage group details and permissions

### **Real-Time Chat**
- **Live Messaging**: Real-time chat powered by Supabase Realtime
- **AI Assistant**: Integrated `@bot` powered by Google Gemini AI
- **File Sharing**: Upload and share images in group chats
- **Independent Scrolling**: Smart scroll containment for optimal UX
- **Message Persistence**: Messages saved and synced across all devices

### **Event Planning**
- **Create Events**: Plan group activities with dates, times, and descriptions
- **Event Management**: Edit, delete, and manage upcoming events
- **Smart Suggestions**: AI-powered activity recommendations based on location
- **Event Notifications**: Real-time updates for event changes

### **Polling System**
- **Quick Polls**: Create polls for group decisions
- **Multiple Choice**: Support for various poll types
- **Real-Time Results**: Live poll results and voting
- **Poll Management**: Edit and manage active polls

### **AI Integration**
- **Gemini AI**: Google's advanced AI for intelligent responses
- **Context-Aware**: Bot understands group context and trip details
- **Smart Suggestions**: Location-based recommendations for activities
- **Natural Language**: Conversational AI for planning assistance

### **Mobile Optimization**
- **Touch-Friendly**: 44px minimum touch targets for mobile devices
- **Responsive Breakpoints**: Optimized for phones, tablets, and desktops
- **Custom Scrollbars**: Grey scrollbars with smooth scrolling
- **Mobile Components**: Specialized mobile-optimized UI components

## Tech Stack

### **Frontend**
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **React Router**: Client-side routing
- **React Hot Toast**: Beautiful notifications
- **Lucide React**: Modern icon library

### **Backend**
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **JWT**: JSON Web Tokens for authentication
- **Google Gemini AI**: Advanced AI integration

### **Database & Services**
- **PostgreSQL**: Robust relational database via Supabase
- **Supabase Auth**: User authentication and management
- **Supabase Realtime**: Real-time subscriptions and updates
- **Supabase Storage**: File upload and management

### **Development Tools**
- **ESLint**: Code linting and quality assurance
- **Prettier**: Code formatting
- **Git**: Version control
- **GitHub**: Code repository and collaboration

## 📁 Project Structure

```
PlanPal/
├── 📁 backend/                    # Backend API server
│   ├── 📁 config/                 # Configuration files
│   │   └── supabase.js           # Supabase client configuration
│   ├── 📁 middleware/            # Express middleware
│   │   └── auth.js               # Authentication middleware
│   ├── 📁 routes/                # API route handlers
│   │   ├── chat.js               # Chat and messaging routes
│   │   ├── chatbot.js            # AI bot integration routes
│   │   ├── events.js             # Event management routes
│   │   ├── groups.js             # Group management routes
│   │   ├── polls.js              # Polling system routes
│   │   ├── profiles.js           # User profile routes
│   │   └── suggestions.js        # AI suggestion routes
│   ├── 📁 services/              # Business logic services
│   │   ├── chatService.js        # Chat functionality
│   │   ├── chatbotService.js    # AI bot services
│   │   ├── eventService.js       # Event management
│   │   ├── groupService.js       # Group operations
│   │   ├── locationService.js    # Location-based services
│   │   ├── pollService.js        # Poll management
│   │   └── suggestionService.js # AI suggestions
│   ├── package.json              # Backend dependencies
│   ├── server.js                 # Express server entry point
│   └── schema.sql                # Database schema and policies
│
├── 📁 frontend/                   # React frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/        # Reusable UI components
│   │   │   ├── MobileButton.jsx  # Mobile-optimized button
│   │   │   ├── MobileModal.jsx   # Responsive modal component
│   │   │   ├── Navbar.jsx        # Navigation component
│   │   │   └── ResponsiveImage.jsx # Mobile image component
│   │   ├── 📁 context/           # React context providers
│   │   │   ├── AuthContext.jsx   # Authentication context
│   │   │   └── ThemeContext.jsx  # Theme management
│   │   ├── 📁 pages/             # Page components
│   │   │   ├── ChatPage.jsx      # Group chat interface
│   │   │   ├── DashboardPage.jsx # Main dashboard
│   │   │   ├── GroupDetailPage.jsx # Group details
│   │   │   ├── LandingPage.jsx   # Homepage
│   │   │   ├── LoginPage.jsx     # User login
│   │   │   ├── PollPage.jsx      # Poll management
│   │   │   ├── RegisterPage.jsx  # User registration
│   │   │   └── SuggestionsPage.jsx # AI suggestions
│   │   ├── 📁 services/          # Frontend services
│   │   │   └── api.js            # API communication
│   │   ├── 📁 utils/             # Utility functions
│   │   │   ├── lenis.js          # Smooth scrolling
│   │   │   └── supabase.js       # Supabase client
│   │   ├── App.jsx               # Main app component
│   │   ├── index.css             # Global styles and utilities
│   │   └── main.jsx              # App entry point
│   ├── package.json              # Frontend dependencies
│   └── .env                      # Frontend environment variables
│
├── README.md                     # Project documentation
└── .gitignore                    # Git ignore rules
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Git** (for version control)
- **Supabase Account** (for backend services)
- **Google Gemini API Key** (for AI features)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/abhaypratap0709/PlanPal.git
cd PlanPal
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=your-strong-jwt-secret

# AI Integration
GEMINI_API_KEY=your-gemini-api-key
BOT_USER_ID=optional-bot-user-id

# Optional External APIs
TMDB_API_KEY=your-tmdb-api-key
GOOGLE_API_KEY=your-google-api-key
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# App Configuration
VITE_APP_NAME=PlanPal
```

## Running the Application

### Development Mode

Open two terminal windows:

#### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
# Server runs on http://localhost:8000
```

#### Terminal 2 - Frontend Development Server
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### Production Build

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend
npm run build
# Builds to frontend/dist/
```

## Mobile Optimization

PlanPal is built with mobile-first design principles:

### **Responsive Breakpoints**
- **320px**: Small phones (iPhone SE)
- **375px**: Standard phones (iPhone 12)
- **414px**: Large phones (iPhone Plus)
- **768px**: Tablets (iPad)
- **1024px**: Small laptops

### **Touch Optimization**
- **44px minimum touch targets** for all interactive elements
- **Touch-friendly spacing** between buttons and links
- **Smooth touch scrolling** with momentum
- **Haptic feedback** for better user experience

### **Mobile Components**
- **MobileButton**: Touch-optimized button component
- **MobileModal**: Responsive modal with proper mobile sizing
- **ResponsiveImage**: Lazy-loaded images with mobile optimization

### **Custom Scrollbars**
- **Grey scrollbars** instead of default black
- **Smooth scrolling** with proper momentum
- **Independent chat scrolling** for better UX

## 🔌 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/profile
```

### Group Management

```http
GET    /api/groups              # Get user's groups
POST   /api/groups              # Create new group
GET    /api/groups/:id          # Get group details
PUT    /api/groups/:id          # Update group
DELETE /api/groups/:id          # Delete group
POST   /api/groups/:id/join     # Join group by code
```

### Chat & Messaging

```http
GET  /api/chat/:groupId         # Get group messages
POST /api/chat/:groupId         # Send message
POST /api/chat/:groupId/bot     # Send bot message
```

### Events & Polls

```http
GET    /api/events/:groupId     # Get group events
POST   /api/events/:groupId     # Create event
GET    /api/polls/:groupId      # Get group polls
POST   /api/polls/:groupId      # Create poll
POST   /api/polls/:id/vote      # Vote on poll
```

## Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy the `dist/` folder** to your hosting service

3. **Set environment variables** in your hosting platform:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_NAME`

### Backend Deployment (Railway/Render/DigitalOcean)

1. **Set environment variables** in your hosting platform
2. **Deploy the backend directory**
3. **Ensure Supabase Realtime is enabled**

### Supabase Setup

1. **Create a new Supabase project**
2. **Run the SQL schema** from `backend/schema.sql`
3. **Enable Realtime** for chat tables
4. **Configure authentication** providers
5. **Set up storage** for file uploads

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- **Follow ESLint rules** for code quality
- **Use Prettier** for consistent formatting
- **Write meaningful commit messages**
- **Test on mobile devices** before submitting
- **Ensure accessibility** compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Supabase** for providing excellent backend services
- **Google Gemini** for AI capabilities
- **Tailwind CSS** for the utility-first CSS framework
- **Framer Motion** for smooth animations
- **React Community** for the amazing ecosystem

## 📞 Support

If you encounter any issues or have questions:

1. **Check the Issues** section on GitHub
2. **Create a new issue** with detailed information
3. **Contact the maintainers** for urgent matters

---

**Made with ❤️ by the PlanPal Team**

*PlanPal - Making group planning effortless and fun!* 🎯
