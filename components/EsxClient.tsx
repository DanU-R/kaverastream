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
    return [{ value: "all", label: "Semua" }, ...Array.from(s).map((c) => ({ value: c, label: sportLabel(normalizeSport(c)) }))];
  }, [events]);

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
      // Football first (using normalized sport)
      const sa = SPORT_ORDER[normalizeSport(a.category)] ?? 99;
      const sb = SPORT_ORDER[normalizeSport(b.category)] ?? 99;
      if (sa !== sb) return sa - sb;
      // Live first
      if (status(a) === "live" && status(b) !== "live") return -1;
      if (status(a) !== "live" && status(b) === "live") return 1;
      // Then by kickoff
      return (a.kickoff || "").localeCompare(b.kickoff || "");
    });
  }, [events, cat, q, filter]);

  const liveCount = useMemo(() => events.filter((e) => e.playable && status(e) === "live").length, [events]);
  const footballCount = useMemo(() => events.filter((e) => e.category === "football").length, [events]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Jadwal & Live</h1>
        <p className="mt-1 text-sm text-white/40">
          {events.length} events
          {footballCount > 0 && <span className="ml-2 text-emerald-400">⚽ {footballCount} sepak bola</span>}
          {liveCount > 0 && <span className="ml-2 text-red-400">● {liveCount} live</span>}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-white/10 text-sm">
          {(["all", "live", "upcoming"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 capitalize transition ${filter === f ? "bg-emerald-500/20 text-emerald-400" : "text-white/40 hover:text-white/70"}`}>
              {f === "live" ? (liveCount ? `Live (${liveCount})` : "Live") : f === "all" ? "Semua" : "Upcoming"}
            </button>
          ))}
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-emerald-500/30">
          {cats.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari tim / liga..."
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-emerald-500/30" />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-52 animate-pulse rounded-xl bg-white/5" />)}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">Gagal muat: {error}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {list.map((e) => (
            <Link key={e.id} href={`/esportex/${e.id}`}
              className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-emerald-500/30 hover:bg-white/[0.07]">
              <div className="relative aspect-video overflow-hidden">
                {e.poster ? (
                  <img src={e.poster} alt={e.tag} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                ) : <div className="h-full w-full bg-gradient-to-br from-white/5 to-black" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute left-2 top-2 flex gap-1.5">
                  {!e.playable ? (
                    <span className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white/40">⚠ N/A</span>
                  ) : status(e) === "live" ? (
                    <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      <span className="h-1 w-1 animate-pulse rounded-full bg-white" /> LIVE
                    </span>
                  ) : status(e) === "upcoming" ? (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">SOON</span>
                  ) : (
                    <span className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white/30">END</span>
                  )}
                </div>
                {(e.iframes || []).length > 0 && (
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white/50">{e.iframes.length} src</span>
                )}
              </div>
              <div className="p-3">
                <div className="line-clamp-2 text-sm font-medium leading-snug">{e.tag}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-white/40">
                  <span>{e.league}</span>
                  {e.kickoff && (
                    <span className="text-white/30">· {new Date(e.kickoff.replace(" ", "T")).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {!loading && !error && !list.length && <p className="py-10 text-center text-white/40">Tidak ada event cocok.</p>}
    </div>
  );
}
