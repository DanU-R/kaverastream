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
  description: "Live sports scheduler + IPTV channels.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Kavera<span className="text-emerald-400">Stream</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm text-muted-foreground">
              <NavLink href="/">Live</NavLink>
              <NavLink href="/iptv">IPTV</NavLink>
              <NavLink href="/vods">On-Demand</NavLink>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-white/10 py-4 text-center text-xs text-muted-foreground">
          KaveraStream · sports events + IPTV channels
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-lg px-3 py-1.5 transition hover:bg-white/5 hover:text-zinc-50">
      {children}
    </Link>
  );
}
