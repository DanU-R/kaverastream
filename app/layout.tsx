import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});
const ibm = IBM_Plex_Sans({
  variable: "--font-ibm",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});
const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  weight: ["400"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KaveraStream — Sports & IPTV",
  description: "Live sports scheduler + IPTV channels. Dark esports UI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${space.variable} ${ibm.variable} ${ibmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b hairline bg-background">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-ink">
                K
              </span>
              <span>
                Kavera<span className="text-accent">Stream</span>
              </span>
            </Link>
            <nav className="flex items-center gap-0.5 text-sm text-muted-foreground">
              <NavLink href="/">Live</NavLink>
              <NavLink href="/esportex">EsportEx</NavLink>
              <NavLink href="/multiview">MultiView</NavLink>
              <NavLink href="/vods">On-Demand</NavLink>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t hairline py-5 text-center text-xs text-muted-foreground">
          KaveraStream · dark esports
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 transition hover:bg-surface-2 hover:text-foreground"
    >
      {children}
    </Link>
  );
}
