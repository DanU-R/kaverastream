"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EsxEvent, fetchEsxCatalog } from "@/lib/esportex";
import { sportLabel } from "@/lib/home";

function status(ev: EsxEvent): "live" | "upcoming" | "ended" {
  const now = Date.now();
  const start = ev.kickoff ? new Date(ev.kickoff.replace(" ", "T")).getTime() : NaN;
  const end = ev.endTime ? new Date(ev.endTime.replace(" ", "T")).getTime() : NaN;
  if (isNaN(start)) return "upcoming";
  if (now < start) return "upcoming";
  if (!isNaN(end) && now > end) return "ended";
  return "live";
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
  return "other";
}

const SPORT_ORDER: Record<string, number> = {
  football: 0, american_football: 1, australian_football: 2, rugby: 3,
  basketball: 4, hockey: 5, baseball: 6, tennis: 7, badminton: 8,
  golf: 9, fight: 10, race: 11, other: 99,
};

export default function EsxClient() {
  const [events, setEvents] = useState<EsxEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [filter, setFilter] = useState<"all" | "live" | "upcoming">("all");

  useEffect(() => {
    let live = true;
    fetchEsxCatalog()
      .then((d) => live && setEvents(d))
      .catch((e: any) => live && setError(String(e?.message ?? e)))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, []);

  const cats = useMemo(() => {
    const s = new Set(events.map((e) => e.category));
    return [{ value: "all", label: "All" }, ...Array.from(s).map((c) => ({ value: c, label: sportLabel(normalizeSport(c)) }))];
  }, [events]);

  const liveCount = useMemo(() => events.filter((e) => e.playable && status(e) === "live").length, [events]);

  const list = useMemo(() => {
    let l = events;
    if (filter === "live") l = l.filter((e) => e.playable && status(e) === "live");
    else if (filter === "upcoming") l = l.filter((e) => status(e) === "upcoming");
    if (cat !== "all") l = l.filter((e) => e.category === cat);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((e) => e.tag.toLowerCase().includes(s) || e.league.toLowerCase().includes(s));
    }
    return [...l].sort((a, b) => {
      const sa = SPORT_ORDER[normalizeSport(a.category)] ?? 99;
      const sb = SPORT_ORDER[normalizeSport(b.category)] ?? 99;
      if (sa !== sb) return sa - sb;
      if (status(a) === "live" && status(b) !== "live") return -1;
      if (status(a) !== "live" && status(b) === "live") return 1;
      return (a.kickoff || "").localeCompare(b.kickoff || "");
    });
  }, [events, cat, q, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Schedule &amp; Live</h1>
        <p className="mt-1 text-sm text-outline">
          {events.length} events
          {liveCount > 0 && <span className="ml-2 text-primary-container">● {liveCount} live</span>}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-outline-variant/40 text-sm">
          {(["all", "live", "upcoming"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 transition ${filter === f ? "bg-primary-container/20 text-primary-container" : "text-outline hover:text-on-surface"}`}>
              {f === "live" ? (liveCount ? `Live (${liveCount})` : "Live") : f === "all" ? "All" : "Upcoming"}
            </button>
          ))}
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)}
          className="rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary-container/30">
          {cats.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search teams / leagues..."
          className="flex-1 rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary-container/30" />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-52 animate-pulse rounded-xl bg-surface-container-low" />)}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-error-container/20 bg-error-container/10 p-4 text-error">Failed: {error}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((e) => (
            <Link key={e.id} href={`/esportex/${e.id}`}
              className="group overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low transition-all duration-200 hover:-translate-y-1 hover:border-primary-container/60">
              <div className="relative aspect-video overflow-hidden bg-surface-container-highest">
                {e.poster ? <img src={e.poster} alt={e.tag} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" /> : <div className="h-full w-full bg-gradient-to-br from-surface-container to-surface-container-lowest" />}
                <div className="absolute left-2 top-2 flex gap-1.5">
                  {!e.playable ? (
                    <span className="rounded bg-surface-container-lowest/80 px-2 py-0.5 text-[11px] text-outline backdrop-blur">⚠ N/A</span>
                  ) : status(e) === "live" ? (
                    <span className="flex items-center gap-1 rounded bg-secondary-container px-2 py-0.5 text-[11px] font-extrabold uppercase text-on-surface">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
                    </span>
                  ) : status(e) === "upcoming" ? (
                    <span className="rounded bg-primary-container/20 px-2 py-0.5 text-[11px] font-semibold text-primary-container">SOON</span>
                  ) : (
                    <span className="rounded bg-surface-container-lowest/80 px-2 py-0.5 text-[11px] text-outline backdrop-blur">END</span>
                  )}
                </div>
                {(e.iframes || []).length > 0 && (
                  <span className="absolute bottom-2 right-2 rounded bg-surface-container-lowest/80 px-2 py-0.5 text-[11px] text-outline backdrop-blur">{e.iframes.length} src</span>
                )}
              </div>
              <div className="space-y-1.5 p-3.5">
                <div className="text-[11px] text-outline">{e.league}</div>
                <h3 className="line-clamp-2 text-sm font-bold text-on-surface transition-colors group-hover:text-primary-container">{e.tag}</h3>
                <div className="flex items-center justify-between border-t border-outline-variant/20 pt-1.5 text-[11px]">
                  {e.kickoff && <span className="text-outline">{new Date(e.kickoff.replace(" ", "T")).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>}
                  <span className="flex items-center gap-1 text-primary-container">
                    <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                    Stream
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {!loading && !error && !list.length && <p className="py-10 text-center text-outline">No matching events.</p>}
    </div>
  );
}
