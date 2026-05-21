import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

function EquityCurve({ journal }) {
  const { chartData, totalPnl, bestDay, worstDay, winStreak } = useMemo(() => {
    if (!journal.length) return { chartData: [], totalPnl: 0, bestDay: 0, worstDay: 0, winStreak: 0 }

    // Group by date, sum P&L
    const byDate = {}
    journal.forEach(t => {
      const pnl = parseFloat(t.pnl || 0)
      byDate[t.date] = (byDate[t.date] || 0) + pnl
    })

    const sorted = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b))

    let cumulative = 0
    const chartData = sorted.map(([date, pnl]) => {
      cumulative += pnl
      return {
        date,
        pnl: parseFloat(pnl.toFixed(0)),
        equity: parseFloat(cumulative.toFixed(0)),
        label: new Date(date + 'T12:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }),
      }
    })

    const pnls = sorted.map(([, p]) => p)
    const bestDay = Math.max(...pnls)
    const worstDay = Math.min(...pnls)
    const totalPnl = cumulative

    // Current win streak (consecutive positive days)
    let winStreak = 0
    for (const [, pnl] of [...sorted].reverse()) {
      if (pnl > 0) winStreak++
      else break
    }

    return { chartData, totalPnl, bestDay, worstDay, winStreak }
  }, [journal])

  const isPositive = totalPnl >= 0
  const color = isPositive ? '#00e5b0' : '#ff4f6b'

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{ background: '#1c2426', border: '1px solid #26383d', borderRadius: '8px', padding: '10px 14px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', marginBottom: '4px' }}>{d.date}</div>
        <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: d.pnl >= 0 ? '#00e5b0' : '#ff4f6b' }}>
          {d.pnl >= 0 ? '+' : ''}${d.pnl}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8aacb0', marginTop: '2px' }}>
          Totalt: ${d.equity}
        </div>
      </div>
    )
  }

  if (!chartData.length) return null

  return (
    <div style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '12px', padding: '16px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px' }}>EQUITY CURVE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color, lineHeight: 1 }}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870' }}>totalt</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[
            { label: 'BÄSTA DAG', value: `+$${bestDay.toFixed(0)}`, color: '#00e5b0' },
            { label: 'SÄMSTA DAG', value: `-$${Math.abs(worstDay).toFixed(0)}`, color: '#ff4f6b' },
            { label: 'WIN STREAK', value: `${winStreak}d`, color: '#00e5b0' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '7px', color: '#4a6870', letterSpacing: '1.5px', marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontFamily: 'monospace', fontSize: 8, fill: '#2e4448' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis hide domain={['auto', 'auto']} />
          <ReferenceLine y={0} stroke="#1e2d31" strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#26383d', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={color}
            strokeWidth={2}
            fill="url(#equityGrad)"
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: '#0a0c0d', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default EquityCurve
