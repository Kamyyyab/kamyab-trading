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
  const color  = isOpen ? '#00e5b0' : isPre ? '#ffc030' : '#4a6470'
  const label  = isOpen ? 'ÖPPEN' : isPre ? 'PRE' : 'STÄNGD'
  const bg     = isOpen ? 'rgba(0,229,176,0.07)' : isPre ? 'rgba(255,192,48,0.06)' : 'transparent'
  const bdr    = isOpen ? 'rgba(0,229,176,0.18)' : isPre ? 'rgba(255,192,48,0.14)' : '#182025'

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'5px', background:bg, border:`1px solid ${bdr}`, borderRadius:'20px', padding:'4px 10px' }}>
        <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:color }} />
        <span style={{ fontFamily:M, fontSize:'9px', fontWeight:600, color, letterSpacing:'1px' }}>{label}</span>
      </div>
      <div style={{ width:'1px', height:'16px', background:'#182025' }} />
      <div>
        <div style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84', letterSpacing:'1px', marginBottom:'1px' }}>SWE</div>
        <div style={{ fontFamily:M, fontSize:'11px', color:'#88a8ae' }}>{sweTime}</div>
      </div>
      <div>
        <div style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84', letterSpacing:'1px', marginBottom:'1px' }}>NY</div>
        <div style={{ fontFamily:M, fontSize:'11px', color:'#88a8ae' }}>{nyTime}</div>
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
  const color   = isOpen ? '#00e5b0' : isPre ? '#ffc030' : '#85a4ad'
  const label   = isOpen ? 'ÖPPEN' : isPre ? 'PRE' : 'STÄNGD'
  const bg      = isOpen ? 'rgba(0,229,176,0.07)' : isPre ? 'rgba(255,192,48,0.06)' : 'transparent'
  const bdr     = isOpen ? 'rgba(0,229,176,0.18)' : isPre ? 'rgba(255,192,48,0.14)' : '#1e2c32'

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'5px', background:bg, border:`1px solid ${bdr}`, borderRadius:'20px', padding:'4px 9px' }}>
        <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:color }} />
        <span style={{ fontFamily:M, fontSize:'9px', fontWeight:600, color, letterSpacing:'0.5px' }}>{label}</span>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84', letterSpacing:'1px' }}>NY</div>
        <div style={{ fontFamily:M, fontSize:'11px', color:'#8aacb4', fontWeight:500 }}>{nyTime}</div>
      </div>
    </div>
  )
}

