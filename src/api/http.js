import axios from 'axios'

// Get API URL from environment variable, fallback to production URL
const API_URL = import.meta.env.VITE_API_URL || 'http://103.164.99.2:1101'
const ENV = import.meta.env.VITE_ENV || 'production'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased timeout for production
  headers: {
    'Content-Type': 'application/json'
  }
})

export default api
