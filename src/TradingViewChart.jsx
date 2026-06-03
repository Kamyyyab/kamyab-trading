import { useEffect, useRef, useState } from 'react'

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

async function tryFetch(url) {
  for (const proxy of PROXIES) {
    try {
      const r = await fetch(proxy(url), { signal: AbortSignal.timeout(7000) })
      if (!r.ok) continue
      const txt = await r.text()
      if (!txt || txt.startsWith('<')) continue  // got HTML error page
      return JSON.parse(txt)
    } catch { /* try next */ }
  }
  return null
}

async function fetchPrice(raw) {
  const ticker = resolveSym(raw)
  const enc    = encodeURIComponent(ticker)

  // Try 1: Yahoo Finance v8 chart (most reliable)
  const d8 = await tryFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${enc}?interval=1m&range=1d`)
  const p8 = d8?.chart?.result?.[0]?.meta?.regularMarketPrice
  if (p8 && p8 > 0) return p8

  // Try 2: Yahoo Finance v7 quote
  const d7 = await tryFetch(`https://query1.finance.yahoo.com/v7/finance/quote?lang=en-US&region=US&symbols=${enc}`)
  const p7 = d7?.quoteResponse?.result?.[0]?.regularMarketPrice
  if (p7 && p7 > 0) return p7

  // Try 3: query2 instead of query1
  const dq2 = await tryFetch(`https://query2.finance.yahoo.com/v8/finance/chart/${enc}?interval=1m&range=1d`)
  const pq2 = dq2?.chart?.result?.[0]?.meta?.regularMarketPrice
  if (pq2 && pq2 > 0) return pq2

  return null
}

function fmtPrice(p) {
  if (!p) return '—'
  return p.toLocaleString('sv-SE', { maximumFractionDigits: p > 1000 ? 0 : 2 })
}

export default function TradingViewChart() {
  const [lookup,     setLookup]     = useState('')
  const [livePrice,  setLivePrice]  = useState(null)
  const [liveSymbol, setLiveSymbol] = useState('')
  const [fetching,   setFetching]   = useState(false)

  const [alerts,    setAlerts]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('price-alerts') || '[]') } catch { return [] }
  })
  const [aSym,      setASym]      = useState('')
  const [aPrice,    setAPrice]    = useState('')
  const [aLabel,    setALabel]    = useState('')
  const [prices,    setPrices]    = useState({})
  const [lastCheck, setLastCheck] = useState(null)
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
        const crossed = prev !== undefined &&
          ((prev < a.price && c >= a.price) || (prev > a.price && c <= a.price))
        if (crossed) {
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

  async function doLookup(sym) {
    if (!sym.trim()) return
    setLivePrice(null)
    setLiveSymbol(sym.trim().toUpperCase())
    setFetching(true)
    const p = await fetchPrice(sym)
    setLivePrice(p)
    if (p) setAPrice(Math.round(p).toString())
    setFetching(false)
  }

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

        {livePrice && (
          <div style={{ marginTop:'12px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#0a1020', borderRadius:'8px', border:'1px solid #162340' }}>
            <div>
              <div style={{ fontFamily:M, fontSize:'11px', color:'#7a96b4', marginBottom:'2px' }}>
                {liveSymbol}
                {resolveSym(liveSymbol) !== liveSymbol && (
                  <span style={{ color:'#3a5878', marginLeft:'6px' }}>→ {resolveSym(liveSymbol)}</span>
                )}
              </div>
              <div style={{ fontFamily:M, fontSize:'28px', fontWeight:700, color:'#dce8f5', lineHeight:1 }}>
                {fmtPrice(livePrice)}
              </div>
            </div>
            <button onClick={() => { setASym(liveSymbol); setAPrice(Math.round(livePrice).toString()) }} style={{
              background:'#18100a', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'7px',
              color:'#f59e0b', fontFamily:M, fontSize:'9px', fontWeight:700,
              padding:'8px 12px', cursor:'pointer', letterSpacing:'0.5px',
            }}>
              + Sätt larm
            </button>
          </div>
        )}

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
