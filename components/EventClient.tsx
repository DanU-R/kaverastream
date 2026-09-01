"use client";

import { useEffect, useState } from "react";
import { StreamDetail, fetchStreamDetail, firstIframe, fmtTime } from "@/lib/api";

export default function EventClient({ id }: { id: string }) {
  const [ev, setEv] = useState<StreamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    fetchStreamDetail(Number(id))
      .then((d) => live && setEv(d))
      .catch((e: any) => live && setError(String(e?.message ?? e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [id]);

  if (loading) return <p className="text-muted-foreground py-20 text-center">Loading…</p>;
  if (error) return <ErrorBox msg={error} />;
  if (!ev) return <ErrorBox msg="Event not found" />;

  const src = firstIframe(ev);
  const live =
    (ev.start_timestamp ?? ev.starts_at) <= Date.now() / 1000 &&
    Date.now() / 1000 <= (ev.end_timestamp ?? ev.ends_at);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-2xl overflow-hidden bg-black border border-white/10">
            {src && src.type === "iframe" ? (
              <iframe
                src={src.data}
                className="aspect-video w-full"
                allowFullScreen
                referrerPolicy="no-referrer"
                title={ev.name}
              />
            ) : (
              <div className="aspect-video flex items-center justify-center text-muted-foreground">
                No player source available
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {live ? (
              <span className="rounded-md bg-red-600 px-2 py-1 font-semibold">● LIVE</span>
            ) : (
              <span className="rounded-md bg-amber-600/90 px-2 py-1 font-semibold">
                UPCOMING {fmtTime(ev.starts_at)}
              </span>
            )}
            {ev.source_tag ? (
              <span className="rounded-md bg-white/10 px-2 py-1">{ev.source_tag}</span>
            ) : null}
            {ev.tag ? <span className="rounded-md bg-white/10 px-2 py-1">{ev.tag}</span> : null}
            {ev.always_live ? (
              <span className="rounded-md bg-white/10 px-2 py-1">24/7</span>
            ) : null}
            <span className="rounded-md bg-white/10 px-2 py-1">👁 {ev.viewers ?? 0}</span>
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold leading-tight">{ev.name}</h1>
          {ev.description ? (
            <p className="text-sm text-muted-foreground">
              {ev.description.replace("{name}", ev.name)}
            </p>
          ) : null}
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <Field k="Category" v={ev.category_name} />
            <Field k="League" v={ev.tag} />
            {ev.source_tag ? <Field k="Source" v={ev.source_tag} /> : null}
            {!ev.always_live ? (
              <>
                <Field k="Starts" v={fmtTime(ev.starts_at)} />
                <Field k="Ends" v={fmtTime(ev.ends_at)} />
              </>
            ) : null}
            {ev.server_id ? <Field k="Server" v={String(ev.server_id)} /> : null}
            {ev.vip_stream ? <Field k="Access" v="VIP" /> : null}
          </dl>
        </div>
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v?: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2">
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="font-medium">{v || "—"}</div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 py-20 text-center">
      Failed to load: {msg}
    </div>
  );
}
