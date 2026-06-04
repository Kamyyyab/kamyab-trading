import { useState, useRef, useEffect } from 'react'
import { useT } from './lang.js'

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
  { id:'slmoved',   label:'SL flytt',    c:'#ff4f6b', bg:'#1a0610' },
]

const WIN_RESULTS = new Set(['win','win2','tp1','tp2','tp3'])

const RBG  = { win:'#001810', win2:'#001810', tp1:'#001410', tp2:'#001810', tp3:'#001a14', loss:'#1a0610', be:'#0c1422', skip:'#0c1422', 'no-setup':'#0c1422' }
const RBDR = { win:'rgba(0,229,176,0.2)', win2:'rgba(0,229,176,0.2)', tp1:'rgba(0,229,176,0.15)', tp2:'rgba(0,229,176,0.2)', tp3:'rgba(0,229,176,0.2)', loss:'rgba(255,79,107,0.2)', be:'rgba(106,138,144,0.15)', skip:'#162340', 'no-setup':'#162340' }
const RC   = { win:'#00e5b0', win2:'#00e5b0', tp1:'#4ab89a', tp2:'#00e5b0', tp3:'#00e5b0', loss:'#ff4f6b', be:'#7a96b4', skip:'#7a96b4', 'no-setup':'#7a96b4' }
const RL   = { win:'TP3', win2:'TP2', tp1:'TP1', tp2:'TP2', tp3:'TP3', loss:'Loss −1R', be:'BE', skip:'Skip', 'no-setup':'N/A' }

