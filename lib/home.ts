// Unified feed: PPW streams + EsportEx events → sorted with football first.
import { Stream, fetchStreams, isLive } from "@/lib/api";
import { EsxEvent, esxStatus, fetchEsxCatalog } from "@/lib/esportex";

export interface MatchRow {
  id: string;
  title: string;
  league: string;
  channel?: string;
  sport: string;
  status: "live" | "scheduled" | "finished";
  viewers?: number;
  poster?: string;
  href: string;
  kickoff?: number;
  source: "ppv" | "esx";
}

// Sport priority: football first, then others alphabetical
const SPORT_PRIORITY: Record<string, number> = {
  football: 0,
  american_football: 1,
  amfootball: 1,
  basketball: 2,
  hockey: 3,
  baseball: 4,
  canadian_football: 5,
  fight: 6,
  race: 7,
  badminton: 8,
  tennis: 9,
  other: 99,
};

function sportPriority(sport: string): number {
  const s = sport.toLowerCase().replace(/\s+/g, "_");
  return SPORT_PRIORITY[s] ?? 99;
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
          league: s.category_name || g.category,
          channel: s.source_tag || undefined,
          sport: (s.category_name || g.category || "").toLowerCase().replace(/\s+/g, "_"),
          status: live ? "live" : s.always_live ? "live" : "scheduled",
          viewers: typeof s.viewers === "number" ? s.viewers : 0,
          poster: s.poster,
          href: `/event/${s.id}`,
          kickoff: s.starts_at || undefined,
          source: "ppv",
        });
      }
    }
  }

  if (esxRes.status === "fulfilled") {
    for (const e of esxRes.value) {
      const st = esxStatus(e);
      rows.push({
        id: "esx-" + e.slug,
        title: e.tag,
        league: e.league,
        sport: e.category.toLowerCase().replace(/\s+/g, "_"),
        status: st === "live" ? "live" : st === "upcoming" ? "scheduled" : "finished",
        poster: e.poster,
        href: `/esportex/${e.slug}`,
        kickoff: e.kickoff ? new Date(e.kickoff.replace(" ", "T")).getTime() / 1000 : undefined,
        source: "esx",
      });
    }
  }

  // Sort: live first, then football, then by sport priority, then by kickoff time
  return rows.sort((a, b) => {
    if (a.status === "live" && b.status !== "live") return -1;
    if (a.status !== "live" && b.status === "live") return 1;
    const sp = sportPriority(a.sport) - sportPriority(b.sport);
    if (sp !== 0) return sp;
    return (a.kickoff ?? 0) - (b.kickoff ?? 0);
  });
}

export function liveMatches(rows: MatchRow[]): MatchRow[] {
  return rows.filter((r) => r.status === "live");
}

export function scheduledMatches(rows: MatchRow[]): MatchRow[] {
  return rows.filter((r) => r.status === "scheduled").slice(0, 12);
}

export function footballMatches(rows: MatchRow[]): MatchRow[] {
  return rows.filter((r) =>
    r.sport === "football" || r.sport === "american_football" || r.sport === "canadian_football"
  );
}

export function bySport(rows: MatchRow[]): { sport: string; label: string; matches: MatchRow[] }[] {
  const groups = new Map<string, MatchRow[]>();
  for (const r of rows) {
    const key = r.sport || "other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  return [...groups.entries()]
    .map(([sport, matches]) => ({
      sport,
      label: sportLabel(sport),
      matches,
    }))
    .sort((a, b) => sportPriority(a.sport) - sportPriority(b.sport));
}

export function sportLabel(sport: string): string {
  const labels: Record<string, string> = {
    football: "⚽ Sepak Bola",
    american_football: "🏈 American Football",
    amfootball: "🏈 American Football",
    basketball: "🏀 Basket",
    hockey: "🏒 Hoki",
    baseball: "⚾ Baseball",
    canadian_football: "🏈 CFL",
    fight: "🥊 Fight",
    race: "🏎️ Race",
    badminton: "🏸 Badminton",
    tennis: "🎾 Tennis",
  };
  return labels[sport] || sport.charAt(0).toUpperCase() + sport.slice(1);
}
