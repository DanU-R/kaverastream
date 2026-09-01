// Data layer for the BALLSTREAM-style home: maps ppv streams + esportex into a
// unified "match" feed, selects a featured live match, live carousel, and
// live-scores rows.
import { Stream, fetchStreams, isLive } from "@/lib/api";
import { EsxEvent, esxStatus, fetchEsxCatalog } from "@/lib/esportex";

export interface MatchRow {
  id: string;
  title: string;
  league: string;
  venue?: string;
  status: "live" | "scheduled" | "finished";
  minute?: string;
  viewers?: number;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
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
        rows.push({
          id: "ppv-" + s.id,
          title: s.name,
          league: g.category || s.category_name,
          status: live ? "live" : "scheduled",
          minute: live ? "LIVE" : undefined,
          viewers: s.viewers ?? 0,
          home: s.name.split(" vs ")[0] || s.name,
          away: s.name.split(" vs ")[1] || "",
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
        home: e.tag.split(" vs ")[0] || e.tag,
        away: e.tag.split(" vs ")[1] || "",
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

export function pickFeatured(rows: MatchRow[]): MatchRow | null {
  // live football first, else first live, else null
  const live = rows.filter((r) => r.status === "live");
  const football = live.find((r) => r.league.toLowerCase().includes("league") || r.league.toLowerCase().includes("football"));
  return football ?? live[0] ?? null;
}

export function liveMatches(rows: MatchRow[]): MatchRow[] {
  return rows.filter((r) => r.status === "live");
}

export function schedules(rows: MatchRow[]): MatchRow[] {
  return rows.filter((r) => r.status === "scheduled");
}
