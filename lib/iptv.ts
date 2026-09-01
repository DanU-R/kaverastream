// Carryflix IPTV channel source (tv.json)
export const IPTV_TV_URL =
  (process.env.NEXT_PUBLIC_IPTV_TV_URL ?? "https://carryflix.cloud/tv.json");

export interface IptvChannel {
  id: string;
  type: string; // 'dash'
  url: string; // .cenc.mpd
  clearKeys?: Record<string, string>;
  origin: string;
  referer: string;
  userAgent: string;
  headers: Record<string, string>;
}

export async function fetchChannels(): Promise<IptvChannel[]> {
  const res = await fetch(`${IPTV_TV_URL}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`IPTV manifest ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.streams)) return data.streams;
  throw new Error("unsupported tv.json format");
}

// Pretty channel display name from the raw id (broadcast sports conventions)
const KNOWN: Record<string, string> = {
  f1: "FOX Sports 1",
  f12: "FOX Sports 12",
  event1: "Main Event",
  milantv: "Milan TV",
  intertv: "Inter TV",
  ufc: "UFC Fight Pass",
  f1tv: "F1 TV",
  gptv: "Global Prime TV",
  cbsgolazo: "CBS Sports Golazo",
  sportdigital: "sportdigital FUSSBALL",
  clarosports: "Claro Sports",
  sportv1br: "SporTV 1 BR",
  sportv2br: "SporTV 2 BR",
  sportv3br: "SporTV 3 BR",
};

function expand(s: string): string {
  const map: Record<string, string> = {
    au: "AU", br: "BR", de: "DE", it: "IT", es: "ES", mx: "MX", ar: "AR",
    b: "Canada", us: "US", uk: "UK", at: "AT",
    nbatv: "NBA TV", mlbtv: "MLB TV", nfltv: "NFL Network", fifa: "FIFA+",
  };
  return map[s] ?? s;
}

export function channelName(id: string): string {
  if (KNOWN[id]) return KNOWN[id];
  // handle numbered suffixes: tnt1b -> TNT 1 Canada, prem1b -> Premier 1 Canada
  const m = id.match(/^([a-z]+)(\d*)([a-z]*)$/);
  if (m) {
    const base = m[1].toUpperCase();
    const num = m[2] ? ` ${m[2]}` : "";
    const region = m[3] ? ` ${expand(m[3])}` : "";
    if (m[1] === "premiere" || m[1] === "prem") return `Premier Sports ${m[2] || ""}${region}`.trim();
    if (m[1] === "dazn") return `DAZN ${m[2] || ""}${region}`.trim();
    if (m[1] === "bein") return `beIN Sports ${m[2] || "1"}${region}`.trim();
    if (m[1] === "sky") return `Sky ${m[2] || "1"}${region}`.trim();
    if (m[1] === "fox") return `FOX ${m[2] || ""}${region}`.trim();
    return `${base}${num}${region}`.trim();
  }
  return id.toUpperCase();
}
