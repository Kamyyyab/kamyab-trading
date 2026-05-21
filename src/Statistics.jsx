import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from 'recharts'

function Statistics({ journal }) {
  const [filter, setFilter] = useState('Totalt')

  function filterTrades(trades) {
    const now = new Date()
    if (filter === 'Denna vecka') {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      weekStart.setHours(0, 0, 0, 0)
      return trades.filter(t => new Date(t.date) >= weekStart)
    }
    if (filter === 'Denna månad') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return trades.filter(t => new Date(t.date) >= monthStart)
    }
    return trades
  }

  const allFiltered = filterTrades(journal)
  const trades = allFiltered.filter(t => t.result !== 'skip' && t.result !== 'no-setup')
  const wins = trades.filter(t => t.result === 'win' || t.result === 'win2').length
  const losses = trades.filter(t => t.result === 'loss').length
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : 0
  const totalPnl = trades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0)
  const winningTrades = trades.filter(t => t.result === 'win' || t.result === 'win2')
  const avgRR = winningTrades.length > 0
    ? (winningTrades.reduce((sum, t) => {
        if (t.result === 'win') return sum + 3
        if (t.result === 'win2') return sum + 2
        return sum
      }, 0) / winningTrades.length).toFixed(2)
    : '0.00'

  const bestTrade = trades.filter(t => t.pnl).sort((a, b) => parseFloat(b.pnl) - parseFloat(a.pnl))[0]
  const worstTrade = trades.filter(t => t.pnl).sort((a, b) => parseFloat(a.pnl) - parseFloat(b.pnl))[0]

  let cumulative = 0
  const equityData = [...trades].reverse().map(t => {
    cumulative += parseFloat(t.pnl || 0)
    return { date: t.date.slice(5), pnl: Math.round(cumulative) }
  })
  const isPositive = equityData.length > 0 && equityData[equityData.length - 1].pnl >= 0

  // Drawdown
  let peak = 0, maxDrawdown = 0
  equityData.forEach(p => {
    if (p.pnl > peak) peak = p.pnl
    const dd = peak - p.pnl
    if (dd > maxDrawdown) maxDrawdown = dd
  })

  // Win rate per day
  const days = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag']
  const dayStats = days.map((day, i) => {
    const dayTrades = trades.filter(t => new Date(t.date).getDay() === (i + 1))
    const dayWins = dayTrades.filter(t => t.result === 'win' || t.result === 'win2').length
    const wr = dayTrades.length > 0 ? Math.round(dayWins / dayTrades.length * 100) : 0
    return { day, winRate: wr, total: dayTrades.length }
  })

  // R-multipel breakdown
  const rData = [
    { label: '+3R', count: trades.filter(t => t.result === 'win').length, color: '#00e5b0' },
    { label: '+2R', count: trades.filter(t => t.result === 'win2').length, color: '#4ab89a' },
    { label: 'BE', count: trades.filter(t => t.result === 'be').length, color: '#8aacb0' },
    { label: '-1R', count: trades.filter(t => t.result === 'loss').length, color: '#ff4f6b' },
  ]
  const totalR = trades.reduce((sum, t) => {
    if (t.result === 'win') return sum + 3
    if (t.result === 'win2') return sum + 2
    if (t.result === 'loss') return sum - 1
    return sum
  }, 0)
  const avgRPerTrade = trades.length > 0 ? (totalR / trades.length).toFixed(2) : '0.00'

  // P&L per setup tag
  const setupStats = {}
  trades.forEach(t => {
    const tag = t.setup || 'Otaggad'
    if (!setupStats[tag]) setupStats[tag] = { pnl: 0, wins: 0, losses: 0, total: 0 }
    setupStats[tag].pnl += parseFloat(t.pnl || 0)
    setupStats[tag].total++
    if (t.result === 'win' || t.result === 'win2') setupStats[tag].wins++
    if (t.result === 'loss') setupStats[tag].losses++
  })
  const setupList = Object.entries(setupStats).sort(([,a],[,b]) => b.pnl - a.pnl)

  const statCard = (label, value, color, sub) => (
    <div style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '11px', padding: '16px' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontFamily: 'monospace', fontSize: '26px', fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4a6870', marginTop: '4px' }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['Totalt', 'Denna månad', 'Denna vecka'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontFamily: 'monospace', fontSize: '10px', padding: '7px 14px', borderRadius: '7px', border: `1px solid ${filter === f ? '#007d5e' : '#1e2d31'}`, background: filter === f ? '#004038' : 'transparent', color: filter === f ? '#00e5b0' : '#4a6870', cursor: 'pointer', letterSpacing: '1px' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Main stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {statCard('WIN RATE', `${winRate}%`, '#00e5b0', `${trades.length} trades`)}
        {statCard('WINS', wins, '#00e5b0')}
        {statCard('LOSSES', losses, '#ff4f6b')}
        {statCard('TOTAL P&L', `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`, totalPnl >= 0 ? '#00e5b0' : '#ff4f6b')}
        {statCard('AVG RR', avgRR, '#00e5b0', 'på vinster')}
        {statCard('MAX DRAWDOWN', `-$${maxDrawdown.toFixed(0)}`, '#ff4f6b')}
      </div>

      {/* R-multipel breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '11px', padding: '16px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px', marginBottom: '16px' }}>R-MULTIPEL BREAKDOWN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rData.map((r, i) => {
              const pct = trades.length > 0 ? (r.count / trades.length * 100) : 0
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: r.color, width: '28px' }}>{r.label}</div>
                  <div style={{ flex: 1, height: '8px', background: '#1a2225', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: r.color, borderRadius: '4px', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8aacb0', width: '24px', textAlign: 'right' }}>{r.count}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', width: '36px', textAlign: 'right' }}>{pct.toFixed(0)}%</div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '11px', padding: '16px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px', marginBottom: '8px' }}>TOTAL R EARNED</div>
          <div style={{ fontFamily: 'monospace', fontSize: '36px', fontWeight: 700, color: totalR >= 0 ? '#00e5b0' : '#ff4f6b', lineHeight: 1, marginBottom: '8px' }}>
            {totalR >= 0 ? '+' : ''}{totalR}R
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', marginBottom: '16px' }}>
            Snitt {avgRPerTrade}R per trade
          </div>
          {/* Expected value bar */}
          <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '1px', marginBottom: '6px' }}>EXPECTED VALUE</div>
          <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: parseFloat(avgRPerTrade) >= 0 ? '#00e5b0' : '#ff4f6b' }}>
            {parseFloat(avgRPerTrade) >= 0 ? '+' : ''}{avgRPerTrade}R / trade
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', marginTop: '4px' }}>
            {parseFloat(avgRPerTrade) >= 0.5 ? '✓ Positiv edge' : parseFloat(avgRPerTrade) >= 0 ? '⚠ Svag edge' : '✗ Negativ edge'}
          </div>
        </div>
      </div>

      {/* Best / Worst */}
      {bestTrade && worstTrade && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: '#161c1e', border: '1px solid #004038', borderRadius: '11px', padding: '16px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px', marginBottom: '8px' }}>BÄSTA TRADE</div>
            <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: '#00e5b0' }}>+${parseFloat(bestTrade.pnl).toFixed(0)}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4a6870', marginTop: '4px' }}>{bestTrade.date} · {bestTrade.instrument}</div>
          </div>
          <div style={{ background: '#161c1e', border: '1px solid #7a0f28', borderRadius: '11px', padding: '16px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px', marginBottom: '8px' }}>SÄMSTA TRADE</div>
            <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: '#ff4f6b' }}>${parseFloat(worstTrade.pnl).toFixed(0)}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4a6870', marginTop: '4px' }}>{worstTrade.date} · {worstTrade.instrument}</div>
          </div>
        </div>
      )}

      {/* Equity curve */}
      <div style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '11px', padding: '16px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px', marginBottom: '16px' }}>EQUITY CURVE — P&L ($)</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={equityData}>
            <XAxis dataKey="date" stroke="#1e2d31" tick={{ fill: '#4a6870', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis stroke="#1e2d31" tick={{ fill: '#4a6870', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#161c1e', border: '1px solid #26383d', color: '#e2eeee', fontFamily: 'monospace', fontSize: '12px' }} formatter={val => [`$${val}`, 'P&L']} />
            <ReferenceLine y={0} stroke="#26383d" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="pnl" stroke={isPositive ? '#00e5b0' : '#ff4f6b'} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* P&L per setup */}
      {setupList.length > 0 && (
        <div style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '11px', padding: '16px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px', marginBottom: '16px' }}>P&L PER SETUP</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {setupList.map(([tag, s], i) => {
              const wr = s.total > 0 ? Math.round(s.wins / s.total * 100) : 0
              const maxPnl = Math.max(...setupList.map(([,x]) => Math.abs(x.pnl)), 1)
              const barWidth = Math.abs(s.pnl) / maxPnl * 100
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 70px 50px 50px', gap: '12px', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#e2eeee', fontWeight: 600 }}>{tag}</div>
                  <div style={{ height: '8px', background: '#1a2225', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${barWidth}%`, background: s.pnl >= 0 ? '#007d5e' : '#7a1f2e', borderRadius: '4px' }} />
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: s.pnl >= 0 ? '#00e5b0' : '#ff4f6b', textAlign: 'right' }}>
                    {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(0)}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: wr >= 50 ? '#00e5b0' : '#ff4f6b', textAlign: 'right' }}>{wr}%</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', textAlign: 'right' }}>{s.total}t</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Win rate per day */}
      <div style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '11px', padding: '16px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px', marginBottom: '16px' }}>WIN RATE PER VECKODAG</div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '120px' }}>
          {dayStats.map((d, i) => {
            const color = d.total === 0 ? '#1c2426' : d.winRate >= 50 ? '#007d5e' : '#7a0f28'
            const textColor = d.total === 0 ? '#1c2426' : d.winRate >= 50 ? '#00e5b0' : '#ff4f6b'
            const height = d.total === 0 ? '8px' : `${Math.max(d.winRate, 8)}%`
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: textColor }}>{d.total === 0 ? '—' : `${d.winRate}%`}</div>
                <div style={{ width: '100%', height, background: color, borderRadius: '4px 4px 0 0' }} />
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870' }}>{d.day.slice(0, 3)}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#26383d' }}>{d.total}t</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Statistics
