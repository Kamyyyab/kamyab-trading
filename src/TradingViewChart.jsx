import { useEffect, useRef, useState } from 'react'

const M     = "'JetBrains Mono', monospace"
const PROXY = 'https://corsproxy.io/?'
const YF    = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols='

const TFS = [
  ['1m','1'],['3m','3'],['5m','5'],['15m','15'],
  ['30m','30'],['1H','60'],['4H','240'],['D','D'],
]

// Common name → Yahoo Finance ticker (real prices, real levels)
const ALIASES = {
  // US indices (real level: ~44 000)
  'US30':   '^DJI',   'DJ30':   '^DJI',   'DJIA':   '^DJI',   'DOW':    '^DJI',
  'US100':  '^NDX',   'NAS100': '^NDX',   'NDX':    '^NDX',   'NASDAQ': '^NDX',
  'US500':  '^GSPC',  'SP500':  '^GSPC',  'SPX':    '^GSPC',  'S&P500': '^GSPC',
  'US2000': '^RUT',   'RUT':    '^RUT',
  'DAX':    '^GDAXI', 'GER40':  '^GDAXI',
  'FTSE':   '^FTSE',  'UK100':  '^FTSE',
  // Micro futures (real level ~44 000)
  'MYM':    'MYM=F',  'MYM1!':  'MYM=F',
  'MNQ':    'MNQ=F',  'MNQ1!':  'MNQ=F',
  'MES':    'MES=F',  'MES1!':  'MES=F',
  'M2K':    'M2K=F',
  // Full futures
  'YM':     'YM=F',   'YM1!':   'YM=F',
  'NQ':     'NQ=F',   'NQ1!':   'NQ=F',
  'ES':     'ES=F',   'ES1!':   'ES=F',
  'RTY':    'RTY=F',  'RTY1!':  'RTY=F',
  // Metals (real level: ~2 900)
  'GOLD':   'GC=F',   'XAU':    'GC=F',   'XAUUSD': 'GC=F',   'GC':     'GC=F',
  'SILVER': 'SI=F',   'XAG':    'SI=F',   'XAGUSD': 'SI=F',   'SI':     'SI=F',
  'PLATINUM':'PL=F',
  // Energy
  'OIL':    'CL=F',   'CRUDE':  'CL=F',   'USOIL':  'CL=F',   'WTI':    'CL=F',
  'BRENT':  'BZ=F',   'NG':     'NG=F',
  // Crypto
  'BTC':    'BTC-USD', 'BITCOIN':'BTC-USD', 'BTCUSD': 'BTC-USD',
  'ETH':    'ETH-USD', 'ETHUSD': 'ETH-USD',
  'SOL':    'SOL-USD', 'SOLUSD': 'SOL-USD',
  'XRP':    'XRP-USD', 'XRPUSD': 'XRP-USD',
  'BNB':    'BNB-USD', 'ADA':    'ADA-USD',
  'DOGE':   'DOGE-USD','AVAX':   'AVAX-USD',
}

const resolveSym = s => ALIASES[s.trim().toUpperCase()] || s.trim().toUpperCase()

async function fetchPrice(raw) {
  const ticker = resolveSym(raw)
  try {
    const url = PROXY + encodeURIComponent(YF + ticker)
    const r   = await fetch(url)
    const d   = await r.json()
    return d?.quoteResponse?.result?.[0]?.regularMarketPrice ?? null
  } catch { return null }
}

let ctr = 0

