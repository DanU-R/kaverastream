import Link from "next/link";
import type { MatchRow } from "@/lib/home";

function fmtTime(ts?: number): string {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function fmtTimeShort(ts?: number): string {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function FootballCard({ m }: { m: MatchRow }) {
  const isLive = m.status === "live";
  return (
    <Link href={m.href} className="block space-y-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 transition-colors hover:border-primary-container/40">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold uppercase tracking-wider text-outline">{m.league}</span>
        {isLive ? (
          <span className="inline-flex items-center gap-1 font-bold text-primary-container">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-primary-container" /> Live
          </span>
        ) : m.kickoff ? (
          <span className="rounded bg-surface-container px-2 py-0.5 font-semibold text-on-surface">{fmtTimeShort(m.kickoff)}</span>
        ) : null}
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-on-surface">{m.title}</span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-outline-variant/20 pt-2">
        <span className="text-xs text-outline">{m.channel || m.league}</span>
        {isLive ? (
          <button className="flex items-center gap-1.5 rounded-lg bg-primary-container px-3 py-1.5 text-sm font-bold text-on-primary-container transition-colors hover:bg-tertiary">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            Watch
          </button>
        ) : (
          <button className="flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-1.5 text-sm text-on-surface transition-colors hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-sm">notifications_active</span>
            Set Alert
          </button>
        )}
      </div>
    </Link>
  );
}

export function ScheduleRow({ m }: { m: MatchRow }) {
  const timeStr = m.kickoff ? fmtTimeShort(m.kickoff) : "";
  return (
    <Link href={m.href} className="flex flex-col gap-4 p-3.5 transition-colors hover:bg-surface-container/60 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex items-center gap-4">
        <div className="w-20 shrink-0 rounded-lg border border-outline-variant/30 bg-surface-container-highest/50 px-2 py-1.5 text-center">
          <div className="text-sm font-bold text-primary-container">{timeStr || "TBD"}</div>
          <div className="text-[11px] text-outline">{m.status === "live" ? "Live" : "Soon"}</div>
        </div>
        <span className="shrink-0 rounded border border-outline-variant/30 bg-surface-container px-2.5 py-1 text-[11px] font-bold text-on-surface">
          {m.channel || "Kavera HD"}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-outline">{m.league}</span>
          </div>
          <h4 className="mt-0.5 text-base font-bold text-on-surface">{m.title}</h4>
        </div>
      </div>
      <div className="flex items-center gap-3 self-end sm:self-auto">
        <button className="rounded-lg border border-outline-variant/40 bg-surface-container p-2 text-on-surface transition-colors hover:bg-surface-container-high">
          <span className="material-symbols-outlined text-sm">notifications</span>
        </button>
        <button className="flex items-center gap-1 rounded-lg bg-primary-container px-3 py-1.5 text-sm font-bold text-on-primary-container transition-colors hover:bg-tertiary">
          <span className="material-symbols-outlined text-sm">bookmark</span>
          RSVP
        </button>
      </div>
    </Link>
  );
}

export function ChannelCard({ m, idx }: { m: MatchRow; idx: number }) {
  const chNum = 101 + idx * 3;
  const initials = m.title.substring(0, 2).toUpperCase();
  return (
    <Link href={m.href} className="group space-y-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 transition-all hover:border-primary-container/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-highest text-sm font-black text-primary-container">
            {initials}
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">{m.title}</h3>
            <span className="text-[11px] text-outline">Ch. {chNum} • 1080p</span>
          </div>
        </div>
        <span className="h-2 w-2 rounded-full bg-secondary-container" />
      </div>
      <div className="space-y-1.5 pt-1">
        <div className="text-[11px] font-bold uppercase text-primary-container">Now Playing</div>
        <p className="line-clamp-1 text-sm font-bold text-on-surface">{m.title}</p>
        <div className="space-y-1 pt-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div className="h-full w-[65%] bg-primary-container" />
          </div>
          <div className="flex justify-between text-[11px] text-outline">
            <span>24/7 Stream</span>
            <span>{m.viewers ? `${m.viewers} watching` : "Always On"}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-outline-variant/20 pt-2 text-[11px]">
        <span className="text-outline">Up Next:</span>
        <span className="font-medium text-on-surface-variant">{m.league}</span>
      </div>
    </Link>
  );
}
