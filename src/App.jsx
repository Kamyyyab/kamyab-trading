import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase.js'
import Auth from './Auth.jsx'
import RiskCalculator from './RiskCalculator.jsx'
import TodayTrade from './TodayTrade.jsx'
import Calendar from './Calendar.jsx'
import Statistics from './Statistics.jsx'
import StreakHistory from './StreakHistory.jsx'
import EconomicCalendar from './EconomicCalendar.jsx'
import EquityCurve from './EquityCurve.jsx'
import Playbook from './Playbook.jsx'
import TradingViewChart from './TradingViewChart.jsx'
import { LangCtx, T } from './lang.js'

const M = "'JetBrains Mono', monospace"

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return m
}

// Lockout: 2+ violations in current calendar week → full week lockout
function computeLockout(streakLogs) {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const pad = n => String(n).padStart(2, '0')
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

  const weekDates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    weekDates.push(fmt(d))
  }

  const violations = weekDates.filter(d => streakLogs[d] === 'violation')

  if (violations.length >= 2) {
    return {
      isLockedOut: true,
      lockoutReason: `${violations.length} violations denna vecka (${violations.join(', ')}). Ingen trading resten av veckan. Granska reglerna och återvänd måndag.`,
    }
  }

  return { isLockedOut: false, lockoutReason: '' }
}

function SessionStatusDesktop() {
  const [clock, setClock] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const nyParts   = clock.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false }).split(':')
  const nyMins    = parseInt(nyParts[0]) * 60 + parseInt(nyParts[1])
  const isOpen    = nyMins >= 570 && nyMins < 690   // 09:30–11:30 NY
  const isPre     = nyMins >= 0   && nyMins < 570
  const nyTime    = clock.toLocaleTimeString('sv-SE', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' })
  const sweTime   = clock.toLocaleTimeString('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit' })
  const color  = isOpen ? '#00e5b0' : isPre ? '#ffc030' : '#3a5878'
  const label  = isOpen ? 'ÖPPEN' : isPre ? 'PRE' : 'STÄNGD'
  const bg     = isOpen ? 'rgba(0,229,176,0.07)' : isPre ? 'rgba(255,192,48,0.06)' : 'transparent'
  const bdr    = isOpen ? 'rgba(0,229,176,0.18)' : isPre ? 'rgba(255,192,48,0.14)' : '#131e38'

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'5px', background:bg, border:`1px solid ${bdr}`, borderRadius:'20px', padding:'4px 10px' }}>
        <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:color }} />
        <span style={{ fontFamily:M, fontSize:'9px', fontWeight:600, color, letterSpacing:'1px' }}>{label}</span>
      </div>
      <div style={{ width:'1px', height:'16px', background:'#131e38' }} />
      <div>
        <div style={{ fontFamily:M, fontSize:'7px', color:'#6880a0', letterSpacing:'1px', marginBottom:'1px' }}>SWE</div>
        <div style={{ fontFamily:M, fontSize:'11px', color:'#7a96b4' }}>{sweTime}</div>
      </div>
      <div>
        <div style={{ fontFamily:M, fontSize:'7px', color:'#6880a0', letterSpacing:'1px', marginBottom:'1px' }}>NY</div>
        <div style={{ fontFamily:M, fontSize:'11px', color:'#7a96b4' }}>{nyTime}</div>
      </div>
    </div>
  )
}

function SessionStatusMobile() {
  const [clock, setClock] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const nyParts = clock.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false }).split(':')
  const nyMins  = parseInt(nyParts[0]) * 60 + parseInt(nyParts[1])
  const isOpen  = nyMins >= 570 && nyMins < 690
  const isPre   = nyMins >= 0   && nyMins < 570
  const nyTime  = clock.toLocaleTimeString('sv-SE', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' })
  const color   = isOpen ? '#00e5b0' : isPre ? '#ffc030' : '#7a96b4'
  const label   = isOpen ? 'ÖPPEN' : isPre ? 'PRE' : 'STÄNGD'
  const bg      = isOpen ? 'rgba(0,229,176,0.07)' : isPre ? 'rgba(255,192,48,0.06)' : 'transparent'
  const bdr     = isOpen ? 'rgba(0,229,176,0.18)' : isPre ? 'rgba(255,192,48,0.14)' : '#162340'

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'5px', background:bg, border:`1px solid ${bdr}`, borderRadius:'20px', padding:'4px 9px' }}>
        <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:color }} />
        <span style={{ fontFamily:M, fontSize:'9px', fontWeight:600, color, letterSpacing:'0.5px' }}>{label}</span>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:M, fontSize:'7px', color:'#6880a0', letterSpacing:'1px' }}>NY</div>
        <div style={{ fontFamily:M, fontSize:'11px', color:'#8aacb4', fontWeight:500 }}>{nyTime}</div>
      </div>
    </div>
  )
}

