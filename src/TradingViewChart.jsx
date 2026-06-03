import { useEffect, useRef, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const M = "'JetBrains Mono', monospace"

const ALIASES = {
  'US30':'^DJI',  'DJ30':'^DJI',   'DJIA':'^DJI',   'DOW':'^DJI',
  'US100':'^NDX', 'NAS100':'^NDX', 'NDX':'^NDX',    'NASDAQ':'^NDX',
  'US500':'^GSPC','SP500':'^GSPC', 'SPX':'^GSPC',
  'US2000':'^RUT','RUT':'^RUT',
  'DAX':'^GDAXI', 'GER40':'^GDAXI',
  'FTSE':'^FTSE', 'UK100':'^FTSE',
  'MYM':'MYM=F',  'MYM1!':'MYM=F',
  'MNQ':'MNQ=F',  'MNQ1!':'MNQ=F',
  'MES':'MES=F',  'MES1!':'MES=F',
  'YM':'YM=F',    'YM1!':'YM=F',
  'NQ':'NQ=F',    'NQ1!':'NQ=F',
  'ES':'ES=F',    'ES1!':'ES=F',
  'RTY':'RTY=F',  'RTY1!':'RTY=F',
  'GOLD':'GC=F',  'XAU':'GC=F',    'XAUUSD':'GC=F', 'GC':'GC=F',
  'SILVER':'SI=F','XAG':'SI=F',    'XAGUSD':'SI=F',
  'OIL':'CL=F',   'CRUDE':'CL=F',  'USOIL':'CL=F',  'WTI':'CL=F',
  'BRENT':'BZ=F', 'NG':'NG=F',
  'BTC':'BTC-USD','BITCOIN':'BTC-USD','BTCUSD':'BTC-USD',
  'ETH':'ETH-USD','ETHUSD':'ETH-USD',
  'SOL':'SOL-USD','XRP':'XRP-USD',  'BNB':'BNB-USD',
  'DOGE':'DOGE-USD','AVAX':'AVAX-USD',
}

const resolveSym = s => ALIASES[s.trim().toUpperCase()] || s.trim().toUpperCase()

// Multiple proxies and endpoints — tries until one works
const PROXIES = [
  s => `https://api.allorigins.win/raw?url=${encodeURIComponent(s)}`,
  s => `https://corsproxy.io/?${encodeURIComponent(s)}`,
]

// Parallel proxy fetch — uses whichever proxy responds first
async function tryFetch(url) {
  const attempts = PROXIES.map(proxy =>
    fetch(proxy(url), { signal: AbortSignal.timeout(5000) })
      .then(r => { if (!r.ok) throw 0; return r.text() })
      .then(txt => { if (!txt || txt.startsWith('<')) throw 0; return JSON.parse(txt) })
  )
  try { return await Promise.any(attempts) } catch { return null }
}

function parseChart(d, interval) {
  const res = d?.chart?.result?.[0]
  if (!res) return { price: null, chartData: [], open: null }
  const price  = res.meta?.regularMarketPrice
  const open   = res.meta?.chartPreviousClose || res.meta?.regularMarketOpen
  const ts     = res.timestamp || []
  const closes = res.indicators?.quote?.[0]?.close || []
  // For 1H+, show date+time; for shorter intervals show time only
  const showDate = interval === '60m' || interval === '1d'
  const chartData = ts
    .map((t, i) => ({
      t: new Date(t * 1000).toLocaleTimeString('sv-SE', {
        timeZone: 'Europe/Stockholm',
        hour: '2-digit', minute: '2-digit', hour12: false,
        ...(showDate ? { month:'short', day:'numeric' } : {}),
      }),
      p: closes[i] ?? null,
    }))
    .filter(d => d.p !== null)
  return { price, open, chartData }
}

// Both query1 and query2 in parallel → fastest wins
async function fetchPriceAndChart(raw, interval = '5m', range = '1d') {
  const ticker = resolveSym(raw)
  const enc    = encodeURIComponent(ticker)

  const results = await Promise.allSettled([
    tryFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${enc}?interval=${interval}&range=${range}`),
    tryFetch(`https://query2.finance.yahoo.com/v8/finance/chart/${enc}?interval=${interval}&range=${range}`),
  ])
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const parsed = parseChart(r.value, interval)
      if (parsed.price && parsed.price > 0) return parsed
    }
  }

  // Fallback: v7 quote for price only
  const d7 = await tryFetch(`https://query1.finance.yahoo.com/v7/finance/quote?lang=en-US&region=US&symbols=${enc}`)
  const p7 = d7?.quoteResponse?.result?.[0]?.regularMarketPrice
  return { price: p7 || null, chartData: [], open: null }
}