const NAV = [
  { id:'home',       label:'Hem',      path:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10' },
  { id:'calendar',   label:'Kalender', path:'M3 4h18a1 1 0 011 1v15a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z M16 2v4 M8 2v4 M2 10h20' },
  { id:'statistics', label:'Stats',    path:'M18 20V10 M12 20V4 M6 20v-6' },
  { id:'calculator', label:'Risk',     path:'M5 3h14a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z M9 7h6 M9 11h1 M12 11h1 M15 11h1 M9 15h1 M12 15h1 M15 15h1 M9 19h4' },
]

function Icon({ path, color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {path.split(' M').map((p, i) => <path key={i} d={(i===0?'':' M')+p} />)}
    </svg>
  )
}

export default function App() {
  const [user, setUser]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [journal, setJournal]       = useState([])
  const [streakLogs, setStreakLogs] = useState({})
  const [biasLogs, setBiasLogs]     = useState({})
  const [page, setPage]             = useState('home')
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
    const { data } = await supabase.from('trading_data').select('data').eq('user_id', uid).maybeSingle()
    if (data?.data?.journal)    setJournal(Array.isArray(data.data.journal) ? data.data.journal : [])
    if (data?.data?.streakLogs) setStreakLogs(data.data.streakLogs)
    if (data?.data?.biasLogs)   setBiasLogs(data.data.biasLogs)
  }

  async function saveData(nj, ns) {
    const j = nj ?? journal
    const s = ns ?? streakLogs
    if (nj) setJournal(nj)
    if (ns) setStreakLogs(ns)
    await supabase.from('trading_data').upsert(
      { user_id: user.id, data: { journal: j, streakLogs: s, biasLogs }, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  function handleAddTrade(trade) {
    const nj = [trade, ...journal]
    const ns = { ...streakLogs }
    // Auto-violation: any of these psychTags = rule broken
    const VIOLATION_TAGS = new Set(['fomo','revenge','forced','oversize'])
    const hasViolationTag = (trade.psychTags||[]).some(t => VIOLATION_TAGS.has(t))
    const isViolation = trade.brokenRules?.length > 0 || hasViolationTag
    if (isViolation) ns[trade.date] = 'violation'
    else if (!ns[trade.date] || ns[trade.date] === 'clean') ns[trade.date] = 'clean'
    saveData(nj, ns)
  }

  function handleDeleteTrade(i) { saveData(journal.filter((_, idx) => idx !== i), null) }

  function handleEditTrade(i, updated) {
    const nj = journal.map((t, idx) => idx === i ? { ...t, ...updated } : t)
    saveData(nj, null)
  }

  function handleSaveBias(date, bias) {
    const u = { ...biasLogs }
    if (bias === null) delete u[date]; else u[date] = bias
    setBiasLogs(u)
    supabase.from('trading_data').upsert(
      { user_id: user.id, data: { journal, streakLogs, biasLogs: u }, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  function handleSaveStreakLog(date, status) {
    const u = { ...streakLogs }
    if (status === null) delete u[date]; else u[date] = status
    saveData(null, u)
  }

  const { isLockedOut, lockoutReason } = computeLockout(streakLogs)

  if (loading) return (
    <div style={{ background:'#060809', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:M, fontSize:'12px', color:'#4a6470', letterSpacing:'3px' }}>LADDAR...</div>
    </div>
  )

  if (!user) return <Auth onLogin={setUser} />

  const navH = { height:'54px', background:'rgba(6,8,9,0.95)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderBottom:'1px solid #182025', display:'flex', alignItems:'center', padding:'0 16px', justifyContent:'space-between', position:'sticky', top:0, zIndex:40 }

  const Logo = () => (
    <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
      <div style={{ width:'30px', height:'30px', background:'#001810', border:'1px solid rgba(0,229,176,0.2)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="5" width="6" height="10" rx="1.5" fill="#00e5b0" opacity=".25"/>
          <rect x="1" y="8" width="6" height="7"  rx="1.5" fill="#00e5b0"/>
          <rect x="9" y="1" width="6" height="14" rx="1.5" fill="#00e5b0" opacity=".4"/>
          <rect x="9" y="4" width="6" height="11" rx="1.5" fill="#00e5b0"/>
        </svg>
      </div>
      <div>
        <div style={{ fontFamily:M, fontSize:'13px', fontWeight:700, color:'#00e5b0', lineHeight:1.1 }}>Kamyab</div>
        <div style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84', letterSpacing:'2px' }}>TRADING OS</div>
      </div>
    </div>
  )

  return (
    <div style={{ background:'#060809', minHeight:'100vh', color:'#d0e8ec' }}>

      {MOBILE ? (
        <nav style={navH}>
          <Logo />
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <SessionStatusMobile />
            <button type="button" onClick={() => supabase.auth.signOut()} style={{ background:'none', border:'1px solid #182025', borderRadius:'7px', color:'#5a7a84', fontSize:'13px', width:'30px', height:'30px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>↩</button>
          </div>
        </nav>
      ) : (
        <nav style={navH}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <Logo />
            <div style={{ width:'1px', height:'18px', background:'#182025', margin:'0 8px' }} />
            {NAV.map(({ id, label, path }) => (
              <button type="button" key={id} onClick={() => setPage(id)} style={{
                background: page===id ? '#0d1214' : 'none',
                border: `1px solid ${page===id ? '#1e2c32' : 'transparent'}`,
                borderRadius:'8px', padding:'6px 13px', cursor:'pointer',
                display:'flex', alignItems:'center', gap:'6px',
                color: page===id ? '#d0e8ec' : '#7090a0',
                fontSize:'13px', fontWeight:500, transition:'all 0.15s',
              }}>
                <Icon path={path} color={page===id ? '#00e5b0' : '#7090a0'} />
                {label}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <SessionStatusDesktop />
            <div style={{ width:'1px', height:'16px', background:'#182025' }} />
            <button type="button" onClick={() => supabase.auth.signOut()} style={{ fontFamily:M, fontSize:'9px', color:'#7090a0', background:'none', border:'none', cursor:'pointer', letterSpacing:'0.5px', transition:'color 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.color='#a0c0ca'}
              onMouseLeave={e=>e.currentTarget.style.color='#7090a0'}>logga ut</button>
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
                  <RiskCalculator />
                  <StreakHistory journal={journal} streakLogs={streakLogs} onSaveStreakLog={handleSaveStreakLog} />
                </div>
              </div>
            )}
          </div>
        )}
        {page==='calendar'   && <div style={{ maxWidth:'1400px', margin:'0 auto' }}><Calendar journal={journal} onAddTrade={handleAddTrade} onDeleteTrade={handleDeleteTrade} onEditTrade={handleEditTrade} /></div>}
        {page==='statistics' && <div style={{ maxWidth:'900px',  margin:'0 auto' }}><Statistics journal={journal} /></div>}
        {page==='calculator' && <div style={{ maxWidth:'520px',  margin:'0 auto', paddingBottom:'12px' }}><RiskCalculator /></div>}
      </div>

      {MOBILE && (
        <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:40, background:'rgba(6,8,9,0.96)', backdropFilter:'blur(12px)', borderTop:'1px solid #182025', display:'flex', paddingBottom:'env(safe-area-inset-bottom)' }}>
          {NAV.map(({ id, label, path }) => (
            <button type="button" key={id} onClick={() => setPage(id)} style={{
              flex:1, background:'none', border:'none', padding:'10px 0 8px', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
              borderTop:`2px solid ${page===id?'#00e5b0':'transparent'}`, marginTop:'-1px',
              transition:'border-color 0.2s',
            }}>
              <Icon path={path} color={page===id?'#00e5b0':'#5a7a84'} />
              <span style={{ fontFamily:M, fontSize:'9px', fontWeight:page===id?600:400, color:page===id?'#00e5b0':'#5a7a84', letterSpacing:'0.5px', transition:'color 0.15s' }}>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
