import { useState } from 'react'

const CONTRACTS = {
  // Equity Futures
  YM:   { name: 'YM — Dow Futures',       pointValue: 5,       group: 'Equity' },
  MYM:  { name: 'MYM — Micro Dow',         pointValue: 0.5,     group: 'Equity' },
  NQ:   { name: 'NQ — Nasdaq Futures',     pointValue: 20,      group: 'Equity' },
  MNQ:  { name: 'MNQ — Micro Nasdaq',      pointValue: 2,       group: 'Equity' },
  ES:   { name: 'ES — S&P 500',            pointValue: 50,      group: 'Equity' },
  MES:  { name: 'MES — Micro S&P',         pointValue: 5,       group: 'Equity' },
  RTY:  { name: 'RTY — Russell 2000',      pointValue: 50,      group: 'Equity' },
  M2K:  { name: 'M2K — Micro Russell',     pointValue: 5,       group: 'Equity' },
  // Metals
  GC:   { name: 'GC — Gold Futures',       pointValue: 100,     group: 'Metals' },
  MGC:  { name: 'MGC — Micro Gold',        pointValue: 10,      group: 'Metals' },
  SI:   { name: 'SI — Silver Futures',     pointValue: 5000,    group: 'Metals' },
  SIL:  { name: 'SIL — Micro Silver',      pointValue: 1000,    group: 'Metals' },
  HG:   { name: 'HG — Copper Futures',     pointValue: 25000,   group: 'Metals' },
  PL:   { name: 'PL — Platinum',           pointValue: 50,      group: 'Metals' },
  // Energy
  CL:   { name: 'CL — Crude Oil',          pointValue: 1000,    group: 'Energy' },
  MCL:  { name: 'MCL — Micro Crude Oil',   pointValue: 100,     group: 'Energy' },
  NG:   { name: 'NG — Natural Gas',        pointValue: 10000,   group: 'Energy' },
  RB:   { name: 'RB — RBOB Gasoline',      pointValue: 42000,   group: 'Energy' },
  // Crypto
  BTC:  { name: 'BTC — Bitcoin Futures',   pointValue: 5,       group: 'Crypto' },
  MBT:  { name: 'MBT — Micro Bitcoin',     pointValue: 0.1,     group: 'Crypto' },
  ETH:  { name: 'ETH — Ether Futures',     pointValue: 50,      group: 'Crypto' },
  MET:  { name: 'MET — Micro Ether',       pointValue: 0.1,     group: 'Crypto' },
  // Bonds
  ZN:   { name: 'ZN — 10-Year T-Note',     pointValue: 1000,    group: 'Bonds' },
  ZB:   { name: 'ZB — 30-Year T-Bond',     pointValue: 1000,    group: 'Bonds' },
  ZF:   { name: 'ZF — 5-Year T-Note',      pointValue: 1000,    group: 'Bonds' },
  // FX
  '6E':  { name: '6E — Euro FX',           pointValue: 125000,  group: 'FX' },
  '6J':  { name: '6J — Japanese Yen',      pointValue: 12500000,group: 'FX' },
  '6B':  { name: '6B — British Pound',     pointValue: 62500,   group: 'FX' },
}

const DEFAULT_ACCOUNTS = [
  { label: '25K', size: 25000, risk: 0.5 },
  { label: '50K', size: 50000, risk: 0.5 },
  { label: '100K', size: 100000, risk: 0.5 },
  { label: '150K', size: 150000, risk: 0.5 },
  { label: 'Custom', size: null, risk: null },
]

const GROUPS = ['Equity', 'Metals', 'Energy', 'Crypto', 'Bonds', 'FX']
const groupColors = { Equity: '#00e5b0', Metals: '#ffc030', Energy: '#ff8c42', Crypto: '#a78bfa', Bonds: '#60a5fa', FX: '#f472b6' }

