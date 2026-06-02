import { useState, useEffect } from 'react'

const M = "'JetBrains Mono', monospace"
const API_KEY = 'd86pfmhr01qurhv774f0d86pfmhr01qurhv774fg'
const PROXY   = 'https://corsproxy.io/?'
const IS_MOB  = typeof window !== 'undefined' && window.innerWidth < 768

// ── CME Futures market closure schedule ───────────────────────
const CME_HOLIDAYS = [
  { date:'2025-01-01', name:"New Year's Day",          type:'closed' },
  { date:'2025-01-20', name:'MLK Day',                 type:'closed' },
  { date:'2025-02-17', name:"Presidents' Day",         type:'closed' },
  { date:'2025-04-18', name:'Good Friday',             type:'early',  note:'Stänger 12:00 ET / 18:00 CET' },
  { date:'2025-05-26', name:'Memorial Day',            type:'closed' },
  { date:'2025-06-19', name:'Juneteenth',              type:'closed' },
  { date:'2025-07-04', name:'Independence Day',        type:'closed' },
  { date:'2025-09-01', name:'Labor Day',               type:'closed' },
  { date:'2025-11-27', name:'Thanksgiving',            type:'closed' },
  { date:'2025-11-28', name:'Day after Thanksgiving',  type:'early',  note:'Stänger 12:00 ET / 18:00 CET' },
  { date:'2025-12-24', name:'Christmas Eve',           type:'early',  note:'Stänger 12:00 ET / 18:00 CET' },
  { date:'2025-12-25', name:'Christmas Day',           type:'closed' },
  { date:'2026-01-01', name:"New Year's Day",          type:'closed' },
  { date:'2026-01-19', name:'MLK Day',                 type:'closed' },
  { date:'2026-02-16', name:"Presidents' Day",         type:'closed' },
  { date:'2026-04-03', name:'Good Friday',             type:'early',  note:'Stänger 12:00 ET / 18:00 CET' },
  { date:'2026-05-25', name:'Memorial Day',            type:'closed' },
  { date:'2026-06-19', name:'Juneteenth',              type:'closed' },
  { date:'2026-07-03', name:'Independence Day (obs.)', type:'closed' },
  { date:'2026-09-07', name:'Labor Day',               type:'closed' },
  { date:'2026-11-26', name:'Thanksgiving',            type:'closed' },
  { date:'2026-11-27', name:'Day after Thanksgiving',  type:'early',  note:'Stänger 12:00 ET / 18:00 CET' },
  { date:'2026-12-24', name:'Christmas Eve',           type:'early',  note:'Stänger 12:00 ET / 18:00 CET' },
  { date:'2026-12-25', name:'Christmas Day',           type:'closed' },
]

// Keywords → futures-relevant highlight in news
const FUTURES_KW = [
  'fed','fomc','cpi','nfp','gdp','pce','ppi','payroll','unemployment',
  'crude','oil','gold','silver','s&p','dow','nasdaq','futures','cme',
  'interest rate','inflation','treasury','yield','powell','ecb','boe',
  'non-farm','jobless','ism','retail sales','durable goods','housing',
]
const isFutures = h => FUTURES_KW.some(k => h.toLowerCase().includes(k))

const MAJOR_TICKERS = new Set([
  'AAPL','MSFT','NVDA','GOOGL','GOOG','AMZN','META','TSLA','BRK.B','JPM',
  'V','UNH','XOM','JNJ','WMT','MA','PG','CVX','HD','MRK','ABBV','LLY',
  'PEP','KO','AVGO','COST','TMO','MCD','ACN','BAC','ABT','NFLX','QCOM',
  'TXN','NEE','AMD','PM','ORCL','DHR','INTC','IBM','GS','MS','BLK','RTX',
  'CAT','DE','BA','GE','F','GM','DIS','CMCSA','T','VZ','PFE','AMGN',
  'GILD','SBUX','NKE','LOW','INTU','ADBE','CRM','NOW','COIN','PYPL','WFC','C',
])

