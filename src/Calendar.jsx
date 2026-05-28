import { useState, useRef, useEffect } from 'react'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

const PSYCHOLOGY_TAGS = [
  { id: 'patient',   label: 'Tålmodig',    color: '#00e5b0', bg: '#003d30' },
  { id: 'fomo',      label: 'FOMO',         color: '#ff4f6b', bg: '#3d0f1a' },
  { id: 'revenge',   label: 'Hämndtrade',   color: '#ff4f6b', bg: '#3d0f1a' },
  { id: 'aplus',     label: 'A+ Setup',     color: '#00e5b0', bg: '#003d30' },
  { id: 'forced',    label: 'Forcerat',     color: '#ffc030', bg: '#3a2800' },
  { id: 'setforget', label: 'Set & Forget', color: '#00e5b0', bg: '#003d30' },
  { id: 'oversize',  label: 'Överposad',    color: '#ff4f6b', bg: '#3d0f1a' },
  { id: 'managed',   label: 'Hanterat bra', color: '#00e5b0', bg: '#003d30' },
]

const RESULT_BG     = { win: '#003d30', win2: '#003d30', loss: '#3d0f1a', be: '#1e2d31', skip: '#2d1f00', 'no-setup': '#161c1e' }
const RESULT_BORDER = { win: '#007d5e', win2: '#007d5e', loss: '#7a1f2e', be: '#3a5458', skip: '#5a3a00', 'no-setup': '#26383d' }
const RESULT_COLOR  = { win: '#00e5b0', win2: '#00e5b0', loss: '#ff4f6b', be: '#8aacb0', skip: '#ffc030', 'no-setup': '#4a6870' }

