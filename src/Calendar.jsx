import { useState, useRef, useEffect } from 'react'

const M = "'JetBrains Mono', monospace"

function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false)
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

const RBG  = { win:'#001810', win2:'#001810', loss:'#1a0610', be:'#111820', skip:'#111820', 'no-setup':'#111820' }
const RBDR = { win:'rgba(0,229,176,0.2)', win2:'rgba(0,229,176,0.2)', loss:'rgba(255,79,107,0.2)', be:'rgba(106,138,144,0.15)', skip:'#1e2c32', 'no-setup':'#1e2c32' }
const RC = { win:'#00e5b0', win2:'#00e5b0', tp1:'#4ab89a', loss:'#ff4f6b', be:'#6a8a90', skip:'#5a7a84', 'no-setup':'#5a7a84' }
const RL = { win:'Win +3R', win2:'Win +2R', tp1:'TP1', loss:'Loss −1R', be:'BE', skip:'Skip', 'no-setup':'N/A' }

const inp = { width:'100%', background:'#080b0c', border:'1px solid #263840', borderRadius:'8px', color:'#d0e8ec', fontSize:'15px', padding:'10px 12px', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }
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

// Compress image to JPEG, max 800px, 70% quality — keeps localStorage happy
function compressImage(dataUrl, maxPx = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('Kunde inte ladda bilden'))
    img.src = dataUrl
  })
}

