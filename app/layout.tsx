import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KaveraStream — Sports & IPTV",
  description: "Live sports scheduler + IPTV channels. Obsidian Kinetic design.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#051424]/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary font-black glow-emerald">
                K
              </span>
              <span>
                Kavera<span className="text-primary">Stream</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm text-muted-foreground">
              <NavLink href="/">Live</NavLink>
              <NavLink href="/esportex">EsportEx</NavLink>
              <NavLink href="/multiview">MultiView</NavLink>
              <NavLink href="/vods">On-Demand</NavLink>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-white/10 py-4 text-center text-xs text-muted-foreground">
          KaveraStream · Obsidian Kinetic
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 transition hover:bg-white/5 hover:text-zinc-50"
    >
      {children}
    </Link>
  );
}
