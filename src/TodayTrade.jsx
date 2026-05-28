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

const RC = { win:'#00e5b0', win2:'#00e5b0', loss:'#ff4f6b', be:'#6a8a90', skip:'#ffc030', 'no-setup':'#2a3c42' }
const RB = { win:'#001810', win2:'#001810', loss:'#1a0610', be:'#111820', skip:'#1a1000', 'no-setup':'#0d1214' }
const RL = { win:'Win +3R', win2:'Win +2R', loss:'Loss −1R', be:'Break Even', skip:'Skip', 'no-setup':'No Setup' }
const BIAS = [
  { v:'bullish', label:'▲ Bull', c:'#00e5b0', bg:'#001810', bdr:'rgba(0,229,176,0.25)' },
  { v:'bearish', label:'▼ Bear', c:'#ff4f6b', bg:'#1a0610', bdr:'rgba(255,79,107,0.25)' },
  { v:'neutral', label:'◆ Neu',  c:'#6a8a90', bg:'#111820', bdr:'rgba(106,138,144,0.2)' },
]

const inp = { width:'100%', background:'#0a0e10', border:'1px solid #1e2c32', borderRadius:'8px', color:'#d0e8ec', fontSize:'15px', padding:'10px 12px', outline:'none', boxSizing:'border-box', fontFamily:"'Inter', sans-serif", transition:'border-color 0.15s' }
const lbl = { fontFamily:M, fontSize:'8px', color:'#2a3c42', letterSpacing:'2px', marginBottom:'5px', display:'block' }

