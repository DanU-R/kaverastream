"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ALL_ID_CHANNELS, IdChannel } from "@/lib/id-channels";

// Map DASH channel URLs to proxy route slugs
const DASH_PROXY_SLUGS: Record<string, string> = {
  "https://d2xz2v5wuvgur6.cloudfront.net/out/v1/7a69cfc9e135493f87ac4efd63000429/index.mpd": "trans-tv",
  "https://d2tjypxxy769fn.cloudfront.net/out/v1/0fd7b7d368bc44bc9b4dece20acc3e33/index.mpd": "trans-7",
  "https://d2tjypxxy769fn.cloudfront.net/out/v1/fd4360b1c12c4375848c8f085fd51d41/index.mpd": "metro-tv",
};

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
        <UnifiedPlayer
          key={activeChannel.url}
          channel={activeChannel}
          onClose={() => setActiveChannel(null)}
        />
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
              {ch.type && ch.type !== "hls" && (
                <span className="shrink-0 rounded-full bg-primary-container/10 px-1.5 py-0.5 text-[9px] font-medium text-primary-container">
                  {ch.type === "dash" ? "DASH" : "HLS+"}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
      {!filtered.length && <p className="py-10 text-center text-on-surface-variant">Tidak ada channel cocok.</p>}
    </div>
  );
}

function UnifiedPlayer({ channel, onClose }: { channel: IdChannel; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const dashRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "error">("loading");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const v = video;

    let destroyed = false;

    async function init() {
      const streamType = channel.type || "hls";

      // --- DASH streams (Trans TV, Trans 7, Metro TV) ---
      if (streamType === "dash") {
        await initDash(v, channel, destroyed, setStatus, dashRef);
        return;
      }

      // --- HLS proxy streams (RCTI, MNCTV, GTV, iNews) ---
      // First fetch the real m3u8 URL from our API, then play with hls.js
      if (streamType === "hls-proxy") {
        try {
          const resp = await fetch(channel.url);
          const data = await resp.json();
          if (!data.url) {
            if (!destroyed) setStatus("error");
            return;
          }
          const m3u8Url = data.url as string;
          await initHls(v, m3u8Url, destroyed, setStatus, hlsRef);
        } catch {
          if (!destroyed) setStatus("error");
        }
        return;
      }

      // --- Regular HLS streams (default) ---
      await initHls(v, channel.url, destroyed, setStatus, hlsRef);
    }

    init();

    return () => {
      destroyed = true;
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (dashRef.current) { dashRef.current.reset(); dashRef.current = null; }
    };
  }, [channel.url, channel.type]);

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-black">
      <div className="flex items-center justify-between bg-surface-container px-4 py-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          {status === "playing" && (
            <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
            </span>
          )}
          {status === "loading" && (
            <span className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="h-3 w-3 animate-spin rounded-full border border-primary-container/30 border-t-primary-container" />
              Memuat...
            </span>
          )}
          {channel.name}
        </span>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">✕</button>
      </div>
      <div className="relative aspect-video">
        {status === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
            <span className="text-3xl">📡</span>
            <span className="text-sm text-white/50">Channel sedang offline atau geo-blocked</span>
            <span className="text-xs text-white/30">Coba channel lain</span>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="h-full w-full" controls autoPlay playsInline />
            {status === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-container/20 border-t-primary-container" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// --- DASH initialization ---
async function initDash(
  video: HTMLVideoElement,
  channel: IdChannel,
  destroyed: boolean,
  setStatus: (s: "loading" | "playing" | "error") => void,
  dashRef: React.MutableRefObject<any>
) {
  try {
    const dashjs = await import("dashjs");

    // Use proxy URL for DASH streams that need Referer header
    const slug = DASH_PROXY_SLUGS[channel.url];
    const mpdUrl = slug ? `/api/proxy-dash/${slug}` : channel.url;

    const player = dashjs.MediaPlayer().create();
    dashRef.current = player;

    player.updateSettings({
      streaming: {
        buffer: {
          fastSwitchEnabled: true,
          bufferTimeAtTopQuality: 30,
          bufferTimeAtTopQualityLongForm: 60,
        },
      },
    });

    player.initialize(video, mpdUrl, true);

    player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
      if (!destroyed) setStatus("playing");
    });

    player.on(dashjs.MediaPlayer.events.ERROR, () => {
      if (!destroyed) setStatus("error");
    });

    video.addEventListener("playing", () => { if (!destroyed) setStatus("playing"); });
    video.addEventListener("error", () => { if (!destroyed) setStatus("error"); });
  } catch {
    if (!destroyed) setStatus("error");
  }
}

// --- HLS initialization (shared by regular HLS and HLS-proxy) ---
async function initHls(
  video: HTMLVideoElement,
  url: string,
  destroyed: boolean,
  setStatus: (s: "loading" | "playing" | "error") => void,
  hlsRef: React.MutableRefObject<any>
) {
  // Native HLS (Safari/iOS)
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
    video.addEventListener("loadedmetadata", () => { if (!destroyed) setStatus("playing"); });
    video.addEventListener("error", () => { if (!destroyed) setStatus("error"); });
    return;
  }

  // hls.js
  try {
    const Hls = (await import("hls.js")).default;
    if (!Hls.isSupported()) { setStatus("error"); return; }

    const hls = new Hls({
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      liveSyncDurationCount: 3,
      enableWorker: true,
      fragLoadingMaxRetry: 4,
      manifestLoadingMaxRetry: 3,
    });

    hlsRef.current = hls;
    hls.attachMedia(video);
    hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(url));
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (destroyed) return;
      setStatus("playing");
      video.play().catch(() => {});
    });
    hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
      if (destroyed) return;
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            setStatus("error");
            break;
        }
      }
    });
  } catch {
    if (!destroyed) setStatus("error");
  }
}
