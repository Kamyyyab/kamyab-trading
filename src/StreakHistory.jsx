import { useMemo, useState } from 'react'

const M = "'JetBrains Mono', monospace"

export default function StreakHistory({ journal=[], onSaveStreakLog, streakLogs={} }) {
  const todayStr  = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()
  const todayDate = new Date()
  const [viewYear, setViewYear]   = useState(todayDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth())
  const [popup, setPopup]         = useState(null)

  const { currentStreak, longestStreak, cleanDays, violationDays } = useMemo(() => {
    const isWd = d => { const wd=new Date(d+'T12:00:00').getDay(); return wd>=1&&wd<=5 }
    const dates = Object.keys(streakLogs).filter(isWd).sort((a,b)=>b.localeCompare(a))
    let cur=0
    for (const d of dates) { if(streakLogs[d]==='violation')break; if(streakLogs[d]==='clean')cur++ }
    let longest=0, temp=0
    for (const d of [...dates].reverse()) { if(streakLogs[d]==='violation')temp=0; else if(streakLogs[d]==='clean'){temp++;longest=Math.max(longest,temp)} }
    return { currentStreak:cur, longestStreak:longest, cleanDays:dates.filter(d=>streakLogs[d]==='clean').length, violationDays:dates.filter(d=>streakLogs[d]==='violation').length }
  }, [streakLogs])

  const dayPnlMap = useMemo(() => {
    const map={}
    journal.forEach(t=>{ if(!t.date||t.result==='skip'||t.result==='no-setup')return; map[t.date]=(map[t.date]||0)+parseFloat(t.pnl||0) })
    return map
  }, [journal])

  const calDays = useMemo(() => {
    const first  = new Date(viewYear,viewMonth,1)
    const last   = new Date(viewYear,viewMonth+1,0)
    const offset = first.getDay()===0?6:first.getDay()-1
    const days   = []
    for(let i=0;i<offset;i++)days.push(null)
    for(let d=1;d<=last.getDate();d++){
      const date    = new Date(viewYear,viewMonth,d)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
      const wd      = date.getDay()
      const isWe    = wd===0||wd===6
      const isFut   = dateStr>todayStr
      const isToday = dateStr===todayStr
      let status='empty'
      if(!isFut&&!isWe){
        if(streakLogs[dateStr])status=streakLogs[dateStr]
        else{ const dt=journal.filter(t=>t.date===dateStr); if(dt.length>0)status=dt.some(t=>t.brokenRules?.length>0)?'violation':'clean' }
      }
      days.push({date:dateStr,day:d,status,isWe,isFut,isToday,pnl:dayPnlMap[dateStr]??null})
    }
    return days
  }, [viewYear,viewMonth,journal,streakLogs,todayStr,dayPnlMap])

  function prev(){ if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1)}else setViewMonth(m=>m-1) }
  function next(){ if(viewYear===todayDate.getFullYear()&&viewMonth>=todayDate.getMonth())return; if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1)}else setViewMonth(m=>m+1) }

  function handleClick(day,e){
    if(!day||day.isFut||day.isWe)return
    const r=e.currentTarget.getBoundingClientRect()
    setPopup({date:day.date,status:day.status,x:r.left,y:r.bottom+6})
  }
  function logDay(date,status){ onSaveStreakLog?.(date,status); setPopup(null) }

  const weeks=[]; for(let i=0;i<calDays.length;i+=7)weeks.push(calDays.slice(i,i+7))
  const monthName = new Date(viewYear,viewMonth,1).toLocaleDateString('sv-SE',{month:'long'})
  const noNext    = viewYear===todayDate.getFullYear()&&viewMonth>=todayDate.getMonth()

  const SBG  = {clean:'#001810',violation:'#1a0610',empty:'#0d1214'}
  const SBDR = {clean:'rgba(0,229,176,0.2)',violation:'rgba(255,79,107,0.2)',empty:'#1e2c32'}

  return (
    <div style={{background:'#161e24',border:'1px solid #1e2c32',borderRadius:'12px',padding:'14px'}}>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
        <div style={{display:'flex',alignItems:'baseline',gap:'4px'}}>
          <span style={{fontFamily:M,fontSize:'28px',fontWeight:700,color:currentStreak>0?'#00e5b0':'#263840',lineHeight:1}}>{currentStreak}</span>
          <span style={{fontFamily:M,fontSize:'9px',color:'#85a4ad'}}>dagars streak</span>
        </div>
        <div style={{display:'flex',gap:'14px'}}>
          {[{label:'LÄNGSTA',v:longestStreak,c:'#00e5b0'},{label:'CLEAN',v:cleanDays,c:'#00e5b0'},{label:'VIOLATIONS',v:violationDays,c:'#ff4f6b'}].map((s,i)=>(
            <div key={i} style={{textAlign:'center'}}>
              <div style={{fontFamily:M,fontSize:'7px',color:'#85a4ad',letterSpacing:'1px',marginBottom:'1px'}}>{s.label}</div>
              <div style={{fontFamily:M,fontSize:'14px',fontWeight:700,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
        <div style={{fontFamily:M,fontSize:'10px',color:'#d0e8ec',textTransform:'capitalize'}}>{monthName} {viewYear}</div>
        <div style={{display:'flex',gap:'4px'}}>
          {[{fn:prev,label:'‹'},{fn:next,label:'›',disabled:noNext}].map((b,i)=>(
            <button key={i} onClick={b.fn} style={{background:'#161e24',border:'1px solid #1e2c32',borderRadius:'5px',color:b.disabled?'#263840':'#85a4ad',fontSize:'12px',width:'26px',height:'26px',cursor:b.disabled?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'border-color 0.15s,color 0.15s'}}>{b.label}</button>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px',marginBottom:'2px'}}>
        {['M','T','O','T','F','L','S'].map((l,i)=>(
          <div key={i} style={{fontFamily:M,fontSize:'7px',color:i>=5?'#1e2c32':'#263840',textAlign:'center',padding:'2px 0'}}>{l}</div>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
        {weeks.map((week,wi)=>(
          <div key={wi} style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px'}}>
            {week.map((day,di)=>{
              if(!day)return <div key={di} style={{borderRadius:'4px',height:'36px'}} />
              const bg  = day.isFut?'transparent':day.isToday?'#0f1c1a':SBG[day.status]
              const bdr = day.isToday?'rgba(0,229,176,0.3)':day.isFut?'transparent':SBDR[day.status]
              const hasPnl = day.pnl!==null&&!day.isWe&&!day.isFut
              return (
                <div key={di} onClick={e=>handleClick(day,e)} style={{
                  borderRadius:'4px',background:bg,border:`1px solid ${bdr}`,
                  height:'36px',padding:'3px 4px',
                  cursor:!day.isFut&&!day.isWe?'pointer':'default',
                  boxSizing:'border-box',display:'flex',flexDirection:'column',justifyContent:'space-between',
                  opacity:day.isFut?0.12:1,transition:'border-color 0.15s,background 0.15s',
                }}
                  onMouseEnter={e=>{if(!day.isFut&&!day.isWe)e.currentTarget.style.borderColor='rgba(58,84,96,0.5)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=bdr}}
                >
                  <div style={{fontFamily:M,fontSize:'9px',fontWeight:day.isToday?700:400,color:day.isToday?'#00e5b0':day.isWe?'#1e2c32':'#85a4ad',lineHeight:1}}>{day.day}</div>
                  {hasPnl ? (
                    <div style={{fontFamily:M,fontSize:'7px',fontWeight:700,color:day.pnl>=0?'#00e5b0':'#ff4f6b',lineHeight:1}}>{day.pnl>=0?'+':''}{Math.round(day.pnl)}</div>
                  ) : (
                    day.status!=='empty'&&!day.isFut&&!day.isWe&&(
                      <div style={{width:'4px',height:'4px',borderRadius:'50%',background:day.status==='clean'?'#00e5b0':'#ff4f6b'}} />
                    )
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
        {[{bg:'#001810',bdr:'rgba(0,229,176,0.2)',label:'Clean'},{bg:'#1a0610',bdr:'rgba(255,79,107,0.2)',label:'Violation'},{bg:'#0d1214',bdr:'#1e2c32',label:'Ingen trade'}].map((l,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:'4px'}}>
            <div style={{width:'8px',height:'8px',borderRadius:'2px',background:l.bg,border:`1px solid ${l.bdr}`}} />
            <span style={{fontFamily:M,fontSize:'8px',color:'#85a4ad'}}>{l.label}</span>
          </div>
        ))}
      </div>

      {popup && (
        <>
          <div onClick={()=>setPopup(null)} style={{position:'fixed',inset:0,zIndex:98}} />
          <div style={{position:'fixed',left:Math.min(popup.x,window.innerWidth-210),top:Math.min(popup.y,window.innerHeight-160),zIndex:99,background:'#161e24',border:'1px solid #263840',borderRadius:'10px',padding:'12px',minWidth:'180px',boxShadow:'0 16px 40px rgba(0,0,0,0.8)'}}>
            <div style={{fontFamily:M,fontSize:'8px',color:'#85a4ad',marginBottom:'8px',letterSpacing:'1px'}}>
              {new Date(popup.date+'T12:00:00').toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'}).toUpperCase()}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
              <button onClick={()=>logDay(popup.date,'clean')} style={{background:popup.status==='clean'?'#001810':'#0d1214',border:`1px solid ${popup.status==='clean'?'rgba(0,229,176,0.3)':'#263840'}`,borderRadius:'6px',color:'#00e5b0',fontFamily:M,fontSize:'10px',padding:'7px 10px',cursor:'pointer',textAlign:'left',transition:'all 0.15s'}}>✓ Följde regler</button>
              <button onClick={()=>logDay(popup.date,'violation')} style={{background:popup.status==='violation'?'#1a0610':'#0d1214',border:`1px solid ${popup.status==='violation'?'rgba(255,79,107,0.3)':'#263840'}`,borderRadius:'6px',color:'#ff4f6b',fontFamily:M,fontSize:'10px',padding:'7px 10px',cursor:'pointer',textAlign:'left',transition:'all 0.15s'}}>✕ Bröt regler</button>
              {popup.status!=='empty'&&<button onClick={()=>logDay(popup.date,null)} style={{background:'none',border:'1px solid #1e2c32',borderRadius:'6px',color:'#85a4ad',fontFamily:M,fontSize:'8px',padding:'5px 10px',cursor:'pointer',textAlign:'left'}}>Rensa</button>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}