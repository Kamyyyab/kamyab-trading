// Proxy for Yahoo Finance — runs server-side, no CORS issues
// Called from frontend: /functions/v1/get-price?symbol=MYM&interval=5m&range=1d

const ALIASES: Record<string, string> = {
  'US30':'^DJI','DJ30':'^DJI','DJIA':'^DJI','DOW':'^DJI',
  'US100':'^NDX','NAS100':'^NDX','NDX':'^NDX','NASDAQ':'^NDX',
  'US500':'^GSPC','SP500':'^GSPC','SPX':'^GSPC',
  'US2000':'^RUT','RUT':'^RUT',
  'DAX':'^GDAXI','GER40':'^GDAXI',
  'FTSE':'^FTSE','UK100':'^FTSE',
  'MYM':'MYM=F','MYM1!':'MYM=F',
  'MNQ':'MNQ=F','MNQ1!':'MNQ=F',
  'MES':'MES=F','MES1!':'MES=F',
  'YM':'YM=F','YM1!':'YM=F',
  'NQ':'NQ=F','NQ1!':'NQ=F',
  'ES':'ES=F','ES1!':'ES=F',
  'RTY':'RTY=F','RTY1!':'RTY=F',
  'GOLD':'GC=F','XAU':'GC=F','XAUUSD':'GC=F','GC':'GC=F',
  'SILVER':'SI=F','XAG':'SI=F','XAGUSD':'SI=F',
  'OIL':'CL=F','CRUDE':'CL=F','USOIL':'CL=F','WTI':'CL=F',
  'BRENT':'BZ=F','NG':'NG=F',
  'BTC':'BTC-USD','BITCOIN':'BTC-USD','BTCUSD':'BTC-USD',
  'ETH':'ETH-USD','ETHUSD':'ETH-USD',
  'SOL':'SOL-USD','XRP':'XRP-USD','BNB':'BNB-USD',
  'DOGE':'DOGE-USD','AVAX':'AVAX-USD',
}

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const url      = new URL(req.url)
  const raw      = url.searchParams.get('symbol') || ''
  const interval = url.searchParams.get('interval') || '5m'
  const range    = url.searchParams.get('range')    || '1d'

  if (!raw) return new Response(JSON.stringify({ error: 'symbol required' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })

  const ticker = ALIASES[raw.trim().toUpperCase()] || raw.trim()

  for (const base of ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com']) {
    try {
      const r = await fetch(
        `${base}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`,
        { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }, signal: AbortSignal.timeout(6000) }
      )
      if (!r.ok) continue
      const data = await r.json()
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
      if (!price) continue
      return new Response(JSON.stringify(data), {
        headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'max-age=10' }
      })
    } catch { continue }
  }

  return new Response(JSON.stringify({ error: 'Could not fetch price' }), { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } })
})
