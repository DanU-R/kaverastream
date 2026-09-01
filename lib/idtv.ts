// Indonesian IPTV channels — from iptv-org (large, maintained playlist).
// Strategy (option A): play natively via <video>+hls.js for CORS-open hosts ONLY.
// No proxy — hosts flagged non-CORS (token-rotating / geo / raw-IP) are dropped
// so everything listed actually plays. Filtered against a live-tested host
// allowlist below.

export const ID_PLAYLIST_URL =
  process.env.NEXT_PUBLIC_ID_PLAYLIST_URL ??
  "https://iptv-org.github.io/iptv/countries/id.m3u";

export interface IdChannel {
  name: string;
  logo?: string;
  url: string;
  id: string;
  group: string;
}

// Hosts verified CORS-open (HTTP 200 + Access-Control-Allow-Origin: *) from live
// browser probe. Anything not here is dropped (can't play natively in browser).
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
  "edge.medcom.id": true,
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
};

export function isCorsOpen(url: string): boolean {
  try {
    return !!CORS_HOSTS[new URL(url).host];
  } catch {
    return false;
  }
}

export function displayUrl(url: string): string {
  // native-only: must be https and CORS-open, else not playable
  if (!/^https?:\/\//.test(url)) return "";
  if (!isCorsOpen(url)) return "";
  return url;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function parsePlaylist(text: string): IdChannel[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const out: IdChannel[] = [];
  let cur: Partial<IdChannel> | null = null;
  for (const l of lines) {
    if (l.startsWith("#EXTINF")) {
      const name = l.includes(",") ? l.slice(l.lastIndexOf(",") + 1).trim() : "";
      const logo = l.match(/tvg-logo="([^"]*)"/)?.[1] ?? "";
      // group-title present on some
      const grp = l.match(/group-title="([^"]*)"/)?.[1] ?? "";
      cur = { name, logo, group: grp };
    } else if (cur && l && !l.startsWith("#")) {
      cur.url = l;
      out.push({
        name: cur.name ?? "",
        logo: cur.logo,
        group: cur.group ?? "",
        url: l,
        id: slug(cur.name ?? `ch-${out.length}`),
      });
      cur = null;
    }
  }
  return out;
}

// Decide a CORS-open sample channel for a name/url
export function eligibleChannel(c: IdChannel): boolean {
  const disp = displayUrl(c.url);
  if (disp) return true;
  // keep major national channels even if sample host not CORS (they may have
  // alternate streams); but those won't play native — so we DO drop them.
  return false;
}

export async function fetchIdChannels(): Promise<IdChannel[]> {
  const res = await fetch(ID_PLAYLIST_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`playlist ${res.status}`);
  const all = parsePlaylist(await res.text());
  // keep only playable (CORS-open) + dedupe by URL host+name
  const seen = new Set<string>();
  const filtered: IdChannel[] = [];
  for (const c of all) {
    if (!isCorsOpen(c.url)) continue;
    const k = c.name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    filtered.push(c);
  }
  return filtered;
}

export async function fetchChannel(id: string): Promise<IdChannel | null> {
  const all = await fetchIdChannels();
  return all.find((c) => c.id === id) ?? null;
}
