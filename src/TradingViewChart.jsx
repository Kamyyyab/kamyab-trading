import { useEffect, useRef, useState } from 'react'

const M      = "'JetBrains Mono', monospace"
const FINNHUB = 'd86pfmhr01qurhv774f0d86pfmhr01qurhv774fg'

const TFS = [
  ['1m','1'],['3m','3'],['5m','5'],['15m','15'],
  ['30m','30'],['1H','60'],['4H','240'],['D','D'],
]

// Common name → Finnhub ticker mapping
const ALIASES = {
  // Indices → ETF proxies
  'US30':   'DIA',   'DJ30':   'DIA',   'DJIA':  'DIA',   'DOW':    'DIA',
  'US100':  'QQQ',   'NAS100': 'QQQ',   'NDX':   'QQQ',   'NASDAQ': 'QQQ',
  'US500':  'SPY',   'SP500':  'SPY',   'SPX':   'SPY',   'S&P500': 'SPY',
  'US2000': 'IWM',   'RUT':    'IWM',
  'DAX':    'EWG',   'GER40':  'EWG',
  'FTSE':   'EWU',   'UK100':  'EWU',
  // Metals
  'GOLD':   'GLD',   'XAU':    'GLD',   'XAUUSD': 'GLD',
  'SILVER': 'SLV',   'XAG':    'SLV',   'XAGUSD': 'SLV',
  // Energy
  'OIL':    'USO',   'CRUDE':  'USO',   'USOIL':  'USO',   'WTI':   'USO',
  'BRENT':  'BNO',
  // Crypto → Binance pairs (Finnhub supports these)
  'BTC':      'BINANCE:BTCUSDT', 'BTCUSD':  'BINANCE:BTCUSDT', 'BITCOIN': 'BINANCE:BTCUSDT',
  'ETH':      'BINANCE:ETHUSDT', 'ETHUSD':  'BINANCE:ETHUSDT',
  'SOL':      'BINANCE:SOLUSDT', 'SOLUSD':  'BINANCE:SOLUSDT',
  'XRP':      'BINANCE:XRPUSDT', 'XRPUSD':  'BINANCE:XRPUSDT',
  'BNB':      'BINANCE:BNBUSDT',
  'ADA':      'BINANCE:ADAUSDT',
}

// Resolve a user-input symbol to Finnhub-compatible ticker
const resolveSym = s => ALIASES[s.trim().toUpperCase()] || s.trim().toUpperCase()

// Futures can't be auto-polled (not on Finnhub free tier)
const isFutures = s => {
  if (ALIASES[s.toUpperCase()]) return false // aliases are always non-futures
  return /1!$/i.test(s) || /^(CBOT:|CME:|COMEX:|NYMEX:)/i.test(s)
}

let ctr = 0