const inp = { width:'100%', background:'#080b0c', border:'1px solid #1c2e4a', borderRadius:'8px', color:'#dce8f5', fontSize:'15px', padding:'11px 13px', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s', fontFamily:'inherit' }
const lbl = { fontFamily:M, fontSize:'9px', color:'#7a96b4', letterSpacing:'1.5px', marginBottom:'6px', display:'block', fontWeight:600 }

// ── EditForm ────────────────────────────────────────────────
function EditForm({ initial = {}, onSave, onCancel }) {
  const t = useT()
  const [result,    setResult]    = useState(initial.result     || '')
  const [instr,     setInstr]     = useState(initial.instrument || 'MYM')
  const [pnl,       setPnl]       = useState(initial.pnl        || '')
  const [note,      setNote]      = useState(initial.note       || '')
  const [emotion,   setEmotion]   = useState(initial.emotion    || '3')
  const [setup,     setSetup]     = useState(initial.setup      || '')
  const [tags,      setTags]      = useState(initial.psychTags  || [])
  const [tradeTime, setTradeTime] = useState(initial.tradeTime  || '')
  const [grade,     setGrade]     = useState(initial.grade      || '')
  const [image,    setImage]    = useState(initial.image  || null)
  const [imgPrev,  setImgPrev]  = useState(initial.image  || null)
  const [audioUrl, setAudioUrl] = useState(initial.audio  || null)
  const [recording,setRecording]= useState(false)
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

  const toggle = id => setTags(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

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
      mr.start(); mediaRef.current = mr; setRecording(true)
    } catch { /* mic denied */ }
  }
  function stopRecording() { mediaRef.current?.stop(); setRecording(false) }

  const outcomeBtns = [
    { v:'tp1',  l:'TP1',      c:'#4ab89a', bg:'#001410' },
    { v:'tp2',  l:'TP2',      c:'#00e5b0', bg:'#001810' },
    { v:'tp3',  l:'TP3',      c:'#00e5b0', bg:'#001a14' },
    { v:'loss', l:'Loss −1R', c:'#ff4f6b', bg:'#1a0610' },
    { v:'be',   l:'BE',       c:'#7a96b4', bg:'#0c1422' },
    { v:'skip', l:'Skip',     c:'#7a96b4', bg:'#0c1422' },
    { v:'no-setup', l:'No Setup', c:'#7a96b4', bg:'#0c1422' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

      {/* IMAGE */}
      <div>
        <span style={lbl}>📷 CHART SCREENSHOT</span>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{ display:'none' }} />
        {!imgPrev ? (
          <button type="button" onClick={() => fileRef.current?.click()} style={{
            width:'100%', background:'#080b0c', border:'2px dashed #1c2e4a', borderRadius:'10px',
            color:'#7a96b4', fontFamily:M, fontSize:'11px', padding:'28px 14px', cursor:'pointer',
            transition:'all 0.2s', letterSpacing:'0.5px', display:'flex', flexDirection:'column',
            alignItems:'center', gap:'6px', fontWeight:600,
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#00e5b0';e.currentTarget.style.color='#00e5b0';e.currentTarget.style.background='#001810'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#1c2e4a';e.currentTarget.style.color='#7a96b4';e.currentTarget.style.background='#080b0c'}}
          >
            <span style={{ fontSize:'22px' }}>+</span>
            <span>Ladda upp chart-bild</span>
            <span style={{ fontSize:'9px', color:'#6880a0', fontWeight:400 }}>PNG, JPG, GIF</span>
          </button>
        ) : (
          <div style={{ position:'relative', borderRadius:'10px', overflow:'hidden', border:'1px solid #1c2e4a' }}>
            <img src={imgPrev} alt="preview" style={{ width:'100%', display:'block', maxHeight:'320px', objectFit:'contain', background:'#080b0c' }} />
            <button type="button" onClick={() => fileRef.current?.click()} style={{
              position:'absolute', top:'8px', left:'8px', background:'rgba(6,8,9,0.9)',
              border:'1px solid #1c2e4a', borderRadius:'6px', color:'#7a96b4',
              fontFamily:M, fontSize:'10px', padding:'5px 10px', cursor:'pointer', backdropFilter:'blur(8px)',
            }}>↻ Byt</button>
            <button type="button" onClick={clearImg} style={{
              position:'absolute', top:'8px', right:'8px', background:'rgba(6,8,9,0.9)',
              border:'1px solid rgba(255,79,107,0.3)', borderRadius:'6px', color:'#ff4f6b',
              fontFamily:M, fontSize:'10px', padding:'5px 10px', cursor:'pointer', backdropFilter:'blur(8px)',
            }}>✕ Ta bort</button>
          </div>
        )}
      </div>

      {/* OUTCOME */}
      <div>
        <span style={lbl}>OUTCOME</span>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'6px' }}>
          {outcomeBtns.map(o => {
            const active = result===o.v
            return (
              <button key={o.v} type="button" onClick={() => setResult(o.v)} style={{
                background: active?o.bg:'#0a1020',
                border:`1px solid ${active?o.c+'66':'#162340'}`,
                color: active?o.c:'#7a96b4',
                fontFamily:M, fontSize:'10px', fontWeight:active?700:500,
                padding:'10px 6px', borderRadius:'7px', cursor:'pointer',
                transition:'all 0.15s', letterSpacing:'0.5px',
              }}>{o.l}</button>
            )
          })}
        </div>
      </div>

      {/* INSTRUMENT + P&L + SETUP + HANDLAD KL */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'10px' }}>
        <div>
          <span style={lbl}>INSTRUMENT</span>
          <input value={instr} onChange={e => setInstr(e.target.value)} style={inp} />
        </div>
        <div>
          <span style={lbl}>P&L ($)</span>
          <input type="number" inputMode="decimal" value={pnl} onChange={e => setPnl(e.target.value)} placeholder="450" style={inp} />
        </div>
        <div>
          <span style={lbl}>SETUP</span>
          <input value={setup} onChange={e => setSetup(e.target.value)} placeholder="BTB" style={inp} />
        </div>
        <div>
          <span style={lbl}>HANDLAD KL</span>
          <input type="time" value={tradeTime} onChange={e => setTradeTime(e.target.value)} style={{ ...inp, colorScheme:'dark' }} />
        </div>
      </div>

      {/* EMOTION */}
      <div>
        <span style={lbl}>EMOTION — <span style={{ color:parseInt(emotion)<=3?'#00e5b0':parseInt(emotion)>=7?'#ff4f6b':'#ffc030', fontWeight:700 }}>{parseInt(emotion)<=3?'Lugn ✓':parseInt(emotion)>=7?'Stressad ✗':'Neutral'}</span></span>
        <div style={{ display:'flex', gap:'4px' }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n} type="button" onClick={() => setEmotion(String(n))} style={{
              flex:1, padding:'10px 0', borderRadius:'6px',
              border:`1px solid ${emotion===String(n)?'#007d5e':'#1c2e4a'}`,
              background:emotion===String(n)?'#001810':'#0a1020',
              color:emotion===String(n)?'#00e5b0':'#7a96b4',
              fontFamily:M, fontSize:'12px', fontWeight:emotion===String(n)?700:500,
              cursor:'pointer', transition:'all 0.15s',
            }}>{n}</button>
          ))}
        </div>
      </div>

      {/* PSYCH TAGS */}
      <div>
        <span style={lbl}>PSYKOLOGI</span>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
          {PSYCH.map(tag => {
            const a = tags.includes(tag.id)
            return <button key={tag.id} type="button" onClick={() => toggle(tag.id)} style={{
              fontFamily:M, fontSize:'10px', padding:'7px 12px', borderRadius:'6px',
              background:a?tag.bg:'#0a1020',
              border:`1px solid ${a?tag.c+'55':'#162340'}`,
              color:a?tag.c:'#7a96b4', cursor:'pointer', transition:'all 0.15s',
              fontWeight:a?600:500,
            }}>{tag.label}</button>
          })}
        </div>
      </div>

      {/* NOTES */}
      <div>
        <span style={lbl}>NOTES</span>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Analys, tankar, vad du lärt dig..."
          style={{...inp, resize:'vertical', minHeight:'120px', lineHeight:1.7, fontSize:'14px' }} />
      </div>

      {/* VOICE MEMO */}
      <div>
        <span style={lbl}>RÖSTMEMO</span>
        {!audioUrl ? (
          <button type="button" onClick={recording ? stopRecording : startRecording} style={{
            width:'100%', background:recording?'#1a0610':'#080b0c',
            border:`2px ${recording?'solid':'dashed'} ${recording?'rgba(255,79,107,0.5)':'#1c2e4a'}`,
            borderRadius:'8px', color:recording?'#ff4f6b':'#7a96b4',
            fontFamily:M, fontSize:'11px', padding:'13px 14px', cursor:'pointer',
            transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
          }}>
            {recording
              ? <><span style={{ width:'8px',height:'8px',borderRadius:'50%',background:'#ff4f6b',display:'inline-block',flexShrink:0 }} /> Stoppa inspelning</>
              : <><span style={{ fontSize:'15px' }}>🎙</span> Spela in röstmemo</>}
          </button>
        ) : (
          <div style={{ background:'#080b0c', border:'1px solid #1c2e4a', borderRadius:'8px', padding:'10px 12px' }}>
            <audio src={audioUrl} controls style={{ width:'100%', height:'32px', display:'block' }} />
            <button type="button" onClick={() => setAudioUrl(null)} style={{ background:'none', border:'none', color:'#6880a0', fontFamily:M, fontSize:'9px', cursor:'pointer', marginTop:'5px', padding:0 }}>✕ Ta bort memo</button>
          </div>
        )}
      </div>

      {/* GRADE */}
      <div>
        <span style={lbl}>SETUP-KVALITET</span>
        <div style={{ display:'flex', gap:'5px' }}>
          {[['A+','#f59e0b','#18100a'],['A','#00e5b0','#001810'],['B','#60a5fa','#0a1428'],['C','#7a96b4','#0c1422']].map(([v,c,bg])=>(
            <button type="button" key={v} onClick={()=>setGrade(grade===v?'':v)} style={{
              flex:1, padding:'9px 0', borderRadius:'6px',
              border:`1px solid ${grade===v?c+'66':'#162340'}`,
              background:grade===v?bg:'#0a1020',
              color:grade===v?c:'#6880a0',
              fontFamily:M, fontSize:'13px', fontWeight:700, cursor:'pointer', transition:'all 0.15s',
            }}>{v}</button>
          ))}
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{ display:'flex', gap:'8px', position:'sticky', bottom:0, background:'#0c1422', paddingTop:'10px', marginTop:'-4px' }}>
        <button type="button" onClick={onCancel} style={{
          background:'transparent', color:'#7a96b4', fontFamily:M, fontSize:'11px', fontWeight:600,
          padding:'14px 20px', borderRadius:'8px', border:'1px solid #1c2e4a', cursor:'pointer',
          transition:'all 0.15s',
        }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#3a5460';e.currentTarget.style.color='#dce8f5'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#1c2e4a';e.currentTarget.style.color='#7a96b4'}}
        >{t.calCancel}</button>
        <button type="button" onClick={() => onSave({ result, instrument:instr, pnl:pnl||'0', note, emotion, setup, psychTags:tags, tradeTime, grade, image:image||null, audio:audioUrl||null })} style={{
          flex:1, background:'#00e5b0', color:'#020f08', fontFamily:M, fontSize:'12px', fontWeight:700,
          padding:'14px', borderRadius:'8px', border:'none', cursor:'pointer', letterSpacing:'1px',
          transition:'background 0.15s',
        }}
          onMouseEnter={e=>e.currentTarget.style.background='#d97706'}
          onMouseLeave={e=>e.currentTarget.style.background='#f59e0b'}
        >{t.calSave}</button>
      </div>
    </div>
  )
}

