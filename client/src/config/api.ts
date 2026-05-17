const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')

export const API_BASE_URL = isLocalhost
  ? 'http://localhost:4000'
  : 'https://panteon-leaderboard-case-3.onrender.com'