export default function TradingViewChart() {
  const [sym,      setSym]      = useState('DJ:DJI')
  const [symInput, setSymInput] = useState('DJ:DJI')
  const [tf,       setTf]       = useState('5')
  const containerRef = useRef(null)

  const [alerts,    setAlerts]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('price-alerts') || '[]') } catch { return [] }
  })
  const [aSym,      setASym]    = useState('')
  const [aPrice,    setAPrice]  = useState('')
  const [aLabel,    setALabel]  = useState('')
  const [prices,    setPrices]  = useState({})
  const prevPricesRef = useRef({})
  const [lastCheck,  setLastCheck]  = useState(null)
  const [checking,   setChecking]   = useState(false)
  const [notifPerm,  setNotifPerm]  = useState(() => typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')

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
      const active = alertsRef.current.filter(a => !a.triggered)
      if (!active.length) return
      setChecking(true)
      for (const a of active) {
        try {
          const c = await fetchPrice(a.symbol)
          if (!c || c === 0) continue
          setPrices(p => ({ ...p, [a.symbol]: c }))
          const prev = prevPricesRef.current[a.symbol]
          prevPricesRef.current[a.symbol] = c
          // Touch = price crossed level in either direction, OR within 0.2%
          const crossed = prev !== undefined &&
            ((prev < a.price && c >= a.price) || (prev > a.price && c <= a.price))
          const near = Math.abs(c - a.price) / a.price <= 0.002
          const hit = crossed || near
          if (hit) {
            setAlerts(prev2 => prev2.map(x =>
              x.id === a.id
                ? { ...x, triggered: true, triggeredPrice: c, triggeredAt: new Date().toISOString() }
                : x
            ))
            if (Notification.permission === 'granted') {
              new Notification(`🔔 ${a.symbol} touchade ${a.price}!`, {
                body: `${a.symbol} @ ${c.toFixed(2)} — Prisnivå ${a.price} nådd`,
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
      label:     aLabel.trim() || `${aSym.toUpperCase()} @ ${aPrice}`,
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
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontFamily: M, fontSize: '7px', color: '#6880a0', letterSpacing: '1px' }}>SYMBOL</span>
              {aSym && ALIASES[aSym] && (
                <span style={{ fontFamily: M, fontSize: '7px', color: '#00e5b0' }}>→ {ALIASES[aSym]}</span>
              )}
            </div>
            <input value={aSym} onChange={e => setASym(e.target.value.toUpperCase())}
              placeholder="US30, AAPL, BTC..." style={inp9} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: M, fontSize: '7px', color: '#6880a0', letterSpacing: '1px', marginBottom: '4px' }}>PRISNIVÅ</div>
            <input type="number" value={aPrice} onChange={e => setAPrice(e.target.value)} placeholder="44 500" style={inp9} />
          </div>
          <button onClick={addAlert} style={{ background: '#f59e0b', border: 'none', borderRadius: '6px', color: '#0a0700', fontFamily: M, fontSize: '10px', fontWeight: 700, padding: '9px 16px', cursor: 'pointer', flexShrink: 0, height: '38px' }}>+ Lägg till</button>
        </div>

        <div style={{ fontFamily: M, fontSize: '8px', color: '#2a3c50', marginBottom: '12px' }}>
          Priser hämtas via Yahoo Finance — riktiga nivåer. T.ex. <span style={{ color: '#6880a0' }}>US30 @ 44 500, MYM @ 44 200, GOLD @ 2 950, BTC @ 105 000</span>.
        </div>

        {/* Notification permission */}
        {notifPerm === 'default' && (
          <div style={{ background: '#18100a', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div>
              <div style={{ fontFamily: M, fontSize: '9px', color: '#f59e0b', fontWeight: 700, marginBottom: '2px' }}>AKTIVERA NOTISER</div>
              <div style={{ fontFamily: M, fontSize: '8px', color: '#7a6030', lineHeight: 1.4 }}>Tillåt notiser för att få ping på telefonen när priset nås</div>
            </div>
            <button onClick={async () => {
              const p = await Notification.requestPermission()
              setNotifPerm(p)
            }} style={{ background: '#f59e0b', border: 'none', borderRadius: '6px', color: '#0a0700', fontFamily: M, fontSize: '9px', fontWeight: 700, padding: '6px 12px', cursor: 'pointer', flexShrink: 0 }}>
              Tillåt
            </button>
          </div>
        )}
        {notifPerm === 'granted' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontFamily: M, fontSize: '8px', color: '#00e5b0' }}>✓ Notiser aktiverade</div>
            <button onClick={() => {
              new Notification('🔔 Test-notis', { body: 'Notiser fungerar! Du får ping när priset nås.', icon: '/kamyab-trading/icon.svg' })
            }} style={{ background: 'none', border: '1px solid #162340', borderRadius: '5px', color: '#6880a0', fontFamily: M, fontSize: '8px', padding: '3px 8px', cursor: 'pointer' }}>
              Testa
            </button>
          </div>
        )}
        {notifPerm === 'denied' && (
          <div style={{ fontFamily: M, fontSize: '8px', color: '#7a3040', background: '#1a0610', border: '1px solid rgba(255,79,107,0.2)', borderRadius: '6px', padding: '8px 10px', marginBottom: '10px' }}>
            🚫 Notiser blockerade i webbläsaren. Gå till inställningar → tillåt notiser för denna sida.
          </div>
        )}
        {notifPerm === 'granted' && (
          <div style={{ fontFamily: M, fontSize: '7px', color: '#2a3c50', marginBottom: '10px', lineHeight: 1.5 }}>
            📱 Mobil: installera appen (Dela → Lägg till på hemskärmen) och håll den öppen i bakgrunden för notiser.
          </div>
        )}

        {alerts.length === 0 && (
          <div style={{ fontFamily: M, fontSize: '10px', color: '#2a3c50', textAlign: 'center', padding: '20px 0' }}>Inga aktiva larm</div>
        )}

        {alerts.map(a => {
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
              <div style={{ fontFamily: M, fontSize: '14px', color: '#f59e0b', flexShrink: 0 }}>◎</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: M, fontSize: '11px', color: a.triggered ? '#00e5b0' : '#dce8f5', fontWeight: 600 }}>
                    {a.symbol} @ {a.price.toLocaleString()}
                  </span>
                  {aliased && (
                    <span style={{ fontFamily: M, fontSize: '8px', color: '#4a6888', background: '#070a14', border: '1px solid #162340', borderRadius: '3px', padding: '1px 5px' }}>
                      → {resolved}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: M, fontSize: '8px', color: '#4a6888', marginTop: '2px' }}>
                  {a.triggered
                    ? `✓ Touchade @ ${a.triggeredPrice?.toFixed(2)}`
                    : cur
                      ? `Nu: ${cur.toLocaleString(undefined, {maximumFractionDigits: 2})} · ${dist}% kvar`
                      : 'Väntar på nästa kontroll...'}
                </div>
                {a.label && a.label !== `${a.symbol} @ ${a.price}` && (
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
