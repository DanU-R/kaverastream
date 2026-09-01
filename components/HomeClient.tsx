"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadFeed, liveMatches, MatchRow, pickFeatured } from "@/lib/home";

export default function HomeClient() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    loadFeed()
      .then((r) => live && setRows(r))
      .catch(() => live && setRows([]))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, []);

  const featured = pickFeatured(rows);
  const lives = liveMatches(rows);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_350px]">
      {/* MAIN */}
      <div className="space-y-6">
        {/* Featured live match */}
        {featured ? (
          <FeaturedMatch m={featured} />
        ) : (
          <div className="bstream-card flex aspect-video flex-col items-center justify-center gap-3 text-center">
            <p className="text-text-secondary">Tidak ada pertandingan live saat ini.</p>
            <Link href="/esportex" className="btn-accent px-4 py-2 text-sm">Lihat Jadwal</Link>
          </div>
        )}

        {/* Live carousel */}
        <Section title="LIVE SEKARANG" row>
          {loading ? (
            <SkeletonGrid />
          ) : lives.length ? (
            lives.map((m) => <LiveCard key={m.id} m={m} />)
          ) : (
            <p className="text-sm text-muted-soft">Belum ada live lain.</p>
          )}
        </Section>

        {/* League recs */}
        <Section title="POPULER & REKOMENDASI" row>
          {LEAGUES.map((l) => (
            <div key={l.name} className="bstream-card bstream-card-hover flex w-40 shrink-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-hover text-lg">{l.icon}</div>
              <div>
                <div className="text-sm font-medium text-text-primary">{l.name}</div>
                <div className="text-xs text-muted-soft">{l.country}</div>
              </div>
            </div>
          ))}
        </Section>
      </div>

      {/* RIGHT RAIL */}
      <aside className="hidden space-y-6 xl:block">
        {/* Live scores */}
        <Section title="SKOR LANGSUNG">
          <div className="space-y-2">
            {lives.slice(0, 6).map((m) => (
              <Link key={m.id} href={m.href} className="block rounded-lg px-2 py-2 hover:bg-surface-hover">
                <div className="flex items-center justify-between text-[11px] text-muted-soft">
                  <span className="font-semibold text-live">LIVE</span>
                  <span>{m.league}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="truncate">{m.home}</span>
                  <span className="mx-2 shrink-0 font-mono text-text-secondary">{m.viewers ?? ""}</span>
                </div>
                {m.away && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="truncate">{m.away}</span>
                  </div>
                )}
              </Link>
            ))}
            {!lives.length && <p className="text-sm text-muted-soft">Belum ada skor.</p>}
          </div>
        </Section>

        {/* Schedule */}
        <Section title="JADWAL HARI INI">
          <div className="space-y-2">
            {rows.filter((r) => r.status === "scheduled").slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm">
                <span className="truncate text-muted-foreground">{m.home}</span>
                <span className="mx-2 text-[10px] text-muted-soft">vs</span>
                <span className="truncate text-muted-foreground">{m.away}</span>
              </div>
            ))}
            {!rows.some((r) => r.status === "scheduled") && (
              <p className="text-sm text-muted-soft">Tidak ada jadwal.</p>
            )}
          </div>
        </Section>

        {/* Highlights placeholder */}
        <Section title="HIGHLIGHT TERBARU">
          <div className="space-y-2">
            {rows.filter((r) => r.status === "finished").slice(0, 4).map((m) => (
              <div key={m.id} className="flex gap-2 rounded-lg px-2 py-2">
                <div className="aspect-video w-24 shrink-0 rounded bg-surface-hover" />
                <div className="min-w-0">
                  <div className="truncate text-sm text-text-primary">{m.title}</div>
                  <div className="text-xs text-muted-soft">{m.league}</div>
                </div>
              </div>
            ))}
            {!rows.some((r) => r.status === "finished") && (
              <p className="text-sm text-muted-soft">Belum ada highlight.</p>
            )}
          </div>
        </Section>
      </aside>
    </div>
  );
}

// ---- Featured match hero (spec §10) ----
function FeaturedMatch({ m }: { m: MatchRow }) {
  return (
    <section>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="relative aspect-video bg-surface-elevated">
          {m.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.poster} alt={m.title} className="h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          {/* live tag */}
          <div className="absolute left-4 top-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded bg-live px-2 py-0.5 text-xs font-bold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />LIVE
            </span>
            <span className="text-xs text-white/90">👁 {m.viewers?.toLocaleString() ?? "—"}</span>
          </div>
          {/* scoreboard */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <div className="text-center text-2xl font-semibold text-white sm:text-4xl">{m.title}</div>
            <div className="mt-1 text-sm text-white/70">{m.league}{m.venue ? ` · ${m.venue}` : ""}</div>
          </div>
        </div>
        {/* controls bar */}
        <div className="flex items-center gap-4 px-4 py-3">
          <button aria-label="Play" className="btn-accent px-4 py-1.5 text-sm">▶ Watch</button>
          <span className="text-xs text-muted-soft">👁 {m.viewers?.toLocaleString() ?? 0}</span>
          <div className="ml-auto flex gap-1">
            <button className="btn-ghost px-3 py-1.5 text-xs">Share</button>
            <button className="btn-ghost px-3 py-1.5 text-xs">Flag</button>
          </div>
        </div>
      </div>
      {/* metadata */}
      <div className="mt-3 flex items-center gap-3">
        <h1 className="max-w-md truncate text-lg font-semibold text-text-primary">{m.title}</h1>
        <Link href={m.href} className="ml-auto btn-ghost px-3 py-1.5 text-sm">Buka <span aria-hidden>→</span></Link>
      </div>
    </section>
  );
}

function LiveCard({ m }: { m: MatchRow }) {
  return (
    <Link href={m.href} className="bstream-card bstream-card-hover w-64 shrink-0 overflow-hidden">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-elevated">
        {m.poster ? <img src={m.poster} alt={m.title} className="h-full w-full object-cover" /> : null}
        <span className="absolute left-2 top-2 rounded bg-live px-1.5 py-0.5 text-[10px] font-bold text-white">LIVE</span>
        <span className="absolute bottom-2 right-2 font-mono text-[10px] text-white/90">👁 {m.viewers ?? 0}</span>
      </div>
      <div className="mt-2 space-y-1">
        <div className="line-clamp-1 text-sm font-medium text-text-primary">{m.title}</div>
        <div className="text-xs text-muted-soft">{m.league}</div>
      </div>
    </Link>
  );
}

function Section({ title, row = false, children }: { title: string; row?: boolean; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-text-primary">{title}</h2>
        <button className="text-xs text-accent hover:underline">Lihat Semua</button>
      </div>
      <div className={row ? "flex gap-3 overflow-x-auto pb-2" : ""}>{children}</div>
    </section>
  );
}

const LEAGUES = [
  { name: "Premier League", country: "Inggris", icon: "🏴" },
  { name: "La Liga", country: "Spanyol", icon: "🇪🇸" },
  { name: "Serie A", country: "Italia", icon: "🇮🇹" },
  { name: "Bundesliga", country: "Jerman", icon: "🇩🇪" },
  { name: "Ligue 1", country: "Prancis", icon: "🇫🇷" },
];

function SkeletonGrid() {
  return (
    <div className="flex gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-40 w-64 animate-pulse rounded-xl bg-surface" />
      ))}
    </div>
  );
}