export default function TradingViewChart() {
  const [sym,      setSym]      = useState('MYM1!')
  const [symInput, setSymInput] = useState('MYM1!')
  const [tf,       setTf]       = useState('5')
  const containerRef = useRef(null)

  const [alerts,    setAlerts]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('price-alerts') || '[]') } catch { return [] }
  })
  const [aSym,      setASym]    = useState('')
  const [aPrice,    setAPrice]  = useState('')
  const [aDir,      setADir]    = useState('above')
  const [aLabel,    setALabel]  = useState('')
  const [prices,    setPrices]  = useState({})
  const [lastCheck, setLastCheck] = useState(null)
  const [checking,  setChecking]  = useState(false)

  // Keep a ref to latest alerts so the stable interval always reads current data
  const alertsRef = useRef(alerts)
  useEffect(() => { alertsRef.current = alerts }, [alerts])

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('price-alerts', JSON.stringify(alerts))
  }, [alerts])

  // ── TradingView chart ───────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = ''
    const id = 'tv_' + (++ctr) + '_' + Date.now()
    const div = document.createElement('div')
    div.id = id
    div.style.height = '100%'
    el.appendChild(div)

    const init = () => {
      if (!window.TradingView || !document.getElementById(id)) return
      new window.TradingView.widget({
        autosize: true, symbol: sym, interval: tf,
        timezone: 'Europe/Stockholm', theme: 'dark',
        style: '1', locale: 'en',
        enable_publishing: false, hide_side_toolbar: false,
        allow_symbol_change: true, save_image: false,
        container_id: id,
      })
    }

    if (window.TradingView) {
      init()
    } else if (!document.querySelector('script[data-tvjs]')) {
      const s = document.createElement('script')
      s.src = 'https://s3.tradingview.com/tv.js'
      s.setAttribute('data-tvjs', '1')
      s.async = true
      s.onload = init
      document.head.appendChild(s)
    } else {
      const poll = setInterval(() => { if (window.TradingView) { clearInterval(poll); init() } }, 200)
      return () => clearInterval(poll)
    }
  }, [sym, tf])

  // ── Price alert polling — stable, reads ref ─────────────────
  useEffect(() => {
    const check = async () => {
      const active = alertsRef.current.filter(a => !a.triggered && !isFutures(a.symbol))
      if (!active.length) return
      setChecking(true)
      for (const a of active) {
        try {
          const ticker = resolveSym(a.symbol)
          const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB}`)
          const d = await r.json()
          const c = d.c
          if (!c || c === 0) continue
          setPrices(p => ({ ...p, [a.symbol]: c }))
          const hit = a.dir === 'above' ? c >= a.price : c <= a.price
          if (hit) {
            setAlerts(prev => prev.map(x =>
              x.id === a.id
                ? { ...x, triggered: true, triggeredPrice: c, triggeredAt: new Date().toISOString() }
                : x
            ))
            if (Notification.permission === 'granted') {
              new Notification(`🔔 ${a.symbol} larm!`, {
                body: `${a.symbol} ${a.dir === 'above' ? '≥' : '≤'} ${a.price} · Nu: ${c.toFixed(2)}`,
                icon: '/kamyab-trading/icon.svg',
              })
            }
          }
        } catch { /* network error — silent */ }
      }
      setChecking(false)
      setLastCheck(new Date())
    }

    check()
    const interval = setInterval(check, 30000) // every 30s, stable
    return () => clearInterval(interval)
  }, []) // ← empty: runs once, uses alertsRef to stay fresh

  function commitSym() {
    const v = symInput.trim().toUpperCase()
    if (v) setSym(v)
  }

  function addAlert() {
    if (!aSym || !aPrice) return
    const a = {
      id:        Date.now(),
      symbol:    aSym.trim().toUpperCase(),
      price:     parseFloat(aPrice),
      dir:       aDir,
      label:     aLabel.trim() || `${aSym.toUpperCase()} ${aDir === 'above' ? '↑' : '↓'} ${aPrice}`,
      triggered: false,
      createdAt: new Date().toISOString(),
    }
    setAlerts(p => [a, ...p])
    setASym(''); setAPrice(''); setALabel('')
    if (Notification.permission === 'default') Notification.requestPermission()
  }

  const inp9 = {
    background: '#08101c', border: '1px solid #1c2e4a', borderRadius: '6px',
    color: '#dce8f5', fontFamily: M, fontSize: '11px', padding: '7px 10px',
    outline: 'none', boxSizing: 'border-box', width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── CHART ── */}
      <div style={{ background: '#0c1422', border: '1px solid #162340', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #162340', background: '#0a1020' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              value={symInput}
              onChange={e => setSymInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && commitSym()}
              placeholder="MYM1!, AAPL, BTC..."
              style={{ width: '150px', background: '#070a14', border: '1px solid #1c2e4a', borderRadius: '5px', color: '#dce8f5', fontFamily: M, fontSize: '10px', padding: '5px 9px', outline: 'none' }}
            />
            <button onClick={commitSym} style={{ background: '#18100a', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '5px', color: '#f59e0b', fontFamily: M, fontSize: '11px', padding: '5px 10px', cursor: 'pointer', fontWeight: 700 }}>→</button>
          </div>
          <div style={{ display: 'flex', gap: '3px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            {TFS.map(([l, v]) => (
              <button key={v} onClick={() => setTf(v)} style={{
                fontFamily: M, fontSize: '8px', padding: '4px 7px', borderRadius: '4px',
                border: `1px solid ${tf === v ? 'rgba(0,229,176,0.4)' : '#162340'}`,
                background: tf === v ? '#001810' : 'transparent',
                color: tf === v ? '#00e5b0' : '#6880a0', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}>{l}</button>
            ))}
          </div>
        </div>
        <div ref={containerRef} style={{ height: '640px' }} />
        <div style={{ padding: '7px 14px', borderTop: '1px solid #162340', background: '#080e1c', fontFamily: M, fontSize: '8px', color: '#3a5878' }}>
          💡 Klicka inne i chartet → högerklicka på en prisnivå → <span style={{ color: '#f59e0b' }}>Add Alert</span> — kräver TradingView-konto (gratis)
        </div>
      </div>

      {/* ── PRISNIVÅLARM ── */}
      <div style={{ background: '#0c1422', border: '1px solid #162340', borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontFamily: M, fontSize: '8px', color: '#7a96b4', letterSpacing: '2px' }}>PRISNIVÅLARM</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {lastCheck && (
              <span style={{ fontFamily: M, fontSize: '8px', color: '#3a5878' }}>
                Kollade: {lastCheck.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            {checking && <span style={{ fontFamily: M, fontSize: '8px', color: '#f59e0b' }}>↻</span>}
          </div>
        </div>

        {/* Add form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontFamily: M, fontSize: '7px', color: '#6880a0', letterSpacing: '1px' }}>SYMBOL</span>
              {aSym && ALIASES[aSym] && (
                <span style={{ fontFamily: M, fontSize: '7px', color: '#00e5b0' }}>→ {ALIASES[aSym]}</span>
              )}
            </div>
            <input value={aSym} onChange={e => setASym(e.target.value.toUpperCase())}
              placeholder="US30, AAPL, BTC, GOLD..." style={inp9} />
          </div>
          <div>
            <div style={{ fontFamily: M, fontSize: '7px', color: '#6880a0', letterSpacing: '1px', marginBottom: '4px' }}>PRIS</div>
            <input type="number" value={aPrice} onChange={e => setAPrice(e.target.value)} placeholder="45 000" style={inp9} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontFamily: M, fontSize: '7px', color: '#6880a0', letterSpacing: '1px' }}>RIKTNING</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[['above', '↑ Över'], ['below', '↓ Under']].map(([v, l]) => (
                <button key={v} onClick={() => setADir(v)} style={{
                  flex: 1, fontFamily: M, fontSize: '9px', padding: '7px 6px', borderRadius: '6px',
                  border: `1px solid ${aDir === v ? (v === 'above' ? 'rgba(0,229,176,0.4)' : 'rgba(255,79,107,0.4)') : '#162340'}`,
                  background: aDir === v ? (v === 'above' ? '#001810' : '#1a0610') : 'transparent',
                  color: aDir === v ? (v === 'above' ? '#00e5b0' : '#ff4f6b') : '#6880a0', cursor: 'pointer',
                }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <input value={aLabel} onChange={e => setALabel(e.target.value)} placeholder="Label (valfri)..." style={{ ...inp9, flex: 1 }} />
          <button onClick={addAlert} style={{ background: '#f59e0b', border: 'none', borderRadius: '6px', color: '#0a0700', fontFamily: M, fontSize: '10px', fontWeight: 700, padding: '7px 18px', cursor: 'pointer', flexShrink: 0 }}>+ Lägg till</button>
        </div>

        <div style={{ fontFamily: M, fontSize: '8px', color: '#2a3c50', marginBottom: '10px' }}>
          Aktier, index &amp; krypto: auto-kontroll var 30s (Finnhub). Futures: använd TV-larmet (högerklick i chart).
        </div>

        {alerts.length === 0 && (
          <div style={{ fontFamily: M, fontSize: '10px', color: '#2a3c50', textAlign: 'center', padding: '20px 0' }}>Inga aktiva larm</div>
        )}

        {alerts.map(a => {
          const fut      = isFutures(a.symbol)
          const resolved = resolveSym(a.symbol)
          const aliased  = resolved !== a.symbol.toUpperCase()
          const cur      = prices[a.symbol]
          const dist     = cur && !a.triggered ? Math.abs(((cur - a.price) / a.price) * 100).toFixed(1) : null
          return (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
              borderRadius: '8px', marginBottom: '5px',
              background: a.triggered ? '#001810' : '#0a1020',
              border: `1px solid ${a.triggered ? 'rgba(0,229,176,0.2)' : '#162340'}`,
            }}>
              <div style={{ fontFamily: M, fontSize: '16px', color: a.dir === 'above' ? '#00e5b0' : '#ff4f6b', flexShrink: 0 }}>
                {a.dir === 'above' ? '↑' : '↓'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: M, fontSize: '11px', color: a.triggered ? '#00e5b0' : '#dce8f5', fontWeight: 600 }}>
                    {a.symbol} {a.dir === 'above' ? '≥' : '≤'} {a.price.toLocaleString()}
                  </span>
                  {aliased && (
                    <span style={{ fontFamily: M, fontSize: '8px', color: '#4a6888', background: '#070a14', border: '1px solid #162340', borderRadius: '3px', padding: '1px 5px' }}>
                      → {resolved}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: M, fontSize: '8px', color: '#4a6888', marginTop: '2px' }}>
                  {a.triggered
                    ? `✓ Triggad @ ${a.triggeredPrice?.toFixed(2)}`
                    : fut
                      ? 'Futures — lägg larm direkt i TV-chartet'
                      : cur
                        ? `Nu: ${cur.toFixed(2)} · ${dist}% kvar`
                        : 'Väntar på nästa kontroll...'}
                </div>
                {a.label && a.label !== `${a.symbol} ${a.dir === 'above' ? '↑' : '↓'} ${a.price}` && (
                  <div style={{ fontFamily: M, fontSize: '8px', color: '#6880a0', marginTop: '1px' }}>{a.label}</div>
                )}
              </div>
              <button onClick={() => setAlerts(p => p.filter(x => x.id !== a.id))}
                style={{ background: 'none', border: 'none', color: '#3a5878', cursor: 'pointer', fontSize: '18px', padding: '0 2px', flexShrink: 0 }}>×</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
