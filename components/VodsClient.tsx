"use client";

import { useEffect, useState } from "react";
import { VodGroup, fetchVods, fmtTime } from "@/lib/api";

export default function VodsClient() {
  const [data, setData] = useState<VodGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchVods()
      .then((d) => live && setData(d))
      .catch((e: any) => live && setError(String(e?.message ?? e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  if (loading) return <p className="text-muted-foreground py-20 text-center">Loading…</p>;
  if (error) return <ErrorBox msg={error} />;

  const groups = data.filter((g) => g.vods?.length);
  if (!groups.length) return <p className="text-muted-foreground py-20 text-center">No VODs available</p>;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">On-Demand</h1>
      {groups.map((g) => (
        <section key={g.id}>
          <h2 className="mb-4 text-xl font-bold">
            {g.category}{" "}
            <span className="text-sm font-normal text-muted-foreground">({g.vods.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {g.vods.map((v) => (
              <a
                key={v.id}
                href={`/vod/${v.id}`}
                className="group rounded-xl border border-border bg-surface overflow-hidden hover:border-border transition"
              >
                <div className="relative aspect-video bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.poster}
                    alt={v.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition"
                    loading="lazy"
                  />
                  <span className="absolute top-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-xs">
                    👁 {v.views ?? 0}
                  </span>
                </div>
                <div className="p-3 space-y-1">
                  <div className="text-sm font-semibold line-clamp-2 leading-snug">{v.name}</div>
                  <div className="text-xs text-muted-foreground">{fmtTime(v.event_date)}</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-live/30 bg-live/10 p-4 text-live py-20 text-center">
      Failed to load: {msg}
    </div>
  );
}
