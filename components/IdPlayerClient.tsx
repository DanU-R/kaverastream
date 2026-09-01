"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { displayUrl, fetchChannel, IdChannel } from "@/lib/idtv";

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
        if (!src) {
          return setState("err"), setErr("Sumber tidak CORS-open — tidak bisa diputar di browser.");
        }

        const video = videoRef.current;
        if (!video) return;

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true, lowLatencyMode: false });
          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            if (live) { setState("playing"); video.play().catch(() => {}); }
          });
          hls.on(window.Hls.Events.ERROR, (_: any, data: any) => {
            if (data?.fatal) {
              setErr("Stream error: " + (data.details ?? "network"));
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
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
      <div>
        <h1 className="text-2xl font-bold">{ch?.name ?? id}</h1>
        <div className="mt-0.5 text-xs text-muted-foreground">
          Native HLS · {ch?.group || "Indonesia"}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video">
        <video
          ref={videoRef}
          className="h-full w-full"
          controls
          autoPlay
          playsInline
          crossOrigin="anonymous"
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

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/80">
        Hanya channel CORS-open yang bisa diputar native di browser. Channel luar
        (menggunakan CDN non-CORS / geo-block) sengaja tidak ditampilkan supaya
        tidak ada yang gagal-buffer.
      </div>
    </div>
  );
}
