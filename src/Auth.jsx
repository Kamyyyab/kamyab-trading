import { useState } from 'react'
import { supabase } from './supabase.js'

function Auth({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Kolla din email för bekräftelselänk!')
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else onLogin(data.user)
    }
    setLoading(false)
  }

  return (
    <div style={{ background: '#0a0c0d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '16px', padding: '40px', width: '360px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ width: '36px', height: '36px', background: '#004038', border: '1px solid #007d5e', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="5" width="6" height="10" rx="1.5" fill="#00e5b0" opacity=".25"/>
              <rect x="1" y="8" width="6" height="7" rx="1.5" fill="#00e5b0"/>
              <rect x="9" y="1" width="6" height="14" rx="1.5" fill="#00e5b0" opacity=".4"/>
              <rect x="9" y="4" width="6" height="11" rx="1.5" fill="#00e5b0"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: '#00e5b0' }}>Trading OS</div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#7090a0', letterSpacing: '1px' }}>{isSignUp ? 'SKAPA KONTO' : 'LOGGA IN'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#7090a0', letterSpacing: '2px', marginBottom: '5px' }}>EMAIL</div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="din@email.com"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', background: '#1c2426', border: '1px solid #26383d', borderRadius: '8px', color: '#e2eeee', fontSize: '14px', padding: '10px 12px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#7090a0', letterSpacing: '2px', marginBottom: '5px' }}>LÖSENORD</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', background: '#1c2426', border: '1px solid #26383d', borderRadius: '8px', color: '#e2eeee', fontSize: '14px', padding: '10px 12px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {error && <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#ff4f6b', background: '#3d0f1a', border: '1px solid #7a1f2e', borderRadius: '6px', padding: '8px 12px' }}>{error}</div>}
          {message && <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#00e5b0', background: '#003d30', border: '1px solid #007d5e', borderRadius: '6px', padding: '8px 12px' }}>{message}</div>}

          <button onClick={handleSubmit} disabled={loading}
            style={{ background: '#007d5e', color: '#0a0c0d', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, padding: '12px', borderRadius: '8px', border: 'none', cursor: loading ? 'default' : 'pointer', letterSpacing: '1px', opacity: loading ? 0.7 : 1, marginTop: '4px' }}>
            {loading ? 'Laddar...' : isSignUp ? 'SKAPA KONTO' : 'LOGGA IN'}
          </button>

          <button onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null) }}
            style={{ background: 'none', border: 'none', color: '#7090a0', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', padding: '4px' }}>
            {isSignUp ? 'Har redan konto? Logga in' : 'Inget konto? Skapa ett'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Auth
