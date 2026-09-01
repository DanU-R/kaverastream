"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadFeed, liveMatches, MatchRow, realLeagues, scheduledMatches } from "@/lib/home";

export default function HomeClient() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(
    () => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") ?? "" : "")
  );

  useEffect(() => {
    // reflect navbar search ?q= changes
    const onPop = () => setQ(new URLSearchParams(window.location.search).get("q") ?? "");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    let live = true;
    loadFeed().then((r) => live && setRows(r)).catch(() => live && setRows([])).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, []);

  const leagues = useMemo(() => realLeagues(rows), [rows]);
  const lives = useMemo(() => liveMatches(rows), [rows]);
  const upcoming = useMemo(() => scheduledMatches(rows), [rows]);

  const featured = lives[0] ?? null;

  const filtered = useMemo(() => {
    if (!q.trim()) return lives;
    const s = q.toLowerCase();
    return lives.filter((r) => r.title.toLowerCase().includes(s) || r.league.toLowerCase().includes(s) || (r.channel ?? "").toLowerCase().includes(s));
  }, [q, lives]);

  return (
    <div className="space-y-6">
      {/* Mobile/top search (also on mobile shell) */}
      <div className="flex items-center gap-2 lg:hidden">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Cari pertandingan, tim, liga..."
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm placeholder:text-muted-soft focus:border-accent/40 focus:outline-none" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        {/* MAIN */}
        <div className="space-y-7">
          {featured ? (
            <FeaturedMatch m={featured} />
          ) : (
            <div className="bstream-card flex aspect-video flex-col items-center justify-center gap-3 text-center">
              <p className="text-text-secondary">{loading ? "Memuat..." : "Tidak ada pertandingan live saat ini."}</p>
              {!loading && <Link href="/esportex" className="btn-accent px-4 py-2 text-sm">Lihat Jadwal</Link>}
            </div>
          )}

          {/* Live now (searchable) */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight text-text-primary">
                {q.trim() ? `Hasil "…${q}"` : "LIVE SEKARANG"}
                <span className="ml-2 text-xs font-normal text-live">● {filtered.length} live</span>
              </h2>
              <Link href="/multiview" className="text-xs text-accent hover:underline">Buka MultiView</Link>
            </div>
            {loading ? <SkeletonGrid />
              : filtered.length ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {filtered.map((m) => <LiveCard key={m.id} m={m} />)}
                </div>
              ) : (
                <p className="text-sm text-muted-soft">Tidak ada live yang cocok.</p>
              )}
          </section>

          {/* Real leagues (from API categories + live counts) */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight text-text-primary">LIGA</h2>
              <span className="text-xs text-muted-soft">dari siaran live</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {leagues.map((l) => (
                <div key={l.name} className="bstream-card bstream-card-hover flex w-56 items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-text-primary">{l.name}</div>
                  </div>
                  {l.live > 0 && <span className="ml-2 shrink-0 rounded bg-live/15 px-2 py-0.5 text-[11px] font-semibold text-live">● {l.live} live</span>}
                </div>
              ))}
              {!leagues.length && <p className="text-sm text-muted-soft">Belum ada data liga.</p>}
            </div>
          </section>

          {/* Upcoming / schedule */}
          <section>
            <h2 className="mb-3 text-base font-semibold tracking-tight text-text-primary">JADWAL</h2>
            {upcoming.length ? (
              <div className="space-y-1.5">
                {upcoming.slice(0, 8).map((m) => <UpcomingRow key={m.id} m={m} />)}
              </div>
            ) : (
              <p className="text-sm text-muted-soft">Tidak ada jadwal mendatang.</p>
            )}
          </section>
        </div>

        {/* RIGHT RAIL */}
        <aside className="hidden space-y-6 xl:block">
          <RailSection title="SKOR LANGSUNG">
            {lives.length ? lives.slice(0, 6).map((m) => (
              <Link key={m.id} href={m.href} className="block rounded-lg px-2 py-2 hover:bg-surface-hover">
                <div className="flex items-center justify-between text-[11px] text-muted-soft">
                  <span className="font-semibold text-live">● LIVE</span>
                  <span className="truncate pl-2 font-mono">{m.viewers ? `👁 ${fmt(m.viewers)}` : ""}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between">
                  <span className="truncate text-sm text-text-primary">{m.title}</span>
                </div>
                {m.channel && <div className="mt-0.5 truncate text-[11px] text-muted-soft">{m.channel}</div>}
              </Link>
            )) : <p className="text-sm text-muted-soft">Belum ada live.</p>}
          </RailSection>

          <RailSection title="JADWAL HARI INI">
            {upcoming.length ? upcoming.slice(0, 5).map((m) => (
              <div key={m.id} className="rounded-lg px-2 py-2">
                <div className="truncate text-sm text-muted-foreground">{m.title}</div>
                <div className="text-[11px] text-muted-soft">{m.league}</div>
              </div>
            )) : <p className="text-sm text-muted-soft">Tidak ada jadwal.</p>}
          </RailSection>

          <RailSection title="TOP LIVE">
            {[...lives].sort((a, b) => (b.viewers ?? 0) - (a.viewers ?? 0)).slice(0, 5).map((m, i) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                <span className="w-4 font-mono text-xs text-muted-soft">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{m.title}</span>
                <span className="font-mono text-[11px] text-muted-soft">👁 {fmt(m.viewers ?? 0)}</span>
              </div>
            ))}
            {!lives.length && <p className="text-sm text-muted-soft">Belum ada data.</p>}
          </RailSection>
        </aside>
      </div>
    </div>
  );
}

