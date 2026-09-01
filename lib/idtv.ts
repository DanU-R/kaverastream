// Indonesian TV channels.
//
// TWO tiers:
//  * NATIVE  — hosts verified CORS-open (play straight in <video>+hls.js).
//  * PROXY   — national big channels whose CDNs aren't browser-CORS (token-rotating /
//              geo / raw-IP). These go through the serverless full-rewrite proxy
//              `/api/p/stream`. Reliability varies by Vercel region & upstream.

export const ID_PLAYLIST_URL =
  process.env.NEXT_PUBLIC_ID_PLAYLIST_URL ??
  "https://iptv-org.github.io/iptv/countries/id.m3u";

const PROXY_PREFIX = "/api/p/stream?url=";

export interface IdChannel {
  name: string;
  logo?: string;
  url: string;      // final playable (native url OR /api/p/stream?...)
  id: string;
  group: string;
  native: boolean;  // true = plays directly, false = via proxy
  rawUrl: string;   // upstream URL (when proxied)
}

// ---- National big channels that need the proxy ----
// (upstream CDNs: medcom token-rotating, dens geo/DNS, malingtv rate-limits,
//  transmedia / detik socket-restrictive — none browser-CORS-reliable)
const NATIONAL: { name: string; url: string; logo?: string }[] = [
  { name: "Metro TV", url: "https://edge.medcom.id/live-edge/smil:metro.smil/playlist.m3u8", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Metro_TV_2023.svg/512px-Metro_TV_2023.svg.png" },
  { name: "CNN Indonesia", url: "https://live.cnnindonesia.com/livecnn/smil:cnntv.smil/playlist.m3u8" },
  { name: "CNBC Indonesia", url: "https://live.cnbcindonesia.com/livecnbc/smil:cnbctv.smil/playlist.m3u8" },
  { name: "Trans7", url: "https://video.detik.com/trans7/smil:trans7.smil/playlist.m3u8" },
  { name: "Trans TV", url: "https://video.detik.com/transtv/smil:transtv.smil/playlist.m3u8" },
  { name: "RCTI", url: "https://mncmedia.malingtv.workers.dev/rcti.m3u8" },
  { name: "GTV", url: "https://mncmedia.malingtv.workers.dev/gtv.m3u8" },
  { name: "MNCTV", url: "https://mncmedia.malingtv.workers.dev/mnctv.m3u8" },
  { name: "iNews", url: "https://mncmedia.malingtv.workers.dev/inews.m3u8" },
  { name: "Kompas TV", url: "https://op-group1-swiftservehd-1.dens.tv/h/h234/index.m3u8" },
  { name: "SCTV", url: "https://op-group1-swiftservehd-1.dens.tv/h/h217/index.m3u8" },
  { name: "Indosiar", url: "https://203.77.246.2/udp/239.1.1.110:5000" },
  { name: "ANTV", url: "http://103.58.160.157:8278/720-ANTV/playlist.m3u8" },
  { name: "tvOne", url: "https://op-group1-swiftservehd-1.dens.tv/h/h224/index.m3u8" },
];

// ---- Native CORS-open hosts (verified live) ----
const CORS_HOSTS: Record<string, true> = {
  "5bf7b725107e5.streamlock.net": true,
  "akativi.siar.us": true,
  "wahyu1ptv.pages.dev": true,
  "hgmtv.com:19360": true,
  "202.150.153.254:65500": true,
  "banjartv.siar.us": true,
  "flv.intechmedia.net": true,
  "stream.carubantv.id": true,
  "pull.daaiplus.com": true,
  "b.webcache.maxindo.net.id": true,
  "dhohotv.siar.us": true,
  "tvstreamcast.com": true,
  "dutatv.siar.us": true,
  "gist.githubusercontent.com": true,
  "vodcdn.bamboo-cloud.com": true,
  "live.efarinatv.com": true,
  "v3.siar.us": true,
  "61146e7ab7a66.streamlock.net:8089": true,
  "jambitv.globaldigitalcore.com": true,
  "103.255.15.222:1935": true,
  "stream.jogjatv.co.id": true,
  "lingkartv.my.id": true,
  "stream.asianastream.com": true,
  "re1.siar.us": true,
  "stream.matrixtv.id": true,
  "stream.convergen.co": true,
  "mgstv.siar.us": true,
  "mic.siar.us": true,
  "streaming.id18.tunnel.my.id": true,
  "pujatv.siar.us": true,
  "v2.siar.us": true,
  "rtvstream.rtv.co.id:4555": true,
  "v10.siar.us": true,
  "rinjanitv.cloud": true,
  "rodjatv.com": true,
  "private-streaming.rri.go.id": true,
  "live.salira.tv": true,
  "live.salira.tv:3870": true,
  "cdn.adyadigitalteknologi.com:8090": true,
  "stream.staratv.id": true,
  "bandung.staratv.id": true,
  "bojonegoro.staratv.id": true,
  "cianjur.staratv.id": true,
  "jakarta.staratv.id": true,
  "malang.staratv.id": true,
  "parahyangan.staratv.id": true,
  "tvku.tv": true,
  "ott-balancer.tvri.go.id": true,
  "srs.u-channel.tv": true,
  "cdn.gunadarma.ac.id": true,
  "ikitv.sqn.at:8000": true,
  "nusantaratv.siar.us": true,
};

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function isCorsOpen(url: string): boolean {
  try { return !!CORS_HOSTS[new URL(url).host]; } catch { return false; }
}

// Build the merged channel list: national (proxy) + local (native CORS)
export async function fetchIdChannels(): Promise<IdChannel[]> {
  const out: IdChannel[] = [];

  // 1. national via proxy (udp/rtmp excluded — not browser-playable)
  for (const n of NATIONAL) {
    if (/^(udp|rtmp|rtsp):/.test(n.url)) continue;
    out.push({
      name: n.name,
      logo: n.logo,
      url: PROXY_PREFIX + encodeURIComponent(n.url),
      rawUrl: n.url,
      id: slug(n.name),
      group: "Nasional",
      native: false,
    });
  }

  // 2. native CORS-open from iptv-org (countries/id.m3u)
  try {
    const res = await fetch(ID_PLAYLIST_URL, { cache: "no-store" });
    if (res.ok) {
      const text = await res.text();
      const seen = new Set<string>();
      for (const c of parsePlaylist(text)) {
        if (!isCorsOpen(c.url)) continue;
        const k = c.name.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        out.push({ ...c, url: c.url, native: true, group: c.group || "Lokal" });
      }
    }
  } catch {
    // playlist fetch failed — national still available
  }

  return out;
}

export async function fetchChannel(id: string): Promise<IdChannel | null> {
  const all = await fetchIdChannels();
  return all.find((c) => c.id === id) ?? null;
}

export function parsePlaylist(text: string): IdChannel[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const out: IdChannel[] = [];
  let cur: Partial<IdChannel> | null = null;
  for (const l of lines) {
    if (l.startsWith("#EXTINF")) {
      const name = l.includes(",") ? l.slice(l.lastIndexOf(",") + 1).trim() : "";
      const logo = l.match(/tvg-logo="([^"]*)"/)?.[1] ?? "";
      const grp = l.match(/group-title="([^"]*)"/)?.[1] ?? "";
      cur = { name, logo, group: grp };
    } else if (cur && l && !l.startsWith("#")) {
      cur.url = l;
      out.push({ name: cur.name ?? "", logo: cur.logo, group: cur.group ?? "", url: l, id: slug(cur.name ?? `ch-${out.length}`) } as IdChannel);
      cur = null;
    }
  }
  return out;
}
