"use client";

import { useEffect, useState } from "react";
import { StreamDetail, fetchStreamDetail, firstIframe, fmtTime } from "@/lib/api";
import HlsPlayer from "@/components/HlsPlayer";

export default function EventClient({ id }: { id: string }) {
  const [ev, setEv] = useState<StreamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [m3u8Ready, setM3u8Ready] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  useEffect(() => {
    let live = true;
    fetchStreamDetail(Number(id))
      .then((d) => live && setEv(d))
      .catch((e: any) => live && setError(String(e?.message ?? e)))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [id]);

  useEffect(() => {
    let live = true;
    setM3u8Ready(false);
    setUseIframeFallback(false);
    fetch(`/api/m3u8/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("failed");
        const ct = r.headers.get("content-type") || "";
        if (ct.includes("mpegurl") || ct.includes("m3u8")) {
          const text = await r.text();
          if (live && text.includes("#EXTM3U")) setM3u8Ready(true);
          else if (live) setUseIframeFallback(true);
        } else {
          if (live) setUseIframeFallback(true);
        }
      })
      .catch(() => { if (live) setUseIframeFallback(true); });
    return () => { live = false; };
  }, [id]);

  if (loading) return <p className="py-20 text-center text-outline">Loading…</p>;
  if (error) return <ErrorBox msg={error} />;
  if (!ev) return <ErrorBox msg="Event not found" />;

  const src = firstIframe(ev);
  const live =
    (ev.start_timestamp ?? ev.starts_at) <= Date.now() / 1000 &&
    Date.now() / 1000 <= (ev.end_timestamp ?? ev.ends_at);

  const showHls = m3u8Ready && !useIframeFallback;
  const fallbackIframe = src && src.type === "iframe" ? src.data : "";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="aspect-video overflow-hidden rounded-2xl border border-outline-variant/30 bg-black">
            {showHls ? (
              <HlsPlayer m3u8Url={`/api/m3u8/${id}`} title={ev.name} poster={ev.poster} onError={() => setUseIframeFallback(true)} />
            ) : fallbackIframe && useIframeFallback ? (
              <iframe src={fallbackIframe} className="h-full w-full" allowFullScreen referrerPolicy="no-referrer" title={ev.name} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-container/20 border-t-primary-container" />
                  <span className="text-sm text-outline">Extracting stream…</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {live ? (
              <span className="pulse-live flex items-center gap-1 rounded-md bg-secondary-container px-2.5 py-1 font-extrabold uppercase text-on-surface">
                <span className="h-2 w-2 rounded-full bg-white" /> LIVE
              </span>
            ) : (
              <span className="rounded-md bg-surface-container-high px-2.5 py-1 font-semibold text-on-surface">
                UPCOMING {fmtTime(ev.starts_at)}
              </span>
            )}
            {ev.source_tag && <Badge>{ev.source_tag}</Badge>}
            {ev.tag && <Badge>{ev.tag}</Badge>}
            {ev.always_live && <Badge>24/7</Badge>}
            {ev.viewers ? <Badge><span className="material-symbols-outlined" style={{ fontSize: 12 }}>visibility</span> {ev.viewers}</Badge> : null}
            {showHls && <Badge className="bg-primary-container/20 text-primary-container">⚡ Buffer 60s</Badge>}
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold leading-tight text-on-surface">{ev.name}</h1>
          {ev.description && <p className="text-sm text-on-surface-variant">{ev.description.replace("{name}", ev.name)}</p>}
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <Field k="Category" v={ev.category_name} />
            <Field k="League" v={ev.tag} />
            {ev.source_tag && <Field k="Source" v={ev.source_tag} />}
            {!ev.always_live && (
              <>
                <Field k="Starts" v={fmtTime(ev.starts_at)} />
                <Field k="Ends" v={fmtTime(ev.ends_at)} />
              </>
            )}
            {ev.server_id && <Field k="Server" v={String(ev.server_id)} />}
            {ev.vip_stream && <Field k="Access" v="VIP" />}
          </dl>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`rounded-md border border-outline-variant/40 bg-surface-container px-2.5 py-1 ${className}`}>{children}</span>;
}

function Field({ k, v }: { k: string; v?: string }) {
  return (
    <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2">
      <div className="text-[11px] text-outline">{k}</div>
      <div className="font-medium text-on-surface">{v || "—"}</div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return <div className="rounded-xl border border-error-container/30 bg-error-container/10 p-4 py-20 text-center text-error">Failed to load: {msg}</div>;
}