// ── Helpers ───────────────────────────────────────────────────
function fmtDate(s)  { return new Date(s+'T12:00:00').toLocaleDateString('sv-SE',{weekday:'short',day:'numeric',month:'short'}).toUpperCase() }
function fmtTime(t)  {
  if (!t) return '—'
  try { const d=new Date(t.replace(' ','T')+'Z'); return isNaN(d)?'—':d.toLocaleTimeString('sv-SE',{timeZone:'Europe/Stockholm',hour:'2-digit',minute:'2-digit'}) }
  catch { return '—' }
}
function fmtNews(ts) {
  const d=new Date(ts*1000), now=new Date(), diff=now-d
  if (diff<3600000) return `${Math.floor(diff/60000)}m`
  if (diff<86400000) return `${Math.floor(diff/3600000)}h`
  return d.toLocaleDateString('sv-SE',{day:'numeric',month:'short'})
}
function groupBy(items, key) {
  const g={}
  items.forEach(i=>{const k=i[key];if(!g[k])g[k]=[];g[k].push(i)})
  return Object.entries(g).sort(([a],[b])=>a.localeCompare(b))
}

// ── Sub-components ────────────────────────────────────────────
function DateRow({ label }) {
  return <div style={{ fontFamily:M,fontSize:'10px',color:'#7a96b4',letterSpacing:'2px',padding:'10px 0 6px',borderBottom:'1px solid #162340',marginBottom:'8px' }}>{label}</div>
}

function EconEvent({ e }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:'10px',background:'#0a1020',border:'1px solid #7a1f2e',borderRadius:'10px',padding:'12px 14px',marginBottom:'6px' }}>
      <div style={{ fontFamily:M,fontSize:'11px',color:'#7a96b4',minWidth:'36px',flexShrink:0 }}>{fmtTime(e.time)}</div>
      <div style={{ fontFamily:M,fontSize:'13px',color:'#dce8f5',flex:1,lineHeight:1.3 }}>{e.event}</div>
      <div style={{ fontFamily:M,fontSize:'9px',color:'#ff4f6b',background:'#3d0f1a',border:'1px solid #7a1f2e',borderRadius:'5px',padding:'3px 7px',whiteSpace:'nowrap',flexShrink:0 }}>HÖG</div>
    </div>
  )
}

