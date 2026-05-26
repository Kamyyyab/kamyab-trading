import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import Auth from './Auth.jsx'
import RiskCalculator from './RiskCalculator.jsx'
import TodayTrade from './TodayTrade.jsx'
import Calendar from './Calendar.jsx'
import Statistics from './Statistics.jsx'
import StreakHistory from './StreakHistory.jsx'
import EconomicCalendar from './EconomicCalendar.jsx'
import EquityCurve from './EquityCurve.jsx'

const MOBILE = window.innerWidth < 768

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [journal, setJournal] = useState([])
  const [streakLogs, setStreakLogs] = useState({})
  const [biasLogs, setBiasLogs] = useState({})
  const [page, setPage] = useState('home')
  const [clock, setClock] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fmtTime = (date, tz) => date.toLocaleTimeString('sv-SE', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const sweTime = fmtTime(clock, 'Europe/Stockholm')
  const nyTime = fmtTime(clock, 'America/New_York')
  const nyHour = parseInt(clock.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false }).split(':')[0])
  const nyMin = parseInt(clock.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false }).split(':')[1])
  const nyMinutes = nyHour * 60 + nyMin
  const sessionOpen = nyMinutes >= 9 * 60 + 30 && nyMinutes < 16 * 60
  const preMarket = nyMinutes >= 4 * 60 && nyMinutes < 9 * 60 + 30

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setLoading(false)
      if (session?.user) fetchData(session.user.id)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (session?.user) fetchData(session.user.id)
    })
  }, [])

  async function fetchData(userId) {
    const { data } = await supabase.from('trading_data').select('data').eq('user_id', userId).maybeSingle()
    if (data?.data?.journal) setJournal(data.data.journal)
    if (data?.data?.streakLogs) setStreakLogs(data.data.streakLogs)
    if (data?.data?.biasLogs) setBiasLogs(data.data.biasLogs)
  }

  async function saveData(newJournal, newStreakLogs) {
    const j = newJournal ?? journal
    const s = newStreakLogs ?? streakLogs
    if (newJournal) setJournal(newJournal)
    if (newStreakLogs) setStreakLogs(newStreakLogs)
    await supabase.from('trading_data').upsert(
      { user_id: user.id, data: { journal: j, streakLogs: s, biasLogs }, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  function handleAddTrade(trade) {
    const newJournal = [trade, ...journal]
    const updated = { ...streakLogs }
    if (trade.brokenRules?.length > 0) updated[trade.date] = 'violation'
    else if (!updated[trade.date] || updated[trade.date] === 'clean') updated[trade.date] = 'clean'
    saveData(newJournal, updated)
  }

  function handleDeleteTrade(i) { saveData(journal.filter((_, idx) => idx !== i), null) }

  function handleSaveBias(date, bias) {
    const updated = { ...biasLogs }
    if (bias === null) delete updated[date]
    else updated[date] = bias
    setBiasLogs(updated)
    supabase.from('trading_data').upsert(
      { user_id: user.id, data: { journal, streakLogs, biasLogs: updated }, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  function handleSaveStreakLog(date, status) {
    const updated = { ...streakLogs }
    if (status === null) delete updated[date]
    else updated[date] = status
    saveData(null, updated)
  }

  if (loading) return (
    <div style={{ background: '#0a0c0d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#4a6870', fontFamily: 'monospace', fontSize: '12px' }}>Laddar...</div>
    </div>
  )

  if (!user) return <Auth onLogin={setUser} />

  const navItems = [
    { id: 'home', label: 'Home', icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#00e5b0' : 'none'} stroke={active ? '#00e5b0' : '#4a6870'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    )},
    { id: 'calendar', label: 'Calendar', icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#00e5b0' : '#4a6870'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )},
    { id: 'statistics', label: 'Stats', icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#00e5b0' : '#4a6870'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    )},
    { id: 'calculator', label: 'Risk', icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#00e5b0' : '#4a6870'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"/>
        <line x1="8" y1="6" x2="16" y2="6"/>
        <line x1="8" y1="10" x2="8" y2="10" strokeWidth="3"/>
        <line x1="12" y1="10" x2="12" y2="10" strokeWidth="3"/>
        <line x1="16" y1="10" x2="16" y2="10" strokeWidth="3"/>
        <line x1="8" y1="14" x2="8" y2="14" strokeWidth="3"/>
        <line x1="12" y1="14" x2="12" y2="14" strokeWidth="3"/>
        <line x1="16" y1="14" x2="16" y2="14" strokeWidth="3"/>
        <line x1="8" y1="18" x2="12" y2="18" strokeWidth="3"/>
        <line x1="16" y1="18" x2="16" y2="18" strokeWidth="3"/>
      </svg>
    )},
  ]

  return (
    <div style={{ background: '#0a0c0d', minHeight: '100vh', color: '#e2eeee', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" }}>

      {/* Top navbar */}
      {MOBILE ? (
        // Mobile top bar - minimal
        <div style={{ height: '52px', background: '#101415', borderBottom: '1px solid #1e2d31', display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', background: '#004038', border: '1px solid #007d5e', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="5" width="6" height="10" rx="1.5" fill="#00e5b0" opacity=".25"/>
                <rect x="1" y="8" width="6" height="7" rx="1.5" fill="#00e5b0"/>
                <rect x="9" y="1" width="6" height="14" rx="1.5" fill="#00e5b0" opacity=".4"/>
                <rect x="9" y="4" width="6" height="11" rx="1.5" fill="#00e5b0"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#00e5b0' }}>Kamyab</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sessionOpen ? '#00e5b0' : preMarket ? '#ffc030' : '#4a6870', boxShadow: sessionOpen ? '0 0 5px #00e5b0' : 'none' }} />
              <span style={{ fontFamily: 'monospace', fontSize: '9px', color: sessionOpen ? '#00e5b0' : preMarket ? '#ffc030' : '#4a6870' }}>
                {sessionOpen ? 'OPEN' : preMarket ? 'PRE' : 'CLOSED'}
              </span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4a6870' }}>{nyTime.slice(0,5)}</div>
            <button onClick={() => supabase.auth.signOut()}
              style={{ background: 'none', border: '1px solid #1e2d31', borderRadius: '6px', color: '#4a6870', fontFamily: 'monospace', fontSize: '9px', padding: '4px 8px', cursor: 'pointer' }}>
              ↩
            </button>
          </div>
        </div>
      ) : (
        // Desktop navbar
        <div style={{ height: '56px', background: '#101415', borderBottom: '1px solid #1e2d31', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '8px' }}>
              <div style={{ width: '32px', height: '32px', background: '#004038', border: '1px solid #007d5e', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="5" width="6" height="10" rx="1.5" fill="#00e5b0" opacity=".25"/>
                  <rect x="1" y="8" width="6" height="7" rx="1.5" fill="#00e5b0"/>
                  <rect x="9" y="1" width="6" height="14" rx="1.5" fill="#00e5b0" opacity=".4"/>
                  <rect x="9" y="4" width="6" height="11" rx="1.5" fill="#00e5b0"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: '#00e5b0' }}>Kamyab</div>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '1px' }}>TRADING OS</div>
              </div>
            </div>
            {navItems.filter(n => n.id !== 'calculator').map(({ id, label, icon }) => (
              <button key={id} onClick={() => setPage(id)}
                style={{ background: page === id ? '#1c2426' : 'none', border: page === id ? '1px solid #26383d' : '1px solid transparent', borderRadius: '8px', color: page === id ? '#e2eeee' : '#4a6870', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 500, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {icon(page === id)}{label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sessionOpen ? '#00e5b0' : preMarket ? '#ffc030' : '#4a6870', boxShadow: sessionOpen ? '0 0 6px #00e5b0' : 'none' }} />
              <span style={{ fontFamily: 'monospace', fontSize: '9px', color: sessionOpen ? '#00e5b0' : preMarket ? '#ffc030' : '#4a6870', letterSpacing: '1px' }}>
                {sessionOpen ? 'NY OPEN' : preMarket ? 'PRE-MKT' : 'CLOSED'}
              </span>
            </div>
            <div style={{ width: '1px', height: '16px', background: '#1e2d31' }} />
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#2e4448', letterSpacing: '1px', marginBottom: '1px' }}>SWE</div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#8aacb0' }}>{sweTime}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#2e4448', letterSpacing: '1px', marginBottom: '1px' }}>NY</div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#8aacb0' }}>{nyTime}</div>
            </div>
            <div style={{ width: '1px', height: '16px', background: '#1e2d31' }} />
            <button onClick={() => supabase.auth.signOut()}
              style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', background: 'none', border: 'none', cursor: 'pointer' }}>
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Page content */}
      <div style={{ padding: MOBILE ? '12px 12px 80px' : '16px' }}>
        {page === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <TodayTrade journal={journal} onAddTrade={handleAddTrade} streakLogs={streakLogs} biasLogs={biasLogs} onSaveBias={handleSaveBias} />
            {MOBILE ? (
              <>
                <EquityCurve journal={journal} />
                <StreakHistory journal={journal} streakLogs={streakLogs} onSaveStreakLog={handleSaveStreakLog} />
                <EconomicCalendar />
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '12px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <EquityCurve journal={journal} />
                  <EconomicCalendar />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <RiskCalculator />
                  <StreakHistory journal={journal} streakLogs={streakLogs} onSaveStreakLog={handleSaveStreakLog} />
                </div>
              </div>
            )}
          </div>
        )}
        {page === 'calendar' && <Calendar journal={journal} onAddTrade={handleAddTrade} onDeleteTrade={handleDeleteTrade} />}
        {page === 'statistics' && <Statistics journal={journal} />}
        {page === 'calculator' && <div style={{ paddingBottom: '12px' }}><RiskCalculator /></div>}
      </div>

      {/* Mobile bottom nav */}
      {MOBILE && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
          background: '#101415',
          borderTop: '1px solid #1e2d31',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {navItems.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setPage(id)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                padding: '10px 0 8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
              }}>
              {icon(page === id)}
              <span style={{ fontFamily: 'monospace', fontSize: '9px', color: page === id ? '#00e5b0' : '#4a6870', letterSpacing: '0.5px' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default App