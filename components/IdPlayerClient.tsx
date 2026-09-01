"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IdChannel, displayUrl, fetchChannel } from "@/lib/idtv";

declare global {
  interface Window {
    Hls?: any;
  }
}

function loadHlsJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.Hls) return resolve(window.Hls);
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js";
    s.onload = () => resolve(window.Hls);
    s.onerror = () => reject(new Error("hls.js load failed"));
    document.head.appendChild(s);
  });
}

export default function IdPlayerClient({ id }: { id: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ch, setCh] = useState<IdChannel | null>(null);
  const [state, setState] = useState("loading");
  const [err, setErr] = useState<string | null>(null);
  const [viaProxy, setViaProxy] = useState(false);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    let live = true;
    let hls: any = null;
    (async () => {
      try {
        const found = await fetchChannel(id);
        if (!live) return;
        if (!found) return setState("err"), setErr("Channel tidak ditemukan");
        setCh(found);

        const src = displayUrl(found.url);
        if (!src) return setState("err"), setErr("Sumber stream tidak didukung browser (multicast/udp).");
        setViaProxy(src.startsWith("/api/"));

        const video = videoRef.current;
        if (!video) return;

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false,
            xhrSetup: (xhr: any) => {
              xhr.withCredentials = false;
            },
          });
          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            if (live) { setState("playing"); video.play().catch(() => {}); }
          });
          hls.on(window.Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) {
              if (data.type === "networkError") {
                setErr("Jaringan gagal (mungkin geo-block/offline). Coba channel lain.");
              } else {
                setErr("Stream error: " + (data.details ?? "unknown"));
              }
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari native
          video.src = src;
          setState("playing");
          video.play().catch(() => {});
        } else {
          setState("err");
          setErr("Browser tidak mendukung HLS.");
        }
      } catch (e: any) {
        if (live) { setState("err"); setErr(String(e?.message ?? e)); }
      }
    })();
    return () => {
      live = false;
      try { hls?.destroy(); } catch {}
    };
  }, [id]);

  return (
    <div className="space-y-4">
      <Link href="/idtv" className="text-sm text-muted-foreground hover:text-zinc-50">
        ← Indonesia TV
      </Link>
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">{ch?.name ?? id}</h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {ch?.group && <span className="rounded-md bg-white/10 px-2 py-0.5">{ch.group}</span>}
            {viaProxy && (
              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-amber-300">
                via proxy
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video">
        <video
          ref={videoRef}
          className="h-full w-full"
          controls
          autoPlay
          playsInline
          crossOrigin={viaProxy ? undefined : "anonymous"}
        />
        {state === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Loading… (kadang butuh beberapa detik)
          </div>
        )}
        {state === "err" && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-red-300 text-sm">
            {err}
          </div>
        )}
      </div>
    </div>
  );
}
