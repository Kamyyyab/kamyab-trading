import { useState, useEffect } from 'react'

const API_KEY = 'd86pfmhr01qurhv774f0d86pfmhr01qurhv774fg'

const MOBILE = window.innerWidth < 768

function EconomicCalendar() {
  const [events, setEvents]     = useState([])
  const [earnings, setEarnings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [tab, setTab]           = useState('econ') // 'econ' | 'earnings'

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const today  = new Date()
      const pad    = n => String(n).padStart(2, '0')
      const from   = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`
      const toDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
      const to     = `${toDate.getFullYear()}-${pad(toDate.getMonth()+1)}-${pad(toDate.getDate())}`
      const PROXY = 'https://corsproxy.io/?'      
      const [econRes, earnRes] = await Promise.all([
        fetch(`${PROXY}${encodeURIComponent(`https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${API_KEY}`)}`),
        fetch(`${PROXY}${encodeURIComponent(`https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${API_KEY}`)}`),
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
        'PLTR','AFRM','SOFI','HOOD','WFC','C','USB','AXP','COF',
      ])

      const majorEarnings = (earnData.earningsCalendar || [])
        .filter(e => e.symbol && majorTickers.has(e.symbol))
        .sort((a, b) => a.date.localeCompare(b.date))

      setEvents(filtered)
      setEarnings(majorEarnings)
    } catch {
      setError('Kunde inte ladda data')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr + 'T12:00:00')
      .toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })
      .toUpperCase()
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
  const econGroups     = groupByDate(eventsWithDate, 'dateOnly')
  const earnGroups     = groupByDate(earnings, 'date')

  // ── Shared sub-components ──────────────────────────────────────────────────

  function DateRow({ label }) {
    return (
      <div style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#88a8ae',
        letterSpacing: '2px',
        padding: '10px 0 6px',
        borderBottom: '1px solid #1a2225',
        marginBottom: '8px',
      }}>
        {label}
      </div>
    )
  }

  function EconEvent({ e }) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#0f1618',
        border: '1px solid #7a1f2e',
        borderRadius: '10px',
        padding: '12px 14px',
        marginBottom: '6px',
      }}>
        {/* time */}
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#88a8ae', minWidth: '36px', flexShrink: 0 }}>
          {formatTime(e.time)}
        </div>
        {/* event name */}
        <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#d8eaed', flex: 1, lineHeight: 1.3 }}>
          {e.event}
        </div>
        {/* badge */}
        <div style={{
          fontFamily: 'monospace', fontSize: '9px', color: '#ff4f6b',
          background: '#3d0f1a', border: '1px solid #7a1f2e',
          borderRadius: '5px', padding: '3px 7px', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          HÖG
        </div>
      </div>
    )
  }

  function EarningRow({ e }) {
    const timing      = e.hour === 'bmo' ? 'PRE' : e.hour === 'amc' ? 'POST' : null
    const timingColor = e.hour === 'bmo' ? '#ffc030' : '#8aacb0'
    return (
      <div style={{
        background: '#0f1618',
        border: '1px solid #1a2225',
        borderRadius: '10px',
        padding: '13px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        marginBottom: '6px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={`https://assets.parqet.com/logos/symbol/${e.symbol}?format=svg`}
            alt={e.symbol}
            style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#1a2225', objectFit: 'contain', flexShrink: 0 }}
            onError={ev => { ev.target.style.display = 'none'; ev.target.nextSibling.style.display = 'flex' }}
          />
          <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#1a2225', display: 'none', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'monospace', fontSize: '8px', color: '#7090a0', fontWeight: 700 }}>{e.symbol?.slice(0, 2)}</span>
          </div>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#00e5b0' }}>{e.symbol}</div>
            {e.epsEstimate != null && (
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#88a8ae', marginTop: '1px' }}>
                EPS est. ${parseFloat(e.epsEstimate).toFixed(2)}
              </div>
            )}
          </div>
        </div>
        {timing && (
          <div style={{
            fontFamily: 'monospace', fontSize: '9px', color: timingColor,
            background: '#1a2225', border: `1px solid ${timingColor}44`,
            borderRadius: '5px', padding: '4px 9px', letterSpacing: '1px', flexShrink: 0,
          }}>
            {timing}
          </div>
        )}
      </div>
    )
  }

  // ── Layout ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      background: '#161c1e',
      border: '1px solid #1e2d31',
      borderRadius: '14px',
      padding: '16px',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#7090a0', letterSpacing: '2px' }}>MARKET EVENTS</div>
        <button
          onClick={fetchData}
          style={{
            background: 'none', border: '1px solid #1e2d31', borderRadius: '8px',
            color: '#88a8ae', fontFamily: 'monospace', fontSize: '12px',
            padding: '6px 12px', cursor: 'pointer', minHeight: '34px',
          }}>
          ↻
        </button>
      </div>

      {loading && (
        <div style={{ color: '#88a8ae', fontFamily: 'monospace', fontSize: '12px', padding: '24px 0', textAlign: 'center' }}>
          Laddar...
        </div>
      )}

      {error && (
        <div style={{ color: '#ff4f6b', fontFamily: 'monospace', fontSize: '12px', padding: '12px 0' }}>{error}</div>
      )}

      {!loading && !error && (
        MOBILE ? (
          // ── MOBILE: tab switcher ──────────────────────────────────────────
          <div>
            {/* Tab bar */}
            <div style={{
              display: 'flex',
              background: '#0f1618',
              border: '1px solid #1e2d31',
              borderRadius: '10px',
              padding: '3px',
              gap: '3px',
              marginBottom: '16px',
            }}>
              {[
                { id: 'econ',     label: `Economic (${events.length})` },
                { id: 'earnings', label: `Earnings (${earnings.length})` },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1,
                    background: tab === t.id ? '#1c2f34' : 'none',
                    border: tab === t.id ? '1px solid #26383d' : '1px solid transparent',
                    borderRadius: '8px',
                    color: tab === t.id ? '#e2eeee' : '#88a8ae',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    padding: '9px 6px',
                    cursor: 'pointer',
                    letterSpacing: '0.3px',
                    WebkitTapHighlightColor: 'transparent',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Economic tab */}
            {tab === 'econ' && (
              <div>
                {econGroups.length === 0 && (
                  <div style={{ color: '#88a8ae', fontFamily: 'monospace', fontSize: '12px', padding: '16px 0' }}>
                    Inga high-impact events kommande 7 dagar
                  </div>
                )}
                {econGroups.map(([date, items]) => (
                  <div key={date}>
                    <DateRow label={formatDate(date)} />
                    {items.map((e, i) => <EconEvent key={i} e={e} />)}
                  </div>
                ))}
              </div>
            )}

            {/* Earnings tab */}
            {tab === 'earnings' && (
              <div>
                {earnGroups.length === 0 && (
                  <div style={{ color: '#88a8ae', fontFamily: 'monospace', fontSize: '12px', padding: '16px 0' }}>
                    Inga earnings kommande 7 dagar
                  </div>
                )}
                {earnGroups.map(([date, items]) => (
                  <div key={date}>
                    <DateRow label={formatDate(date)} />
                    {items.map((e, i) => <EarningRow key={i} e={e} />)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // ── DESKTOP: side-by-side ─────────────────────────────────────────
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#7090a0', letterSpacing: '2px', marginBottom: '10px' }}>
                ECONOMIC — HIGH IMPACT
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                {econGroups.length === 0 && (
                  <div style={{ color: '#7090a0', fontFamily: 'monospace', fontSize: '11px', padding: '12px 0' }}>
                    Inga events kommande 7 dagar
                  </div>
                )}
                {econGroups.map(([date, items]) => (
                  <div key={date}>
                    <DateRow label={formatDate(date)} />
                    {items.map((e, i) => <EconEvent key={i} e={e} />)}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#7090a0', letterSpacing: '2px', marginBottom: '10px' }}>
                EARNINGS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                {earnGroups.length === 0 && (
                  <div style={{ color: '#7090a0', fontFamily: 'monospace', fontSize: '11px', padding: '12px 0' }}>
                    Inga earnings kommande 7 dagar
                  </div>
                )}
                {earnGroups.map(([date, items]) => (
                  <div key={date}>
                    <DateRow label={formatDate(date)} />
                    {items.map((e, i) => <EarningRow key={i} e={e} />)}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )
      )}
    </div>
  )
}

export default EconomicCalendar