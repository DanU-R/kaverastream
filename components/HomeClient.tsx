"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CategoryGroup,
  Stream,
  fetchStreams,
  fmtTime,
  isLive,
} from "@/lib/api";
import { EsxEvent, esxStatus, fetchEsxCatalog } from "@/lib/esportex";
import EventCard from "@/components/EventCard";
import EsxCard from "@/components/EsxCard";

type SortMode = "live" | "viewers" | "kickoff" | "az";

export default function HomeClient() {
  const [data, setData] = useState<CategoryGroup[]>([]);
  const [esx, setEsx] = useState<EsxEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now() / 1000);

  const [q, setQ] = useState("");
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [showEsx, setShowEsx] = useState(true);
  const [sort, setSort] = useState<SortMode>("live");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // load both sources
  useEffect(() => {
    let live = true;
    let t: ReturnType<typeof setInterval>;
    (async () => {
      const loadAll = async () => {
        try {
          const results = await Promise.allSettled([fetchStreams(), fetchEsxCatalog()]);
          if (results[0].status === "fulfilled") setData(results[0].value);
          if (results[1].status === "fulfilled") setEsx(results[1].value as EsxEvent[]);
        } catch (e: any) {
          if (live) setError(String(e?.message ?? e));
        } finally {
          if (live) setLoading(false);
        }
      };
      await loadAll();
      if (live) t = setInterval(loadAll, 30_000); // auto-refresh 30s
    })();
    const clock = setInterval(() => setNow(Date.now() / 1000), 10_000);
    return () => {
      live = false;
      clearInterval(t);
      clearInterval(clock);
    };
  }, []);

  const all: Stream[] = useMemo(() => data.flatMap((g) => g.streams ?? []), [data]);
  const catNames = useMemo(
    () => [...new Set([...data.map((g) => g.category), ...esx.map((e) => e.category)])].sort(),
    [data, esx]
  );
  const liveAll = useMemo(
    () => {
      const ppv = all.filter((s) => isLive(s, now));
      const esxLive = esx.filter((e) => e.playable && esxStatus(e) === "live");
      return (
        [...ppv.map((s) => ({ key: "ppv-" + s.id, name: s.name, viewers: s.viewers ?? 0, live: true })),
         ...esxLive.map((e) => ({ key: "esx-" + e.id, name: e.tag, viewers: 0, live: true }))]
      );
    },
    [all, esx, now]
  );

  // unified filtered/sorted list (ppv + esx)
  const feed = useMemo(() => {
    const ppvItems = all
      .filter((s) => (selectedCats.size ? selectedCats.has(s.category_name) : true))
      .filter((s) => (q.trim() ? (s.name + " " + (s.tag || "") + " " + s.category_name).toLowerCase().includes(q.toLowerCase()) : true))
      .map((s) => ({ kind: "ppv" as const, key: "ppv-" + s.id, stream: s }));

    const esxItems = showEsx
      ? esx
          .filter((e) => (selectedCats.size ? selectedCats.has(e.category) : true))
          .filter((e) => (q.trim() ? (e.tag + " " + (e.league || "")).toLowerCase().includes(q.toLowerCase()) : true))
          .filter((e) => e.playable)
          .map((e) => ({ kind: "esx" as const, key: "esx-" + e.id, ev: e }))
      : [];

    const combined = [...ppvItems, ...esxItems];

    switch (sort) {
      case "viewers":
        return combined.sort((a, b) => (b.kind === "ppv" ? (b.stream?.viewers ?? 0) : 0) - (a.kind === "ppv" ? (a.stream?.viewers ?? 0) : 0));
      case "kickoff":
        return combined.sort((a, b) =>
          (a.kind === "ppv" ? a.stream?.starts_at ?? 0 : Date.now() / 1000) -
          (b.kind === "ppv" ? b.stream?.starts_at ?? 0 : Date.now() / 1000)
        );
      case "az":
        return combined.sort((a, b) =>
          (a.kind === "ppv" ? a.stream.name : a.ev?.tag || "").localeCompare(
            b.kind === "ppv" ? b.stream.name : b.ev?.tag || ""
          )
        );
      case "live":
      default:
        return combined.sort((a, b) => {
          const al = a.kind === "ppv" ? isLive(a.stream, now) : a.ev?.playable && esxStatus(a.ev as EsxEvent) === "live";
          const bl = b.kind === "ppv" ? isLive(b.stream, now) : b.ev?.playable && esxStatus(b.ev as EsxEvent) === "live";
          if (al !== bl) return al ? -1 : 1;
          const av = a.kind === "ppv" ? (a.stream.viewers ?? 0) : 0;
          const bv = b.kind === "ppv" ? (b.stream.viewers ?? 0) : 0;
          return bv - av;
        });
    }
  }, [all, esx, q, selectedCats, showEsx, sort, now]);

  const liveNowFeed = useMemo(
    () => feed.filter((i) => (i.kind === "ppv" ? isLive(i.stream as Stream, now) : (i.ev?.playable && esxStatus(i.ev as EsxEvent) === "live"))),
    [feed, now]
  );
  const upcomingFeed = useMemo(
    () => feed.filter((i) => !(i.kind === "ppv" ? isLive(i.stream as Stream, now) : esxStatus(i.ev as EsxEvent) === "live")),
    [feed, now]
  );

  const toggleCat = (c: string) => {
    setSelectedCats((prev) => {
      const n = new Set(prev);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });
  };

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="sticky top-16 z-30 space-y-3 rounded-xl border hairline bg-background/95 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari tim / liga / event…"
            className="min-w-[220px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent-dim"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="live">Live dulu</option>
            <option value="viewers">Terpopuler</option>
            <option value="kickoff">Jadwal</option>
            <option value="az">A–Z</option>
          </select>
          <button
            onClick={() => setShowEsx((v) => !v)}
            className={`rounded-lg px-3 py-2 text-sm transition ${showEsx ? "bg-accent/15 text-accent" : "bg-surface text-muted-foreground"}`}
          >
            EsportEx {showEsx ? "✓" : "✗"}
          </button>
          <Link
            href="/multiview"
            className="rounded-lg bg-surface px-3 py-2 text-sm text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
          >
            MultiView
          </Link>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-md border hairline px-2.5 py-1.5 font-mono text-xs text-accent">
            <span className="h-2 w-2 rounded-full bg-live" />
            {liveNowFeed.length} live
          </span>
          {selectedCats.size > 0 && (
            <button onClick={() => setSelectedCats(new Set())} className="rounded-lg bg-surface px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              Reset
            </button>
          )}
        </div>
        {/* category chips */}
        <div className="flex flex-wrap gap-1.5">
          {catNames.map((c) => (
            <button
              key={c}
              onClick={() => toggleCat(c)}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${selectedCats.has(c) ? "border-accent-dim bg-accent/10 text-accent" : "border-border bg-surface text-muted-foreground hover:text-foreground"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : error ? (
        <ErrorBox msg={error} />
      ) : (
        <>
          {/* Live Now section */}
          <section>
            <div className="mb-4 flex items-center gap-3 border-b hairline pb-2">
              <span className="h-2.5 w-2.5 rounded-full bg-live" />
              <h2 className="text-xl font-semibold">
                Live Now{" "}
                <span className="font-mono text-sm text-muted-foreground">({liveNowFeed.length})</span>
              </h2>
            </div>
            {liveNowFeed.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {liveNowFeed.map((i) =>
                  i.kind === "ppv" ? (
                    <EventCard key={i.key} stream={i.stream as Stream} />
                  ) : (
                    <EsxCard key={i.key} event={i.ev as EsxEvent} />
                  )
                )}
              </div>
            ) : (
              <Empty msg="Tidak ada yang live sekarang. Lihat upcoming di bawah." />
            )}
          </section>

          {/* Upcoming / rest */}
          <section>
            <h2 className="mb-4 border-b hairline pb-2 text-xl font-semibold">Upcoming &amp; Lainnya</h2>
            {upcomingFeed.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {upcomingFeed.map((i) =>
                  i.kind === "ppv" ? (
                    <EventCard key={i.key} stream={i.stream as Stream} />
                  ) : (
                    <EsxCard key={i.key} event={i.ev as EsxEvent} />
                  )
                )}
              </div>
            ) : (
              <Empty msg="Tidak ada event cocok dengan filter." />
            )}
          </section>
        </>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-xl bg-white/5" />
      ))}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">Failed: {msg}</div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 p-6 text-muted-foreground">{msg}</div>
  );
}
