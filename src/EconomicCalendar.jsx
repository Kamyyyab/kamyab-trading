import { useState, useEffect } from 'react'

const API_KEY = 'd86pfmhr01qurhv774f0d86pfmhr01qurhv774fg'

function EconomicCalendar() {
  const [events, setEvents] = useState([])
  const [earnings, setEarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const today = new Date()
      const from = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
      const toDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7); const to = `${toDate.getFullYear()}-${String(toDate.getMonth()+1).padStart(2,'0')}-${String(toDate.getDate()).padStart(2,'0')}`
      const PROXY = 'https://corsproxy.io/?'

      const [econRes, earnRes] = await Promise.all([
        fetch(`${PROXY}${encodeURIComponent(`https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${API_KEY}`)}`),
        fetch(`${PROXY}${encodeURIComponent(`https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${API_KEY}`)}`)
      ])

      const econData = await econRes.json()
      const earnData = await earnRes.json()

      const filtered = (econData.economicCalendar || [])
        .filter(e => e.impact === 'high' && e.country === 'US')
        .sort((a, b) => new Date(a.time) - new Date(b.time))

      const majorTickers = new Set([
        'AAPL','MSFT','NVDA','GOOGL','GOOG','AMZN','META','TSLA','BRK.B','JPM',
        'V','UNH','XOM','JNJ','WMT','MA','PG','CVX','HD','MRK','ABBV','LLY',
        'PEP','KO','AVGO','COST','TMO','MCD','ACN','BAC','ABT','NFLX','QCOM',
        'TXN','NEE','AMD','PM','ORCL','DHR','INTC','IBM','GS','MS','BLK','RTX',
        'CAT','DE','BA','GE','F','GM','DIS','CMCSA','T','VZ','PFE','AMGN',
        'GILD','SBUX','NKE','LOW','INTU','ADBE','CRM','NOW','SNOW','UBER','LYFT',
        'ABNB','COIN','SQ','PYPL','SHOP','SPOT','TWLO','ZM','ROKU','RBLX',
        'PLTR','AFRM','SOFI','HOOD','WFC','C','USB','AXP','COF'
      ])

      const majorEarnings = (earnData.earningsCalendar || [])
        .filter(e => e.symbol && majorTickers.has(e.symbol))
        .sort((a, b) => a.date.localeCompare(b.date))

      setEvents(filtered)
      setEarnings(majorEarnings)
    } catch (e) {
      setError('Kunde inte ladda data')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
  }

  function formatTime(timeStr) {
    if (!timeStr) return '—'
    try {
      const date = new Date(timeStr.replace(' ', 'T') + 'Z')
      if (isNaN(date.getTime())) return '—'
      return date.toLocaleTimeString('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit' })
    } catch { return '—' }
  }

  function groupByDate(items, dateKey) {
    const groups = {}
    items.forEach(item => {
      const d = item[dateKey]
      if (!groups[d]) groups[d] = []
      groups[d].push(item)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }

  const eventsWithDate = events.map(e => ({ ...e, dateOnly: e.time?.split(' ')[0] || '' }))
  const econGroups = groupByDate(eventsWithDate, 'dateOnly')
  const earnGroups = groupByDate(earnings, 'date')

  return (
    <div style={{ background: '#161c1e', border: '1px solid #1e2d31', borderRadius: '12px', padding: '16px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px' }}>MARKET EVENTS</div>
        <button onClick={fetchData} style={{ background: 'none', border: '1px solid #1e2d31', borderRadius: '6px', color: '#4a6870', fontFamily: 'monospace', fontSize: '9px', padding: '4px 8px', cursor: 'pointer' }}>↻</button>
      </div>

      {loading && (
        <div style={{ color: '#4a6870', fontFamily: 'monospace', fontSize: '11px', padding: '20px 0', textAlign: 'center' }}>Laddar...</div>
      )}

      {error && (
        <div style={{ color: '#ff4f6b', fontFamily: 'monospace', fontSize: '11px', padding: '12px 0' }}>{error}</div>
      )}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

          {/* Economic events */}
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '10px' }}>ECONOMIC — HIGH IMPACT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
              {econGroups.length === 0 && (
                <div style={{ color: '#4a6870', fontFamily: 'monospace', fontSize: '11px', padding: '12px 0' }}>Inga events kommande 7 dagar</div>
              )}
              {econGroups.map(([date, items]) => (
                <div key={date}>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #1a2225' }}>
                    {formatDate(date)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {items.map((e, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: '8px', alignItems: 'center', background: '#0f1618', border: '1px solid #7a1f2e', borderRadius: '6px', padding: '7px 10px' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4a6870' }}>{formatTime(e.time)}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#c8dde0' }}>{e.event}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#ff4f6b', background: '#3d0f1a', border: '1px solid #7a1f2e', borderRadius: '4px', padding: '2px 6px', whiteSpace: 'nowrap' }}>HÖG</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Earnings */}
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#4a6870', letterSpacing: '2px', marginBottom: '10px' }}>EARNINGS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
              {earnGroups.length === 0 && (
                <div style={{ color: '#4a6870', fontFamily: 'monospace', fontSize: '11px', padding: '12px 0' }}>Inga earnings kommande 7 dagar</div>
              )}
              {earnGroups.map(([date, items]) => (
                <div key={date}>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870', letterSpacing: '2px', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #1a2225' }}>
                    {formatDate(date)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {items.map((e, i) => {
                      const timing = e.hour === 'bmo' ? 'PRE' : e.hour === 'amc' ? 'POST' : null
                      const timingColor = e.hour === 'bmo' ? '#ffc030' : '#8aacb0'
                      return (
                        <div key={i} style={{ background: '#0f1618', border: '1px solid #1a2225', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                          onMouseEnter={ev => ev.currentTarget.style.borderColor = '#26383d'}
                          onMouseLeave={ev => ev.currentTarget.style.borderColor = '#1a2225'}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img
                              src={`https://assets.parqet.com/logos/symbol/${e.symbol}?format=svg`}
                              alt={e.symbol}
                              style={{ width: '24px', height: '24px', borderRadius: '5px', background: '#1a2225', objectFit: 'contain', flexShrink: 0 }}
                              onError={ev => { ev.target.style.display = 'none'; ev.target.nextSibling.style.display = 'flex' }}
                            />
                            <div style={{ width: '24px', height: '24px', borderRadius: '5px', background: '#1a2225', display: 'none', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '7px', color: '#4a6870', fontWeight: 700 }}>{e.symbol?.slice(0,2)}</span>
                            </div>
                            <div>
                              <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#00e5b0' }}>{e.symbol}</div>
                              {e.epsEstimate != null && (
                                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4a6870' }}>EPS est. ${parseFloat(e.epsEstimate).toFixed(2)}</div>
                              )}
                            </div>
                          </div>
                          {timing && (
                            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: timingColor, background: '#1a2225', border: `1px solid ${timingColor}44`, borderRadius: '4px', padding: '3px 7px', letterSpacing: '1px', flexShrink: 0 }}>
                              {timing}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default EconomicCalendar