"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EsxEvent, fetchEsxCatalog } from "@/lib/esportex";

function status(ev: EsxEvent): "live" | "upcoming" | "ended" {
  const now = Date.now();
  const start = ev.kickoff ? new Date(ev.kickoff.replace(" ", "T")).getTime() : NaN;
  const end = ev.endTime ? new Date(ev.endTime.replace(" ", "T")).getTime() : NaN;
  if (isNaN(start)) return "upcoming";
  if (now < start) return "upcoming";
  if (!isNaN(end) && now > end) return "ended";
  return "live";
}

export default function EsxClient() {
  const [events, setEvents] = useState<EsxEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const cats = useMemo(() => {
    const s = new Set(events.map((e) => e.category));
    return ["All", ...Array.from(s)];
  }, [events]);
  const [cat, setCat] = useState("All");
  const [filter, setFilter] = useState<"all" | "live" | "upcoming">("all");

  useEffect(() => {
    let live = true;
    fetchEsxCatalog()
      .then((d) => live && setEvents(d))
      .catch((e: any) => live && setError(String(e?.message ?? e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  const liveCount = useMemo(() => events.filter((e) => status(e) === "live").length, [events]);
  const list = useMemo(() => {
    let l = events;
    if (filter === "live") l = l.filter((e) => status(e) === "live");
    else if (filter === "upcoming") l = l.filter((e) => status(e) === "upcoming");
    if (cat !== "All") l = l.filter((e) => e.category === cat);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter(
        (e) => e.tag.toLowerCase().includes(s) || e.league.toLowerCase().includes(s)
      );
    }
    // prioritize live first
    return [...l].sort((a, b) => Number(status(b) === "live") - Number(status(a) === "live"));
  }, [events, cat, q, filter, liveCount]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            EsportEx <span className="text-primary">· Live</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {events.length} events —{" "}
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                {liveCount} live sekarang
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-white/10 text-sm">
            {(["all", "live", "upcoming"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 capitalize transition ${
                  filter === f ? "bg-white/15 text-zinc-50" : "text-muted-foreground hover:text-zinc-50"
                }`}
              >
                {f === "live" ? (liveCount ? `Live (${liveCount})` : "Live") : f}
              </button>
            ))}
          </div>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm"
          >
            {cats.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All sports" : c}
              </option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari tim / liga…"
            className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          Gagal muat: {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {list.map((e) => (
            <Link
              key={e.id}
              href={`/esportex/${e.id}`}
              className="group glass overflow-hidden rounded-2xl transition hover:border-primary/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.15)]"
            >
              <div className="relative aspect-video bg-surface-dim overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.poster}
                  alt={e.tag}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 flex gap-2">
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">{e.category}</span>
                  {status(e) === "live" && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-tertiary px-2 py-0.5 text-xs font-bold text-on-tertiary-container">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      LIVE
                    </span>
                  )}
                  {status(e) === "upcoming" && (
                    <span className="rounded-md bg-secondary/90 px-2 py-0.5 text-xs font-bold text-on-secondary">
                      UPCOMING
                    </span>
                  )}
                  {status(e) === "ended" && (
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-muted-foreground">
                      ENDED
                    </span>
                  )}
                </div>
                <span className="absolute bottom-2 right-2 rounded-md bg-surface-bright/80 px-2 py-0.5 text-[11px]">
                  {(e.iframes || []).length} src
                </span>
              </div>
              <div className="p-3 space-y-1">
                <div className="text-sm font-semibold line-clamp-2 leading-snug">{e.tag}</div>
                <div className="text-xs text-muted-foreground">{e.league}</div>
                {e.kickoff ? (
                  <div className="text-xs text-muted-foreground/70">
                    {new Date(e.kickoff.replace(" ", "T")).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
      {!loading && !error && !list.length && (
        <p className="text-muted-foreground py-10 text-center">Tidak ada event cocok.</p>
      )}
    </div>
  );
}