const NAV_PATHS = {
  home:       'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  calendar:   'M3 4h18a1 1 0 011 1v15a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z M16 2v4 M8 2v4 M2 10h20',
  statistics: 'M18 20V10 M12 20V4 M6 20v-6',
  calculator: 'M5 3h14a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z M9 7h6 M9 11h1 M12 11h1 M15 11h1 M9 15h1 M12 15h1 M15 15h1 M9 19h4',
  charts:     'M2 3h7v11H2z M15 3h7v7h-7z M15 13h7v8h-7z M9 14h6 M9 18h2',
  playbook:   'M4 19.5A2.5 2.5 0 016.5 17H20 M4 19.5C4 20.88 5.12 22 6.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z M8 7h8 M8 11h8 M8 15h5',
}

function Icon({ path, color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {path.split(' M').map((p, i) => <path key={i} d={(i===0?'':' M')+p} />)}
    </svg>
  )
}

// Read cache synchronously — app shows instantly with last-known data
function readCache() {
  try {
    const c = localStorage.getItem('trading-cache')
    return c ? JSON.parse(c) : null
  } catch { return null }
}
function writeCache(data) {
  try { localStorage.setItem('trading-cache', JSON.stringify(data)) } catch {}
}

// Read Supabase session synchronously from localStorage — eliminates Auth flash
function readCachedUser() {
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (!key) return null
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const session = parsed?.currentSession || parsed?.session || parsed
    if (!session?.access_token) return null
    if (session.expires_at && Math.floor(Date.now() / 1000) > session.expires_at) return null
    return session.user || null
  } catch { return null }
}

