# Lobby (לובי)

Closed benefits club for apartment buildings. Next.js (App Router) + Tailwind + Supabase.

## Setup

1. `npm install`
2. Create a Supabase project, then run `supabase/migrations/*.sql` in order (SQL Editor, or `npx supabase db push`).
3. Copy `.env.example` to `.env.local` and fill in the keys.
4. `npm run dev` and open http://localhost:3000
5. `npm run seed:demo` creates the demo building/business and prints the demo terminal link, PIN and code.
   In the terminal, "איפוס הדגמה" makes the demo code valid again between meetings.

`npm test` runs the unit tests; `npm run icons` regenerates the PWA icons from `public/logo.svg`.
