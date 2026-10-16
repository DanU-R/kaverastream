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
        if (!e) return setLoading(false), setError("Event not found");
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

  if (loading) return <p className="py-20 text-center text-outline">Preparing stream…</p>;
  if (error) return <ErrorBox msg={error} />;
  if (!ev) return <ErrorBox msg="Event not found" />;

  const showSwitcher = sources.length > 1;
  const iframeSrc = current?.iframe || "";

  return (
    <div className="space-y-5">
      <Link href="/esportex" className="text-sm text-outline hover:text-on-surface">← EsportEx</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{ev.tag}</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md border border-outline-variant/40 bg-surface-container px-2.5 py-0.5 text-on-surface">{ev.league}</span>
            <span className="rounded-md border border-outline-variant/40 bg-surface-container px-2.5 py-0.5 text-on-surface">{ev.category}</span>
            {hasM3u8 && <span className="rounded-md bg-primary-container/20 px-2.5 py-0.5 text-primary-container">⚡ Buffer 60s</span>}
          </div>
        </div>
        {showSwitcher && current && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs text-outline">Server:</span>
            <select
              value={current.key}
              onChange={(e) => handleSwitchSource(e.target.value)}
              className="rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-on-surface outline-none focus:border-primary-container/50"
            >
              {sources.map(s => <option key={s.key} value={s.key}>{s.server}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="aspect-video overflow-hidden rounded-2xl border border-outline-variant/30 bg-black">
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
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-outline">
            <span className="material-symbols-outlined text-3xl">error</span>
            <span>Stream not available for this event.</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3 text-xs text-on-surface-variant">
          {!current
            ? "No playable source for this event."
            : current.key.startsWith("ppv-")
              ? hasM3u8
                ? "Playing via hls.js with optimized buffer (60s, no P2P)."
                : "Fallback to raw embed — default buffer."
              : "External player — stream resolution handled natively."}
          {showSwitcher && (
            <span className="mt-1 block text-outline">
              {sources.length} servers available. Switch if stream has issues.
            </span>
          )}
        </div>
        <button
          onClick={handleSourceError}
          className="rounded-lg border border-outline-variant/40 bg-surface-container px-4 py-2 text-sm text-on-surface transition hover:bg-surface-container-high"
        >
          {showSwitcher ? "Switch Server" : "Reload"}
        </button>
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return <div className="rounded-xl border border-error-container/30 bg-error-container/10 p-4 py-20 text-center text-error">Failed: {msg}</div>;
}
