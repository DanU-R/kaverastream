"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EsxEvent, fetchEsxEvent, fetchPpvEmbed, resolveSource } from "@/lib/esportex";

export default function EsxPlayerClient({ slug }: { slug: string }) {
  const [ev, setEv] = useState<EsxEvent | null>(null);
  const [src, setSrc] = useState<{ url: string; label: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const e = await fetchEsxEvent(slug);
        if (!live) return;
        if (!e) return setLoading(false), setError("Event tidak ditemukan");
        setEv(e);

        const r = resolveSource(e);
        if (r.type === "ppv-index" && r.ppvId) {
          const embed = await fetchPpvEmbed(r.ppvId);
          if (live) {
            if (embed) {
              setSrc({ url: embed, label: `PPW stream · ${r.label}` });
            } else if (r.iframe) {
              setSrc({ url: r.iframe, label: "EsportEx player" });
            } else {
              setSrc(null);
            }
          }
        } else if (r.iframe) {
          setSrc({ url: r.iframe, label: r.label });
        }
      } catch (err: any) {
        if (live) setError(String(err?.message ?? err));
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [slug]);

  if (loading) return <p className="text-muted-foreground py-20 text-center">Menyiapkan stream…</p>;
  if (error) return <ErrorBox msg={error} />;
  if (!ev) return <ErrorBox msg="Event tidak ditemukan" />;

  return (
    <div className="space-y-5">
      <Link href="/esportex" className="text-sm text-muted-foreground hover:text-zinc-50">
        ← EsportEx
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{ev.tag}</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-md bg-white/10 px-2 py-0.5">{ev.league}</span>
            <span className="rounded-md bg-white/10 px-2 py-0.5">{ev.category}</span>
            {ev.kickoff ? (
              <span className="rounded-md bg-white/10 px-2 py-0.5">
                {ev.kickoff}
              </span>
            ) : null}
          </div>
        </div>
        {src ? (
          <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">
            {src.label}
          </span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video">
        {src ? (
          <iframe
            src={src.url}
            className="h-full w-full"
            allowFullScreen
            referrerPolicy="no-referrer"
            title={ev.tag}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Stream belum tersedia untuk event ini.
          </div>
        )}
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/80">
        {src?.label.startsWith("PPW")
          ? "Diputar via PPW network (embedindia) — browser menangani stream."
          : "Player external — resolusi stream ditangani bawaannya."}
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
