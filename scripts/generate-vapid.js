import { webcrypto as crypto } from 'crypto'

const keyPair = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['sign', 'verify']
)

const [pub, priv] = await Promise.all([
  crypto.subtle.exportKey('raw',   keyPair.publicKey),
  crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
])

const b64url = buf => Buffer.from(buf).toString('base64url')
const publicKey  = b64url(pub)
const privateKey = b64url(priv)

console.log('\n✅ VAPID keys generated\n')
console.log('Lägg till i .env.local:\n')
console.log(`VITE_VAPID_PUBLIC_KEY=${publicKey}`)
console.log('\nLägg till i Supabase Edge Function secrets:\n')
console.log(`VAPID_PUBLIC_KEY=${publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${privateKey}`)
console.log('\n⚠  Spara private key säkert — den kan inte återskapas!')
