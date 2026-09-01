"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IdChannel, fetchIdChannels } from "@/lib/idtv";

export default function IdTvClient() {
  const [channels, setChannels] = useState<IdChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<"All" | "Indonesia" | "Premium">("All");

  useEffect(() => {
    let live = true;
    fetchIdChannels()
      .then((d) => live && setChannels(d))
      .catch((e: any) => live && setError(String(e?.message ?? e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  const list = useMemo(() => {
    let l = channels;
    if (group !== "All") l = l.filter((c) => c.group === group);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((c) => c.name.toLowerCase().includes(s));
    }
    return l;
  }, [channels, q, group]);

  const indoCount = useMemo(
    () => channels.filter((c) => c.group === "Indonesia").length,
    [channels]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Indonesia TV</h1>
          <p className="text-sm text-muted-foreground">
            {channels.length} channels · {indoCount} lokal + Premium
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden text-sm">
            {(["All", "Indonesia", "Premium"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`px-3 py-1.5 transition ${
                  group === g ? "bg-white/15 text-zinc-50" : "text-muted-foreground hover:text-zinc-50"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari channel…"
            className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          Gagal muat: {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {list.map((c) => (
            <Link
              key={c.id}
              href={`/idtv/${c.id}`}
              className="group rounded-xl border border-white/10 bg-zinc-900 p-3 transition hover:border-emerald-400/40 hover:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <ChannelLogo c={c} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground">{c.group}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {!loading && !error && !list.length && (
        <p className="text-muted-foreground py-10 text-center">Tidak ada channel cocok.</p>
      )}
    </div>
  );
}

function ChannelLogo({ c }: { c: IdChannel }) {
  return (
    <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/5">
      {c.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.logo} alt={c.name} className="h-full w-full object-contain" loading="lazy" />
      ) : (
        <span className="text-[9px] font-bold text-muted-foreground">
          {c.name.slice(0, 4).toUpperCase()}
        </span>
      )}
    </div>
  );
}
