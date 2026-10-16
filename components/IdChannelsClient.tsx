"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ALL_ID_CHANNELS, IdChannel } from "@/lib/id-channels";

export default function IdChannelsClient() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("all");
  const [activeChannel, setActiveChannel] = useState<IdChannel | null>(null);

  const groups = useMemo(() => {
    const s = new Set(ALL_ID_CHANNELS.map((c) => c.group));
    return ["all", ...Array.from(s)];
  }, []);

  const filtered = useMemo(() => {
    let l = ALL_ID_CHANNELS;
    if (group !== "all") l = l.filter((c) => c.group === group);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((c) => c.name.toLowerCase().includes(s));
    }
    return l;
  }, [q, group]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📺 TV Indonesia</h1>
        <p className="mt-1 text-sm text-on-surface-variant">{ALL_ID_CHANNELS.length} channel · Live streaming gratis</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={group} onChange={(e) => setGroup(e.target.value)}
          className="rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-sm outline-none focus:border-primary-container/50">
          {groups.map((g) => <option key={g} value={g}>{g === "all" ? "Semua Kategori" : g}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari channel..."
          className="flex-1 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-sm outline-none focus:border-primary-container/50" />
      </div>

      {/* Player */}
      {activeChannel && (
        <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-black">
          <div className="flex items-center justify-between bg-surface-container px-4 py-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="flex items-center gap-1 rounded-full bg-secondary-container/80 px-2 py-0.5 text-[10px] font-bold text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
              </span>
              {activeChannel.name}
            </span>
            <button onClick={() => setActiveChannel(null)}
              className="text-on-surface-variant hover:text-on-surface">✕</button>
          </div>
          <div className="aspect-video">
            <video className="h-full w-full" controls autoPlay playsInline>
              <source src={activeChannel.url} type="application/vnd.apple.mpegurl" />
            </video>
          </div>
        </div>
      )}

      {/* Channel grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((ch) => (
          <button key={ch.name + ch.url} onClick={() => setActiveChannel(ch)}
            className={`group overflow-hidden rounded-xl border text-left transition hover:-translate-y-1 hover:border-primary-container/60 ${
              activeChannel?.url === ch.url ? "border-primary-container bg-primary-container/10" : "border-outline-variant/30 bg-surface-container hover:bg-surface-container-high/50"
            }`}>
            <div className="flex items-center gap-3 p-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-lg font-bold text-primary-container">
                {ch.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{ch.name}</div>
                <div className="text-xs text-on-surface-variant">{ch.group}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      {!filtered.length && <p className="py-10 text-center text-on-surface-variant">Tidak ada channel cocok.</p>}
    </div>
  );
}
