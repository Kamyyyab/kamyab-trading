import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const M = "'JetBrains Mono', monospace"

const PSYCH_LABELS = { patient:'Tålmodig', fomo:'FOMO', revenge:'Hämndtrade', aplus:'A+ Setup', forced:'Forcerat', setforget:'Set & Forget', oversize:'Överposad', managed:'Hanterat bra' }

export default function Statistics({ journal = [] }) {
  const [filter, setFilter] = useState('Totalt')

  function filterTrades(t) {
    const now = new Date()
    if (filter==='Denna vecka') {
      const ws = new Date(now); ws.setDate(now.getDate()-((now.getDay()+6)%7)); ws.setHours(0,0,0,0)
      return t.filter(x=>new Date(x.date)>=ws)
    }
    if (filter==='Denna månad') return t.filter(x=>new Date(x.date)>=new Date(now.getFullYear(),now.getMonth(),1))
    return t
  }

  const all    = filterTrades(journal)
  const trades = all.filter(t=>t.result!=='skip'&&t.result!=='no-setup')
  const wins   = trades.filter(t=>['win','win2','tp1','tp2','tp3'].includes(t.result)||t.result==='tp1'||t.result==='tp2'||t.result==='tp3').length
  const losses = trades.filter(t=>t.result==='loss').length
  const wr     = trades.length>0?((wins/trades.length)*100).toFixed(1):0
  const tPnl   = trades.reduce((s,t)=>s+parseFloat(t.pnl||0),0)

  const wTrades = trades.filter(t=>['win','win2','tp1','tp2','tp3'].includes(t.result)||t.result==='tp1'||t.result==='tp2'||t.result==='tp3')
  const avgRR   = wTrades.length>0?(wTrades.reduce((s,t)=>s+(t.result==='win'?3:2),0)/wTrades.length).toFixed(2):'0.00'

  const best  = trades.filter(t=>t.pnl).sort((a,b)=>parseFloat(b.pnl)-parseFloat(a.pnl))[0]
  const worst = trades.filter(t=>t.pnl).sort((a,b)=>parseFloat(a.pnl)-parseFloat(b.pnl))[0]

  let cum=0
  const eqData = [...trades].reverse().map(t=>{ cum+=parseFloat(t.pnl||0); return {date:t.date.slice(5),pnl:Math.round(cum)} })
  const eqPos  = eqData.length>0&&eqData[eqData.length-1].pnl>=0

  let peak=0, maxDD=0
  eqData.forEach(p=>{ if(p.pnl>peak)peak=p.pnl; const dd=peak-p.pnl; if(dd>maxDD)maxDD=dd })

  const totalR = trades.reduce((s,t)=>{ if(t.result==='win')return s+3; if(t.result==='win2')return s+2; if(t.result==='tp3')return s+3; if(t.result==='tp2')return s+2; if(t.result==='tp1')return s+1; if(t.result==='loss')return s-1; return s },0)
  const avgR   = trades.length>0?(totalR/trades.length).toFixed(2):'0.00'

  const rData = [
    {label:'+3R',count:trades.filter(t=>t.result==='win').length,   c:'#00e5b0'},
    {label:'+2R',count:trades.filter(t=>t.result==='win2').length,  c:'#4ab89a'},
    {label:'BE', count:trades.filter(t=>t.result==='be').length,    c:'#5a7a84'},
    {label:'-1R',count:trades.filter(t=>t.result==='loss').length,  c:'#ff4f6b'},
  ]

  const setupStats = {}
  trades.forEach(t=>{ const k=t.setup||'Otaggad'; if(!setupStats[k])setupStats[k]={pnl:0,wins:0,total:0}; setupStats[k].pnl+=parseFloat(t.pnl||0); setupStats[k].total++; if(['win','win2','tp1','tp2','tp3'].includes(t.result)||t.result==='tp1'||t.result==='tp2'||t.result==='tp3')setupStats[k].wins++ })
  const setupList = Object.entries(setupStats).sort(([,a],[,b])=>b.pnl-a.pnl)

  const psychStats = {}
  trades.forEach(t=>{ (t.psychTags||[]).forEach(id=>{ if(!psychStats[id])psychStats[id]={wins:0,losses:0,total:0,pnl:0}; psychStats[id].total++; psychStats[id].pnl+=parseFloat(t.pnl||0); if(['win','win2','tp1','tp2','tp3'].includes(t.result)||t.result==='tp1'||t.result==='tp2'||t.result==='tp3')psychStats[id].wins++; if(t.result==='loss')psychStats[id].losses++ }) })
  const psychList = Object.entries(psychStats).sort(([,a],[,b])=>b.total-a.total)

  const days = ['Måndag','Tisdag','Onsdag','Torsdag','Fredag']
  const dayStats = days.map((day,i)=>{ const dt=trades.filter(t=>new Date(t.date).getDay()===(i+1)); const dw=dt.filter(t=>['win','win2','tp1','tp2','tp3'].includes(t.result)||t.result==='tp1'||t.result==='tp2'||t.result==='tp3').length; return {day,wr:dt.length>0?Math.round(dw/dt.length*100):0,total:dt.length,reliable:dt.length>=3} })

  const card = (label,value,color,sub) => (
    <div style={{background:'#161e24',border:'1px solid #1e2c32',borderRadius:'12px',padding:'14px 16px'}}>
      <div style={{fontFamily:M,fontSize:'8px',color:'#5a7a84',letterSpacing:'2px',marginBottom:'6px'}}>{label}</div>
      <div style={{fontFamily:M,fontSize:'24px',fontWeight:700,color,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontFamily:M,fontSize:'9px',color:'#5a7a84',marginTop:'4px'}}>{sub}</div>}
    </div>
  )

  const section = (title, children) => (
    <div style={{background:'#161e24',border:'1px solid #1e2c32',borderRadius:'12px',padding:'16px'}}>
      <div style={{fontFamily:M,fontSize:'8px',color:'#5a7a84',letterSpacing:'2px',marginBottom:'14px'}}>{title}</div>
      {children}
    </div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

      <div style={{display:'flex',gap:'6px'}}>
        {['Totalt','Denna månad','Denna vecka'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            fontFamily:M,fontSize:'9px',padding:'7px 13px',borderRadius:'7px',
            border:`1px solid ${filter===f?'#007d5e':'#1e2c32'}`,
            background:filter===f?'#001810':'transparent',
            color:filter===f?'#00e5b0':'#5a7a84',cursor:'pointer',letterSpacing:'1px',
            transition:'all 0.15s',
          }}>{f}</button>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'10px'}}>
        {card('WIN RATE',     `${wr}%`,                                         '#00e5b0',`${trades.length} trades`)}
        {card('TOTAL P&L',   `${tPnl>=0?'+':''}$${Math.round(tPnl)}`,         tPnl>=0?'#00e5b0':'#ff4f6b')}
        {card('WINS',         String(wins),                                     '#00e5b0')}
        {card('LOSSES',       String(losses),                                   '#ff4f6b')}
        {card('AVG RR',       avgRR,                                            '#00e5b0','på vinster')}
        {card('MAX DRAWDOWN', `-$${Math.round(maxDD)}`,                         '#ff4f6b')}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
        {section('R-BREAKDOWN',
          <div style={{display:'flex',flexDirection:'column',gap:'9px'}}>
            {rData.map((r,i)=>{
              const pct=trades.length>0?r.count/trades.length*100:0
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <div style={{fontFamily:M,fontSize:'10px',color:r.c,width:'26px'}}>{r.label}</div>
                  <div style={{flex:1,height:'5px',background:'#161e24',borderRadius:'3px',overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:r.c,borderRadius:'3px',transition:'width 0.4s ease'}} />
                  </div>
                  <div style={{fontFamily:M,fontSize:'9px',color:'#5a7a84',width:'20px',textAlign:'right'}}>{r.count}</div>
                </div>
              )
            })}
          </div>
        )}
        {section('TOTAL R',
          <>
            <div style={{fontFamily:M,fontSize:'34px',fontWeight:700,color:totalR>=0?'#00e5b0':'#ff4f6b',lineHeight:1,marginBottom:'5px'}}>{totalR>=0?'+':''}{totalR}R</div>
            <div style={{fontFamily:M,fontSize:'9px',color:'#5a7a84',marginBottom:'14px'}}>Snitt {avgR}R / trade</div>
            <div style={{fontFamily:M,fontSize:'8px',color:'#5a7a84',letterSpacing:'1px',marginBottom:'5px'}}>EDGE</div>
            <div style={{fontFamily:M,fontSize:'16px',fontWeight:700,color:parseFloat(avgR)>=0.5?'#00e5b0':parseFloat(avgR)>=0?'#ffc030':'#ff4f6b'}}>{parseFloat(avgR)>=0?'+':''}{avgR}R</div>
            <div style={{fontFamily:M,fontSize:'8px',color:'#5a7a84',marginTop:'3px'}}>{parseFloat(avgR)>=0.5?'✓ Positiv edge':parseFloat(avgR)>=0?'⚠ Svag edge':'✗ Negativ edge'}</div>
          </>
        )}
      </div>

      {best && worst && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
          <div style={{background:'#161e24',border:'1px solid rgba(0,229,176,0.12)',borderRadius:'12px',padding:'14px'}}>
            <div style={{fontFamily:M,fontSize:'8px',color:'#5a7a84',letterSpacing:'2px',marginBottom:'7px'}}>BÄSTA TRADE</div>
            <div style={{fontFamily:M,fontSize:'26px',fontWeight:700,color:'#00e5b0'}}>+${Math.round(parseFloat(best.pnl))}</div>
            <div style={{fontFamily:M,fontSize:'9px',color:'#5a7a84',marginTop:'4px'}}>{best.date} · {best.instrument}</div>
          </div>
          <div style={{background:'#161e24',border:'1px solid rgba(255,79,107,0.12)',borderRadius:'12px',padding:'14px'}}>
            <div style={{fontFamily:M,fontSize:'8px',color:'#5a7a84',letterSpacing:'2px',marginBottom:'7px'}}>SÄMSTA TRADE</div>
            <div style={{fontFamily:M,fontSize:'26px',fontWeight:700,color:'#ff4f6b'}}>${Math.round(parseFloat(worst.pnl))}</div>
            <div style={{fontFamily:M,fontSize:'9px',color:'#5a7a84',marginTop:'4px'}}>{worst.date} · {worst.instrument}</div>
          </div>
        </div>
      )}

      {section('EQUITY CURVE',
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={eqData}>
            <XAxis dataKey="date" stroke="#1e2c32" tick={{fill:'#5a7a84',fontSize:8,fontFamily:M}} interval="preserveStartEnd" />
            <YAxis stroke="#1e2c32" tick={{fill:'#5a7a84',fontSize:8,fontFamily:M}} width={42} />
            <Tooltip contentStyle={{background:'#161e24',border:'1px solid #263840',color:'#d0e8ec',fontFamily:M,fontSize:'11px'}} formatter={v=>[`$${v}`,'P&L']} />
            <ReferenceLine y={0} stroke="#263840" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="pnl" stroke={eqPos?'#00e5b0':'#ff4f6b'} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {setupList.length>0 && section('P&L PER SETUP',
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {setupList.map(([tag,s],i)=>{
            const wr=s.total>0?Math.round(s.wins/s.total*100):0
            const maxP=Math.max(...setupList.map(([,x])=>Math.abs(x.pnl)),1)
            return (
              <div key={i}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{fontFamily:M,fontSize:'11px',color:'#d0e8ec',fontWeight:600}}>{tag}</span>
                    <span style={{fontFamily:M,fontSize:'9px',color:wr>=50?'#00e5b0':'#ff4f6b'}}>{wr}%</span>
                    <span style={{fontFamily:M,fontSize:'8px',color:'#5a7a84'}}>{s.total}t</span>
                  </div>
                  <span style={{fontFamily:M,fontSize:'12px',fontWeight:700,color:s.pnl>=0?'#00e5b0':'#ff4f6b'}}>{s.pnl>=0?'+':''}${Math.round(s.pnl)}</span>
                </div>
                <div style={{height:'4px',background:'#161e24',borderRadius:'2px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${Math.abs(s.pnl)/maxP*100}%`,background:s.pnl>=0?'#007d5e':'#7a1020',borderRadius:'2px',transition:'width 0.4s ease'}} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {psychList.length>0 && section('PSYKOLOGI — P&L PER TAGG',
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {psychList.map(([id,s],i)=>{
            const wr=s.total>0?Math.round(s.wins/s.total*100):0
            return (
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{fontFamily:M,fontSize:'11px',color:'#d0e8ec'}}>{PSYCH_LABELS[id]||id}</span>
                  <span style={{fontFamily:M,fontSize:'9px',color:'#5a7a84'}}>{s.total}x</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <span style={{fontFamily:M,fontSize:'10px',color:wr>=50?'#00e5b0':'#ff4f6b'}}>{wr}% WR</span>
                  <span style={{fontFamily:M,fontSize:'12px',fontWeight:700,color:s.pnl>=0?'#00e5b0':'#ff4f6b'}}>{s.pnl>=0?'+':''}${Math.round(s.pnl)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {section('WIN RATE PER VECKODAG',
        <>
          <div style={{fontFamily:M,fontSize:'8px',color:'#3a5460',marginBottom:'12px'}}>Gråa = under 3 trades</div>
          <div style={{display:'flex',gap:'8px',alignItems:'flex-end',height:'100px'}}>
            {dayStats.map((d,i)=>{
              const c  = d.total===0?'#161e24':!d.reliable?'#1a2428':d.wr>=50?'#007d5e':'#7a1020'
              const tc = d.total===0?'#263840':!d.reliable?'#5a7a84':d.wr>=50?'#00e5b0':'#ff4f6b'
              const h  = d.total===0?'5px':`${Math.max(d.wr,5)}%`
              return (
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',height:'100%',justifyContent:'flex-end'}}>
                  <div style={{fontFamily:M,fontSize:'9px',color:tc}}>{d.total===0?'—':`${d.wr}%`}</div>
                  <div style={{width:'100%',height:h,background:c,borderRadius:'3px 3px 0 0',transition:'height 0.3s ease'}} />
                  <div style={{fontFamily:M,fontSize:'8px',color:'#5a7a84'}}>{d.day.slice(0,3)}</div>
                  <div style={{fontFamily:M,fontSize:'7px',color:'#3a5460'}}>{d.total}t</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}