function FeaturedMatch({ m }: { m: MatchRow }) {
  const [c1, c2] = m.accent ?? ["#39e75f", "#1f7a3a"];
  return (
    <section>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="relative aspect-video overflow-hidden bg-surface-elevated">
          {m.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.poster} alt={m.title} className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c1}22, ${c2}33)` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute left-4 top-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded bg-live px-2 py-0.5 text-xs font-bold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />LIVE
            </span>
            {m.viewers ? <span className="text-xs text-white/90">👁 {fmt(m.viewers)}</span> : null}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h1 className="text-xl font-semibold text-white sm:text-3xl">{m.title}</h1>
            <div className="mt-1 text-sm text-white/70">
              {m.league}{m.channel ? ` · ${m.channel}` : ""}{m.venue ? ` · ${m.venue}` : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <Link href={m.href} className="btn-accent px-5 py-2 text-sm">▶ Tonton</Link>
          <span className="text-xs text-muted-soft">Klik utk buka player</span>
          <div className="ml-auto flex gap-2">
            <span className="rounded-lg bg-surface-hover px-3 py-1.5 text-xs text-muted-foreground">{m.league}</span>
            {m.channel && <span className="rounded-lg bg-surface-hover px-3 py-1.5 text-xs text-muted-foreground">{m.channel}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

function LiveCard({ m }: { m: MatchRow }) {
  const [c1] = m.accent ?? ["#39e75f"];
  return (
    <Link href={m.href} className="bstream-card bstream-card-hover w-60 shrink-0 overflow-hidden !p-0">
      <div className="relative aspect-video overflow-hidden bg-surface-elevated">
        {m.poster ? <img src={m.poster} alt={m.title} className="h-full w-full object-cover" />
          : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c1}22,#0000)` }} />}
        <span className="absolute left-2 top-2 rounded bg-live px-1.5 py-0.5 text-[10px] font-bold text-white">LIVE</span>
        {m.viewers ? <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white/90">👁 {fmt(m.viewers)}</span> : null}
      </div>
      <div className="space-y-1 p-3">
        <div className="line-clamp-2 text-sm font-medium text-text-primary">{m.title}</div>
        <div className="text-xs text-muted-soft">{m.league}{m.channel ? ` · ${m.channel}` : ""}</div>
      </div>
    </Link>
  );
}

function UpcomingRow({ m }: { m: MatchRow }) {
  return (
    <Link href={m.href} className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-surface-hover">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-text-primary">{m.title}</div>
        <div className="text-[11px] text-muted-soft">{m.league}{m.channel ? ` · ${m.channel}` : ""}</div>
      </div>
      <span className="text-xs text-muted-soft">→</span>
    </Link>
  );
}

function RailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold tracking-tight text-text-primary">{title}</h3>
      </div>
      <div className="bstream-card !p-2">{children}</div>
    </section>
  );
}

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function SkeletonGrid() {
  return <div className="flex gap-3">{[1, 2, 3].map((i) => <div key={i} className="h-36 w-60 animate-pulse rounded-xl bg-surface" />)}</div>;
}
