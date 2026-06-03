import { useState } from 'react'
import { useT } from './lang.js'

const CONTRACTS = {
  YM:   { name: 'YM — Dow Futures',       pointValue: 5,        group: 'Equity' },
  MYM:  { name: 'MYM — Micro Dow',         pointValue: 0.5,      group: 'Equity' },
  NQ:   { name: 'NQ — Nasdaq Futures',     pointValue: 20,       group: 'Equity' },
  MNQ:  { name: 'MNQ — Micro Nasdaq',      pointValue: 2,        group: 'Equity' },
  ES:   { name: 'ES — S&P 500',            pointValue: 50,       group: 'Equity' },
  MES:  { name: 'MES — Micro S&P',         pointValue: 5,        group: 'Equity' },
  RTY:  { name: 'RTY — Russell 2000',      pointValue: 50,       group: 'Equity' },
  M2K:  { name: 'M2K — Micro Russell',     pointValue: 5,        group: 'Equity' },
  GC:   { name: 'GC — Gold Futures',       pointValue: 100,      group: 'Metals' },
  MGC:  { name: 'MGC — Micro Gold',        pointValue: 10,       group: 'Metals' },
  SI:   { name: 'SI — Silver Futures',     pointValue: 5000,     group: 'Metals' },
  SIL:  { name: 'SIL — Micro Silver',      pointValue: 1000,     group: 'Metals' },
  HG:   { name: 'HG — Copper Futures',     pointValue: 25000,    group: 'Metals' },
  PL:   { name: 'PL — Platinum',           pointValue: 50,       group: 'Metals' },
  CL:   { name: 'CL — Crude Oil',          pointValue: 1000,     group: 'Energy' },
  MCL:  { name: 'MCL — Micro Crude Oil',   pointValue: 100,      group: 'Energy' },
  NG:   { name: 'NG — Natural Gas',        pointValue: 10000,    group: 'Energy' },
  RB:   { name: 'RB — RBOB Gasoline',      pointValue: 42000,    group: 'Energy' },
  BTC:  { name: 'BTC — Bitcoin Futures',   pointValue: 5,        group: 'Crypto' },
  MBT:  { name: 'MBT — Micro Bitcoin',     pointValue: 0.1,      group: 'Crypto' },
  ETH:  { name: 'ETH — Ether Futures',     pointValue: 50,       group: 'Crypto' },
  MET:  { name: 'MET — Micro Ether',       pointValue: 0.1,      group: 'Crypto' },
  ZN:   { name: 'ZN — 10-Year T-Note',     pointValue: 1000,     group: 'Bonds' },
  ZB:   { name: 'ZB — 30-Year T-Bond',     pointValue: 1000,     group: 'Bonds' },
  ZF:   { name: 'ZF — 5-Year T-Note',      pointValue: 1000,     group: 'Bonds' },
  '6E': { name: '6E — Euro FX',            pointValue: 125000,   group: 'FX' },
  '6J': { name: '6J — Japanese Yen',       pointValue: 12500000, group: 'FX' },
  '6B': { name: '6B — British Pound',      pointValue: 62500,    group: 'FX' },
}

const DEFAULT_ACCOUNTS = [
  { label: '25K',    size: 25000,  risk: 0.5 },
  { label: '50K',    size: 50000,  risk: 0.5 },
  { label: '100K',   size: 100000, risk: 0.5 },
  { label: '150K',   size: 150000, risk: 0.5 },
  { label: 'Custom', size: null,   risk: null },
]

const GROUPS = ['Equity', 'Metals', 'Energy', 'Crypto', 'Bonds', 'FX']
const groupColors = {
  Equity: '#00e5b0', Metals: '#ffc030', Energy: '#ff8c42',
  Crypto: '#a78bfa', Bonds: '#60a5fa',  FX: '#f472b6',
}

const inp = {
  width: '100%',
  background: '#0a1020',
  border: '1px solid #1c2e4a',
  borderRadius: '10px',
  color: '#dce8f5',
  fontSize: '16px',       // ≥16px prevents iOS zoom
  padding: '13px 14px',
  outline: 'none',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
}

const label = {
  fontFamily: 'monospace',
  fontSize: '10px',
  color: '#7a96b4',
  letterSpacing: '1.5px',
  marginBottom: '7px',
  display: 'block',
}

function Chip({ active, color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: active ? '#18100a' : '#0a1020',
      border: `1px solid ${active ? (color || 'rgba(245,158,11,0.5)') : '#162340'}`,
      borderRadius: '8px',
      color: active ? (color || '#f59e0b') : '#7a96b4',
      fontFamily: 'monospace',
      fontSize: '11px',
      padding: '8px 13px',
      cursor: 'pointer',
      letterSpacing: '0.5px',
      minHeight: '36px',
      WebkitTapHighlightColor: 'transparent',
    }}>
      {children}
    </button>
  )
}