function EditForm({ initial = {}, onSave, onCancel }) {
  const [result,    setResult]    = useState(initial.result     || '')
  const [instr,     setInstr]     = useState(initial.instrument || 'MYM')
  const [pnl,       setPnl]       = useState(initial.pnl        || '')
  const [note,      setNote]      = useState(initial.note       || '')
  const [emotion,   setEmotion]   = useState(initial.emotion    || '3')
  const [setup,     setSetup]     = useState(initial.setup      || '')
  const [tags,      setTags]      = useState(initial.psychTags  || [])
  const [image,     setImage]     = useState(initial.image      || null)
  const [isHovered, setIsHovered] = useState(false)
  const [imgError,  setImgError]  = useState(null)
  const [imgLoading,setImgLoading]= useState(false)

  const fileInputRef = useRef(null)
  const toggle = id => setTags(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Reset file input so same file can be re-selected if removed
    e.target.value = ''

    setImgError(null)
    setImgLoading(true)

    try {
      const reader = new FileReader()
      const dataUrl = await new Promise((res, rej) => {
        reader.onload  = ev => res(ev.target.result)
        reader.onerror = () => rej(new Error('Kunde inte läsa filen'))
        reader.readAsDataURL(file)
      })

      const compressed = await compressImage(dataUrl)
      setImage(compressed)
    } catch (err) {
      setImgError('Kunde inte ladda bilden. Försök med en annan fil.')
      console.error('Image error:', err)
    } finally {
      setImgLoading(false)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
      <div>
        <span style={lbl}>OUTCOME</span>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
          {RESULTS.map(r => (
            <button type="button" key={r.v} onClick={() => setResult(r.v)} style={{
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
        <input value={instr} onChange={e => setInstr(e.target.value)} style={inp} />
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
            <button type="button" key={n} onClick={() => setEmotion(String(n))} style={{
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
            return <button type="button" key={tag.id} onClick={() => toggle(tag.id)} style={{ fontFamily:M, fontSize:'9px', padding:'5px 10px', borderRadius:'5px', background:a?tag.bg:'#161e24', border:`1px solid ${a?tag.c+'33':'#1e2c32'}`, color:a?tag.c:'#5a7a84', cursor:'pointer', transition:'all 0.15s' }}>{tag.label}</button>
          })}
        </div>
      </div>

      <div>
        <span style={lbl}>CHART / BILD</span>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />

        {imgError && (
          <div style={{ fontFamily:M, fontSize:'10px', color:'#ff4f6b', background:'rgba(255,79,107,0.1)', border:'1px solid rgba(255,79,107,0.3)', borderRadius:'6px', padding:'8px 10px', marginBottom:'6px' }}>
            {imgError}
          </div>
        )}

        {!image ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={imgLoading}
            style={{ ...inp, background: '#0d1214', borderStyle: 'dashed', color: imgLoading ? '#3a5460' : '#5a7a84', cursor: imgLoading ? 'wait' : 'pointer', textAlign: 'center', fontSize: '12px' }}
          >
            {imgLoading ? 'Laddar bild...' : '+ LÄGG TILL BILD / SKÄRMDUMP'}
          </button>
        ) : (
          <div
            style={{ position: 'relative', border: '1px solid #263840', borderRadius: '8px', overflow: 'hidden', background: '#080b0c' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <img src={image} alt="Preview" style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', display: 'block' }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.15s',
              pointerEvents: isHovered ? 'auto' : 'none'
            }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: '#111820', color: '#d0e8ec', border: '1px solid #263840', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontFamily: M }}>Ändra</button>
              <button type="button" onClick={() => setImage(null)} style={{ background: 'rgba(255,79,107,0.2)', color: '#ff4f6b', border: '1px solid rgba(255,79,107,0.4)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontFamily: M }}>Ta bort</button>
            </div>
          </div>
        )}
      </div>

      <div>
        <span style={lbl}>NOTES</span>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Analys, tankar..." style={{...inp, resize:'vertical', minHeight:'140px', lineHeight:1.7, fontSize:'14px'}} />
      </div>
      <div style={{ display:'flex', gap:'8px' }}>
        <button type="button" onClick={() => onSave({ result, instrument:instr, pnl:pnl||'0', note, emotion, setup, psychTags:tags, image })}
          style={{ flex:1, background:'#00e5b0', color:'#020f08', fontFamily:M, fontSize:'11px', fontWeight:700, padding:'12px', borderRadius:'8px', border:'none', cursor:'pointer', letterSpacing:'1px', transition:'background 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='#00c49a'}
          onMouseLeave={e=>e.currentTarget.style.background='#00e5b0'}>SPARA</button>
        <button type="button" onClick={onCancel} style={{ background:'transparent', color:'#5a7a84', fontFamily:M, fontSize:'10px', padding:'12px 14px', borderRadius:'8px', border:'1px solid #1e2c32', cursor:'pointer' }}>Avbryt</button>
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
  const [editingIdx,   setEditingIdx]   = useState(null)
  const [lightbox,     setLightbox]     = useState(null)
  const [saveError,    setSaveError]    = useState(null)

  const MONTHS = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December']
  const DAY_LABELS_MOBILE  = ['M','T','O','T','F']
  const DAY_LABELS_DESKTOP = ['M','T','O','T','F','L','S']

  const first = new Date(year, month, 1)
  const dim   = new Date(year, month+1, 0).getDate()
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
    const hl=act.some(t=>t.result==='loss'), hw=act.some(t=>t.result==='win'||t.result==='win2')
    if(hl&&!hw)return'loss'; if(hw&&!hl)return'win'; return'mixed'
  }

  function getDayStyle(status, pnl) {
    if(status==='win')  return { bg:`rgba(0,40,30,${Math.min(0.2+Math.abs(pnl)/1500,0.5)})`, bdr:'rgba(0,229,176,0.25)', dot:'#00e5b0' }
    if(status==='loss') return { bg:`rgba(40,0,10,${Math.min(0.2+Math.abs(pnl)/800,0.5)})`,  bdr:'rgba(255,79,107,0.25)', dot:'#ff4f6b' }
    if(status==='skip') return { bg:'#111820', bdr:'#1e2c32', dot:'#3a5460' }
    return { bg:'#111820', bdr:'#1e2c32', dot:'#ffc030' }
  }

  function prevM() { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1); setSel(null); setShowForm(false) }
  function nextM() { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1); setSel(null); setShowForm(false) }

  // Wrap save calls with localStorage quota error handling
  function safeSave(fn, trade) {
    try {
      fn(trade)
      setSaveError(null)
    } catch (err) {
      if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
        setSaveError('Lagringsutrymmet är fullt. Ta bort några bilder från gamla trades och försök igen.')
      } else {
        setSaveError('Kunde inte spara traden. Försök igen.')
      }
      console.error('Save error:', err)
    }
  }

  function doEdit(ji, updated) {
    safeSave(() => onEditTrade?.(ji, updated), updated)
    if (!saveError) setEditingIdx(null)
  }

  const weeks       = mobile ? buildMobileWeeks() : buildDesktopWeeks()
  const dayLabels   = mobile ? DAY_LABELS_MOBILE : DAY_LABELS_DESKTOP
  const gridCols    = mobile ? 'repeat(5, 1fr)' : 'repeat(7, 1fr) 64px'
  const gridColsHdr = mobile ? 'repeat(5, 1fr)' : 'repeat(7, 1fr) 64px'
  const cellH       = mobile ? '60px' : '100px'

  function buildDesktopWeeks() {
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

  function buildMobileWeeks() {
    const weeks = []
    let week = []
    const monOffset = (first.getDay()+6)%7
    const clampedOffset = Math.min(monOffset, 4)
    for(let i=0; i<clampedOffset; i++) week.push({ empty:true })

    for(let d=1; d<=dim; d++) {
      const date = new Date(year, month, d)
      const wd   = date.getDay()
      const ds   = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      if(wd===0||wd===6) continue
      week.push({ day:d, ds, isWe:false, wd })
      if(week.length===5) { weeks.push(week); week=[] }
    }
    if(week.length>0) {
      while(week.length<5) week.push({ empty:true })
      weeks.push(week)
    }
    return weeks
  }

  const selTrades = sel ? journal.filter(t=>t.date===sel) : []
  const selPnl    = selTrades.reduce((s,t) => s+parseFloat(t.pnl||0), 0)

  const Panel = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
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
          <button type="button" onClick={() => { setShowForm(!showForm); setEditingIdx(null); setSaveError(null) }} style={{ background:'#00e5b0', color:'#020f08', fontFamily:M, fontSize:'9px', fontWeight:700, padding:'7px 13px', borderRadius:'6px', border:'none', cursor:'pointer', letterSpacing:'1px', transition:'background 0.15s' }}>+ LOG</button>
          <button type="button" onClick={() => { setSel(null); setShowForm(false); setEditingIdx(null); setSaveError(null) }} style={{ background:'none', border:'none', color:'#5a7a84', cursor:'pointer', fontSize:'18px', padding:'4px', lineHeight:1 }}>×</button>
        </div>
      </div>

      <div style={{ padding:'12px', display:'flex', flexDirection:'column', gap:'10px' }}>
        {saveError && (
          <div style={{ fontFamily:M, fontSize:'10px', color:'#ff4f6b', background:'rgba(255,79,107,0.1)', border:'1px solid rgba(255,79,107,0.3)', borderRadius:'6px', padding:'10px 12px', lineHeight:1.6 }}>
            ⚠ {saveError}
          </div>
        )}

        {showForm && (
          <div style={{ background:'#080b0c', border:'1px solid #263840', borderRadius:'10px', padding:'14px' }}>
            <div style={{ fontFamily:M, fontSize:'8px', color:'#5a7a84', letterSpacing:'2px', marginBottom:'10px' }}>NY TRADE</div>
            <EditForm
              onSave={trade => {
                safeSave(
                  () => onAddTrade({ date:sel, ...trade, timestamp:new Date().toISOString() }),
                  trade
                )
                if (!saveError) setShowForm(false)
              }}
              onCancel={() => { setShowForm(false); setSaveError(null) }}
            />
          </div>
        )}

        {selTrades.length===0 && !showForm && (
          <div style={{ fontFamily:M, fontSize:'11px', color:'#2e4450', padding:'20px 0', textAlign:'center' }}>Inga trades — tryck + LOG</div>
        )}

        {selTrades.map((t, i) => {
          const pv  = parseFloat(t.pnl||0)
          const em  = parseInt(t.emotion||0)
          const ec  = em<=3?'#00e5b0':em>=7?'#ff4f6b':'#ffc030'
          const ji  = journal.findIndex(j => j===t)
          const isEd = editingIdx===ji

          return (
            <div key={i} style={{ background:'#080b0c', border:`1px solid ${RBDR[t.result]||'#1e2c32'}`, borderRadius:'10px' }}>
              <div style={{ padding:'11px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                  <span style={{ fontFamily:M, fontSize:'9px', color:'#6a8a92', background:'#161e24', border:'1px solid #1e2c32', borderRadius:'4px', padding:'2px 7px' }}>{t.instrument}</span>
                  <span style={{ fontFamily:M, fontSize:'9px', padding:'2px 7px', borderRadius:'4px', background:RBG[t.result], color:RC[t.result], fontWeight:600 }}>{RL[t.result]||t.result}</span>
                  {t.setup && <span style={{ fontFamily:M, fontSize:'8px', color:'#5a7a84', background:'#161e24', border:'1px solid #1e2c32', borderRadius:'4px', padding:'2px 6px' }}>{t.setup}</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontFamily:M, fontSize:'14px', fontWeight:700, color:pv>=0?'#00e5b0':'#ff4f6b' }}>{pv>=0?'+':''}${Math.abs(Math.round(pv))}</span>
                  <button type="button" onClick={() => { setEditingIdx(isEd?null:ji); setSaveError(null) }} style={{ background:isEd?'#263840':'none', border:`1px solid ${isEd?'#3a5460':'#1e2c32'}`, borderRadius:'5px', color:isEd?'#d0e8ec':'#5a7a84', fontFamily:M, fontSize:'9px', padding:'3px 8px', cursor:'pointer' }}>✎</button>
                  <button type="button" onClick={() => onDeleteTrade?.(ji)} style={{ background:'none', border:'none', color:'#3a5460', cursor:'pointer', fontSize:'14px' }}>×</button>
                </div>
              </div>

              {isEd && (
                <div style={{ padding:'12px', borderTop:'1px solid #161e24' }}>
                  <EditForm initial={t} onSave={updated => doEdit(ji, updated)} onCancel={() => { setEditingIdx(null); setSaveError(null) }} />
                </div>
              )}

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

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontFamily:M, fontSize:'13px', fontWeight:700, color:'#d0e8ec', letterSpacing:'2px' }}>{MONTHS[month].toUpperCase()} {year}</div>
        <div style={{ display:'flex', gap:'5px' }}>
          {[{fn:prevM,l:'‹'},{fn:nextM,l:'›'}].map((b,i) => (
            <button type="button" key={i} onClick={b.fn} style={{ background:'#111820', border:'1px solid #1e2c32', borderRadius:'6px', padding:'8px 16px', cursor:'pointer', color:'#6a8a92', fontFamily:M, fontSize:'14px' }}>{b.l}</button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:mobile?'column':'row', gap:'14px', alignItems:'flex-start' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ background:'#111820', border:'1px solid #1e2c32', borderRadius:'12px', overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:gridColsHdr, background:'#0d1214', borderBottom:'1px solid #1e2c32' }}>
              {dayLabels.map((d,i) => (
                <div key={i} style={{ fontFamily:M, fontSize:'9px', color:'#5a7a84', textAlign:'center', padding:'10px 4px', letterSpacing:'1px' }}>{d}</div>
              ))}
              {!mobile && <div style={{ fontFamily:M, fontSize:'8px', color:'#3a5460', textAlign:'center', padding:'10px 4px', borderLeft:'1px solid #1e2c32' }}>V</div>}
            </div>

            {weeks.map((week, wi) => {
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
                        onClick={() => { setSel(isSel?null:ds); setShowForm(false); setEditingIdx(null); setSaveError(null) }}
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
                        }}>
                        {isTd && <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'#007d5e' }} />}
                        <div style={{ fontFamily:M, fontSize:'11px', color:isTd?'#00e5b0':'#8aacb4', fontWeight:isTd?700:400, marginBottom:'4px' }}>{day}</div>

                        {!mobile && aT.map((t,ti) => (
                          <div key={ti} style={{ fontFamily:M, fontSize:'8px', padding:'2px 5px', borderRadius:'3px', background:RBG[t.result], color:RC[t.result], display:'inline-block', marginBottom:'2px', marginRight:'2px' }}>
                            {RL[t.result]||t.result}
                          </div>
                        ))}

                        {mobile && stat && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:sc?.dot, marginBottom:'2px' }} />}

                        {aT.length>0 && (
                          <div style={{ fontFamily:M, fontSize: mobile?'11px':'10px', fontWeight:700, color:dPnl>=0?'#00e5b0':'#ff4f6b' }}>
                            {dPnl>=0?'+':''}${Math.abs(Math.round(dPnl))}
                          </div>
                        )}
                      </div>
                    )
                  })}

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

        {!mobile && sel && (
          <div style={{ width:'460px', flexShrink:0, background:'#111820', border:'1px solid #1e2c32', borderRadius:'12px' }}>
            <Panel />
          </div>
        )}
      </div>

      {mobile && sel && (
        <div style={{ background:'#111820', border:'1px solid #1e2c32', borderRadius:'12px' }}>
          <Panel />
        </div>
      )}

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out', padding:'16px' }}>
          <img src={lightbox} alt="chart" style={{ maxWidth:'95vw', maxHeight:'90vh', borderRadius:'10px', border:'1px solid #263840', objectFit:'contain' }} />
        </div>
      )}
    </div>
  )
}