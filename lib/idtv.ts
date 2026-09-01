// Indonesian IPTV channels — from the maintained public playlist
// (riotryulianto/iptv-playlists; source streams are public/official web streams)
// Strategy: channels whose CDN is CORS-open play natively (HLS); the rest fall
// back to the serverless proxy route `/api/p/stream` (see route handler).

export const ID_PLAYLIST_URL =
  process.env.NEXT_PUBLIC_ID_PLAYLIST_URL ??
  "https://raw.githubusercontent.com/riotryulianto/iptv-playlists/main/playlist.m3u";

export interface IdChannel {
  name: string;
  group: string; // "Indonesia" | "Premium"
  logo?: string;
  url: string;
  id: string; // slug
}

// Hosts verified CORS-open (native <video> HLS works without proxy)
const NATIVE_CORS: Record<string, true> = {
  "edge.medcom.id": true, // Metro TV, Magna
  "live.cnnindonesia.com": true,
  "live.cnbcindonesia.com": true,
  "ott-balancer.tvri.go.id": true, // TVRI
  "nusantaratv.siar.us": true,
  "oth-eu.akamaized.net": true,
  "liveaneviadev.mncnow.id": true,
};

export function needsProxy(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return !NATIVE_CORS[host];
  } catch {
    return true;
  }
}

export function proxyUrl(raw: string): string {
  return `/api/p/stream?url=${encodeURIComponent(raw)}`;
}

export function displayUrl(url: string): string {
  // all Indonesia streams route through the serverless proxy (handles CORS,
  // DNS, region pass-through + full URI rebase). Native-only is unreliable
  // because child manifests/segments often lack CORS even when the master does.
  if (/^(udp|rtmp|rtsp):/.test(url) || !/^https?:\/\//.test(url)) return "";
  return proxyUrl(url);
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
      const grp = l.match(/group-title="([^"]*)"/)?.[1] ?? "";
      const logo = l.match(/tvg-logo="([^"]*)"/)?.[1] ?? "";
      cur = { name, group: grp, logo };
    } else if (cur && l && !l.startsWith("#")) {
      cur.url = l;
      out.push({
        name: cur.name ?? "",
        group: cur.group ?? "",
        logo: cur.logo,
        url: l,
        id: slug(cur.name ?? `ch-${out.length}`),
      });
      cur = null;
    }
  }
  // dedupe by name (keep first)
  const seen = new Set<string>();
  return out.filter((c) => {
    const k = c.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export async function fetchIdChannels(): Promise<IdChannel[]> {
  const res = await fetch(ID_PLAYLIST_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`playlist ${res.status}`);
  return parsePlaylist(await res.text());
}

export async function fetchChannel(id: string): Promise<IdChannel | null> {
  const all = await fetchIdChannels();
  return all.find((c) => c.id === id) ?? null;
}
