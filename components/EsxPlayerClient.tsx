"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  EsxEvent,
  EsxSource,
  fetchEsxEvent,
  fetchPpvEmbed,
  listSources,
} from "@/lib/esportex";

export default function EsxPlayerClient({ slug }: { slug: string }) {
  const [ev, setEv] = useState<EsxEvent | null>(null);
  const [sources, setSources] = useState<EsxSource[]>([]);
  const [resolved, setResolved] = useState<EsxSource[]>(); // sources with final iframe URL
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const triedRef = useRef<string[]>([]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const e = await fetchEsxEvent(slug);
        if (!live) return;
        if (!e) return setLoading(false), setError("Event tidak ditemukan");
        setEv(e);

        if (!e.playable) {
          setSources([]);
          setLoading(false);
          return;
        }

        const srcs = listSources(e);
        setSources(srcs);
        setLoading(false);

        // resolve ppv sources -> final embedindia iframe URLs
        const finalized = await Promise.all(
          srcs.map(async (s) => {
            if (s.ppvId) {
              const embed = await fetchPpvEmbed(s.ppvId);
              return { ...s, iframe: embed ?? s.iframe };
            }
            return s;
          })
        );
        if (live) setResolved(finalized);
      } catch (err: any) {
        if (live) { setError(String(err?.message ?? err)); setLoading(false); }
      }
    })();
    return () => {
      live = false;
    };
  }, [slug]);

  // Auto-failover: when the user-visible "stream not ready" flips or manual error,
  // advance activeIdx. We auto-try the *next* source once after a grace period.
  const advance = useCallback(() => {
    setActiveIdx((i) => {
      const n = (i + 1) % Math.max(1, sources.length);
      return n;
    });
  }, [sources.length]);

  const current = resolved?.[activeIdx] ?? sources[activeIdx];

  // Auto-switch heuristic: if there are multiple sources and the active iframe
  // loads, we keep it. A "Retry" button + next-source auto-advance on first fail
  // is exposed; here we also auto-advance once when failCount toggles.
  const handleSourceError = () => {
    triedRef.current.push(current?.key ?? "");
    setFailCount((c) => c + 1);
    if (sources.length > 1) advance();
  };

  if (loading) return <p className="text-muted-foreground py-20 text-center">Menyiapkan stream…</p>;
  if (error) return <ErrorBox msg={error} />;
  if (!ev) return <ErrorBox msg="Event tidak ditemukan" />;

  const showSwitcher = sources.length > 1;

  return (
    <div className="space-y-5">
      <Link href="/esportex" className="text-sm text-muted-foreground hover:text-zinc-50">
        ← EsportEx
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{ev.tag}</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-md bg-white/10 px-2 py-0.5">{ev.league}</span>
            <span className="rounded-md bg-white/10 px-2 py-0.5">{ev.category}</span>
          </div>
        </div>
        {showSwitcher && current && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs text-muted-foreground">Server:</span>
            <select
              value={current.key}
              onChange={(e) => {
                const idx = sources.findIndex((s) => s.key === e.target.value);
                if (idx >= 0) {
                  triedRef.current = [];
                  setFailCount(0);
                  setActiveIdx(idx);
                }
              }}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5"
            >
              {sources.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.server}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video">
        {current?.iframe ? (
          <iframe
            key={current.key + "-" + failCount}
            src={current.iframe}
            className="h-full w-full"
            allowFullScreen
            referrerPolicy="no-referrer"
            title={ev.tag}
            onError={handleSourceError}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
            <span className="text-2xl">⚠️</span>
            <span>Stream tidak tersedia untuk event ini.</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/80">
          {!current
            ? "Event ini tidak memiliki source yang bisa diputar."
            : current.key.startsWith("ppv-")
              ? "Diputar via PPW network (embedindia) — browser menangani stream."
              : "Player external — resolusi stream ditangani bawaannya."}
          {showSwitcher && (
            <span className="mt-1 block text-amber-200/60">
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
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 py-20 text-center">
      Gagal: {msg}
    </div>
  );
}
