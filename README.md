# KaveraStream

Unified live-sports + IPTV dashboard. Dark-esports UI (solid surfaces, flat green
accent, Space Grotesk / IBM Plex type). Built with Next.js 16 (App Router) +
Tailwind v4. All data fetched client-side from public endpoints — no backend.

## Sources (merged feed)

### 1. Live Sports — `https://api.ppv.st/api`  (PPW / rushstreams network)
- `GET /api/streams` — live catalog (176+ events, 11 categories)
- `GET /api/streams/{id}` — event detail + embed source
- `GET /api/vods` + `/api/vods/{id}` — on-demand catalog

### 2. EsportEx — `https://api.esportex.site/api/streams`  (Nobaryu backend)
- `GET /api/streams` — 168 events (football 92, amfootball 26, baseball 15, …)
- Playback: numeric `ppv/{id}` tokens resolve via the shared PPW network
  (`api.ppv.st/api/streams/{id}` → embedindia iframe). Non-ppv tokens
  (`so/`, `em/`, `wec/`) are marked **unplayable** (backend is anti-hotlink).

## Features
- **Live tab** — merged PPW + EsportEx feed; search, multi-category filter,
  4-way sort (live / viewers / jadwal / A–Z), auto-refresh 30s, live count pill.
- **EsportEx** — 168-event catalog, LIVE/UPCOMING/ENDED badges, sport filter,
  multi-source server switcher (dropdown + ganti-server failover), ppv-priority.
- **MultiView** — watch several live streams at once in a grid.
- **On-Demand** — VOD catalog + playback.

## Stack
- Next.js 16.3.4 (App Router, Turbopack, TypeScript) · Tailwind CSS v4
- Fonts: Space Grotesk / IBM Plex (Google Fonts)
- Player embeds: PPW (embedindia) iframes, EsportEx player iframes, Shaka/hls.js for local

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000
```

## Deploy to Vercel
1. Push this repo to GitHub.
2. Import in Vercel (framework: Next.js, auto-detected). High-traffic build:
   choose a region close to your audience (e.g. Singapore) if streaming from ID.
3. Optional env (defaults already correct):
   - `NEXT_PUBLIC_API_BASE=https://api.ppv.st/api`   (Live)
   - `NEXT_PUBLIC_ESX_API=https://api.esportex.site/api/streams`  (EsportEx)
4. Deploy. All routes are `force-dynamic` — data refreshes on every visit.

> Vercel CLI: `npx vercel --prod`. Build verified: `npm run build`.

## Structure
```
app/
  page.tsx            # Live tab (merged PPW + EsportEx feed)
  esportex/           # EsportEx catalog + event player
  event/[id]/         # PPW event detail + embed
  multiView/          # multi-stream watch grid
  vods/ + vod/[id]/   # on-demand catalog + player
components/           # client components (HomeClient, EsxClient, EventCard, ...)
lib/api.ts            # PPW streams/VOD client
lib/esportex.ts       # EsportEx catalog + token decode + source resolve
```

## Notes
- EsportEx events without a numeric `ppv/` source (badminton/race/tennis) are
  marked **Tidak tersedia** — their resolve API (`data.esportex.site`) is
  anti-hotlink and not playable from outside.
- PPW/embedindia playback is iframe-based (browser-handled) — same as the
  upstream rushstreams/ew playlist model.
