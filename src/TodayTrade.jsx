import { useState, useEffect } from 'react'

const M = "'JetBrains Mono', monospace"

const PSYCH = [
  { id: 'patient',   label: 'Tålmodig',    c: '#00e5b0', bg: '#001810' },
  { id: 'aplus',     label: 'A+ Setup',    c: '#00e5b0', bg: '#001810' },
  { id: 'setforget', label: 'Set & Forget',c: '#00e5b0', bg: '#001810' },
  { id: 'managed',   label: 'Hanterat bra',c: '#00e5b0', bg: '#001810' },
  { id: 'fomo',      label: 'FOMO',        c: '#ff4f6b', bg: '#1a0610' },
  { id: 'revenge',   label: 'Hämndtrade',  c: '#ff4f6b', bg: '#1a0610' },
  { id: 'forced',    label: 'Forcerat',    c: '#ffc030', bg: '#1a1000' },
  { id: 'oversize',  label: 'Överposad',   c: '#ff4f6b', bg: '#1a0610' },
]

const RC = { win:'#00e5b0', win2:'#00e5b0', tp1:'#4ab89a', tp2:'#00e5b0', tp3:'#00e5b0', loss:'#ff4f6b', be:'#6a8a90', skip:'#5a7a84', 'no-setup':'#5a7a84' }
const RB = { win:'#001810', win2:'#001810', tp1:'#001410', tp2:'#001810', tp3:'#001a14', loss:'#1a0610', be:'#111820', skip:'#111820', 'no-setup':'#111820' }
const RL = { win:'Win +3R', win2:'Win +2R', tp1:'TP1', tp2:'TP2', tp3:'TP3', loss:'Loss −1R', be:'Break Even', skip:'Skip', 'no-setup':'No Setup' }
const BIAS = [
  { v:'bullish', label:'▲ Bull', c:'#00e5b0', bg:'#001810', bdr:'rgba(0,229,176,0.25)' },
  { v:'bearish', label:'▼ Bear', c:'#ff4f6b', bg:'#1a0610', bdr:'rgba(255,79,107,0.25)' },
  { v:'neutral', label:'◆ Neu',  c:'#6a8a90', bg:'#111820', bdr:'rgba(106,138,144,0.2)' },
]

const inp = { width:'100%', background:'#0a0e10', border:'1px solid #263840', borderRadius:'8px', color:'#d0e8ec', fontSize:'15px', padding:'10px 12px', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }
const lbl = { fontFamily:M, fontSize:'8px', color:'#5a7a84', letterSpacing:'2px', marginBottom:'5px', display:'block' }

const RESULTS = [
  { v:"tp1",       label:"TP1",       c:"#4ab89a", bg:"#001410" },
  { v:"tp2",       label:"TP2",       c:"#00e5b0", bg:"#001810" },
  { v:"tp3",       label:"TP3",       c:"#00e5b0", bg:"#001a14" },
  { v:"loss",      label:"Loss -1R",  c:"#ff4f6b", bg:"#1a0610" },
  { v:"be",        label:"Break Even",c:"#6a8a90", bg:"#111820" },
  { v:"skip",      label:"Skip",      c:"#5a7a84", bg:"#111820" },
  { v:"no-setup",  label:"No Setup",  c:"#3a5460", bg:"#0d1214" },
]

