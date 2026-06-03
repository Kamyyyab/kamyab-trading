import { useState } from 'react'
import { useT, useLang } from './lang.js'
import { LineChart, AreaChart, Area, BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'

const M = "'JetBrains Mono', monospace"
const WIN_RESULTS = new Set(['win','win2','tp1','tp2','tp3'])
const VIOLATION_TAGS = new Set(['fomo','revenge','forced','slmoved'])
const PSYCH_LABELS = { patient:'Tålmodig', fomo:'FOMO', revenge:'Hämndtrade', aplus:'A+ Setup', forced:'Forcerat', setforget:'Set & Forget', slmoved:'SL flytt', managed:'Hanterat bra' }

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

export default function Statistics({ journal = [], weeklyReviews = {}, onSaveWeeklyReview, settings = {}, onSaveSettings }) {
  const t = useT()
  const lang = useLang()
  const [filter, setFilter] = useState('total')
  const [monthView, setMonthView] = useState('pnl') // 'pnl' | 'wr' | 'r'
  const [editStartBal, setEditStartBal] = useState(false)
  const [startBalInput, setStartBalInput] = useState('')
  const [setupFilter,    setSetupFilter]    = useState(null)
  const [statsTab,       setStatsTab]       = useState('stats')
  const [sortCol,        setSortCol]        = useState('date')
  const [sortDir,        setSortDir]        = useState('desc')
  const [tableSearch,    setTableSearch]    = useState('')
  const [tableOutcome,   setTableOutcome]   = useState('all')

  function filterTrades(tr) {
    const now = new Date()
    if (filter==='week') {
      const ws = new Date(now); ws.setDate(now.getDate()-((now.getDay()+6)%7)); ws.setHours(0,0,0,0)
      return tr.filter(x=>new Date(x.date)>=ws)
    }
    if (filter==='month') return tr.filter(x=>new Date(x.date)>=new Date(now.getFullYear(),now.getMonth(),1))
    return tr
  }

  const all      = filterTrades(journal)
  const trades   = all.filter(t=>t.result!=='skip'&&t.result!=='no-setup')
  const viewTrades = setupFilter ? trades.filter(t=>(t.setup||'Otaggad')===setupFilter) : trades
  const wins   = viewTrades.filter(t=>WIN_RESULTS.has(t.result)).length
  const losses = viewTrades.filter(t=>t.result==='loss').length
  const wr     = viewTrades.length>0?((wins/viewTrades.length)*100).toFixed(1):0
  const tPnl   = viewTrades.reduce((s,t)=>s+parseFloat(t.pnl||0),0)

  const wTrades = viewTrades.filter(t=>WIN_RESULTS.has(t.result))
  const avgRR   = wTrades.length>0?(wTrades.reduce((s,t)=>s+(t.result==='win'||t.result==='tp3'?3:t.result==='win2'||t.result==='tp2'?2:1),0)/wTrades.length).toFixed(2):'0.00'

  const best  = viewTrades.filter(t=>t.pnl).sort((a,b)=>parseFloat(b.pnl)-parseFloat(a.pnl))[0]
  const worst = viewTrades.filter(t=>t.pnl).sort((a,b)=>parseFloat(a.pnl)-parseFloat(b.pnl))[0]

  let cum=0
  const eqData = [...viewTrades].reverse().map(t=>{ cum+=parseFloat(t.pnl||0); return {date:t.date.slice(5),pnl:Math.round(cum)} })
  const eqPos  = eqData.length>0&&eqData[eqData.length-1].pnl>=0

  let peak=0, maxDD=0
  const ddData = eqData.map(p => {
    if(p.pnl>peak) peak=p.pnl
    const dd = peak-p.pnl
    if(dd>maxDD) maxDD=dd
    return { date:p.date, dd:-Math.round(dd) }
  })

  const totalR = viewTrades.reduce((s,t)=>{ if(t.result==='win'||t.result==='tp3')return s+3; if(t.result==='win2'||t.result==='tp2')return s+2; if(t.result==='tp1')return s+1; if(t.result==='loss')return s-1; return s },0)
  const avgR   = viewTrades.length>0?(totalR/viewTrades.length).toFixed(2):'0.00'

  const rData = [
    {label:'+3R',count:viewTrades.filter(t=>t.result==='win'||t.result==='tp3').length, c:'#00e5b0'},
    {label:'+2R',count:viewTrades.filter(t=>t.result==='win2'||t.result==='tp2').length,c:'#4ab89a'},
    {label:'+1R',count:viewTrades.filter(t=>t.result==='tp1').length,                   c:'#2a7a60'},
    {label:'BE', count:viewTrades.filter(t=>t.result==='be').length,                    c:'#7a96b4'},
    {label:'-1R',count:viewTrades.filter(t=>t.result==='loss').length,                  c:'#ff4f6b'},
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
      label: new Date(key+'-15').toLocaleDateString(lang==='en'?'en-US':'sv-SE',{month:'short',year:'2-digit'}),
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

  // ── Time-of-day analysis (CET) ───────────────────────────────
  const TIME_BUCKETS = [
    { label:'15:30–16:00', from:15*60+30, to:16*60     },
    { label:'16:00–16:30', from:16*60,    to:16*60+30  },
    { label:'16:30–17:00', from:16*60+30, to:17*60     },
    { label:'17:00–17:30', from:17*60,    to:17*60+30  },
  ]
  function tsToMins(t) {
    if (t.tradeTime) {
      const parts = t.tradeTime.split(':')
      return parseInt(parts[0]) * 60 + parseInt(parts[1])
    }
    if (!t.timestamp) return null
    try {
      const s = new Date(t.timestamp).toLocaleTimeString('sv-SE', { timeZone:'Europe/Stockholm', hour:'2-digit', minute:'2-digit', hour12:false }).split(':')
      return parseInt(s[0])*60+parseInt(s[1])
    } catch { return null }
  }
  const timeStats = TIME_BUCKETS.map(b => {
    const bt = trades.filter(t => { const m=tsToMins(t); return m!==null&&m>=b.from&&m<b.to })
    const w  = bt.filter(t=>WIN_RESULTS.has(t.result)).length
    return { label:b.label, total:bt.length, wins:w, wr:bt.length>0?Math.round(w/bt.length*100):null, pnl:bt.reduce((s,t)=>s+parseFloat(t.pnl||0),0) }
  })
  const hasTimeData = timeStats.some(b=>b.total>0)
  const tradesWithTime = trades.filter(t => t.tradeTime).length
  const timeCoverage = trades.length > 0 ? Math.round(tradesWithTime / trades.length * 100) : 0

  // ── Setup trend (last 5 vs all-time) ─────────────────────────
  const setupTrends = {}
  Object.keys(setupStats).forEach(k => {
    const st   = trades.filter(t=>(t.setup||'Otaggad')===k).sort((a,b)=>a.date.localeCompare(b.date))
    const last5 = st.slice(-5)
    const l5wr  = last5.length>0 ? last5.filter(t=>WIN_RESULTS.has(t.result)).length/last5.length : null
    const totwr = setupStats[k].total>0 ? setupStats[k].wins/setupStats[k].total : null
    let arrow='—', color='#4a6888'
    if (last5.length>=3&&l5wr!==null&&totwr!==null) {
      if      (l5wr-totwr >  0.1) { arrow='↑'; color='#00e5b0' }
      else if (totwr-l5wr >  0.1) { arrow='↓'; color='#ff4f6b' }
      else                         { arrow='→'; color='#ffc030' }
    }
    setupTrends[k] = { arrow, color, l5wr:l5wr!==null?Math.round(l5wr*100):null, last5:last5.length }
  })

  const days = ['Måndag','Tisdag','Onsdag','Torsdag','Fredag']
  const dayStats = days.map((day,i)=>{ const dt=viewTrades.filter(t=>new Date(t.date).getDay()===(i+1)); const dw=dt.filter(t=>WIN_RESULTS.has(t.result)).length; return {day,wr:dt.length>0?Math.round(dw/dt.length*100):0,total:dt.length,reliable:dt.length>=3} })

  // ── Instrument breakdown ──────────────────────────────────────
  const instrStats = {}
  trades.forEach(t => {
    const k = t.instrument || 'Okänt'
    if (!instrStats[k]) instrStats[k] = { wins:0, total:0, pnl:0 }
    instrStats[k].total++; instrStats[k].pnl += parseFloat(t.pnl||0)
    if (WIN_RESULTS.has(t.result)) instrStats[k].wins++
  })
  const instrList = Object.entries(instrStats).sort(([,a],[,b]) => b.pnl - a.pnl)

  // ── Behavioral insights ───────────────────────────────────────
  const byEmotion = (lo, hi) => { const g=trades.filter(t=>{ const e=parseInt(t.emotion||5); return e>=lo&&e<=hi }); return { total:g.length, wins:g.filter(t=>WIN_RESULTS.has(t.result)).length, pnl:g.reduce((s,t)=>s+parseFloat(t.pnl||0),0) } }
  const emoLow  = byEmotion(1,3)   // lugn
  const emoMid  = byEmotion(4,6)   // neutral
  const emoHigh = byEmotion(7,10)  // stressad

  // Trade #1 vs #2 (sort by timestamp within each day)
  const byDay = {}
  trades.forEach(t => { if(!byDay[t.date])byDay[t.date]=[]; byDay[t.date].push(t) })
  const t1=[],t2=[]
  Object.values(byDay).forEach(dt => {
    const sorted=[...dt].sort((a,b)=>(a.timestamp||'').localeCompare(b.timestamp||''))
    if(sorted[0])t1.push(sorted[0]); if(sorted[1])t2.push(sorted[1])
  })
  const tradeNStat = arr => ({ total:arr.length, wins:arr.filter(t=>WIN_RESULTS.has(t.result)).length, pnl:arr.reduce((s,t)=>s+parseFloat(t.pnl||0),0) })
  const stat1=tradeNStat(t1), stat2=tradeNStat(t2)

  // After-loss-day pattern
  const allSortedByDate = [...journal.filter(t=>!['skip','no-setup'].includes(t.result))].sort((a,b)=>a.date.localeCompare(b.date))
  const dayPnl = {}
  allSortedByDate.forEach(t=>{ dayPnl[t.date]=(dayPnl[t.date]||0)+parseFloat(t.pnl||0) })
  const tradeDates = [...new Set(allSortedByDate.map(t=>t.date))].sort()
  const afterLossTrades=[], afterWinTrades=[]
  for(let i=1;i<tradeDates.length;i++){
    const prev=tradeDates[i-1], curr=tradeDates[i]
    const currTrades=allSortedByDate.filter(t=>t.date===curr)
    if((dayPnl[prev]||0)<0) afterLossTrades.push(...currTrades)
    else afterWinTrades.push(...currTrades)
  }
  const alStat = tradeNStat(afterLossTrades)
  const awStat = tradeNStat(afterWinTrades)

  // ── Account growth ────────────────────────────────────────────
  const startBal   = parseFloat(settings.startingBalance || 0)
  const allTradePnl = journal.filter(t=>!['skip','no-setup'].includes(t.result)).reduce((s,t)=>s+parseFloat(t.pnl||0),0)
  const currentBal  = startBal > 0 ? startBal + allTradePnl : 0
  const growthPct   = startBal > 0 ? ((allTradePnl / startBal) * 100) : null

  // ── Weekly review ─────────────────────────────────────────────
  const getWeekStart = (d=new Date()) => { const ds=new Date(d); ds.setDate(ds.getDate()-((ds.getDay()+6)%7)); ds.setHours(0,0,0,0); return ds.toISOString().slice(0,10) }
  const currentWeekStart = getWeekStart()
  const [rwRating, setRwRating] = useState(0)
  const [rwNote,   setRwNote]   = useState('')
  const [rwLesson, setRwLesson] = useState('')
  const [rwFocus,  setRwFocus]  = useState('')
  const weekTrades = trades.filter(t => t.date >= currentWeekStart)
  const weekWins   = weekTrades.filter(t=>WIN_RESULTS.has(t.result)).length
  const weekPnl    = weekTrades.reduce((s,t)=>s+parseFloat(t.pnl||0),0)
  const pastReviews = Object.entries(weeklyReviews).sort(([a],[b])=>b.localeCompare(a)).slice(0,6)

  const card = (label,value,color,sub) => (
    <div style={{background:'#0f1828',border:'1px solid #162340',borderRadius:'12px',padding:'14px 16px'}}>
      <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8',letterSpacing:'1.5px',marginBottom:'6px'}}>{label}</div>
      <div style={{fontFamily:M,fontSize:'24px',fontWeight:700,color,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontFamily:M,fontSize:'9px',color:'#7a96b4',marginTop:'4px'}}>{sub}</div>}
    </div>
  )

  const section = (title, children) => (
    <div style={{background:'#0f1828',border:'1px solid #162340',borderRadius:'12px',padding:'16px'}}>
      <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8',letterSpacing:'1.5px',marginBottom:'14px'}}>{title}</div>
      {children}
    </div>
  )

  const MonthTooltip = ({ active, payload }) => {
    if (!active||!payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{background:'#0f1828',border:'1px solid #1c2e4a',borderRadius:'8px',padding:'10px 14px'}}>
        <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8',marginBottom:'4px',letterSpacing:'1px'}}>{d.label}</div>
        <div style={{fontFamily:M,fontSize:'13px',fontWeight:700,color:d.pnl>=0?'#00e5b0':'#ff4f6b'}}>{d.pnl>=0?'+':''}${d.pnl}</div>
        <div style={{fontFamily:M,fontSize:'9px',color:'#7a96b4',marginTop:'2px'}}>{d.wr}% WR · {d.r>=0?'+':''}{d.r}R · {d.total}t</div>
      </div>
    )
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

      {setupFilter && (
        <div style={{background:'#18100a',border:'1px solid rgba(245,158,11,0.3)',borderRadius:'10px',padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{fontFamily:M,fontSize:'8px',color:'#f59e0b',letterSpacing:'1.5px'}}>{t.setupFilter}</span>
            <span style={{fontFamily:M,fontSize:'11px',fontWeight:700,color:'#f59e0b'}}>{setupFilter}</span>
            <span style={{fontFamily:M,fontSize:'9px',color:'#a07020'}}>{viewTrades.length} trades</span>
          </div>
          <button onClick={()=>setSetupFilter(null)} style={{fontFamily:M,fontSize:'9px',color:'#f59e0b',background:'none',border:'1px solid rgba(245,158,11,0.3)',borderRadius:'5px',padding:'3px 9px',cursor:'pointer'}}>{t.clearFilter}</button>
        </div>
      )}

      <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',gap:'6px'}}>
          {[['total',t.total],['month',t.thisMonth],['week',t.thisWeekBtn]].map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)} style={{
              fontFamily:M,fontSize:'9px',padding:'7px 13px',borderRadius:'7px',
              border:`1px solid ${filter===k?'rgba(245,158,11,0.5)':'#162340'}`,
              background:filter===k?'#18100a':'transparent',
              color:filter===k?'#f59e0b':'#7a96b4',cursor:'pointer',letterSpacing:'1px',
              transition:'all 0.15s',
            }}>{l}</button>
          ))}
        </div>
        <button onClick={()=>exportCSV(journal)} style={{
          fontFamily:M,fontSize:'9px',padding:'7px 13px',borderRadius:'7px',
          border:'1px solid #162340',background:'transparent',color:'#7a96b4',
          cursor:'pointer',letterSpacing:'1px',transition:'all 0.15s',display:'flex',alignItems:'center',gap:'5px',
        }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#00e5b0';e.currentTarget.style.color='#00e5b0'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#162340';e.currentTarget.style.color='#7a96b4'}}
        >{t.csvBtn}</button>
      </div>

      {/* ── TAB NAV ── */}
      <div style={{display:'flex',gap:'3px',background:'#0a1020',border:'1px solid #162340',borderRadius:'10px',padding:'3px'}}>
        {[['stats',t.statsTab_stats],['analys',t.statsTab_analys],['journal',t.statsTab_journal],['reflektion',t.statsTab_ref]].map(([id,label])=>(
          <button key={id} onClick={()=>setStatsTab(id)} style={{
            flex:1, background:statsTab===id?'#0f1828':'transparent',
            border:`1px solid ${statsTab===id?'#1c2e4a':'transparent'}`,
            borderRadius:'7px', color:statsTab===id?'#dce8f5':'#6880a0',
            fontFamily:M, fontSize:'9px', padding:'7px 4px', cursor:'pointer',
            letterSpacing:'0.5px', transition:'all 0.12s',
            WebkitTapHighlightColor:'transparent',
          }}>{label}</button>
        ))}
      </div>

      {statsTab === 'stats' && (<>
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
                  <div style={{flex:1,height:'5px',background:'#0a1020',borderRadius:'3px',overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:r.c,borderRadius:'3px',transition:'width 0.4s ease'}} />
                  </div>
                  <div style={{fontFamily:M,fontSize:'9px',color:'#7a96b4',width:'20px',textAlign:'right'}}>{r.count}</div>
                </div>
              )
            })}
          </div>
        )}
        {section('TOTAL R',
          <>
            <div style={{fontFamily:M,fontSize:'34px',fontWeight:700,color:totalR>=0?'#00e5b0':'#ff4f6b',lineHeight:1,marginBottom:'5px'}}>{totalR>=0?'+':''}{totalR}R</div>
            <div style={{fontFamily:M,fontSize:'9px',color:'#7a96b4',marginBottom:'14px'}}>Snitt {avgR}R / trade</div>
            <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8',letterSpacing:'1px',marginBottom:'5px'}}>EDGE</div>
            <div style={{fontFamily:M,fontSize:'16px',fontWeight:700,color:parseFloat(avgR)>=0.5?'#00e5b0':parseFloat(avgR)>=0?'#ffc030':'#ff4f6b'}}>{parseFloat(avgR)>=0?'+':''}{avgR}R</div>
            <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8',marginTop:'3px'}}>{parseFloat(avgR)>=0.5?'✓ Positiv edge':parseFloat(avgR)>=0?'⚠ Svag edge':'✗ Negativ edge'}</div>
          </>
        )}
      </div>

      {best && worst && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
          <div style={{background:'#0f1828',border:'1px solid rgba(0,229,176,0.12)',borderRadius:'12px',padding:'14px'}}>
            <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8',letterSpacing:'1.5px',marginBottom:'7px'}}>BÄSTA TRADE</div>
            <div style={{fontFamily:M,fontSize:'26px',fontWeight:700,color:'#00e5b0'}}>+${Math.round(parseFloat(best.pnl))}</div>
            <div style={{fontFamily:M,fontSize:'9px',color:'#7a96b4',marginTop:'4px'}}>{best.date} · {best.instrument}</div>
          </div>
          <div style={{background:'#0f1828',border:'1px solid rgba(255,79,107,0.12)',borderRadius:'12px',padding:'14px'}}>
            <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8',letterSpacing:'1.5px',marginBottom:'7px'}}>SÄMSTA TRADE</div>
            <div style={{fontFamily:M,fontSize:'26px',fontWeight:700,color:'#ff4f6b'}}>${Math.round(parseFloat(worst.pnl))}</div>
            <div style={{fontFamily:M,fontSize:'9px',color:'#7a96b4',marginTop:'4px'}}>{worst.date} · {worst.instrument}</div>
          </div>
        </div>
      )}

      {section('EQUITY CURVE',
        <>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={eqData}>
              <XAxis dataKey="date" stroke="#162340" tick={{fill:'#7a96b4',fontSize:8,fontFamily:M}} interval="preserveStartEnd" />
              <YAxis stroke="#162340" tick={{fill:'#7a96b4',fontSize:8,fontFamily:M}} width={42} />
              <Tooltip contentStyle={{background:'#0f1828',border:'1px solid #1c2e4a',color:'#dce8f5',fontFamily:M,fontSize:'11px'}} formatter={v=>[`$${v}`,'P&L']} />
              <ReferenceLine y={0} stroke="#1c2e4a" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="pnl" stroke={eqPos?'#00e5b0':'#ff4f6b'} dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          {maxDD > 0 && (
            <>
              <div style={{fontFamily:M,fontSize:'8px',color:'#7a3040',letterSpacing:'1.5px',marginTop:'12px',marginBottom:'6px'}}>DRAWDOWN</div>
              <ResponsiveContainer width="100%" height={70}>
                <AreaChart data={ddData} margin={{top:0,right:0,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4f6b" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#ff4f6b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{background:'#0f1828',border:'1px solid #1c2e4a',color:'#ff4f6b',fontFamily:M,fontSize:'10px'}} formatter={v=>[`$${Math.abs(v)}`,'Drawdown']} />
                  <Area type="monotone" dataKey="dd" stroke="#ff4f6b" strokeWidth={1} fill="url(#ddGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </>
      )}

      {/* ── MONTHLY OVERVIEW ── */}
      {monthlyData.length > 1 && (
        <div style={{background:'#0f1828',border:'1px solid #162340',borderRadius:'12px',padding:'16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
            <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8',letterSpacing:'2px'}}>MÅNADSÖVERSIKT</div>
            <div style={{display:'flex',gap:'4px'}}>
              {[['pnl','P&L'],['wr','WR %'],['r','R']].map(([v,l])=>(
                <button key={v} onClick={()=>setMonthView(v)} style={{
                  fontFamily:M,fontSize:'8px',padding:'4px 9px',borderRadius:'5px',
                  border:`1px solid ${monthView===v?'#007d5e':'#162340'}`,
                  background:monthView===v?'#001810':'transparent',
                  color:monthView===v?'#00e5b0':'#7a96b4',cursor:'pointer',
                  transition:'all 0.15s',letterSpacing:'0.5px',
                }}>{l}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} barSize={monthlyData.length>8?14:20} margin={{top:4,right:0,left:0,bottom:0}}>
              <XAxis dataKey="label" tick={{fill:'#7a96b4',fontSize:8,fontFamily:M}} axisLine={false} tickLine={false} />
              <YAxis hide />
              <ReferenceLine y={0} stroke="#1c2e4a" strokeDasharray="3 3" />
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
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 8px',borderRadius:'6px',background:i===0?'#0c1422':'transparent'}}>
                <div style={{fontFamily:M,fontSize:'9px',color:'#7a96b4',textTransform:'uppercase',minWidth:'50px'}}>{m.label}</div>
                <div style={{fontFamily:M,fontSize:'10px',fontWeight:700,color:m.pnl>=0?'#00e5b0':'#ff4f6b',minWidth:'60px',textAlign:'right'}}>{m.pnl>=0?'+':''}${m.pnl}</div>
                <div style={{fontFamily:M,fontSize:'9px',color:m.wr>=50?'#00e5b0':'#ff4f6b',minWidth:'40px',textAlign:'right'}}>{m.wr}%</div>
                <div style={{fontFamily:M,fontSize:'9px',color:m.r>=0?'#00e5b0':'#ff4f6b',minWidth:'36px',textAlign:'right'}}>{m.r>=0?'+':''}{m.r}R</div>
                <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0',minWidth:'24px',textAlign:'right'}}>{m.total}t</div>
              </div>
            ))}
          </div>
        </div>
      )}
      </>)}

      {statsTab === 'analys' && (<>
      {/* ── REGELFÖLJSAMHET ── */}
      {(cleanTrades.length > 0 || brokenTrades.length > 0) && section('REGELFÖLJSAMHET — CHECKLISTA',
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0',marginBottom:'2px'}}>Jämförelse: trades som följde alla regler vs bröt regler</div>

          {/* Clean trades */}
          <div style={{background:'#0a1020',border:'1px solid rgba(0,229,176,0.15)',borderRadius:'9px',padding:'12px 14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                <span style={{fontFamily:M,fontSize:'9px',color:'#00e5b0',fontWeight:700}}>✓ FÖLJDE REGLER</span>
                <span style={{fontFamily:M,fontSize:'9px',color:'#6880a0'}}>{cleanTrades.length} trades</span>
              </div>
              <span style={{fontFamily:M,fontSize:'13px',fontWeight:700,color:cleanPnl>=0?'#00e5b0':'#ff4f6b'}}>{cleanPnl>=0?'+':''}${Math.round(cleanPnl)}</span>
            </div>
            <div style={{display:'flex',gap:'14px'}}>
              <div>
                <div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',letterSpacing:'1px',marginBottom:'2px'}}>WIN RATE</div>
                <div style={{fontFamily:M,fontSize:'20px',fontWeight:700,color:cleanWR!=null&&cleanWR>=50?'#00e5b0':'#ffc030',lineHeight:1}}>{cleanWR!=null?`${cleanWR}%`:'—'}</div>
              </div>
              <div>
                <div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',letterSpacing:'1px',marginBottom:'2px'}}>VINSTER</div>
                <div style={{fontFamily:M,fontSize:'20px',fontWeight:700,color:'#00e5b0',lineHeight:1}}>{cleanWins}</div>
              </div>
              <div>
                <div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',letterSpacing:'1px',marginBottom:'2px'}}>FÖRLUSTER</div>
                <div style={{fontFamily:M,fontSize:'20px',fontWeight:700,color:'#ff4f6b',lineHeight:1}}>{cleanTrades.filter(t=>t.result==='loss').length}</div>
              </div>
            </div>
          </div>

          {/* Broken-rules trades */}
          <div style={{background:'#0a1020',border:'1px solid rgba(255,79,107,0.15)',borderRadius:'9px',padding:'12px 14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                <span style={{fontFamily:M,fontSize:'9px',color:'#ff4f6b',fontWeight:700}}>✗ BRÖT REGLER</span>
                <span style={{fontFamily:M,fontSize:'9px',color:'#6880a0'}}>{brokenTrades.length} trades</span>
              </div>
              <span style={{fontFamily:M,fontSize:'13px',fontWeight:700,color:brokenPnl>=0?'#00e5b0':'#ff4f6b'}}>{brokenPnl>=0?'+':''}${Math.round(brokenPnl)}</span>
            </div>
            <div style={{display:'flex',gap:'14px'}}>
              <div>
                <div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',letterSpacing:'1px',marginBottom:'2px'}}>WIN RATE</div>
                <div style={{fontFamily:M,fontSize:'20px',fontWeight:700,color:brokenWR!=null&&brokenWR>=50?'#00e5b0':'#ff4f6b',lineHeight:1}}>{brokenWR!=null?`${brokenWR}%`:'—'}</div>
              </div>
              <div>
                <div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',letterSpacing:'1px',marginBottom:'2px'}}>VINSTER</div>
                <div style={{fontFamily:M,fontSize:'20px',fontWeight:700,color:'#00e5b0',lineHeight:1}}>{brokenWins}</div>
              </div>
              <div>
                <div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',letterSpacing:'1px',marginBottom:'2px'}}>FÖRLUSTER</div>
                <div style={{fontFamily:M,fontSize:'20px',fontWeight:700,color:'#ff4f6b',lineHeight:1}}>{brokenTrades.filter(t=>t.result==='loss').length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {setupList.length>0 && section('P&L PER SETUP',
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {setupList.map(([tag,s],i)=>{
            const wr   = s.total>0?Math.round(s.wins/s.total*100):0
            const maxP = Math.max(...setupList.map(([,x])=>Math.abs(x.pnl)),1)
            const tr   = setupTrends[tag]
            const isActive = setupFilter === tag
            return (
              <div key={i} onClick={()=>setSetupFilter(isActive?null:tag)} style={{cursor:'pointer',padding:'6px 8px',borderRadius:'8px',margin:'-6px -8px',background:isActive?'#18100a':'transparent',border:`1px solid ${isActive?'rgba(245,158,11,0.25)':'transparent'}`,transition:'all 0.15s'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                    <span style={{fontFamily:M,fontSize:'11px',color:isActive?'#f59e0b':'#dce8f5',fontWeight:600}}>{tag}</span>
                    <span style={{fontFamily:M,fontSize:'9px',color:wr>=50?'#00e5b0':'#ff4f6b'}}>{wr}%</span>
                    <span style={{fontFamily:M,fontSize:'9px',color:'#8aabb8'}}>{s.total}t</span>
                    {tr?.arrow!=='—'&&<span style={{fontFamily:M,fontSize:'12px',fontWeight:700,color:tr.color}}>{tr.arrow}</span>}
                    {tr?.l5wr!==null&&tr?.last5>=3&&<span style={{fontFamily:M,fontSize:'8px',color:'#6880a0'}}>sista 5: {tr.l5wr}%</span>}
                  </div>
                  <span style={{fontFamily:M,fontSize:'12px',fontWeight:700,color:s.pnl>=0?'#00e5b0':'#ff4f6b'}}>{s.pnl>=0?'+':''}${Math.round(s.pnl)}</span>
                </div>
                <div style={{height:'4px',background:'#0a1020',borderRadius:'2px',overflow:'hidden'}}>
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
                  <span style={{fontFamily:M,fontSize:'11px',color:isViolation?'#ff4f6b':'#dce8f5'}}>{(t.psych[id]||PSYCH_LABELS[id]||id)}</span>
                  {isViolation && <span style={{fontFamily:M,fontSize:'7px',color:'#ff4f6b',background:'#1a0610',border:'1px solid rgba(255,79,107,0.2)',borderRadius:'3px',padding:'1px 5px'}}>VIOLATION</span>}
                  <span style={{fontFamily:M,fontSize:'9px',color:'#7a96b4'}}>{s.total}x</span>
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

      {/* ── ACCOUNT GROWTH ── */}
      <div style={{background:'#0f1828',border:'1px solid #162340',borderRadius:'12px',padding:'16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>
          <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8',letterSpacing:'2px'}}>KONTOUTVECKLING</div>
          {!editStartBal ? (
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              {startBal>0&&<span style={{fontFamily:M,fontSize:'9px',color:'#6880a0'}}>Start: ${startBal.toLocaleString()}</span>}
              <button onClick={()=>{setStartBalInput(String(startBal||''));setEditStartBal(true)}} style={{background:'none',border:'1px solid #162340',borderRadius:'4px',color:'#7a96b4',fontFamily:M,fontSize:'8px',padding:'2px 8px',cursor:'pointer'}}>{startBal>0?'✎ Ändra':'+ Sätt startkapital'}</button>
            </div>
          ) : (
            <div style={{display:'flex',gap:'5px',alignItems:'center'}}>
              <span style={{fontFamily:M,fontSize:'9px',color:'#8aabb8'}}>$</span>
              <input autoFocus type="number" value={startBalInput} onChange={e=>setStartBalInput(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'){onSaveSettings?.({startingBalance:parseFloat(startBalInput)||0});setEditStartBal(false)}if(e.key==='Escape')setEditStartBal(false)}}
                placeholder="50000" style={{width:'80px',background:'#08101c',border:'1px solid #4a6888',borderRadius:'5px',color:'#dce8f5',fontFamily:M,fontSize:'11px',padding:'3px 7px',outline:'none'}} />
              <button onClick={()=>{onSaveSettings?.({startingBalance:parseFloat(startBalInput)||0});setEditStartBal(false)}} style={{background:'#00e5b0',border:'none',borderRadius:'4px',color:'#020f08',fontFamily:M,fontSize:'8px',padding:'3px 8px',cursor:'pointer',fontWeight:700}}>OK</button>
              <button onClick={()=>setEditStartBal(false)} style={{background:'none',border:'1px solid #162340',borderRadius:'4px',color:'#7a96b4',fontFamily:M,fontSize:'8px',padding:'3px 7px',cursor:'pointer'}}>✕</button>
            </div>
          )}
        </div>
        {startBal>0 ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'}}>
            {[
              {label:'STARTKAPITAL', val:`$${Math.round(startBal).toLocaleString()}`,       c:'#7a96b4', bg:'#0a1020',   bdr:'#162340'},
              {label:'NUVARANDE',    val:`$${Math.round(currentBal).toLocaleString()}`,      c:currentBal>=startBal?'#00e5b0':'#ff4f6b', bg:'#0a1020', bdr:'#162340'},
              {label:'TILLVÄXT',     val:`${growthPct>=0?'+':''}${growthPct?.toFixed(1)}%`,  c:growthPct>=0?'#00e5b0':'#ff4f6b', bg:growthPct>=0?'#001810':'#1a0610', bdr:growthPct>=0?'rgba(0,229,176,0.2)':'rgba(255,79,107,0.2)'},
            ].map(({label,val,c,bg,bdr},i)=>(
              <div key={i} style={{background:bg,border:`1px solid ${bdr}`,borderRadius:'8px',padding:'12px'}}>
                <div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',letterSpacing:'1px',marginBottom:'4px'}}>{label}</div>
                <div style={{fontFamily:M,fontSize:'18px',fontWeight:700,color:c,lineHeight:1}}>{val}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{fontFamily:M,fontSize:'9px',color:'#3a5878'}}>Sätt ditt startkapital för att spåra procentuell tillväxt</div>
        )}
      </div>

      {/* ── INSTRUMENT BREAKDOWN ── */}
      {instrList.length>0 && section('P&L PER INSTRUMENT',
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {instrList.map(([instr,s],i)=>{
            const iwr=s.total>0?Math.round(s.wins/s.total*100):0
            const maxP=Math.max(...instrList.map(([,x])=>Math.abs(x.pnl)),1)
            return (
              <div key={i}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{fontFamily:M,fontSize:'11px',color:'#dce8f5',fontWeight:600}}>{instr}</span>
                    <span style={{fontFamily:M,fontSize:'9px',color:iwr>=50?'#00e5b0':'#ff4f6b'}}>{iwr}%</span>
                    <span style={{fontFamily:M,fontSize:'9px',color:'#8aabb8'}}>{s.total}t</span>
                  </div>
                  <span style={{fontFamily:M,fontSize:'12px',fontWeight:700,color:s.pnl>=0?'#00e5b0':'#ff4f6b'}}>{s.pnl>=0?'+':''}${Math.round(s.pnl)}</span>
                </div>
                <div style={{height:'4px',background:'#0a1020',borderRadius:'2px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${Math.abs(s.pnl)/maxP*100}%`,background:s.pnl>=0?'#007d5e':'#7a1020',borderRadius:'2px',transition:'width 0.4s ease'}} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── BEHAVIORAL INSIGHTS ── */}
      {trades.length>=5 && section('BETEENDEINSIKTER',
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div>
            <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0',letterSpacing:'1px',marginBottom:'8px'}}>EMOTION VS PRESTATION</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
              {[{label:'Lugn (1–3)',s:emoLow,c:'#00e5b0'},{label:'Neutral (4–6)',s:emoMid,c:'#ffc030'},{label:'Stressad (7–10)',s:emoHigh,c:'#ff4f6b'}].map(({label,s,c},i)=>{
                const ewr=s.total>0?Math.round(s.wins/s.total*100):null
                return (
                  <div key={i} style={{background:'#0a1020',border:'1px solid #162340',borderRadius:'8px',padding:'10px 12px'}}>
                    <div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',marginBottom:'5px'}}>{label}</div>
                    <div style={{fontFamily:M,fontSize:'18px',fontWeight:700,color:ewr!=null?c:'#3a5878',lineHeight:1}}>{ewr!=null?`${ewr}%`:'—'}</div>
                    <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0',marginTop:'3px'}}>{s.total>0?`${s.total}t · ${s.pnl>=0?'+':''}$${Math.round(s.pnl)}`:'ingen data'}</div>
                  </div>
                )
              })}
            </div>
          </div>
          {(stat1.total>0||stat2.total>0)&&(
            <div>
              <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0',letterSpacing:'1px',marginBottom:'8px'}}>TRADE #1 VS TRADE #2 PER DAG</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                {[{label:'Trade #1',s:stat1},{label:'Trade #2',s:stat2}].map(({label,s},i)=>{
                  const twr=s.total>0?Math.round(s.wins/s.total*100):null
                  return (
                    <div key={i} style={{background:'#0a1020',border:'1px solid #162340',borderRadius:'8px',padding:'10px 12px'}}>
                      <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0',marginBottom:'5px'}}>{label}</div>
                      <div style={{fontFamily:M,fontSize:'22px',fontWeight:700,color:twr!=null?(twr>=50?'#00e5b0':'#ff4f6b'):'#3a5878',lineHeight:1}}>{twr!=null?`${twr}%`:'—'}</div>
                      <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0',marginTop:'3px'}}>{s.total}t · {s.pnl>=0?'+':''}${Math.round(s.pnl)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {(alStat.total>0||awStat.total>0)&&(
            <div>
              <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0',letterSpacing:'1px',marginBottom:'8px'}}>DAGEN EFTER FÖRLUST VS VINSTDAG</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                {[{label:'Efter förlustdag',sub:'Hämndtrading?',s:alStat},{label:'Efter vinstdag',sub:'Fortsatt fokus?',s:awStat}].map(({label,sub,s},i)=>{
                  const awr=s.total>0?Math.round(s.wins/s.total*100):null
                  return (
                    <div key={i} style={{background:'#0a1020',border:'1px solid #162340',borderRadius:'8px',padding:'10px 12px'}}>
                      <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0'}}>{label}</div>
                      <div style={{fontFamily:M,fontSize:'7px',color:'#3a5460',marginBottom:'5px'}}>{sub}</div>
                      <div style={{fontFamily:M,fontSize:'22px',fontWeight:700,color:awr!=null?(awr>=50?'#00e5b0':'#ff4f6b'):'#3a5878',lineHeight:1}}>{awr!=null?`${awr}%`:'—'}</div>
                      <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0',marginTop:'3px'}}>{s.total}t · {s.pnl>=0?'+':''}${Math.round(s.pnl)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TIME OF DAY ── */}
      {hasTimeData && section('TID PÅ DAGEN — CET',
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
            <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0'}}>Baserat på HANDLAD KL-fältet</div>
            <div style={{fontFamily:M,fontSize:'9px',color:timeCoverage>=50?'#00e5b0':'#ffc030'}}>
              {tradesWithTime}/{trades.length} trades ({timeCoverage}% täckning)
            </div>
          </div>
          {timeCoverage < 30 && (
            <div style={{fontFamily:M,fontSize:'9px',color:'#5a4020',background:'#1a1000',border:'1px solid rgba(255,192,48,0.2)',borderRadius:'6px',padding:'7px 10px',marginBottom:'10px'}}>
              ⚠ Sätt HANDLAD KL när du loggar trades för att bygga upp tid-på-dagen-statistik
            </div>
          )}
          {timeStats.map((b,i) => {
            const barW = b.total>0&&b.wr!==null ? b.wr : 0
            const c    = b.wr===null?'#1c2e4a':b.wr>=60?'#00e5b0':b.wr>=50?'#4ab89a':b.wr>=40?'#ffc030':'#ff4f6b'
            return (
              <div key={i} style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{fontFamily:M,fontSize:'9px',color:'#7a96b4',width:'90px',flexShrink:0}}>{b.label}</div>
                <div style={{flex:1,height:'6px',background:'#0a1020',borderRadius:'3px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${barW}%`,background:c,borderRadius:'3px',transition:'width 0.4s ease'}} />
                </div>
                <div style={{fontFamily:M,fontSize:'10px',fontWeight:700,color:c,width:'36px',textAlign:'right',flexShrink:0}}>
                  {b.wr!==null?`${b.wr}%`:'—'}
                </div>
                <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0',width:'50px',textAlign:'right',flexShrink:0}}>
                  {b.total>0?`${b.total}t · ${b.pnl>=0?'+':''}$${Math.round(b.pnl)}`:'ingen data'}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── SETUP-KVALITET PER GRADE ── */}
      {section(t.setupQualSec,
        (() => {
          const grades = ['A+','A','B','C']
          const gc = {'A+':'#f59e0b','A':'#00e5b0','B':'#60a5fa','C':'#7a96b4'}
          const stats = grades.map(g => {
            const gt = viewTrades.filter(t=>t.grade===g)
            const gw = gt.filter(t=>WIN_RESULTS.has(t.result)).length
            const gp = gt.reduce((s,t)=>s+parseFloat(t.pnl||0),0)
            return { g, count:gt.length, wr:gt.length>0?Math.round(gw/gt.length*100):null, pnl:gp }
          }).filter(s=>s.count>0)
          if (stats.length === 0) return <div style={{fontFamily:M,fontSize:'10px',color:'#3a5878'}}>{t.noGradesYet}</div>
          return (
            <div style={{display:'grid',gridTemplateColumns:`repeat(${stats.length},1fr)`,gap:'10px'}}>
              {stats.map(({g,count,wr,pnl})=>(
                <div key={g} style={{background:'#0a1020',border:`1px solid ${gc[g]}33`,borderRadius:'9px',padding:'14px',textAlign:'center'}}>
                  <div style={{fontFamily:M,fontSize:'22px',fontWeight:700,color:gc[g],marginBottom:'8px'}}>{g}</div>
                  <div style={{fontFamily:M,fontSize:'18px',fontWeight:700,color:wr!=null&&wr>=50?'#00e5b0':'#ff4f6b',lineHeight:1}}>{wr!=null?`${wr}%`:'—'}</div>
                  <div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',marginBottom:'8px'}}>WR</div>
                  <div style={{fontFamily:M,fontSize:'13px',fontWeight:700,color:pnl>=0?'#00e5b0':'#ff4f6b'}}>{pnl>=0?'+':''}${Math.round(pnl)}</div>
                  <div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',marginTop:'2px'}}>{count} trades</div>
                </div>
              ))}
            </div>
          )
        })()
      )}
      </>)}

      {statsTab === 'journal' && (() => {
        const RL_J = { win:'TP3', win2:'TP2', tp1:'TP1', tp2:'TP2', tp3:'TP3', loss:'Loss', be:'BE', skip:'Skip', 'no-setup':'N/A' }
        const RC_J = { win:'#00e5b0', win2:'#00e5b0', tp1:'#4ab89a', tp2:'#00e5b0', tp3:'#00e5b0', loss:'#ff4f6b', be:'#7a96b4', skip:'#7a96b4', 'no-setup':'#7a96b4' }
        const VIOL_TAGS = new Set(['fomo','revenge','forced','slmoved'])
        const filtered = viewTrades
          .filter(t => {
            if (tableOutcome === 'wins')   return WIN_RESULTS.has(t.result)
            if (tableOutcome === 'losses') return t.result === 'loss'
            if (tableOutcome === 'be')     return t.result === 'be'
            return true
          })
          .filter(t => !tableSearch ||
            (t.instrument||'').toLowerCase().includes(tableSearch.toLowerCase()) ||
            (t.setup||'').toLowerCase().includes(tableSearch.toLowerCase()) ||
            (t.note||'').toLowerCase().includes(tableSearch.toLowerCase())
          )
          .sort((a, b) => {
            const dir = sortDir === 'asc' ? 1 : -1
            if (sortCol === 'date')    return dir * (a.date||'').localeCompare(b.date||'')
            if (sortCol === 'pnl')     return dir * (parseFloat(a.pnl||0) - parseFloat(b.pnl||0))
            if (sortCol === 'result')  return dir * (a.result||'').localeCompare(b.result||'')
            if (sortCol === 'instr')   return dir * (a.instrument||'').localeCompare(b.instrument||'')
            if (sortCol === 'setup')   return dir * (a.setup||'').localeCompare(b.setup||'')
            if (sortCol === 'emotion') return dir * (parseInt(a.emotion||0) - parseInt(b.emotion||0))
            return 0
          })
        function Th({ col, label, right }) {
          const active = sortCol === col
          return (
            <div onClick={() => { setSortCol(col); setSortDir(p => active ? (p==='desc'?'asc':'desc') : 'desc') }}
              style={{ fontFamily:M, fontSize:'8px', color:active?'#f59e0b':'#6880a0', cursor:'pointer', userSelect:'none', letterSpacing:'1px', textAlign:right?'right':'left', flexShrink:0 }}>
              {label}{active ? (sortDir==='desc'?' ↓':' ↑') : ''}
            </div>
          )
        }
        return (
          <div style={{background:'#0f1828',border:'1px solid #162340',borderRadius:'12px',padding:'16px'}}>
            <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8',letterSpacing:'2px',marginBottom:'14px'}}>{t.allTrades}</div>
            <div style={{display:'flex',gap:'8px',marginBottom:'12px',flexWrap:'wrap',alignItems:'center'}}>
              <input value={tableSearch} onChange={e=>setTableSearch(e.target.value)} placeholder={t.searchPh}
                style={{flex:1,minWidth:'160px',background:'#08101c',border:'1px solid #1c2e4a',borderRadius:'7px',color:'#dce8f5',fontFamily:M,fontSize:'11px',padding:'7px 11px',outline:'none'}} />
              <div style={{display:'flex',gap:'4px'}}>
                {[['all',t.all],['wins',t.wins],['losses',t.losses],['be',t.be]].map(([v,l])=>(
                  <button key={v} onClick={()=>setTableOutcome(v)} style={{
                    fontFamily:M,fontSize:'8px',padding:'5px 10px',borderRadius:'5px',
                    border:`1px solid ${tableOutcome===v?'rgba(245,158,11,0.4)':'#162340'}`,
                    background:tableOutcome===v?'#18100a':'#0a1020',
                    color:tableOutcome===v?'#f59e0b':'#6880a0',cursor:'pointer',
                  }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'74px 46px 52px 60px 52px 1fr 28px 50px',gap:'6px',padding:'5px 8px',borderBottom:'1px solid #162340',marginBottom:'4px'}}>
              <Th col="date" label={t.dateCol} /><Th col="instr" label={t.instrCol} /><Th col="result" label={t.outcomeCol} /><Th col="setup" label={t.setupCol} />
              <Th col="pnl" label={t.pnlCol} right /><div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',letterSpacing:'0.5px'}}>NOTES</div>
              <Th col="emotion" label={t.emotionShort} /><div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',letterSpacing:'0.5px'}}>REG</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'1px',maxHeight:'480px',overflowY:'auto'}}>
              {filtered.length === 0 && <div style={{fontFamily:M,fontSize:'11px',color:'#3a5878',padding:'24px',textAlign:'center'}}>{t.noMatch}</div>}
              {filtered.map((t,i) => {
                const pv = parseFloat(t.pnl||0)
                const em = parseInt(t.emotion||0)
                const isViol = t.checklistViolation || (t.brokenRules?.length > 0) || [...VIOL_TAGS].some(v=>(t.psychTags||[]).includes(v))
                return (
                  <div key={i} style={{display:'grid',gridTemplateColumns:'74px 46px 52px 60px 52px 1fr 28px 50px',gap:'6px',padding:'5px 8px',borderRadius:'5px',background:i%2===0?'transparent':'#0a1020',alignItems:'center'}}>
                    <div style={{fontFamily:M,fontSize:'9px',color:'#7a96b4',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.date?.slice(5)}{t.tradeTime?' '+t.tradeTime:''}</div>
                    <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.instrument}</div>
                    <div style={{fontFamily:M,fontSize:'9px',color:RC_J[t.result]||'#7a96b4',fontWeight:600}}>{RL_J[t.result]||t.result}</div>
                    <div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.setup||'—'}</div>
                    <div style={{fontFamily:M,fontSize:'10px',fontWeight:700,color:pv>=0?'#00e5b0':'#ff4f6b',textAlign:'right'}}>{pv>=0?'+':''}${Math.round(Math.abs(pv))}</div>
                    <div style={{fontFamily:M,fontSize:'9px',color:'#4a6888',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.note?.slice(0,50)||'—'}</div>
                    <div style={{fontFamily:M,fontSize:'9px',color:em<=3?'#00e5b0':em>=7?'#ff4f6b':'#ffc030',textAlign:'center'}}>{em>0?em:'—'}</div>
                    <div style={{fontFamily:M,fontSize:'7px',color:isViol?'#ff4f6b':'#3a7060',textAlign:'center',letterSpacing:'0.5px',fontWeight:700}}>{isViol?'VIOL':'OK'}</div>
                  </div>
                )
              })}
            </div>
            <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0',marginTop:'10px',textAlign:'right'}}>{t.tradesShown(filtered.length, viewTrades.length)}</div>
          </div>
        )
      })()}

      {statsTab === 'reflektion' && (<>
      {/* ── WEEKLY REVIEW ── */}
      <div style={{background:'#0f1828',border:'1px solid #162340',borderRadius:'12px',padding:'16px'}}>
        <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8',letterSpacing:'1.5px',marginBottom:'14px'}}>VECKOREFLEXION</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'14px'}}>
          {[
            {label:'TRADES',   val:weekTrades.length>0?String(weekTrades.length):'0',   c:'#7a96b4'},
            {label:'WIN RATE', val:weekTrades.length>0?`${Math.round(weekWins/weekTrades.length*100)}%`:'—', c:weekTrades.length>0?(weekWins/weekTrades.length>=0.5?'#00e5b0':'#ff4f6b'):'#3a5878'},
            {label:'P&L',      val:`${weekPnl>=0?'+':''}$${Math.round(weekPnl)}`,       c:weekPnl>=0?'#00e5b0':'#ff4f6b'},
          ].map(({label,val,c},i)=>(
            <div key={i} style={{background:'#0a1020',border:'1px solid #162340',borderRadius:'8px',padding:'10px 12px'}}>
              <div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',letterSpacing:'1px',marginBottom:'3px'}}>{label}</div>
              <div style={{fontFamily:M,fontSize:'20px',fontWeight:700,color:c,lineHeight:1}}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:'10px'}}>
          <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8',letterSpacing:'1px',marginBottom:'6px'}}>BETYG PÅ VECKAN</div>
          <div style={{display:'flex',gap:'4px'}}>
            {[1,2,3,4,5].map(n=>(
              <button key={n} type="button" onClick={()=>setRwRating(rwRating===n?0:n)} style={{fontSize:'22px',background:'none',border:'none',cursor:'pointer',color:n<=rwRating?'#ffc030':'#1c2e4a',transition:'color 0.15s',padding:'0 2px'}}>★</button>
            ))}
          </div>
        </div>
        {[
          {label:'REFLEKTIONER',   val:rwNote,   set:setRwNote,   ph:'Vad gick bra? Vad var svårt?'},
          {label:'LÄRDOM VECKAN',  val:rwLesson, set:setRwLesson, ph:'Vad tar du med dig framåt?'},
          {label:'FOKUS NÄSTA V.', val:rwFocus,  set:setRwFocus,  ph:'Vad förbättrar du nästa vecka?'},
        ].map(({label,val,set,ph},i)=>(
          <div key={i} style={{marginBottom:'10px'}}>
            <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8',letterSpacing:'1px',marginBottom:'5px'}}>{label}</div>
            <textarea value={val} onChange={e=>set(e.target.value)} placeholder={ph}
              style={{width:'100%',background:'#08101c',border:'1px solid #1c2e4a',borderRadius:'8px',color:'#dce8f5',fontSize:'13px',padding:'10px 12px',outline:'none',boxSizing:'border-box',resize:'vertical',minHeight:'60px',lineHeight:1.6,fontFamily:'inherit',transition:'border-color 0.15s'}}
              onFocus={e=>e.target.style.borderColor='#4a6888'} onBlur={e=>e.target.style.borderColor='#1c2e4a'} />
          </div>
        ))}
        <button type="button" onClick={()=>{onSaveWeeklyReview?.(currentWeekStart,{rating:rwRating,note:rwNote,lesson:rwLesson,focus:rwFocus,weekStart:currentWeekStart,savedAt:new Date().toISOString()});setRwRating(0);setRwNote('');setRwLesson('');setRwFocus('')}}
          style={{width:'100%',background:'#00e5b0',color:'#020f08',fontFamily:M,fontSize:'11px',fontWeight:700,padding:'12px',borderRadius:'8px',border:'none',cursor:'pointer',letterSpacing:'1px',marginBottom:pastReviews.length>0?'14px':'0'}}
          onMouseEnter={e=>e.currentTarget.style.background='#00c49a'} onMouseLeave={e=>e.currentTarget.style.background='#00e5b0'}>
          SPARA VECKOREFLEXION
        </button>
        {pastReviews.length>0&&(
          <div style={{borderTop:'1px solid #162340',paddingTop:'12px',display:'flex',flexDirection:'column',gap:'8px'}}>
            <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0',letterSpacing:'1px',marginBottom:'4px'}}>TIDIGARE REFLEKTIONER</div>
            {pastReviews.map(([ws,rv])=>(
              <div key={ws} style={{background:'#0a1020',border:'1px solid #162340',borderRadius:'8px',padding:'12px 14px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                  <div style={{fontFamily:M,fontSize:'9px',color:'#7a96b4'}}>{ws}</div>
                  <div>{[1,2,3,4,5].map(n=><span key={n} style={{color:n<=(rv.rating||0)?'#ffc030':'#1c2e4a',fontSize:'12px'}}>★</span>)}</div>
                </div>
                {rv.note&&<div style={{fontSize:'12px',color:'#7a96b4',lineHeight:1.6,marginBottom:'6px',borderLeft:'2px solid #162340',paddingLeft:'8px'}}>{rv.note}</div>}
                {rv.lesson&&<><div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',marginBottom:'2px',marginTop:'4px'}}>LÄRDOM</div><div style={{fontSize:'12px',color:'#7a96b4',lineHeight:1.6,borderLeft:'2px solid rgba(0,229,176,0.2)',paddingLeft:'8px'}}>{rv.lesson}</div></>}
                {rv.focus&&<><div style={{fontFamily:M,fontSize:'8px',color:'#6880a0',marginBottom:'2px',marginTop:'4px'}}>NÄSTA VECKA</div><div style={{fontSize:'12px',color:'#7a96b4',lineHeight:1.6,borderLeft:'2px solid rgba(255,192,48,0.2)',paddingLeft:'8px'}}>{rv.focus}</div></>}
              </div>
            ))}
          </div>
        )}
      </div>

      {section('WIN RATE PER VECKODAG',
        <>
          <div style={{fontFamily:M,fontSize:'9px',color:'#6880a0',marginBottom:'12px'}}>Gråa = under 3 trades</div>
          <div style={{display:'flex',gap:'8px',alignItems:'flex-end',height:'100px'}}>
            {dayStats.map((d,i)=>{
              const c  = d.total===0?'#0f1828':!d.reliable?'#1a2428':d.wr>=50?'#007d5e':'#7a1020'
              const tc = d.total===0?'#1c2e4a':!d.reliable?'#7a96b4':d.wr>=50?'#00e5b0':'#ff4f6b'
              const h  = d.total===0?'5px':`${Math.max(d.wr,5)}%`
              return (
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',height:'100%',justifyContent:'flex-end'}}>
                  <div style={{fontFamily:M,fontSize:'9px',color:tc}}>{d.total===0?'—':`${d.wr}%`}</div>
                  <div style={{width:'100%',height:h,background:c,borderRadius:'3px 3px 0 0',transition:'height 0.3s ease'}} />
                  <div style={{fontFamily:M,fontSize:'9px',color:'#8aabb8'}}>{d.day.slice(0,3)}</div>
                  <div style={{fontFamily:M,fontSize:'8px',color:'#6880a0'}}>{d.total}t</div>
                </div>
              )
            })}
          </div>
        </>
      )}
      </>)}
    </div>
  )
}