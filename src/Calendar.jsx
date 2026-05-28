import { useState, useRef, useEffect } from 'react'

const M = "'JetBrains Mono', monospace"
function useIsMobile(){ const[m,setM]=useState(()=>window.innerWidth<768); useEffect(()=>{ const h=()=>setM(window.innerWidth<768); window.addEventListener('resize',h); return()=>window.removeEventListener('resize',h) },[]); return m }

const PSYCH=[{id:'patient',label:'Tålmodig',c:'#00e5b0',bg:'#001810'},{id:'aplus',label:'A+ Setup',c:'#00e5b0',bg:'#001810'},{id:'setforget',label:'Set & Forget',c:'#00e5b0',bg:'#001810'},{id:'managed',label:'Hanterat bra',c:'#00e5b0',bg:'#001810'},{id:'fomo',label:'FOMO',c:'#ff4f6b',bg:'#1a0610'},{id:'revenge',label:'Hämndtrade',c:'#ff4f6b',bg:'#1a0610'},{id:'forced',label:'Forcerat',c:'#ffc030',bg:'#1a1000'},{id:'oversize',label:'Överposad',c:'#ff4f6b',bg:'#1a0610'}]
const RBG={win:'#001810',win2:'#001810',loss:'#1a0610',be:'#111820',skip:'#1a1000','no-setup':'#0d1214'}
const RBDR={win:'rgba(0,229,176,0.2)',win2:'rgba(0,229,176,0.2)',loss:'rgba(255,79,107,0.2)',be:'rgba(106,138,144,0.15)',skip:'rgba(255,192,48,0.15)','no-setup':'#182025'}
const RC={win:'#00e5b0',win2:'#00e5b0',loss:'#ff4f6b',be:'#6a8a90',skip:'#ffc030','no-setup':'#2a3c42'}
const inp={width:'100%',background:'#080b0c',border:'1px solid #1e2c32',borderRadius:'8px',color:'#d0e8ec',fontSize:'15px',padding:'10px 12px',outline:'none',boxSizing:'border-box',transition:'border-color 0.15s'}
const lbl={fontFamily:M,fontSize:'8px',color:'#2a3c42',letterSpacing:'2px',marginBottom:'5px',display:'block'}

