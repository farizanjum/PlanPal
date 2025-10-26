import { Component } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { motion } from 'framer-motion'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    console.error('Error stack:', error.stack)
    console.error('Error message:', error.message)
    console.error('Component stack:', errorInfo.componentStack)
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

const ErrorFallback = ({ error }) => {
  console.error('Rendering error fallback with error:', error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-2xl w-full text-center"
      >
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={48} className="text-red-500" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-poppins">
          Oops! Something went wrong
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left">
            <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-2">
              Error Details:
            </p>
            <p className="text-red-700 dark:text-red-300 text-xs font-mono break-all">
              {error.message}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-red-800 dark:text-red-200 text-xs cursor-pointer hover:underline">
                  Show Stack Trace
                </summary>
                <pre className="mt-2 text-red-700 dark:text-red-300 text-xs font-mono whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center space-x-2 btn-primary"
          >
            <RefreshCw size={20} />
            <span>Try Again</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-900 dark:text-white rounded-xl transition-colors font-semibold"
          >
            <Home size={20} />
            <span>Go Home</span>
          </motion.button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              Error Details
            </summary>
            <pre className="mt-4 p-4 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-auto text-xs">
              {error.toString()}
              {error.stack}
            </pre>
          </details>
        )}
      </motion.div>
    </div>
  )
}

export default ErrorBoundary
