"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IptvChannel, channelName, fetchChannels } from "@/lib/iptv";

export default function IptvClient() {
  const [channels, setChannels] = useState<IptvChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let live = true;
    fetchChannels()
      .then((d) => live && setChannels(d))
      .catch((e: any) => live && setError(String(e?.message ?? e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  const list = useMemo(() => {
    if (!q.trim()) return channels;
    const s = q.toLowerCase();
    return channels.filter(
      (c) => c.id.toLowerCase().includes(s) || channelName(c.id).toLowerCase().includes(s)
    );
  }, [channels, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">IPTV Channels</h1>
          <p className="text-sm text-muted-foreground">
            {channels.length} live channels
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search channels…"
          className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          Failed to load IPTV: {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {list.map((c) => (
            <Link
              key={c.id}
              href={`/iptv/${c.id}`}
              title={c.id}
              className="group rounded-xl border border-white/10 bg-zinc-900 px-4 py-4 transition hover:border-emerald-400/40 hover:bg-zinc-800"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold line-clamp-1">
                  {channelName(c.id)}
                </span>
              </div>
              <div className="mt-1 pl-4 text-[11px] text-muted-foreground">
                {c.type.toUpperCase()} · {c.id}
              </div>
            </Link>
          ))}
        </div>
      )}
      {!loading && !error && !list.length && (
        <p className="text-muted-foreground py-10 text-center">No channels match.</p>
      )}
    </div>
  );
}
