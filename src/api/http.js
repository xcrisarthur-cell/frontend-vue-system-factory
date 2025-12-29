import axios from 'axios'

// Get API URL from environment variable, fallback to production URL
const API_URL = import.meta.env.VITE_API_URL || 'https://backend-fastapi-system-factory.fly.dev'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased timeout for production
  headers: {
    'Content-Type': 'application/json'
  }
})

export default api
