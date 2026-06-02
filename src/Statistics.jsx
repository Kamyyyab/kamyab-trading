import { useState } from 'react'
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'

const M = "'JetBrains Mono', monospace"
const WIN_RESULTS = new Set(['win','win2','tp1','tp2','tp3'])
const VIOLATION_TAGS = new Set(['fomo','revenge','forced','oversize'])
const PSYCH_LABELS = { patient:'Tålmodig', fomo:'FOMO', revenge:'Hämndtrade', aplus:'A+ Setup', forced:'Forcerat', setforget:'Set & Forget', oversize:'Överposad', managed:'Hanterat bra' }

function exportCSV(journal) {
  const rows = [
    ['Datum','Instrument','Outcome','Setup','P&L','Emotion','Psyk-taggar','Rule Violation','Brutna regler','Notes'],
    ...journal.map(t => [
      t.date || '',
      t.instrument || '',
      t.result || '',
      t.setup || '',
      t.pnl || '0',
      t.emotion || '',
      (t.psychTags || []).join(';'),
      t.checklistViolation ? 'JA' : 'NEJ',
      (t.violatedRules || []).join(';'),
      (t.note || '').replace(/\n/g,' '),
    ])
  ]
  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type:'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href=url; a.download=`trading-journal-${new Date().toISOString().slice(0,10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}

export default function Statistics({ journal = [] }) {
  const [filter, setFilter] = useState('Totalt')
  const [monthView, setMonthView] = useState('pnl') // 'pnl' | 'wr' | 'r'

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
  const wins   = trades.filter(t=>WIN_RESULTS.has(t.result)).length
  const losses = trades.filter(t=>t.result==='loss').length
  const wr     = trades.length>0?((wins/trades.length)*100).toFixed(1):0
  const tPnl   = trades.reduce((s,t)=>s+parseFloat(t.pnl||0),0)

  const wTrades = trades.filter(t=>WIN_RESULTS.has(t.result))
  const avgRR   = wTrades.length>0?(wTrades.reduce((s,t)=>s+(t.result==='win'||t.result==='tp3'?3:t.result==='win2'||t.result==='tp2'?2:1),0)/wTrades.length).toFixed(2):'0.00'

  const best  = trades.filter(t=>t.pnl).sort((a,b)=>parseFloat(b.pnl)-parseFloat(a.pnl))[0]
  const worst = trades.filter(t=>t.pnl).sort((a,b)=>parseFloat(a.pnl)-parseFloat(b.pnl))[0]

  let cum=0
  const eqData = [...trades].reverse().map(t=>{ cum+=parseFloat(t.pnl||0); return {date:t.date.slice(5),pnl:Math.round(cum)} })
  const eqPos  = eqData.length>0&&eqData[eqData.length-1].pnl>=0

  let peak=0, maxDD=0
  eqData.forEach(p=>{ if(p.pnl>peak)peak=p.pnl; const dd=peak-p.pnl; if(dd>maxDD)maxDD=dd })

  const totalR = trades.reduce((s,t)=>{ if(t.result==='win'||t.result==='tp3')return s+3; if(t.result==='win2'||t.result==='tp2')return s+2; if(t.result==='tp1')return s+1; if(t.result==='loss')return s-1; return s },0)
  const avgR   = trades.length>0?(totalR/trades.length).toFixed(2):'0.00'

  const rData = [
    {label:'+3R',count:trades.filter(t=>t.result==='win'||t.result==='tp3').length, c:'#00e5b0'},
    {label:'+2R',count:trades.filter(t=>t.result==='win2'||t.result==='tp2').length,c:'#4ab89a'},
    {label:'+1R',count:trades.filter(t=>t.result==='tp1').length,                   c:'#2a7a60'},
    {label:'BE', count:trades.filter(t=>t.result==='be').length,                    c:'#85a4ad'},
    {label:'-1R',count:trades.filter(t=>t.result==='loss').length,                  c:'#ff4f6b'},
  ]

  // ── Monthly breakdown (always uses full journal, not filtered) ──
  const monthlyData = (() => {
    const allTrades = journal.filter(t=>t.result!=='skip'&&t.result!=='no-setup')
    const map = {}
    allTrades.forEach(t => {
      const key = t.date.slice(0,7) // "2025-03"
      if (!map[key]) map[key] = { pnl:0, wins:0, total:0, r:0 }
      map[key].pnl   += parseFloat(t.pnl||0)
      map[key].total += 1
      if (WIN_RESULTS.has(t.result)) map[key].wins += 1
      if (t.result==='win'||t.result==='tp3') map[key].r += 3
      else if (t.result==='win2'||t.result==='tp2') map[key].r += 2
      else if (t.result==='tp1') map[key].r += 1
      else if (t.result==='loss') map[key].r -= 1
    })
    return Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).map(([key,v]) => ({
      label: new Date(key+'-15').toLocaleDateString('sv-SE',{month:'short',year:'2-digit'}),
      key,
      pnl:   Math.round(v.pnl),
      wr:    v.total>0?Math.round(v.wins/v.total*100):0,
      r:     v.r,
      total: v.total,
    }))
  })()

  // ── Rule-following stats ──
  const cleanTrades   = trades.filter(t => t.checklistViolation === false)
  const brokenTrades  = trades.filter(t => t.checklistViolation === true)
  const cleanWins     = cleanTrades.filter(t => WIN_RESULTS.has(t.result)).length
  const brokenWins    = brokenTrades.filter(t => WIN_RESULTS.has(t.result)).length
  const cleanWR       = cleanTrades.length  > 0 ? Math.round(cleanWins  / cleanTrades.length  * 100) : null
  const brokenWR      = brokenTrades.length > 0 ? Math.round(brokenWins / brokenTrades.length * 100) : null
  const cleanPnl      = cleanTrades.reduce((s,t) => s + parseFloat(t.pnl||0), 0)
  const brokenPnl     = brokenTrades.reduce((s,t) => s + parseFloat(t.pnl||0), 0)

  const setupStats = {}
  trades.forEach(t=>{ const k=t.setup||'Otaggad'; if(!setupStats[k])setupStats[k]={pnl:0,wins:0,total:0}; setupStats[k].pnl+=parseFloat(t.pnl||0); setupStats[k].total++; if(WIN_RESULTS.has(t.result))setupStats[k].wins++ })
  const setupList = Object.entries(setupStats).sort(([,a],[,b])=>b.pnl-a.pnl)

  const psychStats = {}
  trades.forEach(t=>{ (t.psychTags||[]).forEach(id=>{ if(!psychStats[id])psychStats[id]={wins:0,losses:0,total:0,pnl:0}; psychStats[id].total++; psychStats[id].pnl+=parseFloat(t.pnl||0); if(WIN_RESULTS.has(t.result))psychStats[id].wins++; if(t.result==='loss')psychStats[id].losses++ }) })
  const psychList = Object.entries(psychStats).sort(([,a],[,b])=>b.total-a.total)

  const days = ['Måndag','Tisdag','Onsdag','Torsdag','Fredag']
  const dayStats = days.map((day,i)=>{ const dt=trades.filter(t=>new Date(t.date).getDay()===(i+1)); const dw=dt.filter(t=>WIN_RESULTS.has(t.result)).length; return {day,wr:dt.length>0?Math.round(dw/dt.length*100):0,total:dt.length,reliable:dt.length>=3} })

  const card = (label,value,color,sub) => (
    <div style={{background:'#161e24',border:'1px solid #1e2c32',borderRadius:'12px',padding:'14px 16px'}}>
      <div style={{fontFamily:M,fontSize:'8px',color:'#85a4ad',letterSpacing:'2px',marginBottom:'6px'}}>{label}</div>
      <div style={{fontFamily:M,fontSize:'24px',fontWeight:700,color,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontFamily:M,fontSize:'9px',color:'#85a4ad',marginTop:'4px'}}>{sub}</div>}
    </div>
  )

  const section = (title, children) => (
    <div style={{background:'#161e24',border:'1px solid #1e2c32',borderRadius:'12px',padding:'16px'}}>
      <div style={{fontFamily:M,fontSize:'8px',color:'#85a4ad',letterSpacing:'2px',marginBottom:'14px'}}>{title}</div>
      {children}
    </div>
  )

  const MonthTooltip = ({ active, payload }) => {
    if (!active||!payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{background:'#161e24',border:'1px solid #263840',borderRadius:'8px',padding:'10px 14px'}}>
        <div style={{fontFamily:M,fontSize:'8px',color:'#85a4ad',marginBottom:'4px',letterSpacing:'1px'}}>{d.label}</div>
        <div style={{fontFamily:M,fontSize:'13px',fontWeight:700,color:d.pnl>=0?'#00e5b0':'#ff4f6b'}}>{d.pnl>=0?'+':''}${d.pnl}</div>
        <div style={{fontFamily:M,fontSize:'9px',color:'#85a4ad',marginTop:'2px'}}>{d.wr}% WR · {d.r>=0?'+':''}{d.r}R · {d.total}t</div>
      </div>
    )
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

      <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',gap:'6px'}}>
          {['Totalt','Denna månad','Denna vecka'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              fontFamily:M,fontSize:'9px',padding:'7px 13px',borderRadius:'7px',
              border:`1px solid ${filter===f?'#007d5e':'#1e2c32'}`,
              background:filter===f?'#001810':'transparent',
              color:filter===f?'#00e5b0':'#85a4ad',cursor:'pointer',letterSpacing:'1px',
              transition:'all 0.15s',
            }}>{f}</button>
          ))}
        </div>
        <button onClick={()=>exportCSV(journal)} style={{
          fontFamily:M,fontSize:'9px',padding:'7px 13px',borderRadius:'7px',
          border:'1px solid #1e2c32',background:'transparent',color:'#85a4ad',
          cursor:'pointer',letterSpacing:'1px',transition:'all 0.15s',display:'flex',alignItems:'center',gap:'5px',
        }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#00e5b0';e.currentTarget.style.color='#00e5b0'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e2c32';e.currentTarget.style.color='#85a4ad'}}
        >↓ CSV</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'10px'}}>
        {card('WIN RATE',     `${wr}%`,                                         '#00e5b0',`${trades.length} trades`)}
        {card('TOTAL P&L',   `${tPnl>=0?'+':''}$${Math.round(tPnl)}`,         tPnl>=0?'#00e5b0':'#ff4f6b')}
        {card('WINS',         String(wins),                                     '#00e5b0')}
        {card('LOSSES',       String(losses),                                   '#ff4f6b')}
        {card('AVG RR',       avgRR,                                            '#00e5b0','på vinster')}
        {card('MAX DRAWDOWN', `-$${Math.round(maxDD)}`,                         '#ff4f6b')}
      </div>

      {/* ── REGELFÖLJSAMHET ── */}
      {trades.length > 0 && (() => {
        const cleanTrades = trades.filter(t =>
          !t.checklistViolation &&
          !(t.brokenRules?.length > 0) &&
          !(t.psychTags||[]).some(id => VIOLATION_TAGS.has(id))
        )
        const violTrades = trades.filter(t =>
          t.checklistViolation ||
          (t.brokenRules?.length > 0) ||
          (t.psychTags||[]).some(id => VIOLATION_TAGS.has(id))
        )
        const cleanWins  = cleanTrades.filter(t => WIN_RESULTS.has(t.result)).length
        const cleanWR    = cleanTrades.length > 0 ? Math.round(cleanWins / cleanTrades.length * 100) : 0
        const cleanPnl   = cleanTrades.reduce((s,t) => s + parseFloat(t.pnl||0), 0)
        const violWins   = violTrades.filter(t => WIN_RESULTS.has(t.result)).length
        const violWR     = violTrades.length > 0 ? Math.round(violWins / violTrades.length * 100) : 0
        const violPnl    = violTrades.reduce((s,t) => s + parseFloat(t.pnl||0), 0)
        return (
          <div style={{background:'#161e24',border:'1px solid #1e2c32',borderRadius:'12px',padding:'16px'}}>
            <div style={{fontFamily:M,fontSize:'8px',color:'#85a4ad',letterSpacing:'2px',marginBottom:'12px'}}>REGELFÖLJSAMHET</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              <div style={{background:'#001810',border:'1px solid rgba(0,229,176,0.15)',borderRadius:'10px',padding:'14px'}}>
                <div style={{fontFamily:M,fontSize:'8px',color:'#00e5b0',letterSpacing:'2px',marginBottom:'3px'}}>CLEAN</div>
                <div style={{fontFamily:M,fontSize:'8px',color:'#4a7060',marginBottom:'12px'}}>Följde alla regler</div>
                <div style={{fontFamily:M,fontSize:'28px',fontWeight:700,color:'#00e5b0',lineHeight:1}}>{cleanWR}%</div>
                <div style={{fontFamily:M,fontSize:'8px',color:'#4a7060',marginBottom:'8px'}}>Win Rate</div>
                <div style={{fontFamily:M,fontSize:'16px',fontWeight:700,color:cleanPnl>=0?'#00e5b0':'#ff4f6b'}}>{cleanPnl>=0?'+':''}${Math.round(cleanPnl)}</div>
                <div style={{fontFamily:M,fontSize:'8px',color:'#5a7a84',marginTop:'2px'}}>{cleanTrades.length} trades</div>
              </div>
              <div style={{background:'#1a0610',border:'1px solid rgba(255,79,107,0.15)',borderRadius:'10px',padding:'14px'}}>
                <div style={{fontFamily:M,fontSize:'8px',color:'#ff4f6b',letterSpacing:'2px',marginBottom:'3px'}}>VIOLATION</div>
                <div style={{fontFamily:M,fontSize:'8px',color:'#5a3040',marginBottom:'12px'}}>Bröt ≥1 regel</div>
                <div style={{fontFamily:M,fontSize:'28px',fontWeight:700,color:violWR>=50?'#00e5b0':'#ff4f6b',lineHeight:1}}>{violWR}%</div>
                <div style={{fontFamily:M,fontSize:'8px',color:'#5a3040',marginBottom:'8px'}}>Win Rate</div>
                <div style={{fontFamily:M,fontSize:'16px',fontWeight:700,color:violPnl>=0?'#00e5b0':'#ff4f6b'}}>{violPnl>=0?'+':''}${Math.round(violPnl)}</div>
                <div style={{fontFamily:M,fontSize:'8px',color:'#5a7a84',marginTop:'2px'}}>{violTrades.length} trades</div>
              </div>
            </div>
          </div>
        )
      })()}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
        {section('R-BREAKDOWN',
          <div style={{display:'flex',flexDirection:'column',gap:'9px'}}>
            {rData.map((r,i)=>{
              const pct=trades.length>0?r.count/trades.length*100:0
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <div style={{fontFamily:M,fontSize:'10px',color:r.c,width:'26px'}}>{r.label}</div>
                  <div style={{flex:1,height:'5px',background:'#0d1214',borderRadius:'3px',overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:r.c,borderRadius:'3px',transition:'width 0.4s ease'}} />
                  </div>
                  <div style={{fontFamily:M,fontSize:'9px',color:'#85a4ad',width:'20px',textAlign:'right'}}>{r.count}</div>
                </div>
              )
            })}
          </div>
        )}
        {section('TOTAL R',
          <>
            <div style={{fontFamily:M,fontSize:'34px',fontWeight:700,color:totalR>=0?'#00e5b0':'#ff4f6b',lineHeight:1,marginBottom:'5px'}}>{totalR>=0?'+':''}{totalR}R</div>
            <div style={{fontFamily:M,fontSize:'9px',color:'#85a4ad',marginBottom:'14px'}}>Snitt {avgR}R / trade</div>
            <div style={{fontFamily:M,fontSize:'8px',color:'#85a4ad',letterSpacing:'1px',marginBottom:'5px'}}>EDGE</div>
            <div style={{fontFamily:M,fontSize:'16px',fontWeight:700,color:parseFloat(avgR)>=0.5?'#00e5b0':parseFloat(avgR)>=0?'#ffc030':'#ff4f6b'}}>{parseFloat(avgR)>=0?'+':''}{avgR}R</div>
            <div style={{fontFamily:M,fontSize:'8px',color:'#85a4ad',marginTop:'3px'}}>{parseFloat(avgR)>=0.5?'✓ Positiv edge':parseFloat(avgR)>=0?'⚠ Svag edge':'✗ Negativ edge'}</div>
          </>
        )}
      </div>

      {best && worst && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
          <div style={{background:'#161e24',border:'1px solid rgba(0,229,176,0.12)',borderRadius:'12px',padding:'14px'}}>
            <div style={{fontFamily:M,fontSize:'8px',color:'#85a4ad',letterSpacing:'2px',marginBottom:'7px'}}>BÄSTA TRADE</div>
            <div style={{fontFamily:M,fontSize:'26px',fontWeight:700,color:'#00e5b0'}}>+${Math.round(parseFloat(best.pnl))}</div>
            <div style={{fontFamily:M,fontSize:'9px',color:'#85a4ad',marginTop:'4px'}}>{best.date} · {best.instrument}</div>
          </div>
          <div style={{background:'#161e24',border:'1px solid rgba(255,79,107,0.12)',borderRadius:'12px',padding:'14px'}}>
            <div style={{fontFamily:M,fontSize:'8px',color:'#85a4ad',letterSpacing:'2px',marginBottom:'7px'}}>SÄMSTA TRADE</div>
            <div style={{fontFamily:M,fontSize:'26px',fontWeight:700,color:'#ff4f6b'}}>${Math.round(parseFloat(worst.pnl))}</div>
            <div style={{fontFamily:M,fontSize:'9px',color:'#85a4ad',marginTop:'4px'}}>{worst.date} · {worst.instrument}</div>
          </div>
        </div>
      )}

      {section('EQUITY CURVE',
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={eqData}>
            <XAxis dataKey="date" stroke="#1e2c32" tick={{fill:'#85a4ad',fontSize:8,fontFamily:M}} interval="preserveStartEnd" />
            <YAxis stroke="#1e2c32" tick={{fill:'#85a4ad',fontSize:8,fontFamily:M}} width={42} />
            <Tooltip contentStyle={{background:'#161e24',border:'1px solid #263840',color:'#d0e8ec',fontFamily:M,fontSize:'11px'}} formatter={v=>[`$${v}`,'P&L']} />
            <ReferenceLine y={0} stroke="#263840" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="pnl" stroke={eqPos?'#00e5b0':'#ff4f6b'} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* ── MONTHLY OVERVIEW ── */}
      {monthlyData.length > 1 && (
        <div style={{background:'#161e24',border:'1px solid #1e2c32',borderRadius:'12px',padding:'16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
            <div style={{fontFamily:M,fontSize:'8px',color:'#85a4ad',letterSpacing:'2px'}}>MÅNADSÖVERSIKT</div>
            <div style={{display:'flex',gap:'4px'}}>
              {[['pnl','P&L'],['wr','WR %'],['r','R']].map(([v,l])=>(
                <button key={v} onClick={()=>setMonthView(v)} style={{
                  fontFamily:M,fontSize:'8px',padding:'4px 9px',borderRadius:'5px',
                  border:`1px solid ${monthView===v?'#007d5e':'#1e2c32'}`,
                  background:monthView===v?'#001810':'transparent',
                  color:monthView===v?'#00e5b0':'#85a4ad',cursor:'pointer',
                  transition:'all 0.15s',letterSpacing:'0.5px',
                }}>{l}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} barSize={monthlyData.length>8?14:20} margin={{top:4,right:0,left:0,bottom:0}}>
              <XAxis dataKey="label" tick={{fill:'#85a4ad',fontSize:8,fontFamily:M}} axisLine={false} tickLine={false} />
              <YAxis hide />
              <ReferenceLine y={0} stroke="#263840" strokeDasharray="3 3" />
              <Tooltip content={<MonthTooltip />} cursor={{fill:'rgba(255,255,255,0.03)'}} />
              <Bar dataKey={monthView} radius={[3,3,0,0]}>
                {monthlyData.map((m,i) => {
                  const val = m[monthView]
                  const color = monthView==='wr'
                    ? (val>=50?'#00e5b0':'#ff4f6b')
                    : (val>=0?'#00e5b0':'#ff4f6b')
                  return <Cell key={i} fill={color} fillOpacity={0.85} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Monthly table */}
          <div style={{marginTop:'12px',display:'flex',flexDirection:'column',gap:'4px'}}>
            {[...monthlyData].reverse().slice(0,6).map((m,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 8px',borderRadius:'6px',background:i===0?'#111820':'transparent'}}>
                <div style={{fontFamily:M,fontSize:'9px',color:'#88a8ae',textTransform:'uppercase',minWidth:'50px'}}>{m.label}</div>
                <div style={{fontFamily:M,fontSize:'10px',fontWeight:700,color:m.pnl>=0?'#00e5b0':'#ff4f6b',minWidth:'60px',textAlign:'right'}}>{m.pnl>=0?'+':''}${m.pnl}</div>
                <div style={{fontFamily:M,fontSize:'9px',color:m.wr>=50?'#00e5b0':'#ff4f6b',minWidth:'40px',textAlign:'right'}}>{m.wr}%</div>
                <div style={{fontFamily:M,fontSize:'9px',color:m.r>=0?'#00e5b0':'#ff4f6b',minWidth:'36px',textAlign:'right'}}>{m.r>=0?'+':''}{m.r}R</div>
                <div style={{fontFamily:M,fontSize:'8px',color:'#5a7a84',minWidth:'24px',textAlign:'right'}}>{m.total}t</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── REGELFÖLJSAMHET ── */}
      {(cleanTrades.length > 0 || brokenTrades.length > 0) && section('REGELFÖLJSAMHET — CHECKLISTA',
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          <div style={{fontFamily:M,fontSize:'8px',color:'#5a7a84',marginBottom:'2px'}}>Jämförelse: trades som följde alla regler vs bröt regler</div>

          {/* Clean trades */}
          <div style={{background:'#0d1214',border:'1px solid rgba(0,229,176,0.15)',borderRadius:'9px',padding:'12px 14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                <span style={{fontFamily:M,fontSize:'9px',color:'#00e5b0',fontWeight:700}}>✓ FÖLJDE REGLER</span>
                <span style={{fontFamily:M,fontSize:'8px',color:'#5a7a84'}}>{cleanTrades.length} trades</span>
              </div>
              <span style={{fontFamily:M,fontSize:'13px',fontWeight:700,color:cleanPnl>=0?'#00e5b0':'#ff4f6b'}}>{cleanPnl>=0?'+':''}${Math.round(cleanPnl)}</span>
            </div>
            <div style={{display:'flex',gap:'14px'}}>
              <div>
                <div style={{fontFamily:M,fontSize:'7px',color:'#5a7a84',letterSpacing:'1px',marginBottom:'2px'}}>WIN RATE</div>
                <div style={{fontFamily:M,fontSize:'20px',fontWeight:700,color:cleanWR!=null&&cleanWR>=50?'#00e5b0':'#ffc030',lineHeight:1}}>{cleanWR!=null?`${cleanWR}%`:'—'}</div>
              </div>
              <div>
                <div style={{fontFamily:M,fontSize:'7px',color:'#5a7a84',letterSpacing:'1px',marginBottom:'2px'}}>VINSTER</div>
                <div style={{fontFamily:M,fontSize:'20px',fontWeight:700,color:'#00e5b0',lineHeight:1}}>{cleanWins}</div>
              </div>
              <div>
                <div style={{fontFamily:M,fontSize:'7px',color:'#5a7a84',letterSpacing:'1px',marginBottom:'2px'}}>FÖRLUSTER</div>
                <div style={{fontFamily:M,fontSize:'20px',fontWeight:700,color:'#ff4f6b',lineHeight:1}}>{cleanTrades.filter(t=>t.result==='loss').length}</div>
              </div>
            </div>
          </div>

          {/* Broken-rules trades */}
          <div style={{background:'#0d1214',border:'1px solid rgba(255,79,107,0.15)',borderRadius:'9px',padding:'12px 14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                <span style={{fontFamily:M,fontSize:'9px',color:'#ff4f6b',fontWeight:700}}>✗ BRÖT REGLER</span>
                <span style={{fontFamily:M,fontSize:'8px',color:'#5a7a84'}}>{brokenTrades.length} trades</span>
              </div>
              <span style={{fontFamily:M,fontSize:'13px',fontWeight:700,color:brokenPnl>=0?'#00e5b0':'#ff4f6b'}}>{brokenPnl>=0?'+':''}${Math.round(brokenPnl)}</span>
            </div>
            <div style={{display:'flex',gap:'14px'}}>
              <div>
                <div style={{fontFamily:M,fontSize:'7px',color:'#5a7a84',letterSpacing:'1px',marginBottom:'2px'}}>WIN RATE</div>
                <div style={{fontFamily:M,fontSize:'20px',fontWeight:700,color:brokenWR!=null&&brokenWR>=50?'#00e5b0':'#ff4f6b',lineHeight:1}}>{brokenWR!=null?`${brokenWR}%`:'—'}</div>
              </div>
              <div>
                <div style={{fontFamily:M,fontSize:'7px',color:'#5a7a84',letterSpacing:'1px',marginBottom:'2px'}}>VINSTER</div>
                <div style={{fontFamily:M,fontSize:'20px',fontWeight:700,color:'#00e5b0',lineHeight:1}}>{brokenWins}</div>
              </div>
              <div>
                <div style={{fontFamily:M,fontSize:'7px',color:'#5a7a84',letterSpacing:'1px',marginBottom:'2px'}}>FÖRLUSTER</div>
                <div style={{fontFamily:M,fontSize:'20px',fontWeight:700,color:'#ff4f6b',lineHeight:1}}>{brokenTrades.filter(t=>t.result==='loss').length}</div>
              </div>
            </div>
          </div>
        </div>
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
                    <span style={{fontFamily:M,fontSize:'8px',color:'#85a4ad'}}>{s.total}t</span>
                  </div>
                  <span style={{fontFamily:M,fontSize:'12px',fontWeight:700,color:s.pnl>=0?'#00e5b0':'#ff4f6b'}}>{s.pnl>=0?'+':''}${Math.round(s.pnl)}</span>
                </div>
                <div style={{height:'4px',background:'#0d1214',borderRadius:'2px',overflow:'hidden'}}>
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
            const isViolation = VIOLATION_TAGS.has(id)
            return (
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{fontFamily:M,fontSize:'11px',color:isViolation?'#ff4f6b':'#d0e8ec'}}>{PSYCH_LABELS[id]||id}</span>
                  {isViolation && <span style={{fontFamily:M,fontSize:'7px',color:'#ff4f6b',background:'#1a0610',border:'1px solid rgba(255,79,107,0.2)',borderRadius:'3px',padding:'1px 5px'}}>VIOLATION</span>}
                  <span style={{fontFamily:M,fontSize:'9px',color:'#85a4ad'}}>{s.total}x</span>
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
          <div style={{fontFamily:M,fontSize:'8px',color:'#5a7a84',marginBottom:'12px'}}>Gråa = under 3 trades</div>
          <div style={{display:'flex',gap:'8px',alignItems:'flex-end',height:'100px'}}>
            {dayStats.map((d,i)=>{
              const c  = d.total===0?'#161e24':!d.reliable?'#1a2428':d.wr>=50?'#007d5e':'#7a1020'
              const tc = d.total===0?'#263840':!d.reliable?'#85a4ad':d.wr>=50?'#00e5b0':'#ff4f6b'
              const h  = d.total===0?'5px':`${Math.max(d.wr,5)}%`
              return (
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',height:'100%',justifyContent:'flex-end'}}>
                  <div style={{fontFamily:M,fontSize:'9px',color:tc}}>{d.total===0?'—':`${d.wr}%`}</div>
                  <div style={{width:'100%',height:h,background:c,borderRadius:'3px 3px 0 0',transition:'height 0.3s ease'}} />
                  <div style={{fontFamily:M,fontSize:'8px',color:'#85a4ad'}}>{d.day.slice(0,3)}</div>
                  <div style={{fontFamily:M,fontSize:'7px',color:'#5a7a84'}}>{d.total}t</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}