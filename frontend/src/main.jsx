import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

if (import.meta.env.MODE !== 'development') {
  ;['log', 'info', 'debug'].forEach((method) => {
    console[method] = () => {}
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
