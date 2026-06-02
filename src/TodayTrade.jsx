import { useState, useEffect, useRef } from 'react'

const M = "'JetBrains Mono', monospace"

const PSYCH = [
  { id: 'patient',   label: 'Tålmodig',    c: '#00e5b0', bg: '#001810' },
  { id: 'aplus',     label: 'A+ Setup',    c: '#00e5b0', bg: '#001810' },
  { id: 'setforget', label: 'Set & Forget',c: '#00e5b0', bg: '#001810' },
  { id: 'managed',   label: 'Hanterat bra',c: '#00e5b0', bg: '#001810' },
  { id: 'fomo',      label: 'FOMO',        c: '#ff4f6b', bg: '#1a0610' },
  { id: 'revenge',   label: 'Hämndtrade',  c: '#ff4f6b', bg: '#1a0610' },
  { id: 'forced',    label: 'Forcerat',    c: '#ffc030', bg: '#1a1000' },
  { id: 'slmoved',   label: 'SL flytt',    c: '#ff4f6b', bg: '#1a0610' },
]

const RULE_LABELS = {
  bias:     'Bias satt för dagen',
  aplus:    'A+ setup',
  window:   'Inom tidsfönster 15:30–17:30',
  risk:     'Risk uträknad',
  max2:     'Max 2 trades idag',
  afterwin: 'Stanna efter vinst',
}

function ChecklistRow({ label, checked, failed, auto, onClick }) {
  const c   = failed ? '#ff4f6b' : checked ? '#00e5b0' : '#7a96b4'
  const bg  = failed ? '#1a0610' : checked ? '#001810' : '#0a1020'
  const bdr = failed ? 'rgba(255,79,107,0.22)' : checked ? 'rgba(0,229,176,0.18)' : '#162340'
  const icon = failed ? '✗' : checked ? '✓' : '○'
  return (
    <div onClick={!auto ? onClick : undefined} style={{
      display:'flex', alignItems:'center', gap:'9px', padding:'7px 10px',
      borderRadius:'6px', background:bg, border:`1px solid ${bdr}`,
      cursor:!auto?'pointer':'default', transition:'all 0.12s',
    }}>
      <span style={{ fontFamily:M, fontSize:'13px', color:c, width:'13px', flexShrink:0, lineHeight:1 }}>{icon}</span>
      <span style={{ fontFamily:M, fontSize:'9px', color:c, flex:1 }}>{label}</span>
      {auto && <span style={{ fontFamily:M, fontSize:'7px', color:'#3a5878', letterSpacing:'0.5px' }}>AUTO</span>}
      {!auto && !checked && <span style={{ fontFamily:M, fontSize:'7px', color:'#3a5878' }}>TAP</span>}
    </div>
  )
}

const RC = { win:'#00e5b0', win2:'#00e5b0', tp1:'#4ab89a', tp2:'#00e5b0', tp3:'#00e5b0', loss:'#ff4f6b', be:'#7a96b4', skip:'#7a96b4', 'no-setup':'#7a96b4' }
const RB = { win:'#001810', win2:'#001810', tp1:'#001410', tp2:'#001810', tp3:'#001a14', loss:'#1a0610', be:'#0c1422', skip:'#0c1422', 'no-setup':'#0c1422' }
const RL = { win:'TP3', win2:'TP2', tp1:'TP1', tp2:'TP2', tp3:'TP3', loss:'Loss −1R', be:'Break Even', skip:'Skip', 'no-setup':'No Setup' }
const BIAS = [
  { v:'bullish', label:'▲ Bull', c:'#00e5b0', bg:'#001810', bdr:'rgba(0,229,176,0.25)' },
  { v:'bearish', label:'▼ Bear', c:'#ff4f6b', bg:'#1a0610', bdr:'rgba(255,79,107,0.25)' },
  { v:'neutral', label:'◆ Neu',  c:'#7a96b4', bg:'#0c1422', bdr:'rgba(106,138,144,0.2)' },
]

const inp = { width:'100%', background:'#08101c', border:'1px solid #1c2e4a', borderRadius:'8px', color:'#dce8f5', fontSize:'15px', padding:'10px 12px', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }
const lbl = { fontFamily:M, fontSize:'8px', color:'#7a96b4', letterSpacing:'2px', marginBottom:'5px', display:'block' }

const RESULTS = [
  { v:"tp1",       label:"TP1",       c:"#4ab89a", bg:"#001410" },
  { v:"tp2",       label:"TP2",       c:"#00e5b0", bg:"#001810" },
  { v:"tp3",       label:"TP3",       c:"#00e5b0", bg:"#001a14" },
  { v:"loss",      label:"Loss -1R",  c:"#ff4f6b", bg:"#1a0610" },
  { v:"be",        label:"Break Even",c:"#7a96b4", bg:"#0c1422" },
  { v:"skip",      label:"Skip",      c:"#7a96b4", bg:"#0c1422" },
  { v:"no-setup",  label:"No Setup",  c:"#4a6888", bg:"#0a1020" },
]

// Outcomes that count as real trades (require bias)
const REAL_RESULTS = new Set(['tp1','tp2','tp3','win','win2','loss','be'])

