import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const M = "'JetBrains Mono', monospace"

export default function EquityCurve({ journal = [] }) {
  const { chartData, totalPnl, bestDay, worstDay, winStreak } = useMemo(() => {
    if (!journal.length) return { chartData:[], totalPnl:0, bestDay:0, worstDay:0, winStreak:0 }
    const byDate = {}
    journal.forEach(t => {
      if (t.result==='skip'||t.result==='no-setup') return
      byDate[t.date] = (byDate[t.date]||0) + parseFloat(t.pnl||0)
    })
    const sorted = Object.entries(byDate).sort(([a],[b])=>a.localeCompare(b))
    let cum = 0
    const chartData = sorted.map(([date,pnl])=>{
      cum += pnl
      return { date, pnl:Math.round(pnl), equity:Math.round(cum), label:new Date(date+'T12:00:00').toLocaleDateString('sv-SE',{day:'numeric',month:'short'}) }
    })
    const pnls = sorted.map(([,p])=>p)
    let winStreak = 0
    for (const [,p] of [...sorted].reverse()) { if(p>0) winStreak++; else break }
    return { chartData, totalPnl:cum, bestDay:Math.max(...pnls), worstDay:Math.min(...pnls), winStreak }
  }, [journal])

  const pos   = totalPnl >= 0
  const color = pos ? '#00e5b0' : '#ff4f6b'

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{ background:'#0f1828', border:'1px solid #1c2e4a', borderRadius:'8px', padding:'10px 14px' }}>
        <div style={{ fontFamily:M, fontSize:'8px', color:'#7a96b4', marginBottom:'4px', letterSpacing:'1px' }}>{d.date}</div>
        <div style={{ fontFamily:M, fontSize:'14px', fontWeight:700, color:d.pnl>=0?'#00e5b0':'#ff4f6b' }}>{d.pnl>=0?'+':''}${d.pnl}</div>
        <div style={{ fontFamily:M, fontSize:'10px', color:'#7a96b4', marginTop:'2px' }}>Totalt: ${d.equity}</div>
      </div>
    )
  }

  if (!chartData.length) return null

  return (
    <div style={{ background:'#0f1828', border:`1px solid ${pos?'rgba(0,229,176,0.12)':'rgba(255,79,107,0.12)'}`, borderRadius:'14px', padding:'20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px' }}>
        <div>
          <div style={{ fontFamily:M, fontSize:'8px', color:'#7a96b4', letterSpacing:'2px', marginBottom:'6px' }}>EQUITY CURVE</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:'6px' }}>
            <span style={{ fontFamily:M, fontSize:'36px', fontWeight:700, color, lineHeight:1 }}>{totalPnl>=0?'+':''}${Math.round(totalPnl)}</span>
            <span style={{ fontSize:'12px', color:'#7a96b4' }}>totalt</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:'20px' }}>
          {[
            { label:'BÄSTA DAG',  value:`+$${Math.round(bestDay)}`,           color:'#00e5b0' },
            { label:'SÄMSTA DAG', value:`-$${Math.abs(Math.round(worstDay))}`, color:'#ff4f6b' },
            { label:'WIN STREAK', value:`${winStreak}d`,                       color:'#00e5b0' },
          ].map((s,i)=>(
            <div key={i} style={{ textAlign:'right' }}>
              <div style={{ fontFamily:M, fontSize:'7px', color:'#7a96b4', letterSpacing:'1.5px', marginBottom:'3px' }}>{s.label}</div>
              <div style={{ fontFamily:M, fontSize:'15px', fontWeight:700, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={{ top:4, right:0, left:0, bottom:0 }}>
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.12} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontFamily:M, fontSize:8, fill:'#7a96b4' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis hide domain={['auto','auto']} />
          <ReferenceLine y={0} stroke="#162340" strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke:'#1c2e4a', strokeWidth:1 }} />
          <Area type="monotone" dataKey="equity" stroke={color} strokeWidth={2} fill="url(#eqGrad)" dot={false} activeDot={{ r:4, fill:color, stroke:'#070a14', strokeWidth:2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}