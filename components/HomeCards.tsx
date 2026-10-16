import Link from "next/link";
import type { MatchRow } from "@/lib/home";

function fmt(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

function fmtTime(ts?: number): string {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function FeaturedHero({ m }: { m: MatchRow }) {
  const isLive = m.status === "live";
  return (
    <section className="relative overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-2xl">
      <div className="relative flex min-h-[440px] w-full items-center md:h-[480px]">
        {m.poster ? (
          <div className="absolute inset-0 scale-[1.01] bg-cover bg-center brightness-[0.38]" style={{ backgroundImage: `url(${m.poster})` }} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-container to-surface-container-lowest" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent" />
        <div className="relative z-10 flex w-full flex-col justify-between gap-8 p-6 lg:flex-row lg:items-center md:p-10">
          <div className="max-w-2xl space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              {isLive && (
                <span className="pulse-live inline-flex items-center gap-1.5 rounded-md bg-secondary-container px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-on-surface">
                  <span className="h-2 w-2 rounded-full bg-white" /> LIVE 4K HDR
                </span>
              )}
              <span className="rounded-md border border-outline-variant/40 bg-surface-container-high/80 px-2.5 py-1 text-[11px] uppercase text-on-surface backdrop-blur-md">
                {m.league}{m.channel ? ` • ${m.channel}` : ""}
              </span>
              {m.kickoff && (
                <span className="inline-flex items-center gap-1 rounded-md border border-outline-variant/40 bg-surface-container-high/80 px-2.5 py-1 text-[11px] text-primary-container">
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>timer</span>
                  {fmtTime(m.kickoff)}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-on-surface md:text-4xl">{m.title}</h1>
            {m.viewers ? (
              <div className="flex items-center gap-2 text-sm text-outline">
                <span className="material-symbols-outlined text-sm text-primary-container">visibility</span>
                {fmt(m.viewers)} watching
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link href={m.href} className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-6 py-3 text-sm font-extrabold text-on-primary-container shadow-lg shadow-primary-container/20 transition-all hover:bg-tertiary active:scale-[0.98]">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                <span>Watch Live</span>
              </Link>
              <Link href={m.href} className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container/70 px-4 py-3 text-sm text-on-surface transition-all hover:bg-surface-container-high active:scale-[0.98]">
                <span className="material-symbols-outlined text-lg">grid_view</span>
                <span>Multi-View</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LiveCard({ m }: { m: MatchRow }) {
  const isLive = m.status === "live";
  return (
    <Link href={m.href} className="group relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low transition-all duration-200 hover:-translate-y-1 hover:border-primary-container/60">
      <div className="relative aspect-video w-full overflow-hidden bg-surface-container-highest">
        {m.poster ? <img src={m.poster} alt={m.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="h-full w-full bg-gradient-to-br from-surface-container to-surface-container-lowest" />}
        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          {isLive && (
            <span className="flex items-center gap-1 rounded bg-secondary-container px-2 py-0.5 text-[11px] font-extrabold uppercase text-on-surface">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
            </span>
          )}
          {m.kickoff && !isLive && (
            <span className="rounded bg-surface-container-lowest/80 px-2 py-0.5 text-[11px] text-on-surface backdrop-blur">{fmtTime(m.kickoff)}</span>
          )}
        </div>
        {m.viewers ? (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-surface-container-lowest/85 px-2 py-0.5 text-[11px] text-on-surface-variant backdrop-blur">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>visibility</span>
            {fmt(m.viewers)} watching
          </div>
        ) : null}
      </div>
      <div className="space-y-2 p-3.5">
        <div className="flex items-center justify-between text-[11px] text-outline">
          <span>{m.league}</span>
          {m.channel && <span className="font-semibold text-primary-container">{m.channel}</span>}
        </div>
        <h3 className="text-base font-bold text-on-surface transition-colors group-hover:text-primary-container">{m.title}</h3>
        <div className="flex items-center justify-between border-t border-outline-variant/20 pt-1">
          <span className="text-sm font-bold text-on-surface">{isLive ? "Live Now" : fmtTime(m.kickoff)}</span>
          <span className="flex items-center gap-1 rounded-md bg-surface-container px-2.5 py-1 text-[11px] text-on-surface transition-all hover:bg-primary-container hover:text-on-primary-container">
            <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>play_circle</span>
            Stream
          </span>
        </div>
      </div>
    </Link>
  );
}