function RiskCalculator({ journal = [] }) {
  const t = useT()
  const [contract, setContract]       = useState('MYM')
  const [acc, setAcc]                 = useState('50000')
  const [pct, setPct]                 = useState('0.5')
  const [slPts, setSlPts]             = useState('')
  const [activeAccount, setActiveAccount] = useState(1)
  const [activeGroup, setActiveGroup] = useState('Equity')
  const [showPropFirm, setShowPropFirm] = useState(false)
  const [pdl,  setPdl]  = useState(() => localStorage.getItem('prop-pdl')  || '')
  const [tdd,  setTdd]  = useState(() => localStorage.getItem('prop-tdd')  || '')

  // Today's realised P&L from journal
  const today = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()
  const todayLoss = journal.filter(t => t.date===today && t.result!=='skip' && t.result!=='no-setup').reduce((s,t) => s + parseFloat(t.pnl||0), 0)

  const c = CONTRACTS[contract]
  const riskDollar          = parseFloat(acc) * parseFloat(pct) / 100 || 0
  const slValuePerContract  = parseFloat(slPts) * c.pointValue || 0
  const contracts           = slPts > 0 ? Math.floor(riskDollar / slValuePerContract) : 0
  const tp1 = contracts > 0 ? contracts * parseFloat(slPts) * 1 * c.pointValue : riskDollar
  const tp2 = contracts > 0 ? contracts * parseFloat(slPts) * 2 * c.pointValue : riskDollar * 2
  const tp3 = contracts > 0 ? contracts * parseFloat(slPts) * 3 * c.pointValue : riskDollar * 3

  function selectAccount(i) {
    setActiveAccount(i)
    const a = DEFAULT_ACCOUNTS[i]
    if (a.size) { setAcc(String(a.size)); setPct(String(a.risk)) }
  }

  const groupContracts = Object.entries(CONTRACTS).filter(([, v]) => v.group === activeGroup)

  return (
    <div style={{
      background: '#0c1422',
      border: '1px solid #162340',
      borderRadius: '14px',
      padding: '18px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a7898', letterSpacing: '2px' }}>{t.riskTitle}</div>

      {/* Account chips */}
      <div>
        <span style={label}>{t.riskAccount}</span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {DEFAULT_ACCOUNTS.map((a, i) => (
            <Chip key={i} active={activeAccount === i} onClick={() => selectAccount(i)}>
              {a.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Group chips */}
      <div>
        <span style={label}>{t.riskCategory}</span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {GROUPS.map(g => (
            <Chip
              key={g}
              active={activeGroup === g}
              color={groupColors[g]}
              onClick={() => {
                setActiveGroup(g)
                setContract(Object.entries(CONTRACTS).find(([, v]) => v.group === g)[0])
              }}
            >
              {g}
            </Chip>
          ))}
        </div>
      </div>

      {/* Contract select */}
      <div>
        <span style={label}>{t.riskContract}</span>
        <select
          value={contract}
          onChange={e => setContract(e.target.value)}
          style={{
            ...inp,
            border: `1px solid ${groupColors[activeGroup]}55`,
            fontFamily: 'monospace',
          }}
        >
          {groupContracts.map(([k, v]) => (
            <option key={k} value={k}>{v.name}</option>
          ))}
        </select>
      </div>

      {/* Account + Risk % inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[
          { lbl: t.riskAccLabel, val: acc, set: setAcc, ph: '50000' },
          { lbl: t.riskPct,      val: pct, set: setPct, ph: '0.5'   },
        ].map((f, i) => (
          <div key={i}>
            <span style={label}>{f.lbl}</span>
            <input
              type="number"
              inputMode="decimal"
              value={f.val}
              onChange={e => f.set(e.target.value)}
              placeholder={f.ph}
              style={inp}
            />
          </div>
        ))}
      </div>

      {/* Stop loss input */}
      <div>
        <span style={label}>STOP LOSS (POINTS)</span>
        <input
          type="number"
          inputMode="decimal"
          value={slPts}
          onChange={e => setSlPts(e.target.value)}
          placeholder="t.ex. 80"
          style={inp}
        />
      </div>

      {/* ── Results ── */}
      {riskDollar > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Risk $ + Contracts — big & clear */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#1a0a0e', border: '1px solid #7a1f2e', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#6a4050', letterSpacing: '1.5px', marginBottom: '6px' }}>RISK</div>
              <div style={{ fontFamily: 'monospace', fontSize: '26px', fontWeight: 700, color: '#ff4f6b', lineHeight: 1 }}>
                ${riskDollar.toFixed(0)}
              </div>
            </div>
            <div style={{ background: '#0a1020', border: '1px solid #1c2e4a', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a7898', letterSpacing: '1.5px', marginBottom: '6px' }}>{t.riskContract}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '26px', fontWeight: 700, color: slPts > 0 ? '#00e5b0' : '#3a5878', lineHeight: 1 }}>
                {slPts > 0 ? contracts : '—'}
              </div>
            </div>
          </div>

          {/* SL value per contract */}
          {slPts > 0 && contracts > 0 && (
            <>
              <div style={{ background: '#0a1020', border: '1px solid #1c2e4a', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#7a96b4', letterSpacing: '1px' }}>SL / kontrakt</span>
                <span style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: '#ff4f6b' }}>-${slValuePerContract.toFixed(2)}</span>
              </div>

              {/* TP 1R / 2R / 3R */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { lbl: '+1R', val: tp1 },
                  { lbl: '+2R', val: tp2 },
                  { lbl: '+3R', val: tp3 },
                ].map((tp, i) => (
                  <div key={i} style={{
                    background: '#003d30',
                    border: '1px solid #007d5e',
                    borderRadius: '12px',
                    padding: '14px 10px',
                    opacity: 0.6 + i * 0.2,
                  }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a8070', letterSpacing: '1.5px', marginBottom: '6px' }}>{tp.lbl}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '17px', fontWeight: 700, color: '#00e5b0' }}>+${tp.val.toFixed(0)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── PROP FIRM LIMITS ── */}
      <div style={{ borderTop:'1px solid #162340', paddingTop:'14px' }}>
        <button type="button" onClick={() => setShowPropFirm(v => !v)} style={{
          width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center',
          background:'none', border:'none', cursor:'pointer', padding:0,
        }}>
          <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#5a7898', letterSpacing:'2px' }}>PROP FIRM LIMITS</span>
          <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#6880a0', transition:'transform 0.2s', display:'inline-block', transform: showPropFirm ? 'rotate(180deg)' : 'none' }}>▼</span>
        </button>

        {showPropFirm && (() => {
          const pdlVal = parseFloat(pdl) || 0
          const tddVal = parseFloat(tdd) || 0
          const loss   = Math.min(todayLoss, 0)            // negative or 0
          const lossAbs = Math.abs(loss)
          const pdlPct  = pdlVal > 0 ? Math.min(lossAbs / pdlVal * 100, 100) : 0
          const tddPct  = tddVal > 0 ? Math.min(lossAbs / tddVal * 100, 100) : 0
          const pdlLeft = pdlVal > 0 ? pdlVal - lossAbs : null
          const tddLeft = tddVal > 0 ? tddVal - lossAbs : null
          const pdlWarn = pdlVal > 0 && lossAbs >= pdlVal * 0.7
          const tddWarn = tddVal > 0 && lossAbs >= tddVal * 0.7

          return (
            <div style={{ marginTop:'12px', display:'flex', flexDirection:'column', gap:'12px' }}>

              {/* Today auto-P&L */}
              <div style={{ background:'#0a1020', border:'1px solid #1c2e4a', borderRadius:'8px', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:'monospace', fontSize:'9px', color:'#7a96b4', letterSpacing:'1px' }}>IDAG P&L</span>
                <span style={{ fontFamily:'monospace', fontSize:'15px', fontWeight:700, color: todayLoss >= 0 ? '#00e5b0' : '#ff4f6b' }}>
                  {todayLoss >= 0 ? '+' : ''}${todayLoss.toFixed(0)}
                </span>
              </div>

              {/* PDL input + bar */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                  <span style={{ fontFamily:'monospace', fontSize:'9px', color: pdlWarn ? '#ff4f6b' : '#7a96b4', letterSpacing:'1px' }}>
                    {pdlWarn ? '⚠ ' : ''}DAILY LOSS LIMIT
                  </span>
                  {pdlLeft !== null && (
                    <span style={{ fontFamily:'monospace', fontSize:'10px', fontWeight:700, color: pdlWarn ? '#ff4f6b' : '#00e5b0' }}>
                      ${pdlLeft.toFixed(0)} kvar
                    </span>
                  )}
                </div>
                <input
                  type="number" inputMode="decimal" value={pdl} placeholder="t.ex. 1000"
                  onChange={e => { setPdl(e.target.value); localStorage.setItem('prop-pdl', e.target.value) }}
                  style={{ ...inp, marginBottom:'6px' }}
                />
                {pdlVal > 0 && (
                  <div style={{ height:'5px', background:'#0a1020', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pdlPct}%`, background: pdlWarn ? '#ff4f6b' : '#ffc030', borderRadius:'3px', transition:'width 0.4s ease' }} />
                  </div>
                )}
              </div>

              {/* TDD input + bar */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                  <span style={{ fontFamily:'monospace', fontSize:'9px', color: tddWarn ? '#ff4f6b' : '#7a96b4', letterSpacing:'1px' }}>
                    {tddWarn ? '⚠ ' : ''}TRAILING DRAWDOWN
                  </span>
                  {tddLeft !== null && (
                    <span style={{ fontFamily:'monospace', fontSize:'10px', fontWeight:700, color: tddWarn ? '#ff4f6b' : '#00e5b0' }}>
                      ${tddLeft.toFixed(0)} kvar
                    </span>
                  )}
                </div>
                <input
                  type="number" inputMode="decimal" value={tdd} placeholder="t.ex. 2000"
                  onChange={e => { setTdd(e.target.value); localStorage.setItem('prop-tdd', e.target.value) }}
                  style={{ ...inp, marginBottom:'6px' }}
                />
                {tddVal > 0 && (
                  <div style={{ height:'5px', background:'#0a1020', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${tddPct}%`, background: tddWarn ? '#ff4f6b' : '#ffc030', borderRadius:'3px', transition:'width 0.4s ease' }} />
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export default RiskCalculator