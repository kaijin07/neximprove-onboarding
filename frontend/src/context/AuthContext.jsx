import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { client } from '../api/client'

const AuthContext = createContext(null)

// status is 'loading' | 'authenticated' | 'anonymous' rather than a boolean.
// Without the loading state, a protected route can't tell "not signed in" from
// "still checking", so it redirects to /login for a moment on every page
// refresh before coming back.
//
// The session lives in an httpOnly cookie, which JavaScript cannot read. So
// there's no way to tell from the browser whether someone is signed in without
// asking the server. That's why every page load starts with a call to
// /users/me: the server is the only thing that knows.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  // Used by pages that want fresh data. A 401 here means the session ended, so
  // the interceptor redirects to login.
  const refreshUser = useCallback(async () => {
    const { data } = await client.get('/users/me')
    setUser(data.user)
    setStatus('authenticated')
    return data.user
  }, [])

  // Runs once on load to find out whether the cookie is valid.
  // skipAuthRedirect because a 401 here is normal for a signed-out visitor and
  // must not bounce them to /login.
  useEffect(() => {
    let cancelled = false

    client
      .get('/users/me', { skipAuthRedirect: true })
      .then(({ data }) => {
        if (cancelled) return
        setUser(data.user)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        setUser(null)
        setStatus('anonymous')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const register = useCallback(async (payload) => {
    // The server sets the cookie in its response; nothing to store here.
    const { data } = await client.post('/auth/register', payload)
    setUser(data.user)
    setStatus('authenticated')
    return data.user
  }, [])

  const login = useCallback(async (credentials) => {
    const { data } = await client.post('/auth/login', credentials)
    setUser(data.user)
    setStatus('authenticated')
    return data.user
  }, [])

  // The cookie is httpOnly, so the browser can't delete it. Only the server can,
  // which is why signing out needs a request rather than clearing local state.
  const logout = useCallback(async () => {
    try {
      await client.post('/auth/logout')
    } catch {
      // Clear local state regardless, so the UI never gets stuck signed in.
    }
    setUser(null)
    setStatus('anonymous')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAdmin: user?.role === 'ADMIN',
        register,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
