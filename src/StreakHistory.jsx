import { useMemo, useState } from 'react'

function StreakHistory({ journal, onSaveStreakLog, streakLogs = {} }) {
  const todayStr  = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()
  const todayDate = new Date()
  const [viewYear, setViewYear]   = useState(todayDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth())
  const [popup, setPopup]         = useState(null)

  const { currentStreak, longestStreak, cleanDays, violationDays } = useMemo(() => {
    const isWeekday = (d) => { const wd = new Date(d + 'T12:00:00').getDay(); return wd >= 1 && wd <= 5 }
    const logDates  = Object.keys(streakLogs).filter(isWeekday).sort((a,b) => b.localeCompare(a))
    let currentStreak = 0
    for (const d of logDates) {
      if (streakLogs[d] === 'violation') break
      if (streakLogs[d] === 'clean') currentStreak++
    }
    let longest = 0, temp = 0
    for (const d of [...logDates].reverse()) {
      if (streakLogs[d] === 'violation') temp = 0
      else if (streakLogs[d] === 'clean') { temp++; longest = Math.max(longest, temp) }
    }
    return {
      currentStreak,
      longestStreak: longest,
      cleanDays: logDates.filter(d => streakLogs[d] === 'clean').length,
      violationDays: logDates.filter(d => streakLogs[d] === 'violation').length,
    }
  }, [streakLogs])

  // Build day P&L map for the current visible month
  const dayPnlMap = useMemo(() => {
    const map = {}
    journal.forEach(t => {
      if (!t.date) return
      const pnl = parseFloat(t.pnl || 0)
      if (t.result === 'skip' || t.result === 'no-setup') return
      map[t.date] = (map[t.date] || 0) + pnl
    })
    return map
  }, [journal])

  const calendarDays = useMemo(() => {
    const firstDay  = new Date(viewYear, viewMonth, 1)
    const lastDay   = new Date(viewYear, viewMonth + 1, 0)
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
    const days = []
    for (let i = 0; i < startOffset; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date    = new Date(viewYear, viewMonth, d)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
      const wd      = date.getDay()
      const isWeekend = wd === 0 || wd === 6
      const isFuture  = dateStr > todayStr
      const isToday   = dateStr === todayStr
      let status = 'empty'
      if (!isFuture && !isWeekend) {
        if (streakLogs[dateStr]) status = streakLogs[dateStr]
        else {
          const dt = journal.filter(t => t.date === dateStr)
          if (dt.length > 0) status = dt.some(t => t.brokenRules?.length > 0) ? 'violation' : 'clean'
        }
      }
      const dayPnl = dayPnlMap[dateStr] || null
      days.push({ date: dateStr, day: d, status, isWeekend, isFuture, isToday, dayPnl })
    }
    return days
  }, [viewYear, viewMonth, journal, streakLogs, todayStr, dayPnlMap])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) }
    else setViewMonth(m => m-1)
  }
  function nextMonth() {
    if (viewYear === todayDate.getFullYear() && viewMonth >= todayDate.getMonth()) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) }
    else setViewMonth(m => m+1)
  }

  function handleClick(day, e) {
    if (!day || day.isFuture || day.isWeekend) return
    const rect = e.currentTarget.getBoundingClientRect()
    setPopup({ date: day.date, status: day.status, x: rect.left, y: rect.bottom + 6 })
  }

  function logDay(date, status) {
    onSaveStreakLog && onSaveStreakLog(date, status)
    setPopup(null)
  }

  const weeks = []
  for (let i = 0; i < calendarDays.length; i += 7) weeks.push(calendarDays.slice(i, i+7))

  const weekLabels   = ['M','T','O','T','F','L','S']
  const monthName    = new Date(viewYear, viewMonth, 1).toLocaleDateString('sv-SE', { month: 'long' })
  const isNextDisabled = viewYear === todayDate.getFullYear() && viewMonth >= todayDate.getMonth()

  const statusBg     = { clean: '#003d30', violation: '#3d0f1a', empty: '#0f1618' }
  const statusBorder = { clean: '#007d5e', violation: '#7a1f2e', empty: '#1a2225' }
  const statusDot    = { clean: '#00e5b0', violation: '#ff4f6b' }

  return (
    <div style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '12px', padding: '14px' }}>

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: currentStreak > 0 ? '#00e5b0' : '#4a6870', lineHeight: 1 }}>{currentStreak}</span>
          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870' }}>dagars streak</span>
        </div>
        <div style={{ display: 'flex', gap: '14px' }}>
          {[
            { label: 'LÄNGSTA', value: longestStreak, color: '#00e5b0' },
            { label: 'CLEAN',   value: cleanDays,     color: '#00e5b0' },
            { label: 'VIOLATIONS', value: violationDays, color: '#ff4f6b' },
          ].map((s,i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '7px', color: '#4a6870', letterSpacing: '1px', marginBottom: '1px' }}>{s.label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#e2eeee', textTransform: 'capitalize' }}>{monthName} {viewYear}</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={prevMonth} style={{ background: '#1c2426', border: '1px solid #26383d', borderRadius: '5px', color: '#8aacb0', fontSize: '12px', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <button onClick={nextMonth} style={{ background: isNextDisabled ? 'transparent' : '#1c2426', border: '1px solid #26383d', borderRadius: '5px', color: isNextDisabled ? '#1e2d31' : '#8aacb0', fontSize: '12px', width: '26px', height: '26px', cursor: isNextDisabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '2px' }}>
        {weekLabels.map((l,i) => (
          <div key={i} style={{ fontFamily: 'monospace', fontSize: '7px', color: i >= 5 ? '#1e2d31' : '#2e4448', textAlign: 'center', padding: '2px 0' }}>{l}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {week.map((day, di) => {
              if (!day) return <div key={di} style={{ borderRadius: '4px', height: '38px' }} />
              const bg  = day.isFuture ? 'transparent' : (day.isToday ? '#1a2d2a' : statusBg[day.status])
              const brd = day.isToday  ? '#00e5b0' : (day.isFuture ? 'transparent' : statusBorder[day.status])
              const hasPnl = day.dayPnl !== null && !day.isWeekend && !day.isFuture

              return (
                <div key={di}
                  onClick={e => handleClick(day, e)}
                  style={{
                    borderRadius: '4px',
                    background: bg,
                    border: `1px solid ${brd}`,
                    height: '38px',
                    padding: '3px 4px',
                    cursor: !day.isFuture && !day.isWeekend ? 'pointer' : 'default',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    opacity: day.isFuture ? 0.15 : 1,
                  }}
                  onMouseEnter={e => { if (!day.isFuture && !day.isWeekend) e.currentTarget.style.borderColor = '#3a5458' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = brd }}
                >
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: day.isToday ? 700 : 400, color: day.isToday ? '#00e5b0' : day.isWeekend ? '#1e2d31' : '#4a6870', lineHeight: 1 }}>
                    {day.day}
                  </div>
                  {/* P&L overlay instead of just a dot */}
                  {hasPnl ? (
                    <div style={{ fontFamily: 'monospace', fontSize: '7px', fontWeight: 700, color: day.dayPnl >= 0 ? '#00e5b0' : '#ff4f6b', lineHeight: 1 }}>
                      {day.dayPnl >= 0 ? '+' : ''}{Math.round(day.dayPnl)}
                    </div>
                  ) : (
                    day.status !== 'empty' && !day.isFuture && !day.isWeekend && (
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusDot[day.status] }} />
                    )
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        {[
          { bg: '#003d30', border: '#007d5e', label: 'Clean' },
          { bg: '#3d0f1a', border: '#7a1f2e', label: 'Violation' },
          { bg: '#0f1618', border: '#1a2225', label: 'Ingen trade' },
        ].map((l,i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: l.bg, border: `1px solid ${l.border}` }} />
            <span style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Popup */}
      {popup && (
        <>
          <div onClick={() => setPopup(null)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{
            position: 'fixed',
            left: Math.min(popup.x, window.innerWidth - 210),
            top:  Math.min(popup.y, window.innerHeight - 160),
            zIndex: 99,
            background: '#1c2426', border: '1px solid #26383d', borderRadius: '10px',
            padding: '12px', minWidth: '180px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', marginBottom: '8px', letterSpacing: '1px' }}>
              {new Date(popup.date + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <button onClick={() => logDay(popup.date, 'clean')} style={{ background: popup.status === 'clean' ? '#003d30' : '#0f1618', border: `1px solid ${popup.status === 'clean' ? '#007d5e' : '#26383d'}`, borderRadius: '6px', color: '#00e5b0', fontFamily: 'monospace', fontSize: '10px', padding: '7px 10px', cursor: 'pointer', textAlign: 'left' }}>✓ Följde regler</button>
              <button onClick={() => logDay(popup.date, 'violation')} style={{ background: popup.status === 'violation' ? '#3d0f1a' : '#0f1618', border: `1px solid ${popup.status === 'violation' ? '#7a1f2e' : '#26383d'}`, borderRadius: '6px', color: '#ff4f6b', fontFamily: 'monospace', fontSize: '10px', padding: '7px 10px', cursor: 'pointer', textAlign: 'left' }}>✕ Bröt regler</button>
              {popup.status !== 'empty' && (
                <button onClick={() => logDay(popup.date, null)} style={{ background: 'none', border: '1px solid #1e2d31', borderRadius: '6px', color: '#4a6870', fontFamily: 'monospace', fontSize: '8px', padding: '5px 10px', cursor: 'pointer', textAlign: 'left' }}>Rensa</button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default StreakHistory