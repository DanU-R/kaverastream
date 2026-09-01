import Link from "next/link";
import { EsxEvent, esxStatus } from "@/lib/esportex";

export default function EsxCard({ event }: { event: EsxEvent }) {
  const st = esxStatus(event);
  return (
    <Link
      href={`/esportex/${event.slug}`}
      className="card group overflow-hidden transition hover:border-accent-dim"
    >
      <div className="relative aspect-video overflow-hidden bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.poster}
          alt={event.tag}
          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="absolute left-2 top-2 flex gap-1.5">
          <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {event.category}
          </span>
          {st === "live" ? (
            <span className="inline-flex items-center gap-1.5 rounded bg-live px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />live
            </span>
          ) : st === "upcoming" ? (
            <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              upcoming
            </span>
          ) : (
            <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              ended
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1 p-3">
        <div className="line-clamp-2 text-sm font-medium leading-snug">{event.tag}</div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {event.league}
        </div>
        {event.kickoff ? (
          <div className="border-t hairline pt-1.5 text-[11px] text-muted-foreground">
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
