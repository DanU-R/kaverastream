"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface HlsPlayerProps {
  m3u8Url: string;
  title?: string;
  poster?: string;
  onError?: () => void;
}

interface QualityLevel { height: number; bitrate: number; level: number }

export default function HlsPlayer({ m3u8Url, title, poster, onError }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "buffering" | "error">("loading");
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);
  const [bufferHealth, setBufferHealth] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let destroyed = false;
    const video = videoRef.current;
    if (!video) return;
    const v = video;

    async function initHls() {
      // Native HLS (Safari/iOS)
      if (v.canPlayType("application/vnd.apple.mpegurl")) {
        v.src = m3u8Url;
        v.addEventListener("loadedmetadata", () => !destroyed && setStatus("playing"));
        v.addEventListener("waiting", () => !destroyed && setStatus("buffering"));
        v.addEventListener("playing", () => !destroyed && setStatus("playing"));
        v.addEventListener("error", () => { if (!destroyed) { setStatus("error"); onError?.(); } });
        return;
      }

      try {
        const Hls = (await import("hls.js")).default;
        if (!Hls.isSupported()) { setStatus("error"); onError?.(); return; }

        const hls = new Hls({
          maxBufferLength: 60,
          maxMaxBufferLength: 120,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
          backBufferLength: 30,
          enableWorker: true,
          lowLatencyMode: false,
          startLevel: -1,
          capLevelToPlayerSize: true,
          abrEwmaDefaultEstimate: 500000,
          fragLoadingMaxRetry: 8,
          fragLoadingRetryDelay: 500,
          fragLoadingMaxRetryTimeout: 64000,
          manifestLoadingMaxRetry: 4,
          manifestLoadingRetryDelay: 500,
          levelLoadingMaxRetry: 4,
          levelLoadingRetryDelay: 500,
          manifestLoadingTimeOut: 15000,
          fragLoadingTimeOut: 20000,
          levelLoadingTimeOut: 10000,
        });

        hlsRef.current = hls;
        hls.attachMedia(v);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(m3u8Url));
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (destroyed) return;
          setLevels(hls.levels.map((l: any, i: number) => ({ height: l.height || 0, bitrate: l.bitrate, level: i })));
          setStatus("buffering");
          v.play().catch(() => {});
        });
        hls.on(Hls.Events.FRAG_BUFFERED, () => {
          if (destroyed) return;
          const buf = v.buffered;
          if (buf.length > 0) setBufferHealth(Math.max(0, buf.end(buf.length - 1) - v.currentTime));
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (_e: any, data: any) => !destroyed && setCurrentLevel(data.level));
        hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
          if (destroyed) return;
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR: setRetryCount(c => c + 1); hls.startLoad(); break;
              case Hls.ErrorTypes.MEDIA_ERROR: setRetryCount(c => c + 1); hls.recoverMediaError(); break;
              default: setStatus("error"); onError?.(); break;
            }
          }
        });
        v.addEventListener("waiting", () => !destroyed && setStatus("buffering"));
        v.addEventListener("playing", () => !destroyed && setStatus("playing"));
      } catch {
        if (!destroyed) { setStatus("error"); onError?.(); }
      }
    }

    initHls();
    return () => {
      destroyed = true;
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [m3u8Url, onError]);

  return (
    <div className="group relative h-full w-full bg-black">
      <video ref={videoRef} className="h-full w-full" controls autoPlay playsInline poster={poster} />

      {/* Loading */}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
            <span className="text-sm text-white/50">Memuat stream…</span>
          </div>
        </div>
      )}

      {/* Buffering */}
      {status === "buffering" && (
        <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-1.5 backdrop-blur">
          <div className="h-3 w-3 animate-pulse rounded-full bg-amber-400" />
          <span className="text-xs text-amber-400">Buffering{bufferHealth > 0 ? ` · ${bufferHealth.toFixed(0)}s` : "…"}</span>
        </div>
      )}

      {/* Buffer health */}
      {status === "playing" && bufferHealth > 0 && (
        <div className="pointer-events-none absolute top-3 left-3 rounded-md bg-black/50 px-2 py-0.5 backdrop-blur">
          <span className="text-[10px] text-emerald-400">⚡ {bufferHealth.toFixed(0)}s</span>
        </div>
      )}

      {/* Quality selector */}
      {levels.length > 1 && (status === "playing" || status === "buffering") && (
        <div className="absolute top-3 right-3 opacity-0 transition group-hover:opacity-100">
          <select
            value={currentLevel}
            onChange={(e) => {
              const lvl = Number(e.target.value);
              if (hlsRef.current) { hlsRef.current.currentLevel = lvl; setCurrentLevel(lvl); }
            }}
            className="rounded-lg bg-black/80 px-2 py-1 text-xs text-white backdrop-blur border border-white/10"
          >
            <option value={-1}>Auto</option>
            {levels.map((l) => (
              <option key={l.level} value={l.level}>{l.height > 0 ? `${l.height}p` : `${Math.round(l.bitrate / 1000)}kbps`}</option>
            ))}
          </select>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90">
          <span className="text-3xl">⚠️</span>
          <span className="text-sm text-white/60">Stream error</span>
          <button onClick={() => window.location.reload()} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition">
            Muat ulang
          </button>
        </div>
      )}

      {/* Retry indicator */}
      {retryCount > 0 && status !== "error" && (
        <div className="absolute bottom-3 right-3 rounded-md bg-black/50 px-2 py-0.5 backdrop-blur">
          <span className="text-[10px] text-white/30">↻ {retryCount}</span>
        </div>
      )}

      {/* Title */}
      {title && status !== "loading" && status !== "error" && (
        <div className="absolute bottom-3 left-3 max-w-[60%] truncate rounded-md bg-black/50 px-2 py-0.5 backdrop-blur">
          <span className="text-[10px] text-white/40">{title}</span>
        </div>
      )}
    </div>
  );
}
