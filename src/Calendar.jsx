import { useState, useRef, useEffect } from 'react'

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

const PSYCH = [
  { id:'patient',   label:'Tålmodig',    c:'#00e5b0', bg:'#001810' },
  { id:'aplus',     label:'A+ Setup',    c:'#00e5b0', bg:'#001810' },
  { id:'setforget', label:'Set & Forget',c:'#00e5b0', bg:'#001810' },
  { id:'managed',   label:'Hanterat bra',c:'#00e5b0', bg:'#001810' },
  { id:'fomo',      label:'FOMO',        c:'#ff4f6b', bg:'#1a0610' },
  { id:'revenge',   label:'Hämndtrade',  c:'#ff4f6b', bg:'#1a0610' },
  { id:'forced',    label:'Forcerat',    c:'#ffc030', bg:'#1a1000' },
  { id:'oversize',  label:'Överposad',   c:'#ff4f6b', bg:'#1a0610' },
]

const RBG  = { win:'#001810', win2:'#001810', tp1:'#001410', tp2:'#001810', tp3:'#001810', loss:'#1a0610', be:'#111820', skip:'#111820', 'no-setup':'#111820' }
const RBDR = { win:'rgba(0,229,176,0.2)', win2:'rgba(0,229,176,0.2)', tp1:'rgba(0,229,176,0.15)', tp2:'rgba(0,229,176,0.2)', tp3:'rgba(0,229,176,0.2)', loss:'rgba(255,79,107,0.2)', be:'rgba(106,138,144,0.15)', skip:'#1e2c32', 'no-setup':'#1e2c32' }
const RC   = { win:'#00e5b0', win2:'#00e5b0', tp1:'#4ab89a', tp2:'#00e5b0', tp3:'#00e5b0', loss:'#ff4f6b', be:'#6a8a90', skip:'#5a7a84', 'no-setup':'#5a7a84' }
const RL   = { win:"Win +3R", win2:"Win +2R", tp1:"TP1", tp2:"TP2", tp3:"TP3", loss:"Loss -1R", be:"BE", skip:"Skip", "no-setup":"NA" }

const inp = { width:'100%', background:'#080b0c', border:'1px solid #263840', borderRadius:'8px', color:'#d0e8ec', fontSize:'15px', padding:'10px 12px', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }
const lbl = { fontFamily:M, fontSize:'8px', color:'#5a7a84', letterSpacing:'2px', marginBottom:'5px', display:'block' }

// ── Shared edit form ─────────────────────────────────────────────
function EditForm({ initial = {}, onSave, onCancel }) {
  const [result,    setResult]    = useState(initial.result     || '')
  const [instr,     setInstr]     = useState(initial.instrument || 'MYM')
  const [pnl,       setPnl]       = useState(initial.pnl        || '')
  const [note,      setNote]      = useState(initial.note       || '')
  const [emotion,   setEmotion]   = useState(initial.emotion    || '3')
  const [setup,     setSetup]     = useState(initial.setup      || '')
  const [tags,      setTags]      = useState(initial.psychTags  || [])

  const toggle = id => setTags(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
        <div>
          <span style={lbl}>OUTCOME</span>
          <select value={result} onChange={e => setResult(e.target.value)} style={{...inp, fontFamily:M}}>
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
          <input value={instr} onChange={e => setInstr(e.target.value)} style={inp} />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
        <div>
          <span style={lbl}>P&L ($)</span>
          <input type="number" inputMode="decimal" value={pnl} onChange={e => setPnl(e.target.value)} placeholder="450" style={inp} />
        </div>
        <div>
          <span style={lbl}>SETUP</span>
          <input value={setup} onChange={e => setSetup(e.target.value)} placeholder="BTB" style={inp} />
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
            const a = tags.includes(tag.id)
            return <button key={tag.id} onClick={() => toggle(tag.id)} style={{ fontFamily:M, fontSize:'9px', padding:'5px 10px', borderRadius:'5px', background:a?tag.bg:'#161e24', border:`1px solid ${a?tag.c+'33':'#1e2c32'}`, color:a?tag.c:'#5a7a84', cursor:'pointer', transition:'all 0.15s' }}>{tag.label}</button>
          })}
        </div>
      </div>
      <div>
        <span style={lbl}>NOTES</span>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Analys, tankar..." style={{...inp, resize:'vertical', minHeight:'60px', lineHeight:1.6}} />
      </div>
      <div style={{ display:'flex', gap:'8px' }}>
        <button onClick={() => onSave({ result, instrument:instr, pnl:pnl||'0', note, emotion, setup, psychTags:tags })}
          style={{ flex:1, background:'#00e5b0', color:'#020f08', fontFamily:M, fontSize:'11px', fontWeight:700, padding:'12px', borderRadius:'8px', border:'none', cursor:'pointer', letterSpacing:'1px', transition:'background 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='#00c49a'}
          onMouseLeave={e=>e.currentTarget.style.background='#00e5b0'}>SPARA</button>
        <button onClick={onCancel} style={{ background:'transparent', color:'#5a7a84', fontFamily:M, fontSize:'10px', padding:'12px 14px', borderRadius:'8px', border:'1px solid #1e2c32', cursor:'pointer' }}>Avbryt</button>
      </div>
    </div>
  )
}

