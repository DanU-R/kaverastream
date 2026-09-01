# KaveraStream — Sports + IPTV

Unified sports & IPTV dashboard. Consumes two public data sources. Built with
Next.js 16 (App Router) + Tailwind. All data fetched client-side (both APIs send
`Access-Control-Allow-Origin: *` — no backend needed).

## Data sources (merged endpoints)

### 1. Live Sports — `https://api.ppv.st/api`  (ppv/rushstreams network)
| Endpoint | Use |
|---|---|
| `GET /api/streams` | Full live catalog (11 categories, varies ~176+ events) |
| `GET /api/streams/{id}` | Event detail + player source |
| `GET /api/vods` | On-demand catalog |
| `GET /api/vods/{id}` | VOD detail (m3u8 source) |

### 2. IPTV Channels — `https://carryflix.cloud/tv.json`  (carryflix network)
94 live DASH channels (CENC-DRM, clearKeys embedded). Fetched with cache-buster.
Channel ids map to broadcast names (beIN, DAZN, Sky, Milan/Inter TV, UFC, F1 TV…).

## Features
- **Live** — Live Now (auto-refresh + viewer count), Upcoming per category
- **Event detail** — embedded player frame
- **IPTV** — searchable 94-channel grid + DRM player (Shaka Player + clearKeys)
- **On-Demand** — VOD catalog + HLS playback

## Stack
- Next.js 16.3.4 (App Router, Turbopack, TypeScript), Tailwind CSS v4
- Shaka Player 4.12.4 (CDN) for IPTV DASH/DRM playback

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000
```

## Deploy to Vercel
1. Push this repo to GitHub.
2. Import in Vercel (framework: Next.js, auto-detected).
3. Optional env (defaults already correct):
   - `NEXT_PUBLIC_API_BASE=https://api.ppv.st/api`
   - `NEXT_PUBLIC_IPTV_TV_URL=https://carryflix.cloud/tv.json`
4. Deploy. All routes are `force-dynamic` so data always refreshes.

> Vercel CLI: `npx vercel --prod`. Build verified: `npm run build` passes clean.

## Structure
```
app/
  page.tsx            # home (Live Now + categories)
  event/[id]/         # sports event detail + player
  iptv/               # IPTV channel grid
  iptv/[id]/          # IPTV DRM player (Shaka + clearKeys)
  vods/               # on-demand catalog
  vod/[id]/           # vod detail + playback
components/           # client components
lib/api.ts            # sports API client
lib/iptv.ts           # IPTV tv.json client + channel-name resolver
```
