// Pre-market reminder — triggered by cron-job.org daily at 13:25 UTC (15:25 CET summer / 14:25 CET winter)
// The function itself verifies it's the right Stockholm time before sending.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SVC_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC     = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE    = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT    = 'mailto:kamyabmahdioun77@gmail.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_SVC_KEY)
const enc      = new TextEncoder()

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
}
function fromB64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g,'+').replace(/_/g,'/')
  return new Uint8Array(atob(b64.padEnd(b64.length+(4-b64.length%4)%4,'=')).split('').map(c=>c.charCodeAt(0)))
}

async function vapidJWT(audience: string): Promise<string> {
  const now     = Math.floor(Date.now()/1000)
  const header  = b64url(enc.encode(JSON.stringify({alg:'ES256',typ:'JWT'})))
  const payload = b64url(enc.encode(JSON.stringify({aud:audience,exp:now+43200,sub:VAPID_SUBJECT})))
  const input   = `${header}.${payload}`
  const key     = await crypto.subtle.importKey('pkcs8',fromB64url(VAPID_PRIVATE),{name:'ECDSA',namedCurve:'P-256'},false,['sign'])
  const sig     = await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,enc.encode(input))
  return `${input}.${b64url(sig)}`
}

async function sendPush(sub: any, title: string, body: string): Promise<void> {
  const endpoint = sub.endpoint
  const jwt      = await vapidJWT(new URL(endpoint).origin)
  // Simple unencrypted push — service worker shows the notification
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `WebPush ${jwt}`,
      'Crypto-Key':    `p256ecdsa=${VAPID_PUBLIC}`,
      'Content-Type':  'application/json',
      'TTL':           '3600',
    },
    body: JSON.stringify({ title, body }),
  })
  if (!res.ok && res.status !== 201 && res.status !== 202) {
    throw Object.assign(new Error(`Push ${res.status}`), { statusCode: res.status })
  }
}

Deno.serve(async (_req) => {
  // Verify Stockholm time is 15:20–15:35 (handles both CET and CEST)
  const sthlm     = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' })
  const [, timePart] = sthlm.split(', ')
  const [h, m]    = timePart.split(':').map(Number)
  if (h !== 15 || m < 20 || m > 35) {
    return new Response(JSON.stringify({ skipped: true, sthlmTime: `${h}:${m}` }), { status: 200 })
  }

  const { data: subs } = await supabase.from('push_subscriptions').select('id, subscription')
  let sent = 0

  for (const s of subs ?? []) {
    try {
      await sendPush(s.subscription, '⏰ Marknaden öppnar om 5 min', 'Dags att sätta daglig bias — US marknaden öppnar 15:30 CET')
      sent++
    } catch (e: any) {
      if (e.statusCode === 410 || e.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('id', s.id)
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
