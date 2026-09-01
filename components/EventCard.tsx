import Link from "next/link";
import { fmtTime, isLive, Stream } from "@/lib/api";

export default function EventCard({ stream }: { stream: Stream }) {
  const live = isLive(stream);
  return (
    <Link
      href={`/event/${stream.id}`}
      className="card group overflow-hidden transition hover:border-accent-dim"
    >
      <div className="relative aspect-video overflow-hidden bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stream.poster}
          alt={stream.name}
          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="absolute left-2 top-2 flex gap-1.5">
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded bg-live px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              live
            </span>
          ) : (
            <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              upcoming
            </span>
          )}
          {stream.always_live ? (
            <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              24/7
            </span>
          ) : null}
        </div>
        {live ? (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-accent">
            👁 {stream.viewers ?? 0}
          </span>
        ) : null}
      </div>
      <div className="space-y-1 p-3">
        <div className="line-clamp-2 text-sm font-medium leading-snug">{stream.name}</div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span>{stream.category_name}</span>
          {stream.source_tag ? (
            <>
              <span className="text-border">·</span>
              <span>{stream.source_tag}</span>
            </>
          ) : null}
        </div>
        {!stream.always_live && (
          <div className="flex items-center justify-between border-t hairline pt-1.5 text-[11px] text-muted-foreground">
            <span>{fmtTime(stream.starts_at)}</span>
            {!live && <Countdown ts={stream.starts_at} now={Date.now() / 1000} />}
          </div>
        )}
      </div>
    </Link>
  );
}

function Countdown({ ts, now }: { ts: number; now: number }) {
  const sec = Math.max(0, Math.floor(ts - now));
  if (sec <= 60) return <span className="font-mono font-semibold text-accent">~{sec}s</span>;
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return <span className="font-mono">{h}h{m % 60}m</span>;
  return <span className="font-mono">{m}m</span>;
}
