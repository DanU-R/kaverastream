import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "KAVERASTREAM — Nonton Bola Live",
  description: "Platform streaming sepak bola modern. Live, jadwal, skor, highlight.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* desktop shell */}
        <div className="hidden lg:flex">
          <Sidebar />
          <div className="flex min-h-screen flex-1 flex-col pl-[240px]">
            <TopNavbar />
            <main className="mx-auto w-full max-w-[1500px] flex-1 px-6 py-6">
              {children}
            </main>
            <FooterShell />
          </div>
        </div>

        {/* tablet/mobile shell */}
        <div className="lg:hidden">
          <TopNavbar mobile />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4">{children}</main>
          <MobileBottomNav />
          <FooterShell />
        </div>
      </body>
    </html>
  );
}

function FooterShell() {
  return (
    <footer className="border-t border-border px-6 py-6">
      <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-3 text-xs text-muted-soft sm:flex-row">
        <div className="flex gap-4">
          {["Tentang Kami", "Ketentuan Layanan", "Kebijakan Privasi", "FAQ", "Kontak"].map((l) => (
            <a key={l} href="#" className="hover:text-text-primary">{l}</a>
          ))}
        </div>
        <span>© 2026 KaveraStream. All Rights Reserved.</span>
      </div>
    </footer>
  );
}

function MobileBottomNav() {
  const items = [
    ["/", "Home"],
    ["/esportex", "Live"],
    ["/multiview", "Jadwal"],
    ["/vods", "VOD"],
  ];
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full border-t border-border bg-surface/95 backdrop-blur lg:hidden">
      {items.map(([href, label]) => (
        <Link key={href} href={href} className="flex-1 py-3 text-center text-xs text-muted-foreground hover:text-accent">
          {label}
        </Link>
      ))}
    </nav>
  );
}