export default function Calendar({ journal=[], onAddTrade, onDeleteTrade }) {
  const mobile = useIsMobile()
  const[year,setYear]=useState(new Date().getFullYear())
  const[month,setMonth]=useState(new Date().getMonth())
  const[sel,setSel]=useState(null)
  const[showForm,setShowForm]=useState(false)
  const[lightbox,setLightbox]=useState(null)
  const fileRef=useRef()
  const[result,setResult]=useState('')
  const[instrument,setInstrument]=useState('MYM')
  const[pnl,setPnl]=useState('')
  const[note,setNote]=useState('')
  const[emotion,setEmotion]=useState('3')
  const[setup,setSetup]=useState('')
  const[psychTags,setPsychTags]=useState([])
  const[image,setImage]=useState(null)
  const[imgPrev,setImgPrev]=useState(null)

  const MONTHS=['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December']
  const first=new Date(year,month,1), dim=new Date(year,month+1,0).getDate(), off=(first.getDay()+6)%7
  const today=(()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})()

  const allM=journal.filter(t=>{const d=new Date(t.date);return d.getFullYear()===year&&d.getMonth()===month})
  const mT=allM.filter(t=>t.result!=='skip'&&t.result!=='no-setup')
  const mW=mT.filter(t=>t.result==='win'||t.result==='win2').length
  const mL=mT.filter(t=>t.result==='loss').length
  const mS=allM.filter(t=>t.result==='skip'||t.result==='no-setup').length
  const mPnl=mT.reduce((s,t)=>s+parseFloat(t.pnl||0),0)
  const mWr=mT.length>0?Math.round(mW/mT.length*100):0
  const tDays=[...new Set(mT.map(t=>t.date))].length
  const avgDay=tDays>0?mPnl/tDays:0

  function getDayStatus(ds){
    const dt=journal.filter(t=>t.date===ds); if(!dt.length)return null
    const hasSkip=dt.every(t=>t.result==='skip'||t.result==='no-setup'); if(hasSkip)return'skip'
    const act=dt.filter(t=>t.result!=='skip'&&t.result!=='no-setup'); if(!act.length)return'skip'
    const hl=act.some(t=>t.result==='loss'),hw=act.some(t=>t.result==='win'||t.result==='win2')
    if(hl&&!hw)return'loss'; if(hw&&!hl)return'win'; return'mixed'
  }

  function getDayBg(status,pnl){
    if(status==='skip')return{bg:'#0f1200',bdr:'rgba(255,192,48,0.15)',dot:'#ffc030'}
    if(status==='win'){const i=Math.min(Math.abs(pnl)/800,1);return{bg:`rgba(0,${Math.round(30+i*30)+20},${Math.round(30+i*30)},0.3)`,bdr:'rgba(0,229,176,0.2)',dot:'#00e5b0'}}
    if(status==='loss'){const i=Math.min(Math.abs(pnl)/500,1);return{bg:`rgba(${Math.round(30+i*20)+15},8,15,0.4)`,bdr:'rgba(255,79,107,0.2)',dot:'#ff4f6b'}}
    return{bg:'#0f1200',bdr:'rgba(255,192,48,0.15)',dot:'#ffc030'}
  }

  const cells=[]; for(let i=0;i<off;i++)cells.push({empty:true}); for(let d=1;d<=dim;d++){const ds=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;cells.push({day:d,ds})} while(cells.length%7!==0)cells.push({empty:true})
  const weeks=[]; for(let i=0;i<cells.length;i+=7)weeks.push(cells.slice(i,i+7))
  const selTrades=sel?journal.filter(t=>t.date===sel):[]
  const selPnl=selTrades.reduce((s,t)=>s+parseFloat(t.pnl||0),0)

  function resetForm(){setResult('');setPnl('');setNote('');setEmotion('3');setSetup('');setPsychTags([]);setImage(null);setImgPrev(null);setShowForm(false)}
  function prevM(){if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1);setSel(null);resetForm()}
  function nextM(){if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1);setSel(null);resetForm()}
  function handleImg(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setImage(ev.target.result);setImgPrev(ev.target.result)};r.readAsDataURL(f)}
  function toggleTag(id){setPsychTags(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])}
  function doAdd(){if(!result||!sel)return;onAddTrade({date:sel,result,instrument,pnl:pnl||'0',note,emotion,setup,psychTags,image:image||null,timestamp:new Date().toISOString()});resetForm()}

  const cellH=mobile?'46px':'100px'

  const Form=()=>(
    <div style={{background:'#080b0c',border:'1px solid #1e2c32',borderRadius:'10px',padding:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
        <div><span style={lbl}>OUTCOME</span><select value={result} onChange={e=>setResult(e.target.value)} style={{...inp,fontFamily:M}}><option value="">Välj...</option><option value="win">Win +3R</option><option value="win2">Win +2R</option><option value="loss">Loss −1R</option><option value="be">Break Even</option><option value="skip">Skip</option><option value="no-setup">No Setup</option></select></div>
        <div><span style={lbl}>INSTRUMENT</span><input value={instrument} onChange={e=>setInstrument(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor='#2e4448'} onBlur={e=>e.target.style.borderColor='#1e2c32'} /></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
        <div><span style={lbl}>P&L ($)</span><input type="number" inputMode="decimal" value={pnl} onChange={e=>setPnl(e.target.value)} placeholder="450" style={inp} onFocus={e=>e.target.style.borderColor='#2e4448'} onBlur={e=>e.target.style.borderColor='#1e2c32'} /></div>
        <div><span style={lbl}>SETUP</span><input value={setup} onChange={e=>setSetup(e.target.value)} placeholder="BTB" style={inp} onFocus={e=>e.target.style.borderColor='#2e4448'} onBlur={e=>e.target.style.borderColor='#1e2c32'} /></div>
      </div>
      <div>
        <span style={lbl}>EMOTION — <span style={{color:parseInt(emotion)<=3?'#00e5b0':parseInt(emotion)>=7?'#ff4f6b':'#ffc030',fontWeight:600}}>{parseInt(emotion)<=3?'Lugn ✓':parseInt(emotion)>=7?'Stressad ✗':'Neutral'}</span></span>
        <div style={{display:'flex',gap:'3px'}}>{[1,2,3,4,5,6,7,8,9,10].map(n=><button key={n} onClick={()=>setEmotion(String(n))} style={{flex:1,padding:'7px 0',borderRadius:'4px',border:`1px solid ${emotion===String(n)?'#007d5e':'#1e2c32'}`,background:emotion===String(n)?'#001810':'#0d1214',color:emotion===String(n)?'#00e5b0':'#3a5460',fontFamily:M,fontSize:'10px',cursor:'pointer',transition:'all 0.15s'}}>{n}</button>)}</div>
      </div>
      <div>
        <span style={lbl}>PSYKOLOGI</span>
        <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>{PSYCH.map(tag=>{const a=psychTags.includes(tag.id);return<button key={tag.id} onClick={()=>toggleTag(tag.id)} style={{fontFamily:M,fontSize:'9px',padding:'4px 9px',borderRadius:'5px',background:a?tag.bg:'#0d1214',border:`1px solid ${a?tag.c+'33':'#182025'}`,color:a?tag.c:'#3a5460',cursor:'pointer',transition:'all 0.15s'}}>{tag.label}</button>})}</div>
      </div>
      <div><span style={lbl}>NOTES</span><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Analys, tankar..." style={{...inp,resize:'vertical',minHeight:'65px',lineHeight:1.6}} onFocus={e=>e.target.style.borderColor='#2e4448'} onBlur={e=>e.target.style.borderColor='#1e2c32'} /></div>
      <div>
        <span style={lbl}>CHART</span>
        {imgPrev?(<div style={{position:'relative'}}><img src={imgPrev} alt="chart" style={{width:'100%',borderRadius:'8px',border:'1px solid #1e2c32',display:'block',maxHeight:'180px',objectFit:'cover'}} /><button onClick={()=>{setImage(null);setImgPrev(null)}} style={{position:'absolute',top:'8px',right:'8px',background:'rgba(6,8,9,0.9)',border:'1px solid #1e2c32',borderRadius:'5px',color:'#ff4f6b',cursor:'pointer',fontSize:'11px',padding:'3px 8px',fontFamily:M}}>✕</button></div>)
        :(<div onClick={()=>fileRef.current.click()} style={{border:'1px dashed #1e2c32',borderRadius:'8px',padding:'14px',textAlign:'center',cursor:'pointer',background:'#080b0c',transition:'border-color 0.15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#2e4448'} onMouseLeave={e=>e.currentTarget.style.borderColor='#1e2c32'}><div style={{fontFamily:M,fontSize:'11px',color:'#2a3c42'}}>↑ Ladda upp chart</div></div>)}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{display:'none'}} />
      </div>
      <div style={{display:'flex',gap:'8px'}}>
        <button onClick={doAdd} style={{flex:1,background:'#00e5b0',color:'#020f08',fontFamily:M,fontSize:'11px',fontWeight:700,padding:'11px',borderRadius:'8px',border:'none',cursor:'pointer',letterSpacing:'1px',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='#00c49a'} onMouseLeave={e=>e.currentTarget.style.background='#00e5b0'}>+ SPARA</button>
        <button onClick={resetForm} style={{background:'transparent',color:'#3a5460',fontFamily:M,fontSize:'10px',padding:'11px 12px',borderRadius:'8px',border:'1px solid #182025',cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='#2e4448';e.currentTarget.style.color='#5a7a82'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#182025';e.currentTarget.style.color='#3a5460'}}>Avbryt</button>
      </div>
    </div>
  )

  const Panel=()=>(
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'14px',borderBottom:'1px solid #182025',display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexShrink:0}}>
        <div>
          <div style={{fontFamily:M,fontSize:'8px',color:'#2a3c42',letterSpacing:'2px',marginBottom:'3px'}}>{new Date(sel+'T12:00:00').toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'}).toUpperCase()}</div>
          {selTrades.filter(t=>t.result!=='skip'&&t.result!=='no-setup').length>0&&<div style={{fontFamily:M,fontSize:'22px',fontWeight:700,color:selPnl>=0?'#00e5b0':'#ff4f6b'}}>{selPnl>=0?'+':''}${Math.round(selPnl)}</div>}
        </div>
        <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
          <button onClick={()=>setShowForm(!showForm)} style={{background:'#00e5b0',color:'#020f08',fontFamily:M,fontSize:'9px',fontWeight:700,padding:'7px 13px',borderRadius:'6px',border:'none',cursor:'pointer',letterSpacing:'1px',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='#00c49a'} onMouseLeave={e=>e.currentTarget.style.background='#00e5b0'}>+ LOG</button>
          <button onClick={()=>{setSel(null);resetForm()}} style={{background:'none',border:'none',color:'#2a3c42',cursor:'pointer',fontSize:'16px',padding:'4px',transition:'color 0.15s'}} onMouseEnter={e=>e.currentTarget.style.color='#5a7a82'} onMouseLeave={e=>e.currentTarget.style.color='#2a3c42'}>✕</button>
        </div>
      </div>
      <div style={{overflowY:'auto',flex:1,padding:'12px',display:'flex',flexDirection:'column',gap:'10px'}}>
        {showForm&&<Form/>}
        {selTrades.length===0&&!showForm&&<div style={{fontFamily:M,fontSize:'11px',color:'#1e2c32',padding:'20px 0',textAlign:'center'}}>Inga trades — tryck + LOG</div>}
        {selTrades.map((t,i)=>{
          const pv=parseFloat(t.pnl||0),em=parseInt(t.emotion||0),ec=em<=3?'#00e5b0':em>=7?'#ff4f6b':'#ffc030'
          const ji=journal.findIndex(j=>j===t)
          const rl={win:'Win +3R',win2:'Win +2R',loss:'Loss −1R',be:'BE',skip:'Skip','no-setup':'N/A'}
          return(
            <div key={i} style={{background:'#080b0c',border:`1px solid ${RBDR[t.result]||'#182025'}`,borderRadius:'10px',overflow:'hidden'}}>
              <div style={{padding:'11px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                  <span style={{fontFamily:M,fontSize:'9px',color:'#3a5460',background:'#0d1214',border:'1px solid #182025',borderRadius:'4px',padding:'2px 7px'}}>{t.instrument}</span>
                  <span style={{fontFamily:M,fontSize:'9px',padding:'2px 7px',borderRadius:'4px',background:RBG[t.result],color:RC[t.result],fontWeight:600}}>{rl[t.result]||t.result}</span>
                  {t.setup&&<span style={{fontFamily:M,fontSize:'8px',color:'#3a5460',background:'#0d1214',border:'1px solid #182025',borderRadius:'4px',padding:'2px 6px'}}>{t.setup}</span>}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{fontFamily:M,fontSize:'14px',fontWeight:700,color:pv>=0?'#00e5b0':'#ff4f6b'}}>{pv>=0?'+':''}${Math.abs(Math.round(pv))}</span>
                  <button onClick={()=>onDeleteTrade?.(ji)} style={{background:'none',border:'none',color:'#1e2c32',cursor:'pointer',fontSize:'12px',padding:'2px',transition:'color 0.15s'}} onMouseEnter={e=>e.currentTarget.style.color='#ff4f6b'} onMouseLeave={e=>e.currentTarget.style.color='#1e2c32'}>✕</button>
                </div>
              </div>
              {em>0&&<div style={{padding:'6px 12px',display:'flex',alignItems:'center',gap:'8px',borderTop:'1px solid #111820'}}><span style={{fontFamily:M,fontSize:'7px',color:'#2a3c42',letterSpacing:'1px',flexShrink:0}}>EMOTION</span><div style={{display:'flex',gap:'2px',flex:1}}>{[1,2,3,4,5,6,7,8,9,10].map(n=><div key={n} style={{flex:1,height:'3px',borderRadius:'2px',background:n<=em?ec:'#182025'}} />)}</div><span style={{fontFamily:M,fontSize:'9px',color:ec,flexShrink:0}}>{em}/10</span></div>}
              {t.psychTags?.length>0&&<div style={{padding:'6px 12px 8px',display:'flex',gap:'4px',flexWrap:'wrap',borderTop:'1px solid #111820'}}>{t.psychTags.map(id=>{const tag=PSYCH.find(p=>p.id===id);return tag?<span key={id} style={{fontFamily:M,fontSize:'8px',color:tag.c,background:tag.bg,border:`1px solid ${tag.c}22`,borderRadius:'4px',padding:'2px 7px'}}>{tag.label}</span>:null})}</div>}
              {t.image&&<div style={{padding:'8px 12px',borderTop:'1px solid #111820'}}><img src={t.image} alt="chart" onClick={()=>setLightbox(t.image)} style={{width:'100%',borderRadius:'8px',border:'1px solid #1e2c32',display:'block',cursor:'zoom-in'}} /></div>}
              {t.note&&<div style={{padding:'10px 12px',borderTop:'1px solid #111820'}}><div style={{fontFamily:M,fontSize:'7px',color:'#2a3c42',letterSpacing:'1px',marginBottom:'5px'}}>NOTES</div><div style={{fontSize:'12px',color:'#4a6470',lineHeight:1.7,whiteSpace:'pre-wrap',wordBreak:'break-word',borderLeft:'2px solid #182025',paddingLeft:'10px'}}>{t.note}</div></div>}
            </div>
          )
        })}
      </div>
    </div>
  )

  return(
    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
        {[{l:'P&L',v:`${mPnl>=0?'+':''}$${Math.round(mPnl)}`,c:mPnl>=0?'#00e5b0':'#ff4f6b'},{l:'WIN RATE',v:`${mWr}%`,c:'#00e5b0'},{l:'WINS',v:mW,c:'#00e5b0'},{l:'LOSSES',v:mL,c:'#ff4f6b'},{l:'SKIPS',v:mS,c:'#ffc030'},{l:'SNITT/DAG',v:`${avgDay>=0?'+':''}$${Math.round(avgDay)}`,c:avgDay>=0?'#00e5b0':'#ff4f6b'}].map((s,i)=>(
          <div key={i} style={{background:'#0d1214',border:'1px solid #182025',borderRadius:'10px',padding:'10px 12px'}}>
            <div style={{fontFamily:M,fontSize:'7px',color:'#2a3c42',letterSpacing:'1px',marginBottom:'3px'}}>{s.l}</div>
            <div style={{fontFamily:M,fontSize:'16px',fontWeight:700,color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontFamily:M,fontSize:'13px',fontWeight:700,color:'#d0e8ec',letterSpacing:'2px'}}>{MONTHS[month].toUpperCase()} {year}</div>
        <div style={{display:'flex',gap:'5px'}}>
          {[{fn:prevM,l:'‹'},{fn:nextM,l:'›'}].map((b,i)=><button key={i} onClick={b.fn} style={{background:'#111820',border:'1px solid #182025',borderRadius:'6px',padding:'7px 14px',cursor:'pointer',color:'#5a7a82',fontFamily:M,fontSize:'13px',transition:'border-color 0.15s,color 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='#2e4448';e.currentTarget.style.color='#d0e8ec'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#182025';e.currentTarget.style.color='#5a7a82'}}>{b.l}</button>)}
        </div>
      </div>

      <div style={{display:'flex',flexDirection:mobile?'column':'row',gap:'14px',alignItems:'flex-start'}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{background:'#0d1214',border:'1px solid #182025',borderRadius:'12px',overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:mobile?'repeat(7,1fr)':'repeat(7,1fr) 64px',background:'#080b0c',borderBottom:'1px solid #182025'}}>
              {['M','T','O','T','F','L','S'].map((d,i)=><div key={i} style={{fontFamily:M,fontSize:'8px',color:i<5?'#2a3c42':'#182025',textAlign:'center',padding:mobile?'8px 2px':'9px 4px',letterSpacing:'1px'}}>{d}</div>)}
              {!mobile&&<div style={{fontFamily:M,fontSize:'7px',color:'#182025',textAlign:'center',padding:'9px 4px',letterSpacing:'1px',borderLeft:'1px solid #182025'}}>V</div>}
            </div>
            {weeks.map((week,wi)=>{
              const wDates=week.filter(c=>c.ds).map(c=>c.ds)
              const wT=journal.filter(t=>wDates.includes(t.date)&&t.result!=='skip'&&t.result!=='no-setup')
              const wPnl=wT.reduce((s,t)=>s+parseFloat(t.pnl||0),0)
              const wW=wT.filter(t=>t.result==='win'||t.result==='win2').length
              const wWr=wT.length>0?Math.round(wW/wT.length*100):null
              return(
                <div key={wi} style={{display:'grid',gridTemplateColumns:mobile?'repeat(7,1fr)':'repeat(7,1fr) 64px'}}>
                  {week.map((cell,ci)=>{
                    if(cell.empty)return<div key={ci} style={{minHeight:cellH,borderRight:'1px solid #111820',borderBottom:'1px solid #111820',background:'#080b0c'}} />
                    const{day,ds}=cell
                    const dT=journal.filter(t=>t.date===ds)
                    const aT=dT.filter(t=>t.result!=='skip'&&t.result!=='no-setup')
                    const isTd=ds===today,isSel=ds===sel,isWe=ci>=5
                    const stat=getDayStatus(ds)
                    const dPnl=aT.reduce((s,t)=>s+parseFloat(t.pnl||0),0)
                    const sc=stat?getDayBg(stat,dPnl):null
                    return(
                      <div key={ci} onClick={()=>{setSel(isSel?null:ds);resetForm()}} style={{minHeight:cellH,borderRight:'1px solid #111820',borderBottom:'1px solid #111820',padding:mobile?'5px 4px':'8px',background:isSel?(sc?.bg||'#111820'):sc?.bg||(isTd?'rgba(0,229,176,0.03)':'transparent'),outline:isSel?`2px solid ${sc?.bdr||'#1e2c32'}`:'none',outlineOffset:'-2px',cursor:'pointer',position:'relative',transition:'background 0.15s'}}>
                        {isTd&&<div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:'#007d5e'}} />}
                        <div style={{fontFamily:M,fontSize:mobile?'9px':'11px',color:isTd?'#00e5b0':isWe?'#182025':'#5a7a82',fontWeight:isTd?700:400,marginBottom:mobile?'2px':'4px'}}>{day}</div>
                        {!mobile&&aT.map((t,ti)=><div key={ti} style={{fontFamily:M,fontSize:'8px',padding:'2px 4px',borderRadius:'3px',background:RBG[t.result],color:RC[t.result],display:'inline-block',marginBottom:'2px',marginRight:'2px'}}>{{win:'W3R',win2:'W2R',loss:'-1R',be:'BE',skip:'Sk','no-setup':'N/A'}[t.result]||t.result}</div>)}
                        {mobile&&stat&&<div style={{width:'5px',height:'5px',borderRadius:'50%',background:sc?.dot}} />}
                        {aT.length>0&&<div style={{fontFamily:M,fontSize:mobile?'8px':'10px',fontWeight:700,color:dPnl>=0?'#00e5b0':'#ff4f6b',marginTop:mobile?'1px':'3px'}}>{dPnl>=0?'+':''}${Math.abs(Math.round(dPnl))}</div>}
                      </div>
                    )
                  })}
                  {!mobile&&<div style={{minHeight:cellH,borderBottom:'1px solid #111820',borderLeft:'1px solid #182025',padding:'6px',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:'2px',background:'#080b0c'}}>
                    {wT.length>0?<><div style={{fontFamily:M,fontSize:'9px',fontWeight:700,color:wPnl>=0?'#00e5b0':'#ff4f6b'}}>{wPnl>=0?'+':''}${Math.abs(Math.round(wPnl))}</div>{wWr!==null&&<div style={{fontFamily:M,fontSize:'8px',color:wWr>=50?'#00e5b0':'#ff4f6b'}}>{wWr}%</div>}<div style={{fontFamily:M,fontSize:'7px',color:'#2a3c42'}}>{wT.length}t</div></>:<div style={{fontFamily:M,fontSize:'9px',color:'#182025'}}>—</div>}
                  </div>}
                </div>
              )
            })}
          </div>
        </div>
        {!mobile&&sel&&<div style={{width:'440px',flexShrink:0,background:'#0d1214',border:'1px solid #182025',borderRadius:'12px',overflow:'hidden',maxHeight:'calc(100vh-100px)',display:'flex',flexDirection:'column'}}><Panel /></div>}
      </div>
      {mobile&&sel&&<div style={{background:'#0d1214',border:'1px solid #182025',borderRadius:'12px',overflow:'hidden',maxHeight:'70vh',display:'flex',flexDirection:'column'}}><Panel /></div>}

      {lightbox&&<div onClick={()=>setLightbox(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.95)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out',padding:'16px'}}><img src={lightbox} alt="chart" style={{maxWidth:'95vw',maxHeight:'90vh',borderRadius:'10px',border:'1px solid #1e2c32',objectFit:'contain'}} /><button onClick={()=>setLightbox(null)} style={{position:'absolute',top:'16px',right:'16px',background:'rgba(13,18,20,0.95)',border:'1px solid #1e2c32',borderRadius:'8px',color:'#d0e8ec',cursor:'pointer',fontSize:'13px',padding:'7px 14px',fontFamily:M}}>✕</button></div>}
    </div>
  )
}