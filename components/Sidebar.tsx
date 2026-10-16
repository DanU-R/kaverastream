"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: [string, string, string][] = [
  ["/", "home", "Home"],
  ["/esportex", "sensors", "Live"],
  ["/esportex", "calendar_today", "Schedule"],
  ["/vods", "tv", "Channels"],
  ["/vods", "star", "Favorites"],
  ["/esportex", "sports_soccer", "Leagues"],
  ["/settings", "settings", "Settings"],
];

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="fixed top-0 left-0 z-40 hidden h-screen w-60 flex-col border-r border-outline-variant/30 bg-surface-container-low lg:flex">
      <div className="flex h-full flex-col justify-between p-4">
        {/* Brand + Nav */}
        <div className="flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-high text-primary-container shadow-inner">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>sensors</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-on-surface">KaveraStream</h1>
              <p className="text-[11px] font-bold uppercase tracking-wider text-outline">Live Sports Hub</p>
            </div>
          </Link>
          <nav className="flex flex-col gap-1.5" aria-label="Main Navigation">
            {NAV.map(([href, icon, label]) => {
              const active = isActive(href);
              return (
                <Link key={label} href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 active:scale-[0.98] ${
                    active
                      ? "border-l-2 border-primary-container bg-surface-container-highest/40 text-primary-container font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-on-surface"
                  }`}>
                  <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Pro card + footer */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-xl border border-outline-variant/50 bg-gradient-to-br from-surface-container to-surface-container-high p-3.5">
            <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-primary-container/10 blur-xl pointer-events-none"></div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              <span className="text-[11px] font-bold uppercase text-primary-container">Ultra HD Access</span>
            </div>
            <p className="mb-3 text-xs leading-snug text-on-surface-variant">Unlock 4K 60fps streams &amp; 4-view multi-cam feeds.</p>
            <button className="w-full rounded-lg bg-primary-container px-3 py-2 text-center text-sm font-bold text-on-primary-container transition-all duration-150 hover:bg-tertiary active:scale-[0.98]">
              Upgrade to Pro
            </button>
          </div>
          <div className="flex flex-col gap-1 border-t border-outline-variant/30 pt-2">
            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container/50 hover:text-on-surface">
              <span className="material-symbols-outlined text-sm">help</span>
              <span>Help &amp; Support</span>
            </a>
            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-secondary transition-colors hover:bg-secondary-container/20 hover:text-on-surface">
              <span className="material-symbols-outlined text-sm">logout</span>
              <span>Log Out</span>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
