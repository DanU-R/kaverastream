# Carryflix IPTV — API intel (integrated into KaveraStream)

## Data source (the "API")
| Source | URL | Format |
|---|---|---|
| Primary manifest | `https://carryflix.cloud/tv.json?t={cachebuster}` | bare JSON array of channels |
| GitHub mirror | `raw.githubusercontent.com/dmnbruh/gaddmn/.../tv.json` | NOTE: different schema (`{streams:[...]}`) — not used |

Fetched with `?t=${Date.now()}` to bust cache. If response is an array → channels;
if `{streams:[...]}` → ppv-shaped (unrelated).

## Channel object (94 channels, all `type:"dash"`)
```json
{
  "id": "bein1au",
  "type": "dash",
  "url": "https://otte.cache.aiv-cdn.net/{edge}/live/clients/dash/enc/{token}/out/v1/{id}/cenc.mpd",
  "clearKeys": { "<keyId-hex>": "<key-hex>" },
  "origin": "",
  "referer": "",
  "userAgent": "",
  "headers": {}
}
```
- `cenc.mpd` = **CENC-DRM DASH manifest** (MPEG-DASH with Common Encryption)
- `clearKeys` = leaked **Widevine/CENC clear key:keyId pairs** → allows fully local decrypt (no license server)
- `otte.cache.aiv-cdn.net` = AIV-CDN / nxtgencdn-esque edge (pdx/bom-nitro PoPs)

## Channel naming (id → display)
IDs are semantically readable broadcast handles:
- `f1`, `f12` → FOX Sports; `bein1au/2au/3au` → beIN Sports 1–3 AU
- `dazn1de/2de`, `dazn1it`, `dazn1es..4es`, `daznf1`, `daznlaliga` → DAZN variants
- `sky1de..`, `skymixde1/2` → Sky DE; `sky1at..9at` → Sky AT; `sky*uk` → Sky UK
- `premiere1..8` / `prem1b..` → Premier Sports; `tnt1b..4b`, `tsn1b..5b` → TNT/TSN Canada
- `milantv`, `intertv` → Milan/Inter TV; `ufc` → UFC Fight Pass; `f1tv` → F1 TV
- `nbatvus`, `mlbtvus`, `nfltvus`, `fifaus` → NBA/MLB/NFL/FIFA US
- `sportv1br..3br`, `cazetv1..3` → BR; `fox*` → Mexico; `dsport1ar..` → DSports AR
- `event1` → Main Event; `tudnmx..` → TUDN MX

## Frontend (carryflix.com)
- Vue 3 SPA, Indonesian UI ("Tambah Stream", "Format tv.json tidak didukung")
- Supabase `gkdcgzdnzqfkzitekqrf.supabase.co` — only `messages` table (chat); no channels
- PostHog analytics, Firebase assets, ad network (omg10/al5sm/outbrain/quantserve)
- Lazy chunks: Login, ReplaysList, ReplayPage (also has VOD/replays feature)
- Domain family: carryflix.com, carryflix.cloud, carryflix-status.pages.dev, fkoff.pages.dev

## Player (integrated in KaveraStream)
Shaka Player 4.12.4 loads `cenc.mpd` with `drm.clearKeys` config → full client-side
decrypt. Verified playing (video readyState=4) in headless Chromium.