function TradeForm({ initial = {}, onSave, onCancel, hasBias, isSecondTrade, firstTradeWon, isOpen = false, realTradeCount = 0, tiltRisk = false, tiltMins = null }) {
  const [result,     setResult]     = useState(initial.result     || '')
  const [instrument, setInstrument] = useState(initial.instrument || 'MYM')
  const [pnl,        setPnl]        = useState(initial.pnl        || '')
  const [note,       setNote]       = useState(initial.note       || '')
  const [emotion,    setEmotion]    = useState(initial.emotion     || '3')
  const [setup,      setSetup]      = useState(initial.setup      || '')
  const [psychTags,  setPsychTags]  = useState(initial.psychTags  || [])
  const [biasError,  setBiasError]  = useState(false)
  const [tradeTime,  setTradeTime]  = useState(initial.tradeTime  || (() => new Date().toLocaleTimeString('sv-SE', { timeZone:'Europe/Stockholm', hour:'2-digit', minute:'2-digit', hour12:false }))())
  const [checkAplus, setCheckAplus] = useState(false)
  const [checkRisk,  setCheckRisk]  = useState(false)
  const [image,      setImage]      = useState(initial.image || null)
  const [imgPrev,    setImgPrev]    = useState(initial.image || null)
  const [audioUrl,   setAudioUrl]   = useState(initial.audio || null)
  const [recording,  setRecording]  = useState(false)
  const fileRef   = useRef()
  const mediaRef  = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => () => { if (mediaRef.current?.state === 'recording') mediaRef.current.stop() }, [])

  useEffect(() => {
    const onPaste = e => {
      for (const item of e.clipboardData?.items || []) {
        if (item.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = ev => { setImage(ev.target.result); setImgPrev(ev.target.result) }
          reader.readAsDataURL(item.getAsFile())
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  function toggleTag(id) { setPsychTags(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]) }

  function handleImg(e) {
    const f = e.target.files[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => { setImage(ev.target.result); setImgPrev(ev.target.result) }
    r.readAsDataURL(f)
  }
  function clearImg() { setImage(null); setImgPrev(null); if (fileRef.current) fileRef.current.value = '' }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onload = ev => setAudioUrl(ev.target.result)
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
    } catch { /* mic denied */ }
  }
  function stopRecording() { mediaRef.current?.stop(); setRecording(false) }

  const isReal = REAL_RESULTS.has(result)

  const autoRules = {
    bias:     hasBias,
    window:   isOpen,
    max2:     realTradeCount < 2,
    afterwin: !(isSecondTrade && firstTradeWon),
  }
  const allRules = { ...autoRules, aplus: checkAplus, risk: checkRisk }
  const violatedRules = isReal ? Object.entries(allRules).filter(([, v]) => !v).map(([k]) => k) : []
  const checklistViolation = violatedRules.length > 0

  function save() {
    if (!result) return
    if (REAL_RESULTS.has(result) && !hasBias) {
      setBiasError(true)
      return
    }
    setBiasError(false)
    onSave({ result, instrument, pnl: pnl || '0', note, emotion, setup, psychTags, checklistViolation, violatedRules, brokenRules: violatedRules, tradeTime, image: image || null, audio: audioUrl || null })
  }

  return (
    <div style={{ background:'#08101c', border:'1px solid #1c2e4a', borderRadius:'10px', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>

      {/* Chart image upload */}
      <div>
        <span style={lbl}>CHART SCREENSHOT</span>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{ display:'none' }} />
        {!imgPrev ? (
          <button type="button" onClick={() => fileRef.current?.click()} style={{
            width:'100%', background:'#0a1020', border:'2px dashed #1c2e4a', borderRadius:'8px',
            color:'#7a96b4', fontFamily:M, fontSize:'10px', padding:'16px 14px', cursor:'pointer',
            transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px',
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#00e5b0';e.currentTarget.style.color='#00e5b0';e.currentTarget.style.background='#001810'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#1c2e4a';e.currentTarget.style.color='#7a96b4';e.currentTarget.style.background='#0a1020'}}
          >
            <span style={{ fontSize:'16px' }}>+</span> Ladda upp chart-bild
          </button>
        ) : (
          <div style={{ position:'relative', borderRadius:'8px', overflow:'hidden', border:'1px solid #1c2e4a' }}>
            <img src={imgPrev} alt="chart preview" style={{ width:'100%', display:'block', maxHeight:'220px', objectFit:'contain', background:'#070a14' }} />
            <button type="button" onClick={() => fileRef.current?.click()} style={{ position:'absolute', top:'6px', left:'6px', background:'rgba(6,8,9,0.88)', border:'1px solid #1c2e4a', borderRadius:'5px', color:'#7a96b4', fontFamily:M, fontSize:'9px', padding:'4px 8px', cursor:'pointer' }}>↻ Byt</button>
            <button type="button" onClick={clearImg} style={{ position:'absolute', top:'6px', right:'6px', background:'rgba(6,8,9,0.88)', border:'1px solid rgba(255,79,107,0.3)', borderRadius:'5px', color:'#ff4f6b', fontFamily:M, fontSize:'9px', padding:'4px 8px', cursor:'pointer' }}>✕</button>
          </div>
        )}
      </div>

      {/* Voice memo */}
      <div>
        <span style={lbl}>RÖSTMEMO</span>
        {!audioUrl ? (
          <button type="button" onClick={recording ? stopRecording : startRecording} style={{
            width:'100%', background: recording ? '#1a0610' : '#0a1020',
            border: `2px ${recording ? 'solid' : 'dashed'} ${recording ? 'rgba(255,79,107,0.5)' : '#1c2e4a'}`,
            borderRadius:'8px', color: recording ? '#ff4f6b' : '#7a96b4',
            fontFamily:M, fontSize:'10px', padding:'13px 14px', cursor:'pointer',
            transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
          }}
            onMouseEnter={e=>{ if(!recording){ e.currentTarget.style.borderColor='#4a6888'; e.currentTarget.style.color='#dce8f5' }}}
            onMouseLeave={e=>{ if(!recording){ e.currentTarget.style.borderColor='#1c2e4a'; e.currentTarget.style.color='#7a96b4' }}}>
            {recording
              ? <><span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#ff4f6b', display:'inline-block', flexShrink:0 }} /> Stoppa inspelning</>
              : <><span style={{ fontSize:'15px' }}>🎙</span> Spela in röstmemo</>}
          </button>
        ) : (
          <div style={{ background:'#0a1020', border:'1px solid #1c2e4a', borderRadius:'8px', padding:'10px 12px' }}>
            <audio src={audioUrl} controls style={{ width:'100%', height:'32px', display:'block' }} />
            <button type="button" onClick={() => setAudioUrl(null)} style={{ background:'none', border:'none', color:'#6880a0', fontFamily:M, fontSize:'8px', cursor:'pointer', marginTop:'5px', padding:0 }}>✕ Ta bort memo</button>
          </div>
        )}
      </div>

      {/* Tilt warning */}
      {tiltRisk && (
        <div style={{ background:'#1a0010', border:'1px solid rgba(255,79,107,0.5)', borderRadius:'8px', padding:'10px 13px', display:'flex', gap:'9px', alignItems:'flex-start' }}>
          <span style={{ fontSize:'16px', flexShrink:0 }}>🧠</span>
          <div>
            <div style={{ fontFamily:M, fontSize:'10px', color:'#ff4f6b', fontWeight:700, marginBottom:'2px' }}>TILT RISK — {tiltMins} MIN SEDAN FÖRLUST</div>
            <div style={{ fontFamily:M, fontSize:'9px', color:'#a03050', lineHeight:1.5 }}>Du förlorade nyligen. Är du i rätt mentalt tillstånd? Vänta tills du känner lugn.</div>
          </div>
        </div>
      )}

      {/* Trade #2 warning — first trade was a win */}
      {isSecondTrade && firstTradeWon && (
        <div style={{ background:'#1a0f00', border:'1px solid rgba(255,192,48,0.35)', borderRadius:'8px', padding:'10px 13px', display:'flex', gap:'9px', alignItems:'flex-start' }}>
          <span style={{ fontSize:'14px', flexShrink:0 }}>⚠️</span>
          <div>
            <div style={{ fontFamily:M, fontSize:'10px', color:'#ffc030', fontWeight:700, marginBottom:'2px' }}>TRADE #2 BLOCKERAD</div>
            <div style={{ fontFamily:M, fontSize:'9px', color:'#a07830', lineHeight:1.5 }}>Din första trade vann. PRO BTB-regeln: om trade #1 är vinst — stanna för dagen.</div>
          </div>
        </div>
      )}

      {/* Trade #2 reminder — first trade was a loss */}
      {isSecondTrade && !firstTradeWon && (
        <div style={{ background:'#0a1020', border:'1px solid rgba(90,122,132,0.3)', borderRadius:'8px', padding:'10px 13px', display:'flex', gap:'9px', alignItems:'flex-start' }}>
          <span style={{ fontSize:'14px', flexShrink:0 }}>ℹ️</span>
          <div>
            <div style={{ fontFamily:M, fontSize:'10px', color:'#7a96b4', fontWeight:700, marginBottom:'2px' }}>TRADE #2 — KONTROLLERA</div>
            <div style={{ fontFamily:M, fontSize:'9px', color:'#5a7898', lineHeight:1.5 }}>Samma bias? Ingen emotionell drivkraft? Max 50% risk. Annars — stanna.</div>
          </div>
        </div>
      )}

      {/* Bias error */}
      {biasError && (
        <div style={{ background:'#1a0610', border:'1px solid rgba(255,79,107,0.4)', borderRadius:'8px', padding:'10px 13px', display:'flex', gap:'9px', alignItems:'center' }}>
          <span style={{ fontSize:'14px', flexShrink:0 }}>🚫</span>
          <div style={{ fontFamily:M, fontSize:'10px', color:'#ff4f6b', lineHeight:1.5 }}>Sätt daglig bias innan du loggar en trade. PRO BTB-regel.</div>
        </div>
      )}

      <div>
        <span style={lbl}>OUTCOME</span>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
          {RESULTS.map(r => (
            <button type="button" key={r.v} onClick={() => { setResult(r.v); setBiasError(false) }} style={{
              fontFamily:M, fontSize:'10px', padding:'7px 11px', borderRadius:'6px',
              background: result===r.v ? r.bg : '#0a1020',
              border: `1px solid ${result===r.v ? r.c+'55' : '#1c2e4a'}`,
              color: result===r.v ? r.c : '#7a96b4',
              cursor:'pointer', transition:'all 0.15s',
              WebkitTapHighlightColor:'transparent',
            }}>{r.label}</button>
          ))}
        </div>
      </div>

      <div>
        <span style={lbl}>INSTRUMENT</span>
        <input value={instrument} onChange={e => setInstrument(e.target.value)} style={inp}
          onFocus={e=>e.target.style.borderColor='#4a6888'} onBlur={e=>e.target.style.borderColor='#1c2e4a'} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
        <div>
          <span style={lbl}>P&L ($)</span>
          <input type="number" inputMode="decimal" value={pnl} onChange={e => setPnl(e.target.value)} placeholder="450" style={inp}
            onFocus={e=>e.target.style.borderColor='#4a6888'} onBlur={e=>e.target.style.borderColor='#1c2e4a'} />
        </div>
        <div>
          <span style={lbl}>SETUP</span>
          <input value={setup} onChange={e => setSetup(e.target.value)} placeholder="BTB" style={inp}
            onFocus={e=>e.target.style.borderColor='#4a6888'} onBlur={e=>e.target.style.borderColor='#1c2e4a'} />
        </div>
        <div>
          <span style={lbl}>HANDLAD KL</span>
          <input type="time" value={tradeTime} onChange={e => setTradeTime(e.target.value)} style={{ ...inp, colorScheme:'dark' }}
            onFocus={e=>e.target.style.borderColor='#4a6888'} onBlur={e=>e.target.style.borderColor='#1c2e4a'} />
        </div>
      </div>

      <div>
        <span style={lbl}>EMOTION — <span style={{ color:parseInt(emotion)<=3?'#00e5b0':parseInt(emotion)>=7?'#ff4f6b':'#ffc030', fontWeight:600 }}>{parseInt(emotion)<=3?'Lugn ✓':parseInt(emotion)>=7?'Stressad ✗':'Neutral'}</span></span>
        <div style={{ display:'flex', gap:'3px' }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button type="button" key={n} onClick={() => setEmotion(String(n))} style={{
              flex:1, padding:'8px 0', borderRadius:'5px',
              border:`1px solid ${emotion===String(n)?'#007d5e':'#1c2e4a'}`,
              background:emotion===String(n)?'#001810':'#0f1828',
              color:emotion===String(n)?'#00e5b0':'#7a96b4',
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
              <button type="button" key={tag.id} onClick={() => toggleTag(tag.id)} style={{
                fontFamily:M, fontSize:'9px', padding:'5px 10px', borderRadius:'5px',
                background:a?tag.bg:'#0f1828', border:`1px solid ${a?tag.c+'33':'#162340'}`,
                color:a?tag.c:'#7a96b4', cursor:'pointer', transition:'all 0.15s',
              }}>{tag.label}</button>
            )
          })}
        </div>
      </div>

      <div>
        <span style={lbl}>NOTES</span>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Analys, tankar..."
          style={{...inp, resize:'vertical', minHeight:'140px', lineHeight:1.7, fontSize:'14px'}}
          onFocus={e=>e.target.style.borderColor='#4a6888'} onBlur={e=>e.target.style.borderColor='#1c2e4a'} />
      </div>

      {/* Pre-trade checklist — only for real trades */}
      {isReal && (
        <div>
          <span style={lbl}>PRE-TRADE CHECKLISTA</span>
          <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            <ChecklistRow label={RULE_LABELS.bias}     checked={autoRules.bias}     failed={!autoRules.bias}     auto />
            <ChecklistRow label={RULE_LABELS.aplus}    checked={checkAplus}         failed={false}               auto={false} onClick={() => setCheckAplus(v => !v)} />
            <ChecklistRow label={RULE_LABELS.window}   checked={autoRules.window}   failed={!autoRules.window}   auto />
            <ChecklistRow label={RULE_LABELS.risk}     checked={checkRisk}          failed={false}               auto={false} onClick={() => setCheckRisk(v => !v)} />
            <ChecklistRow label={RULE_LABELS.max2}     checked={autoRules.max2}     failed={!autoRules.max2}     auto />
            <ChecklistRow label={RULE_LABELS.afterwin} checked={autoRules.afterwin} failed={!autoRules.afterwin} auto />
          </div>
          {checklistViolation && (
            <div style={{ fontFamily:M, fontSize:'8px', color:'#ff4f6b', marginTop:'6px', padding:'5px 8px', background:'#1a0610', borderRadius:'5px', border:'1px solid rgba(255,79,107,0.2)' }}>
              ⚠ {violatedRules.length} regel{violatedRules.length > 1 ? 'r' : ''} bruten — trade sparas som RULE VIOLATION
            </div>
          )}
          {!checklistViolation && (
            <div style={{ fontFamily:M, fontSize:'8px', color:'#00e5b0', marginTop:'6px', padding:'5px 8px', background:'#001810', borderRadius:'5px', border:'1px solid rgba(0,229,176,0.15)' }}>
              ✓ Alla regler uppfyllda
            </div>
          )}
        </div>
      )}

      <div style={{ display:'flex', gap:'8px' }}>
        <button
          type="button"
          onClick={save}
          disabled={isSecondTrade && firstTradeWon}
          style={{
            flex:1, background: (isSecondTrade && firstTradeWon) ? '#1a1000' : '#f59e0b',
            color: (isSecondTrade && firstTradeWon) ? '#5a4020' : '#0a0700',
            fontFamily:M, fontSize:'11px', fontWeight:700, padding:'12px',
            borderRadius:'8px', border:'none',
            cursor: (isSecondTrade && firstTradeWon) ? 'not-allowed' : 'pointer',
            letterSpacing:'1px', transition:'background 0.15s',
            opacity: (isSecondTrade && firstTradeWon) ? 0.5 : 1,
          }}
          onMouseEnter={e=>{ if(!(isSecondTrade && firstTradeWon)) e.currentTarget.style.background='#d97706' }}
          onMouseLeave={e=>{ if(!(isSecondTrade && firstTradeWon)) e.currentTarget.style.background='#f59e0b' }}
        >
          {(isSecondTrade && firstTradeWon) ? 'STANNA FÖR DAGEN' : 'SPARA'}
        </button>
        <button type="button" onClick={onCancel} style={{ background:'transparent', color:'#7a96b4', fontFamily:M, fontSize:'10px', padding:'12px 14px', borderRadius:'8px', border:'1px solid #162340', cursor:'pointer', transition:'all 0.15s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#4a6888';e.currentTarget.style.color='#8aacb4'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#162340';e.currentTarget.style.color='#7a96b4'}}>Avbryt</button>
      </div>
    </div>
  )
}

export default function TodayTrade({ journal=[], onAddTrade, onEditTrade, streakLogs={}, biasLogs={}, onSaveBias, isLockedOut=false, lockoutReason='' }) {
  const [showForm,   setShowForm]   = useState(false)
  const [expanded,   setExpanded]   = useState(null)
  const [editing,    setEditing]    = useState(null)
  const [now,        setNow]        = useState(new Date())
  const [zoomImage,  setZoomImage]  = useState(null)

  const today = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])

  // NY time — your actual window is 09:30–11:30 NY (15:30–17:30 CET)
  const nyNow   = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const nyMins  = nyNow.getHours() * 60 + nyNow.getMinutes()
  const isOpen  = nyMins >= 570 && nyMins < 690   // 09:30–11:30 NY
  const isPre   = nyMins >= 0   && nyMins < 570   // before 09:30 NY
  const minsTo  = isPre ? 570 - nyMins : isOpen ? 690 - nyMins : null

  // Fixed seconds: count remaining seconds in current minute
  const secRem  = now.getSeconds() > 0 ? 60 - now.getSeconds() : 0
  const timerStr = minsTo != null
    ? `${String(Math.floor(minsTo/60)).padStart(2,'0')}:${String(minsTo%60).padStart(2,'0')}:${String(secRem).padStart(2,'0')}`
    : null

  const todayTrades = journal.filter(t => t.date === today)
  const todayBias   = biasLogs[today] || null
  const curBias     = BIAS.find(b => b.v === todayBias)

  // Real trades today (not skip/no-setup)
  const todayRealTrades = todayTrades.filter(t => REAL_RESULTS.has(t.result))
  const realTradeCount  = todayRealTrades.length
  // First real trade — did it win?
  const firstRealTrade  = todayRealTrades[todayRealTrades.length - 1] // journal is newest-first
  const firstTradeWon   = firstRealTrade ? ['win','win2','tp1','tp2','tp3'].includes(firstRealTrade.result) : false
  // Is the form about to log trade #2 or more?
  const isSecondTrade   = realTradeCount >= 1

  // Tilt detection — loss < 20 min ago
  const latestRealTrade = todayRealTrades[0]
  const minsAgoLatest   = latestRealTrade?.timestamp
    ? Math.floor((now - new Date(latestRealTrade.timestamp)) / 60000) : null
  const tiltRisk = latestRealTrade?.result === 'loss' && minsAgoLatest !== null && minsAgoLatest < 20

  const REAL_RESULTS_ARR = Array.from(REAL_RESULTS)
  const trades   = journal.filter(t => !['skip','no-setup'].includes(t.result))
  const wins     = trades.filter(t => ['win','win2','tp1','tp2','tp3'].includes(t.result)).length
  const winRate  = trades.length > 0 ? Math.round(wins / trades.length * 100) : 0
  const totalPnl = trades.reduce((s, t) => s + parseFloat(t.pnl||0), 0)

  const isWd = d => { const wd=new Date(d+'T12:00:00').getDay(); return wd>=1&&wd<=5 }
  const logDates = Object.keys(streakLogs).filter(isWd).sort((a,b) => b.localeCompare(a))
  let streak = 0
  for (const d of logDates) { if (streakLogs[d]==='violation') break; if (streakLogs[d]==='clean') streak++ }

  const ws = new Date(now); ws.setDate(now.getDate()-((now.getDay()+6)%7)); ws.setHours(0,0,0,0)
  const weekPnl  = trades.filter(t => new Date(t.date)>=ws).reduce((s,t) => s+parseFloat(t.pnl||0), 0)
  const todayPnl = todayTrades.filter(t => REAL_RESULTS.has(t.result)).reduce((s,t) => s+parseFloat(t.pnl||0), 0)

  function card(label, value, color, sub) {
    return (
      <div style={{ background:'#0c1422', border:'1px solid #162340', borderRadius:'12px', padding:'14px 16px' }}>
        <div style={{ fontFamily:M, fontSize:'8px', color:'#7a96b4', letterSpacing:'2px', marginBottom:'6px' }}>{label}</div>
        <div style={{ fontFamily:M, fontSize:'24px', fontWeight:700, color, lineHeight:1 }}>{value}</div>
        {sub && <div style={{ fontFamily:M, fontSize:'9px', color:'#7a96b4', marginTop:'4px' }}>{sub}</div>}
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

      {/* ── LOCKOUT BANNER ── */}
      {isLockedOut && (
        <div style={{
          background:'#1a0610',
          border:'1px solid rgba(255,79,107,0.45)',
          borderRadius:'12px',
          padding:'14px 16px',
          display:'flex',
          gap:'12px',
          alignItems:'flex-start',
        }}>
          <span style={{ fontSize:'20px', flexShrink:0 }}>🔒</span>
          <div>
            <div style={{ fontFamily:M, fontSize:'11px', color:'#ff4f6b', fontWeight:700, letterSpacing:'1px', marginBottom:'4px' }}>LOCKOUT AKTIV — INGEN TRADING</div>
            <div style={{ fontFamily:M, fontSize:'9px', color:'#7a3040', lineHeight:1.6 }}>{lockoutReason || '2 violations denna vecka. Full vecka utan trading. Granska dina regler.'}</div>
          </div>
        </div>
      )}

      {/* ── PDL VARNING ── */}
      {(() => {
        const pdl = parseFloat(localStorage.getItem('prop-pdl') || '0')
        if (!pdl || todayPnl >= 0) return null
        const pct = Math.abs(todayPnl) / pdl * 100
        if (pct < 50) return null
        const hit = pct >= 100
        return (
          <div style={{ background: hit?'#1a0610':'#1a1000', border:`1px solid ${hit?'rgba(255,79,107,0.45)':'rgba(255,192,48,0.35)'}`, borderRadius:'12px', padding:'12px 16px', display:'flex', gap:'12px', alignItems:'center' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:M, fontSize:'10px', color: hit?'#ff4f6b':'#ffc030', fontWeight:700, letterSpacing:'0.5px', marginBottom:'2px' }}>
                {hit ? '🚨 MAX DAGLIG FÖRLUST NÅDD — SLUTA TRADEA' : `⚠ ${Math.round(pct)}% AV DAGLIG FÖRLUSTGRÄNS`}
              </div>
              <div style={{ fontFamily:M, fontSize:'9px', color: hit?'#7a3040':'#7a6020' }}>
                -${Math.round(Math.abs(todayPnl))} av ${Math.round(pdl)} PDL
              </div>
            </div>
            <div style={{ fontFamily:M, fontSize:'22px', fontWeight:700, color: hit?'#ff4f6b':'#ffc030', flexShrink:0 }}>{Math.round(pct)}%</div>
          </div>
        )
      })()}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:'8px' }}>
        {card('WIN RATE',    `${winRate}%`,                                      '#00e5b0', `${trades.length} trades`)}
        {card('TOTALT P&L',  `${totalPnl>=0?'+':''}$${Math.round(totalPnl)}`,   totalPnl>=0?'#00e5b0':'#ff4f6b')}
        {card('DENNA VECKA', `${weekPnl>=0?'+':''}$${Math.round(weekPnl)}`,     weekPnl>=0?'#00e5b0':'#ff4f6b')}
        {card('STREAK',      `${streak}d`,                                       streak>=5?'#00e5b0':streak>=2?'#ffc030':'#7a96b4')}
      </div>

      {/* ── MÅNADSSAMMANFATTNING ── */}
      {(() => {
        const ms = new Date(now.getFullYear(), now.getMonth(), 1)
        const mt = trades.filter(t => new Date(t.date+'T12:00:00') >= ms)
        if (mt.length === 0) return null
        const mw  = mt.filter(t => ['win','win2','tp1','tp2','tp3'].includes(t.result)).length
        const ml  = mt.filter(t => t.result === 'loss').length
        const mp  = mt.reduce((s,t) => s + parseFloat(t.pnl||0), 0)
        const mwr = Math.round(mw / mt.length * 100)
        const mn  = now.toLocaleDateString('sv-SE', { month:'long' }).toUpperCase()
        return (
          <div style={{ background:'#0c1422', border:'1px solid #162340', borderRadius:'12px', padding:'11px 16px', display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{ fontFamily:M, fontSize:'8px', color:'#6880a0', letterSpacing:'1.5px', flexShrink:0 }}>{mn}</div>
            <div style={{ width:'1px', height:'24px', background:'#162340', flexShrink:0 }} />
            <div style={{ display:'flex', gap:'18px', alignItems:'center', flex:1 }}>
              <div>
                <div style={{ fontFamily:M, fontSize:'17px', fontWeight:700, color: mp>=0?'#00e5b0':'#ff4f6b', lineHeight:1 }}>{mp>=0?'+':''}${Math.round(mp)}</div>
                <div style={{ fontFamily:M, fontSize:'8px', color:'#6880a0', marginTop:'1px' }}>{mt.length} trades</div>
              </div>
              <div style={{ width:'1px', height:'24px', background:'#162340' }} />
              <div>
                <div style={{ fontFamily:M, fontSize:'17px', fontWeight:700, color: mwr>=50?'#00e5b0':'#ff4f6b', lineHeight:1 }}>{mwr}%</div>
                <div style={{ fontFamily:M, fontSize:'8px', color:'#6880a0', marginTop:'1px' }}>WR</div>
              </div>
              <div style={{ width:'1px', height:'24px', background:'#162340' }} />
              <div style={{ display:'flex', gap:'8px' }}>
                <span style={{ fontFamily:M, fontSize:'13px', fontWeight:700, color:'#00e5b0' }}>{mw}W</span>
                <span style={{ fontFamily:M, fontSize:'13px', fontWeight:700, color:'#ff4f6b' }}>{ml}L</span>
              </div>
            </div>
          </div>
        )
      })()}


      {/* Bias */}
      <div style={{ background:'#0c1422', border:`1px solid ${curBias?curBias.bdr:'#162340'}`, borderRadius:'12px', padding:'12px 14px', transition:'border-color 0.2s' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'9px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontFamily:M, fontSize:'8px', color:'#7a96b4', letterSpacing:'2px' }}>DAGLIG BIAS</span>
            {!todayBias && (
              <span style={{ fontFamily:M, fontSize:'8px', color:'#ffc030', background:'#1a1000', border:'1px solid rgba(255,192,48,0.25)', borderRadius:'4px', padding:'1px 6px', letterSpacing:'0.5px' }}>
                OBLIGATORISK
              </span>
            )}
          </div>
          {curBias && <span style={{ fontFamily:M, fontSize:'11px', fontWeight:600, color:curBias.c }}>{curBias.label}</span>}
        </div>
        <div style={{ display:'flex', gap:'6px' }}>
          {BIAS.map(b => (
            <button type="button" key={b.v} onClick={() => onSaveBias?.(today, todayBias===b.v?null:b.v)} style={{
              flex:1, minHeight:'36px', background:todayBias===b.v?b.bg:'#0a1020',
              border:`1px solid ${todayBias===b.v?b.bdr:'#162340'}`,
              borderRadius:'8px', color:todayBias===b.v?b.c:'#7a96b4',
              fontFamily:M, fontSize:'11px', cursor:'pointer', transition:'all 0.15s',
            }}>{b.label}</button>
          ))}
        </div>
      </div>

      {/* Today's trades */}
      <div style={{ background:'#0c1422', border:'1px solid #162340', borderRadius:'12px', padding:'14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:todayTrades.length>0||showForm?'12px':'0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontFamily:M, fontSize:'8px', color:'#7a96b4', letterSpacing:'2px', marginBottom:'2px' }}>DAGENS TRADES</div>
              <div style={{ fontSize:'11px', color:'#7a96b4' }}>{new Date().toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'})}</div>
            </div>
            {timerStr && (
              <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'#0a1020', border:`1px solid ${isOpen?'rgba(0,229,176,0.2)':'#162340'}`, borderRadius:'6px', padding:'4px 9px' }}>
                <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:isOpen?'#00e5b0':'#ffc030' }} />
                <span style={{ fontFamily:M, fontSize:'8px', color:isOpen?'#00e5b0':'#ffc030' }}>
                  {isOpen ? 'STÄNGER' : 'ÖPPNAR'} {timerStr}
                </span>
              </div>
            )}
            {/* After window — show closed */}
            {!isOpen && !isPre && (
              <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'#0a1020', border:'1px solid #162340', borderRadius:'6px', padding:'4px 9px' }}>
                <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#3a5878' }} />
                <span style={{ fontFamily:M, fontSize:'8px', color:'#6880a0' }}>SESSION STÄNGD</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            disabled={isLockedOut}
            style={{
              background: isLockedOut ? '#1a0610' : '#f59e0b',
              color: isLockedOut ? '#5a3040' : '#0a0700',
              fontFamily:M, fontSize:'10px', fontWeight:700,
              padding:'8px 14px', borderRadius:'8px', border:'none',
              cursor: isLockedOut ? 'not-allowed' : 'pointer',
              letterSpacing:'1px', flexShrink:0, transition:'background 0.15s',
              opacity: isLockedOut ? 0.5 : 1,
            }}
            onMouseEnter={e=>{ if(!isLockedOut) e.currentTarget.style.background='#d97706' }}
            onMouseLeave={e=>{ if(!isLockedOut) e.currentTarget.style.background='#f59e0b' }}
          >
            {isLockedOut ? '🔒 LOCKOUT' : '+ LOG'}
          </button>
        </div>

        {todayTrades.length===0 && !showForm && (
          <div style={{ fontFamily:M, fontSize:'11px', color:'#3a5878' }}>Inga trades loggade idag</div>
        )}

        {todayTrades.map((t, i) => {
          const pv  = parseFloat(t.pnl||0)
          const em  = parseInt(t.emotion||0)
          const ec  = em<=3?'#00e5b0':em>=7?'#ff4f6b':'#ffc030'
          const isEx = expanded===i
          const isEd = editing===i
          const bdr  = ['win','win2','tp1','tp2','tp3'].includes(t.result)?'rgba(0,229,176,0.18)':t.result==='loss'?'rgba(255,79,107,0.18)':'#162340'
          const ji   = journal.findIndex(j => j === t)

          return (
            <div key={i} style={{ marginBottom:'6px', background:'#0a1020', border:`1px solid ${bdr}`, borderRadius:'9px', overflow:'hidden', transition:'border-color 0.15s' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px' }}>
                <div onClick={() => { setExpanded(isEx?null:i); setEditing(null) }} style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap', cursor:'pointer', flex:1 }}>
                  <span style={{ fontFamily:M, fontSize:'9px', color:'#7a96b4', background:'#0f1828', border:'1px solid #162340', borderRadius:'4px', padding:'2px 7px' }}>{t.instrument}</span>
                  <span style={{ fontFamily:M, fontSize:'9px', padding:'2px 8px', borderRadius:'4px', background:RB[t.result]||'#111', color:RC[t.result]||'#7a96b4', fontWeight:600 }}>{RL[t.result]||t.result}</span>
                  {t.setup && <span style={{ fontFamily:M, fontSize:'8px', color:'#7a96b4', background:'#0f1828', border:'1px solid #162340', borderRadius:'4px', padding:'2px 6px' }}>{t.setup}</span>}
                  {t.checklistViolation && <span style={{ fontFamily:M, fontSize:'7px', color:'#ff4f6b', background:'#1a0610', border:'1px solid rgba(255,79,107,0.25)', borderRadius:'4px', padding:'2px 6px', letterSpacing:'0.5px' }}>RULE VIOLATION</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontFamily:M, fontSize:'15px', fontWeight:700, color:pv>=0?'#00e5b0':'#ff4f6b' }}>{pv>=0?'+':''}${Math.abs(Math.round(pv))}</span>
                  <button type="button" onClick={() => { setEditing(isEd?null:i); setExpanded(null) }} style={{ background:isEd?'#1c2e4a':'none', border:`1px solid ${isEd?'#4a6888':'#162340'}`, borderRadius:'5px', color:isEd?'#dce8f5':'#7a96b4', fontFamily:M, fontSize:'8px', padding:'3px 8px', cursor:'pointer', transition:'all 0.15s', letterSpacing:'0.5px' }}>✎</button>
                  <span onClick={() => { setExpanded(isEx?null:i); setEditing(null) }} style={{ color:'#6880a0', fontSize:'9px', cursor:'pointer', transition:'transform 0.2s', display:'inline-block', transform:isEx?'rotate(180deg)':'none' }}>▼</span>
                </div>
              </div>

              {isEd && (
                <div style={{ padding:'0 10px 10px' }}>
                  <TradeForm
                    initial={t}
                    onSave={updated => handleEdit(i, updated)}
                    onCancel={() => setEditing(null)}
                    hasBias={!!todayBias}
                    isSecondTrade={false}
                    firstTradeWon={false}
                    isOpen={isOpen}
                    realTradeCount={realTradeCount}
                    tiltRisk={false}
                    tiltMins={null}
                  />
                </div>
              )}

              {isEx && !isEd && (
                <div style={{ borderTop:'1px solid #0f1828' }}>
                  {t.violatedRules?.length > 0 && (
                    <div style={{ padding:'8px 12px 4px', display:'flex', flexWrap:'wrap', gap:'4px' }}>
                      {t.violatedRules.map(rId => {
                        const rule = RULE_LABELS[rId]
                        return rule ? (
                          <span key={rId} style={{ fontFamily:M, fontSize:'7px', color:'#ff4f6b', background:'#1a0610', border:'1px solid rgba(255,79,107,0.2)', borderRadius:'3px', padding:'2px 6px' }}>✗ {rule}</span>
                        ) : null
                      })}
                    </div>
                  )}
                  {t.image && (
                    <div style={{ padding:'10px 10px 0' }}>
                      <img src={t.image} alt="chart" onClick={() => setZoomImage(t.image)} style={{ width:'100%', borderRadius:'6px', display:'block', maxHeight:'280px', objectFit:'contain', background:'#070a14', cursor:'zoom-in' }} />
                    </div>
                  )}
                  {t.audio && (
                    <div style={{ padding:'10px 12px 0' }}>
                      <div style={{ fontFamily:M, fontSize:'7px', color:'#7a96b4', letterSpacing:'1px', marginBottom:'5px' }}>RÖSTMEMO</div>
                      <audio src={t.audio} controls style={{ width:'100%', height:'32px', display:'block' }} />
                    </div>
                  )}
                  {em>0 && (
                    <div style={{ padding:'8px 12px', display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontFamily:M, fontSize:'7px', color:'#7a96b4', letterSpacing:'1px', flexShrink:0 }}>EMOTION</span>
                      <div style={{ display:'flex', gap:'2px', flex:1 }}>
                        {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                          <div key={n} style={{ flex:1, height:'3px', borderRadius:'2px', background:n<=em?ec:'#162340' }} />
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
                    <div style={{ padding:'8px 12px', borderTop:'1px solid #0f1828' }}>
                      <div style={{ fontFamily:M, fontSize:'7px', color:'#7a96b4', letterSpacing:'1px', marginBottom:'5px' }}>NOTES</div>
                      <div style={{ fontSize:'12px', color:'#7a96b4', lineHeight:1.7, whiteSpace:'pre-wrap', wordBreak:'break-word', borderLeft:'2px solid #162340', paddingLeft:'10px' }}>{t.note}</div>
                    </div>
                  )}
                  <div style={{ padding:'8px 12px', borderTop:'1px solid #0f1828', display:'flex', justifyContent:'flex-end' }}>
                    <button type="button" onClick={() => {
                      const pv = parseFloat(t.pnl||0)
                      const lines = [
                        `${t.date}${t.tradeTime ? ' ' + t.tradeTime : ''}`,
                        `${t.instrument} · ${RL[t.result]||t.result}`,
                        `P&L: ${pv>=0?'+':''}$${Math.abs(Math.round(pv))}`,
                        t.setup ? `Setup: ${t.setup}` : '',
                        t.emotion ? `Emotion: ${t.emotion}/10` : '',
                        t.note || '',
                      ].filter(Boolean).join('\n')
                      navigator.clipboard?.writeText(lines)
                    }} style={{ fontFamily:M, fontSize:'8px', color:'#6880a0', background:'#0a1020', border:'1px solid #162340', borderRadius:'5px', padding:'3px 9px', cursor:'pointer', transition:'all 0.15s' }}
                      onMouseEnter={e=>{e.currentTarget.style.color='#dce8f5';e.currentTarget.style.borderColor='#3a5460'}}
                      onMouseLeave={e=>{e.currentTarget.style.color='#6880a0';e.currentTarget.style.borderColor='#162340'}}
                    >kopiera</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {todayTrades.filter(t => REAL_RESULTS.has(t.result)).length > 0 && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'6px', gap:'4px' }}>
            <span style={{ fontFamily:M, fontSize:'10px', color:'#7a96b4' }}>Idag:</span>
            <span style={{ fontFamily:M, fontSize:'10px', fontWeight:700, color:todayPnl>=0?'#00e5b0':'#ff4f6b' }}>{todayPnl>=0?'+':''}${Math.round(todayPnl)}</span>
          </div>
        )}

        {showForm && (
          <div style={{ marginTop:'12px' }}>
            <TradeForm
              onSave={trade => { onAddTrade({ date:today, ...trade, timestamp:new Date().toISOString() }); setShowForm(false) }}
              onCancel={() => setShowForm(false)}
              hasBias={!!todayBias}
              isSecondTrade={isSecondTrade}
              firstTradeWon={firstTradeWon}
              isOpen={isOpen}
              realTradeCount={realTradeCount}
              tiltRisk={tiltRisk}
              tiltMins={minsAgoLatest}
            />
          </div>
        )}
      </div>

      {/* Lightbox */}
      {zoomImage && (
        <div onClick={() => setZoomImage(null)} style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', cursor:'zoom-out' }}>
          <img src={zoomImage} alt="chart fullscreen" style={{ maxWidth:'100%', maxHeight:'100%', borderRadius:'8px', objectFit:'contain' }} />
          <button type="button" onClick={() => setZoomImage(null)} style={{ position:'fixed', top:'16px', right:'16px', background:'rgba(6,8,9,0.9)', border:'1px solid #1c2e4a', borderRadius:'8px', color:'#7a96b4', fontFamily:M, fontSize:'13px', padding:'6px 12px', cursor:'pointer' }}>✕</button>
        </div>
      )}
    </div>
  )
}