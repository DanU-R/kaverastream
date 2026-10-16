import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "KaveraStream - Live Sports Hub",
  description: "Live sports streaming platform. Watch live matches, schedules, scores, highlights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full bg-surface-container-lowest text-on-surface">
        {/* desktop shell */}
        <div className="hidden lg:flex">
          <Sidebar />
          <div className="flex min-h-screen flex-1 flex-col lg:ml-60">
            <TopNavbar />
            <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-10 p-4 md:p-8">
              {children}
            </main>
            <FooterShell />
          </div>
        </div>

        {/* tablet/mobile shell */}
        <div className="lg:hidden">
          <TopNavbar mobile />
          <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-8 p-4">{children}</main>
          <MobileBottomNav />
          <FooterShell />
        </div>
      </body>
    </html>
  );
}

function FooterShell() {
  return (
    <footer className="border-t border-outline-variant/30 px-6 py-6">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 text-xs text-outline sm:flex-row">
        <div className="flex gap-4">
          {["About Us", "Terms of Service", "Privacy Policy", "FAQ", "Contact"].map((l) => (
            <a key={l} href="#" className="hover:text-on-surface">{l}</a>
          ))}
        </div>
        <span>© 2026 KaveraStream. All Rights Reserved.</span>
      </div>
    </footer>
  );
}

function MobileBottomNav() {
  const items: [string, string, string][] = [
    ["/", "home", "Home"],
    ["/esportex", "sensors", "Live"],
    ["/tv-indonesia", "live_tv", "TV ID"],
    ["/vods", "tv", "Channels"],
  ];
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full border-t border-outline-variant/30 bg-surface/95 backdrop-blur lg:hidden">
      {items.map(([href, icon, label]) => (
        <Link key={label} href={href} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-outline hover:text-primary-container">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
          <span className="text-[10px]">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
