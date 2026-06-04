import { useState, useRef } from 'react'

const M = "'JetBrains Mono', monospace"
const WIN = new Set(['win','win2','tp1','tp2','tp3'])

const inp  = { width:'100%', background:'#0a0e10', border:'1px solid #263840', borderRadius:'8px', color:'#d0e8ec', fontSize:'14px', padding:'10px 12px', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s', fontFamily:'inherit' }
const lbl  = { fontFamily:M, fontSize:'8px', color:'#85a4ad', letterSpacing:'2px', marginBottom:'5px', display:'block' }

const INSTRUMENTS = ['MYM','YM','MNQ','NQ','MES','ES','M2K','RTY','MGC','GC','MCL','CL']

// ── Setup form ────────────────────────────────────────────────
function SetupForm({ initial = {}, onSave, onCancel }) {
  const [name,         setName]         = useState(initial.name         || '')
  const [description,  setDescription]  = useState(initial.description  || '')
  const [criteria,     setCriteria]     = useState(initial.criteria     || [''])
  const [invalidation, setInvalidation] = useState(initial.invalidation || '')
  const [instruments,  setInstruments]  = useState(initial.instruments  || [])
  const [notes,        setNotes]        = useState(initial.notes        || '')
  const [image,        setImage]        = useState(initial.image        || null)
  const [imgPrev,      setImgPrev]      = useState(initial.image        || null)
  const fileRef = useRef()

  function handleImg(e) {
    const f = e.target.files[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => { setImage(ev.target.result); setImgPrev(ev.target.result) }
    r.readAsDataURL(f)
  }

  function addCriteria()          { setCriteria(c => [...c, '']) }
  function removeCriteria(i)      { setCriteria(c => c.filter((_,idx) => idx !== i)) }
  function setCriteriaItem(i, v)  { setCriteria(c => c.map((x,idx) => idx===i ? v : x)) }
  function toggleInstr(instr)     { setInstruments(p => p.includes(instr) ? p.filter(x=>x!==instr) : [...p, instr]) }

  function save() {
    if (!name.trim()) return
    onSave({ ...initial, name: name.trim(), description, criteria: criteria.filter(Boolean), invalidation, instruments, notes, image: image||null })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

      <div>
        <span style={lbl}>NAMN *</span>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="t.ex. BTB Setup" style={inp}
          onFocus={e=>e.target.style.borderColor='#5a7a84'} onBlur={e=>e.target.style.borderColor='#263840'} />
      </div>

      <div>
        <span style={lbl}>BESKRIVNING</span>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Kort beskrivning av setuppet..."
          style={{...inp,resize:'vertical',minHeight:'70px',lineHeight:1.6}}
          onFocus={e=>e.target.style.borderColor='#5a7a84'} onBlur={e=>e.target.style.borderColor='#263840'} />
      </div>

      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
          <span style={lbl}>INTRÄDESKRITERIER</span>
          <button type="button" onClick={addCriteria} style={{ background:'none', border:'1px solid #263840', borderRadius:'4px', color:'#85a4ad', fontFamily:M, fontSize:'9px', padding:'2px 8px', cursor:'pointer' }}>+ Lägg till</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
          {criteria.map((c,i) => (
            <div key={i} style={{ display:'flex', gap:'5px', alignItems:'center' }}>
              <span style={{ fontFamily:M, fontSize:'10px', color:'#5a7a84', width:'14px', flexShrink:0 }}>{i+1}.</span>
              <input value={c} onChange={e=>setCriteriaItem(i,e.target.value)} placeholder={`Kriterium ${i+1}`} style={{...inp,flex:1}}
                onFocus={e=>e.target.style.borderColor='#5a7a84'} onBlur={e=>e.target.style.borderColor='#263840'} />
              {criteria.length > 1 && (
                <button type="button" onClick={()=>removeCriteria(i)} style={{ background:'none', border:'none', color:'#5a7a84', cursor:'pointer', fontSize:'14px', padding:'0 4px', flexShrink:0 }}>×</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <span style={lbl}>INVALIDERING</span>
        <input value={invalidation} onChange={e=>setInvalidation(e.target.value)} placeholder="Setuppet är ogiltigt om..."
          style={inp} onFocus={e=>e.target.style.borderColor='#5a7a84'} onBlur={e=>e.target.style.borderColor='#263840'} />
      </div>

      <div>
        <span style={lbl}>INSTRUMENT</span>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
          {INSTRUMENTS.map(instr => {
            const active = instruments.includes(instr)
            return (
              <button key={instr} type="button" onClick={()=>toggleInstr(instr)} style={{
                fontFamily:M, fontSize:'9px', padding:'5px 10px', borderRadius:'5px',
                background: active?'#001810':'#0d1214',
                border: `1px solid ${active?'rgba(0,229,176,0.3)':'#1e2c32'}`,
                color: active?'#00e5b0':'#85a4ad', cursor:'pointer', transition:'all 0.12s',
              }}>{instr}</button>
            )
          })}
        </div>
      </div>

      <div>
        <span style={lbl}>CHART BILD (REFERENS)</span>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{ display:'none' }} />
        {!imgPrev ? (
          <button type="button" onClick={()=>fileRef.current?.click()} style={{ width:'100%', background:'#0d1214', border:'2px dashed #263840', borderRadius:'8px', color:'#85a4ad', fontFamily:M, fontSize:'10px', padding:'14px', cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#00e5b0';e.currentTarget.style.color='#00e5b0'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#263840';e.currentTarget.style.color='#85a4ad'}}>
            <span style={{fontSize:'15px'}}>+</span> Ladda upp referensbild
          </button>
        ) : (
          <div style={{ position:'relative', borderRadius:'8px', overflow:'hidden', border:'1px solid #263840' }}>
            <img src={imgPrev} alt="referens" style={{ width:'100%', display:'block', maxHeight:'200px', objectFit:'contain', background:'#060809' }} />
            <button type="button" onClick={()=>fileRef.current?.click()} style={{ position:'absolute',top:'6px',left:'6px',background:'rgba(6,8,9,0.88)',border:'1px solid #263840',borderRadius:'5px',color:'#85a4ad',fontFamily:M,fontSize:'9px',padding:'4px 8px',cursor:'pointer' }}>↻ Byt</button>
            <button type="button" onClick={()=>{setImage(null);setImgPrev(null)}} style={{ position:'absolute',top:'6px',right:'6px',background:'rgba(6,8,9,0.88)',border:'1px solid rgba(255,79,107,0.3)',borderRadius:'5px',color:'#ff4f6b',fontFamily:M,fontSize:'9px',padding:'4px 8px',cursor:'pointer' }}>✕</button>
          </div>
        )}
      </div>

      <div>
        <span style={lbl}>ANTECKNINGAR</span>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Extra info, kontext, tips..."
          style={{...inp,resize:'vertical',minHeight:'80px',lineHeight:1.6}}
          onFocus={e=>e.target.style.borderColor='#5a7a84'} onBlur={e=>e.target.style.borderColor='#263840'} />
      </div>

      <div style={{ display:'flex', gap:'8px' }}>
        <button type="button" onClick={save} style={{ flex:1, background:'#00e5b0', color:'#020f08', fontFamily:M, fontSize:'11px', fontWeight:700, padding:'12px', borderRadius:'8px', border:'none', cursor:'pointer', letterSpacing:'1px' }}
          onMouseEnter={e=>e.currentTarget.style.background='#00c49a'}
          onMouseLeave={e=>e.currentTarget.style.background='#00e5b0'}>
          {initial.id ? 'SPARA ÄNDRINGAR' : 'SKAPA SETUP'}
        </button>
        <button type="button" onClick={onCancel} style={{ background:'transparent', color:'#85a4ad', fontFamily:M, fontSize:'10px', padding:'12px 16px', borderRadius:'8px', border:'1px solid #1e2c32', cursor:'pointer' }}>Avbryt</button>
      </div>
    </div>
  )
}

// ── Main Playbook ─────────────────────────────────────────────
export default function Playbook({ playbook = [], onSaveSetup, onDeleteSetup, journal = [] }) {
  const [showForm,  setShowForm]  = useState(false)
  const [editId,    setEditId]    = useState(null)
  const [expandId,  setExpandId]  = useState(null)
  const [zoomImage, setZoomImage] = useState(null)
  const [confirmDel,setConfirmDel]= useState(null)

  // Build per-setup stats + trends from journal (match by name, case-insensitive)
  const setupStats = {}
  const setupTrades = {}
  journal.filter(t => t.setup && !['skip','no-setup'].includes(t.result)).forEach(t => {
    const k = t.setup.trim().toLowerCase()
    if (!setupStats[k])  setupStats[k]  = { wins:0, total:0, pnl:0 }
    if (!setupTrades[k]) setupTrades[k] = []
    setupStats[k].total++
    setupStats[k].pnl += parseFloat(t.pnl||0)
    if (WIN.has(t.result)) setupStats[k].wins++
    setupTrades[k].push(t)
  })

  function getStats(name) { return setupStats[name?.trim().toLowerCase()] || null }

  function getTrend(name) {
    const k   = name?.trim().toLowerCase()
    const all = (setupTrades[k] || []).sort((a,b) => a.date.localeCompare(b.date))
    const s   = setupStats[k]
    if (!s || s.total < 3) return null
    const last5 = all.slice(-5)
    const l5wr  = last5.filter(t => WIN.has(t.result)).length / last5.length
    const totwr = s.wins / s.total
    if (last5.length < 3) return null
    if (l5wr - totwr >  0.1) return { arrow:'↑', color:'#00e5b0', l5pct: Math.round(l5wr*100) }
    if (totwr - l5wr >  0.1) return { arrow:'↓', color:'#ff4f6b', l5pct: Math.round(l5wr*100) }
    return { arrow:'→', color:'#ffc030', l5pct: Math.round(l5wr*100) }
  }

  const editSetup = playbook.find(s => s.id === editId)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:M, fontSize:'10px', color:'#7090a0', letterSpacing:'2px' }}>TRADING PLAYBOOK</div>
          <div style={{ fontFamily:M, fontSize:'9px', color:'#4a6470', marginTop:'3px' }}>{playbook.length} setup{playbook.length !== 1 ? 's' : ''}</div>
        </div>
        <button type="button" onClick={()=>{setShowForm(true);setEditId(null)}} style={{ background:'#00e5b0', color:'#020f08', fontFamily:M, fontSize:'10px', fontWeight:700, padding:'9px 16px', borderRadius:'8px', border:'none', cursor:'pointer', letterSpacing:'1px' }}
          onMouseEnter={e=>e.currentTarget.style.background='#00c49a'}
          onMouseLeave={e=>e.currentTarget.style.background='#00e5b0'}>
          + NEW SETUP
        </button>
      </div>

      {/* Add form */}
      {showForm && !editId && (
        <div style={{ background:'#111820', border:'1px solid #263840', borderRadius:'12px', padding:'18px' }}>
          <div style={{ fontFamily:M, fontSize:'9px', color:'#85a4ad', letterSpacing:'2px', marginBottom:'14px' }}>NEW SETUP</div>
          <SetupForm onSave={s=>{onSaveSetup(s);setShowForm(false)}} onCancel={()=>setShowForm(false)} />
        </div>
      )}

      {/* Empty state */}
      {playbook.length === 0 && !showForm && (
        <div style={{ background:'#111820', border:'1px solid #1e2c32', borderRadius:'12px', padding:'40px 20px', textAlign:'center' }}>
          <div style={{ fontFamily:M, fontSize:'11px', color:'#4a6470', marginBottom:'8px' }}>Inga setups ännu</div>
          <div style={{ fontFamily:M, fontSize:'9px', color:'#3a5060' }}>Klicka "+ Nytt setup" för att dokumentera din första strategi</div>
        </div>
      )}

      {/* Setup cards */}
      {playbook.map(setup => {
        const stats   = getStats(setup.name)
        const trend   = getTrend(setup.name)
        const wr      = stats ? Math.round(stats.wins / stats.total * 100) : null
        const isExp   = expandId === setup.id
        const isEdit  = editId   === setup.id

        return (
          <div key={setup.id} style={{ background:'#111820', border:'1px solid #1e2c32', borderRadius:'12px', overflow:'hidden', transition:'border-color 0.15s' }}>

            {/* Card header */}
            <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer' }} onClick={()=>setExpandId(isExp?null:setup.id)}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                  <span style={{ fontFamily:M, fontSize:'14px', fontWeight:700, color:'#d0e8ec' }}>{setup.name}</span>
                  {trend && (
                    <span style={{ fontFamily:M, fontSize:'13px', fontWeight:700, color:trend.color }} title={`Sista 5: ${trend.l5pct}% WR`}>
                      {trend.arrow}
                    </span>
                  )}
                  {trend && (
                    <span style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84' }}>sista 5: {trend.l5pct}%</span>
                  )}
                  {setup.instruments?.length > 0 && setup.instruments.map(instr => (
                    <span key={instr} style={{ fontFamily:M, fontSize:'8px', color:'#88a8ae', background:'#161e24', border:'1px solid #1e2c32', borderRadius:'4px', padding:'2px 6px' }}>{instr}</span>
                  ))}
                </div>
                {setup.description && (
                  <div style={{ fontFamily:M, fontSize:'10px', color:'#5a7a84', marginTop:'4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{setup.description}</div>
                )}
              </div>

              {/* Stats from journal */}
              {stats && (
                <div style={{ display:'flex', gap:'12px', flexShrink:0 }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84', letterSpacing:'1px' }}>WR</div>
                    <div style={{ fontFamily:M, fontSize:'14px', fontWeight:700, color:wr>=50?'#00e5b0':'#ff4f6b' }}>{wr}%</div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84', letterSpacing:'1px' }}>P&L</div>
                    <div style={{ fontFamily:M, fontSize:'14px', fontWeight:700, color:stats.pnl>=0?'#00e5b0':'#ff4f6b' }}>{stats.pnl>=0?'+':''}${Math.round(stats.pnl)}</div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84', letterSpacing:'1px' }}>TRADES</div>
                    <div style={{ fontFamily:M, fontSize:'14px', fontWeight:700, color:'#88a8ae' }}>{stats.total}</div>
                  </div>
                </div>
              )}

              <span style={{ color:'#5a7a84', fontSize:'10px', transition:'transform 0.2s', display:'inline-block', transform:isExp?'rotate(180deg)':'none', flexShrink:0 }}>▼</span>
            </div>

            {/* Expanded detail */}
            {isExp && !isEdit && (
              <div style={{ borderTop:'1px solid #161e24' }}>

                {/* Reference image */}
                {setup.image && (
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid #161e24' }}>
                    <img src={setup.image} alt="referens" onClick={()=>setZoomImage(setup.image)} style={{ width:'100%', maxHeight:'300px', objectFit:'contain', borderRadius:'6px', background:'#060809', cursor:'zoom-in', display:'block' }} />
                  </div>
                )}

                {/* Criteria */}
                {setup.criteria?.length > 0 && (
                  <div style={{ padding:'14px 16px', borderBottom:'1px solid #161e24' }}>
                    <div style={{ fontFamily:M, fontSize:'8px', color:'#85a4ad', letterSpacing:'2px', marginBottom:'8px' }}>INTRÄDESKRITERIER</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                      {setup.criteria.map((c,i) => (
                        <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                          <span style={{ fontFamily:M, fontSize:'10px', color:'#00e5b0', flexShrink:0, marginTop:'1px' }}>✓</span>
                          <span style={{ fontSize:'13px', color:'#a0c0ca', lineHeight:1.5 }}>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Invalidation */}
                {setup.invalidation && (
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid #161e24' }}>
                    <div style={{ fontFamily:M, fontSize:'8px', color:'#85a4ad', letterSpacing:'2px', marginBottom:'6px' }}>INVALIDERING</div>
                    <div style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                      <span style={{ fontFamily:M, fontSize:'10px', color:'#ff4f6b', flexShrink:0, marginTop:'1px' }}>✗</span>
                      <span style={{ fontSize:'13px', color:'#a0c0ca', lineHeight:1.5 }}>{setup.invalidation}</span>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {setup.notes && (
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid #161e24' }}>
                    <div style={{ fontFamily:M, fontSize:'8px', color:'#85a4ad', letterSpacing:'2px', marginBottom:'6px' }}>ANTECKNINGAR</div>
                    <div style={{ fontSize:'13px', color:'#88a8ae', lineHeight:1.7, whiteSpace:'pre-wrap', borderLeft:'2px solid #1e2c32', paddingLeft:'10px' }}>{setup.notes}</div>
                  </div>
                )}

                {/* Linked trades from journal */}
                {stats && (
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid #161e24' }}>
                    <div style={{ fontFamily:M, fontSize:'8px', color:'#85a4ad', letterSpacing:'2px', marginBottom:'10px' }}>LÄNKADE TRADES FRÅN JOURNALEN</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                      {[
                        { label:'WIN RATE', value:`${wr}%`, color:wr>=50?'#00e5b0':'#ff4f6b' },
                        { label:'TOTAL P&L', value:`${stats.pnl>=0?'+':''}$${Math.round(stats.pnl)}`, color:stats.pnl>=0?'#00e5b0':'#ff4f6b' },
                        { label:'TRADES', value:String(stats.total), color:'#88a8ae' },
                      ].map((item,i) => (
                        <div key={i} style={{ background:'#0d1214', border:'1px solid #1e2c32', borderRadius:'8px', padding:'10px 12px' }}>
                          <div style={{ fontFamily:M, fontSize:'7px', color:'#5a7a84', letterSpacing:'1px', marginBottom:'4px' }}>{item.label}</div>
                          <div style={{ fontFamily:M, fontSize:'18px', fontWeight:700, color:item.color }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ padding:'10px 16px', display:'flex', gap:'8px' }}>
                  <button type="button" onClick={()=>{setEditId(setup.id);setExpandId(null)}} style={{ background:'none', border:'1px solid #263840', borderRadius:'6px', color:'#85a4ad', fontFamily:M, fontSize:'9px', padding:'6px 14px', cursor:'pointer', transition:'all 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#5a7a84';e.currentTarget.style.color='#d0e8ec'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='#263840';e.currentTarget.style.color='#85a4ad'}}>✎ Redigera</button>
                  {confirmDel === setup.id ? (
                    <>
                      <button type="button" onClick={()=>{onDeleteSetup(setup.id);setConfirmDel(null);setExpandId(null)}} style={{ background:'#1a0610', border:'1px solid rgba(255,79,107,0.4)', borderRadius:'6px', color:'#ff4f6b', fontFamily:M, fontSize:'9px', padding:'6px 14px', cursor:'pointer' }}>Ja, radera</button>
                      <button type="button" onClick={()=>setConfirmDel(null)} style={{ background:'none', border:'1px solid #1e2c32', borderRadius:'6px', color:'#85a4ad', fontFamily:M, fontSize:'9px', padding:'6px 12px', cursor:'pointer' }}>Avbryt</button>
                    </>
                  ) : (
                    <button type="button" onClick={()=>setConfirmDel(setup.id)} style={{ background:'none', border:'none', color:'#5a7a84', fontFamily:M, fontSize:'9px', padding:'6px', cursor:'pointer' }}>Radera</button>
                  )}
                </div>
              </div>
            )}

            {/* Edit form */}
            {isEdit && (
              <div style={{ borderTop:'1px solid #263840', padding:'16px' }}>
                <div style={{ fontFamily:M, fontSize:'9px', color:'#85a4ad', letterSpacing:'2px', marginBottom:'14px' }}>EDIT SETUP</div>
                <SetupForm
                  initial={editSetup}
                  onSave={s=>{onSaveSetup(s);setEditId(null)}}
                  onCancel={()=>setEditId(null)}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Lightbox */}
      {zoomImage && (
        <div onClick={()=>setZoomImage(null)} style={{ position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.92)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',cursor:'zoom-out' }}>
          <img src={zoomImage} alt="fullscreen" style={{ maxWidth:'100%',maxHeight:'100%',borderRadius:'8px',objectFit:'contain' }} />
          <button type="button" onClick={()=>setZoomImage(null)} style={{ position:'fixed',top:'16px',right:'16px',background:'rgba(6,8,9,0.9)',border:'1px solid #263840',borderRadius:'8px',color:'#85a4ad',fontFamily:M,fontSize:'13px',padding:'6px 12px',cursor:'pointer' }}>✕</button>
        </div>
      )}
    </div>
  )
}