function RiskCalculator() {
  const [contract, setContract] = useState('MYM')
  const [acc, setAcc] = useState('50000')
  const [pct, setPct] = useState('0.5')
  const [slPts, setSlPts] = useState('')
  const [activeAccount, setActiveAccount] = useState(0)
  const [activeGroup, setActiveGroup] = useState('Equity')

  const c = CONTRACTS[contract]
  const riskDollar = parseFloat(acc) * parseFloat(pct) / 100 || 0
  const slValuePerContract = parseFloat(slPts) * c.pointValue || 0
  const contracts = slPts > 0 ? Math.floor(riskDollar / slValuePerContract) : 0
  const tp1 = contracts > 0 ? contracts * parseFloat(slPts) * 1 * c.pointValue : riskDollar
  const tp2 = contracts > 0 ? contracts * parseFloat(slPts) * 2 * c.pointValue : riskDollar * 2
  const tp3 = contracts > 0 ? contracts * parseFloat(slPts) * 3 * c.pointValue : riskDollar * 3

  function selectAccount(i) {
    setActiveAccount(i)
    const a = DEFAULT_ACCOUNTS[i]
    if (a.size) { setAcc(String(a.size)); setPct(String(a.risk)) }
  }

  const groupContracts = Object.entries(CONTRACTS).filter(([,v]) => v.group === activeGroup)

  return (
    <div style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px' }}>RISK CALCULATOR</div>

      {/* Saved accounts */}
      <div>
        <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '6px' }}>KONTO</div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {DEFAULT_ACCOUNTS.map((a, i) => (
            <button key={i} onClick={() => selectAccount(i)}
              style={{ background: activeAccount === i ? '#1c2426' : '#0f1618', border: `1px solid ${activeAccount === i ? '#007d5e' : '#1e2d31'}`, borderRadius: '6px', color: activeAccount === i ? '#00e5b0' : '#4a6870', fontFamily: 'monospace', fontSize: '9px', padding: '5px 10px', cursor: 'pointer', letterSpacing: '1px' }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contract group selector */}
      <div>
        <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '6px' }}>KATEGORI</div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {GROUPS.map(g => (
            <button key={g} onClick={() => { setActiveGroup(g); setContract(Object.entries(CONTRACTS).find(([,v]) => v.group === g)[0]) }}
              style={{ background: activeGroup === g ? '#1c2426' : '#0f1618', border: `1px solid ${activeGroup === g ? groupColors[g] + '88' : '#1e2d31'}`, borderRadius: '6px', color: activeGroup === g ? groupColors[g] : '#4a6870', fontFamily: 'monospace', fontSize: '9px', padding: '5px 10px', cursor: 'pointer', letterSpacing: '1px' }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Contract selector */}
      <div>
        <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '6px' }}>KONTRAKT</div>
        <select value={contract} onChange={e => setContract(e.target.value)}
          style={{ width: '100%', background: '#1c2426', border: `1px solid ${groupColors[activeGroup]}44`, borderRadius: '8px', color: '#e2eeee', fontFamily: 'monospace', fontSize: '11px', padding: '9px 12px', outline: 'none' }}>
          {groupContracts.map(([k, v]) => (
            <option key={k} value={k}>{v.name}</option>
          ))}
        </select>
      </div>

      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          { label: 'ACCOUNT ($)', value: acc, setter: setAcc, placeholder: '50000' },
          { label: 'RISK %', value: pct, setter: setPct, placeholder: '0.5' },
        ].map((f, i) => (
          <div key={i}>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '5px' }}>{f.label}</div>
            <input type="number" value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
              style={{ width: '100%', background: '#1c2426', border: '1px solid #26383d', borderRadius: '8px', color: '#e2eeee', fontSize: '13px', padding: '8px 10px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '5px' }}>STOP LOSS (POINTS)</div>
        <input type="number" value={slPts} onChange={e => setSlPts(e.target.value)} placeholder="e.g. 80"
          style={{ width: '100%', background: '#1c2426', border: '1px solid #26383d', borderRadius: '8px', color: '#e2eeee', fontSize: '13px', padding: '8px 10px', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* Results */}
      {riskDollar > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Risk + Contracts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: '#1a0a0e', border: '1px solid #7a1f2e', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '1.5px', marginBottom: '5px' }}>RISK</div>
              <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: '#ff4f6b' }}>${riskDollar.toFixed(0)}</div>
            </div>
            <div style={{ background: '#1c2426', border: '1px solid #26383d', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '1.5px', marginBottom: '5px' }}>KONTRAKT</div>
              <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: slPts > 0 ? '#00e5b0' : '#2e4448' }}>
                {slPts > 0 ? contracts : '—'}
              </div>
            </div>
          </div>

          {/* TP levels */}
          {slPts > 0 && contracts > 0 && (
            <>
              <div style={{ background: '#1c2426', border: '1px solid #26383d', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '1.5px', marginBottom: '4px' }}>SL VALUE / KONTRAKT</div>
                <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: '#ff4f6b' }}>-${slValuePerContract.toFixed(2)}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { label: '+1R', value: tp1, opacity: 0.6 },
                  { label: '+2R', value: tp2, opacity: 0.8 },
                  { label: '+3R', value: tp3, opacity: 1 },
                ].map((tp, i) => (
                  <div key={i} style={{ background: '#003d30', border: '1px solid #007d5e', borderRadius: '8px', padding: '10px 10px', opacity: tp.opacity }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '1.5px', marginBottom: '4px' }}>{tp.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#00e5b0' }}>+${tp.value.toFixed(0)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default RiskCalculator