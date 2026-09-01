import Link from "next/link";
import { fmtTime, isLive, Stream } from "@/lib/api";

export default function EventCard({ stream }: { stream: Stream }) {
  const live = isLive(stream);
  return (
    <Link
      href={`/event/${stream.id}`}
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900 transition hover:border-white/25"
    >
      <div className="relative aspect-video bg-zinc-800 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stream.poster}
          alt={stream.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              LIVE
            </span>
          ) : (
            <span className="rounded-md bg-amber-600/90 px-2 py-0.5 text-xs font-semibold">
              UPCOMING
            </span>
          )}
          {stream.always_live ? (
            <span className="rounded-md bg-zinc-900/80 px-2 py-0.5 text-xs">
              24/7
            </span>
          ) : null}
        </div>
        {live ? (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium">
            👁 {stream.viewers ?? 0}
          </span>
        ) : null}
      </div>
      <div className="p-3 space-y-1">
        <div className="text-sm font-semibold line-clamp-2 leading-snug">
          {stream.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {stream.category_name}
        </div>
        {stream.source_tag ? (
          <div className="text-xs text-muted-foreground/70">
            {stream.source_tag}
          </div>
        ) : null}
        {!stream.always_live && (
          <div className="text-xs text-muted-foreground/70">
            {fmtTime(stream.starts_at)}
          </div>
        )}
      </div>
    </Link>
  );
}