// ── TradeCard ────────────────────────────────────────────────
function TradeCard({ t, ji, isEd, onToggleEdit, onDelete, onSaveEdit, onCancelEdit, onImageClick }) {
  const pv = parseFloat(t.pnl||0)
  const em = parseInt(t.emotion||0)
  const ec = em<=3?'#00e5b0':em>=7?'#ff4f6b':'#ffc030'
  const hasImage = !!t.image

  if (isEd) return (
    <div style={{ background:'#08101c', border:'1px solid #1c2e4a', borderRadius:'10px', padding:'18px' }}>
      <div style={{ fontFamily:M, fontSize:'9px', color:'#7a96b4', letterSpacing:'1.5px', marginBottom:'14px', fontWeight:600 }}>{t.calEditTitle}</div>
      <EditForm initial={t} onSave={updated => onSaveEdit(ji, updated)} onCancel={onCancelEdit} />
    </div>
  )

  const InfoPanel = () => (
    <div style={{ display:'block', width:'100%' }}>
      {/* Header row — instrument + outcome + pnl + actions */}
      <div style={{ padding:'16px 16px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'7px', flexWrap:'wrap', minWidth:0 }}>
          <span style={{ fontFamily:M, fontSize:'10px', color:'#7a96b4', background:'#0f1828', border:'1px solid #162340', borderRadius:'5px', padding:'3px 8px', fontWeight:600 }}>{t.instrument}</span>
          <span style={{ fontFamily:M, fontSize:'10px', padding:'3px 8px', borderRadius:'5px', background:RBG[t.result]||'#0c1422', color:RC[t.result]||'#7a96b4', fontWeight:700 }}>{RL[t.result]||t.result}</span>
          {t.setup && <span style={{ fontFamily:M, fontSize:'9px', color:'#7a96b4', background:'#0f1828', border:'1px solid #162340', borderRadius:'5px', padding:'3px 7px' }}>{t.setup}</span>}
          {t.tradeTime && <span style={{ fontFamily:M, fontSize:'9px', color:'#6880a0', background:'#0a1020', border:'1px solid #162340', borderRadius:'5px', padding:'3px 7px' }}>{t.tradeTime}</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
          <span style={{ fontFamily:M, fontSize:'18px', fontWeight:700, color:pv>=0?'#00e5b0':'#ff4f6b' }}>{pv>=0?'+':''}${Math.abs(Math.round(pv))}</span>
          <button onClick={onToggleEdit} style={{ background:'none', border:'1px solid #162340', borderRadius:'5px', color:'#7a96b4', fontFamily:M, fontSize:'10px', padding:'4px 9px', cursor:'pointer' }}>✎ Edit</button>
          <button onClick={onDelete} style={{ background:'none', border:'none', color:'#6880a0', cursor:'pointer', fontSize:'16px', padding:'2px 4px' }}>×</button>
        </div>
      </div>

      {/* Emotion bar */}
      {em>0 && (
        <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px', borderTop:'1px solid #0f1828' }}>
          <span style={{ fontFamily:M, fontSize:'8px', color:'#7a96b4', letterSpacing:'1px', flexShrink:0, fontWeight:600 }}>EMOTION</span>
          <div style={{ display:'flex', gap:'2px', flex:1 }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n=><div key={n} style={{ flex:1, height:'4px', borderRadius:'2px', background:n<=em?ec:'#162340' }} />)}
          </div>
          <span style={{ fontFamily:M, fontSize:'10px', color:ec, flexShrink:0, fontWeight:700 }}>{em}/10</span>
        </div>
      )}

      {/* Psych tags */}
      {t.psychTags?.length>0 && (
        <div style={{ padding:'10px 16px 12px', display:'flex', gap:'5px', flexWrap:'wrap', borderTop:'1px solid #0f1828' }}>
          {t.psychTags.map(id => { const tag=PSYCH.find(p=>p.id===id); return tag?<span key={id} style={{ fontFamily:M, fontSize:'9px', color:tag.c, background:tag.bg, border:`1px solid ${tag.c}33`, borderRadius:'5px', padding:'3px 8px', fontWeight:600 }}>{tag.label}</span>:null })}
        </div>
      )}

      {/* Notes */}
      {t.note && (
        <div style={{ padding:'16px', borderTop:'1px solid #0f1828' }}>
          <div style={{ fontFamily:M, fontSize:'8px', color:'#7a96b4', letterSpacing:'1px', marginBottom:'8px', fontWeight:600 }}>NOTES</div>
          <div style={{ fontSize:'14px', color:'#a0c0ca', lineHeight:1.8, whiteSpace:'pre-wrap', wordBreak:'break-word', borderLeft:'2px solid #1c2e4a', paddingLeft:'14px' }}>{t.note}</div>
        </div>
      )}

      {/* Audio memo */}
      {t.audio && (
        <div style={{ padding:'12px 16px', borderTop:'1px solid #0f1828' }}>
          <div style={{ fontFamily:M, fontSize:'8px', color:'#7a96b4', letterSpacing:'1px', marginBottom:'6px', fontWeight:600 }}>RÖSTMEMO</div>
          <audio src={t.audio} controls style={{ width:'100%', height:'32px', display:'block' }} />
        </div>
      )}
    </div>
  )

  // Om trade har en bild visas den ALLTID överst i full bredd nu
  if (hasImage) {
    return (
      <div style={{ 
        background:'#08101c', 
        border:`1px solid ${RBDR[t.result]||'#162340'}`, 
        borderRadius:'10px', 
        overflow:'hidden',
        display:'block',
        width:'100%',
        marginBottom:'14px'
      }}>
        {/* BILDEN HÖGST UPP */}
        <div style={{ 
          background:'#080b0c', 
          width:'100%', 
          padding:'12px', 
          boxSizing:'border-box',
          borderBottom:'1px solid #0f1828'
        }}>
          <img
            src={t.image}
            alt="chart"
            onClick={() => onImageClick(t.image)}
            style={{ 
              width:'100%', 
              height:'auto', 
              maxHeight:'550px', // Sätter ett max-tak så breda skärmar inte gör bilden löjligt hög
              objectFit:'contain',
              display:'block', 
              borderRadius:'6px', 
              cursor:'zoom-in' 
            }}
          />
        </div>

        {/* TEXTEN UNDER BILDEN */}
        <div style={{ width:'100%', boxSizing:'border-box' }}>
          <InfoPanel />
        </div>
      </div>
    )
  }

  // Om ingen bild finns visas bara textpanelen som vanligt
  return (
    <div style={{ background:'#08101c', border:`1px solid ${RBDR[t.result]||'#162340'}`, borderRadius:'10px', overflow:'hidden', marginBottom:'14px' }}>
      <InfoPanel />
    </div>
  )
}

export default function Calendar({ journal=[], onAddTrade, onDeleteTrade, onEditTrade }) {
  const t      = useT()
  const mobile = useIsMobile()
  const [year,  setYear]  = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [sel,          setSel]        = useState(null)
  const [showForm,     setShowForm]   = useState(false)
  const [editingIdx,   setEditingIdx] = useState(null)
  const [tradeFilter,  setTradeFilter] = useState('alla')
  const [lightbox,   setLightbox]   = useState(null)

  useEffect(() => {
    if (sel) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [sel])

  useEffect(() => {
    if (!sel) return
    const onKey = e => { if (e.key === 'Escape') { setSel(null); setShowForm(false); setEditingIdx(null) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel])

  const MONTHS = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December']
  const DAY_LABELS_MOBILE  = ['M','T','O','T','F']
  const DAY_LABELS_DESKTOP = ['M','T','O','T','F','L','S']

  const first      = new Date(year, month, 1)
  const dim        = new Date(year, month+1, 0).getDate()
  const fullOffset = (first.getDay()+6)%7

  const today = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })()

  const allM   = journal.filter(t => { const d=new Date(t.date); return d.getFullYear()===year&&d.getMonth()===month })
  const mT     = allM.filter(t => t.result!=='skip'&&t.result!=='no-setup')
  const mW     = mT.filter(t => WIN_RESULTS.has(t.result)).length
  const mL     = mT.filter(t => t.result==='loss').length
  const mS     = allM.filter(t => t.result==='skip'||t.result==='no-setup').length
  const mPnl   = mT.reduce((s,t) => s+parseFloat(t.pnl||0), 0)
  const mWr    = mT.length>0 ? Math.round(mW/mT.length*100) : 0
  const tDays  = [...new Set(mT.map(t=>t.date))].length
  const avgDay = tDays>0 ? mPnl/tDays : 0

  function getDayStatus(ds) {
    const dt  = journal.filter(t=>t.date===ds); if (!dt.length) return null
    const act = dt.filter(t=>t.result!=='skip'&&t.result!=='no-setup')
    if (!act.length) return 'skip'
    const hl = act.some(t=>t.result==='loss')
    const hw = act.some(t=>WIN_RESULTS.has(t.result))
    if (hl&&!hw) return 'loss'
    if (hw&&!hl) return 'win'
    return 'mixed'
  }

  function getDayStyle(status, pnl) {
    if (status==='win')  return { bg:`rgba(0,40,30,${Math.min(0.2+Math.abs(pnl)/1500,0.5)})`, bdr:'rgba(0,229,176,0.25)', dot:'#00e5b0' }
    if (status==='loss') return { bg:`rgba(40,0,10,${Math.min(0.2+Math.abs(pnl)/800,0.5)})`,  bdr:'rgba(255,79,107,0.25)', dot:'#ff4f6b' }
    if (status==='skip') return { bg:'#0c1422', bdr:'#162340', dot:'#4a6888' }
    return { bg:'#0c1422', bdr:'#162340', dot:'#ffc030' }
  }

  function closeModal() { setSel(null); setShowForm(false); setEditingIdx(null) }
  function prevM() { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1); closeModal() }
  function nextM() { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1); closeModal() }
  function doEdit(ji, updated) { onEditTrade?.(ji, updated); setEditingIdx(null) }

  const buildDesktopWeeks = () => {
    const cells = []
    for(let i=0; i<fullOffset; i++) cells.push({ empty:true })
    for(let d=1; d<=dim; d++) {
      const date = new Date(year, month, d)
      const ds   = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      cells.push({ day:d, ds, isWe:date.getDay()===0||date.getDay()===6 })
    }
    while(cells.length%7!==0) cells.push({ empty:true })
    const weeks = []
    for(let i=0; i<cells.length; i+=7) weeks.push(cells.slice(i,i+7))
    return weeks
  }

  const buildMobileWeeks = () => {
    const weeks = []
    let week = []
    const clampedOffset = Math.min((first.getDay()+6)%7, 4)
    for(let i=0; i<clampedOffset; i++) week.push({ empty:true })
    for(let d=1; d<=dim; d++) {
      const date = new Date(year, month, d)
      const wd   = date.getDay()
      if(wd===0||wd===6) continue
      const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      week.push({ day:d, ds, isWe:false })
      if(week.length===5) { weeks.push(week); week=[] }
    }
    if(week.length>0) { while(week.length<5) week.push({ empty:true }); weeks.push(week) }
    return weeks
  }

  const weeks       = mobile ? buildMobileWeeks() : buildDesktopWeeks()
  const dayLabels   = mobile ? DAY_LABELS_MOBILE : DAY_LABELS_DESKTOP
  const gridCols    = mobile ? 'repeat(5, 1fr)' : 'repeat(7, 1fr) 64px'
  const cellH       = mobile ? '60px' : '100px'

  const selTrades = sel ? journal.filter(t=>t.date===sel) : []
  const filteredSelTrades = selTrades.filter(t => {
    if (tradeFilter === 'wins')   return WIN_RESULTS.has(t.result)
    if (tradeFilter === 'losses') return t.result === 'loss'
    if (tradeFilter === 'be')     return t.result === 'be'
    if (tradeFilter === 'skip')   return t.result === 'skip' || t.result === 'no-setup'
    return true
  })
  const selPnl    = selTrades.filter(t=>t.result!=='skip'&&t.result!=='no-setup').reduce((s,t) => s+parseFloat(t.pnl||0), 0)
  const selWins   = selTrades.filter(t=>WIN_RESULTS.has(t.result)).length
  const selLoss   = selTrades.filter(t=>t.result==='loss').length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

      {/* Month stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
        {[
          { l:'P&L',       v:`${mPnl>=0?'+':''}$${Math.round(mPnl)}`,    c:mPnl>=0?'#00e5b0':'#ff4f6b' },
          { l:'WIN RATE',  v:`${mWr}%`,                                   c:'#00e5b0' },
          { l:'WINS',      v:String(mW),                                  c:'#00e5b0' },
          { l:'LOSSES',    v:String(mL),                                  c:'#ff4f6b' },
          { l:'SKIPS',     v:String(mS),                                  c:'#7a96b4' },
          { l:'SNITT/DAG', v:`${avgDay>=0?'+':''}$${Math.round(avgDay)}`, c:avgDay>=0?'#00e5b0':'#ff4f6b' },
        ].map((s,i) => (
          <div key={i} style={{ background:'#0c1422', border:'1px solid #162340', borderRadius:'10px', padding:'10px 12px' }}>
            <div style={{ fontFamily:M, fontSize:'8px', color:'#7a96b4', letterSpacing:'1.5px', marginBottom:'4px', fontWeight:600 }}>{s.l}</div>
            <div style={{ fontFamily:M, fontSize:'16px', fontWeight:700, color:s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Month nav */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontFamily:M, fontSize:'14px', fontWeight:700, color:'#dce8f5', letterSpacing:'2px' }}>{MONTHS[month].toUpperCase()} {year}</div>
        <div style={{ display:'flex', gap:'5px' }}>
          {[{fn:prevM,l:'‹'},{fn:nextM,l:'›'}].map((b,i) => (
            <button key={i} onClick={b.fn} style={{ background:'#0c1422', border:'1px solid #162340', borderRadius:'7px', padding:'8px 16px', cursor:'pointer', color:'#7a96b4', fontFamily:M, fontSize:'14px', transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#3a5460';e.currentTarget.style.color='#dce8f5'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#162340';e.currentTarget.style.color='#7a96b4'}}>{b.l}</button>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ background:'#0c1422', border:'1px solid #162340', borderRadius:'12px', overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:gridCols, background:'#0a1020', borderBottom:'1px solid #162340' }}>
          {dayLabels.map((d,i) => (
            <div key={i} style={{ fontFamily:M, fontSize:'10px', color:'#7a96b4', textAlign:'center', padding:'12px 4px', letterSpacing:'1.5px', fontWeight:600 }}>{d}</div>
          ))}
          {!mobile && <div style={{ fontFamily:M, fontSize:'9px', color:'#6880a0', textAlign:'center', padding:'12px 4px', borderLeft:'1px solid #162340', fontWeight:600 }}>V</div>}
        </div>

        {weeks.map((week, wi) => {
          const wDates = week.filter(c=>c.ds).map(c=>c.ds)
          const wT     = journal.filter(t=>wDates.includes(t.date)&&t.result!=='skip'&&t.result!=='no-setup')
          const wPnl   = wT.reduce((s,t)=>s+parseFloat(t.pnl||0),0)
          const wW     = wT.filter(t=>WIN_RESULTS.has(t.result)).length
          const wWr    = wT.length>0?Math.round(wW/wT.length*100):null

          return (
            <div key={wi} style={{ display:'grid', gridTemplateColumns:gridCols }}>
              {week.map((cell, ci) => {
                if (cell.empty) return <div key={ci} style={{ minHeight:cellH, borderRight:'1px solid #0f1828', borderBottom:'1px solid #0f1828', background:'#0a1020' }} />
                const { day, ds } = cell
                const dT   = journal.filter(t=>t.date===ds)
                const aT   = dT.filter(t=>t.result!=='skip'&&t.result!=='no-setup')
                const isTd = ds===today
                const stat = getDayStatus(ds)
                const dPnl = aT.reduce((s,t)=>s+parseFloat(t.pnl||0),0)
                const sc   = stat?getDayStyle(stat,dPnl):null

                return (
                  <div key={ci}
                    onClick={() => { setSel(ds); setShowForm(false); setEditingIdx(null) }}
                    style={{
                      minHeight:cellH, borderRight:'1px solid #0f1828', borderBottom:'1px solid #0f1828',
                      padding: mobile?'8px 6px':'8px',
                      background: sc?.bg||(isTd?'rgba(0,229,176,0.03)':'transparent'),
                      cursor:'pointer', position:'relative', transition:'background 0.15s, transform 0.1s',
                    }}
                    onMouseEnter={e=>{ if(!mobile) e.currentTarget.style.background = sc?.bg ? sc.bg : 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={e=>{ if(!mobile) e.currentTarget.style.background = sc?.bg||(isTd?'rgba(0,229,176,0.03)':'transparent') }}
                  >
                    {isTd && <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'#007d5e' }} />}
                    <div style={{ fontFamily:M, fontSize:'11px', color:isTd?'#00e5b0':'#a0c0ca', fontWeight:isTd?700:500, marginBottom:'4px' }}>{day}</div>
                    {!mobile && aT.map((t,ti) => (
                      <div key={ti} style={{ fontFamily:M, fontSize:'8px', padding:'2px 5px', borderRadius:'3px', background:RBG[t.result]||'#0c1422', color:RC[t.result]||'#7a96b4', display:'inline-block', marginBottom:'2px', marginRight:'2px', fontWeight:600 }}>
                        {RL[t.result]||t.result}
                      </div>
                    ))}
                    {mobile && stat && <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:sc?.dot, marginBottom:'2px' }} />}
                    {aT.length>0 && (
                      <div style={{ fontFamily:M, fontSize:mobile?'12px':'11px', fontWeight:700, color:dPnl>=0?'#00e5b0':'#ff4f6b' }}>
                        {dPnl>=0?'+':''}${Math.abs(Math.round(dPnl))}
                      </div>
                    )}
                  </div>
                )
              })}

              {!mobile && (
                <div style={{ minHeight:cellH, borderBottom:'1px solid #0f1828', borderLeft:'1px solid #162340', padding:'8px 6px', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap:'2px', background:'#0a1020' }}>
                  {wT.length>0 ? (
                    <>
                      <div style={{ fontFamily:M, fontSize:'11px', fontWeight:700, color:wPnl>=0?'#00e5b0':'#ff4f6b' }}>{wPnl>=0?'+':''}${Math.abs(Math.round(wPnl))}</div>
                      {wWr!==null && <div style={{ fontFamily:M, fontSize:'9px', color:wWr>=50?'#00e5b0':'#ff4f6b' }}>{wWr}%</div>}
                      <div style={{ fontFamily:M, fontSize:'8px', color:'#7a96b4' }}>{wT.length}t</div>
                    </>
                  ) : <div style={{ fontFamily:M, fontSize:'10px', color:'#3a5878' }}>—</div>}
                </div>
              )}
            </div>
          )
        })}
      </div>

{/* MODAL */}
      {sel && (
        <div
          onClick={closeModal}
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)',
            zIndex:1000, display:'flex', alignItems: mobile?'flex-end':'center', justifyContent:'center',
            padding: mobile?'0':'24px',
            animation:'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:'#0c1422', border:'1px solid #162340',
              borderRadius: mobile?'16px 16px 0 0':'14px',
              width: mobile?'100%':'min(1020px, 100%)',
              height: mobile?'92vh':'auto',
              maxHeight: mobile?'92vh':'85vh',
              display:'flex', flexDirection:'column', overflow:'hidden',
              boxShadow:'0 24px 80px rgba(0,0,0,0.6)',
              animation: mobile?'slideUp 0.25s ease':'scaleIn 0.2s ease',
            }}
          >
            {/* Modal header */}
            <div style={{
              padding:'16px 18px', borderBottom:'1px solid #162340',
              display:'flex', justifyContent:'space-between', alignItems:'center',
              flexShrink:0, background:'#0a1020',
            }}>
              <div>
                <div style={{ fontFamily:M, fontSize:'9px', color:'#7a96b4', letterSpacing:'2px', marginBottom:'4px', fontWeight:600 }}>
                  {new Date(sel+'T12:00:00').toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'}).toUpperCase()}
                </div>
                {selTrades.filter(t=>t.result!=='skip'&&t.result!=='no-setup').length>0 ? (
                  <div style={{ display:'flex', alignItems:'baseline', gap:'10px', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:M, fontSize:'24px', fontWeight:700, color:selPnl>=0?'#00e5b0':'#ff4f6b' }}>
                      {selPnl>=0?'+':''}${Math.round(selPnl)}
                    </span>
                    <span style={{ fontFamily:M, fontSize:'10px', color:'#7a96b4' }}>
                      {selWins>0 && <span style={{ color:'#00e5b0' }}>{selWins}W</span>}
                      {selWins>0 && selLoss>0 && ' · '}
                      {selLoss>0 && <span style={{ color:'#ff4f6b' }}>{selLoss}L</span>}
                    </span>
                  </div>
                ) : (
                  <div style={{ fontFamily:M, fontSize:'13px', color:'#7a96b4' }}>Ingen aktivitet</div>
                )}
              </div>
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                {!showForm && (
                  <button onClick={() => { setShowForm(true); setEditingIdx(null) }} style={{
                    background:'#f59e0b', color:'#0a0700', fontFamily:M, fontSize:'11px', fontWeight:700,
                    padding:'9px 16px', borderRadius:'7px', border:'none', cursor:'pointer',
                    letterSpacing:'1px', transition:'background 0.15s',
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background='#d97706'}
                    onMouseLeave={e=>e.currentTarget.style.background='#f59e0b'}
                  >+ NY TRADE</button>
                )}
                <button onClick={closeModal} style={{
                  background:'transparent', border:'1px solid #1c2e4a', borderRadius:'7px',
                  color:'#7a96b4', cursor:'pointer', fontSize:'18px',
                  width:'34px', height:'34px', lineHeight:1, transition:'all 0.15s',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='#3a5460';e.currentTarget.style.color='#dce8f5'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#1c2e4a';e.currentTarget.style.color='#7a96b4'}}
                >×</button>
              </div>
            </div>

            {/* Modal body — HÄR AKTIVERAS ALL SCROLL */}
            <div style={{
              flex:1,
              overflowY:'auto',
              padding:'16px 18px', 
              display:'block', // Ändrat från flex till block för säkrare scrollhantering
              background:'#0c1422',
              WebkitOverflowScrolling:'touch',
            }}>
              {showForm && (
                <div style={{ background:'#08101c', border:'1px solid #1c2e4a', borderRadius:'10px', padding:'18px', marginBottom:'12px' }}>
                  <div style={{ fontFamily:M, fontSize:'9px', color:'#00e5b0', letterSpacing:'1.5px', marginBottom:'14px', fontWeight:700 }}>{t.calNewTrade}</div>
                  <EditForm
                    onSave={trade => { onAddTrade({ date:sel, ...trade, timestamp:new Date().toISOString() }); setShowForm(false) }}
                    onCancel={() => setShowForm(false)}
                  />
                </div>
              )}

              {selTrades.length > 0 && (
                <div style={{ display:'flex', gap:'5px', marginBottom:'12px', flexWrap:'wrap' }}>
                  {[['alla','Alla'],['wins','Wins'],['losses','Loss'],['be','BE'],['skip','Skip']].map(([v,l]) => (
                    <button key={v} onClick={()=>setTradeFilter(v)} style={{
                      fontFamily:M, fontSize:'8px', padding:'4px 10px', borderRadius:'5px',
                      border:`1px solid ${tradeFilter===v?'rgba(245,158,11,0.4)':'#162340'}`,
                      background:tradeFilter===v?'#18100a':'#0a1020',
                      color:tradeFilter===v?'#f59e0b':'#6880a0',
                      cursor:'pointer', transition:'all 0.12s',
                    }}>{l}</button>
                  ))}
                </div>
              )}

              {filteredSelTrades.length===0 && !showForm && (
                <div style={{ fontFamily:M, fontSize:'13px', color:'#6880a0', padding:'48px 0', textAlign:'center' }}>
                  <div style={{ fontSize:'32px', marginBottom:'10px', opacity:0.4 }}>—</div>
                  <div>{t.calNoTrades}</div>
                  <div style={{ fontSize:'10px', marginTop:'6px', color:'#3a5878' }}>{t.calAddFirst}</div>
                </div>
              )}

              {filteredSelTrades.map((t, i) => {
                const ji = journal.findIndex(j => j===t)
                return (
                  <div key={i} style={{ marginBottom:'12px' }}>
                    <TradeCard
                      t={t}
                      ji={ji}
                      isEd={editingIdx===ji}
                      onToggleEdit={() => setEditingIdx(editingIdx===ji?null:ji)}
                      onDelete={() => onDeleteTrade?.(ji)}
                      onSaveEdit={doEdit}
                      onCancelEdit={() => setEditingIdx(null)}
                      onImageClick={img => setLightbox(img)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.96)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out', padding:'20px' }}>
          <img src={lightbox} alt="chart" style={{ maxWidth:'96vw', maxHeight:'92vh', borderRadius:'10px', border:'1px solid #1c2e4a', objectFit:'contain' }} />
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes scaleIn { from { transform: scale(0.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>
    </div>
  )
}