import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { useState, useEffect } from 'react'

import Login from './pages/login'
import Register from './pages/registered'
import PropTypes from 'prop-types';
import Boards from './pages/Board';
import Landing from './pages/landing';

const queryClient = new QueryClient()
 
function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}
PrivateRoute.propTypes = { children: PropTypes.node }

function AppRoutes() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
 
  useEffect(() => {
    localStorage.setItem('theme', dark ? 'dark' : 'light')
    document.body.style.background = dark ? '#0f172a' : '#f8faff'
  }, [dark])
 
  return (
    <Routes>
      <Route path="/"         element={<Landing dark={dark} setDark={setDark} />} />
      <Route path="/login"    element={<Login dark={dark} setDark={setDark} />} />
      <Route path="/register" element={<Register dark={dark} setDark={setDark} />} />
      <Route path="/boards"   element={<PrivateRoute><Boards dark={dark} setDark={setDark} /></PrivateRoute>} />
      <Route path="*"         element={<Navigate to="/" />} />
    </Routes>
  )
}
 
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
 
export default App