export default function App() {
  const cache = readCache()
  const lastSaveRef = useRef(0) // timestamp of last user-initiated save
  const [user, setUser]                   = useState(() => readCachedUser())
  const [loading, setLoading]             = useState(false)
  const [journal, setJournal]             = useState(cache?.journal || [])
  const [streakLogs, setStreakLogs]       = useState(cache?.streakLogs || {})
  const [biasLogs, setBiasLogs]           = useState(cache?.biasLogs || {})
  const [playbook, setPlaybook]           = useState(cache?.playbook || [])
  const [weeklyReviews, setWeeklyReviews]   = useState(cache?.weeklyReviews || {})
  const [settings, setSettings]             = useState(cache?.settings || {})
  const [sessionNotes, setSessionNotes]     = useState(cache?.sessionNotes || {})
  const [page, setPage]                     = useState('home')
  const lang = (settings.language || 'en')
  const t    = T[lang]
  const MOBILE = useIsMobile()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setLoading(false)
      if (session?.user) fetchData(session.user.id)
    })
    supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
      if (session?.user) fetchData(session.user.id)
    })
  }, [])

  async function fetchData(uid) {
    const fetchStart = Date.now()
    const { data } = await supabase.from('trading_data').select('data').eq('user_id', uid).maybeSingle()
    // If user saved something while we were fetching, don't overwrite it
    if (lastSaveRef.current > fetchStart) return
    if (!data?.data) return
    const d = data.data
    const j  = Array.isArray(d.journal) ? d.journal : []
    const sl = d.streakLogs || {}
    const bl = d.biasLogs   || {}
    const pb = Array.isArray(d.playbook) ? d.playbook : []
    const wr = d.weeklyReviews || {}
    const se = d.settings || {}
    const sn = d.sessionNotes || {}
    setJournal(j); setStreakLogs(sl); setBiasLogs(bl)
    setPlaybook(pb); setWeeklyReviews(wr); setSettings(se); setSessionNotes(sn)
    writeCache({ journal:j, streakLogs:sl, biasLogs:bl, playbook:pb, weeklyReviews:wr, settings:se, sessionNotes:sn })
  }

  async function saveData(nj, ns) {
    lastSaveRef.current = Date.now()
    const j = nj ?? journal
    const s = ns ?? streakLogs
    if (nj) setJournal(nj)
    if (ns) setStreakLogs(ns)
    await supabase.from('trading_data').upsert(
      { user_id: user.id, data: { journal: j, streakLogs: s, biasLogs, playbook, weeklyReviews, settings, sessionNotes }, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  async function handleSaveSetup(setup) {
    if (!user?.id) return
    lastSaveRef.current = Date.now()
    const np = setup.id
      ? playbook.map(s => s.id === setup.id ? setup : s)
      : [{ ...setup, id: String(Date.now()), createdAt: new Date().toISOString() }, ...playbook]
    setPlaybook(np)
    writeCache({ journal, streakLogs, biasLogs, playbook: np, weeklyReviews, settings, sessionNotes })
    const { error } = await supabase.from('trading_data').upsert(
      { user_id: user.id, data: { journal, streakLogs, biasLogs, playbook: np, weeklyReviews, settings, sessionNotes }, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    if (error) console.error('Playbook save failed:', error)
  }

  async function handleDeleteSetup(id) {
    if (!user?.id) return
    const np = playbook.filter(s => s.id !== id)
    setPlaybook(np)
    writeCache({ journal, streakLogs, biasLogs, playbook: np, weeklyReviews, settings, sessionNotes })
    await supabase.from('trading_data').upsert(
      { user_id: user.id, data: { journal, streakLogs, biasLogs, playbook: np, weeklyReviews, settings, sessionNotes }, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  function handleSaveWeeklyReview(weekStart, review) { lastSaveRef.current = Date.now()
    const nr = { ...weeklyReviews, [weekStart]: review }
    setWeeklyReviews(nr)
    supabase.from('trading_data').upsert({ user_id: user.id, data: { journal, streakLogs, biasLogs, playbook, weeklyReviews: nr, settings, sessionNotes }, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  }

  function handleSaveSettings(updates) { lastSaveRef.current = Date.now()
    const ns = { ...settings, ...updates }
    setSettings(ns)
    supabase.from('trading_data').upsert({ user_id: user.id, data: { journal, streakLogs, biasLogs, playbook, weeklyReviews, settings: ns, sessionNotes }, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  }

  function handleAddTrade(trade) {
    const nj = [trade, ...journal]
    const ns = { ...streakLogs }
    // Auto-violation: any of these psychTags = rule broken
    const VIOLATION_TAGS = new Set(['fomo','revenge','forced','slmoved'])
    const hasViolationTag = (trade.psychTags||[]).some(t => VIOLATION_TAGS.has(t))
    const isViolation = trade.checklistViolation || hasViolationTag
    if (isViolation) ns[trade.date] = 'violation'
    else if (!ns[trade.date] || ns[trade.date] === 'clean') ns[trade.date] = 'clean'
    saveData(nj, ns)
  }

  function handleDeleteTrade(i) { saveData(journal.filter((_, idx) => idx !== i), null) }

  function handleEditTrade(i, updated) {
    const nj = journal.map((t, idx) => idx === i ? { ...t, ...updated } : t)
    saveData(nj, null)
  }

  function handleSaveBias(date, bias) { lastSaveRef.current = Date.now()
    const u = { ...biasLogs }
    if (bias === null) delete u[date]; else u[date] = bias
    setBiasLogs(u)
    supabase.from('trading_data').upsert(
      { user_id: user.id, data: { journal, streakLogs, biasLogs: u, playbook, weeklyReviews, settings, sessionNotes }, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  function handleSaveSessionNote(date, note) { lastSaveRef.current = Date.now()
    const u = { ...sessionNotes, [date]: note }
    if (!note) delete u[date]
    setSessionNotes(u)
    supabase.from('trading_data').upsert(
      { user_id: user.id, data: { journal, streakLogs, biasLogs, playbook, weeklyReviews, settings, sessionNotes: u }, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  function handleSaveStreakLog(date, status) {
    const u = { ...streakLogs }
    if (status === null) delete u[date]; else u[date] = status
    saveData(null, u)
  }

  const { isLockedOut, lockoutReason } = computeLockout(streakLogs)

  const NAV = [
    { id:'home',       label: t.home,     path: NAV_PATHS.home },
    { id:'calendar',   label: t.calendar, path: NAV_PATHS.calendar },
    { id:'statistics', label: t.stats,    path: NAV_PATHS.statistics },
    { id:'calculator', label: t.risk,     path: NAV_PATHS.calculator },
    { id:'charts',     label: t.charts,   path: NAV_PATHS.charts },
    { id:'playbook',   label: t.playbook, path: NAV_PATHS.playbook },
  ]

  function toggleLang() {
    handleSaveSettings({ language: lang === 'sv' ? 'en' : 'sv' })
  }

  if (loading) return (
    <div style={{ background:'#070a14', minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:M, fontSize:'12px', color:'#3a5878', letterSpacing:'3px' }}>{t.loading}</div>
    </div>
  )

  if (!user) return <Auth onLogin={setUser} />

  const navH = {
    background:'rgba(7,10,20,0.98)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
    borderTop:'2px solid #f59e0b', borderBottom:'1px solid #131e38',
    display:'flex', alignItems:'center',
    paddingTop:'env(safe-area-inset-top)',
    paddingLeft:'16px', paddingRight:'16px', paddingBottom:'0',
    minHeight:'calc(54px + env(safe-area-inset-top))',
    justifyContent:'space-between', position:'sticky', top:0, zIndex:40,
  }

  const LangBtn = () => (
    <button type="button" onClick={toggleLang} style={{ fontFamily:M, fontSize:'9px', color:'#f59e0b', background:'#18100a', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'6px', padding:'4px 9px', cursor:'pointer', letterSpacing:'1px', fontWeight:700, transition:'all 0.15s' }}>
      {lang === 'sv' ? 'EN' : 'SV'}
    </button>
  )

  const Logo = () => (
    <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
      <div style={{ width:'30px', height:'30px', background:'#18100a', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="5" width="6" height="10" rx="1.5" fill="#f59e0b" opacity=".3"/>
          <rect x="1" y="8" width="6" height="7"  rx="1.5" fill="#f59e0b"/>
          <rect x="9" y="1" width="6" height="14" rx="1.5" fill="#f59e0b" opacity=".5"/>
          <rect x="9" y="4" width="6" height="11" rx="1.5" fill="#f59e0b"/>
        </svg>
      </div>
      <div>
        <div style={{ fontFamily:M, fontSize:'13px', fontWeight:700, color:'#f59e0b', lineHeight:1.1 }}>Kamyab</div>
        <div style={{ fontFamily:M, fontSize:'7px', color:'#6880a0', letterSpacing:'2px' }}>TRADING OS</div>
      </div>
    </div>
  )

  return (
    <LangCtx.Provider value={lang}>
    <div style={{ background:'#070a14', minHeight:'100dvh', color:'#dce8f5' }}>

      {MOBILE ? (
        <nav style={navH}>
          <Logo />
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <SessionStatusMobile />
            <LangBtn />
            <button type="button" onClick={() => { localStorage.removeItem('trading-cache'); supabase.auth.signOut() }} style={{ background:'none', border:'1px solid #131e38', borderRadius:'7px', color:'#6880a0', fontSize:'13px', width:'30px', height:'30px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>↩</button>
          </div>
        </nav>
      ) : (
        <nav style={navH}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <Logo />
            <div style={{ width:'1px', height:'18px', background:'#131e38', margin:'0 8px' }} />
            {NAV.map(({ id, label, path }) => (
              <button type="button" key={id} onClick={() => setPage(id)} style={{
                background: page===id ? '#0a1020' : 'none',
                border: `1px solid ${page===id ? '#162340' : 'transparent'}`,
                borderRadius:'8px', padding:'6px 13px', cursor:'pointer',
                display:'flex', alignItems:'center', gap:'6px',
                color: page===id ? '#dce8f5' : '#5a7898',
                fontSize:'13px', fontWeight:500, transition:'all 0.15s',
              }}>
                <Icon path={path} color={page===id ? '#f59e0b' : '#5a7898'} />
                {label}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <SessionStatusDesktop />
            <div style={{ width:'1px', height:'16px', background:'#131e38' }} />
            <LangBtn />
            <button type="button" onClick={() => { localStorage.removeItem('trading-cache'); supabase.auth.signOut() }} style={{ fontFamily:M, fontSize:'9px', color:'#5a7898', background:'none', border:'none', cursor:'pointer', letterSpacing:'0.5px', transition:'color 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.color='#a0c0ca'}
              onMouseLeave={e=>e.currentTarget.style.color='#5a7898'}>{t.logout}</button>
          </div>
        </nav>
      )}

      <div style={{ padding: MOBILE ? '14px 12px 86px' : '20px 24px' }}>
        {page==='home' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px', maxWidth:'1400px', margin:'0 auto' }}>
            <TodayTrade
              journal={journal}
              onAddTrade={handleAddTrade}
              onEditTrade={handleEditTrade}
              streakLogs={streakLogs}
              biasLogs={biasLogs}
              onSaveBias={handleSaveBias}
              isLockedOut={isLockedOut}
              lockoutReason={lockoutReason}
              sessionNotes={sessionNotes}
              onSaveSessionNote={handleSaveSessionNote}
            />
            {MOBILE ? (
              <>
                <EquityCurve journal={journal} />
                <StreakHistory journal={journal} streakLogs={streakLogs} onSaveStreakLog={handleSaveStreakLog} />
                <EconomicCalendar />
              </>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'12px', alignItems:'start' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <EquityCurve journal={journal} />
                  <EconomicCalendar />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <RiskCalculator journal={journal} />
                  <StreakHistory journal={journal} streakLogs={streakLogs} onSaveStreakLog={handleSaveStreakLog} />
                </div>
              </div>
            )}
          </div>
        )}
        {page==='calendar'   && <div style={{ maxWidth:'1400px', margin:'0 auto' }}><Calendar journal={journal} onAddTrade={handleAddTrade} onDeleteTrade={handleDeleteTrade} onEditTrade={handleEditTrade} /></div>}
        {page==='statistics' && <div style={{ maxWidth:'900px',  margin:'0 auto' }}><Statistics journal={journal} weeklyReviews={weeklyReviews} onSaveWeeklyReview={handleSaveWeeklyReview} settings={settings} onSaveSettings={handleSaveSettings} /></div>}
        {page==='calculator' && <div style={{ maxWidth:'520px',  margin:'0 auto', paddingBottom:'12px' }}><RiskCalculator journal={journal} /></div>}
        {page==='charts'     && <div style={{ maxWidth:'1600px', margin:'0 auto' }}><TradingViewChart /></div>}
        {page==='playbook'   && <div style={{ maxWidth:'1000px', margin:'0 auto' }}><Playbook playbook={playbook} onSaveSetup={handleSaveSetup} onDeleteSetup={handleDeleteSetup} journal={journal} /></div>}
      </div>

      {MOBILE && (
        <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:40, background:'rgba(7,10,20,0.98)', backdropFilter:'blur(12px)', borderTop:'1px solid #131e38', display:'flex', paddingBottom:'env(safe-area-inset-bottom)' }}>
          {NAV.map(({ id, label, path }) => (
            <button type="button" key={id} onClick={() => setPage(id)} style={{
              flex:1, background:'none', border:'none', padding:'10px 0 8px', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
              borderTop:`2px solid ${page===id?'#f59e0b':'transparent'}`, marginTop:'-1px',
              transition:'border-color 0.2s',
            }}>
              <Icon path={path} color={page===id?'#f59e0b':'#4a6888'} />
              <span style={{ fontFamily:M, fontSize:'9px', fontWeight:page===id?600:400, color:page===id?'#f59e0b':'#4a6888', letterSpacing:'0.5px', transition:'color 0.15s' }}>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
    </LangCtx.Provider>
  )
}
