import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PPW_API = "https://api.ppv.st/api";

interface PpvSource { type: string; data: string }
interface PpvStreamResponse {
  success: boolean;
  data?: { name?: string; sources?: PpvSource[] };
}

const m3u8Cache = new Map<string, { content: string; ts: number }>();
const CACHE_TTL = 30_000;

/**
 * GET /api/m3u8/[id]
 *
 * Extracts m3u8 manifest from PPW embed page using Playwright (if available)
 * or falls back to returning the embed URL (for Vercel/serverless without Chromium).
 *
 * On VPS with Playwright + Xvfb: Returns rewritten m3u8 manifest with
 * segment URLs pointing to /api/segment.
 *
 * On Vercel/serverless: Returns { m3u8: null, embed } which triggers
 * iframe fallback in the client.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const cached = m3u8Cache.get(id);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new NextResponse(cached.content, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const ppvRes = await fetch(`${PPW_API}/streams/${id}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!ppvRes.ok) return NextResponse.json({ error: `PPW API ${ppvRes.status}` }, { status: 502 });

    const ppvData = (await ppvRes.json()) as PpvStreamResponse;
    const sources = ppvData?.data?.sources;
    if (!Array.isArray(sources)) return NextResponse.json({ error: "No sources" }, { status: 404 });

    const iframeSource = sources.find((s) => s.type === "iframe" && s.data);
    if (!iframeSource) return NextResponse.json({ error: "No iframe source" }, { status: 404 });

    const embedUrl = iframeSource.data;

    // Try Playwright extraction (works on VPS with Xvfb)
    const m3u8Content = await extractM3u8ViaInterceptor(embedUrl, id);

    if (!m3u8Content) {
      // Fallback: return embed URL for iframe fallback
      return NextResponse.json({ m3u8: null, embed: embedUrl }, {
        status: 200,
        headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
      });
    }

    m3u8Cache.set(id, { content: m3u8Content, ts: Date.now() });

    return new NextResponse(m3u8Content, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Extraction failed: ${message}` }, { status: 502 });
  }
}

async function extractM3u8ViaInterceptor(embedUrl: string, streamId: string): Promise<string | null> {
  if (!process.env.DISPLAY) process.env.DISPLAY = ":99";

  let chromium: any;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch {
    return null; // Playwright not available (Vercel)
  }

  try {
    const browser = await chromium.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-blink-features=AutomationControlled"],
      env: { ...process.env, DISPLAY: ":99" },
    });

    try {
      const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 720 },
      });

      await context.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
      });

      const page = await context.newPage();

      let m3u8Url: string | null = null;
      let m3u8Content: string | null = null;

      page.on("response", async (resp: any) => {
        const url = resp.url();
        if (url.includes(".m3u8") && !url.includes("mono.ts.m3u8") && !m3u8Url) {
          m3u8Url = url;
          try {
            if (resp.ok()) m3u8Content = await resp.text();
          } catch {}
        }
      });

      await page.goto(embedUrl, { waitUntil: "domcontentloaded", timeout: 15000 });

      const deadline = Date.now() + 25000;
      while (Date.now() < deadline) {
        if (m3u8Content) break;
        await page.waitForTimeout(500);
      }

      if (!m3u8Content) {
        await page.close();
        return null;
      }

      const manifest = m3u8Content as string;
      const lines = manifest.split("\n");
      const rewritten = lines.map((line: string) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          if (trimmed.startsWith("#") && trimmed.includes("URI=\"")) {
            return line.replace(/URI="([^"]+)"/g, (_m: string, uri: string) => {
              const abs = new URL(uri, m3u8Url!).href;
              return `URI="/api/segment?id=${streamId}&seg=${encodeURIComponent(abs)}"`;
            });
          }
          return line;
        }
        try {
          const abs = new URL(trimmed, m3u8Url!).href;
          return `/api/segment?id=${streamId}&seg=${encodeURIComponent(abs)}`;
        } catch {
          return line;
        }
      });

      await page.close();
      return rewritten.join("\n");
    } finally {
      await browser.close();
    }
  } catch {
    return null;
  }
}
