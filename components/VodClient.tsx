"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VodDetail, fetchVodDetail, fmtTime } from "@/lib/api";

export default function VodClient({ id }: { id: string }) {
  const [vod, setVod] = useState<VodDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    fetchVodDetail(Number(id))
      .then((d) => live && setVod(d))
      .catch((e: any) => live && setError(String(e?.message ?? e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [id]);

  if (loading) return <p className="text-muted-foreground py-20 text-center">Loading…</p>;
  if (error) return <ErrorBox msg={error} />;
  if (!vod) return <ErrorBox msg="VOD not found" />;

  const isHls = vod.source?.type === "playlist" && vod.source?.data?.includes(".m3u8");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl overflow-hidden bg-black border border-border">
        {isHls ? (
          <video
            className="aspect-video w-full"
            controls
            src={vod.source.data}
            poster={vod.poster}
            preload="metadata"
          />
        ) : vod.source?.data?.startsWith("http") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vod.source.data} alt={vod.name} className="aspect-video w-full object-cover" />
        ) : (
          <div className="aspect-video flex items-center justify-center text-muted-foreground">
            No playable source
          </div>
        )}
      </div>

      <div>
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-2xl font-bold">{vod.name}</h1>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-md bg-surface-2 px-2 py-1">
                {new Date(vod.event_date * 1000).toLocaleDateString()}
              </span>
              <span className="rounded-md bg-surface-2 px-2 py-1">👁 {vod.views}</span>
            </div>
          </div>
        </div>
        {vod.description ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {vod.description.replace("{name}", vod.name)}
          </p>
        ) : null}
      </div>

      {vod.recommended_vods?.length ? (
        <div>
          <h2 className="mb-3 text-lg font-bold">More On-Demand</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {vod.recommended_vods.map((r) => (
              <Link
                key={r.id}
                href={`/vod/${r.id}`}
                className="group rounded-lg border border-border bg-surface overflow-hidden hover:border-border transition"
              >
                <div className="relative aspect-video bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.poster.replace("{host}", "api.ppv.st")}
                    alt={r.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-2">
                  <div className="text-xs font-semibold line-clamp-2">{r.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    👁 {r.views}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
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
