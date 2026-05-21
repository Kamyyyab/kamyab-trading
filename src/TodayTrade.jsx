import { useState, useEffect } from 'react'

function TodayTrade({ journal, onAddTrade, streakLogs = {}, biasLogs = {}, onSaveBias }) {
  const [showForm, setShowForm] = useState(false)
  const [result, setResult] = useState('')
  const [instrument, setInstrument] = useState('MYM')
  const [pnl, setPnl] = useState('')
  const [note, setNote] = useState('')

  const today = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })()

  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Session timer
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const nyMinutes = nyTime.getHours() * 60 + nyTime.getMinutes()
  const sessionStart = 9 * 60 + 30
  const sessionEnd = 16 * 60
  const isOpen = nyMinutes >= sessionStart && nyMinutes < sessionEnd
  const isPre = nyMinutes < sessionStart
  const minutesTo = isPre ? sessionStart - nyMinutes : isOpen ? sessionEnd - nyMinutes : null
  const hoursLeft = minutesTo != null ? Math.floor(minutesTo / 60) : 0
  const minsLeft = minutesTo != null ? minutesTo % 60 : 0
  const timerStr = minutesTo != null
    ? `${String(hoursLeft).padStart(2,'0')}:${String(minsLeft).padStart(2,'0')}:${String(now.getSeconds() > 0 ? 60 - now.getSeconds() : 0).padStart(2,'0')}`
    : null

  const todayTrades = journal.filter(t => t.date === today)
  const todayBias = biasLogs[today] || null

  // Quick stats
  const trades = journal.filter(t => t.result !== 'skip' && t.result !== 'no-setup')
  const wins = trades.filter(t => t.result === 'win' || t.result === 'win2').length
  const winRate = trades.length > 0 ? Math.round(wins / trades.length * 100) : 0
  const totalPnl = trades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0)

  // Streak
  const isWeekday = (dateStr) => {
    const wd = new Date(dateStr + 'T12:00:00').getDay()
    return wd >= 1 && wd <= 5
  }
  const logDates = Object.keys(streakLogs).filter(isWeekday).sort((a, b) => b.localeCompare(a))
  let streak = 0
  for (const d of logDates) {
    if (streakLogs[d] === 'violation') break
    if (streakLogs[d] === 'clean') streak++
  }

  // This week P&L
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const weekTrades = trades.filter(t => new Date(t.date) >= weekStart)
  const weekPnl = weekTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0)

  const resultColors = { win: '#00e5b0', win2: '#00e5b0', loss: '#ff4f6b', be: '#8aacb0', skip: '#ffc030', 'no-setup': '#4a6870' }
  const resultBg = { win: '#004038', win2: '#004038', loss: '#7a0f28', be: '#222d30', skip: '#3a2800', 'no-setup': '#1a1a1a' }
  const resultLabels = { win: 'Win +3R', win2: 'Win +2R', loss: 'Loss −1R', be: 'Break Even', skip: 'Skip', 'no-setup': 'No Setup' }

  const biasOptions = [
    { value: 'bullish', label: '▲ Bullish', color: '#00e5b0', bg: '#003d30', border: '#007d5e' },
    { value: 'bearish', label: '▼ Bearish', color: '#ff4f6b', bg: '#3d0f1a', border: '#7a1f2e' },
    { value: 'neutral', label: '◆ Neutral', color: '#8aacb0', bg: '#1e2d31', border: '#3a5458' },
  ]
  const currentBiasOpt = biasOptions.find(b => b.value === todayBias)

  function handleAdd() {
    if (!result) return
    onAddTrade({ date: today, result, instrument, pnl: pnl || '0', note, timestamp: new Date().toISOString() })
    setResult(''); setPnl(''); setNote(''); setShowForm(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Stats + Bias row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '10px' }}>
        {[
          { label: 'WIN RATE', value: `${winRate}%`, color: '#00e5b0' },
          { label: 'DENNA VECKA', value: `${weekPnl >= 0 ? '+' : ''}$${weekPnl.toFixed(0)}`, color: weekPnl >= 0 ? '#00e5b0' : '#ff4f6b' },
          { label: 'TOTALT P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`, color: totalPnl >= 0 ? '#00e5b0' : '#ff4f6b' },
          { label: 'STREAK', value: `${streak}d`, color: '#00e5b0' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}

        {/* Bias as 5th card */}
        <div style={{ background: '#161c1e', border: `1px solid ${currentBiasOpt ? currentBiasOpt.border : '#1e2d31'}`, borderRadius: '10px', padding: '14px 16px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '6px' }}>DAGLIG BIAS</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {biasOptions.map(b => (
              <button key={b.value} onClick={() => onSaveBias && onSaveBias(today, todayBias === b.value ? null : b.value)}
                style={{
                  flex: 1,
                  background: todayBias === b.value ? b.bg : '#0f1618',
                  border: `1px solid ${todayBias === b.value ? b.border : '#1e2d31'}`,
                  borderRadius: '5px',
                  color: todayBias === b.value ? b.color : '#4a6870',
                  fontFamily: 'monospace',
                  fontSize: '8px',
                  padding: '5px 2px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Today's trades */}
      <div style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '12px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: todayTrades.length > 0 || showForm ? '10px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '2px' }}>TODAY'S TRADES</div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4a6870' }}>{new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>
            {timerStr && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0f1618', border: `1px solid ${isOpen ? '#007d5e' : '#26383d'}`, borderRadius: '6px', padding: '5px 10px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isOpen ? '#00e5b0' : '#ffc030', boxShadow: isOpen ? '0 0 5px #00e5b0' : 'none' }} />
                <span style={{ fontFamily: 'monospace', fontSize: '9px', color: isOpen ? '#00e5b0' : '#ffc030', letterSpacing: '1px' }}>
                  {isOpen ? 'STÄNGER' : 'ÖPPNAR'} {timerStr}
                </span>
              </div>
            )}
          </div>
          <button onClick={() => setShowForm(!showForm)}
            style={{ background: '#007d5e', color: '#0a0c0d', fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, padding: '7px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', letterSpacing: '1px' }}>
            + LOG TRADE
          </button>
        </div>

        {todayTrades.length === 0 && !showForm && (
          <div style={{ color: '#2e4448', fontSize: '11px', fontFamily: 'monospace' }}>Inga trades loggade idag</div>
        )}

        {todayTrades.map((t, i) => (
          <div key={i} style={{ background: '#0a0c0d', border: '1px solid #1e2d31', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4a6870', background: '#161c1e', border: '1px solid #26383d', borderRadius: '4px', padding: '2px 7px' }}>{t.instrument}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '9px', padding: '2px 8px', borderRadius: '4px', background: resultBg[t.result] || '#1a1a1a', color: resultColors[t.result] || '#8aacb0' }}>
                {resultLabels[t.result] || t.result}
              </span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: parseFloat(t.pnl) >= 0 ? '#00e5b0' : '#ff4f6b' }}>
              {parseFloat(t.pnl) >= 0 ? '+' : ''}${parseFloat(t.pnl || 0).toFixed(0)}
            </div>
          </div>
        ))}

        {showForm && (
          <div style={{ background: '#0a0c0d', border: '1px solid #26383d', borderRadius: '8px', padding: '14px', marginTop: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px', marginBottom: '5px' }}>OUTCOME</div>
                <select value={result} onChange={e => setResult(e.target.value)}
                  style={{ width: '100%', background: '#1c2426', border: '1px solid #26383d', borderRadius: '8px', color: '#e2eeee', fontFamily: 'monospace', fontSize: '12px', padding: '9px 12px', outline: 'none' }}>
                  <option value="">Select...</option>
                  <option value="win">Win +3R</option>
                  <option value="win2">Win +2R</option>
                  <option value="loss">Loss −1R</option>
                  <option value="be">Break Even</option>
                  <option value="skip">Skip</option>
                  <option value="no-setup">No Setup</option>
                </select>
              </div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px', marginBottom: '5px' }}>INSTRUMENT</div>
                <input value={instrument} onChange={e => setInstrument(e.target.value)}
                  style={{ width: '100%', background: '#1c2426', border: '1px solid #26383d', borderRadius: '8px', color: '#e2eeee', fontSize: '14px', padding: '9px 12px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px', marginBottom: '5px' }}>P&L ($)</div>
              <input type="number" value={pnl} onChange={e => setPnl(e.target.value)} placeholder="e.g. 450"
                style={{ width: '100%', background: '#1c2426', border: '1px solid #26383d', borderRadius: '8px', color: '#e2eeee', fontSize: '14px', padding: '9px 12px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px', marginBottom: '5px' }}>NOTE</div>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note..."
                style={{ width: '100%', background: '#1c2426', border: '1px solid #26383d', borderRadius: '8px', color: '#e2eeee', fontSize: '13px', padding: '9px 12px', outline: 'none', resize: 'vertical', minHeight: '60px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleAdd}
                style={{ flex: 1, background: '#007d5e', color: '#0a0c0d', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', letterSpacing: '1px' }}>
                + SAVE TRADE
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'transparent', color: '#4a6870', fontFamily: 'monospace', fontSize: '10px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e2d31', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TodayTrade
