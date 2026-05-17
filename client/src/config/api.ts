const LOCAL_API_BASE_URL = 'http://localhost:4000'
const PRODUCTION_API_BASE_URL = 'https://panteon-leaderboard-case-3.onrender.com'

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL

const isValidEnvApiBaseUrl =
  typeof envApiBaseUrl === 'string' && envApiBaseUrl.startsWith('http')

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')

export const API_BASE_URL = (
  isValidEnvApiBaseUrl
    ? envApiBaseUrl
    : isLocalhost
      ? LOCAL_API_BASE_URL
      : PRODUCTION_API_BASE_URL
).replace(/\/$/, '')