export default function TodayTrade({ journal=[], onAddTrade, streakLogs={}, biasLogs={}, onSaveBias }) {
  const [showForm, setShowForm]     = useState(false)
  const [result, setResult]         = useState('')
  const [instrument, setInstrument] = useState('MYM')
  const [pnl, setPnl]               = useState('')
  const [note, setNote]             = useState('')
  const [emotion, setEmotion]       = useState('3')
  const [setup, setSetup]           = useState('')
  const [psychTags, setPsychTags]   = useState([])
  const [expanded, setExpanded]     = useState(null)
  const [now, setNow]               = useState(new Date())

  const today = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])

  const nyNow     = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const nyMins    = nyNow.getHours() * 60 + nyNow.getMinutes()
  const isOpen    = nyMins >= 570 && nyMins < 960
  const isPre     = nyMins < 570
  const minsTo    = isPre ? 570 - nyMins : isOpen ? 960 - nyMins : null
  const timerStr  = minsTo != null
    ? `${String(Math.floor(minsTo/60)).padStart(2,'0')}:${String(minsTo%60).padStart(2,'0')}:${String(now.getSeconds()>0?60-now.getSeconds():0).padStart(2,'0')}`
    : null

  const todayTrades = journal.filter(t => t.date === today)
  const todayBias   = biasLogs[today] || null
  const curBias     = BIAS.find(b => b.v === todayBias)

  const trades   = journal.filter(t => t.result !== 'skip' && t.result !== 'no-setup')
  const wins     = trades.filter(t => t.result === 'win' || t.result === 'win2').length
  const winRate  = trades.length > 0 ? Math.round(wins / trades.length * 100) : 0
  const totalPnl = trades.reduce((s, t) => s + parseFloat(t.pnl||0), 0)

  const isWd = d => { const wd = new Date(d+'T12:00:00').getDay(); return wd>=1&&wd<=5 }
  const logDates = Object.keys(streakLogs).filter(isWd).sort((a,b)=>b.localeCompare(a))
  let streak = 0
  for (const d of logDates) { if (streakLogs[d]==='violation') break; if (streakLogs[d]==='clean') streak++ }

  const ws = new Date(now); ws.setDate(now.getDate()-((now.getDay()+6)%7)); ws.setHours(0,0,0,0)
  const weekPnl = trades.filter(t=>new Date(t.date)>=ws).reduce((s,t)=>s+parseFloat(t.pnl||0),0)
  const todayPnl = todayTrades.filter(t=>t.result!=='skip'&&t.result!=='no-setup').reduce((s,t)=>s+parseFloat(t.pnl||0),0)

  function toggleTag(id) { setPsychTags(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]) }

  function save() {
    if (!result) return
    onAddTrade({ date:today, result, instrument, pnl:pnl||'0', note, emotion, setup, psychTags, timestamp:new Date().toISOString() })
    setResult(''); setPnl(''); setNote(''); setEmotion('3'); setSetup(''); setPsychTags([]); setShowForm(false)
  }

  const card = (label, value, color, sub) => (
    <div style={{ background:'#0d1214', border:'1px solid #182025', borderRadius:'12px', padding:'14px 16px', transition:'border-color 0.15s' }}>
      <div style={{ fontFamily:M, fontSize:'8px', color:'#2a3c42', letterSpacing:'2px', marginBottom:'6px' }}>{label}</div>
      <div style={{ fontFamily:M, fontSize:'24px', fontWeight:700, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontFamily:M, fontSize:'9px', color:'#2a3c42', marginTop:'4px' }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
        {card('WIN RATE',    `${winRate}%`,                                        '#00e5b0', `${trades.length} trades`)}
        {card('TOTALT P&L',  `${totalPnl>=0?'+':''}$${Math.round(totalPnl)}`,     totalPnl>=0?'#00e5b0':'#ff4f6b')}
        {card('DENNA VECKA', `${weekPnl>=0?'+':''}$${Math.round(weekPnl)}`,       weekPnl>=0?'#00e5b0':'#ff4f6b')}
        {card('STREAK',      `${streak}d`,                                         streak>=5?'#00e5b0':streak>=2?'#ffc030':'#2a3c42')}
      </div>

      <div style={{ background:'#0d1214', border:`1px solid ${curBias?curBias.bdr:'#182025'}`, borderRadius:'12px', padding:'12px 14px', transition:'border-color 0.2s' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'9px' }}>
          <span style={{ fontFamily:M, fontSize:'8px', color:'#2a3c42', letterSpacing:'2px' }}>DAGLIG BIAS</span>
          {curBias && <span style={{ fontFamily:M, fontSize:'11px', fontWeight:600, color:curBias.c }}>{curBias.label}</span>}
        </div>
        <div style={{ display:'flex', gap:'6px' }}>
          {BIAS.map(b => (
            <button key={b.v} onClick={() => onSaveBias?.(today, todayBias===b.v?null:b.v)} style={{
              flex:1, minHeight:'36px', background: todayBias===b.v?b.bg:'#080b0c',
              border:`1px solid ${todayBias===b.v?b.bdr:'#182025'}`,
              borderRadius:'8px', color:todayBias===b.v?b.c:'#2a3c42',
              fontFamily:M, fontSize:'11px', cursor:'pointer',
              transition:'all 0.15s ease',
            }}>{b.label}</button>
          ))}
        </div>
      </div>

      <div style={{ background:'#0d1214', border:'1px solid #182025', borderRadius:'12px', padding:'14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: todayTrades.length>0||showForm?'12px':'0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontFamily:M, fontSize:'8px', color:'#2a3c42', letterSpacing:'2px', marginBottom:'2px' }}>DAGENS TRADES</div>
              <div style={{ fontSize:'11px', color:'#3a5460' }}>{new Date().toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'})}</div>
            </div>
            {timerStr && (
              <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'#080b0c', border:`1px solid ${isOpen?'rgba(0,229,176,0.2)':'#182025'}`, borderRadius:'6px', padding:'4px 9px' }}>
                <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:isOpen?'#00e5b0':'#ffc030' }} />
                <span style={{ fontFamily:M, fontSize:'8px', color:isOpen?'#00e5b0':'#ffc030', letterSpacing:'0.5px' }}>
                  {isOpen?'STÄNGER':'ÖPPNAR'} {timerStr}
                </span>
              </div>
            )}
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            background:'#00e5b0', color:'#020f08', fontFamily:M, fontSize:'10px', fontWeight:700,
            padding:'8px 14px', borderRadius:'8px', border:'none', cursor:'pointer', letterSpacing:'1px',
            flexShrink:0, transition:'background 0.15s, transform 0.1s',
          }}
            onMouseEnter={e=>e.currentTarget.style.background='#00c49a'}
            onMouseLeave={e=>e.currentTarget.style.background='#00e5b0'}
            onMouseDown={e=>e.currentTarget.style.transform='scale(0.97)'}
            onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
          >+ LOG</button>
        </div>

        {todayTrades.length===0 && !showForm && (
          <div style={{ fontFamily:M, fontSize:'11px', color:'#1e2c32', paddingTop:'2px' }}>Inga trades loggade idag</div>
        )}

        {todayTrades.map((t, i) => {
          const pv  = parseFloat(t.pnl||0)
          const em  = parseInt(t.emotion||0)
          const ec  = em<=3?'#00e5b0':em>=7?'#ff4f6b':'#ffc030'
          const isEx = expanded===i
          const bdr  = t.result==='win'||t.result==='win2' ? 'rgba(0,229,176,0.18)' : t.result==='loss' ? 'rgba(255,79,107,0.18)' : '#182025'

          return (
            <div key={i} style={{ marginBottom:'6px', background:'#080b0c', border:`1px solid ${bdr}`, borderRadius:'9px', overflow:'hidden', transition:'border-color 0.15s' }}>
              <div onClick={() => setExpanded(isEx?null:i)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', cursor:'pointer' }}>
                <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ fontFamily:M, fontSize:'9px', color:'#3a5460', background:'#0d1214', border:'1px solid #182025', borderRadius:'4px', padding:'2px 7px' }}>{t.instrument}</span>
                  <span style={{ fontFamily:M, fontSize:'9px', padding:'2px 8px', borderRadius:'4px', background:RB[t.result]||'#111', color:RC[t.result]||'#6a8a90', fontWeight:600 }}>{RL[t.result]||t.result}</span>
                  {t.setup && <span style={{ fontFamily:M, fontSize:'8px', color:'#3a5460', background:'#0d1214', border:'1px solid #182025', borderRadius:'4px', padding:'2px 6px' }}>{t.setup}</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontFamily:M, fontSize:'15px', fontWeight:700, color:pv>=0?'#00e5b0':'#ff4f6b' }}>{pv>=0?'+':''}${Math.abs(Math.round(pv))}</span>
                  <span style={{ color:'#1e2c32', fontSize:'9px', transition:'transform 0.2s', display:'inline-block', transform:isEx?'rotate(180deg)':'none' }}>▼</span>
                </div>
              </div>
              {isEx && (
                <div style={{ borderTop:'1px solid #12191c' }}>
                  {em>0 && (
                    <div style={{ padding:'8px 12px', display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontFamily:M, fontSize:'7px', color:'#2a3c42', letterSpacing:'1px', flexShrink:0 }}>EMOTION</span>
                      <div style={{ display:'flex', gap:'2px', flex:1 }}>
                        {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                          <div key={n} style={{ flex:1, height:'3px', borderRadius:'2px', background:n<=em?ec:'#182025', transition:'background 0.2s' }} />
                        ))}
                      </div>
                      <span style={{ fontFamily:M, fontSize:'9px', color:ec, flexShrink:0 }}>{em}/10</span>
                    </div>
                  )}
                  {t.psychTags?.length>0 && (
                    <div style={{ padding:'6px 12px 8px', display:'flex', gap:'4px', flexWrap:'wrap' }}>
                      {t.psychTags.map(id => {
                        const tag = PSYCH.find(p=>p.id===id)
                        return tag ? <span key={id} style={{ fontFamily:M, fontSize:'8px', color:tag.c, background:tag.bg, border:`1px solid ${tag.c}22`, borderRadius:'4px', padding:'2px 7px' }}>{tag.label}</span> : null
                      })}
                    </div>
                  )}
                  {t.note && (
                    <div style={{ padding:'8px 12px', borderTop:'1px solid #12191c' }}>
                      <div style={{ fontFamily:M, fontSize:'7px', color:'#2a3c42', letterSpacing:'1px', marginBottom:'5px' }}>NOTES</div>
                      <div style={{ fontSize:'12px', color:'#5a7a82', lineHeight:1.7, whiteSpace:'pre-wrap', wordBreak:'break-word', borderLeft:'2px solid #182025', paddingLeft:'10px' }}>{t.note}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {todayTrades.filter(t=>t.result!=='skip'&&t.result!=='no-setup').length>0 && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'6px', gap:'4px' }}>
            <span style={{ fontFamily:M, fontSize:'10px', color:'#2a3c42' }}>Idag:</span>
            <span style={{ fontFamily:M, fontSize:'10px', fontWeight:700, color:todayPnl>=0?'#00e5b0':'#ff4f6b' }}>{todayPnl>=0?'+':''}${Math.round(todayPnl)}</span>
          </div>
        )}

        {showForm && (
          <div style={{ background:'#080b0c', border:'1px solid #1e2c32', borderRadius:'10px', padding:'16px', marginTop:'12px', display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              <div>
                <span style={lbl}>OUTCOME</span>
                <select value={result} onChange={e=>setResult(e.target.value)} style={{...inp,fontFamily:M}}>
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
                <span style={lbl}>INSTRUMENT</span>
                <input value={instrument} onChange={e=>setInstrument(e.target.value)} style={inp}
                  onFocus={e=>e.target.style.borderColor='#2e4448'} onBlur={e=>e.target.style.borderColor='#1e2c32'} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              <div>
                <span style={lbl}>P&L ($)</span>
                <input type="number" inputMode="decimal" value={pnl} onChange={e=>setPnl(e.target.value)} placeholder="450" style={inp}
                  onFocus={e=>e.target.style.borderColor='#2e4448'} onBlur={e=>e.target.style.borderColor='#1e2c32'} />
              </div>
              <div>
                <span style={lbl}>SETUP</span>
                <input value={setup} onChange={e=>setSetup(e.target.value)} placeholder="BTB" style={inp}
                  onFocus={e=>e.target.style.borderColor='#2e4448'} onBlur={e=>e.target.style.borderColor='#1e2c32'} />
              </div>
            </div>
            <div>
              <span style={lbl}>EMOTION — <span style={{ color:parseInt(emotion)<=3?'#00e5b0':parseInt(emotion)>=7?'#ff4f6b':'#ffc030', fontWeight:600 }}>{parseInt(emotion)<=3?'Lugn ✓':parseInt(emotion)>=7?'Stressad ✗':'Neutral'}</span></span>
              <div style={{ display:'flex', gap:'3px' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                  <button key={n} onClick={()=>setEmotion(String(n))} style={{
                    flex:1, padding:'8px 0', borderRadius:'5px',
                    border:`1px solid ${emotion===String(n)?'#007d5e':'#1e2c32'}`,
                    background:emotion===String(n)?'#001810':'#0d1214',
                    color:emotion===String(n)?'#00e5b0':'#3a5460',
                    fontFamily:M, fontSize:'11px', cursor:'pointer',
                    transition:'all 0.15s',
                  }}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <span style={lbl}>PSYKOLOGI</span>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {PSYCH.map(tag=>{
                  const a=psychTags.includes(tag.id)
                  return <button key={tag.id} onClick={()=>toggleTag(tag.id)} style={{
                    fontFamily:M, fontSize:'9px', padding:'5px 10px', borderRadius:'5px',
                    background:a?tag.bg:'#0d1214', border:`1px solid ${a?tag.c+'33':'#182025'}`,
                    color:a?tag.c:'#3a5460', cursor:'pointer', transition:'all 0.15s',
                  }}>{tag.label}</button>
                })}
              </div>
            </div>
            <div>
              <span style={lbl}>NOTES</span>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Analys, tankar..."
                style={{...inp, resize:'vertical', minHeight:'70px', lineHeight:1.6}}
                onFocus={e=>e.target.style.borderColor='#2e4448'} onBlur={e=>e.target.style.borderColor='#1e2c32'} />
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={save} style={{ flex:1, background:'#00e5b0', color:'#020f08', fontFamily:M, fontSize:'11px', fontWeight:700, padding:'12px', borderRadius:'8px', border:'none', cursor:'pointer', letterSpacing:'1px', transition:'background 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='#00c49a'}
                onMouseLeave={e=>e.currentTarget.style.background='#00e5b0'}>+ SPARA TRADE</button>
              <button onClick={()=>setShowForm(false)} style={{ background:'transparent', color:'#3a5460', fontFamily:M, fontSize:'10px', padding:'12px 14px', borderRadius:'8px', border:'1px solid #182025', cursor:'pointer', transition:'border-color 0.15s, color 0.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#2e4448';e.currentTarget.style.color='#5a7a82'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#182025';e.currentTarget.style.color='#3a5460'}}>Avbryt</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}