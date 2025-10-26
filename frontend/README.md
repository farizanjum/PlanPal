# 🎨 Plan My Outings - Event Planning Web App

A modern, responsive web application that helps groups plan outings, vote on places or movies, and view smart suggestions with smooth scrolling and engaging UX.

## ✨ Features

- **Smooth Scrolling**: Powered by Lenis for buttery-smooth page transitions
- **Modern UI**: Clean, minimal design with Tailwind CSS
- **Dark Mode**: Persistent theme toggle with localStorage
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Animations**: Framer Motion for engaging micro-interactions
- **Group Management**: Create and manage planning groups
- **Voting System**: Democratic decision-making with emoji reactions
- **Smart Suggestions**: AI-powered recommendations (mock data)
- **Real-time Chat**: Group discussion with message history
- **Plan Finalization**: RSVP system with confetti celebrations

## 🚀 Tech Stack

- **Framework**: React 18 with Vite
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Smooth Scroll**: Lenis
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Confetti**: Canvas Confetti
- **State Management**: React Context API

## 📱 Pages & User Flow

1. **Landing Page** → Hero section with floating emojis and feature cards
2. **Authentication** → Login/Register with glassmorphism design
3. **Dashboard** → Group overview with creation modal
4. **Poll Page** → Voting interface with emoji reactions
5. **Suggestions** → AI-powered recommendations with filters
6. **Chat** → Group discussion with plan summary sidebar
7. **Final Plan** → RSVP system with confetti celebration

## 🎨 Design System

### Color Palette
- **Primary**: Warm orange gradient (`#f2740b` to `#e35a01`)
- **Secondary**: Cool blue gradient (`#0ea5e9` to `#0284c7`)
- **Background**: Soft gray with dark mode support

### Typography
- **Primary Font**: Poppins (headings)
- **Secondary Font**: Inter (body text)

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Gradient backgrounds with hover effects
- **Glassmorphism**: Backdrop blur effects for modern look

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

### Supabase Realtime Chat Setup

1. Create a Supabase project and get your URL and anon key.
2. In `frontend/.env` set:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
3. Ensure Realtime is enabled on your tables. In the Supabase SQL Editor run:
```
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```
4. Open two browser windows on the same group chat to see live updates via database changes and broadcast channel.

4. **Build for production**
   ```bash
   npm run build
   ```

## 🎯 Key Features

### Smooth Scrolling (Lenis)
- Configured with 1.2s duration for optimal feel
- Smooth touch support for mobile devices
- Automatic cleanup on component unmount

### Theme System
- Persistent dark/light mode toggle
- localStorage integration
- Smooth transitions between themes

### Responsive Design
- Mobile-first approach
- Tailwind breakpoints: `sm`, `md`, `lg`, `xl`
- Flexible grid layouts

### Animations
- Page transitions with Framer Motion
- Hover effects on interactive elements
- Floating emoji animations
- Confetti celebrations
- **Reduced Motion Support**: Respects user's accessibility preferences

## ⚡ Performance Optimizations

### Code Splitting
- **Lazy Loading**: All pages are lazy-loaded using `React.lazy()` and `Suspense`
- **Route-level Splitting**: Each page is code-split for smaller initial bundle
- **Loading States**: Skeleton screens during page load

### Memoization
- **React.memo**: Navbar, Footer, and other components are memoized
- **useMemo**: Context values memoized to prevent re-renders
- **useCallback**: Functions in contexts wrapped with useCallback

### Context Optimization
- **AuthContext**: Optimized with useMemo and useCallback
- **ThemeContext**: Memoized values to prevent unnecessary re-renders
- **Error Boundaries**: Catches errors gracefully with ErrorBoundary

### Image Optimization
- **OptimizedImage Component**: Lazy loading with loading="lazy"
- **Placeholder**: Pulse animation during image load
- **Error Handling**: Fallback images on load failure

### Accessibility
- **Reduced Motion**: All Framer Motion animations respect `prefers-reduced-motion`
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support

### Loading States
- **LoadingSkeleton**: Shimmer effect for better perceived performance
- **EmptyState**: Helpful empty states with actions
- **ErrorBoundary**: Graceful error handling with recovery options

## 🎭 Micro-Interactions

### Buttons
- **Scale-up Effect**: Buttons scale to 1.05 on hover
- **Shadow Pop**: Enhanced shadow on hover for depth
- **Active State**: Scale to 0.98 on click for tactile feedback

### Cards
- **Hover Lift**: Cards lift 4px on hover with enhanced shadow
- **Smooth Transitions**: 300ms duration for all animations

### Emoji Reactions
- **Bounce Animation**: Emoji bounce on interaction
- **Spring Physics**: Natural spring animations for emoji appearance
- **EmojiReaction Component**: Reusable animated emoji component

### Page Transitions
- **Fade Between Pages**: Smooth opacity and y-position transitions
- **AnimatePresence**: Proper cleanup of exit animations
- **Route Transitions**: 300ms duration with custom easing

### Confetti & Glow
- **Confetti Burst**: Multiple confetti explosions on plan finalization
- **Glow Effect**: Pulsing glow on finalized buttons
- **Celebration Mode**: Confetti triggers on RSVP confirmation

## 🔧 Customization

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Update navigation in `src/components/Navbar.jsx`

### Styling
- Modify `src/index.css` for global styles
- Update `tailwind.config.js` for theme customization
- Use Tailwind utility classes for component styling

### State Management
- Context providers in `src/context/`
- Local state with React hooks
- Persistent data with localStorage

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Design Guidelines

### Accessibility
- High contrast ratios
- Focus states for keyboard navigation
- Semantic HTML structure
- ARIA labels where needed

### Performance
- Lazy loading for images
- Optimized animations
- Efficient re-renders
- Bundle size optimization

## 🚀 Deployment

The app is ready for deployment on platforms like:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

---

**Built with ❤️ for better group planning experiences**
