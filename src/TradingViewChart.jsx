import { useEffect, useRef, useState } from 'react'

const M = "'JetBrains Mono', monospace"

const SYMS = [
  ['MYM — Micro Dow',    'CME_MINI:MYM1!'],
  ['MNQ — Micro Nasdaq', 'CME_MINI:MNQ1!'],
  ['MES — Micro S&P',    'CME_MINI:MES1!'],
  ['YM  — Dow',          'CME:YM1!'],
  ['NQ  — Nasdaq',       'CME:NQ1!'],
  ['ES  — S&P 500',      'CME:ES1!'],
  ['GC  — Gold',         'COMEX:GC1!'],
  ['CL  — Crude Oil',    'NYMEX:CL1!'],
  ['BTC — Bitcoin',      'CME:BTC1!'],
]
const TFS = [['1m','1'],['3m','3'],['5m','5'],['15m','15'],['30m','30'],['1H','60'],['4H','240'],['D','D']]

let widgetCtr = 0

export default function TradingViewChart() {
  const [sym, setSym] = useState('CME_MINI:MYM1!')
  const [tf,  setTf]  = useState('5')
  const containerRef  = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = ''
    const id = 'tv_' + (++widgetCtr) + '_' + Date.now()
    const inner = document.createElement('div')
    inner.id = id
    inner.style.height = '100%'
    el.appendChild(inner)

    const init = () => {
      if (!window.TradingView || !document.getElementById(id)) return
      new window.TradingView.widget({
        autosize:           true,
        symbol:             sym,
        interval:           tf,
        timezone:           'Europe/Stockholm',
        theme:              'dark',
        style:              '1',
        locale:             'en',
        enable_publishing:  false,
        hide_side_toolbar:  false,
        allow_symbol_change: true,
        save_image:         false,
        container_id:       id,
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
      const poll = setInterval(() => {
        if (window.TradingView) { clearInterval(poll); init() }
      }, 200)
      return () => clearInterval(poll)
    }
  }, [sym, tf])

  return (
    <div style={{ background:'#0c1422', border:'1px solid #162340', borderRadius:'12px', overflow:'hidden' }}>
      <div style={{ padding:'10px 14px', display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap', borderBottom:'1px solid #162340', background:'#0a1020' }}>
        <span style={{ fontFamily:M, fontSize:'8px', color:'#7a96b4', letterSpacing:'2px', flexShrink:0 }}>CHART</span>
        <select value={sym} onChange={e => setSym(e.target.value)} style={{
          background:'#070a14', border:'1px solid #162340', borderRadius:'5px',
          color:'#dce8f5', fontFamily:M, fontSize:'10px', padding:'5px 8px',
          outline:'none', cursor:'pointer', flexShrink:0,
        }}>
          {SYMS.map(([l, v]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div style={{ display:'flex', gap:'3px', flexWrap:'wrap' }}>
          {TFS.map(([label, val]) => (
            <button key={val} onClick={() => setTf(val)} style={{
              fontFamily:M, fontSize:'8px', padding:'4px 8px', borderRadius:'4px',
              border:`1px solid ${tf===val?'rgba(245,158,11,0.5)':'#162340'}`,
              background:tf===val?'#18100a':'transparent',
              color:tf===val?'#f59e0b':'#6880a0', cursor:'pointer',
              WebkitTapHighlightColor:'transparent', transition:'all 0.12s',
            }}>{label}</button>
          ))}
        </div>
      </div>
      <div ref={containerRef} style={{ height:'520px' }} />
    </div>
  )
}
