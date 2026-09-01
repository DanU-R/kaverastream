import Link from "next/link";
import { EsxEvent, esxStatus } from "@/lib/esportex";

export default function EsxCard({ event }: { event: EsxEvent }) {
  const st = esxStatus(event);
  return (
    <Link
      href={`/esportex/${event.slug}`}
      className="group glass overflow-hidden rounded-2xl transition hover:border-primary/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.15)]"
    >
      <div className="relative aspect-video bg-surface-dim overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.poster}
          alt={event.tag}
          className="h-full w-full object-cover transition group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">{event.category}</span>
          {st === "live" ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-tertiary px-2 py-0.5 text-xs font-bold text-on-tertiary-container">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />LIVE
            </span>
          ) : st === "upcoming" ? (
            <span className="rounded-md bg-secondary/90 px-2 py-0.5 text-xs font-bold text-on-secondary">UPCOMING</span>
          ) : (
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-muted-foreground">ENDED</span>
          )}
        </div>
      </div>
      <div className="p-3 space-y-1">
        <div className="text-sm font-semibold line-clamp-2 leading-snug">{event.tag}</div>
        <div className="text-xs text-muted-foreground">{event.league}</div>
        {event.kickoff ? (
          <div className="text-xs text-muted-foreground/70">
            {fmtLocal(event.kickoff)}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function fmtLocal(s: string): string {
  const d = new Date(s.replace(" ", "T"));
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
