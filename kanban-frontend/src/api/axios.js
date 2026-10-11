import axios from 'axios'

const BASE_URL = import.meta.env.VITE_BASE_URL   // http://127.0.0.1:8000
const API_URL  = import.meta.env.VITE_API_URL    // http://127.0.0.1:8000/api

// ===============================
// 🔧 AXIOS INSTANCE
// ===============================
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ===============================
// 🔐 AUTO ATTACH TOKEN
// ===============================
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ===============================
// ⚠️ GLOBAL ERROR INTERCEPTOR
// ===============================
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ===============================
// 🔐 CSRF (opsional, bisa dihapus kalau full token-based)
// ===============================
export const getCsrfCookie = async () => {
  await axios.get(`${BASE_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  })
}

// ===============================
// 🔑 LOGIN
// ===============================
export const login = async (email, password) => {
  const res = await api.post('/login', { email, password })
  return res.data
}

// ===============================
// 📝 REGISTER
// ===============================
export const register = async (name, email, password, password_confirmation) => {
  const res = await api.post('/register', { name, email, password, password_confirmation })
  return res.data
}

// ===============================
// 👤 GET USER
// ===============================
export const getUser = async () => {
  const res = await api.get('/me')
  return res.data
}

// ===============================
// 🚪 LOGOUT
// ===============================
export const logout = async () => {
  await api.post('/logout')
}

export default api