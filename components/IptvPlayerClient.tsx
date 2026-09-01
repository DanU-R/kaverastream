"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IptvChannel,
  channelName,
  fetchChannels,
} from "@/lib/iptv";

declare global {
  interface Window {
    shaka?: any;
  }
}

// Load Shaka Player (Apache-2.0, self-hostable) from CDN
function loadShaka(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.shaka) return resolve(window.shaka);
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/shaka-player@4.12.4/dist/shaka-player.compiled.min.js";
    s.onload = () => resolve(window.shaka);
    s.onerror = () => reject(new Error("shaka load failed"));
    document.head.appendChild(s);
  });
}

export default function IptvPlayerClient({ id }: { id: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ch, setCh] = useState<IptvChannel | null>(null);
  const [state, setState] = useState("loading");
  const [err, setErr] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    let player: any = null;
    (async () => {
      try {
        const chans = await fetchChannels();
        const found = chans.find((c) => c.id === id);
        if (!live) return;
        if (!found) return setState("err"), setErr("Channel not found");
        setCh(found);

        const shaka = await loadShaka();
        if (!shaka?.Player?.isBrowserSupported()) {
          throw new Error("Shaka not supported in this browser");
        }
        shaka.polyfill.installAll();
        if (!videoRef.current) return;
        player = new shaka.Player();
        playerRef.current = player;
        await player.attach(videoRef.current);

        // Configure clearKeys for CENC DRM (keyId -> key pairs from tv.json)
        const clearKeys: Record<string, string> = {};
        if (found.clearKeys) {
          for (const [kid, k] of Object.entries(found.clearKeys)) {
            // Shaka accepts {kid: key} (hex), and converts dw(0x..)/hex/uuids
            clearKeys[kid] = k;
          }
          player.configure({
            drm: { clearKeys: clearKeys as any, servers: {} },
          });
        }

        player.configure({ streaming: { rebufferingGoal: 10 } });
        await player.load(found.url);
        if (live) {
          setState("playing");
          player.addEventListener("error", (e: any) => {
            setErr("Player error: " + (e?.detail?.message ?? "unknown"));
          });
          videoRef.current?.play().catch(() => {});
        }
      } catch (e: any) {
        if (live) {
          setState("err");
          setErr(String(e?.message ?? e));
        }
      }
    })();
    return () => {
      live = false;
      try {
        player?.destroy();
      } catch {}
    };
  }, [id]);

  return (
    <div className="space-y-4">
      <Link href="/iptv" className="text-sm text-muted-foreground hover:text-zinc-50">
        ← IPTV Channels
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{ch ? channelName(ch.id) : id}</h1>
        {ch && <div className="text-sm text-muted-foreground">{ch.id}</div>}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video">
        <video
          ref={videoRef}
          className="h-full w-full"
          controls
          autoPlay
          playsInline
        />
        {state === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Loading…
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
