# Server-side prisnivålarm — Setup

## Steg 1: Generera VAPID-nycklar

```bash
node scripts/generate-vapid.js
```

Spara output — du behöver de i steg 3 och 4.

## Steg 2: Kör SQL-migrationen i Supabase

1. Öppna Supabase-dashboarden
2. Gå till **SQL Editor**
3. Klistra in innehållet i `supabase/migrations/20260603_price_alerts.sql`
4. Kör det

## Steg 3: Sätt VAPID_PUBLIC_KEY i frontend

Skapa `.env.local` i projektets rotmapp:

```
VITE_VAPID_PUBLIC_KEY=din_public_key_här
```

## Steg 4: Deploya Edge Function

Installera Supabase CLI om du inte har det:
```bash
npm install -g supabase
```

Logga in och deploya:
```bash
supabase login
supabase functions deploy check-alerts --project-ref tgzgndyxfwnoqvtbetns
```

Sätt environment variables i Supabase-dashboarden:
- Gå till **Settings → Edge Functions**
- Lägg till:
  - `VAPID_PUBLIC_KEY` = din public key
  - `VAPID_PRIVATE_KEY` = din private key

## Steg 5: Sätt upp automatisk schemaläggning (gratis)

1. Gå till [cron-job.org](https://cron-job.org) och skapa ett gratis konto
2. Skapa ett nytt cron-jobb:
   - **URL**: `https://tgzgndyxfwnoqvtbetns.supabase.co/functions/v1/check-alerts`
   - **Header**: `Authorization: Bearer <din_anon_key>`
   - **Intervall**: Var 30:e sekund (eller 1 minut)
3. Spara — nu körs Edge Function var 30s

Den anon-nyckeln hittar du i Supabase → Settings → API.

## Hur det funkar

```
Telefon/browser           Supabase              cron-job.org
     |                       |                       |
     | Lägg till larm ──────>| price_alerts table    |
     |                       |                       |
     |                       |<────── Kör check-alerts var 30s
     |                       |                       |
     |                       | Hämtar pris (YF)      |
     |                       | Jämför med larm        |
     |                       |                       |
     |<── Web Push ──────────| Prisnivå nådd!        |
     |                       |                       |
  Notis på                Uppdaterar DB
  telefonen!              (triggered=true)
```

## Testa

1. Öppna appen → Charts → Lägg till ett larm
2. Tryck "Tillåt" på notis-bannern
3. Installera appen som PWA (Dela → Lägg till på hemskärmen) för bakgrundsnotiser
4. Appen kan nu vara stängd — Edge Function skickar notisen direkt till telefonen