function TradeForm({ initial = {}, onSave, onCancel }) {
  const [result,     setResult]     = useState(initial.result     || '')
  const [instrument, setInstrument] = useState(initial.instrument || 'MYM')
  const [pnl,        setPnl]        = useState(initial.pnl        || '')
  const [note,       setNote]       = useState(initial.note       || '')
  const [emotion,    setEmotion]    = useState(initial.emotion     || '3')
  const [setup,      setSetup]      = useState(initial.setup      || '')
  const [psychTags,  setPsychTags]  = useState(initial.psychTags  || [])

  function toggleTag(id) { setPsychTags(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]) }

  function save() {
    if (!result) return
    onSave({ result, instrument, pnl: pnl || '0', note, emotion, setup, psychTags })
  }

  return (
    <div style={{ background:'#0a0e10', border:'1px solid #263840', borderRadius:'10px', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
            <div>
        <span style={lbl}>OUTCOME</span>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
          {RESULTS.map(r => (
            <button key={r.v} onClick={() => setResult(r.v)} style={{
              fontFamily:M, fontSize:'10px', padding:'7px 11px', borderRadius:'6px',
              background: result===r.v ? r.bg : '#0d1214',
              border: `1px solid ${result===r.v ? r.c+'55' : '#263840'}`,
              color: result===r.v ? r.c : '#5a7a84',
              cursor:'pointer', transition:'all 0.15s',
              WebkitTapHighlightColor:'transparent',
            }}>{r.label}</button>
          ))}
        </div>
      </div>
      <div>
        <span style={lbl}>INSTRUMENT</span>
        <input value={instrument} onChange={e => setInstrument(e.target.value)} style={inp}
          onFocus={e=>e.target.style.borderColor='#3a5460'} onBlur={e=>e.target.style.borderColor='#263840'} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
        <div>
          <span style={lbl}>P&L ($)</span>
          <input type="number" inputMode="decimal" value={pnl} onChange={e => setPnl(e.target.value)} placeholder="450" style={inp}
            onFocus={e=>e.target.style.borderColor='#3a5460'} onBlur={e=>e.target.style.borderColor='#263840'} />
        </div>
        <div>
          <span style={lbl}>SETUP</span>
          <input value={setup} onChange={e => setSetup(e.target.value)} placeholder="BTB" style={inp}
            onFocus={e=>e.target.style.borderColor='#3a5460'} onBlur={e=>e.target.style.borderColor='#263840'} />
        </div>
      </div>
      <div>
        <span style={lbl}>EMOTION — <span style={{ color:parseInt(emotion)<=3?'#00e5b0':parseInt(emotion)>=7?'#ff4f6b':'#ffc030', fontWeight:600 }}>{parseInt(emotion)<=3?'Lugn ✓':parseInt(emotion)>=7?'Stressad ✗':'Neutral'}</span></span>
        <div style={{ display:'flex', gap:'3px' }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n} onClick={() => setEmotion(String(n))} style={{
              flex:1, padding:'8px 0', borderRadius:'5px',
              border:`1px solid ${emotion===String(n)?'#007d5e':'#263840'}`,
              background:emotion===String(n)?'#001810':'#161e24',
              color:emotion===String(n)?'#00e5b0':'#5a7a84',
              fontFamily:M, fontSize:'11px', cursor:'pointer', transition:'all 0.15s',
            }}>{n}</button>
          ))}
        </div>
      </div>
      <div>
        <span style={lbl}>PSYKOLOGI</span>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
          {PSYCH.map(tag => {
            const a = psychTags.includes(tag.id)
            return (
              <button key={tag.id} onClick={() => toggleTag(tag.id)} style={{
                fontFamily:M, fontSize:'9px', padding:'5px 10px', borderRadius:'5px',
                background:a?tag.bg:'#161e24', border:`1px solid ${a?tag.c+'33':'#1e2c32'}`,
                color:a?tag.c:'#5a7a84', cursor:'pointer', transition:'all 0.15s',
              }}>{tag.label}</button>
            )
          })}
        </div>
      </div>
      <div>
        <span style={lbl}>NOTES</span>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Analys, tankar..."
          style={{...inp, resize:'vertical', minHeight:'70px', lineHeight:1.6}}
          onFocus={e=>e.target.style.borderColor='#3a5460'} onBlur={e=>e.target.style.borderColor='#263840'} />
      </div>
      <div style={{ display:'flex', gap:'8px' }}>
        <button onClick={save} style={{ flex:1, background:'#00e5b0', color:'#020f08', fontFamily:M, fontSize:'11px', fontWeight:700, padding:'12px', borderRadius:'8px', border:'none', cursor:'pointer', letterSpacing:'1px', transition:'background 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='#00c49a'}
          onMouseLeave={e=>e.currentTarget.style.background='#00e5b0'}>SPARA</button>
        <button onClick={onCancel} style={{ background:'transparent', color:'#5a7a84', fontFamily:M, fontSize:'10px', padding:'12px 14px', borderRadius:'8px', border:'1px solid #1e2c32', cursor:'pointer', transition:'all 0.15s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#3a5460';e.currentTarget.style.color='#8aacb4'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e2c32';e.currentTarget.style.color='#5a7a84'}}>Avbryt</button>
      </div>
    </div>
  )
}

export default function TodayTrade({ journal=[], onAddTrade, onEditTrade, streakLogs={}, biasLogs={}, onSaveBias }) {
  const [showForm, setShowForm]   = useState(false)
  const [expanded, setExpanded]   = useState(null)
  const [editing,  setEditing]    = useState(null)
  const [now, setNow]             = useState(new Date())

  const today = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])

  const nyNow  = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const nyMins = nyNow.getHours() * 60 + nyNow.getMinutes()
  const isOpen = nyMins >= 570 && nyMins < 960
  const isPre  = nyMins < 570
  const minsTo = isPre ? 570 - nyMins : isOpen ? 960 - nyMins : null
  const timerStr = minsTo != null
    ? `${String(Math.floor(minsTo/60)).padStart(2,'0')}:${String(minsTo%60).padStart(2,'0')}:${String(now.getSeconds()>0?60-now.getSeconds():0).padStart(2,'0')}`
    : null

  const todayTrades = journal.filter(t => t.date === today)
  const todayBias   = biasLogs[today] || null
  const curBias     = BIAS.find(b => b.v === todayBias)

  const trades   = journal.filter(t => t.result !== 'skip' && t.result !== 'no-setup')
  const wins     = trades.filter(t => t.result === 'win' || t.result === 'win2').length
  const winRate  = trades.length > 0 ? Math.round(wins / trades.length * 100) : 0
  const totalPnl = trades.reduce((s, t) => s + parseFloat(t.pnl||0), 0)

  const isWd = d => { const wd=new Date(d+'T12:00:00').getDay(); return wd>=1&&wd<=5 }
  const logDates = Object.keys(streakLogs).filter(isWd).sort((a,b) => b.localeCompare(a))
  let streak = 0
  for (const d of logDates) { if (streakLogs[d]==='violation') break; if (streakLogs[d]==='clean') streak++ }

  const ws = new Date(now); ws.setDate(now.getDate()-((now.getDay()+6)%7)); ws.setHours(0,0,0,0)
  const weekPnl  = trades.filter(t => new Date(t.date)>=ws).reduce((s,t) => s+parseFloat(t.pnl||0), 0)
  const todayPnl = todayTrades.filter(t => t.result!=='skip'&&t.result!=='no-setup').reduce((s,t) => s+parseFloat(t.pnl||0), 0)

  function card(label, value, color, sub) {
    return (
      <div style={{ background:'#111820', border:'1px solid #1e2c32', borderRadius:'12px', padding:'14px 16px' }}>
        <div style={{ fontFamily:M, fontSize:'8px', color:'#5a7a84', letterSpacing:'2px', marginBottom:'6px' }}>{label}</div>
        <div style={{ fontFamily:M, fontSize:'24px', fontWeight:700, color, lineHeight:1 }}>{value}</div>
        {sub && <div style={{ fontFamily:M, fontSize:'9px', color:'#5a7a84', marginTop:'4px' }}>{sub}</div>}
      </div>
    )
  }

  function handleEdit(i, updated) {
    const ji = journal.findIndex(j => j === todayTrades[i])
    onEditTrade?.(ji, updated)
    setEditing(null)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:'8px' }}>
        {card('WIN RATE',    `${winRate}%`,                                      '#00e5b0', `${trades.length} trades`)}
        {card('TOTALT P&L',  `${totalPnl>=0?'+':''}$${Math.round(totalPnl)}`,   totalPnl>=0?'#00e5b0':'#ff4f6b')}
        {card('DENNA VECKA', `${weekPnl>=0?'+':''}$${Math.round(weekPnl)}`,     weekPnl>=0?'#00e5b0':'#ff4f6b')}
        {card('STREAK',      `${streak}d`,                                       streak>=5?'#00e5b0':streak>=2?'#ffc030':'#5a7a84')}
      </div>

      {/* Bias */}
      <div style={{ background:'#111820', border:`1px solid ${curBias?curBias.bdr:'#1e2c32'}`, borderRadius:'12px', padding:'12px 14px', transition:'border-color 0.2s' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'9px' }}>
          <span style={{ fontFamily:M, fontSize:'8px', color:'#5a7a84', letterSpacing:'2px' }}>DAGLIG BIAS</span>
          {curBias && <span style={{ fontFamily:M, fontSize:'11px', fontWeight:600, color:curBias.c }}>{curBias.label}</span>}
        </div>
        <div style={{ display:'flex', gap:'6px' }}>
          {BIAS.map(b => (
            <button key={b.v} onClick={() => onSaveBias?.(today, todayBias===b.v?null:b.v)} style={{
              flex:1, minHeight:'36px', background:todayBias===b.v?b.bg:'#0d1214',
              border:`1px solid ${todayBias===b.v?b.bdr:'#1e2c32'}`,
              borderRadius:'8px', color:todayBias===b.v?b.c:'#5a7a84',
              fontFamily:M, fontSize:'11px', cursor:'pointer', transition:'all 0.15s',
            }}>{b.label}</button>
          ))}
        </div>
      </div>

      {/* Today's trades */}
      <div style={{ background:'#111820', border:'1px solid #1e2c32', borderRadius:'12px', padding:'14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:todayTrades.length>0||showForm?'12px':'0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontFamily:M, fontSize:'8px', color:'#5a7a84', letterSpacing:'2px', marginBottom:'2px' }}>DAGENS TRADES</div>
              <div style={{ fontSize:'11px', color:'#5a7a84' }}>{new Date().toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'})}</div>
            </div>
            {timerStr && (
              <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'#0d1214', border:`1px solid ${isOpen?'rgba(0,229,176,0.2)':'#1e2c32'}`, borderRadius:'6px', padding:'4px 9px' }}>
                <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:isOpen?'#00e5b0':'#ffc030' }} />
                <span style={{ fontFamily:M, fontSize:'8px', color:isOpen?'#00e5b0':'#ffc030' }}>{isOpen?'STÄNGER':'ÖPPNAR'} {timerStr}</span>
              </div>
            )}
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            background:'#00e5b0', color:'#020f08', fontFamily:M, fontSize:'10px', fontWeight:700,
            padding:'8px 14px', borderRadius:'8px', border:'none', cursor:'pointer', letterSpacing:'1px',
            flexShrink:0, transition:'background 0.15s',
          }}
            onMouseEnter={e=>e.currentTarget.style.background='#00c49a'}
            onMouseLeave={e=>e.currentTarget.style.background='#00e5b0'}
          >+ LOG</button>
        </div>

        {todayTrades.length===0 && !showForm && (
          <div style={{ fontFamily:M, fontSize:'11px', color:'#2e4450' }}>Inga trades loggade idag</div>
        )}

        {todayTrades.map((t, i) => {
          const pv  = parseFloat(t.pnl||0)
          const em  = parseInt(t.emotion||0)
          const ec  = em<=3?'#00e5b0':em>=7?'#ff4f6b':'#ffc030'
          const isEx = expanded===i
          const isEd = editing===i
          const bdr  = t.result==='win'||t.result==='win2'?'rgba(0,229,176,0.18)':t.result==='loss'?'rgba(255,79,107,0.18)':'#1e2c32'
          const ji   = journal.findIndex(j => j === t)

          return (
            <div key={i} style={{ marginBottom:'6px', background:'#0d1214', border:`1px solid ${bdr}`, borderRadius:'9px', overflow:'hidden', transition:'border-color 0.15s' }}>
              {/* Summary row */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px' }}>
                <div onClick={() => { setExpanded(isEx?null:i); setEditing(null) }} style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap', cursor:'pointer', flex:1 }}>
                  <span style={{ fontFamily:M, fontSize:'9px', color:'#6a8a92', background:'#161e24', border:'1px solid #1e2c32', borderRadius:'4px', padding:'2px 7px' }}>{t.instrument}</span>
                  <span style={{ fontFamily:M, fontSize:'9px', padding:'2px 8px', borderRadius:'4px', background:RB[t.result]||'#111', color:RC[t.result]||'#6a8a90', fontWeight:600 }}>{RL[t.result]||t.result}</span>
                  {t.setup && <span style={{ fontFamily:M, fontSize:'8px', color:'#5a7a84', background:'#161e24', border:'1px solid #1e2c32', borderRadius:'4px', padding:'2px 6px' }}>{t.setup}</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontFamily:M, fontSize:'15px', fontWeight:700, color:pv>=0?'#00e5b0':'#ff4f6b' }}>{pv>=0?'+':''}${Math.abs(Math.round(pv))}</span>
                  {/* Edit button */}
                  <button onClick={() => { setEditing(isEd?null:i); setExpanded(null) }} style={{ background:isEd?'#263840':'none', border:`1px solid ${isEd?'#3a5460':'#1e2c32'}`, borderRadius:'5px', color:isEd?'#d0e8ec':'#5a7a84', fontFamily:M, fontSize:'8px', padding:'3px 8px', cursor:'pointer', transition:'all 0.15s', letterSpacing:'0.5px' }}>✎</button>
                  <span onClick={() => { setExpanded(isEx?null:i); setEditing(null) }} style={{ color:'#3a5460', fontSize:'9px', cursor:'pointer', transition:'transform 0.2s', display:'inline-block', transform:isEx?'rotate(180deg)':'none' }}>▼</span>
                </div>
              </div>

              {/* Edit form */}
              {isEd && (
                <div style={{ padding:'0 10px 10px' }}>
                  <TradeForm initial={t} onSave={updated => handleEdit(i, updated)} onCancel={() => setEditing(null)} />
                </div>
              )}

              {/* Expanded details */}
              {isEx && !isEd && (
                <div style={{ borderTop:'1px solid #161e24' }}>
                  {em>0 && (
                    <div style={{ padding:'8px 12px', display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84', letterSpacing:'1px', flexShrink:0 }}>EMOTION</span>
                      <div style={{ display:'flex', gap:'2px', flex:1 }}>
                        {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                          <div key={n} style={{ flex:1, height:'3px', borderRadius:'2px', background:n<=em?ec:'#1e2c32' }} />
                        ))}
                      </div>
                      <span style={{ fontFamily:M, fontSize:'9px', color:ec, flexShrink:0 }}>{em}/10</span>
                    </div>
                  )}
                  {t.psychTags?.length>0 && (
                    <div style={{ padding:'6px 12px 8px', display:'flex', gap:'4px', flexWrap:'wrap' }}>
                      {t.psychTags.map(id => {
                        const tag=PSYCH.find(p=>p.id===id)
                        return tag?<span key={id} style={{ fontFamily:M, fontSize:'8px', color:tag.c, background:tag.bg, border:`1px solid ${tag.c}22`, borderRadius:'4px', padding:'2px 7px' }}>{tag.label}</span>:null
                      })}
                    </div>
                  )}
                  {t.note && (
                    <div style={{ padding:'8px 12px', borderTop:'1px solid #161e24' }}>
                      <div style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84', letterSpacing:'1px', marginBottom:'5px' }}>NOTES</div>
                      <div style={{ fontSize:'12px', color:'#6a8a92', lineHeight:1.7, whiteSpace:'pre-wrap', wordBreak:'break-word', borderLeft:'2px solid #1e2c32', paddingLeft:'10px' }}>{t.note}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {todayTrades.filter(t=>t.result!=='skip'&&t.result!=='no-setup').length>0 && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'6px', gap:'4px' }}>
            <span style={{ fontFamily:M, fontSize:'10px', color:'#5a7a84' }}>Idag:</span>
            <span style={{ fontFamily:M, fontSize:'10px', fontWeight:700, color:todayPnl>=0?'#00e5b0':'#ff4f6b' }}>{todayPnl>=0?'+':''}${Math.round(todayPnl)}</span>
          </div>
        )}

        {/* New trade form */}
        {showForm && (
          <div style={{ marginTop:'12px' }}>
            <TradeForm
              onSave={trade => { onAddTrade({ date:today, ...trade, timestamp:new Date().toISOString() }); setShowForm(false) }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}