// Unified feed: PPW streams + EsportEx events → sorted with football first.
import { Stream, fetchStreams, isLive } from "@/lib/api";
import { EsxEvent, esxStatus, fetchEsxCatalog } from "@/lib/esportex";

export interface MatchRow {
  id: string;
  title: string;
  league: string;
  channel?: string;
  sport: string;
  status: "live" | "scheduled" | "finished" | "247";
  viewers?: number;
  poster?: string;
  href: string;
  kickoff?: number;
  source: "ppv" | "esx";
}

function normalizeSport(raw: string): string {
  const s = raw.toLowerCase().replace(/[\s/-]+/g, "_");
  if (s.includes("foot") && !s.includes("rugby")) {
    if (s.includes("american") || s.includes("nfl") || s.includes("cfl") || s.includes("canadian")) return "american_football";
    if (s.includes("australian")) return "australian_football";
    if (s.includes("rugby")) return "rugby";
    return "football";
  }
  if (s.includes("basket") || s.includes("nba") || s.includes("nbl")) return "basketball";
  if (s.includes("hock") || s.includes("nhl") || s.includes("ice_hock")) return "hockey";
  if (s.includes("baseball") || s.includes("mlb")) return "baseball";
  if (s.includes("fight") || s.includes("wrest") || s.includes("boxing") || s.includes("mma") || s.includes("ufc") || s.includes("aew") || s.includes("wwe")) return "fight";
  if (s.includes("race") || s.includes("motogp") || s.includes("f1") || s.includes("formula") || s.includes("wec") || s.includes("nascar") || s.includes("rally")) return "race";
  if (s.includes("badminton") || s.includes("bwf")) return "badminton";
  if (s.includes("tennis") || s.includes("atp") || s.includes("wta")) return "tennis";
  if (s.includes("golf")) return "golf";
  if (s.includes("cricket")) return "cricket";
  if (s.includes("24/7") || s.includes("24_7")) return "entertainment";
  return "other";
}

const SPORT_PRIORITY: Record<string, number> = {
  football: 0, american_football: 1, australian_football: 2, rugby: 3,
  basketball: 4, hockey: 5, baseball: 6, tennis: 7, badminton: 8,
  golf: 9, cricket: 10, fight: 11, race: 12, other: 99, entertainment: 100,
};

const SPORT_LABELS: Record<string, string> = {
  football: "⚽ Sepak Bola",
  american_football: "🏈 American Football",
  australian_football: "🏉 AFL",
  rugby: "🏉 Rugby",
  basketball: "🏀 Basket",
  hockey: "🏒 Hoki",
  baseball: "⚾ Baseball",
  tennis: "🎾 Tenis",
  badminton: "🏸 Badminton",
  golf: "⛳ Golf",
  cricket: "🏏 Cricket",
  fight: "🥊 Fight & Wrestling",
  race: "🏎️ Racing",
  entertainment: "📺 24/7 Channels",
  other: "📺 Lainnya",
};

function sportPriority(sport: string): number {
  return SPORT_PRIORITY[sport] ?? 99;
}

export function sportLabel(sport: string): string {
  return SPORT_LABELS[sport] || "📺 Lainnya";
}

export async function loadFeed(): Promise<MatchRow[]> {
  const [ppvRes, esxRes] = await Promise.allSettled([fetchStreams(), fetchEsxCatalog()]);
  const rows: MatchRow[] = [];
  const now = Date.now() / 1000;

  if (ppvRes.status === "fulfilled") {
    for (const g of ppvRes.value) {
      for (const s of g.streams ?? []) {
        const rawSport = s.category_name || g.category || "";
        const live = isLive(s, now);
        const is247 = !!s.always_live;

        rows.push({
          id: "ppv-" + s.id,
          title: s.name,
          league: s.category_name || g.category,
          channel: s.source_tag || undefined,
          sport: normalizeSport(rawSport),
          status: is247 ? "247" : live ? "live" : "scheduled",
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
        sport: normalizeSport(e.category),
        status: st === "live" ? "live" : st === "upcoming" ? "scheduled" : "finished",
        poster: e.poster,
        href: `/esportex/${e.slug}`,
        kickoff: e.kickoff ? new Date(e.kickoff.replace(" ", "T")).getTime() / 1000 : undefined,
        source: "esx",
      });
    }
  }

  // Sort: live first, then football, then by sport priority, then by kickoff
  return rows.sort((a, b) => {
    // 24/7 channels always last
    if (a.status === "247" && b.status !== "247") return 1;
    if (a.status !== "247" && b.status === "247") return -1;
    // Live before scheduled
    if (a.status === "live" && b.status !== "live") return -1;
    if (a.status !== "live" && b.status === "live") return 1;
    // Sport priority (football first)
    const sp = sportPriority(a.sport) - sportPriority(b.sport);
    if (sp !== 0) return sp;
    // Soonest kickoff first
    return (a.kickoff ?? 0) - (b.kickoff ?? 0);
  });
}

// Real live matches (not 24/7 channels)
export function liveMatches(rows: MatchRow[]): MatchRow[] {
  return rows.filter((r) => r.status === "live");
}

// 24/7 channels (separate from live sports)
export function channels247(rows: MatchRow[]): MatchRow[] {
  return rows.filter((r) => r.status === "247");
}

// Upcoming matches (football first, soonest first)
export function scheduledMatches(rows: MatchRow[]): MatchRow[] {
  return rows
    .filter((r) => r.status === "scheduled")
    .sort((a, b) => {
      const sp = sportPriority(a.sport) - sportPriority(b.sport);
      if (sp !== 0) return sp;
      return (a.kickoff ?? 0) - (b.kickoff ?? 0);
    })
    .slice(0, 16);
}

// Football matches (live + upcoming, not 24/7)
export function footballMatches(rows: MatchRow[]): MatchRow[] {
  return rows.filter((r) =>
    (r.sport === "football" || r.sport === "american_football") &&
    r.status !== "247" && r.status !== "finished"
  );
}

// Group by sport (excluding 24/7)
export function bySport(rows: MatchRow[]): { sport: string; label: string; matches: MatchRow[] }[] {
  const groups = new Map<string, MatchRow[]>();
  for (const r of rows) {
    if (r.status === "247") continue; // 24/7 handled separately
    const key = r.sport || "other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  return [...groups.entries()]
    .map(([sport, matches]) => ({ sport, label: sportLabel(sport), matches }))
    .sort((a, b) => sportPriority(a.sport) - sportPriority(b.sport));
}
