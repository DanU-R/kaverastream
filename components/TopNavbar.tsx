"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SPORT_TABS: [string, string][] = [
  ["/", "Football"],
  ["/esportex", "All Sports"],
  ["/tv-indonesia", "TV Indonesia"],
  ["/vods", "VOD"],
];

export default function TopNavbar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <header className={`sticky top-0 z-30 w-full border-b border-outline-variant/20 bg-surface/90 backdrop-blur-md ${mobile ? "px-4 py-3" : "h-16 px-4 md:px-8"}`}>
      <div className="flex h-full items-center justify-between gap-3">
        {/* Left: search + sport tabs */}
        <div className="flex flex-1 items-center gap-6 max-w-3xl">
          {mobile && (
            <Link href="/" className="font-bold tracking-tight text-on-surface">
              KAVE<span className="text-primary-container">STREAM</span>
            </Link>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = (e.currentTarget.elements.namedItem("q") as HTMLInputElement)?.value.trim();
              window.location.href = v ? `/?q=${encodeURIComponent(v)}` : "/";
            }}
            className="relative w-full max-w-xs md:w-80"
            role="search"
          >
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline">search</span>
            <input
              name="q"
              defaultValue={typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") ?? "" : ""}
              placeholder="Search matches, leagues, teams..."
              className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-9 py-1.5 text-sm text-on-surface placeholder:text-outline/70 transition-all focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
            />
          </form>
          <nav className="hidden items-center gap-5 xl:flex" aria-label="Sport Categories">
            {SPORT_TABS.map(([href, label]) => {
              const active = label === "Football" ? pathname === "/" : false;
              return (
                <Link key={label} href={href}
                  className={`pb-1 text-sm font-semibold transition-colors ${
                    active ? "border-b-2 border-primary-container text-primary-container" : "text-on-surface-variant hover:text-on-surface"
                  }`}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          <button className="hidden items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface-container/60 px-3 py-1.5 text-sm text-on-surface transition-all hover:bg-surface-container-high sm:inline-flex active:scale-[0.97]">
            <span className="material-symbols-outlined text-sm text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>vpn_key</span>
            <span>VIP Pass</span>
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-4 py-1.5 text-sm font-bold text-on-primary-container shadow-sm transition-all hover:bg-tertiary active:scale-[0.97]">
            <span className="h-2 w-2 animate-ping rounded-full bg-secondary-container"></span>
            <span>Go Live</span>
          </button>
          <button aria-label="Notifications" className="relative rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container/40 hover:text-on-surface">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-surface bg-secondary-container"></span>
          </button>
          <div className="flex cursor-pointer items-center gap-2.5 border-l border-outline-variant/30 pl-2">
            <div className="h-8 w-8 overflow-hidden rounded-full border border-primary-container/40">
              <div className="flex h-full w-full items-center justify-center bg-surface-container-high text-xs font-bold text-primary-container">K</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
