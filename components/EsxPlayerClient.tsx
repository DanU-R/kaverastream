"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EsxEvent, EsxSource, fetchEsxEvent, fetchPpvEmbed, listSources } from "@/lib/esportex";
import HlsPlayer from "@/components/HlsPlayer";

export default function EsxPlayerClient({ slug }: { slug: string }) {
  const [ev, setEv] = useState<EsxEvent | null>(null);
  const [sources, setSources] = useState<EsxSource[]>([]);
  const [resolved, setResolved] = useState<EsxSource[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [fallbackToIframe, setFallbackToIframe] = useState<Record<string, boolean>>({});
  const [m3u8Ready, setM3u8Ready] = useState<Record<string, boolean>>({});
  const triedRef = useRef<string[]>([]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const e = await fetchEsxEvent(slug);
        if (!live) return;
        if (!e) return setLoading(false), setError("Event tidak ditemukan");
        setEv(e);
        if (!e.playable) { setSources([]); setLoading(false); return; }

        const srcs = listSources(e);
        setSources(srcs);
        setLoading(false);

        const finalized: EsxSource[] = await Promise.all(
          srcs.map(async (s): Promise<EsxSource> => {
            if (s.ppvId) {
              const embed = await fetchPpvEmbed(s.ppvId);
              return { ...s, iframe: embed ?? s.iframe };
            }
            return s;
          })
        );
        if (live) setResolved(finalized);

        await Promise.all(
          finalized.filter(s => s.ppvId).map(async (s) => {
            try {
              const res = await fetch(`/api/m3u8/${s.ppvId}`);
              if (res.ok) {
                const ct = res.headers.get("content-type") || "";
                if (ct.includes("mpegurl") || ct.includes("m3u8")) {
                  const text = await res.text();
                  if (live && text.includes("#EXTM3U")) {
                    setM3u8Ready(prev => ({ ...prev, [s.key]: true }));
                  }
                }
              }
            } catch {}
          })
        );
      } catch (err: any) {
        if (live) { setError(String(err?.message ?? err)); setLoading(false); }
      }
    })();
    return () => { live = false; };
  }, [slug]);

  const advance = useCallback(() => {
    setActiveIdx(i => (i + 1) % Math.max(1, sources.length));
  }, [sources.length]);

  const current = resolved[activeIdx] ?? sources[activeIdx];
  const hasM3u8 = current?.ppvId && m3u8Ready[current.key] && !fallbackToIframe[current?.key ?? ""];

  const handleSourceError = () => {
    triedRef.current.push(current?.key ?? "");
    setFailCount(c => c + 1);
    if (current?.key) setFallbackToIframe(prev => ({ ...prev, [current.key]: true }));
    if (sources.length > 1) advance();
  };

  const handleSwitchSource = (key: string) => {
    const idx = sources.findIndex(s => s.key === key);
    if (idx >= 0) { triedRef.current = []; setFailCount(0); setActiveIdx(idx); }
  };

  if (loading) return <p className="text-muted-foreground py-20 text-center">Menyiapkan stream…</p>;
  if (error) return <ErrorBox msg={error} />;
  if (!ev) return <ErrorBox msg="Event tidak ditemukan" />;

  const showSwitcher = sources.length > 1;
  const iframeSrc = current?.iframe || "";

  return (
    <div className="space-y-5">
      <Link href="/esportex" className="text-sm text-muted-foreground hover:text-zinc-50">← EsportEx</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{ev.tag}</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-2.5 py-0.5">{ev.league}</span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5">{ev.category}</span>
            {hasM3u8 && <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-emerald-400">⚡ Buffer 60s</span>}
          </div>
        </div>
        {showSwitcher && current && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs text-muted-foreground">Server:</span>
            <select
              value={current.key}
              onChange={(e) => handleSwitchSource(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 outline-none focus:border-emerald-500/50"
            >
              {sources.map(s => <option key={s.key} value={s.key}>{s.server}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video">
        {hasM3u8 && current?.ppvId ? (
          <HlsPlayer m3u8Url={`/api/m3u8/${current.ppvId}`} title={ev.tag} onError={handleSourceError} />
        ) : iframeSrc ? (
          <iframe
            key={current?.key + "-" + failCount}
            src={iframeSrc}
            className="h-full w-full"
            allowFullScreen
            referrerPolicy="no-referrer"
            title={ev.tag}
            onError={handleSourceError}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
            <span className="text-2xl">⚠️</span>
            <span>Stream tidak tersedia untuk event ini.</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-muted-foreground/80">
          {!current
            ? "Event ini tidak memiliki source yang bisa diputar."
            : current.key.startsWith("ppv-")
              ? hasM3u8
                ? "Diputar via hls.js dengan buffer optimized (60s, no P2P)."
                : "Fallback ke raw embed — buffer default."
              : "Player external — resolusi stream ditangani bawaannya."}
          {showSwitcher && (
            <span className="mt-1 block text-muted-foreground/60">
              {sources.length} server tersedia. Klik ganti jika stream bermasalah.
            </span>
          )}
        </div>
        <button
          onClick={handleSourceError}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/5"
        >
          {showSwitcher ? "Ganti server ⤴" : "Muat ulang ⟳"}
        </button>
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 py-20 text-center">Gagal: {msg}</div>;
}