function EarningRow({ e }) {
  const timing = e.hour==='bmo'?'PRE':e.hour==='amc'?'POST':null
  const tColor = e.hour==='bmo'?'#ffc030':'#7a96b4'
  return (
    <div style={{ background:'#0a1020',border:'1px solid #162340',borderRadius:'10px',padding:'13px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',marginBottom:'6px' }}>
      <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
        <img src={`https://assets.parqet.com/logos/symbol/${e.symbol}?format=svg`} alt={e.symbol}
          style={{ width:'30px',height:'30px',borderRadius:'7px',background:'#162340',objectFit:'contain',flexShrink:0 }}
          onError={ev=>{ev.target.style.display='none';ev.target.nextSibling.style.display='flex'}} />
        <div style={{ width:'30px',height:'30px',borderRadius:'7px',background:'#162340',display:'none',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <span style={{ fontFamily:M,fontSize:'8px',color:'#5a7898',fontWeight:700 }}>{e.symbol?.slice(0,2)}</span>
        </div>
        <div>
          <div style={{ fontFamily:M,fontSize:'14px',fontWeight:700,color:'#00e5b0' }}>{e.symbol}</div>
          {e.epsEstimate!=null&&<div style={{ fontFamily:M,fontSize:'10px',color:'#7a96b4',marginTop:'1px' }}>EPS est. ${parseFloat(e.epsEstimate).toFixed(2)}</div>}
        </div>
      </div>
      {timing&&<div style={{ fontFamily:M,fontSize:'9px',color:tColor,background:'#162340',border:`1px solid ${tColor}44`,borderRadius:'5px',padding:'4px 9px',letterSpacing:'1px',flexShrink:0 }}>{timing}</div>}
    </div>
  )
}

function NewsItem({ item }) {
  const fut = isFutures(item.headline)
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none',display:'block',background:fut?'#060c14':'#0a1020',border:`1px solid ${fut?'rgba(0,229,176,0.18)':'#162340'}`,borderRadius:'8px',padding:'12px 14px',marginBottom:'6px',transition:'border-color 0.15s' }}
      onMouseEnter={e=>e.currentTarget.style.borderColor=fut?'rgba(0,229,176,0.4)':'#1c2e4a'}
      onMouseLeave={e=>e.currentTarget.style.borderColor=fut?'rgba(0,229,176,0.18)':'#162340'}
    >
      {fut&&<span style={{ fontFamily:M,fontSize:'7px',color:'#00e5b0',background:'#001810',border:'1px solid rgba(0,229,176,0.2)',borderRadius:'3px',padding:'1px 5px',marginBottom:'5px',display:'inline-block',letterSpacing:'0.5px' }}>FUTURES</span>}
      <div style={{ fontFamily:M,fontSize:'12px',color:'#dce8f5',lineHeight:1.5,marginTop:fut?'4px':0 }}>{item.headline}</div>
      <div style={{ display:'flex',gap:'8px',marginTop:'6px',alignItems:'center' }}>
        <span style={{ fontFamily:M,fontSize:'9px',color:'#6880a0' }}>{item.source}</span>
        <span style={{ fontFamily:M,fontSize:'9px',color:'#4a6070' }}>·</span>
        <span style={{ fontFamily:M,fontSize:'9px',color:'#6880a0' }}>{fmtNews(item.datetime)}</span>
      </div>
    </a>
  )
}

function HolidayRow({ h, todayStr }) {
  const tomorrow  = new Date(Date.now()+86400000).toISOString().slice(0,10)
  const isToday   = h.date===todayStr
  const isTomorrow= h.date===tomorrow
  const daysUntil = Math.max(0, Math.round((new Date(h.date+'T12:00:00')-new Date())/86400000))
  const urgent    = daysUntil<=3
  const bg  = isToday?'#1a0610':urgent?'#060c14':'#0a1020'
  const bdr = isToday?'rgba(255,79,107,0.3)':urgent?'rgba(255,192,48,0.2)':'#162340'
  const dc  = isToday?'#ff4f6b':urgent?'#ffc030':'#7a96b4'
  return (
    <div style={{ display:'flex',alignItems:'center',gap:'12px',background:bg,border:`1px solid ${bdr}`,borderRadius:'8px',padding:'12px 14px',marginBottom:'6px' }}>
      <div style={{ minWidth:'44px',flexShrink:0,textAlign:'center' }}>
        <div style={{ fontFamily:M,fontSize:'9px',color:dc,fontWeight:700,lineHeight:1 }}>
          {isToday?'IDAG':isTomorrow?'IMORGON':`${daysUntil}d`}
        </div>
        <div style={{ fontFamily:M,fontSize:'8px',color:'#6880a0',marginTop:'2px' }}>
          {new Date(h.date+'T12:00:00').toLocaleDateString('sv-SE',{day:'numeric',month:'short'})}
        </div>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:M,fontSize:'12px',color:'#dce8f5' }}>{h.name}</div>
        {h.note&&<div style={{ fontFamily:M,fontSize:'9px',color:'#ffc030',marginTop:'2px' }}>{h.note}</div>}
      </div>
      <span style={{ fontFamily:M,fontSize:'8px',padding:'3px 7px',borderRadius:'4px',flexShrink:0,
        ...(h.type==='closed'
          ?{color:'#ff4f6b',background:'#1a0610',border:'1px solid rgba(255,79,107,0.2)'}
          :{color:'#ffc030',background:'#1a1000',border:'1px solid rgba(255,192,48,0.2)'}
        )
      }}>
        {h.type==='closed'?'STÄNGD':'TIDIG'}
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function EconomicCalendar() {
  const [events,      setEvents]      = useState([])
  const [earnings,    setEarnings]    = useState([])
  const [news,        setNews]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [newsLoading, setNewsLoading] = useState(false)
  const [error,       setError]       = useState(null)
  const [tab,         setTab]         = useState('econ')
  const [newsCat,     setNewsCat]     = useState('general')

  useEffect(() => { fetchMarketData() }, [])
  useEffect(() => { if (tab==='news') fetchNews(newsCat) }, [tab, newsCat])

  async function fetchMarketData() {
    setLoading(true); setError(null)
    try {
      const now=new Date(), pad=n=>String(n).padStart(2,'0')
      const from=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`
      const td=new Date(now.getFullYear(),now.getMonth(),now.getDate()+7)
      const to=`${td.getFullYear()}-${pad(td.getMonth()+1)}-${pad(td.getDate())}`
      const [er,ar]=await Promise.all([
        fetch(`${PROXY}${encodeURIComponent(`https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${API_KEY}`)}`),
        fetch(`${PROXY}${encodeURIComponent(`https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${API_KEY}`)}`),
      ])
      const ed=await er.json(), ad=await ar.json()
      setEvents((ed.economicCalendar||[]).filter(e=>e.impact==='high'&&e.country==='US').sort((a,b)=>new Date(a.time)-new Date(b.time)))
      setEarnings((ad.earningsCalendar||[]).filter(e=>e.symbol&&MAJOR_TICKERS.has(e.symbol)).sort((a,b)=>a.date.localeCompare(b.date)))
    } catch { setError('Kunde inte ladda data') }
    finally { setLoading(false) }
  }

  async function fetchNews(cat) {
    setNewsLoading(true)
    try {
      const res=await fetch(`${PROXY}${encodeURIComponent(`https://finnhub.io/api/v1/news?category=${cat}&minId=0&token=${API_KEY}`)}`)
      const data=await res.json()
      setNews(Array.isArray(data)?data.slice(0,40):[])
    } catch { setNews([]) }
    finally { setNewsLoading(false) }
  }

  const todayStr        = new Date().toISOString().slice(0,10)
  const upcomingHols    = CME_HOLIDAYS.filter(h=>h.date>=todayStr)
  const nextHol         = upcomingHols[0]
  const tomorrowStr     = new Date(Date.now()+86400000).toISOString().slice(0,10)
  const holWarning      = nextHol && (nextHol.date===todayStr||nextHol.date===tomorrowStr)

  const eventsWithDate  = events.map(e=>({...e,dateOnly:e.time?.split(' ')[0]||''}))
  const econGroups      = groupBy(eventsWithDate,'dateOnly')
  const earnGroups      = groupBy(earnings,'date')
  // Sort news: futures-relevant first, then chronological
  const sortedNews      = [...news].sort((a,b)=>(isFutures(b.headline)?1:0)-(isFutures(a.headline)?1:0)||b.datetime-a.datetime)

  const sectionHdr = label => (
    <div style={{ fontFamily:M,fontSize:'8px',color:'#5a7898',letterSpacing:'1.5px',marginBottom:'10px' }}>{label}</div>
  )

  function EconContent() {
    return (
      <div>
        {sectionHdr('ECONOMIC — HIGH IMPACT')}
        {econGroups.length===0
          ? <div style={{ fontFamily:M,fontSize:'11px',color:'#3a5878',padding:'12px 0' }}>Inga high-impact events kommande 7 dagar</div>
          : econGroups.map(([d,items])=><div key={d}><DateRow label={fmtDate(d)} />{items.map((e,i)=><EconEvent key={i} e={e} />)}</div>)
        }
      </div>
    )
  }

  function EarningsContent() {
    return (
      <div>
        {sectionHdr('EARNINGS')}
        {earnGroups.length===0
          ? <div style={{ fontFamily:M,fontSize:'11px',color:'#3a5878',padding:'12px 0' }}>Inga earnings kommande 7 dagar</div>
          : earnGroups.map(([d,items])=><div key={d}><DateRow label={fmtDate(d)} />{items.map((e,i)=><EarningRow key={i} e={e} />)}</div>)
        }
      </div>
    )
  }

  function HolidaysContent() {
    return (
      <div>
        {sectionHdr('CME FUTURES — STÄNGDA DAGAR')}
        <div style={{ fontFamily:M,fontSize:'8px',color:'#3a5878',marginBottom:'10px' }}>MYM / YM / ES / MES / NQ / MNQ</div>
        {upcomingHols.slice(0,10).map((h,i)=><HolidayRow key={i} h={h} todayStr={todayStr} />)}
      </div>
    )
  }

  function NewsContent() {
    return (
      <div>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px',flexWrap:'wrap',gap:'6px' }}>
          {sectionHdr('MARKNADSNYHETER')}
          <div style={{ display:'flex',gap:'4px' }}>
            {[['general','Generellt'],['forex','Forex'],['crypto','Crypto'],['merger','M&A']].map(([v,l])=>(
              <button key={v} onClick={()=>setNewsCat(v)} style={{
                fontFamily:M,fontSize:'8px',padding:'4px 9px',borderRadius:'5px',cursor:'pointer',
                border:`1px solid ${newsCat===v?'#007d5e':'#162340'}`,
                background:newsCat===v?'#001810':'transparent',
                color:newsCat===v?'#00e5b0':'#7a96b4',
                transition:'all 0.15s',
              }}>{l}</button>
            ))}
          </div>
        </div>
        {newsLoading
          ? <div style={{ fontFamily:M,fontSize:'11px',color:'#3a5878',padding:'16px 0',textAlign:'center' }}>Laddar nyheter...</div>
          : sortedNews.length===0
            ? <div style={{ fontFamily:M,fontSize:'11px',color:'#3a5878',padding:'12px 0' }}>Inga nyheter</div>
            : sortedNews.map((item,i)=><NewsItem key={item.id||i} item={item} />)
        }
      </div>
    )
  }

  return (
    <div style={{ background:'#0c1422',border:'1px solid #162340',borderRadius:'14px',padding:'16px' }}>

      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom: holWarning?'10px':'14px' }}>
        <div style={{ fontFamily:M,fontSize:'10px',color:'#5a7898',letterSpacing:'2px' }}>MARKET EVENTS</div>
        <button onClick={()=>{fetchMarketData();if(tab==='news')fetchNews(newsCat)}} style={{ background:'none',border:'1px solid #162340',borderRadius:'8px',color:'#7a96b4',fontFamily:M,fontSize:'12px',padding:'6px 12px',cursor:'pointer',minHeight:'34px' }}>↻</button>
      </div>

      {/* Holiday warning banner */}
      {holWarning&&(
        <div style={{ background:nextHol.date===todayStr?'#1a0610':'#1a1000',border:`1px solid ${nextHol.date===todayStr?'rgba(255,79,107,0.3)':'rgba(255,192,48,0.3)'}`,borderRadius:'8px',padding:'10px 14px',marginBottom:'14px',display:'flex',alignItems:'center',gap:'10px' }}>
          <span style={{ fontSize:'14px',flexShrink:0 }}>{nextHol.date===todayStr?'🔴':'🟡'}</span>
          <div>
            <div style={{ fontFamily:M,fontSize:'10px',fontWeight:700,color:nextHol.date===todayStr?'#ff4f6b':'#ffc030' }}>
              {nextHol.date===todayStr?'CME STÄNGD IDAG':'CME STÄNGER IMORGON'}
            </div>
            <div style={{ fontFamily:M,fontSize:'9px',color:'#7a96b4',marginTop:'2px' }}>
              {nextHol.name}{nextHol.note?` — ${nextHol.note}`:''}
            </div>
          </div>
        </div>
      )}

      {loading&&<div style={{ color:'#7a96b4',fontFamily:M,fontSize:'12px',padding:'24px 0',textAlign:'center' }}>Laddar...</div>}
      {error&&<div style={{ color:'#ff4f6b',fontFamily:M,fontSize:'12px',padding:'12px 0' }}>{error}</div>}

      {!loading&&!error&&(
        IS_MOB ? (
          // ── MOBILE: 4 tabs ──
          <div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',background:'#0a1020',border:'1px solid #162340',borderRadius:'10px',padding:'3px',gap:'2px',marginBottom:'16px' }}>
              {[['econ','Makro'],['earnings','Earnings'],['news','News'],['holidays','Helgdagar']].map(([id,label])=>(
                <button key={id} onClick={()=>setTab(id)} style={{
                  background:tab===id?'#1c2f34':'none',
                  border:tab===id?'1px solid #1c2e4a':'1px solid transparent',
                  borderRadius:'7px',color:tab===id?'#dce8f5':'#7a96b4',
                  fontFamily:M,fontSize:'8px',padding:'7px 2px',cursor:'pointer',
                  WebkitTapHighlightColor:'transparent',
                }}>{label}</button>
              ))}
            </div>
            {tab==='econ'     && <EconContent />}
            {tab==='earnings' && <EarningsContent />}
            {tab==='news'     && <NewsContent />}
            {tab==='holidays' && <HolidaysContent />}
          </div>
        ) : (
          // ── DESKTOP: 3-col top + news below ──
          <div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'20px',marginBottom:'20px' }}>
              <div style={{ maxHeight:'380px',overflowY:'auto',paddingRight:'4px' }}><EconContent /></div>
              <div style={{ maxHeight:'380px',overflowY:'auto',paddingRight:'4px' }}><EarningsContent /></div>
              <div style={{ maxHeight:'380px',overflowY:'auto',paddingRight:'4px' }}><HolidaysContent /></div>
            </div>
            <div style={{ borderTop:'1px solid #162340',paddingTop:'16px',maxHeight:'500px',overflowY:'auto' }}>
              <NewsContent />
            </div>
          </div>
        )
      )}
    </div>
  )
}
