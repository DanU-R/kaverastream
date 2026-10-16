"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadFeed, MatchRow, liveMatches, scheduledMatches, footballMatches, bySport, sportLabel } from "@/lib/home";

export default function HomeClient() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let live = true;
    loadFeed().then((r) => live && setRows(r)).catch(() => live && setRows([])).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, []);

  const lives = useMemo(() => liveMatches(rows), [rows]);
  const upcoming = useMemo(() => scheduledMatches(rows), [rows]);
  const football = useMemo(() => footballMatches(rows), [rows]);
  const sports = useMemo(() => bySport(rows), [rows]);

  const featured = lives[0] ?? upcoming[0] ?? null;

  const filteredFootball = useMemo(() => {
    if (!q.trim()) return football;
    const s = q.toLowerCase();
    return football.filter((r) => r.title.toLowerCase().includes(s) || r.league.toLowerCase().includes(s));
  }, [q, football]);

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="flex items-center gap-2 lg:hidden">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari pertandingan, tim, liga..." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm placeholder:text-white/30 focus:border-emerald-500/40 focus:outline-none" />
      </div>

      {/* Featured */}
      {featured ? (
        <Link href={featured.href} className="group block overflow-hidden rounded-2xl border border-white/10 bg-black">
          <div className="relative aspect-video">
            {featured.poster ? (
              <img src={featured.poster} alt={featured.title} className="h-full w-full object-cover transition group-hover:scale-105" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute left-4 top-4 flex items-center gap-2">
              {featured.status === "live" && (
                <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
                </span>
              )}
              {featured.viewers ? <span className="text-xs text-white/80">👁 {fmt(featured.viewers)}</span> : null}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h1 className="text-xl font-bold text-white sm:text-3xl">{featured.title}</h1>
              <p className="mt-1 text-sm text-white/60">{featured.league}{featured.channel ? ` · ${featured.channel}` : ""}</p>
            </div>
          </div>
        </Link>
      ) : loading ? (
        <div className="aspect-video animate-pulse rounded-2xl bg-white/5" />
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <p className="text-white/40">Tidak ada pertandingan live saat ini.</p>
          <Link href="/esportex" className="mt-3 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/30">Lihat Jadwal →</Link>
        </div>
      )}

      {/* Live now */}
      {lives.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-bold">🔴 Live Sekarang</h2>
            <span className="text-sm text-red-400">{lives.length}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {lives.map((m) => <LiveCard key={m.id} m={m} />)}
          </div>
        </section>
      )}

      {/* Football section - prioritized */}
      {filteredFootball.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-bold">⚽ Sepak Bola</h2>
            <span className="text-sm text-white/40">{filteredFootball.length} pertandingan</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFootball.slice(0, 16).map((m) => <MatchCard key={m.id} m={m} />)}
          </div>
        </section>
      )}

      {/* Other sports */}
      {sports.filter((s) => s.sport !== "football" && s.sport !== "american_football" && s.sport !== "canadian_football").map((s) => (
        <section key={s.sport}>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-bold">{sportLabel(s.sport)}</h2>
            <span className="text-sm text-white/40">{s.matches.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {s.matches.slice(0, 8).map((m) => <MatchCard key={m.id} m={m} />)}
          </div>
        </section>
      ))}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold">📅 Jadwal Mendatang</h2>
          <div className="space-y-1.5">
            {upcoming.map((m) => (
              <Link key={m.id} href={m.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-white/5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.title}</div>
                  <div className="text-xs text-white/40">{m.league}</div>
                </div>
                {m.kickoff && (
                  <span className="shrink-0 text-xs text-white/40">
                    {new Date(m.kickoff * 1000).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </span>
                )}
                <span className="text-white/30">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {loading && <div className="h-40 animate-pulse rounded-xl bg-white/5" />}
    </div>
  );
}

function LiveCard({ m }: { m: MatchRow }) {
  return (
    <Link href={m.href} className="group relative w-64 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
      <div className="aspect-video overflow-hidden">
        {m.poster ? <img src={m.poster} alt={m.title} className="h-full w-full object-cover transition group-hover:scale-105" /> : <div className="h-full w-full bg-gradient-to-br from-emerald-900/30 to-black" />}
      </div>
      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
        <span className="h-1 w-1 animate-pulse rounded-full bg-white" /> LIVE
      </span>
      {m.viewers ? <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white/80">👁 {fmt(m.viewers)}</span> : null}
      <div className="p-3">
        <div className="line-clamp-2 text-sm font-medium">{m.title}</div>
        <div className="mt-0.5 text-xs text-white/40">{m.league}</div>
      </div>
    </Link>
  );
}

function MatchCard({ m }: { m: MatchRow }) {
  return (
    <Link href={m.href} className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-emerald-500/30 hover:bg-white/[0.07]">
      <div className="relative aspect-video overflow-hidden">
        {m.poster ? <img src={m.poster} alt={m.title} className="h-full w-full object-cover transition group-hover:scale-105" /> : <div className="h-full w-full bg-gradient-to-br from-white/5 to-black" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {m.status === "live" && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            <span className="h-1 w-1 animate-pulse rounded-full bg-white" /> LIVE
          </span>
        )}
        {m.kickoff && m.status !== "live" && (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white/60">
            {new Date(m.kickoff * 1000).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="line-clamp-2 text-sm font-medium">{m.title}</div>
        <div className="mt-0.5 text-xs text-white/40">{m.league}</div>
      </div>
    </Link>
  );
}

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
