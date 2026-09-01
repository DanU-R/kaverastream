"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CategoryGroup,
  Stream,
  fetchStreams,
  fmtTime,
  isLive,
} from "@/lib/api";
import EventCard from "@/components/EventCard";

export default function HomeClient() {
  const [data, setData] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now() / 1000);

  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const d = await fetchStreams();
        if (live) {
          setData(d);
          setError(null);
        }
      } catch (e: any) {
        if (live) setError(String(e?.message ?? e));
      } finally {
        if (live) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 60_000); // refresh catalog
    const clock = setInterval(() => setNow(Date.now() / 1000), 10_000);
    return () => {
      live = false;
      clearInterval(t);
      clearInterval(clock);
    };
  }, []);

  const all = useMemo(() => data.flatMap((g) => g.streams ?? []), [data]);
  const liveNow = useMemo(
    () => all.filter((s) => isLive(s, now)).sort((a, b) => b.viewers - a.viewers),
    [all, now]
  );
  const cats = useMemo(() => data.filter((g) => g.streams?.length), [data]);

  return (
    <div className="space-y-10">
      <Hero liveCount={liveNow.length} total={all.length} />
      <section>
        <div className="mb-4 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          <h2 className="text-2xl font-bold">
            Live Now{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({liveNow.length})
            </span>
          </h2>
        </div>
        {loading ? (
          <GridSkeleton />
        ) : error ? (
          <ErrorBox msg={error} />
        ) : liveNow.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {liveNow.map((s) => (
              <EventCard key={s.id} stream={s} />
            ))}
          </div>
        ) : (
          <Empty msg="No live events right now. Check upcoming below." />
        )}
      </section>

      {cats.map((g) => (
        <section key={g.id}>
          <h2 className="mb-4 text-2xl font-bold">
            {g.category}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({g.streams.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {g.streams
              .slice()
              .sort((a, b) => a.starts_at - b.starts_at)
              .map((s) => (
                <EventCard key={s.id} stream={s} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Hero({ liveCount, total }: { liveCount: number; total: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-surface-container-low p-8 glow-emerald">
      <div className="relative z-10">
        <h1 className="text-4xl font-extrabold">
          Kavera<span className="text-primary">Stream</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Live sports dashboard — {liveCount} live now · {total} events listed.
        </p>
        <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Dot className="bg-primary" /> Live
          </span>
          <span className="inline-flex items-center gap-2">
            <Dot className="bg-secondary" /> Upcoming
          </span>
        </div>
      </div>
    </div>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${className}`} />;
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-56 animate-pulse rounded-xl bg-white/5 border border-white/5"
        />
      ))}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
      Failed to load: {msg}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 p-6 text-muted-foreground">
      {msg}
    </div>
  );
}
