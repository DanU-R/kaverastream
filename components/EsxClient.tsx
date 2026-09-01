"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EsxEvent, fetchEsxCatalog } from "@/lib/esportex";

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

  const list = useMemo(() => {
    let l = events;
    if (cat !== "All") l = l.filter((e) => e.category === cat);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter(
        (e) => e.tag.toLowerCase().includes(s) || e.league.toLowerCase().includes(s)
      );
    }
    return l;
  }, [events, cat, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">EsportEx · Live</h1>
          <p className="text-sm text-muted-foreground">
            {events.length} events — Nonton Bareng Sport
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
                <span className="absolute top-2 left-2 rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-on-primary-fixed">
                  {e.category}
                </span>
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