function Calendar({ journal = [], onAddTrade, onDeleteTrade }) {
  const mobile   = useIsMobile()
  const [year, setYear]   = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState(null)
  const [showForm, setShowForm]       = useState(false)
  const [lightbox, setLightbox]       = useState(null)
  const fileRef = useRef()

  const [result,     setResult]     = useState('')
  const [instrument, setInstrument] = useState('MYM')
  const [pnl,        setPnl]        = useState('')
  const [note,       setNote]       = useState('')
  const [emotion,    setEmotion]    = useState('3')
  const [setup,      setSetup]      = useState('')
  const [psychTags,  setPsychTags]  = useState([])
  const [image,      setImage]      = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const months   = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December']
  const dayLabels = ['M','T','O','T','F','L','S']
  const firstDay   = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7
  const today = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })()

  const allMonthTrades = journal.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
  const monthTrades  = allMonthTrades.filter(t => t.result !== 'skip' && t.result !== 'no-setup')
  const monthWins    = monthTrades.filter(t => t.result === 'win' || t.result === 'win2').length
  const monthLosses  = monthTrades.filter(t => t.result === 'loss').length
  const monthSkips   = allMonthTrades.filter(t => t.result === 'skip' || t.result === 'no-setup').length
  const monthPnl     = monthTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0)
  const monthWr      = monthTrades.length > 0 ? Math.round(monthWins / monthTrades.length * 100) : 0
  const tradeDays    = [...new Set(monthTrades.map(t => t.date))].length
  const avgDayPnl    = tradeDays > 0 ? monthPnl / tradeDays : 0

  function getDayStatus(dateStr) {
    const dt = journal.filter(t => t.date === dateStr)
    if (!dt.length) return null
    const hasSkip = dt.every(t => t.result === 'skip' || t.result === 'no-setup')
    if (hasSkip) return 'skip'
    const active = dt.filter(t => t.result !== 'skip' && t.result !== 'no-setup')
    if (!active.length) return 'skip'
    const hasLoss = active.some(t => t.result === 'loss')
    const hasWin  = active.some(t => t.result === 'win' || t.result === 'win2')
    if (hasLoss && !hasWin) return 'loss'
    if (hasWin && !hasLoss) return 'win'
    return 'mixed'
  }

  function getDayBg(status, pnlAmt) {
    if (status === 'skip') return { bg: '#1e2000', border: '#3a3800', dot: '#ffc030' }
    if (status === 'win') {
      const i = Math.min(Math.abs(pnlAmt) / 800, 1)
      return { bg: `rgba(0, ${Math.round(30 + i * 30) + 30}, ${Math.round(30 + i * 30)}, 0.35)`, border: '#007d5e', dot: '#00e5b0' }
    }
    if (status === 'loss') {
      const i = Math.min(Math.abs(pnlAmt) / 500, 1)
      return { bg: `rgba(${Math.round(40 + i * 25) + 20}, 10, 20, 0.5)`, border: '#7a1f2e', dot: '#ff4f6b' }
    }
    return { bg: '#2d2000', border: '#5a3a00', dot: '#ffc030' }
  }

  // Calendar cells
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push({ empty: true })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ day: d, dateStr })
  }
  while (cells.length % 7 !== 0) cells.push({ empty: true })
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const selectedTrades = selectedDay ? journal.filter(t => t.date === selectedDay) : []
  const selectedPnl    = selectedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0)

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1); setSelectedDay(null); resetForm() }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1); setSelectedDay(null); resetForm() }

  function resetForm() {
    setResult(''); setPnl(''); setNote(''); setEmotion('3'); setSetup(''); setPsychTags([])
    setImage(null); setImagePreview(null); setShowForm(false)
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setImage(ev.target.result); setImagePreview(ev.target.result) }
    reader.readAsDataURL(file)
  }

  function handleAdd() {
    if (!result || !selectedDay) return
    onAddTrade({ date: selectedDay, result, instrument, pnl: pnl || '0', note, emotion, setup, psychTags, image: image || null, timestamp: new Date().toISOString() })
    resetForm()
  }

  function togglePsychTag(id) {
    setPsychTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const cellHeight = mobile ? '48px' : '110px'

  // Side/bottom panel content
  const TradePanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Panel header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #1e2d31', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '3px' }}>
            {new Date(selectedDay + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </div>
          {selectedTrades.filter(t => t.result !== 'skip' && t.result !== 'no-setup').length > 0 && (
            <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, color: selectedPnl >= 0 ? '#00e5b0' : '#ff4f6b' }}>
              {selectedPnl >= 0 ? '+' : ''}${selectedPnl.toFixed(0)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button onClick={() => setShowForm(!showForm)} style={{ background: '#007d5e', color: '#0a0c0d', fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, padding: '7px 13px', borderRadius: '6px', border: 'none', cursor: 'pointer', letterSpacing: '1px', WebkitTapHighlightColor: 'transparent' }}>
            + LOG
          </button>
          <button onClick={() => { setSelectedDay(null); resetForm() }} style={{ background: 'none', border: 'none', color: '#4a6870', cursor: 'pointer', fontSize: '16px', padding: '4px' }}>✕</button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Log form */}
        {showForm && (
          <div style={{ background: '#0f1618', border: '1px solid #26383d', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '4px' }}>OUTCOME</div>
                <select value={result} onChange={e => setResult(e.target.value)} style={{ width: '100%', background: '#1c2426', border: '1px solid #26383d', borderRadius: '7px', color: '#e2eeee', fontFamily: 'monospace', fontSize: '14px', padding: '9px 10px', outline: 'none' }}>
                  <option value="">Välj...</option>
                  <option value="win">Win +3R</option>
                  <option value="win2">Win +2R</option>
                  <option value="loss">Loss −1R</option>
                  <option value="be">Break Even</option>
                  <option value="skip">Skip</option>
                  <option value="no-setup">No Setup</option>
                </select>
              </div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '4px' }}>INSTRUMENT</div>
                <input value={instrument} onChange={e => setInstrument(e.target.value)} style={{ width: '100%', background: '#1c2426', border: '1px solid #26383d', borderRadius: '7px', color: '#e2eeee', fontSize: '16px', padding: '9px 10px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '4px' }}>P&L ($)</div>
                <input type="number" inputMode="decimal" value={pnl} onChange={e => setPnl(e.target.value)} placeholder="450" style={{ width: '100%', background: '#1c2426', border: '1px solid #26383d', borderRadius: '7px', color: '#e2eeee', fontSize: '16px', padding: '9px 10px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '4px' }}>SETUP</div>
                <input value={setup} onChange={e => setSetup(e.target.value)} placeholder="BTB" style={{ width: '100%', background: '#1c2426', border: '1px solid #26383d', borderRadius: '7px', color: '#e2eeee', fontSize: '16px', padding: '9px 10px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            {/* Emotion */}
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '5px' }}>
                EMOTION — <span style={{ color: parseInt(emotion) <= 3 ? '#00e5b0' : parseInt(emotion) >= 7 ? '#ff4f6b' : '#ffc030' }}>
                  {parseInt(emotion) <= 3 ? 'Lugn ✓' : parseInt(emotion) >= 7 ? 'Stressad ✗' : 'Neutral'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '3px' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => setEmotion(String(n))} style={{
                    flex: 1, padding: '7px 0', borderRadius: '4px',
                    border: `1px solid ${emotion === String(n) ? '#007d5e' : '#26383d'}`,
                    background: emotion === String(n) ? '#004038' : '#1c2426',
                    color: emotion === String(n) ? '#00e5b0' : '#4a6870',
                    fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}>{n}</button>
                ))}
              </div>
            </div>
            {/* Psychology tags */}
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '5px' }}>PSYKOLOGI</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {PSYCHOLOGY_TAGS.map(tag => {
                  const active = psychTags.includes(tag.id)
                  return (
                    <button key={tag.id} onClick={() => togglePsychTag(tag.id)} style={{
                      fontFamily: 'monospace', fontSize: '9px',
                      padding: '4px 9px', borderRadius: '5px',
                      background: active ? tag.bg : '#1c2426',
                      border: `1px solid ${active ? tag.color + '55' : '#26383d'}`,
                      color: active ? tag.color : '#4a6870',
                      cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    }}>{tag.label}</button>
                  )
                })}
              </div>
            </div>
            {/* Notes */}
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '4px' }}>NOTES</div>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Analys, tankar..." style={{ width: '100%', background: '#1c2426', border: '1px solid #26383d', borderRadius: '7px', color: '#e2eeee', fontSize: '13px', padding: '9px 10px', outline: 'none', resize: 'vertical', minHeight: '70px', boxSizing: 'border-box' }} />
            </div>
            {/* Chart upload */}
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '5px' }}>CHART</div>
              {imagePreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={imagePreview} alt="chart" style={{ width: '100%', borderRadius: '8px', border: '1px solid #26383d', display: 'block', maxHeight: '200px', objectFit: 'cover' }} />
                  <button onClick={() => { setImage(null); setImagePreview(null) }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(10,12,13,0.85)', border: '1px solid #26383d', borderRadius: '5px', color: '#ff4f6b', cursor: 'pointer', fontSize: '11px', padding: '3px 8px', fontFamily: 'monospace' }}>✕</button>
                </div>
              ) : (
                <div onClick={() => fileRef.current.click()} style={{ border: '1px dashed #26383d', borderRadius: '8px', padding: '14px', textAlign: 'center', cursor: 'pointer', background: '#111618' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4a6870' }}>↑ Ladda upp chart</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleAdd} style={{ flex: 1, background: '#007d5e', color: '#0a0c0d', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, padding: '11px', borderRadius: '7px', border: 'none', cursor: 'pointer', letterSpacing: '1px', WebkitTapHighlightColor: 'transparent' }}>
                + SPARA
              </button>
              <button onClick={resetForm} style={{ background: 'transparent', color: '#4a6870', fontFamily: 'monospace', fontSize: '10px', padding: '11px 12px', borderRadius: '7px', border: '1px solid #1e2d31', cursor: 'pointer' }}>
                Avbryt
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {selectedTrades.length === 0 && !showForm && (
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#4a6870', padding: '20px 0', textAlign: 'center' }}>
            Inga trades — tryck + LOG
          </div>
        )}

        {/* Trade list */}
        {selectedTrades.map((t, i) => {
          const pnlVal     = parseFloat(t.pnl || 0)
          const emotionNum = parseInt(t.emotion || 0)
          const emotionColor = emotionNum <= 3 ? '#00e5b0' : emotionNum >= 7 ? '#ff4f6b' : '#ffc030'
          const journalIdx = journal.findIndex(j => j === t)

          return (
            <div key={i} style={{ background: '#0f1618', border: `1px solid ${RESULT_BORDER[t.result] || '#1e2d31'}`, borderRadius: '10px' }}>
              <div style={{ padding: '11px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8aacb0', background: '#1a2225', border: '1px solid #26383d', borderRadius: '4px', padding: '2px 7px' }}>{t.instrument}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', padding: '2px 7px', borderRadius: '4px', background: RESULT_BG[t.result], color: RESULT_COLOR[t.result], fontWeight: 600 }}>
                    {{ win: 'Win +3R', win2: 'Win +2R', loss: 'Loss −1R', be: 'BE', skip: 'Skip', 'no-setup': 'N/A' }[t.result] || t.result}
                  </span>
                  {t.setup && <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', background: '#1a2225', border: '1px solid #26383d', borderRadius: '4px', padding: '2px 6px' }}>{t.setup}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: pnlVal >= 0 ? '#00e5b0' : '#ff4f6b' }}>
                    {pnlVal >= 0 ? '+' : ''}${Math.abs(pnlVal).toFixed(0)}
                  </span>
                  <button onClick={() => onDeleteTrade && onDeleteTrade(journalIdx)} style={{ background: 'none', border: 'none', color: '#2e4448', cursor: 'pointer', fontSize: '12px', padding: '2px' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ff4f6b'}
                    onMouseLeave={e => e.currentTarget.style.color = '#2e4448'}>✕</button>
                </div>
              </div>

              {/* Emotion bar */}
              {emotionNum > 0 && (
                <div style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #1a2225' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '7px', color: '#4a6870', letterSpacing: '1px', flexShrink: 0 }}>EMOTION</span>
                  <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <div key={n} style={{ flex: 1, height: '4px', borderRadius: '2px', background: n <= emotionNum ? emotionColor : '#1a2225' }} />
                    ))}
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', color: emotionColor, flexShrink: 0 }}>{emotionNum}/10</span>
                </div>
              )}

              {/* Psych tags */}
              {t.psychTags?.length > 0 && (
                <div style={{ padding: '6px 12px 8px', display: 'flex', gap: '4px', flexWrap: 'wrap', borderTop: '1px solid #1a2225' }}>
                  {t.psychTags.map(id => {
                    const tag = PSYCHOLOGY_TAGS.find(p => p.id === id)
                    return tag ? (
                      <span key={id} style={{ fontFamily: 'monospace', fontSize: '9px', color: tag.color, background: tag.bg, border: `1px solid ${tag.color}33`, borderRadius: '4px', padding: '2px 7px' }}>{tag.label}</span>
                    ) : null
                  })}
                </div>
              )}

              {/* Chart image */}
              {t.image && (
                <div style={{ padding: '8px 12px', borderTop: '1px solid #1a2225' }}>
                  <img src={t.image} alt="chart" onClick={() => setLightbox(t.image)} style={{ width: '100%', borderRadius: '8px', border: '1px solid #26383d', display: 'block', cursor: 'zoom-in' }} />
                </div>
              )}

              {/* Note */}
              {t.note && (
                <div style={{ padding: '10px 12px', borderTop: '1px solid #1a2225' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '7px', color: '#4a6870', letterSpacing: '1px', marginBottom: '5px' }}>NOTES</div>
                  <div style={{ fontSize: '12px', color: '#8aacb0', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', borderLeft: '2px solid #26383d', paddingLeft: '10px' }}>
                    {t.note}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Month stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {[
          { label: 'P&L',       value: `${monthPnl >= 0 ? '+' : ''}$${monthPnl.toFixed(0)}`, color: monthPnl >= 0 ? '#00e5b0' : '#ff4f6b' },
          { label: 'WIN RATE',  value: `${monthWr}%`,   color: '#00e5b0' },
          { label: 'WINS',      value: monthWins,        color: '#00e5b0' },
          { label: 'LOSSES',    value: monthLosses,      color: '#ff4f6b' },
          { label: 'SKIPS',     value: monthSkips,       color: '#ffc030' },
          { label: 'SNITT/DAG', value: `${avgDayPnl >= 0 ? '+' : ''}$${avgDayPnl.toFixed(0)}`, color: avgDayPnl >= 0 ? '#00e5b0' : '#ff4f6b' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '7px', color: '#4a6870', letterSpacing: '1px', marginBottom: '3px' }}>{s.label}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Month nav ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#e2eeee', letterSpacing: '2px' }}>
          {months[month].toUpperCase()} {year}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={prevMonth} style={{ background: '#1c2426', border: '1px solid #26383d', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', color: '#8aacb0', fontFamily: 'monospace', fontSize: '13px', WebkitTapHighlightColor: 'transparent' }}>‹</button>
          <button onClick={nextMonth} style={{ background: '#1c2426', border: '1px solid #26383d', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', color: '#8aacb0', fontFamily: 'monospace', fontSize: '13px', WebkitTapHighlightColor: 'transparent' }}>›</button>
        </div>
      </div>

      {/* ── Calendar + panel ── */}
      <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: '14px', alignItems: 'flex-start' }}>

        {/* Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(7, 1fr)' : 'repeat(7, 1fr) 70px', background: '#101415', borderBottom: '1px solid #1e2d31' }}>
              {dayLabels.map((d, i) => (
                <div key={i} style={{ fontFamily: 'monospace', fontSize: '8px', color: i < 5 ? '#4a6870' : '#2e4448', textAlign: 'center', padding: mobile ? '8px 2px' : '10px 4px', letterSpacing: '1px' }}>{d}</div>
              ))}
              {!mobile && <div style={{ fontFamily: 'monospace', fontSize: '7px', color: '#2e4448', textAlign: 'center', padding: '10px 4px', letterSpacing: '1px', borderLeft: '1px solid #1e2d31' }}>VECKA</div>}
            </div>

            {weeks.map((week, wi) => {
              const weekDates  = week.filter(c => c.dateStr).map(c => c.dateStr)
              const weekTrades = journal.filter(t => weekDates.includes(t.date) && t.result !== 'skip' && t.result !== 'no-setup')
              const weekPnl    = weekTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0)
              const weekWins   = weekTrades.filter(t => t.result === 'win' || t.result === 'win2').length
              const weekWr     = weekTrades.length > 0 ? Math.round(weekWins / weekTrades.length * 100) : null

              return (
                <div key={wi} style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(7, 1fr)' : 'repeat(7, 1fr) 70px' }}>
                  {week.map((cell, ci) => {
                    if (cell.empty) return <div key={ci} style={{ minHeight: cellHeight, borderRight: '1px solid #1a2225', borderBottom: '1px solid #1a2225', background: '#0d1112' }} />
                    const { day, dateStr } = cell
                    const dayTrades  = journal.filter(t => t.date === dateStr)
                    const activeTrades = dayTrades.filter(t => t.result !== 'skip' && t.result !== 'no-setup')
                    const isToday    = dateStr === today
                    const isSelected = dateStr === selectedDay
                    const isWeekend  = ci >= 5
                    const status     = getDayStatus(dateStr)
                    const dayPnl     = activeTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0)
                    const sc         = status ? getDayBg(status, dayPnl) : null

                    return (
                      <div key={ci}
                        onClick={() => { setSelectedDay(isSelected ? null : dateStr); resetForm() }}
                        style={{
                          minHeight: cellHeight,
                          borderRight: '1px solid #1a2225',
                          borderBottom: '1px solid #1a2225',
                          padding: mobile ? '5px 4px' : '9px',
                          background: isSelected ? (sc?.bg || '#1a2226') : sc?.bg || (isToday ? 'rgba(0,229,176,0.04)' : 'transparent'),
                          outline: isSelected ? `2px solid ${sc?.border || '#26383d'}` : 'none',
                          outlineOffset: '-2px',
                          cursor: 'pointer',
                          position: 'relative',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {isToday && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#007d5e' }} />}
                        <div style={{ fontFamily: 'monospace', fontSize: mobile ? '9px' : '11px', color: isToday ? '#00e5b0' : isWeekend ? '#2e4448' : '#8aacb0', fontWeight: isToday ? 700 : 400, marginBottom: mobile ? '2px' : '5px' }}>{day}</div>

                        {/* Desktop: trade pills */}
                        {!mobile && activeTrades.map((t, ti) => (
                          <div key={ti} style={{ fontFamily: 'monospace', fontSize: '8px', padding: '2px 4px', borderRadius: '3px', background: RESULT_BG[t.result], color: RESULT_COLOR[t.result], display: 'inline-block', marginBottom: '2px', marginRight: '2px' }}>
                            {{ win: 'W3R', win2: 'W2R', loss: '-1R', be: 'BE', skip: 'Skip', 'no-setup': 'N/A' }[t.result] || t.result}
                          </div>
                        ))}

                        {/* Mobile: colored dot */}
                        {mobile && status && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: sc?.dot }} />}

                        {/* P&L */}
                        {activeTrades.length > 0 && (
                          <div style={{ fontFamily: 'monospace', fontSize: mobile ? '8px' : '10px', fontWeight: 700, color: dayPnl >= 0 ? '#00e5b0' : '#ff4f6b', marginTop: mobile ? '1px' : '3px' }}>
                            {dayPnl >= 0 ? '+' : ''}${Math.abs(dayPnl).toFixed(0)}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Desktop week summary */}
                  {!mobile && (
                    <div style={{ minHeight: cellHeight, borderBottom: '1px solid #1a2225', borderLeft: '1px solid #1e2d31', padding: '8px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '2px', background: '#0f1618' }}>
                      {weekTrades.length > 0 ? (
                        <>
                          <div style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, color: weekPnl >= 0 ? '#00e5b0' : '#ff4f6b' }}>{weekPnl >= 0 ? '+' : ''}${Math.abs(weekPnl).toFixed(0)}</div>
                          {weekWr !== null && <div style={{ fontFamily: 'monospace', fontSize: '8px', color: weekWr >= 50 ? '#00e5b0' : '#ff4f6b' }}>{weekWr}%</div>}
                          <div style={{ fontFamily: 'monospace', fontSize: '7px', color: '#4a6870' }}>{weekTrades.length}t</div>
                        </>
                      ) : <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#1e2d31' }}>—</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Desktop: side panel */}
        {!mobile && selectedDay && (
          <div style={{ width: '460px', flexShrink: 0, background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '12px', overflow: 'hidden', maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <TradePanel />
          </div>
        )}
      </div>

      {/* Mobile: inline panel below calendar */}
      {mobile && selectedDay && (
        <div style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '12px', overflow: 'hidden', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
          <TradePanel />
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: '16px' }}>
          <img src={lightbox} alt="chart" style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: '10px', border: '1px solid #26383d', objectFit: 'contain' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(22,28,30,0.9)', border: '1px solid #26383d', borderRadius: '8px', color: '#e2eeee', cursor: 'pointer', fontSize: '13px', padding: '7px 14px', fontFamily: 'monospace' }}>✕</button>
        </div>
      )}
    </div>
  )
}

export default Calendar