// Used by the polling loop (price only, no chart overhead)
async function fetchPrice(raw) {
  const { price } = await fetchPriceAndChart(raw)
  return price
}

function fmtPrice(p) {
  if (!p) return '—'
  if (p >= 1000) return Math.round(p).toLocaleString('en-US') // "44,234"
  return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function TradingViewChart() {
  const [lookup,     setLookup]     = useState('')
  const [livePrice,  setLivePrice]  = useState(null)
  const [liveSymbol, setLiveSymbol] = useState('')
  const [chartData,  setChartData]  = useState([])
  const [chartOpen,  setChartOpen]  = useState(null)
  const [tf,         setTf]         = useState('5m')
  const [fetching,   setFetching]   = useState(false)

  const TFS = [
    { label:'5m',  interval:'5m',  range:'1d'  },
    { label:'15m', interval:'15m', range:'5d'  },
    { label:'1H',  interval:'60m', range:'1mo' },
  ]

  const [alerts,    setAlerts]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('price-alerts') || '[]') } catch { return [] }
  })
  const [aSym,      setASym]      = useState('')
  const [aPrice,    setAPrice]    = useState('')
  const [aLabel,    setALabel]    = useState('')
  const [prices,    setPrices]    = useState({})
  const [lastCheck,    setLastCheck]    = useState(null)
  const [chartUpdated, setChartUpdated] = useState(null)
  const [checking,  setChecking]  = useState(false)
  const [notifPerm, setNotifPerm] = useState(
    () => typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )

  const alertsRef    = useRef(alerts)
  const prevPricesRef = useRef({})
  useEffect(() => { alertsRef.current = alerts }, [alerts])
  useEffect(() => { localStorage.setItem('price-alerts', JSON.stringify(alerts)) }, [alerts])

  // ── Stable price poll ──
  useEffect(() => {
    const check = async () => {
      const active = alertsRef.current.filter(a => !a.triggered)
      if (!active.length) return
      setChecking(true)
      for (const a of active) {
        const c = await fetchPrice(a.symbol)
        if (!c || c === 0) continue
        setPrices(p => ({ ...p, [a.symbol]: c }))
        const prev = prevPricesRef.current[a.symbol]
        prevPricesRef.current[a.symbol] = c
        // Trigger only when price actually crosses the level — no tolerance buffer
        const crossed  = prev !== undefined &&
          ((prev < a.price && c >= a.price) || (prev > a.price && c <= a.price))
        // First poll: trigger if already within 0.1% (price was already at the level)
        const firstHit = prev === undefined && Math.abs(c - a.price) / a.price <= 0.001
        if (crossed || firstHit) {
          setAlerts(prev2 => prev2.map(x =>
            x.id === a.id ? { ...x, triggered: true, triggeredPrice: c, triggeredAt: new Date().toISOString() } : x
          ))
          if (Notification.permission === 'granted') {
            new Notification(`🔔 ${a.symbol} @ ${fmtPrice(a.price)}!`, {
              body: `Prisnivå nådd · Nu: ${fmtPrice(c)}`,
              icon: '/kamyab-trading/icon.svg',
            })
          }
        }
      }
      setChecking(false)
      setLastCheck(new Date())
    }
    check()
    const iv = setInterval(check, 15000)
    return () => clearInterval(iv)
  }, [])

  async function doLookup(sym, interval, range) {
    if (!sym?.trim()) return
    const tfObj = TFS.find(t => t.label === tf) || TFS[0]
    const iv = interval || tfObj.interval
    const rng = range  || tfObj.range
    setLivePrice(null); setChartData([]); setChartOpen(null)
    setLiveSymbol(sym.trim().toUpperCase())
    setFetching(true)
    const { price, chartData: cd, open } = await fetchPriceAndChart(sym, iv, rng)
    setLivePrice(price)
    setChartData(cd)
    setChartOpen(open)
    if (price) { setAPrice(Math.round(price).toString()); setChartUpdated(new Date()) }
    setFetching(false)
  }

  // Re-fetch chart when timeframe changes (if symbol is loaded)
  const liveSymRef = useRef('')
  const tfRef      = useRef(tf)
  useEffect(() => { liveSymRef.current = liveSymbol }, [liveSymbol])
  useEffect(() => { tfRef.current = tf }, [tf])
  useEffect(() => {
    if (liveSymRef.current) {
      const tfObj = TFS.find(t => t.label === tf) || TFS[0]
      doLookup(liveSymRef.current, tfObj.interval, tfObj.range)
    }
  }, [tf])

  // Auto-refresh chart every 60s — uses refs so always reads latest symbol/tf
  useEffect(() => {
    const refresh = async () => {
      const sym = liveSymRef.current
      if (!sym) return
      const tfObj = TFS.find(t => t.label === tfRef.current) || TFS[0]
      const { price, chartData: cd, open } = await fetchPriceAndChart(sym, tfObj.interval, tfObj.range)
      if (price) {
        setLivePrice(price)
        setChartData(cd)
        setChartOpen(open)
        setChartUpdated(new Date())
      }
    }
    const iv = setInterval(refresh, 60000)
    return () => clearInterval(iv)
  }, []) // stable — reads refs

  function addAlert() {
    if (!aSym || !aPrice) return
    const a = {
      id:        Date.now(),
      symbol:    aSym.trim().toUpperCase(),
      price:     parseFloat(aPrice),
      label:     aLabel.trim() || `${aSym.toUpperCase()} @ ${aPrice}`,
      triggered: false,
      createdAt: new Date().toISOString(),
    }
    setAlerts(p => [a, ...p])
    setASym(''); setAPrice(''); setALabel('')
    if (Notification.permission === 'default') Notification.requestPermission().then(setNotifPerm)
  }

  const inp = {
    background:'#08101c', border:'1px solid #1c2e4a', borderRadius:'7px',
    color:'#dce8f5', fontFamily:M, fontSize:'14px', padding:'10px 12px',
    outline:'none', boxSizing:'border-box', width:'100%',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

      {/* ── PRISKOLL ── */}
      <div style={{ background:'#0c1422', border:'1px solid #162340', borderRadius:'12px', padding:'16px' }}>
        <div style={{ fontFamily:M, fontSize:'8px', color:'#7a96b4', letterSpacing:'2px', marginBottom:'12px' }}>PRISKOLL</div>
        <div style={{ display:'flex', gap:'8px' }}>
          <input
            value={lookup}
            onChange={e => setLookup(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && doLookup(lookup)}
            placeholder="US30, MYM, GOLD, BTC, AAPL..."
            style={{ ...inp, flex:1, fontSize:'15px' }}
          />
          <button onClick={() => doLookup(lookup)} disabled={fetching} style={{
            background:'#f59e0b', border:'none', borderRadius:'7px', color:'#0a0700',
            fontFamily:M, fontSize:'11px', fontWeight:700, padding:'0 18px',
            cursor:'pointer', flexShrink:0, opacity: fetching ? 0.6 : 1,
          }}>
            {fetching ? '...' : 'Hämta'}
          </button>
        </div>

        {livePrice && (() => {
          const isUp   = !chartOpen || livePrice >= chartOpen
          const color  = isUp ? '#00e5b0' : '#ff4f6b'
          const pctChg = chartOpen ? ((livePrice - chartOpen) / chartOpen * 100).toFixed(2) : null
          const alertRef = aPrice ? parseFloat(aPrice) : null
          return (
            <div style={{ marginTop:'12px', background:'#0a1020', borderRadius:'10px', border:`1px solid ${isUp ? 'rgba(0,229,176,0.15)' : 'rgba(255,79,107,0.15)'}`, overflow:'hidden' }}>
              {/* Price header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px' }}>
                <div>
                  <div style={{ fontFamily:M, fontSize:'10px', color:'#7a96b4', marginBottom:'4px' }}>
                    {liveSymbol}
                    {resolveSym(liveSymbol) !== liveSymbol && (
                      <span style={{ color:'#3a5878', marginLeft:'6px' }}>{resolveSym(liveSymbol)}</span>
                    )}
                  </div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'8px' }}>
                    <span style={{ fontFamily:M, fontSize:'30px', fontWeight:700, color, lineHeight:1 }}>{fmtPrice(livePrice)}</span>
                    {pctChg && (
                      <span style={{ fontFamily:M, fontSize:'11px', color, fontWeight:600 }}>
                        {isUp ? '+' : ''}{pctChg}%
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => { setASym(liveSymbol); setAPrice(Math.round(livePrice).toString()) }} style={{
                  background:'#18100a', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'7px',
                  color:'#f59e0b', fontFamily:M, fontSize:'9px', fontWeight:700,
                  padding:'8px 12px', cursor:'pointer',
                }}>+ Sätt larm</button>
              </div>

              {/* Chart */}
              {/* Timeframe selector + last updated */}
              <div style={{ display:'flex', gap:'4px', padding:'0 14px 8px', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', gap:'4px' }}>
                  {TFS.map(({ label }) => (
                    <button key={label} onClick={() => setTf(label)} style={{
                      fontFamily:M, fontSize:'9px', padding:'4px 10px', borderRadius:'5px',
                      border:`1px solid ${tf===label?'rgba(0,229,176,0.4)':'#162340'}`,
                      background:tf===label?'#001810':'transparent',
                      color:tf===label?'#00e5b0':'#6880a0', cursor:'pointer',
                      WebkitTapHighlightColor:'transparent',
                    }}>{label}</button>
                  ))}
                  {fetching && <span style={{ fontFamily:M, fontSize:'9px', color:'#f59e0b', alignSelf:'center' }}>↻</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  {chartUpdated && (
                    <span style={{ fontFamily:M, fontSize:'8px', color:'#3a5878' }}>
                      upd {chartUpdated.toLocaleTimeString('sv-SE', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                    </span>
                  )}
                  <button onClick={() => { const tfObj=TFS.find(t=>t.label===tf)||TFS[0]; doLookup(liveSymbol, tfObj.interval, tfObj.range) }}
                    style={{ background:'none', border:'1px solid #162340', borderRadius:'5px', color:'#6880a0', fontFamily:M, fontSize:'9px', padding:'3px 8px', cursor:'pointer' }}>
                    ↻
                  </button>
                </div>
              </div>

              {chartData.length > 1 && (
                <div style={{ paddingBottom:'4px' }}>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={chartData} margin={{ top:0, right:0, left:0, bottom:0 }}>
                      <defs>
                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="t" tick={{ fill:'#4a6888', fontSize:8, fontFamily:M }} axisLine={false} tickLine={false} interval={Math.max(1, Math.floor(chartData.length / 6))} />
                      <YAxis hide domain={['auto','auto']} />
                      {chartOpen && <ReferenceLine y={chartOpen} stroke="#162340" strokeDasharray="3 3" />}
                      {alertRef && <ReferenceLine y={alertRef} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} label={{ value:'larm', position:'right', fontSize:8, fill:'#f59e0b', fontFamily:M }} />}
                      <Tooltip
                        contentStyle={{ background:'#0f1828', border:'1px solid #162340', borderRadius:'6px', fontFamily:M, fontSize:10 }}
                        formatter={v => [fmtPrice(v), '']}
                        labelStyle={{ color:'#7a96b4' }}
                      />
                      <Area type="monotone" dataKey="p" stroke={color} strokeWidth={1.5} fill="url(#cg)" dot={false} activeDot={{ r:3, fill:color, stroke:'#070a14', strokeWidth:2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )
        })()}

        {liveSymbol && !livePrice && !fetching && (
          <div style={{ marginTop:'10px', fontFamily:M, fontSize:'10px', color:'#7a3040' }}>
            Inget pris hittades för <b style={{ color:'#ff4f6b' }}>{resolveSym(liveSymbol)}</b> — prova igen eller kontrollera symbolen
          </div>
        )}
      </div>

      {/* ── PRISNIVÅLARM ── */}
      <div style={{ background:'#0c1422', border:'1px solid #162340', borderRadius:'12px', padding:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
          <div style={{ fontFamily:M, fontSize:'8px', color:'#7a96b4', letterSpacing:'2px' }}>PRISNIVÅLARM</div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            {lastCheck && (
              <span style={{ fontFamily:M, fontSize:'8px', color:'#3a5878' }}>
                {lastCheck.toLocaleTimeString('sv-SE', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
              </span>
            )}
            {checking && <span style={{ fontFamily:M, fontSize:'10px', color:'#f59e0b' }}>↻</span>}
          </div>
        </div>

        {/* Notification banner */}
        {notifPerm === 'default' && (
          <div style={{ background:'#18100a', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'8px', padding:'10px 12px', marginBottom:'12px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px' }}>
            <div>
              <div style={{ fontFamily:M, fontSize:'9px', color:'#f59e0b', fontWeight:700, marginBottom:'2px' }}>AKTIVERA NOTISER</div>
              <div style={{ fontFamily:M, fontSize:'8px', color:'#7a6030', lineHeight:1.4 }}>Tillåt för att få ping när priset nås</div>
            </div>
            <button onClick={async () => { const p = await Notification.requestPermission(); setNotifPerm(p) }}
              style={{ background:'#f59e0b', border:'none', borderRadius:'6px', color:'#0a0700', fontFamily:M, fontSize:'9px', fontWeight:700, padding:'6px 12px', cursor:'pointer', flexShrink:0 }}>
              Tillåt
            </button>
          </div>
        )}
        {notifPerm === 'granted' && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <div style={{ fontFamily:M, fontSize:'8px', color:'#00e5b0' }}>✓ Notiser aktiverade · kontroll var 15s</div>
            <button onClick={() => new Notification('🔔 Test', { body:'Notiser fungerar!', icon:'/kamyab-trading/icon.svg' })}
              style={{ background:'none', border:'1px solid #162340', borderRadius:'5px', color:'#6880a0', fontFamily:M, fontSize:'8px', padding:'3px 8px', cursor:'pointer' }}>
              Testa
            </button>
          </div>
        )}
        {notifPerm === 'denied' && (
          <div style={{ fontFamily:M, fontSize:'8px', color:'#7a3040', background:'#1a0610', border:'1px solid rgba(255,79,107,0.2)', borderRadius:'6px', padding:'8px 10px', marginBottom:'12px' }}>
            🚫 Notiser blockerade — tillåt i telefonens inställningar
          </div>
        )}

        {/* Add form */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'8px', alignItems:'flex-end' }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'4px' }}>
              <span style={{ fontFamily:M, fontSize:'7px', color:'#6880a0', letterSpacing:'1px' }}>SYMBOL</span>
              {aSym && resolveSym(aSym) !== aSym && (
                <span style={{ fontFamily:M, fontSize:'7px', color:'#00e5b0' }}>→ {resolveSym(aSym)}</span>
              )}
            </div>
            <input value={aSym} onChange={e => setASym(e.target.value.toUpperCase())}
              placeholder="US30, MYM, GOLD..." style={inp} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:M, fontSize:'7px', color:'#6880a0', letterSpacing:'1px', marginBottom:'4px' }}>PRISNIVÅ</div>
            <input type="number" value={aPrice} onChange={e => setAPrice(e.target.value)}
              placeholder="44 500" style={inp} />
          </div>
          <button onClick={addAlert} style={{
            background:'#f59e0b', border:'none', borderRadius:'7px', color:'#0a0700',
            fontFamily:M, fontSize:'11px', fontWeight:700, padding:'0 16px',
            cursor:'pointer', flexShrink:0, height:'42px',
          }}>+</button>
        </div>

        {/* Alert list */}
        {alerts.length === 0 && (
          <div style={{ fontFamily:M, fontSize:'10px', color:'#2a3c50', textAlign:'center', padding:'20px 0' }}>
            Inga aktiva larm — hämta ett pris ovan och tryck "Sätt larm"
          </div>
        )}
        {alerts.map(a => {
          const resolved = resolveSym(a.symbol)
          const aliased  = resolved !== a.symbol.toUpperCase()
          const cur      = prices[a.symbol]
          const dist     = cur && !a.triggered ? Math.abs(((cur - a.price) / a.price) * 100).toFixed(1) : null
          return (
            <div key={a.id} style={{
              display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px',
              borderRadius:'8px', marginBottom:'5px',
              background: a.triggered ? '#001810' : '#0a1020',
              border: `1px solid ${a.triggered ? 'rgba(0,229,176,0.25)' : '#162340'}`,
            }}>
              <div style={{ fontFamily:M, fontSize:'14px', color: a.triggered ? '#00e5b0' : '#f59e0b', flexShrink:0 }}>
                {a.triggered ? '✓' : '◎'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                  <span style={{ fontFamily:M, fontSize:'11px', color: a.triggered ? '#00e5b0' : '#dce8f5', fontWeight:600 }}>
                    {a.symbol} @ {a.price.toLocaleString()}
                  </span>
                  {aliased && (
                    <span style={{ fontFamily:M, fontSize:'8px', color:'#4a6888', background:'#070a14', border:'1px solid #162340', borderRadius:'3px', padding:'1px 5px' }}>
                      {resolved}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily:M, fontSize:'8px', color:'#4a6888', marginTop:'2px' }}>
                  {a.triggered
                    ? `Touchade @ ${fmtPrice(a.triggeredPrice)}`
                    : cur
                      ? `Nu: ${fmtPrice(cur)} · ${dist}% kvar`
                      : 'Väntar...'}
                </div>
              </div>
              <button onClick={() => setAlerts(p => p.filter(x => x.id !== a.id))}
                style={{ background:'none', border:'none', color:'#3a5878', cursor:'pointer', fontSize:'18px', padding:'0 2px', flexShrink:0 }}>×</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
