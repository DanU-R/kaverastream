// EsportEx network client (Nobaryu backend).
// Catalog is PUBLIC via api.esportex.site/api/streams.
// Playback resolves per event:
//   - numeric `ppv/{id}`  -> shared PPW/rushstreams network: api.ppv.st/api/streams/{id}
//                              (returns an iframe embed we can load directly)
//   - `so/{q}` / non-numeric -> fallback to the EsportEx iframe player
export const ESX_API =
  process.env.NEXT_PUBLIC_ESX_API ?? "https://api.esportex.site/api/streams";
export const ESX_PLAYER =
  process.env.NEXT_PUBLIC_ESX_PLAYER ?? "https://streams.esportex.site/player";
export const PPV_API =
  process.env.NEXT_PUBLIC_PPV_API ?? "https://api.ppv.st/api";

export interface EsxIframe {
  server: string;
  url: string; // streams.esportex.site/player#<hash>
}

export interface EsxEvent {
  slug: string;
  tag: string; // "Parma vs Cremonese"
  kickoff: string; // "2026-09-01 23:00"
  endTime: string;
  poster: string;
  iframes: EsxIframe[];
  league: string;
  id: string; // slug as id for routing
  category: string;
}

export interface EsxResponse {
  success: boolean;
  timestamp: number;
  [cat: string]: unknown; // football, basketball, amfootball, ...
}

export async function fetchEsxCatalog(): Promise<EsxEvent[]> {
  const res = await fetch(ESX_API, { cache: "no-store" });
  if (!res.ok) throw new Error(`esx ${res.status}`);
  const d = (await res.json()) as EsxResponse;
  const out: EsxEvent[] = [];
  for (const cat of Object.keys(d)) {
    const v = d[cat];
    if (Array.isArray(v)) {
      for (const ev of v as EsxEvent[]) {
        out.push({
          ...ev,
          id: ev.slug,
          category: cat,
        });
      }
    }
  }
  // sort by kickoff
  return out.sort((a, b) =>
    (a.kickoff || "").localeCompare(b.kickoff || "")
  );
}

export async function fetchEsxEvent(slug: string): Promise<EsxEvent | null> {
  const all = await fetchEsxCatalog();
  return all.find((e) => e.slug === slug) ?? null;
}

// ---- resolve playable source ----
export function decodeToken(hash: string): string {
  try {
    const padded = hash + "=".repeat((-hash.length) % 4);
    return atob(padded);
  } catch {
    return hash;
  }
}

export interface ResolvedSource {
  type: "ppv-index" | "esx-iframe";
  ppvId?: string;
  iframe?: string;
  label: string;
}

export function resolveSource(ev: EsxEvent): ResolvedSource {
  // prefer an iframe that is numeric ppv/{id}
  for (const fr of ev.iframes || []) {
    const tok = fr.url.split("#").pop() ?? "";
    const dec = decodeToken(tok);
    if (/^ppv\/\d+$/.test(dec)) {
      return {
        type: "ppv-index",
        ppvId: dec.split("/")[1],
        label: `PPW · ${fr.server}`,
      };
    }
  }
  // fallback: first iframe (esx player)
  const fr = (ev.iframes || [])[0];
  if (fr) {
    return { type: "esx-iframe", iframe: fr.url, label: `EsportEx · ${fr.server}` };
  }
  return { type: "esx-iframe", label: "No source" };
}

// Fetch the ppv embed iframe URL for a numeric id
export async function fetchPpvEmbed(ppvId: string): Promise<string | null> {
  try {
    const res = await fetch(`${PPV_API}/streams/${ppvId}`, { cache: "no-store" });
    if (!res.ok) return null;
    const d = await res.json();
    const sources = d?.data?.sources;
    if (Array.isArray(sources)) {
      const iframe = sources.find((s) => s.type === "iframe");
      if (iframe?.data) return iframe.data;
    }
    return null;
  } catch {
    return null;
  }
}
