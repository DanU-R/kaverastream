"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { liveTeams } from "@/lib/home";

const NAV = [
  ["/", "Beranda"],
  ["/esportex", "Live Sekarang"],
  ["/multiview", "Jadwal"],
  ["/vods", "Highlight"],
];

export default function Sidebar() {
  const pathname = usePathname();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    // persisted local favorites; if none yet, we seed later once feed loads
    try {
      const saved = localStorage.getItem("kv_favs");
      setFavorites(saved ? JSON.parse(saved) : []);
    } catch {}
  }, []);

  const toggle = (t: string) => {
    const next = favorites.includes(t) ? favorites.filter((x) => x !== t) : [...favorites, t];
    setFavorites(next);
    try { localStorage.setItem("kv_favs", JSON.stringify(next)); } catch {}
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-border bg-surface lg:flex">
      <Link href="/" className="flex items-center gap-2 px-5 py-5 text-lg font-semibold tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-[#04120a]">⚽</span>
        <span>KAVE<span className="text-accent">STREAM</span></span>
      </Link>

      <nav className="flex flex-col gap-0.5 px-3">
        {NAV.map(([href, label]) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active ? "bg-surface-hover text-accent" : "text-muted-foreground hover:bg-surface-hover hover:text-text-primary"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 flex-1 overflow-y-auto px-3">
        <div className="flex items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-soft">
          <span>Tim Favorit</span>
          <span className="cursor-pointer text-accent hover:underline">Edit</span>
        </div>
        <div className="mt-2 flex flex-col gap-0.5">
          {favorites.length ? (
            favorites.map((t) => (
              <button key={t} onClick={() => toggle(t)}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-surface-hover hover:text-text-primary">
                <span className="truncate">{t}</span>
                <span className="text-accent">★</span>
              </button>
            ))
          ) : (
            <p className="px-3 text-xs text-muted-soft">Belum ada tim favorit.</p>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="bstream-card !bg-surface-elevated border-accent/20 p-4">
          <div className="text-sm font-semibold text-text-primary">👑 KAVERASTREAM PREMIUM</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-soft">Nonton tanpa iklan, kualitas HD/4K, akses semua liga.</p>
          <button className="btn-accent mt-3 w-full px-3 py-2 text-xs">Berlangganan Sekarang</button>
        </div>
      </div>
    </aside>
  );
}
