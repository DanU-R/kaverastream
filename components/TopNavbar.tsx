"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  ["/", "Beranda"],
  ["/esportex", "Live"],
  ["/multiview", "Jadwal"],
  ["/vods", "VOD"],
];

export default function TopNavbar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <header
      className={`sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/90 backdrop-blur ${
        mobile ? "px-4 py-3" : "px-6 py-3"
      } ${mobile ? "" : "h-[64px]"}`}
    >
      {mobile && (
        <Link href="/" className="font-semibold tracking-tight">
          KAVE<span className="text-accent">STREAM</span>
        </Link>
      )}
      <nav className="hidden items-center gap-1 md:flex">
        {NAV.map(([href, label]) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`border-b-2 px-3 py-1 text-sm transition ${
                active ? "border-accent text-text-primary" : "border-transparent text-muted-foreground hover:text-text-primary"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = (e.currentTarget.elements.namedItem("q") as HTMLInputElement)?.value.trim();
            window.location.href = v ? `/?q=${encodeURIComponent(v)}` : "/";
          }}
          role="search"
        >
          <input
            name="q"
            defaultValue={new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("q") ?? ""}
            placeholder="Cari pertandingan, tim, liga..."
            className="hidden w-64 rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-soft focus:border-accent/40 focus:outline-none sm:block"
          />
        </form>
        <button aria-label="Notifikasi" className="text-muted-foreground hover:text-accent">🔔</button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-hover text-xs font-semibold">K</div>
      </div>
    </header>
  );
}
