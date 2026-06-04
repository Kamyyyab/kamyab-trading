// Run: node scripts/generate-vapid.js
// Generates VAPID keys for Web Push notifications

const { webcrypto } = require('crypto')
const crypto = webcrypto

async function generate() {
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
  console.log('Add to .env.local:\n')
  console.log(`VITE_VAPID_PUBLIC_KEY=${publicKey}`)
  console.log('\nAdd to Supabase Edge Function secrets:\n')
  console.log(`VAPID_PUBLIC_KEY=${publicKey}`)
  console.log(`VAPID_PRIVATE_KEY=${privateKey}`)
  console.log('\n⚠  Save the private key securely — it cannot be recovered!')
}

generate().catch(console.error)
