"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Stream, fetchStreams, isLive } from "@/lib/api";
import { fetchEsxEvent } from "@/lib/esportex";

interface WatchItem {
  key: string;
  title: string;
  iframe: string;
}

export default function MultiViewClient() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [candidates, setCandidates] = useState<{ key: string; title: string; href: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const groups = await fetchStreams();
        const now = Date.now() / 1000;
        const lives = groups
          .flatMap((g) => g.streams ?? [])
          .filter((s) => isLive(s, now))
          .slice(0, 8);
        const cands = lives.map((s) => ({ key: "ppv-" + s.id, title: s.name, href: `/event/${s.id}` }));
        if (live) {
          setCandidates(cands);
          setLoading(false);
        }
      } catch {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const add = (c: { key: string; title: string; href: string }) => {
    if (items.some((i) => i.key === c.key)) return;
    // load the event's player iframe via the /event page's embed? Instead open an
    // /event page in an iframe for simplicity (its internal iframe resolves).
    setItems((prev) => [...prev, { key: c.key, title: c.title, iframe: c.href }]);
  };

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-muted-foreground hover:text-zinc-50">← Live</Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Multi-View</h1>
        {items.length > 1 && (
          <button
            onClick={() => setItems([])}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-muted-foreground hover:text-zinc-50"
          >
            Bersihkan ({items.length})
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Mencari live events…</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {candidates.length === 0 && <p className="text-muted-foreground text-sm">Tidak ada live sekarang.</p>}
          {candidates.map((c) => (
            <button
              key={c.key}
              onClick={() => add(c)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs transition hover:border-primary/40"
            >
              + {c.title.slice(0, 32)}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-muted-foreground py-20 text-center text-sm">
          Klik event live di atas untuk menambah ke layar. Multi-view menampilkan beberapa stream sekaligus.
        </p>
      ) : (
        <div className={`grid gap-2 ${items.length === 1 ? "grid-cols-1" : items.length === 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3"}`}>
          {items.map((it) => (
            <div key={it.key} className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
              <iframe
                src={it.iframe}
                className="aspect-video w-full"
                allowFullScreen
                referrerPolicy="no-referrer"
                title={it.title}
              />
              <div className="flex items-center justify-between bg-surface-dim px-2 py-1 text-xs text-muted-foreground">
                <span className="truncate">{it.title}</span>
                <button
                  onClick={() => setItems((p) => p.filter((x) => x.key !== it.key))}
                  className="ml-2 text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