export default function Calendar({ journal=[], onAddTrade, onDeleteTrade, onEditTrade }) {
  const mobile = useIsMobile()
  const [year,  setYear]  = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [sel,   setSel]   = useState(null)
  const [showForm,     setShowForm]     = useState(false)
  const [editingIdx,   setEditingIdx]   = useState(null) // journal index being edited
  const [lightbox,     setLightbox]     = useState(null)
  const fileRef = useRef()

  // new trade form state
  const [result,    setResult]    = useState('')
  const [instr,     setInstr]     = useState('MYM')
  const [pnl,       setPnl]       = useState('')
  const [note,      setNote]      = useState('')
  const [emotion,   setEmotion]   = useState('3')
  const [setup,     setSetup]     = useState('')
  const [psychTags, setPsychTags] = useState([])
  const [image,     setImage]     = useState(null)
  const [imgPrev,   setImgPrev]   = useState(null)

  const MONTHS = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December']
  // On mobile: Mon–Fri only (5 cols). Desktop: Mon–Sun (7 cols)
  const DAY_LABELS_MOBILE  = ['M','T','O','T','F']
  const DAY_LABELS_DESKTOP = ['M','T','O','T','F','L','S']

  const first = new Date(year, month, 1)
  const dim   = new Date(year, month+1, 0).getDate()
  // offset for Mon-first
  const fullOffset = (first.getDay()+6)%7

  const today = (() => {
    const d=new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })()

  const allM  = journal.filter(t => { const d=new Date(t.date); return d.getFullYear()===year&&d.getMonth()===month })
  const mT    = allM.filter(t => t.result!=='skip'&&t.result!=='no-setup')
  const mW    = mT.filter(t => t.result==='win'||t.result==='win2').length
  const mL    = mT.filter(t => t.result==='loss').length
  const mS    = allM.filter(t => t.result==='skip'||t.result==='no-setup').length
  const mPnl  = mT.reduce((s,t) => s+parseFloat(t.pnl||0), 0)
  const mWr   = mT.length>0 ? Math.round(mW/mT.length*100) : 0
  const tDays = [...new Set(mT.map(t=>t.date))].length
  const avgDay = tDays>0 ? mPnl/tDays : 0

  function getDayStatus(ds) {
    const dt  = journal.filter(t=>t.date===ds); if(!dt.length)return null
    const act = dt.filter(t=>t.result!=='skip'&&t.result!=='no-setup')
    if(!act.length)return 'skip'
    const hl=act.some(t=>t.result==='loss'), hw=act.some(t=>['win','win2','tp1','tp2','tp3'].includes(t.result))
    if(hl&&!hw)return'loss'; if(hw&&!hl)return'win'; return'mixed'
  }

  function getDayStyle(status, pnl) {
    if(status==='win')  return { bg:`rgba(0,40,30,${Math.min(0.2+Math.abs(pnl)/1500,0.5)})`, bdr:'rgba(0,229,176,0.25)', dot:'#00e5b0' }
    if(status==='loss') return { bg:`rgba(40,0,10,${Math.min(0.2+Math.abs(pnl)/800,0.5)})`,  bdr:'rgba(255,79,107,0.25)', dot:'#ff4f6b' }
    if(status==='skip') return { bg:'#111820', bdr:'#1e2c32', dot:'#3a5460' }
    return { bg:'#111820', bdr:'#1e2c32', dot:'#ffc030' }
  }

  function resetForm() {
    setResult(''); setPnl(''); setNote(''); setEmotion('3'); setSetup(''); setPsychTags([])
    setImage(null); setImgPrev(null); setShowForm(false)
  }

  function prevM() { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1); setSel(null); resetForm() }
  function nextM() { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1); setSel(null); resetForm() }

  function handleImg(e) {
    const f=e.target.files[0]; if(!f)return
    const r=new FileReader()
    r.onload=ev=>{setImage(ev.target.result);setImgPrev(ev.target.result)}
    r.readAsDataURL(f)
  }

  function doAdd() {
    if(!result||!sel) return
    onAddTrade({ date:sel, result, instrument:instr, pnl:pnl||'0', note, emotion, setup, psychTags, image:image||null, timestamp:new Date().toISOString() })
    resetForm()
  }

  function doEdit(ji, updated) {
    onEditTrade?.(ji, updated)
    setEditingIdx(null)
  }

  // ── Build calendar cells ──
  // Mobile: only Mon–Fri (skip weekend cells entirely)
  // Desktop: full Mon–Sun grid
  const buildCells = () => {
    const cells = []
    for(let d=1; d<=dim; d++) {
      const date = new Date(year, month, d)
      const wd   = date.getDay() // 0=Sun,1=Mon,...,6=Sat
      const ds   = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const isWe = wd===0||wd===6
      if(mobile && isWe) continue // skip weekends on mobile
      cells.push({ day:d, ds, isWe, wd })
    }
    return cells
  }

  const allCells = buildCells()

  // For desktop: build week rows with offset
  const buildDesktopWeeks = () => {
    const cells = []
    for(let i=0; i<fullOffset; i++) cells.push({ empty:true })
    for(let d=1; d<=dim; d++) {
      const date = new Date(year, month, d)
      const ds   = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const wd   = date.getDay()
      cells.push({ day:d, ds, isWe:wd===0||wd===6, wd })
    }
    while(cells.length%7!==0) cells.push({ empty:true })
    const weeks = []
    for(let i=0; i<cells.length; i+=7) weeks.push(cells.slice(i,i+7))
    return weeks
  }

  // For mobile: build week rows Mon–Fri only
  const buildMobileWeeks = () => {
    const weeks = []
    let week = []
    // find what weekday (Mon=0..Fri=4) the 1st falls on
    const monOffset = (first.getDay()+6)%7 // 0=Mon,4=Fri,5=Sat,6=Sun
    const clampedOffset = Math.min(monOffset, 4) // only 0-4 for Mon-Fri
    for(let i=0; i<clampedOffset; i++) week.push({ empty:true })

    for(let d=1; d<=dim; d++) {
      const date = new Date(year, month, d)
      const wd   = date.getDay()
      const ds   = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      if(wd===0||wd===6) continue // skip weekends
      week.push({ day:d, ds, isWe:false, wd })
      if(week.length===5) { weeks.push(week); week=[] }
    }
    if(week.length>0) {
      while(week.length<5) week.push({ empty:true })
      weeks.push(week)
    }
    return weeks
  }

  const weeks       = mobile ? buildMobileWeeks() : buildDesktopWeeks()
  const dayLabels   = mobile ? DAY_LABELS_MOBILE : DAY_LABELS_DESKTOP
  const gridCols    = mobile ? 'repeat(5, 1fr)' : 'repeat(7, 1fr) 64px'
  const gridColsHdr = mobile ? 'repeat(5, 1fr)' : 'repeat(7, 1fr) 64px'
  const cellH       = mobile ? '60px' : '100px'

  const selTrades = sel ? journal.filter(t=>t.date===sel) : []
  const selPnl    = selTrades.reduce((s,t) => s+parseFloat(t.pnl||0), 0)

  // ── Trade Panel ──
  const Panel = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{ padding:'14px', borderBottom:'1px solid #1e2c32', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexShrink:0 }}>
        <div>
          <div style={{ fontFamily:M, fontSize:'8px', color:'#5a7a84', letterSpacing:'2px', marginBottom:'3px' }}>
            {new Date(sel+'T12:00:00').toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'}).toUpperCase()}
          </div>
          {selTrades.filter(t=>t.result!=='skip'&&t.result!=='no-setup').length>0 && (
            <div style={{ fontFamily:M, fontSize:'22px', fontWeight:700, color:selPnl>=0?'#00e5b0':'#ff4f6b' }}>
              {selPnl>=0?'+':''}${Math.round(selPnl)}
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
          <button onClick={() => { setShowForm(!showForm); setEditingIdx(null) }} style={{ background:'#00e5b0', color:'#020f08', fontFamily:M, fontSize:'9px', fontWeight:700, padding:'7px 13px', borderRadius:'6px', border:'none', cursor:'pointer', letterSpacing:'1px', transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#00c49a'}
            onMouseLeave={e=>e.currentTarget.style.background='#00e5b0'}>+ LOG</button>
          <button onClick={() => { setSel(null); resetForm(); setEditingIdx(null) }} style={{ background:'none', border:'none', color:'#5a7a84', cursor:'pointer', fontSize:'18px', padding:'4px', lineHeight:1 }}>×</button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ overflowY:'auto', flex:1, padding:'12px', display:'flex', flexDirection:'column', gap:'10px' }}>

        {/* New trade form */}
        {showForm && (
          <div style={{ background:'#080b0c', border:'1px solid #263840', borderRadius:'10px', padding:'14px' }}>
            <div style={{ fontFamily:M, fontSize:'8px', color:'#5a7a84', letterSpacing:'2px', marginBottom:'10px' }}>NY TRADE</div>
            <EditForm
              onSave={trade => { onAddTrade({ date:sel, ...trade, timestamp:new Date().toISOString() }); resetForm() }}
              onCancel={resetForm}
            />
          </div>
        )}

        {selTrades.length===0 && !showForm && (
          <div style={{ fontFamily:M, fontSize:'11px', color:'#2e4450', padding:'20px 0', textAlign:'center' }}>Inga trades — tryck + LOG</div>
        )}

        {/* Trade list */}
        {selTrades.map((t, i) => {
          const pv  = parseFloat(t.pnl||0)
          const em  = parseInt(t.emotion||0)
          const ec  = em<=3?'#00e5b0':em>=7?'#ff4f6b':'#ffc030'
          const ji  = journal.findIndex(j => j===t)
          const isEd = editingIdx===ji

          return (
            <div key={i} style={{ background:'#080b0c', border:`1px solid ${RBDR[t.result]||'#1e2c32'}`, borderRadius:'10px', overflow:'hidden' }}>
              {/* Trade row */}
              <div style={{ padding:'11px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                  <span style={{ fontFamily:M, fontSize:'9px', color:'#6a8a92', background:'#161e24', border:'1px solid #1e2c32', borderRadius:'4px', padding:'2px 7px' }}>{t.instrument}</span>
                  <span style={{ fontFamily:M, fontSize:'9px', padding:'2px 7px', borderRadius:'4px', background:RBG[t.result], color:RC[t.result], fontWeight:600 }}>{RL[t.result]||t.result}</span>
                  {t.setup && <span style={{ fontFamily:M, fontSize:'8px', color:'#5a7a84', background:'#161e24', border:'1px solid #1e2c32', borderRadius:'4px', padding:'2px 6px' }}>{t.setup}</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontFamily:M, fontSize:'14px', fontWeight:700, color:pv>=0?'#00e5b0':'#ff4f6b' }}>{pv>=0?'+':''}${Math.abs(Math.round(pv))}</span>
                  {/* Edit */}
                  <button onClick={() => setEditingIdx(isEd?null:ji)} style={{
                    background:isEd?'#263840':'none', border:`1px solid ${isEd?'#3a5460':'#1e2c32'}`,
                    borderRadius:'5px', color:isEd?'#d0e8ec':'#5a7a84',
                    fontFamily:M, fontSize:'9px', padding:'3px 8px', cursor:'pointer',
                    transition:'all 0.15s', letterSpacing:'0.5px',
                  }}>✎</button>
                  {/* Delete */}
                  <button onClick={() => onDeleteTrade?.(ji)} style={{ background:'none', border:'none', color:'#3a5460', cursor:'pointer', fontSize:'14px', padding:'2px', transition:'color 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.color='#ff4f6b'}
                    onMouseLeave={e=>e.currentTarget.style.color='#3a5460'}>×</button>
                </div>
              </div>

              {/* Edit form */}
              {isEd && (
                <div style={{ padding:'12px', borderTop:'1px solid #161e24' }}>
                  <EditForm initial={t} onSave={updated => doEdit(ji, updated)} onCancel={() => setEditingIdx(null)} />
                </div>
              )}

              {/* Details when not editing */}
              {!isEd && (
                <>
                  {em>0 && (
                    <div style={{ padding:'6px 12px', display:'flex', alignItems:'center', gap:'8px', borderTop:'1px solid #161e24' }}>
                      <span style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84', letterSpacing:'1px', flexShrink:0 }}>EMOTION</span>
                      <div style={{ display:'flex', gap:'2px', flex:1 }}>
                        {[1,2,3,4,5,6,7,8,9,10].map(n=><div key={n} style={{ flex:1, height:'3px', borderRadius:'2px', background:n<=em?ec:'#1e2c32' }} />)}
                      </div>
                      <span style={{ fontFamily:M, fontSize:'9px', color:ec, flexShrink:0 }}>{em}/10</span>
                    </div>
                  )}
                  {t.psychTags?.length>0 && (
                    <div style={{ padding:'6px 12px 8px', display:'flex', gap:'4px', flexWrap:'wrap', borderTop:'1px solid #161e24' }}>
                      {t.psychTags.map(id => { const tag=PSYCH.find(p=>p.id===id); return tag?<span key={id} style={{ fontFamily:M, fontSize:'8px', color:tag.c, background:tag.bg, border:`1px solid ${tag.c}22`, borderRadius:'4px', padding:'2px 7px' }}>{tag.label}</span>:null })}
                    </div>
                  )}
                  {t.image && (
                    <div style={{ padding:'8px 12px', borderTop:'1px solid #161e24' }}>
                      <img src={t.image} alt="chart" onClick={() => setLightbox(t.image)} style={{ width:'100%', borderRadius:'8px', border:'1px solid #263840', display:'block', cursor:'zoom-in' }} />
                    </div>
                  )}
                  {t.note && (
                    <div style={{ padding:'10px 12px', borderTop:'1px solid #161e24' }}>
                      <div style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84', letterSpacing:'1px', marginBottom:'5px' }}>NOTES</div>
                      <div style={{ fontSize:'12px', color:'#6a8a92', lineHeight:1.7, whiteSpace:'pre-wrap', wordBreak:'break-word', borderLeft:'2px solid #1e2c32', paddingLeft:'10px' }}>{t.note}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

      {/* Month stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
        {[
          { l:'P&L',       v:`${mPnl>=0?'+':''}$${Math.round(mPnl)}`, c:mPnl>=0?'#00e5b0':'#ff4f6b' },
          { l:'WIN RATE',  v:`${mWr}%`,                                c:'#00e5b0' },
          { l:'WINS',      v:String(mW),                               c:'#00e5b0' },
          { l:'LOSSES',    v:String(mL),                               c:'#ff4f6b' },
          { l:'SKIPS',     v:String(mS),                               c:'#5a7a84' },
          { l:'SNITT/DAG', v:`${avgDay>=0?'+':''}$${Math.round(avgDay)}`, c:avgDay>=0?'#00e5b0':'#ff4f6b' },
        ].map((s,i) => (
          <div key={i} style={{ background:'#111820', border:'1px solid #1e2c32', borderRadius:'10px', padding:'10px 12px' }}>
            <div style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84', letterSpacing:'1px', marginBottom:'3px' }}>{s.l}</div>
            <div style={{ fontFamily:M, fontSize:'16px', fontWeight:700, color:s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Month nav */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontFamily:M, fontSize:'13px', fontWeight:700, color:'#d0e8ec', letterSpacing:'2px' }}>{MONTHS[month].toUpperCase()} {year}</div>
        <div style={{ display:'flex', gap:'5px' }}>
          {[{fn:prevM,l:'‹'},{fn:nextM,l:'›'}].map((b,i) => (
            <button key={i} onClick={b.fn} style={{ background:'#111820', border:'1px solid #1e2c32', borderRadius:'6px', padding:'8px 16px', cursor:'pointer', color:'#6a8a92', fontFamily:M, fontSize:'14px', transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#3a5460';e.currentTarget.style.color='#d0e8ec'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e2c32';e.currentTarget.style.color='#6a8a92'}}>{b.l}</button>
          ))}
        </div>
      </div>

      {/* Calendar + panel */}
      <div style={{ display:'flex', flexDirection:mobile?'column':'row', gap:'14px', alignItems:'flex-start' }}>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ background:'#111820', border:'1px solid #1e2c32', borderRadius:'12px', overflow:'hidden' }}>

            {/* Day headers */}
            <div style={{ display:'grid', gridTemplateColumns:gridColsHdr, background:'#0d1214', borderBottom:'1px solid #1e2c32' }}>
              {dayLabels.map((d,i) => (
                <div key={i} style={{ fontFamily:M, fontSize:'9px', color:'#5a7a84', textAlign:'center', padding:'10px 4px', letterSpacing:'1px' }}>{d}</div>
              ))}
              {!mobile && <div style={{ fontFamily:M, fontSize:'8px', color:'#3a5460', textAlign:'center', padding:'10px 4px', borderLeft:'1px solid #1e2c32' }}>V</div>}
            </div>

            {/* Week rows */}
            {weeks.map((week, wi) => {
              // Desktop week summary
              const wDates  = week.filter(c=>c.ds).map(c=>c.ds)
              const wT      = journal.filter(t=>wDates.includes(t.date)&&t.result!=='skip'&&t.result!=='no-setup')
              const wPnl    = wT.reduce((s,t)=>s+parseFloat(t.pnl||0),0)
              const wW      = wT.filter(t=>t.result==='win'||t.result==='win2').length
              const wWr     = wT.length>0?Math.round(wW/wT.length*100):null

              return (
                <div key={wi} style={{ display:'grid', gridTemplateColumns:gridCols }}>
                  {week.map((cell, ci) => {
                    if(cell.empty) return <div key={ci} style={{ minHeight:cellH, borderRight:'1px solid #161e24', borderBottom:'1px solid #161e24', background:'#0d1214' }} />
                    const { day, ds } = cell
                    const dT    = journal.filter(t=>t.date===ds)
                    const aT    = dT.filter(t=>t.result!=='skip'&&t.result!=='no-setup')
                    const isTd  = ds===today
                    const isSel = ds===sel
                    const stat  = getDayStatus(ds)
                    const dPnl  = aT.reduce((s,t)=>s+parseFloat(t.pnl||0),0)
                    const sc    = stat?getDayStyle(stat,dPnl):null

                    return (
                      <div key={ci}
                        onClick={() => { setSel(isSel?null:ds); resetForm(); setEditingIdx(null) }}
                        style={{
                          minHeight:cellH,
                          borderRight:'1px solid #161e24',
                          borderBottom:'1px solid #161e24',
                          padding: mobile ? '8px 6px' : '8px',
                          background: isSel?(sc?.bg||'rgba(30,44,50,0.4)'):sc?.bg||(isTd?'rgba(0,229,176,0.03)':'transparent'),
                          outline: isSel?`2px solid ${sc?.bdr||'#263840'}`:'none',
                          outlineOffset:'-2px',
                          cursor:'pointer',
                          position:'relative',
                          transition:'background 0.15s',
                        }}>
                        {isTd && <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'#007d5e' }} />}

                        {/* Day number */}
                        <div style={{ fontFamily:M, fontSize: mobile?'11px':'11px', color:isTd?'#00e5b0':'#8aacb4', fontWeight:isTd?700:400, marginBottom:'4px' }}>{day}</div>

                        {/* Desktop: trade pills */}
                        {!mobile && aT.map((t,ti) => (
                          <div key={ti} style={{ fontFamily:M, fontSize:'8px', padding:'2px 5px', borderRadius:'3px', background:RBG[t.result], color:RC[t.result], display:'inline-block', marginBottom:'2px', marginRight:'2px' }}>
                            {RL[t.result]||t.result}
                          </div>
                        ))}

                        {/* Mobile: status dot */}
                        {mobile && stat && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:sc?.dot, marginBottom:'2px' }} />}

                        {/* P&L */}
                        {aT.length>0 && (
                          <div style={{ fontFamily:M, fontSize: mobile?'11px':'10px', fontWeight:700, color:dPnl>=0?'#00e5b0':'#ff4f6b' }}>
                            {dPnl>=0?'+':''}${Math.abs(Math.round(dPnl))}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Desktop week summary column */}
                  {!mobile && (
                    <div style={{ minHeight:cellH, borderBottom:'1px solid #161e24', borderLeft:'1px solid #1e2c32', padding:'8px 6px', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap:'2px', background:'#0d1214' }}>
                      {wT.length>0 ? (
                        <>
                          <div style={{ fontFamily:M, fontSize:'10px', fontWeight:700, color:wPnl>=0?'#00e5b0':'#ff4f6b' }}>{wPnl>=0?'+':''}${Math.abs(Math.round(wPnl))}</div>
                          {wWr!==null && <div style={{ fontFamily:M, fontSize:'8px', color:wWr>=50?'#00e5b0':'#ff4f6b' }}>{wWr}%</div>}
                          <div style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84' }}>{wT.length}t</div>
                        </>
                      ) : <div style={{ fontFamily:M, fontSize:'10px', color:'#1e2c32' }}>—</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Desktop side panel */}
        {!mobile && sel && (
          <div style={{ width:'460px', flexShrink:0, background:'#111820', border:'1px solid #1e2c32', borderRadius:'12px', overflow:'hidden', maxHeight:'calc(100vh - 120px)', display:'flex', flexDirection:'column' }}>
            <Panel />
          </div>
        )}
      </div>

      {/* Mobile: panel below calendar */}
      {mobile && sel && (
        <div style={{ background:'#111820', border:'1px solid #1e2c32', borderRadius:'12px', overflow:'hidden', maxHeight:'75vh', display:'flex', flexDirection:'column' }}>
          <Panel />
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out', padding:'16px' }}>
          <img src={lightbox} alt="chart" style={{ maxWidth:'95vw', maxHeight:'90vh', borderRadius:'10px', border:'1px solid #263840', objectFit:'contain' }} />
        </div>
      )}
    </div>
  )
}
