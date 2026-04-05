# QuoteMate

Quote it. Send it. Track it. Done.

Mobile-first PWA for Australian tradespeople to create quotes, send them to customers, and track jobs through completion.

## Stack

- React + Vite (PWA via `vite-plugin-pwa`)
- Tailwind CSS
- React Router v6
- Supabase (auth, Postgres, storage, Edge Functions)
- Stripe (subscriptions)
- Resend (email) + Twilio (SMS)

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase credentials
npm run dev
```

Open http://localhost:5173.

## Environment variables

| Key | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (later) |

## Database

Apply migrations in order from `supabase/migrations/` via the Supabase SQL editor or CLI.

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview production build
