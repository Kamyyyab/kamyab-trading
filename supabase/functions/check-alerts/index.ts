import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SVC_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC     = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE    = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT    = 'mailto:kamyabmahdioun77@gmail.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_SVC_KEY)
const enc      = new TextEncoder()

// ── VAPID helpers ──────────────────────────────────────────────
function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromB64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  return new Uint8Array(atob(b64.padEnd(b64.length + (4 - b64.length % 4) % 4, '=')).split('').map(c => c.charCodeAt(0)))
}

async function vapidJWT(audience: string): Promise<string> {
  const now     = Math.floor(Date.now() / 1000)
  const header  = b64url(enc.encode(JSON.stringify({ alg: 'ES256', typ: 'JWT' })))
  const payload = b64url(enc.encode(JSON.stringify({ aud: audience, exp: now + 43200, sub: VAPID_SUBJECT })))
  const input   = `${header}.${payload}`
  const key     = await crypto.subtle.importKey(
    'pkcs8', fromB64url(VAPID_PRIVATE),
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(input))
  return `${input}.${b64url(sig)}`
}

// ── AES-128-GCM push payload encryption (RFC 8291) ─────────────
async function encryptPayload(sub: any, payload: string): Promise<{ body: Uint8Array, salt: Uint8Array, serverPublicKey: Uint8Array }> {
  const salt         = crypto.getRandomValues(new Uint8Array(16))
  const serverKeys   = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits'])
  const serverPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeys.publicKey))

  const clientPubRaw = fromB64url(sub.keys.p256dh)
  const clientPub    = await crypto.subtle.importKey('raw', clientPubRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const authSecret   = fromB64url(sub.keys.auth)

  const ikm  = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: clientPub }, serverKeys.privateKey, 256))

  // HKDF-extract with auth secret
  const prk = await crypto.subtle.importKey('raw', await hkdf(authSecret, ikm, enc.encode('Content-Encoding: auth\0'), 32), 'HKDF', false, ['deriveKey', 'deriveBits'])

  const keyInfo  = buildInfo('aesgcm128', clientPubRaw, serverPubRaw)
  const nonceInfo = buildInfo('nonce', clientPubRaw, serverPubRaw)

  const aesKey  = await crypto.subtle.importKey('raw', await hkdf(salt, await exportRaw(prk), keyInfo,  16), { name: 'AES-GCM' }, false, ['encrypt'])
  const nonce   = new Uint8Array(await hkdf(salt, await exportRaw(prk), nonceInfo, 12))

  const data    = new Uint8Array([0, 0, ...enc.encode(payload)])  // 2-byte padding prefix
  const body    = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, data))
  return { body, salt, serverPublicKey: serverPubRaw }
}

async function exportRaw(key: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.exportKey('raw', key))
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const hkdfKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const bits    = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, hkdfKey, length * 8)
  return new Uint8Array(bits)
}

function buildInfo(type: string, clientKey: Uint8Array, serverKey: Uint8Array): Uint8Array {
  const label = enc.encode(`Content-Encoding: ${type}\0P-256\0`)
  const buf   = new Uint8Array(label.length + 2 + clientKey.length + 2 + serverKey.length)
  let i = 0
  buf.set(label, i); i += label.length
  new DataView(buf.buffer).setUint16(i, clientKey.length, false); i += 2
  buf.set(clientKey, i); i += clientKey.length
  new DataView(buf.buffer).setUint16(i, serverKey.length, false); i += 2
  buf.set(serverKey, i)
  return buf
}

// ── Send a Web Push notification ────────────────────────────────
async function sendPush(sub: any, title: string, body: string): Promise<void> {
  const endpoint = sub.endpoint
  const origin   = new URL(endpoint).origin
  const jwt      = await vapidJWT(origin)

  const { body: encBody, salt, serverPublicKey } = await encryptPayload(sub, JSON.stringify({ title, body }))

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization':       `WebPush ${jwt}`,
      'Crypto-Key':          `dh=${b64url(serverPublicKey)};p256ecdsa=${VAPID_PUBLIC}`,
      'Content-Encoding':    'aesgcm',
      'Encryption':          `salt=${b64url(salt)}`,
      'Content-Type':        'application/octet-stream',
      'TTL':                 '86400',
    },
    body: encBody,
  })
  if (!res.ok && res.status !== 201) {
    throw Object.assign(new Error(`Push ${res.status}`), { statusCode: res.status })
  }
}

// ── Fetch price (direct YF, no CORS proxy needed server-side) ──
async function getPrice(symbol: string): Promise<number | null> {
  for (const base of ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com']) {
    try {
      const r = await fetch(
        `${base}/v7/finance/quote?lang=en-US&region=US&symbols=${encodeURIComponent(symbol)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } }
      )
      const d = await r.json()
      const p = d?.quoteResponse?.result?.[0]?.regularMarketPrice
      if (p && p > 0) return p
    } catch { /* try next */ }
  }
  return null
}

// ── Main handler ────────────────────────────────────────────────
Deno.serve(async (_req) => {
  try {
    // Fetch active alerts with user's push subscriptions
    const { data: alerts, error: aErr } = await supabase
      .from('price_alerts')
      .select('*, push_subscriptions(id, subscription)')
      .eq('triggered', false)
    if (aErr) return json({ error: aErr.message }, 500)

    let checked = 0, triggered = 0

    for (const alert of alerts ?? []) {
      const c = await getPrice(alert.symbol)
      if (!c) continue
      checked++

      const prev    = alert.last_price
      const crossed = prev != null && ((prev < alert.price && c >= alert.price) || (prev > alert.price && c <= alert.price))
      const near    = Math.abs(c - alert.price) / alert.price <= 0.001

      // Always update last_price
      await supabase.from('price_alerts').update({ last_price: c }).eq('id', alert.id)

      if (crossed || (prev == null && near)) {
        triggered++
        await supabase.from('price_alerts').update({
          triggered:       true,
          triggered_price: c,
          triggered_at:    new Date().toISOString(),
        }).eq('id', alert.id)

        const title = `🔔 ${alert.symbol} @ ${alert.price}`
        const body  = `${alert.label || ''} · Nu: ${c.toFixed(2)}`

        for (const s of alert.push_subscriptions ?? []) {
          try {
            await sendPush(s.subscription, title, body)
          } catch (e: any) {
            console.error(`Push failed for sub ${s.id}:`, e.message)
            if (e.statusCode === 410 || e.statusCode === 404) {
              await supabase.from('push_subscriptions').delete().eq('id', s.id)
            }
          }
        }
      }
    }

    return json({ ok: true, checked, triggered })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
