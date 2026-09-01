// Data layer for the KaveraStream home: maps ppv streams + esportex into a
// unified "match" feed and derives live/schedule. All fields come from the
// real API (viewers, poster, channel/source_tag, category, kickoff). Scores
// are NOT fabricated — the upstream API exposes none and external score DBs
// don't overlap this event universe.
import { Stream, fetchStreams, isLive } from "@/lib/api";
import { EsxEvent, esxStatus, fetchEsxCatalog } from "@/lib/esportex";

export interface MatchRow {
  id: string;
  title: string;
  league: string;       // real category
  channel?: string;     // source_tag (broadcast provider)
  venue?: string;
  status: "live" | "scheduled" | "finished";
  minute?: string;
  viewers?: number;
  accent?: [string, string]; // stream colors -> card accent
  poster?: string;
  href: string;
  source: "ppv" | "esx";
}

export async function loadFeed(): Promise<MatchRow[]> {
  const [ppvRes, esxRes] = await Promise.allSettled([fetchStreams(), fetchEsxCatalog()]);
  const rows: MatchRow[] = [];
  const now = Date.now() / 1000;

  if (ppvRes.status === "fulfilled") {
    for (const g of ppvRes.value) {
      for (const s of g.streams ?? []) {
        const live = isLive(s, now);
        const accent: [string, string] = (s as any).colors?.length
          ? (s as any).colors
          : ["#39e75f", "#1f7a3a"];
        rows.push({
          id: "ppv-" + s.id,
          title: s.name,
          league: s.category_name || g.category,
          channel: s.source_tag || undefined,
          status: live ? "live" : "scheduled",
          minute: live ? "LIVE" : undefined,
          viewers: s.viewers ?? 0,
          accent,
          poster: s.poster,
          href: `/event/${s.id}`,
          source: "ppv",
        });
      }
    }
  }

  if (esxRes.status === "fulfilled") {
    for (const e of esxRes.value) {
      if (!e.playable) continue;
      const st = esxStatus(e);
      rows.push({
        id: "esx-" + e.slug,
        title: e.tag,
        league: e.league,
        venue: e.category,
        status: st === "live" ? "live" : st === "upcoming" ? "scheduled" : "finished",
        minute: st === "live" ? "LIVE" : undefined,
        poster: e.poster,
        href: `/esportex/${e.slug}`,
        source: "esx",
      });
    }
  }

  return rows;
}

export function liveMatches(rows: MatchRow[]): MatchRow[] {
  return rows.filter((r) => r.status === "live");
}
export function scheduledMatches(rows: MatchRow[]): MatchRow[] {
  return rows.filter((r) => r.status === "scheduled");
}

// Real league list derived from the live feed (category + live count).
export function realLeagues(rows: MatchRow[]): { name: string; live: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (!r.league) continue;
    map.set(r.league, (map.get(r.league) ?? 0) + (r.status === "live" ? 1 : 0));
  }
  return [...map.entries()]
    .map(([name, live]) => ({ name, live }))
    .sort((a, b) => b.live - a.live)
    .slice(0, 8);
}

// Favorite-team seed: teams currently live (from title), for local favorite list.
export function liveTeams(rows: MatchRow[]): string[] {
  const out = new Set<string>();
  for (const r of rows) {
    if (r.status !== "live") continue;
    for (const part of r.title.split(/\s+(?:vs\.?|at|v)\s+/i)) {
      const t = part.trim();
      if (t && t.length > 2 && t.length < 40) out.add(t);
    }
  }
  return [...out];
}
